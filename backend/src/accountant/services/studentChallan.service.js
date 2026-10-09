import mongoose from "mongoose";
import StudentChallan from "../model/StudentChallan.js";
import StudentProfile from "../../student/models/StudentProfile.js";
import PersonalInfo from "../../student/models/PersonalInfo.js";
import Counter from "../model/Counter.js";
import StudentFeeStructure from "../../accountant/model/StudentFeeStructure.js";
import StudentFeePreference from "../../accountant/model/StudentFeePreference.js";
import { ScholarshipService } from "./scholarship.service.js";
import { calculateLateFine, getLateFineAmount, normalizeLateFineTiers } from "./fineSetting.service.js";
import { AppError } from "../middleware/errorHandler.js";
import { uploadToR2 } from "../../core/utils/cloudflareR2.js";

const safeObjectId = (id) => {
  if (!id || id === "undefined" || id === "null") return null;
  return mongoose.Types.ObjectId.isValid(id)
    ? new mongoose.Types.ObjectId(id)
    : null;
};

const safeString = (str) => {
  if (!str || str === "undefined" || str === "null") return null;
  return String(str).trim();
};

// Clear, per-source label for a previously-issued unpaid challan being
// rolled into a new one — "Installment 1 Fee", "Tuition Fee (Semester 2)",
// "Admission Fee" — instead of a single generic "Previous Dues" bucket.
// Shared between generate()'s actual merge and the previous-dues preview
// endpoint so what the accountant is shown can never drift from what
// actually gets merged.
const buildPreviousDuesSourceLabel = (uc, currentSemesterId) => {
  const sameSem =
    String(uc.semesterId?._id || uc.semesterId || "") ===
    String(currentSemesterId || "");
  const semSuffix =
    !sameSem && uc.semesterId?.number ? ` (Section ${uc.semesterId.number})` : "";
  if (uc.isInstallment)
    return `Monthly Fee Part ${uc.installmentNumber}${semSuffix}`;
  const humanType = (uc.challanType || "Fee")
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
  return `${humanType}${semSuffix}`;
};

const MONTH_NAME_TO_NUMBER = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const MONTH_NAMES_ORDERED = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// July -> August, December -> January. Unrecognized input (free-text
// billingMonth values predate any validation) is returned unchanged rather
// than guessed at.
const nextMonthName = (monthStr) => {
  const num = MONTH_NAME_TO_NUMBER[(monthStr || "").trim().toLowerCase()];
  if (!num) return monthStr;
  return MONTH_NAMES_ORDERED[num % 12];
};

// Same day-of-month one calendar month later, clamped to the shorter
// month's last day instead of overflowing (Jan 31 -> Feb 28, not Mar 3).
const addOneMonthClamped = (date) => {
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  const lastDayOfNewMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDayOfNewMonth));
  return d;
};

// A challan that had been overdue for a while before anyone got around to
// renewing it can have its naively-shifted date (old due date + 1 month)
// still land in the past — reissuing it "overdue on day one" defeats the
// point of renewing. Clamp forward to a week from today in that case.
const RENEWAL_GRACE_DAYS = 7;
const ensureFutureDueDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) return date;
  const grace = new Date(today);
  grace.setDate(grace.getDate() + RENEWAL_GRACE_DAYS);
  return grace;
};

export class StudentChallanService {
  // ✅ Helper to get ONLY University Programs (Excluding HSSC)
  static async getValidUniversityProgramIds() {
    const ProgramModel = mongoose.models.Program || mongoose.model("Program");
    const universityPrograms = await ProgramModel.find({
      level: { $ne: "HSSC" },
    })
      .select("_id")
      .lean();
    return universityPrograms.map((p) => p._id);
  }

  // Scope-aware counterpart — "university" (default, excludes HSSC) is
  // what every existing caller wants; "college" is the inverse (HSSC
  // only), used by shared functions like getStudentFinancialDossier that
  // the College/Intermediate Studies module also needs to call for its
  // own students without being blocked by the university-only filter.
  static async getProgramIdsForScope(scope = "university") {
    if (scope === "all") {
      const ProgramModel =
        mongoose.models.Program || mongoose.model("Program");
      const programs = await ProgramModel.find({ isActive: { $ne: false } })
        .select("_id")
        .lean();
      return programs.map((p) => p._id);
    }
    if (scope === "college") {
      const ProgramModel =
        mongoose.models.Program || mongoose.model("Program");
      const collegePrograms = await ProgramModel.find({ level: "HSSC" })
        .select("_id")
        .lean();
      return collegePrograms.map((p) => p._id);
    }
    return this.getValidUniversityProgramIds();
  }

  static async generateChallanNo() {
    const now = new Date();
    const datePrefix = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
    const counter = await Counter.findByIdAndUpdate(
      { _id: "challan_no" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    return `${datePrefix}${counter.seq.toString().padStart(7, "0")}`;
  }

  // ✅ Month-based Strict Lock (Prevents duplicate challans for the SAME month)
  static async checkStrictLock(
    studentId,
    termId,
    feeTypes,
    allowMultipleTuition = false,
    isGeneratingInstallment = false,
    billingMonth = null, // <-- Added billing month constraint
    semesterId = null,
    // Challans about to be deleted as part of THIS same generate() call
    // (the accountant ticked "Delete Instead" on them) — excluded here so
    // replacing an old same-type challan doesn't falsely trip "a valid
    // challan already exists" against a challan that won't exist by the
    // time this request finishes.
    excludeChallanIds = [],
  ) {
    if (!termId) return;

    for (const type of feeTypes) {
      if (
        type.toLowerCase() === "tuition" &&
        (allowMultipleTuition || isGeneratingInstallment)
      ) {
        continue;
      }

      const query = {
        studentId,
        termId,
        isDeleted: false,
        status: { $ne: "cancelled" },
        challanType: { $regex: type, $options: "i" },
      };
      if (excludeChallanIds.length > 0) {
        query._id = { $nin: excludeChallanIds };
      }

      // Tuition repeats every semester (Part 1, Part 2, ...) within the
      // same Session/Term — without this, a Part 1 Tuition challan would
      // incorrectly block a non-installment Part 2 Tuition challan from
      // ever being generated. Admission/Readmission are genuinely
      // one-time-per-Term, so they intentionally stay termId-only.
      if (type.toLowerCase() === "tuition" && semesterId) {
        query.semesterId = semesterId;
      }

      if (billingMonth) query.billingMonth = billingMonth;

      const existing = await StudentChallan.findOne(query);

      if (
        existing &&
        !["general", "misc", "exam"].includes(type.toLowerCase())
      ) {
        const monthText = billingMonth ? ` for ${billingMonth}` : "";
        throw new Error(
          `A valid ${type.toUpperCase()} challan already exists${monthText} (Ref: ${existing.challanNo}).`,
        );
      }
    }
  }

  static async getStudentFinancialDossier(
    studentId,
    termId = null,
    semesterId = null,
    scope = "university",
  ) {
    const validProgramIds = await this.getProgramIdsForScope(scope);

    const student = await StudentProfile.findOne({
      _id: studentId,
      programId: { $in: validProgramIds }, // ✅ Scoped to university OR college programs
    })
      .populate("departmentId programId semesterId termId personalInfo")
      .lean();

    if (!student)
      throw new AppError(
        scope === "college" ? "College Student not found" : "University Student not found",
        404,
      );

    const FamilyInfoModel =
      mongoose.models.FamilyInfo || mongoose.model("FamilyInfo");
    student.familyInfo = await FamilyInfoModel.findOne({
      studentId: student._id,
    }).lean();

    // A scholarship's own termId is what real challan generation matches
    // against, so the term-match rule applies the same way regardless of
    // which semester's report is being previewed — resolved fresh inside
    // buildReport below (per report scope) since a "selective" semester
    // scope now means the SAME student can have an active scholarship for
    // one semester's report and not another's.
    const studentOwnTermId = student.termId?._id || student.termId;
    const studentOwnSemesterId = student.semesterId?._id || student.semesterId;

    // No semesterId → "Overall" view (every semester, all-time). A
    // semesterId → that one semester only. Either way we also report every
    // OTHER semester the student has real data in, so the frontend can
    // offer a "previous semesters" view without a separate round trip.
    const cleanSemesterId =
      semesterId && mongoose.Types.ObjectId.isValid(semesterId)
        ? semesterId
        : null;

    const SemesterModel =
      mongoose.models.Semester || mongoose.model("Semester");
    const studentProgramId = student.programId?._id || student.programId;
    const currentSemNumber = student.semesterId?.number || 0;

    const [feeSemIds, challanSemIds, programSemesters] = await Promise.all([
      StudentFeeStructure.distinct("semesterId", { studentId }),
      StudentChallan.distinct("semesterId", {
        studentId,
        isDeleted: false,
      }),
      // Every semester of the student's program UP TO their current one —
      // not just the ones that happen to already have a fee/challan
      // record. Without this, a semester with no billing set up yet (or
      // an older record predating the semesterId field on fee/challan
      // documents) would silently disappear from the list entirely
      // instead of showing up as "no data yet".
      studentProgramId
        ? SemesterModel.find({
            programId: studentProgramId,
            ...(currentSemNumber ? { number: { $lte: currentSemNumber } } : {}),
          })
            .select("_id")
            .lean()
        : [],
    ]);
    const allSemesterIds = [
      ...new Set(
        [
          ...feeSemIds,
          ...challanSemIds,
          ...programSemesters.map((s) => s._id),
        ]
          .filter(Boolean)
          .map((id) => id.toString()),
      ),
    ];
    const semesterDocs = await SemesterModel.find({
      _id: { $in: allSemesterIds },
    })
      .select("number name")
      .lean();
    const availableSemesters = semesterDocs
      .map((s) => ({ _id: s._id, number: s.number, name: s.name }))
      .sort((a, b) => (a.number || 0) - (b.number || 0));

    // ── Auto-attribute legacy untagged fee-structure records ──
    // Older StudentFeeStructure rows (predating consistent semesterId
    // tagging) can exist with no semesterId at all. Dropping them from
    // every semester's report is wrong when it's obvious which semester
    // they belong to: if the student's LATER semester already has its own
    // properly-tagged record, an untagged one almost certainly belongs to
    // an EARLIER semester that's still missing one. Resolved separately
    // per fee category (ACADEMIC vs EXAM), oldest untagged record first,
    // matched to the earliest still-missing semester — never guessed when
    // there are more untagged records than missing slots to place them in.
    const CATEGORY_BUCKETS = {
      ACADEMIC: /^(ACADEMIC|ACADEMIC_FEE|INSTALLMENT)$/i,
      EXAM: /^(EXAM|EXAM_FEE)$/i,
    };
    const semesterScopedFees = await StudentFeeStructure.find({
      studentId,
      category: { $regex: /^(ACADEMIC|ACADEMIC_FEE|INSTALLMENT|EXAM|EXAM_FEE)$/i },
    })
      .sort({ createdAt: 1 })
      .select("_id category semesterId")
      .lean();
    const autoAttributedFeeIds = new Map(); // semesterId(string) -> [feeStructureId,...]
    Object.values(CATEGORY_BUCKETS).forEach((regex) => {
      const bucketFees = semesterScopedFees.filter((f) =>
        regex.test(f.category || ""),
      );
      const taggedSemSet = new Set(
        bucketFees
          .filter((f) => f.semesterId)
          .map((f) => f.semesterId.toString()),
      );
      const untagged = bucketFees.filter((f) => !f.semesterId);
      if (!untagged.length) return;
      const missing = availableSemesters.filter(
        (s) => !taggedSemSet.has(s._id.toString()),
      );
      untagged.forEach((fee, idx) => {
        const target = missing[idx];
        if (!target) return; // more untagged records than missing semesters — ambiguous, leave unattributed
        const key = target._id.toString();
        if (!autoAttributedFeeIds.has(key)) autoAttributedFeeIds.set(key, []);
        autoAttributedFeeIds.get(key).push(fee._id);
      });
    });

    // Same auto-attribution, but for StudentChallan — a legacy challan
    // (the actual payment record) can equally predate semesterId tagging.
    // Without this, a semester could show its Fee Setup correctly
    // (via the attribution above) but still read as "unpaid/outstanding"
    // because the challan that actually paid it never joins that
    // semester's ledger. Resolved independently per challan (not reusing
    // the fee-structure mapping) since the two collections were tagged
    // inconsistently at different points in time.
    const CHALLAN_BUCKETS = {
      ACADEMIC: (c) => {
        const t = (c.challanType || "").toUpperCase();
        return (
          t.includes("TUITION") ||
          t.includes("ACADEMIC") ||
          t === "INSTALLMENT" ||
          c.isInstallment
        );
      },
      EXAM: (c) => (c.challanType || "").toUpperCase().includes("EXAM"),
    };
    const semesterScopedChallans = await StudentChallan.find({
      studentId,
      isDeleted: false,
      status: { $nin: ["cancelled", "merged"] },
    })
      .sort({ createdAt: 1 })
      .select("_id challanType isInstallment semesterId")
      .lean();
    const autoAttributedChallanIds = new Map(); // semesterId(string) -> [challanId,...]
    Object.values(CHALLAN_BUCKETS).forEach((test) => {
      const bucketChallans = semesterScopedChallans.filter(test);
      const taggedSemSet = new Set(
        bucketChallans
          .filter((c) => c.semesterId)
          .map((c) => c.semesterId.toString()),
      );
      const untagged = bucketChallans.filter((c) => !c.semesterId);
      if (!untagged.length) return;
      const missing = availableSemesters.filter(
        (s) => !taggedSemSet.has(s._id.toString()),
      );
      untagged.forEach((c, idx) => {
        const target = missing[idx];
        if (!target) return; // more untagged challans than missing semesters — ambiguous, leave unattributed
        const key = target._id.toString();
        if (!autoAttributedChallanIds.has(key)) autoAttributedChallanIds.set(key, []);
        autoAttributedChallanIds.get(key).push(c._id);
      });
    });

    // Builds one COMPLETE, self-contained report scoped to a single
    // semester (or the whole history when scopeSemesterId is null) — Fee
    // Setup, Ledger, Installment Plan, Monthly Collection, Challan Stats,
    // and the financial summary breakdown. Called once per semester below
    // so every semester gets its own full report, not just a summary.
    const buildReport = async (scopeSemesterId) => {
      // ── Fee Setup (configured fee structure) ──
      const feeQuery = { studentId };
      if (termId) feeQuery.termId = termId;
      if (scopeSemesterId) {
        const extraFeeIds =
          autoAttributedFeeIds.get(scopeSemesterId.toString()) || [];
        if (extraFeeIds.length) {
          feeQuery.$or = [
            { semesterId: scopeSemesterId },
            { _id: { $in: extraFeeIds } },
          ];
        } else {
          feeQuery.semesterId = scopeSemesterId;
        }
      }

      const studentFees = await StudentFeeStructure.find(feeQuery).lean();
      const configuredFees = {
        ACADEMIC: 0,
        ADMISSION: 0,
        READMISSION: 0,
        EXAM: 0,
        MISC: 0,
        HOSTEL_ADM: 0,
        HOSTEL_MONTHLY: 0,
      };

      studentFees.forEach((f) => {
        let amt =
          f.feeItems?.reduce((acc, item) => acc + (item.amount || 0), 0) ||
          f.totalAmount ||
          0;
        let typeKey = "MISC";
        const cat = (f.category || "").toUpperCase();
        if (
          cat === "ACADEMIC" ||
          cat === "ACADEMIC_FEE" ||
          cat === "INSTALLMENT"
        )
          typeKey = "ACADEMIC";
        else if (cat === "ADMISSION" || cat === "ADMISSION_FEE")
          typeKey = "ADMISSION";
        else if (cat === "READMISSION" || cat === "READMISSION_FEE")
          typeKey = "READMISSION";
        else if (cat === "EXAM" || cat === "EXAM_FEE") typeKey = "EXAM";
        else if (cat.includes("HOSTEL") && cat.includes("ADMISSION"))
          typeKey = "HOSTEL_ADM";
        else if (cat.includes("HOSTEL")) typeKey = "HOSTEL_MONTHLY";

        configuredFees[typeKey] += amt;
      });

      let configuredTotalFee = Object.values(configuredFees).reduce(
        (a, b) => a + b,
        0,
      );

      // Resolved per report scope — the "Overall" view (scopeSemesterId
      // null) falls back to the student's own current semester, matching
      // the same precedent this dossier already uses elsewhere for that
      // aggregate view. A "selective" scholarship then correctly shows up
      // in the semesters it actually covers and not in the others.
      const activeScholarshipData = studentOwnTermId
        ? await ScholarshipService.getStudentActiveScholarship(
            studentId,
            studentOwnTermId,
            scopeSemesterId || studentOwnSemesterId,
          )
        : null;

      // How much of THIS semester's tuition the student's active
      // scholarship would actually deduct — same calculation real challan
      // generation runs, so a "not yet generated" preview row shows the
      // true amount still owed instead of the full pre-scholarship fee.
      const scholarshipForThisFee = activeScholarshipData
        ? Math.min(
            ScholarshipService.calculateScholarshipAmount(
              configuredFees.ACADEMIC,
              activeScholarshipData.plan,
            ),
            configuredFees.ACADEMIC,
          )
        : 0;

      // ── Ledger (challans) ──
      const challanQuery = {
        studentId,
        isDeleted: false,
        status: { $nin: ["cancelled", "merged"] },
      };
      if (scopeSemesterId) {
        const extraChallanIds =
          autoAttributedChallanIds.get(scopeSemesterId.toString()) || [];
        if (extraChallanIds.length) {
          challanQuery.$or = [
            { semesterId: scopeSemesterId },
            { _id: { $in: extraChallanIds } },
          ];
        } else {
          challanQuery.semesterId = scopeSemesterId;
        }
      }
      const rawChallans = await StudentChallan.find(challanQuery).lean();

      // ── Installment Plan ──
      // Built from the REAL StudentFeePreference (the same source the
      // whole Installment Configuration / Challan Management flow writes
      // to), not the old StudentInstallmentAssignment mechanism which
      // nothing in the current system creates or updates anymore.
      const prefSemesterId =
        scopeSemesterId || student.semesterId?._id || student.semesterId;
      const pref = prefSemesterId
        ? await StudentFeePreference.findOne({
            studentId,
            semesterId: prefSemesterId,
          }).lean()
        : null;

      const configuredInstallmentCount = pref?.defaultInstallments || 1;
      const isInstallmentConfigured = configuredInstallmentCount > 1;

      const installmentChallans = rawChallans.filter((c) => c.isInstallment);

      let fullInstallmentPlan = [];
      if (isInstallmentConfigured) {
        const percentages =
          pref.customPercentages?.length === configuredInstallmentCount
            ? pref.customPercentages
            : Array(configuredInstallmentCount).fill(
                100 / configuredInstallmentCount,
              );
        const months = pref.customMonths || [];
        // "amount" mode's figures are fixed — show the actual configured
        // Rupee amount here instead of re-deriving one from percentage ×
        // the current tuition fee (which is exactly what fixed mode exists
        // to avoid).
        const fixedAmounts =
          pref.installmentMode === "amount" &&
          pref.customAmounts?.length === configuredInstallmentCount
            ? pref.customAmounts
            : null;

        // Looked up by installmentNumber directly (not by generation
        // order), so an out-of-sequence payment — e.g. installment 2 paid
        // before installment 1 is even generated — is still counted
        // correctly against ITS OWN number rather than assumed to follow
        // in order.
        fullInstallmentPlan = Array.from(
          { length: configuredInstallmentCount },
          (_, idx) => {
            const number = idx + 1;
            const pct = percentages[idx] ?? 100 / configuredInstallmentCount;
            const expectedAmount = fixedAmounts
              ? Math.round(fixedAmounts[idx])
              : Math.round((configuredFees.ACADEMIC * pct) / 100);
            const month = months[idx] || null;
            const existing = installmentChallans.find(
              (c) => c.installmentNumber === number,
            );

            if (!existing) {
              // Prorate this installment's own share of the semester's
              // scholarship the same way real generation does — by its
              // share of the tuition total, not a flat per-installment cut.
              const ratio =
                configuredFees.ACADEMIC > 0
                  ? expectedAmount / configuredFees.ACADEMIC
                  : 0;
              const installmentScholarship = Math.round(scholarshipForThisFee * ratio);
              const netAmount = Math.max(0, expectedAmount - installmentScholarship);
              const fullyCovered = installmentScholarship > 0 && netAmount === 0;
              return {
                number,
                percentage: pct,
                month,
                expectedAmount,
                scholarshipAmount: installmentScholarship,
                netAmount,
                challanNo: "—",
                generationStatus: fullyCovered ? "Fully Covered" : "Not Generated",
                paymentStatus: fullyCovered ? "covered" : "pending",
                paidAmount: 0,
                paidDate: null,
              };
            }
            return {
              number,
              percentage: pct,
              month,
              expectedAmount,
              scholarshipAmount: existing.scholarshipAmount || 0,
              netAmount: existing.netAmount || expectedAmount,
              challanNo: existing.challanNo,
              generationStatus: "Generated",
              paymentStatus: existing.status,
              paidAmount: existing.paidAmount || 0,
              paidDate: existing.paidAt || null,
            };
          },
        );
      } else {
        // No installment plan — the lump-sum tuition challan (if any) IS
        // the single "installment"; its month is its own billingMonth,
        // falling back to the due date's month (matching the same rule
        // the challan generator itself uses for non-installment
        // students).
        const lumpSum = rawChallans.find((c) => {
          if (c.isInstallment) return false;
          const t = (c.challanType || "").toUpperCase();
          return (
            t.includes("TUITION") || t === "ACADEMIC_FEE" || t === "ACADEMIC"
          );
        });

        if (lumpSum) {
          const month =
            lumpSum.billingMonth ||
            (lumpSum.dueDate
              ? new Date(lumpSum.dueDate).toLocaleString("en-US", {
                  month: "long",
                })
              : null);
          fullInstallmentPlan = [
            {
              number: 1,
              percentage: 100,
              month,
              expectedAmount: lumpSum.originalTotal || configuredFees.ACADEMIC,
              scholarshipAmount: lumpSum.scholarshipAmount || 0,
              netAmount: lumpSum.netAmount || configuredFees.ACADEMIC,
              challanNo: lumpSum.challanNo,
              generationStatus: "Generated",
              paymentStatus: lumpSum.status,
              paidAmount: lumpSum.paidAmount || 0,
              paidDate: lumpSum.paidAt || null,
            },
          ];
        } else if (configuredFees.ACADEMIC > 0) {
          // Not generated yet — show what a real challan would actually
          // net to, scholarship included, instead of the raw pre-
          // scholarship tuition as if the full amount were still owed.
          const netAmount = Math.max(0, configuredFees.ACADEMIC - scholarshipForThisFee);
          const fullyCovered = scholarshipForThisFee > 0 && netAmount === 0;
          fullInstallmentPlan = [
            {
              number: 1,
              percentage: 100,
              month: null,
              expectedAmount: configuredFees.ACADEMIC,
              scholarshipAmount: scholarshipForThisFee,
              netAmount,
              challanNo: "—",
              generationStatus: fullyCovered ? "Fully Covered" : "Not Generated",
              paymentStatus: fullyCovered ? "covered" : "pending",
              paidAmount: 0,
              paidDate: null,
            },
          ];
        }
      }

      // ── Monthly Fee Collected ── tuition installments (or the single
      // lump-sum "installment") plus Hostel Monthly, shown separately
      // since they're unrelated obligations that happen to both be
      // billed monthly.
      const monthStatus = (p) => {
        if (p.paymentStatus === "paid") return "paid";
        if (p.paymentStatus === "covered") return "covered";
        if (p.generationStatus !== "Generated") return "not_generated";
        if (p.paymentStatus === "overdue") return "overdue";
        return "unpaid";
      };
      const monthlyCollection = {
        tuition: fullInstallmentPlan.map((p) => ({
          installmentNumber: p.number,
          month: p.month || "N/A",
          status: monthStatus(p),
          amount: p.netAmount,
          paidAmount: p.paidAmount,
          challanNo: p.challanNo,
        })),
        hostelMonthly: rawChallans
          .filter((c) => {
            const t = (c.challanType || "").toUpperCase();
            return t.includes("HOSTEL") && !t.includes("ADMISSION");
          })
          .map((c) => ({
            month:
              c.billingMonth ||
              (c.dueDate
                ? new Date(c.dueDate).toLocaleString("en-US", {
                    month: "long",
                  })
                : "N/A"),
            status:
              c.status === "paid"
                ? "paid"
                : c.status === "overdue"
                  ? "overdue"
                  : "unpaid",
            amount: c.netAmount,
            paidAmount: c.paidAmount,
            challanNo: c.challanNo,
          })),
      };

      // ── Challan-level stats (counts, not just amounts) ──
      const challanStats = {
        totalCount: 0,
        totalAmount: 0,
        paidCount: 0,
        paidAmount: 0,
        unpaidCount: 0,
        unpaidAmount: 0,
        overdueCount: 0,
        overdueAmount: 0,
        totalFines: 0,
      };
      rawChallans.forEach((c) => {
        challanStats.totalCount += 1;
        challanStats.totalAmount += c.netAmount || 0;
        challanStats.totalFines += c.fineAmount || 0;
        if (c.status === "paid") {
          challanStats.paidCount += 1;
          challanStats.paidAmount += c.netAmount || 0;
        } else if (c.status === "overdue") {
          challanStats.overdueCount += 1;
          challanStats.overdueAmount += c.remainingAmount || 0;
        } else {
          challanStats.unpaidCount += 1;
          challanStats.unpaidAmount += c.remainingAmount || 0;
        }
      });

      const financialSummary = {
        baseAmount: 0,
        arrears: 0,
        finesBilled: 0,
        finesPaid: 0,
        scholarships: 0,
        discounts: 0,
        netGenerated: 0,
        totalPaid: 0,
        totalPending: 0,
        breakdown: {
          ACADEMIC: {
            configured: configuredFees.ACADEMIC,
            generated: 0,
            paid: 0,
            pending: 0,
          },
          ADMISSION: {
            configured: configuredFees.ADMISSION,
            generated: 0,
            paid: 0,
            pending: 0,
          },
          READMISSION: {
            configured: configuredFees.READMISSION,
            generated: 0,
            paid: 0,
            pending: 0,
          },
          EXAM: {
            configured: configuredFees.EXAM,
            generated: 0,
            paid: 0,
            pending: 0,
          },
          HOSTEL_ADM: {
            configured: configuredFees.HOSTEL_ADM,
            generated: 0,
            paid: 0,
            pending: 0,
          },
          HOSTEL_MONTHLY: {
            configured: configuredFees.HOSTEL_MONTHLY,
            generated: 0,
            paid: 0,
            pending: 0,
          },
          MISC: {
            configured: configuredFees.MISC,
            generated: 0,
            paid: 0,
            pending: 0,
          },
        },
      };

      rawChallans.forEach((c) => {
        financialSummary.baseAmount += c.originalTotal || 0;
        financialSummary.arrears += c.arrears || 0;
        financialSummary.finesBilled += c.fineAmount || 0;
        financialSummary.scholarships += c.scholarshipAmount || 0;
        financialSummary.discounts += c.discountAmount || 0;
        financialSummary.netGenerated += c.netAmount || 0;
        financialSummary.totalPaid += c.paidAmount || 0;
        financialSummary.totalPending += c.remainingAmount || 0;
        if (c.status === "paid")
          financialSummary.finesPaid += c.fineAmount || 0;

        // challanType is a free-form joined string (e.g. "TUITION",
        // "TUITION_EXAM", "INSTALLMENT") built from feeTypes.join("_") at
        // generation time, NOT a fixed enum — so this must match by
        // substring (like the lump-sum/type-conflict checks elsewhere in
        // this file), not exact equality, or a plain "TUITION" challan
        // silently falls through to MISC and its paid amount never counts
        // toward tuition-paid/outstanding.
        let typeKey = "MISC";
        const cType = (c.challanType || "").toUpperCase();
        if (
          cType.includes("TUITION") ||
          cType.includes("ACADEMIC") ||
          cType === "INSTALLMENT" ||
          c.isInstallment
        )
          typeKey = "ACADEMIC";
        else if (cType.includes("ADMISSION") && !cType.includes("READMISSION"))
          typeKey = "ADMISSION";
        else if (cType.includes("READMISSION")) typeKey = "READMISSION";
        else if (cType.includes("EXAM")) typeKey = "EXAM";
        else if (cType.includes("HOSTEL") && cType.includes("ADMISSION"))
          typeKey = "HOSTEL_ADM";
        else if (cType.includes("HOSTEL")) typeKey = "HOSTEL_MONTHLY";

        financialSummary.breakdown[typeKey].generated += c.netAmount || 0;
        financialSummary.breakdown[typeKey].paid += c.paidAmount || 0;
        financialSummary.breakdown[typeKey].pending += c.remainingAmount || 0;
      });

      // A semester's tuition can be genuinely billed (and paid) via real
      // challans even when no StudentFeeStructure record backs it — no
      // tagged record, AND nothing to auto-attribute either (older or
      // manually-processed cases predating consistent Fee Setup entries).
      // Without this, "Total Fee Setup" would read Rs 0 for a semester the
      // student has clearly already been billed and paid for. Fall back to
      // what was actually billed for tuition that semester instead.
      if (
        configuredFees.ACADEMIC === 0 &&
        financialSummary.breakdown.ACADEMIC.generated > 0
      ) {
        configuredFees.ACADEMIC = financialSummary.breakdown.ACADEMIC.generated;
        financialSummary.breakdown.ACADEMIC.configured = configuredFees.ACADEMIC;
        configuredTotalFee += configuredFees.ACADEMIC;
      }

      // Tuition Outstanding — specifically Tuition Fee Setup minus the
      // active scholarship's deduction minus what's actually been paid
      // toward tuition, NOT the generic "remaining balance" figure (which
      // also mixes in fines/other categories) and NOT the raw pre-
      // scholarship fee (a fully-covered student owes nothing, even before
      // any challan for the semester has actually been generated yet).
      const tuitionPaid = financialSummary.breakdown.ACADEMIC.paid;
      const tuitionOutstanding = Math.max(
        0,
        configuredFees.ACADEMIC - scholarshipForThisFee - tuitionPaid,
      );

      // The scholarship that actually applies to THIS report's tuition —
      // separate from financialSummary.scholarships (which only sums
      // amounts already baked into past challans) so a KPI card can show
      // the plan name and its deduction even before any challan for this
      // semester has been generated, or when the scholarship fully covers
      // the fee and no challan is ever needed.
      // Shown whenever the student HAS an active scholarship, regardless
      // of amount — a student assigned a scholarship with no tuition fee
      // set up yet (or one that happens to compute to a 0 deduction) must
      // still show the plan name, just with a 0 amount, instead of being
      // hidden until there's something to deduct.
      const effectiveScholarship = activeScholarshipData
        ? {
            name: activeScholarshipData.plan?.title || "N/A",
            amount: scholarshipForThisFee,
          }
        : null;

      return {
        configuredTotalFee,
        configuredFees,
        financialSummary,
        challanStats,
        monthlyCollection,
        isInstallmentConfigured,
        configuredInstallmentCount,
        installmentPreference: pref || null,
        fullInstallmentPlan,
        ledger: rawChallans,
        tuitionPaid,
        tuitionOutstanding,
        effectiveScholarship,
      };
    };

    // One full report for the ENTIRE history (all semesters combined) —
    // used for the grand-total view — plus one FULL, independent report
    // PER semester, so each semester's Fee Setup / Ledger / Installment
    // Plan / Monthly Collection is properly separated rather than blended
    // together or reduced to a lightweight summary.
    const overallReport = await buildReport(null);
    const semesterReports = await Promise.all(
      availableSemesters.map(async (s) => ({
        semesterId: s._id,
        number: s.number,
        name: s.name,
        ...(await buildReport(s._id)),
      })),
    );

    // Carry each semester's own unpaid balance forward into the next one
    // (availableSemesters — and therefore semesterReports — is already
    // sorted ascending by number). previousDue is whatever was still
    // outstanding across every EARLIER semester combined; totalOutstanding
    // is this semester's own outstanding PLUS that carried-forward due, so
    // an unpaid balance keeps compounding forward semester to semester
    // until it's actually paid off.
    let runningCarry = 0;
    semesterReports.forEach((r) => {
      r.previousDue = runningCarry;
      r.totalOutstanding = (r.financialSummary?.totalPending || 0) + runningCarry;
      runningCarry = r.totalOutstanding;
    });

    const activeReport = cleanSemesterId
      ? semesterReports.find(
          (r) => String(r.semesterId) === String(cleanSemesterId),
        ) || overallReport
      : overallReport;

    // Live scholarship preview for the student's CURRENT semester — separate
    // from `financialSummary.scholarships` above (which only sums amounts
    // already baked into past challans) so the dossier also shows the plan
    // itself (title/percentage) and what it would deduct even before a
    // challan for the current semester has been generated yet.
    const activeScholarship = await ScholarshipService.getScholarshipPreview(
      studentId,
    );

    return {
      student,
      availableSemesters,
      viewingSemesterId: cleanSemesterId,
      overallReport,
      semesterReports,
      activeScholarship,
      // Flattened fields below mirror whichever report is "active" (the
      // requested semester, or overall) — kept for any caller that just
      // wants "the current view" without dealing with the two arrays.
      ...activeReport,
    };
  }

  static async generate(data) {
    const {
      studentIds,
      studentId,
      termId,
      dueDate,
      billingMonth: rawBillingMonth, // explicit selection — only required/meaningful for installment plans
      departmentId,
      programId,
      semesterId,
      feeTypes = ["tuition"],
      miscFeeIds = [],
      examTitles = [],
      allowMultipleTuition = false,
      targetInstallmentNumber = null,
      mergeBase = false,
      carryFine = false,
      // Per-item override (single-generate UI) — [{ challanId, includeBase,
      // includeFine }]. When provided, this replaces the blanket
      // mergeBase/carryFine sweep for THIS student with an explicit,
      // per-challan choice instead of one all-or-nothing pair. Bulk
      // generation and autoGenerateForMonth never send this — they keep
      // using the blanket mergeBase/carryFine path below unchanged.
      previousDuesSelections = [],
      // Previous challans the accountant is deleting outright (ticked
      // "Delete Instead") rather than merging — excluded from
      // checkStrictLock's duplicate-type check below so replacing an old
      // same-type challan isn't blocked by the very challan being removed.
      // Actual deletion happens in the controller, only after this whole
      // generate() call succeeds.
      deleteChallanIds = [],
      scope = "university",
      // When and Due Date are now two independent choices — Generation
      // Date controls the `issuedAt` timestamp stamped on the new
      // challan(s) (defaults to right now, same as before), separate
      // from `dueDate` which controls when payment is actually due.
      generationDate = null,
    } = data;

    const issuedAtDate = generationDate ? new Date(generationDate) : new Date();

    const isOnlyMisc =
      feeTypes.length === 1 &&
      (feeTypes.includes("general") || feeTypes.includes("misc"));

    const hasExplicitStudents = Boolean(studentId || studentIds?.length);
    if (!termId && !isOnlyMisc && !hasExplicitStudents) {
      throw new AppError(
        "Term/Session is required for academic challans.",
        400,
      );
    }
    if (!dueDate) throw new AppError("Due Date is required.", 400);

    // Billing Month only means something for installment challans (each
    // installment lands on a specific configured month) — the frontend
    // already enforces an explicit choice for students on a plan. For
    // everyone else, default it to the due date's own month instead of
    // forcing a redundant separate selection.
    const billingMonth =
      rawBillingMonth ||
      new Date(dueDate).toLocaleString("en-US", { month: "long" });

    // This same endpoint (`/generate` and `/bulk-generate`) powers BOTH the
    // University Accountant module and the College/Intermediate Studies
    // module. Defaulting to university-only here meant every single/bulk
    // challan generation for an HSSC/College student was silently excluded
    // — `students` would come back empty and the caller only ever saw "No
    // valid university students found for this selection".
    const validProgramIds = await this.getProgramIdsForScope(scope);

    const populateOptions = [
      { path: "programId", select: "name _id" },
      { path: "semesterId", select: "name number _id" },
      { path: "departmentId", select: "name _id" },
      { path: "termId", select: "name code _id" },
      { path: "personalInfo", select: "fullName cnic phone email" },
    ];

    let students = [];
    if (studentIds?.length > 0) {
      students = await StudentProfile.find({
        _id: { $in: studentIds },
        programId: { $in: validProgramIds },
      }).populate(populateOptions);
    } else if (studentId) {
      students = await StudentProfile.find({
        _id: studentId,
        programId: { $in: validProgramIds },
      }).populate(populateOptions);
    } else {
      // StudentProfile has no `isActive` field — it uses a `status` enum
      // instead, so this used to silently match zero students whenever
      // generate() was called by filter (no explicit studentIds/studentId).
      const query = {
        status: "active",
        departmentId,
        programId: { $in: validProgramIds },
      };
      if (programId) query.programId = programId;
      if (semesterId) query.semesterId = semesterId;
      students = await StudentProfile.find(query).populate(populateOptions);
    }

    if (!students.length) {
      return {
        successCount: 0,
        failedCount: 0,
        errors: [
          scope === "college"
            ? "No matching College students found for this selection"
            : "No valid university students found for this selection",
        ],
      };
    }

    const studentMongoIds = students.map((s) => s._id);
    const preferences = await StudentFeePreference.find({
      studentId: { $in: studentMongoIds },
    });
    // A student can have one preference PER SEMESTER — key by both so each
    // student's installment plan is looked up for their own current
    // semester, not whichever preference record happened to come back last.
    const prefMap = new Map(
      preferences
        .filter((p) => p.semesterId)
        .map((p) => [`${p.studentId.toString()}_${p.semesterId.toString()}`, p]),
    );
    // Legacy installment/whole-fee-month preferences saved before
    // semesterId tagging existed. Grouped separately so the per-student
    // loop below can fall back to one when the student's CURRENT semester
    // has no tagged preference of its own — but only when there's exactly
    // ONE such untagged record for that student, so this never guesses
    // between several old semesters' worth of setup.
    const untaggedPrefsByStudent = new Map();
    preferences
      .filter((p) => !p.semesterId)
      .forEach((p) => {
        const key = p.studentId.toString();
        if (!untaggedPrefsByStudent.has(key)) untaggedPrefsByStudent.set(key, []);
        untaggedPrefsByStudent.get(key).push(p);
      });

    let successCount = 0,
      failedCount = 0,
      createdChallans = [],
      errors = [];

    const typeToCategoryMap = {
      tuition: "ACADEMIC",
      admission: "ADMISSION",
      readmission: "READMISSION",
      exam: "EXAM",
      // "general"/"misc" intentionally NOT mapped to a StudentFeeStructure
      // category anymore — that legacy per-student "MISC" assignment path
      // has no UI to manage it (Fee Setup dropped its MISC tab), so any
      // record still sitting in the DB from before was being silently
      // pulled onto a challan just because "general" was in feeTypes,
      // regardless of which Global Misc Fee(s) (miscFeeIds, handled
      // separately below) the admin actually picked. Global Misc Fees are
      // now the one supported mechanism for misc charges.
    };

    // ✅ PROPER BULK LOOP
    for (const student of students) {
      try {
        const sProgId = student.programId?._id || student.programId;
        const sSemId = student.semesterId?._id || student.semesterId;
        const sDeptId = student.departmentId?._id || student.departmentId;
        const sTermId = student.termId?._id || student.termId || termId;

        if (!sTermId && !isOnlyMisc) {
          throw new Error(
            "No session is assigned in this student's academic profile.",
          );
        }

        let grandTotal = 0,
          feeDetails = {},
          tuitionPortion = 0,
          feeSetupRemarks = [];

        // Fetch Fee Structures
        for (const type of feeTypes) {
          const category = typeToCategoryMap[type];
          if (!category) continue;

          let feeStructures = [];
          if (category === "EXAM") {
            // EXAM is semester-scoped (see StudentFeeService.isSemesterScoped)
            // — match the student's current semester so a stale prior-
            // semester record can't be picked up after a promotion.
            const q = {
              studentId: student._id,
              category: "EXAM",
              isActive: true,
            };
            if (sSemId) q.semesterId = sSemId;
            else q.termId = sTermId;
            if (examTitles && examTitles.length > 0) {
              q.$or = [
                { title: { $in: examTitles } },
                { name: { $in: examTitles } },
              ];
            }
            let fsArray = await StudentFeeStructure.find(q);
            // Legacy fallback: this student's exam fee was set up before
            // semesterId tagging existed, so the semester-scoped query
            // above finds nothing even though a real (untagged) record
            // exists — use it instead of blocking generation outright.
            if (fsArray.length === 0 && sSemId) {
              const legacyQ = {
                studentId: student._id,
                category: "EXAM",
                isActive: true,
                semesterId: { $in: [null, undefined] },
              };
              if (examTitles && examTitles.length > 0) {
                legacyQ.$or = [
                  { title: { $in: examTitles } },
                  { name: { $in: examTitles } },
                ];
              }
              fsArray = await StudentFeeStructure.find(legacyQ);
            }
            if (fsArray.length > 0) feeStructures.push(...fsArray);
            else throw new Error(`No matching EXAM fee structures found.`);
          } else {
            // ACADEMIC is also semester-scoped; ADMISSION/READMISSION stay
            // termId-scoped since they're one-time-per-enrollment, not
            // per-semester.
            const q = {
              studentId: student._id,
              category,
              isActive: true,
            };
            if (category === "ACADEMIC" && sSemId) q.semesterId = sSemId;
            else q.termId = sTermId;
            let fs = await StudentFeeStructure.findOne(q);
            // Legacy fallback: no semester-tagged ACADEMIC (tuition) fee
            // setup for this student's current semester — if they have
            // exactly ONE untagged fee-setup record (predating semesterId
            // tagging) and no other semester has already claimed it, use
            // it instead of failing generation. More than one untagged
            // record is ambiguous (which old semester does it belong to?),
            // so that case is intentionally left failing as before.
            if (!fs && category === "ACADEMIC" && sSemId) {
              const legacyCandidates = await StudentFeeStructure.find({
                studentId: student._id,
                category: "ACADEMIC",
                isActive: true,
                semesterId: { $in: [null, undefined] },
              });
              if (legacyCandidates.length === 1) fs = legacyCandidates[0];
            }
            if (fs) feeStructures.push(fs);
            else throw new Error(`No ${category} fee structure assigned.`);
          }

          for (const feeStructure of feeStructures) {
            if (feeStructure.remarks) feeSetupRemarks.push(feeStructure.remarks);
            if (feeStructure.feeItems?.length > 0) {
              feeStructure.feeItems.forEach((item) => {
                const label = item.headName || "Fee";
                feeDetails[label] = (feeDetails[label] || 0) + item.amount;
                grandTotal += item.amount;
                if (category === "ACADEMIC") tuitionPortion += item.amount;
              });
            } else if (feeStructure.totalAmount > 0) {
              const label =
                category === "EXAM"
                  ? feeStructure.title || "Exam Fee"
                  : `${category} Fee`;
              feeDetails[label] =
                (feeDetails[label] || 0) + feeStructure.totalAmount;
              grandTotal += feeStructure.totalAmount;
              if (category === "ACADEMIC")
                tuitionPortion += feeStructure.totalAmount;
            }
          }
        }

        const miscFeeNames = [];
        if (miscFeeIds && miscFeeIds.length > 0) {
          const MiscModel =
            mongoose.models.MiscellaneousFee ||
            mongoose.model("MiscellaneousFee");
          if (MiscModel) {
            const globalMiscFees = await MiscModel.find({
              _id: { $in: miscFeeIds },
            });
            globalMiscFees.forEach((f) => {
              const label = f.title || f.name || "Misc Fee";
              feeDetails[label] = (feeDetails[label] || 0) + f.amount;
              grandTotal += f.amount;
              miscFeeNames.push(label);
            });
          }
        }

        // A challan made up ENTIRELY of Global Misc Fee(s) (no tuition/
        // exam/admission/readmission alongside them) gets its actual
        // fee name(s) as the challan type — instead of the generic
        // "GENERAL" category label, which told the admin nothing about
        // which fee they were looking at on the printed challan.
        const nonMiscFeeTypes = feeTypes.filter(
          (t) => t !== "general" && t !== "misc",
        );
        const isMiscOnlyChallan =
          nonMiscFeeTypes.length === 0 && miscFeeNames.length > 0;
        const resolvedChallanType = isMiscOnlyChallan
          ? miscFeeNames.join(" & ").toUpperCase()
          : feeTypes.join("_").toUpperCase() || "FEE";

        if (grandTotal === 0) throw new Error("Calculated amount is 0.");

        // Dedupe in case more than one fee-type pulled in an identical note.
        const combinedFeeSetupRemark = [...new Set(feeSetupRemarks)].join(" | ");

        let scholarshipAmount = 0,
          scholarshipId = null;

        if (feeTypes.includes("tuition") && tuitionPortion > 0) {
          const scholarshipData =
            await ScholarshipService.getStudentActiveScholarship(
              student._id,
              sTermId,
              sSemId,
            );
          if (scholarshipData) {
            scholarshipId = scholarshipData.applicationId;
            scholarshipAmount =
              scholarshipData.plan.type === "fixed"
                ? scholarshipData.plan.maxAmount
                : Math.round(
                    (tuitionPortion *
                      Math.min(scholarshipData.plan.maxPercentage || 0, 100)) /
                      100,
                  );
            scholarshipAmount = Math.min(scholarshipAmount, tuitionPortion);
          }
        }

        const totalNetCalc = Math.max(0, grandTotal - scholarshipAmount);
        let pref = prefMap.get(`${student._id.toString()}_${sSemId?.toString()}`);
        // Legacy fallback: no installment/billing-month preference tagged
        // to this student's current semester — if they have exactly ONE
        // untagged preference (set up before semesterId tagging existed),
        // use it instead of silently treating them as having no plan at
        // all (which would generate a plain lump-sum challan and skip the
        // configured Billing Month enforcement below).
        if (!pref && sSemId) {
          const legacyPrefs = untaggedPrefsByStudent.get(student._id.toString()) || [];
          if (legacyPrefs.length === 1) pref = legacyPrefs[0];
        }
        const shouldSplit =
          pref &&
          pref.defaultInstallments > 1 &&
          pref.autoSplit &&
          feeTypes.includes("tuition") &&
          totalNetCalc > 0;

        let finalBillingMonth = billingMonth;
        let count = 1;
        let instToGenerate = targetInstallmentNumber
          ? parseInt(targetInstallmentNumber, 10)
          : null;
        let percentages = [];
        let configuredMonths = [];
        let existingInstallments = [];
        // "amount" mode locks each installment to the fixed Rupee figure the
        // accountant configured (StudentFeePreference.customAmounts) instead
        // of a live percentage-of-current-fee split — see that model's
        // comment for why (round/negotiated figures, not clean percentages).
        const useFixedAmounts =
          shouldSplit &&
          pref?.installmentMode === "amount" &&
          Array.isArray(pref.customAmounts) &&
          pref.customAmounts.length === pref.defaultInstallments;
        const fixedAmounts = useFixedAmounts ? pref.customAmounts.map(Number) : [];
        const isMonthlyBasis = pref?.feeBasis === "monthly";
        const monthParts = isMonthlyBasis ? Math.max(1, pref.installmentsPerMonth || 1) : 1;

        // =======================================================================
        // ✅ SMART INSTALLMENT & MONTH VALIDATION
        // =======================================================================
        if (shouldSplit) {
          count = pref.defaultInstallments;
          percentages = pref.customPercentages || [];
          configuredMonths = pref.customMonths || []; // Get the custom months assigned during config

          // A monthly plan's percentages are shares of ONE month's fee (each
          // month adds up to 100), so the whole list adds up to 100 x months.
          const expectedPctTotal = isMonthlyBasis ? 100 * (count / monthParts) : 100;
          if (
            percentages.length !== count ||
            Math.abs(percentages.reduce((a, b) => a + b, 0) - expectedPctTotal) > 0.02
          ) {
            const base = Math.floor(100 / count);
            percentages = Array(count).fill(base);
            percentages[count - 1] += 100 - base * count;
          }

          // Scoped by the student's own current semester, not just termId —
          // a Session/Term commonly spans multiple semesters (e.g. Part 1
          // and Part 2 of the same academic session), so termId-only was
          // counting a PREVIOUS semester's already-completed installments
          // against the current semester's fresh set, incorrectly reporting
          // "all N installments already generated" for a semester that
          // hadn't generated any yet.
          existingInstallments = await StudentChallan.find({
            studentId: student._id,
            termId: sTermId,
            ...(sSemId ? { semesterId: sSemId } : {}),
            isInstallment: true,
            isDeleted: false,
            status: { $ne: "cancelled" },
          }).sort({ installmentNumber: -1 });

          // An overdue installment must be renewed (not silently skipped
          // past) before the plan advances to its next month — otherwise
          // bulk/auto generation would keep billing September while July
          // sits unpaid and unrenewed.
          if (existingInstallments.length > 0 && existingInstallments[0].status === "overdue") {
            throw new Error(
              `Monthly fee part #${existingInstallments[0].installmentNumber} is overdue — renew it before generating the next monthly part.`,
            );
          }

          const maxGenerated =
            existingInstallments.length > 0
              ? existingInstallments[0].installmentNumber
              : 0;

          if (!instToGenerate) {
            instToGenerate = maxGenerated + 1;
          }

          if (instToGenerate > count) {
            throw new Error(
              `All ${count} monthly fee parts have already been generated for this session.`,
            );
          }

          // An explicitly-picked installment number (targetInstallmentNumber)
          // bypasses the auto-increment default below, so it needs its own
          // duplicate guard — auto-derived numbers can never collide (always
          // maxGenerated + 1), but a manually chosen one could point at an
          // installment that already has a live challan.
          const alreadyGenerated = existingInstallments.some(
            (ex) => ex.installmentNumber === instToGenerate,
          );
          if (alreadyGenerated) {
            throw new Error(
              `Monthly fee part #${instToGenerate} has already been generated for this session.`,
            );
          }

          const targetConfiguredMonth = configuredMonths[instToGenerate - 1];

          // 🚨 THE VALIDATOR: If the frontend requests bulk generation for "February", but the student's
          // next installment is actually configured for "January", we throw an error and skip them!
          if (
            billingMonth &&
            targetConfiguredMonth &&
            billingMonth.toLowerCase() !== targetConfiguredMonth.toLowerCase()
          ) {
            throw new Error(
              `Monthly fee part #${instToGenerate} is scheduled for ${targetConfiguredMonth}, not ${billingMonth}. Skipped.`,
            );
          }

          // Use the specifically configured month for this exact installment
          finalBillingMonth = targetConfiguredMonth || billingMonth;
        } else if (feeTypes.includes("tuition") && pref?.customMonths?.[0]) {
          // Non-installment (whole-fee) student who still has a saved
          // Billing Month (set up the same way as an installment plan's,
          // just with a single entry) — enforced exactly like an
          // installment's own configured month, so a challan can't be
          // generated for a different month than what was actually
          // configured for this student.
          const configuredMonth = pref.customMonths[0];
          if (
            billingMonth &&
            billingMonth.toLowerCase() !== configuredMonth.toLowerCase()
          ) {
            throw new Error(
              `This student's Tuition is scheduled for ${configuredMonth}, not ${billingMonth}. Skipped.`,
            );
          }
          finalBillingMonth = configuredMonth;
        }

        // ✅ Check if a challan for this EXACT month already exists
        await this.checkStrictLock(
          student._id,
          sTermId,
          feeTypes,
          allowMultipleTuition,
          shouldSplit,
          finalBillingMonth,
          sSemId,
          deleteChallanIds,
        );

        let mergedBaseAmount = 0,
          carriedFines = 0,
          mergedChallanIds = [];
        // Per-source display breakdown — "Installment 1 Fee (Previous)",
        // "Tuition Fee (Semester 1) (Previous)", "Fine on Admission Fee
        // (Previous)" — instead of one generic lump bucket. Purely
        // additive to feeDetails; mergedBaseAmount/carriedFines (which
        // drive originalTotal/netAmount) are computed exactly as before.
        const mergedItems = {};
        const mergedFineItems = {};

        // Applies one previous-dues challan's base and/or fine onto THIS
        // new challan's mergedItems/mergedFineItems/mergedBaseAmount/
        // carriedFines — shared by both the blanket sweep (bulk/auto-
        // generate: same includeBase/includeFine for every match) and the
        // per-item path (single-generate: each challan gets its own
        // independent choice). Returns whether uc needs saving.
        const applyMergeItem = (uc, includeBase, includeFine) => {
          if (!includeBase && !includeFine) return false;

          const existingFine = uc.fineAmount || 0;
          let unpaidBase = uc.remainingAmount - existingFine;
          if (unpaidBase < 0) unpaidBase = 0;
          const sourceLabel = buildPreviousDuesSourceLabel(uc, sSemId);

          if (includeBase && unpaidBase > 0) {
            mergedBaseAmount += unpaidBase;
            mergedChallanIds.push(uc._id);
            const key = `${sourceLabel} (Previous)`;
            mergedItems[key] = (mergedItems[key] || 0) + unpaidBase;
          }
          if (includeFine && existingFine > 0) {
            carriedFines += existingFine;
            const fineKey = `Fine on ${sourceLabel} (Previous)`;
            mergedFineItems[fineKey] =
              (mergedFineItems[fineKey] || 0) + existingFine;
          }

          // Whichever piece was included is removed from the OLD challan;
          // whatever wasn't stays genuinely owed on it — e.g. moving just
          // the base forward and leaving the fine behind must NOT mark the
          // old challan "merged" (that would make its still-owed fine
          // invisible to every future previous-dues scan/report).
          if (includeFine) uc.fineAmount = 0;
          const baseStillOwed = !includeBase && unpaidBase > 0;
          const fineStillOwed = !includeFine && existingFine > 0;
          if (!baseStillOwed && !fineStillOwed) {
            uc.status = "merged";
            uc.remainingAmount = 0;
          } else {
            uc.remainingAmount =
              (baseStillOwed ? unpaidBase : 0) + (fineStillOwed ? existingFine : 0);
          }
          uc.remarks = uc.remarks
            ? `${uc.remarks} | Rolled into a new challan on ${new Date().toLocaleDateString()} (${includeBase ? "base" : ""}${includeBase && includeFine ? " + " : ""}${includeFine ? "fine" : ""})`
            : `Rolled into a new challan on ${new Date().toLocaleDateString()} (${includeBase ? "base" : ""}${includeBase && includeFine ? " + " : ""}${includeFine ? "fine" : ""})`;

          return true;
        };

        if (previousDuesSelections?.length > 0) {
          // Per-item mode — only the explicitly listed challans, each with
          // its own independent includeBase/includeFine choice (e.g. "fine
          // only" on one, "both" on another).
          const selMap = new Map(
            previousDuesSelections.map((s) => [String(s.challanId), s]),
          );
          const unpaidChallans = await StudentChallan.find({
            _id: { $in: previousDuesSelections.map((s) => s.challanId) },
            studentId: student._id,
            status: { $in: ["issued", "overdue", "partial"] },
            isDeleted: false,
          }).populate("semesterId", "name number");

          for (const uc of unpaidChallans) {
            const sel = selMap.get(String(uc._id));
            if (!sel) continue;
            if (applyMergeItem(uc, !!sel.includeBase, !!sel.includeFine)) {
              await uc.save();
            }
          }
        } else if (mergeBase || carryFine) {
          // Blanket sweep — bulk generation and autoGenerateForMonth's
          // includeArrears path. Any of the student's own unpaid challans —
          // same semester (e.g. an earlier unpaid installment in this exact
          // semester) or a genuinely previous one — are eligible to roll
          // forward. Not scoped by semester/term at all: the caller opts
          // into this explicitly and (for the manual UIs) is shown exactly
          // what would be included before generating.
          const unpaidChallans = await StudentChallan.find({
            studentId: student._id,
            status: { $in: ["issued", "overdue", "partial"] },
            isDeleted: false,
          }).populate("semesterId", "name number");

          for (const uc of unpaidChallans) {
            if (applyMergeItem(uc, mergeBase, carryFine)) await uc.save();
          }
        }

        if (shouldSplit) {
          const groupRefId = `GRP-${student._id.toString().slice(-4)}-${sTermId.toString().slice(-4)}`;
          let runningOriginal = 0,
            runningScholarship = 0,
            monthRunningOriginal = 0,
            monthRunningScholarship = 0;

          for (let i = 0; i < count; i++) {
            const currentInstNum = i + 1;

            let thisOriginal, thisScholarship, pct;
            if (useFixedAmounts) {
              // Fixed figure, as configured — never recalculated against
              // the current fee total, and never auto-adjusted on the last
              // installment (that would silently turn "fixed" back into a
              // percentage split the moment the total ever drifted).
              thisOriginal = Math.round(fixedAmounts[i]);
              const ratio = grandTotal > 0 ? thisOriginal / grandTotal : 0;
              thisScholarship = Math.round(scholarshipAmount * ratio);
              pct = grandTotal > 0 ? Math.round((thisOriginal / grandTotal) * 1000) / 10 : 0;
            } else {
              pct = percentages[i];
              thisOriginal = Math.round((grandTotal * pct) / 100);
              thisScholarship = Math.round((scholarshipAmount * pct) / 100);

              if (isMonthlyBasis) {
                // Each month is billed on its own: the last part of a month
                // takes whatever is left of that month's fee so the parts
                // always add up exactly to the monthly fee.
                if (i % monthParts === monthParts - 1) {
                  thisOriginal = grandTotal - monthRunningOriginal;
                  thisScholarship = scholarshipAmount - monthRunningScholarship;
                }
              } else if (i === count - 1) {
                thisOriginal = grandTotal - runningOriginal;
                thisScholarship = scholarshipAmount - runningScholarship;
              }
            }
            runningOriginal += thisOriginal;
            runningScholarship += thisScholarship;
            if (isMonthlyBasis) {
              if (i % monthParts === monthParts - 1) {
                monthRunningOriginal = 0;
                monthRunningScholarship = 0;
              } else {
                monthRunningOriginal += thisOriginal;
                monthRunningScholarship += thisScholarship;
              }
            }

            const thisNet = Math.max(0, thisOriginal - thisScholarship);

            if (currentInstNum < instToGenerate) {
              const wasGenerated = existingInstallments.some(
                (ex) => ex.installmentNumber === currentInstNum,
              );
              if (!wasGenerated && mergeBase && thisNet > 0) {
                mergedBaseAmount += thisNet;
                const key = `Monthly Fee Part ${currentInstNum} (Previous)`;
                mergedItems[key] = (mergedItems[key] || 0) + thisNet;
              }
            }

            if (currentInstNum === instToGenerate) {
              let finalFeeDetails = {
                [`Monthly Fee Part ${currentInstNum}`]: thisOriginal,
                ...mergedItems,
                ...mergedFineItems,
              };

              const child = await StudentChallan.create({
                challanNo: await this.generateChallanNo(),
                studentId: student._id,
                termId: sTermId,
                programId: sProgId,
                departmentId: sDeptId,
                semesterId: sSemId,
                challanType: "INSTALLMENT",
                isInstallment: true,
                installmentGroup: groupRefId,
                installmentNumber: currentInstNum,
                originalTotal: thisOriginal + mergedBaseAmount,
                scholarshipAmount: thisScholarship,
                arrears: carriedFines,
                fineAmount: 0,
                includedChallanIds: mergedChallanIds,
                netAmount: thisNet + mergedBaseAmount + carriedFines,
                remainingAmount: thisNet + mergedBaseAmount + carriedFines,
                dueDate: new Date(dueDate),
                billingMonth: finalBillingMonth, // ✅ Saves the matched month to DB
                status: "issued",
                feeDetails: finalFeeDetails,
                remarks: `Monthly fee part ${currentInstNum} of ${count} (${pct}%)`,
                feeSetupRemark: combinedFeeSetupRemark,
                scholarshipId,
                issuedAt: issuedAtDate,
              });
              await child.populate("studentId");
              createdChallans.push(child);
            }
          }
          successCount++;
        } else {
          let finalFeeDetails = { ...feeDetails, ...mergedItems, ...mergedFineItems };

          const newChallan = await StudentChallan.create({
            challanNo: await this.generateChallanNo(),
            studentId: student._id,
            termId: sTermId || null,
            programId: sProgId,
            departmentId: sDeptId,
            semesterId: sSemId,
            challanType: resolvedChallanType,
            feeDetails: finalFeeDetails,
            originalTotal: grandTotal + mergedBaseAmount,
            scholarshipAmount,
            arrears: carriedFines,
            fineAmount: 0,
            includedChallanIds: mergedChallanIds,
            netAmount: totalNetCalc + mergedBaseAmount + carriedFines,
            remainingAmount: totalNetCalc + mergedBaseAmount + carriedFines,
            dueDate: new Date(dueDate),
            billingMonth: finalBillingMonth, // ✅ Saves the selected month to DB
            status: "issued",
            feeSetupRemark: combinedFeeSetupRemark,
            scholarshipId,
            isInstallment: false,
            issuedAt: issuedAtDate,
          });
          await newChallan.populate("studentId");
          createdChallans.push(newChallan);
          successCount++;
        }
      } catch (err) {
        failedCount++;
        errors.push(
          `Student (${student.personalInfo?.fullName || student._id}): ${err.message}`,
        );
      }
    }
    return { successCount, failedCount, errors, createdChallans };
  }

  // Batch preview of "previous unpaid dues" for a set of students — same
  // eligibility criteria (issued/overdue/partial, any semester, any type)
  // and per-source labelling as generate()'s own mergeBase/carryFine
  // rollup, so what Bulk Generation shows the accountant beforehand can
  // never drift from what actually gets merged in.
  static async getPreviousDuesForStudents(studentIds) {
    const unpaidChallans = await StudentChallan.find({
      studentId: { $in: studentIds },
      status: { $in: ["issued", "overdue", "partial"] },
      isDeleted: false,
    }).populate("semesterId", "name number");

    const perStudent = {};
    for (const uc of unpaidChallans) {
      const sId = String(uc.studentId);
      const existingFine = uc.fineAmount || 0;
      const unpaidBase = Math.max(0, uc.remainingAmount - existingFine);
      const amount = unpaidBase + existingFine;
      if (amount <= 0) continue;
      if (!perStudent[sId])
        perStudent[sId] = { amount: 0, itemCount: 0, items: [] };
      perStudent[sId].amount += amount;
      perStudent[sId].itemCount += 1;
      // Same semester-aware label generate() itself uses — lets the Bulk
      // delete-review panel show exactly which previous challan is which
      // (e.g. "Installment 1 Fee (Semester 2)") before picking one to
      // delete, instead of an anonymous amount.
      perStudent[sId].items.push({
        challanId: String(uc._id),
        label: buildPreviousDuesSourceLabel(uc, null),
        amount,
      });
    }

    let totalAmount = 0;
    let totalStudentsWithDues = 0;
    for (const sId of Object.keys(perStudent)) {
      totalAmount += perStudent[sId].amount;
      totalStudentsWithDues += 1;
    }

    return { perStudent, totalAmount, totalStudentsWithDues };
  }

  // Scans every student in scope (optionally narrowed by department/
  // program/semester) and generates a challan ONLY for those whose next
  // due installment is configured for the given billing month — the admin
  // just picks a session, a month and a due date instead of hand-picking
  // students. Students without an installment plan, or whose plan is due
  // in a different month, are simply not matched (not an error) — the
  // heavy lifting (fee calc, scholarships, checkStrictLock, etc.) is
  // delegated to the existing `generate()` bulk path once the eligible
  // student list is known, so behavior stays identical to a manual bulk
  // generate for that same list.
  // Shared eligibility scan used by BOTH the Auto Generator preview (list
  // students matched + which months still have someone due) and the actual
  // generation run — kept as ONE computation so the dropdown can never show
  // a month the generator itself wouldn't actually match, and vice versa.
  // For each candidate returns their single "next due" month: for a real
  // installment plan that's whichever configured month comes after the
  // highest installment number already generated; for a whole-fee/
  // single-payment plan it's `customMonths[0]`, but only while that
  // student doesn't already have a live (non-cancelled) tuition challan —
  // once billed, a whole-fee student naturally drops out of every month's
  // count instead of continuing to show as "still due".
  static async getAutoGenerateCandidates(filters = {}) {
    const { termId, departmentId, programId, semesterId } = filters;
    if (!termId) throw new AppError("Term/Session is required.", 400);

    const validProgramIds = await this.getValidUniversityProgramIds();

    // StudentProfile has no `isActive` field — it uses a `status` enum
    // instead, so filtering on `isActive: true` silently matched zero
    // students (the same bug fixed in getMasterFinancialReport).
    const studentQuery = {
      status: "active",
      programId: { $in: validProgramIds },
    };
    if (departmentId) studentQuery.departmentId = departmentId;
    if (programId) studentQuery.programId = programId;
    if (semesterId) studentQuery.semesterId = semesterId;

    const students = await StudentProfile.find(studentQuery)
      .select("_id semesterId personalInfo")
      .populate({ path: "personalInfo", select: "fullName cnic" });

    if (!students.length) return { totalStudents: 0, candidates: [] };

    const studentMongoIds = students.map((s) => s._id);
    // No `defaultInstallments` filter here — a student on a single
    // lump-sum plan (defaultInstallments <= 1) still saves their chosen
    // Billing Month in `customMonths[0]`, exactly like `generate()`
    // already respects for manual generation (see the non-split branch
    // there).
    const preferences = await StudentFeePreference.find({
      studentId: { $in: studentMongoIds },
    });
    // Keyed by student+semester so only a plan for the student's OWN
    // current semester counts — a stale preference from a past semester
    // (kept around as history) must not match.
    const prefMap = new Map(
      preferences
        .filter((p) => p.semesterId)
        .map((p) => [`${p.studentId.toString()}_${p.semesterId.toString()}`, p]),
    );

    const withPlan = students.filter((s) => {
      const sSemId = s.semesterId?._id || s.semesterId;
      return sSemId && prefMap.has(`${s._id.toString()}_${sSemId.toString()}`);
    });

    if (!withPlan.length) return { totalStudents: students.length, candidates: [] };

    const withPlanIds = withPlan.map((c) => c._id);
    const existingInstallments = await StudentChallan.find({
      studentId: { $in: withPlanIds },
      termId,
      isInstallment: true,
      isDeleted: false,
      status: { $ne: "cancelled" },
    }).select("studentId installmentNumber status");

    // Tracks the highest-numbered live installment per student along with
    // its status — a student whose latest installment is overdue must be
    // excluded below rather than counted as "ready for the next month".
    const latestByStudent = new Map();
    existingInstallments.forEach((c) => {
      const key = c.studentId.toString();
      const current = latestByStudent.get(key);
      if (!current || (c.installmentNumber || 0) > current.installmentNumber) {
        latestByStudent.set(key, {
          installmentNumber: c.installmentNumber || 0,
          status: c.status,
        });
      }
    });
    const maxByStudent = new Map(
      [...latestByStudent.entries()].map(([k, v]) => [k, v.installmentNumber]),
    );

    // Whole-fee students who already have a live tuition challan for this
    // term drop out entirely — otherwise they'd keep showing as "due" in
    // their configured month forever, even after being billed.
    const existingWholeFee = await StudentChallan.find({
      studentId: { $in: withPlanIds },
      termId,
      isInstallment: false,
      isDeleted: false,
      status: { $ne: "cancelled" },
      challanType: /tuition/i,
    }).select("studentId");
    const wholeFeeBilled = new Set(existingWholeFee.map((c) => c.studentId.toString()));

    const candidates = [];
    for (const s of withPlan) {
      const sSemId = s.semesterId?._id || s.semesterId;
      const pref = prefMap.get(`${s._id.toString()}_${sSemId.toString()}`);
      let targetMonth = null;

      // Latest installment still sitting overdue — this student needs a
      // renew, not another auto-generated challan for the next month.
      const latest = latestByStudent.get(s._id.toString());
      if (latest?.status === "overdue") continue;

      if (pref.defaultInstallments > 1) {
        const nextInstNum = (maxByStudent.get(s._id.toString()) || 0) + 1;
        if (nextInstNum > pref.defaultInstallments) continue; // plan already fully generated
        targetMonth = (pref.customMonths || [])[nextInstNum - 1];
      } else {
        if (wholeFeeBilled.has(s._id.toString())) continue; // already billed
        targetMonth = (pref.customMonths || [])[0];
      }

      if (!targetMonth) continue;
      candidates.push({
        studentId: s._id,
        name: s.personalInfo?.fullName || "Unknown",
        targetMonth,
      });
    }

    return { totalStudents: students.length, candidates };
  }

  // Powers the Auto Generator's "how many students match" + "which months
  // still have someone due" UI — a pure read, generates nothing.
  static async getAutoGeneratePreview(filters = {}) {
    const { totalStudents, candidates } = await this.getAutoGenerateCandidates(filters);

    const MONTHS_ORDER = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const countByMonth = new Map();
    candidates.forEach((c) => {
      countByMonth.set(c.targetMonth, (countByMonth.get(c.targetMonth) || 0) + 1);
    });
    // Already-fully-billed months (installment plans past that point, or
    // whole-fee students already invoiced) simply never accumulate a count
    // above — so this list is naturally "only months that still have
    // someone left to bill", no separate "already generated" tracking needed.
    const availableMonths = MONTHS_ORDER.filter((m) => countByMonth.has(m)).map((m) => ({
      month: m,
      count: countByMonth.get(m),
    }));

    return {
      totalStudents,
      studentsWithPlan: candidates.length,
      availableMonths,
    };
  }

  static async autoGenerateForMonth(data) {
    const {
      termId,
      dueDate,
      billingMonth,
      departmentId,
      programId,
      semesterId,
      feeTypes = ["tuition"],
      allowMultipleTuition = false,
      // Unpaid/overdue balances from OTHER semesters get folded into the
      // newly generated challan as arrears (same mergeBase/carryFine
      // mechanism `generate()` already supports for manual generation) —
      // on by default so auto-generated challans don't leave old dues
      // stranded as separate, easy-to-miss challans.
      includeArrears = true,
      generationDate = null,
    } = data;

    if (!termId) throw new AppError("Term/Session is required.", 400);
    if (!dueDate) throw new AppError("Due Date is required.", 400);
    if (!billingMonth) throw new AppError("Billing Month is required.", 400);

    const { candidates } = await this.getAutoGenerateCandidates({
      termId,
      departmentId,
      programId,
      semesterId,
    });

    if (!candidates.length) {
      return {
        successCount: 0,
        failedCount: 0,
        matchedCount: 0,
        errors: ["No students with a saved fee/installment plan found for this selection."],
        createdChallans: [],
      };
    }

    const eligibleStudentIds = candidates
      .filter((c) => c.targetMonth.toLowerCase() === billingMonth.toLowerCase())
      .map((c) => c.studentId);

    if (!eligibleStudentIds.length) {
      return {
        successCount: 0,
        failedCount: 0,
        matchedCount: 0,
        errors: [`No students have a challan due in ${billingMonth} for this selection.`],
        createdChallans: [],
      };
    }

    const result = await this.generate({
      studentIds: eligibleStudentIds,
      termId,
      dueDate,
      billingMonth,
      feeTypes,
      allowMultipleTuition,
      mergeBase: includeArrears,
      carryFine: includeArrears,
      generationDate,
    });

    return { ...result, matchedCount: eligibleStudentIds.length };
  }

  static async getPaginated(
    p,
    l,
    s,
    t,
    st,
    deptId,
    progId,
    semId,
    excludeType,
    month,
    type,
    excludeUnactivated,
    studentId,
  ) {
    try {
      const limit = Math.max(1, parseInt(l, 10) || 10);
      const page = Math.max(1, parseInt(p, 10) || 1);
      const skip = (page - 1) * limit;

      const validProgramIds = await this.getValidUniversityProgramIds(); // ✅ Hide HSSC
      const q = { isDeleted: false, programId: { $in: validProgramIds } };

      // Opt-in only (department/summary reports pass this explicitly) — a
      // student who came through the Admission Process but hasn't paid a
      // single fee yet (feeActivated: false) stays out. Operational
      // screens (Challan Generation, Fine/Due-Date Management, dashboard)
      // never pass this, since they still need to see and act on those
      // students' challans.
      if (excludeUnactivated === true || excludeUnactivated === "true") {
        const excludedStudentIds = (
          await StudentProfile.find({ feeActivated: false }).select("_id").lean()
        ).map((sp) => sp._id);
        q.studentId = { $nin: excludedStudentIds };
      }

      // Pins the whole list to one specific student (Fine & Due-Date
      // Management's "select student" scope) — combined with, not
      // overwriting, the $nin exclusion above if both are ever passed
      // together.
      const cleanStudentId = safeString(studentId);
      if (cleanStudentId) {
        q.studentId = q.studentId
          ? { ...q.studentId, $eq: cleanStudentId }
          : cleanStudentId;
      }

      const cleanT = safeString(t);
      if (cleanT) q.termId = cleanT;
      const cleanDept = safeString(deptId);
      if (cleanDept) q.departmentId = cleanDept;
      const cleanProg = safeString(progId);
      if (cleanProg) q.programId = cleanProg;
      const cleanSem = safeString(semId);
      if (cleanSem) q.semesterId = cleanSem;
      const cleanStatus = safeString(st);
      if (cleanStatus) q.status = cleanStatus;

      // All `challanType`-related conditions (exclude hostel, and now the
      // positive Fee Type filter) collect into one array instead of each
      // separately assigning `q.challanType`, since a later assignment
      // would silently overwrite an earlier one on the same field.
      const challanTypeConditions = [];
      const cleanExclude = safeString(excludeType);
      if (cleanExclude) {
        challanTypeConditions.push({
          challanType: { $not: new RegExp(cleanExclude, "i") },
        });
      }
      // Fee Type filter — a positive "only these" match, the counterpart
      // to `excludeType` above (which only ever excludes). Uses the same
      // challanType-substring buckets as everywhere else in this app
      // (e.g. the College Print Challans filters) rather than an exact
      // enum, since `challanType` is a free-form joined string
      // ("TUITION", "TUITION_EXAM", "INSTALLMENT", ...), not a fixed set.
      const cleanType = safeString(type);
      if (cleanType) {
        const key = cleanType.toLowerCase();
        const TYPE_REGEX = {
          tuition: /tuition|installment|academic/i,
          exam: /exam/i,
          readmission: /readmission/i,
          misc: /misc|general/i,
        };
        if (key === "admission") {
          challanTypeConditions.push({ challanType: /admission/i });
          challanTypeConditions.push({ challanType: { $not: /readmission/i } });
        } else if (TYPE_REGEX[key]) {
          challanTypeConditions.push({ challanType: TYPE_REGEX[key] });
        }
      }

      // Month filter — matches a challan's own `billingMonth` (a plain
      // month-NAME string, e.g. "July"), falling back to Due Date's
      // calendar month (matched via $month, year-agnostic — this filter
      // has never taken a year, only a month name) for older challans that
      // predate billingMonth being tracked at all and so have none set.
      const cleanMonth = safeString(month);
      let monthOrClause = null;
      if (cleanMonth) {
        const monthNum = MONTH_NAME_TO_NUMBER[cleanMonth.toLowerCase()];
        monthOrClause = {
          $or: [
            { billingMonth: new RegExp(`^${cleanMonth}$`, "i") },
            {
              $and: [
                {
                  $or: [
                    { billingMonth: { $exists: false } },
                    { billingMonth: null },
                    { billingMonth: "" },
                  ],
                },
                ...(monthNum
                  ? [{ $expr: { $eq: [{ $month: "$dueDate" }, monthNum] } }]
                  : []),
              ],
            },
          ],
        };
      }

      const cleanSearch = safeString(s);
      let searchOrClause = null;
      if (cleanSearch) {
        const regex = new RegExp(cleanSearch, "i");
        const matchedInfos = await PersonalInfo.find({ fullName: regex })
          .select("studentId")
          .lean();
        const studentProfiles = await StudentProfile.find({
          $or: [
            { studentId: regex },
            { _id: { $in: matchedInfos.map((i) => i.studentId) } },
          ],
        }).select("_id");

        searchOrClause = {
          $or: [
            { challanNo: regex },
            { studentId: { $in: studentProfiles.map((sp) => sp._id) } },
          ],
        };
      }

      // Every condition that needs `$or`/`$and` semantics (month, search,
      // and now the multi-part Fee Type/exclude conditions) collects into
      // one `$and` array — a plain `q.$or = ...`/`q.challanType = ...` per
      // filter would let later ones silently clobber earlier ones on the
      // same key.
      const andConditions = [
        ...challanTypeConditions,
        ...(monthOrClause ? [monthOrClause] : []),
        ...(searchOrClause ? [searchOrClause] : []),
      ];
      if (andConditions.length === 1) {
        Object.assign(q, andConditions[0]);
      } else if (andConditions.length > 1) {
        q.$and = andConditions;
      }

      const stats = await StudentChallan.aggregate([
        { $match: q },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            totalFines: { $sum: "$fineAmount" },
          },
        },
      ]);

      const data = await StudentChallan.find(q)
        .populate({
          path: "studentId",
          populate: [{ path: "personalInfo", select: "fullName cnic phone email" }],
        })
        .populate("departmentId programId termId semesterId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Father's name is in the FamilyInfo collection — attach it so the
      // printed challan can show it (otherwise it always printed blank).
      const FamilyInfoModel =
        mongoose.models.FamilyInfo || mongoose.model("FamilyInfo");
      const profileIds = [
        ...new Set(data.map((d) => String(d.studentId?._id || "")).filter(Boolean)),
      ];
      const families = profileIds.length
        ? await FamilyInfoModel.find({ studentId: { $in: profileIds } })
            .select("studentId fatherName")
            .lean()
        : [];
      const familyByStudent = new Map(families.map((f) => [String(f.studentId), f]));
      const challansWithFamily = data.map((d) => {
        // toJSON (not toObject) so the feeDetails Map is flattened as before.
        const obj = d.toJSON();
        if (obj.studentId) {
          obj.studentId.familyInfo = familyByStudent.get(String(obj.studentId._id)) || null;
        }
        return obj;
      });

      return {
        challans: challansWithFamily,
        totalItems: stats[0]?.totalCount || 0,
        totalFines: stats[0]?.totalFines || 0,
        totalPages: Math.ceil((stats[0]?.totalCount || 0) / limit),
      };
    } catch (error) {
      console.error("🔥 CRITICAL DB ERROR in getPaginated: ", error);
      throw error;
    }
  }

  static async recalculateFine(challan) {
    if (!challan || !challan.dueDate) return challan;
    if (["paid", "cancelled", "draft", "merged"].includes(challan.status))
      return challan;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(challan.dueDate);
    due.setHours(0, 0, 0, 0);

    let isModified = false;
    if (today > due) {
      const daysOverdue = Math.max(1, Math.floor((today - due) / 86400000));
      // The schedule is snapshotted when the challan is generated. Older
      // challans fall back to their legacy one-time lateFeeAmount.
      const schedule = normalizeLateFineTiers(
        challan.lateFineTiers,
        challan.lateFeeAmount ?? (await getLateFineAmount(challan.campusId || null)),
      );
      const targetAutoFine = calculateLateFine(schedule, daysOverdue);
      const currentAutoFine = Math.max(0, challan.autoLateFineAmount || 0);
      if (targetAutoFine !== currentAutoFine) {
        challan.fineAmount = Math.max(
          0,
          (challan.fineAmount || 0) - currentAutoFine + targetAutoFine,
        );
        challan.autoLateFineAmount = targetAutoFine;
        isModified = true;
      }
      if (challan.status === "issued" || challan.status === "partial") {
        challan.status = "overdue";
        isModified = true;
      }
    } else {
      // Only reverses a fine THIS function itself auto-applied (status
      // flipped to "overdue" above, the mirror image of that transition) —
      // not any positive fineAmount on a not-yet-due challan. A renewed
      // installment legitimately carries its old fine forward onto a fresh
      // future due date; the previous `|| challan.fineAmount > 0` clause
      // wiped that fine back to 0 the very next time this challan's list
      // was fetched, since a not-yet-due "issued" challan with a real fine
      // looked identical to a stale auto-fine to this check.
      if (challan.status === "overdue") {
        const currentAutoFine = Math.max(0, challan.autoLateFineAmount || 0);
        challan.fineAmount = Math.max(0, (challan.fineAmount || 0) - currentAutoFine);
        challan.autoLateFineAmount = 0;
        challan.status = "issued";
        isModified = true;
      }
    }

    if (isModified) await challan.save();
    return challan;
  }

  static async processOverdueChallansAutomatically() {
    try {
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      const expiredChallans = await StudentChallan.find({
        status: { $in: ["issued", "partial", "overdue"] },
        isDeleted: false,
        dueDate: { $lt: todayMidnight },
      });

      let updatedCount = 0;
      for (const challan of expiredChallans) {
        await this.recalculateFine(challan);
        updatedCount++;
      }

      const cancelledAdmissions =
        await this.autoCancelAdmissionsForOverdueChallans();

      return { processedCount: updatedCount, cancelledAdmissions };
    } catch (error) {
      console.error(`[SYSTEM ERROR] Overdue processing failed:`, error.message);
      throw error;
    }
  }

  // Auto-cancels (never deletes) a student's admission once their
  // admission-fee challan has been overdue and unpaid for MORE than a
  // 3-day grace period (not the instant it turns overdue) — gives the
  // Admission Process pipeline's "Fee Overdue" tab a real warning window
  // to show ("cancelled in N days") before this actually fires. Only
  // touches admissions still "active"; once a staff member manually
  // re-admits a cancelled student, this leaves that record alone (no
  // automatic re-cancellation).
  static async autoCancelAdmissionsForOverdueChallans() {
    const GRACE_PERIOD_DAYS = 3;
    const graceEnd = new Date();
    graceEnd.setHours(0, 0, 0, 0);
    graceEnd.setDate(graceEnd.getDate() - GRACE_PERIOD_DAYS);

    const overdueAdmissionChallans = await StudentChallan.find({
      status: "overdue",
      isDeleted: false,
      challanType: { $regex: /admission/i },
      dueDate: { $lte: graceEnd },
    })
      .select("studentId challanType")
      .lean();

    const eligibleStudentIds = [
      ...new Set(
        overdueAdmissionChallans
          .filter((c) => !/readmission/i.test(c.challanType || ""))
          .map((c) => c.studentId.toString()),
      ),
    ];

    if (!eligibleStudentIds.length) return 0;

    const result = await StudentProfile.updateMany(
      {
        _id: { $in: eligibleStudentIds },
        admissionLifecycleStatus: "active",
      },
      {
        $set: {
          admissionLifecycleStatus: "cancelled_non_payment",
          cancelledAt: new Date(),
          cancelledReason: "Admission fee challan overdue and unpaid",
        },
      },
    );
    return result.modifiedCount || 0;
  }

  // Shared by getChallanStatusForStudents and
  // getAdmissionChallanStatusForStudents below — turns a flat list of
  // challans (already scoped to whichever type the caller wants) into the
  // per-student Not Generated / Pending / Paid / Overdue rollup.
  static _rollupChallanStatus(ids, challans) {
    const result = new Map();
    const byStudent = new Map();
    for (const c of challans) {
      const sid = c.studentId.toString();
      if (!byStudent.has(sid)) byStudent.set(sid, []);
      byStudent.get(sid).push(c);
    }

    for (const id of ids) {
      const list = byStudent.get(id.toString()) || [];
      if (!list.length) {
        result.set(id.toString(), {
          challanStatus: "not_generated",
          latestDueDate: null,
          pendingAmount: 0,
        });
        continue;
      }

      const hasOverdue = list.some((c) => c.status === "overdue");
      const hasPending = list.some((c) =>
        ["issued", "partial", "draft"].includes(c.status),
      );
      const allPaid = list.every((c) => c.status === "paid");

      let challanStatus = "pending";
      if (hasOverdue) challanStatus = "overdue";
      else if (allPaid) challanStatus = "paid";
      else if (hasPending) challanStatus = "pending";

      result.set(id.toString(), {
        challanStatus,
        latestDueDate: list[0].dueDate,
        pendingAmount: list.reduce(
          (sum, c) => sum + Math.max(0, (c.netAmount || 0) - (c.paidAmount || 0)),
          0,
        ),
      });
    }

    return result;
  }

  // Per-student rollup of Challan/Payment status — Not Generated / Pending
  // / Paid / Overdue — considering ALL of a student's challan types
  // together. Used by the accountant's own "New Admission" list and
  // general student screens, where "paid" is meant to reflect the
  // student's overall standing, not one specific fee.
  static async getChallanStatusForStudents(studentIds = []) {
    const ids = (studentIds || []).filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );
    if (!ids.length) return new Map();

    const challans = await StudentChallan.find({
      studentId: { $in: ids },
      isDeleted: false,
      status: { $nin: ["cancelled", "merged"] },
    })
      .select("studentId status dueDate netAmount paidAmount")
      .sort({ dueDate: -1 })
      .lean();

    return this._rollupChallanStatus(ids, challans);
  }

  // Same rollup, but scoped to ONLY the student's ADMISSION-type challan(s)
  // — used throughout the Admission Process pipeline (Accepted/Challan
  // Generated/Fee Paid/Fee Overdue buckets, its Stats tab, and the "Mark
  // Complete" gate), where "Fee Paid" must mean the admission fee itself
  // was paid — not that every challan the student has ever been issued
  // (tuition, exam, etc.) happens to be paid too. `readmission` is
  // deliberately excluded since it shares the "admission" substring.
  static async getAdmissionChallanStatusForStudents(studentIds = []) {
    const ids = (studentIds || []).filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );
    if (!ids.length) return new Map();

    const challans = await StudentChallan.find({
      studentId: { $in: ids },
      isDeleted: false,
      status: { $nin: ["cancelled", "merged"] },
      $and: [
        { challanType: /admission/i },
        { challanType: { $not: /readmission/i } },
      ],
    })
      .select("studentId status dueDate netAmount paidAmount")
      .sort({ dueDate: -1 })
      .lean();

    const result = this._rollupChallanStatus(ids, challans);

    // Not every student has an admission fee at all — StudentFeeStructure
    // is opt-in per student, not automatic on promotion. For exactly the
    // students who have NO admission-type challan whatsoever (still
    // "not_generated" above), fall back to their tuition-fee challan
    // status instead, so "Fee Paid" means something real for them rather
    // than leaving them permanently stuck pre-payment for a fee that was
    // never going to exist. Students who DO have an admission-type
    // challan are untouched — their status stays purely about that
    // challan, regardless of tuition.
    const noAdmissionFeeIds = ids.filter(
      (id) => result.get(id.toString())?.challanStatus === "not_generated",
    );
    if (noAdmissionFeeIds.length > 0) {
      const tuitionChallans = await StudentChallan.find({
        studentId: { $in: noAdmissionFeeIds },
        isDeleted: false,
        status: { $nin: ["cancelled", "merged"] },
        $or: [{ challanType: /TUITION/i }, { isInstallment: true }],
      })
        .select("studentId status dueDate netAmount paidAmount")
        .sort({ dueDate: -1 })
        .lean();

      if (tuitionChallans.length > 0) {
        const tuitionMap = this._rollupChallanStatus(noAdmissionFeeIds, tuitionChallans);
        for (const id of noAdmissionFeeIds) {
          const tStatus = tuitionMap.get(id.toString());
          if (tStatus && tStatus.challanStatus !== "not_generated") {
            result.set(id.toString(), tStatus);
          }
        }
      }
    }

    return result;
  }

  // Same rollup as getChallanStatusForStudents, but scoped to ONE specific
  // semester per call (all given studentIds are assumed to share it) —
  // used by admit-card generation to check a student's CURRENT semester
  // fee specifically, not their all-time challan history.
  static async getSemesterChallanStatusForStudents(studentIds = [], semesterId = null) {
    const ids = (studentIds || []).filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );
    const result = new Map();
    if (!ids.length) return result;

    const query = {
      studentId: { $in: ids },
      isDeleted: false,
      status: { $nin: ["cancelled", "merged"] },
    };
    if (semesterId && mongoose.Types.ObjectId.isValid(semesterId)) {
      query.semesterId = semesterId;
    }

    const challans = await StudentChallan.find(query)
      .select("studentId status")
      .lean();

    const byStudent = new Map();
    for (const c of challans) {
      const sid = c.studentId.toString();
      if (!byStudent.has(sid)) byStudent.set(sid, []);
      byStudent.get(sid).push(c);
    }

    for (const id of ids) {
      const list = byStudent.get(id.toString()) || [];
      if (!list.length) {
        result.set(id.toString(), { challanStatus: "not_generated" });
        continue;
      }

      const hasOverdue = list.some((c) => c.status === "overdue");
      const hasPending = list.some((c) =>
        ["issued", "partial", "draft"].includes(c.status),
      );
      const allPaid = list.every((c) => c.status === "paid");

      let challanStatus = "pending";
      if (hasOverdue) challanStatus = "overdue";
      else if (allPaid) challanStatus = "paid";
      else if (hasPending) challanStatus = "pending";

      result.set(id.toString(), { challanStatus });
    }

    return result;
  }

  // Manual, staff-triggered re-admission of a previously auto-cancelled
  // student — reactivates the SAME record (never a new one).
  static async reAdmitStudent(studentId, userId) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new AppError("Invalid student ID format", 400);
    }
    const student = await StudentProfile.findById(studentId);
    if (!student) throw new AppError("Student not found", 404);
    if (student.admissionLifecycleStatus !== "cancelled_non_payment") {
      throw new AppError(
        "Only students cancelled for non-payment can be re-admitted.",
        400,
      );
    }
    student.admissionLifecycleStatus = "re_admitted";
    student.reAdmittedAt = new Date();
    student.reAdmittedBy = userId || null;
    await student.save();
    return student;
  }

  static async updateDueDate(id, newDate) {
    const c = await StudentChallan.findById(id);
    if (!c) throw new AppError("Not Found", 404);
    c.dueDate = new Date(newDate);
    await this.recalculateFine(c);
    return c;
  }

  // Wired to `PATCH /:id/discount` and `DELETE /:id/discount` — these two
  // methods didn't exist at all despite the routes/controller already
  // calling them, so the Discount button on the challan table has always
  // thrown "applyDiscount is not a function" for every module (University
  // and College alike), not something specific to either one.
  static async applyDiscount(id, { amount, reason }) {
    const c = await StudentChallan.findById(id);
    if (!c) throw new AppError("Not Found", 404);
    if (["paid", "cancelled", "merged"].includes(c.status))
      throw new AppError(
        "Cannot apply a discount to a paid or void challan.",
        400,
      );
    const discountAmount = Number(amount);
    if (!discountAmount || discountAmount <= 0)
      throw new AppError("Discount amount must be greater than 0.", 400);
    c.discountAmount = (c.discountAmount || 0) + discountAmount;
    c.discountReason = reason || c.discountReason || "Manual discount";
    await c.save();
    return c;
  }

  static async removeDiscount(id) {
    const c = await StudentChallan.findById(id);
    if (!c) throw new AppError("Not Found", 404);
    c.discountAmount = 0;
    c.discountReason = undefined;
    await c.save();
    return c;
  }

  static async updateFineAndDueDate(id, { fineAmount, dueDate }) {
    const c = await StudentChallan.findById(id);
    if (!c) throw new AppError("Not Found", 404);
    if (dueDate) c.dueDate = new Date(dueDate);
    if (fineAmount !== undefined && fineAmount !== "")
      c.fineAmount = Number(fineAmount);
    await c.save();
    await this.recalculateFine(c);
    return c;
  }

  static async bulkUpdateFineAndDueDate(ids, { fineAmount, dueDate }) {
    const challans = await StudentChallan.find({ _id: { $in: ids } });
    for (let c of challans) {
      if (dueDate) c.dueDate = new Date(dueDate);
      if (fineAmount !== undefined && fineAmount !== "")
        c.fineAmount = Number(fineAmount);
      await c.save();
      await this.recalculateFine(c);
    }
    // Returning the updated documents (not just a count) lets the
    // frontend patch its already-loaded list in place with the real
    // post-recalculation values (status/fineAmount can change again
    // inside recalculateFine) instead of relying on a full refetch —
    // which, for an infinite-scrolled list past page 1, was silently
    // discarding the update for any row loaded before the current page.
    return challans;
  }

  static async getChallansByStudentId(id, query = {}) {
    let mongoId = id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const s = await StudentProfile.findOne({ studentId: id }).select("_id");
      if (!s) return [];
      mongoId = s._id;
    }
    const dbQuery = { studentId: mongoId };

    const cleanExclude = safeString(query.excludeType);
    if (cleanExclude)
      dbQuery.challanType = { $not: new RegExp(cleanExclude, "i") };

    const c = await StudentChallan.find(dbQuery)
      .populate({
        path: "studentId",
        select: "studentId",
        populate: [{ path: "personalInfo", select: "fullName cnic" }],
      })
      .populate("departmentId termId programId semesterId")
      .sort({ createdAt: -1 });

    await Promise.all(c.map((x) => this.recalculateFine(x)));

    // Father's Name lives in a separate FamilyInfo collection, not on
    // StudentProfile/PersonalInfo — without attaching it here, the printed
    // challan (and the challan table) always showed a blank Father Name.
    // Every challan here belongs to the same one student, so this is
    // fetched once and attached to all of them.
    const FamilyInfoModel =
      mongoose.models.FamilyInfo || mongoose.model("FamilyInfo");
    const familyInfo = await FamilyInfoModel.findOne({ studentId: mongoId })
      .select("fatherName")
      .lean();

    return c.map((x) => {
      const obj = x.toObject();
      if (obj.studentId) obj.studentId.familyInfo = familyInfo || null;
      return obj;
    });
  }

  static async markPaid(id, bodyData, file) {
    const c = await StudentChallan.findById(id);
    if (!c) throw new AppError("Not Found", 404);
    if (file) c.paymentProof = await uploadToR2(file, `challans/${id}/proofs`);
    if (bodyData.paymentRemark) c.paymentRemark = bodyData.paymentRemark;

    c.status = "paid";
    c.paidAmount = c.netAmount;
    c.remainingAmount = 0;
    c.paidAt = new Date(bodyData.paymentDate || Date.now());
    await c.save();
    return c;
  }

  static async deleteChallan(id) {
    const c = await StudentChallan.findById(id);
    if (!c) throw new AppError("Not Found", 404);
    if (c.status === "paid") throw new AppError("Cannot delete paid", 400);

    // Only cancel the specific challan requested. `installmentGroup` is
    // shared by every installment challan generated for a student's whole
    // plan (it's derived from studentId+termId alone, not per-batch), so
    // cascading on it here used to cancel every OTHER pending installment
    // too — e.g. deleting Installment #1 silently wiped out #2 and #3,
    // which are separate, still-valid dues for later months.
    c.isDeleted = true;
    c.status = "cancelled";
    c.deletedAt = new Date();
    await c.save();
    return true;
  }

  // ── Renew Overdue Installment ────────────────────────────────────────────
  // Deletes (soft) an overdue installment challan and reissues it one
  // calendar month later, carrying its fine forward. If another live
  // installment already sits in that target month, returns a
  // `status: "conflict"` payload instead of mutating anything — the caller
  // must re-call with `resolution: "shiftAll" | "merge"` to proceed.
  static async renewChallan(challanId, { resolution, dueDate } = {}) {
    const oldChallan = await StudentChallan.findById(challanId);
    if (!oldChallan) throw new AppError("Challan not found", 404);
    if (!oldChallan.isInstallment)
      throw new AppError("Only an installment challan can be renewed.", 400);
    if (oldChallan.status !== "overdue")
      throw new AppError("Only an overdue challan can be renewed.", 400);

    let newDueDate = null;
    if (dueDate) {
      newDueDate = new Date(dueDate);
      if (Number.isNaN(newDueDate.getTime()))
        throw new AppError("Invalid due date.", 400);
    }

    const targetMonth = nextMonthName(oldChallan.billingMonth);
    const conflict = await this._findInstallmentAtMonth(
      oldChallan.studentId,
      oldChallan.termId,
      targetMonth,
      oldChallan._id,
    );

    if (conflict && !resolution) {
      return {
        status: "conflict",
        targetMonth,
        conflictingChallan: {
          _id: conflict._id,
          challanNo: conflict.challanNo,
          billingMonth: conflict.billingMonth,
          netAmount: conflict.netAmount,
          remainingAmount: conflict.remainingAmount,
          installmentNumber: conflict.installmentNumber,
        },
      };
    }

    if (conflict && resolution === "merge") {
      const merged = await this._mergeInstallments(oldChallan, conflict);
      return { status: "renewed", challan: merged };
    }

    if (conflict && resolution === "shiftAll") {
      await this._cascadeShiftInstallments(oldChallan, conflict.installmentNumber);
    }

    const newChallan = await this._createRenewedChallan(oldChallan, targetMonth, newDueDate);

    oldChallan.isDeleted = true;
    oldChallan.status = "cancelled";
    oldChallan.deletedAt = new Date();
    oldChallan.remarks = oldChallan.remarks
      ? `${oldChallan.remarks} | Renewed — replaced by ${newChallan.challanNo} (${targetMonth})`
      : `Renewed — replaced by ${newChallan.challanNo} (${targetMonth})`;
    await oldChallan.save();

    await this._syncPreferenceMonth(
      oldChallan.studentId,
      oldChallan.semesterId,
      oldChallan.installmentNumber,
      targetMonth,
    );

    return { status: "renewed", challan: newChallan };
  }

  static async bulkRenewChallans(ids) {
    const renewed = [];
    const conflicts = [];
    const errors = [];
    for (const id of ids) {
      try {
        const result = await this.renewChallan(id);
        if (result.status === "conflict") {
          conflicts.push({ challanId: id, ...result });
        } else {
          renewed.push(result.challan);
        }
      } catch (err) {
        errors.push({ challanId: id, message: err.message });
      }
    }
    return {
      renewed,
      conflicts,
      errors,
      renewedCount: renewed.length,
      conflictCount: conflicts.length,
      errorCount: errors.length,
    };
  }

  // Every live (billable) installment challan for a student's plan, plus a
  // computed target month and whether renewing it would hit a conflict —
  // powers the bulk "Renew Overdue" tab's list.
  static async getOverdueInstallments(filters = {}) {
    const { termId, departmentId, programId, semesterId } = filters;
    const query = { status: "overdue", isInstallment: true, isDeleted: false };
    if (termId) query.termId = termId;
    if (departmentId) query.departmentId = departmentId;
    if (programId) query.programId = programId;
    if (semesterId) query.semesterId = semesterId;

    const challans = await StudentChallan.find(query)
      .populate({
        path: "studentId",
        select: "studentId personalInfo",
        populate: { path: "personalInfo", select: "fullName cnic" },
      })
      .sort({ dueDate: 1 })
      .lean();

    if (!challans.length) return [];

    // One query for every live installment sibling across the students/
    // terms involved, instead of a conflict-check round-trip per overdue
    // row — this list can easily run into dozens of rows in a real term.
    const siblings = await StudentChallan.find({
      studentId: { $in: challans.map((c) => c.studentId?._id || c.studentId) },
      termId: { $in: [...new Set(challans.map((c) => String(c.termId)))] },
      isInstallment: true,
      isDeleted: false,
      status: { $nin: ["cancelled", "merged"] },
    })
      .select("studentId termId billingMonth")
      .lean();
    const occupiedSlots = new Set(
      siblings.map(
        (s) => `${s.studentId}_${s.termId}_${(s.billingMonth || "").toLowerCase()}`,
      ),
    );

    const results = [];
    for (const c of challans) {
      const targetMonth = nextMonthName(c.billingMonth);
      const conflict = occupiedSlots.has(
        `${c.studentId?._id || c.studentId}_${c.termId}_${(targetMonth || "").toLowerCase()}`,
      );
      results.push({
        _id: c._id,
        challanNo: c.challanNo,
        studentName: c.studentId?.personalInfo?.fullName || "Unknown",
        studentRegNo: c.studentId?.studentId || "N/A",
        installmentNumber: c.installmentNumber,
        currentMonth: c.billingMonth,
        targetMonth,
        fineAmount: c.fineAmount,
        netAmount: c.netAmount,
        remainingAmount: c.remainingAmount,
        dueDate: c.dueDate,
        hasConflict: conflict,
      });
    }
    return results;
  }

  // ── Renew internals ──────────────────────────────────────────────────────
  static async _findInstallmentAtMonth(studentId, termId, month, excludeId) {
    return StudentChallan.findOne({
      studentId,
      termId,
      isInstallment: true,
      isDeleted: false,
      status: { $nin: ["cancelled", "merged"] },
      billingMonth: { $regex: new RegExp(`^${month}$`, "i") },
      _id: { $ne: excludeId },
    });
  }

  static async _createRenewedChallan(oldChallan, targetMonth, dueDateOverride = null) {
    const feeDetails = oldChallan.feeDetails
      ? Object.fromEntries(oldChallan.feeDetails)
      : {};
    const base = Math.max(
      0,
      (oldChallan.originalTotal || 0) -
        (oldChallan.scholarshipAmount || 0) -
        (oldChallan.discountAmount || 0),
    );
    const fineAmount = oldChallan.fineAmount || 0;
    const arrears = oldChallan.arrears || 0;
    const netAmount = base + fineAmount + arrears;

    return StudentChallan.create({
      challanNo: await this.generateChallanNo(),
      studentId: oldChallan.studentId,
      termId: oldChallan.termId,
      programId: oldChallan.programId,
      departmentId: oldChallan.departmentId,
      semesterId: oldChallan.semesterId,
      challanType: oldChallan.challanType,
      feeDetails,
      originalTotal: oldChallan.originalTotal,
      scholarshipAmount: oldChallan.scholarshipAmount || 0,
      discountAmount: oldChallan.discountAmount || 0,
      discountReason: oldChallan.discountReason,
      fineAmount,
      arrears,
      netAmount,
      remainingAmount: netAmount,
      isInstallment: true,
      installmentGroup: oldChallan.installmentGroup,
      installmentNumber: oldChallan.installmentNumber,
      includedChallanIds: [oldChallan._id],
      dueDate:
        dueDateOverride ||
        ensureFutureDueDate(addOneMonthClamped(oldChallan.dueDate)),
      billingMonth: targetMonth,
      status: "issued",
      scholarshipId: oldChallan.scholarshipId,
      feeSetupRemark: oldChallan.feeSetupRemark,
      remarks: `Renewed from ${oldChallan.challanNo} (${oldChallan.billingMonth})`,
    });
  }

  // "Shift all the months" — the conflicting installment and every later
  // one in the plan move one month forward each, freeing up targetMonth for
  // the renewed challan.
  static async _cascadeShiftInstallments(oldChallan, fromInstallmentNumber) {
    const siblings = await StudentChallan.find({
      studentId: oldChallan.studentId,
      termId: oldChallan.termId,
      isInstallment: true,
      isDeleted: false,
      status: { $nin: ["cancelled", "merged"] },
      installmentNumber: { $gte: fromInstallmentNumber },
      _id: { $ne: oldChallan._id },
    }).sort({ installmentNumber: 1 });

    for (const sib of siblings) {
      const newMonth = nextMonthName(sib.billingMonth);
      const note = `Shifted to ${newMonth} to make room for a renewed installment`;
      sib.billingMonth = newMonth;
      sib.dueDate = ensureFutureDueDate(addOneMonthClamped(sib.dueDate));
      // Its own overdue-ness (if any) is resolved by pushing it into the
      // future — otherwise it would stay stuck "overdue" with a due date
      // that no longer reflects that.
      if (sib.status === "overdue") {
        sib.status = "issued";
        sib.fineAmount = 0;
      }
      sib.remarks = sib.remarks ? `${sib.remarks} | ${note}` : note;
      await sib.save();
      await this._syncPreferenceMonth(
        sib.studentId,
        sib.semesterId,
        sib.installmentNumber,
        newMonth,
      );
    }
  }

  // "Merge the two installments" — combine the renewed (overdue) challan
  // and the one already occupying the target month into a single new
  // challan, using the same unpaid-base/fine split as generate()'s own
  // previous-dues rollup (applyMergeItem).
  static async _mergeInstallments(oldChallan, conflictingChallan) {
    const oldFine = oldChallan.fineAmount || 0;
    const oldBase = Math.max(0, (oldChallan.remainingAmount || 0) - oldFine);
    const targetFine = conflictingChallan.fineAmount || 0;
    const targetBase = Math.max(
      0,
      (conflictingChallan.remainingAmount || 0) - targetFine,
    );

    const combinedFine = oldFine + targetFine;
    const netAmount = oldBase + targetBase + combinedFine;

    const feeDetails = {
      [`Monthly Fee Part ${conflictingChallan.installmentNumber} (${conflictingChallan.billingMonth})`]:
        targetBase,
      [`Monthly Fee Part ${oldChallan.installmentNumber} (${oldChallan.billingMonth}) (Merged)`]:
        oldBase,
    };
    if (combinedFine > 0) feeDetails["Fine (Merged)"] = combinedFine;

    const merged = await StudentChallan.create({
      challanNo: await this.generateChallanNo(),
      studentId: oldChallan.studentId,
      termId: oldChallan.termId,
      programId: conflictingChallan.programId,
      departmentId: conflictingChallan.departmentId,
      semesterId: conflictingChallan.semesterId,
      challanType: conflictingChallan.challanType,
      feeDetails,
      originalTotal: oldBase + targetBase,
      scholarshipAmount: 0,
      fineAmount: combinedFine,
      arrears: 0,
      netAmount,
      remainingAmount: netAmount,
      isInstallment: true,
      installmentGroup: conflictingChallan.installmentGroup,
      installmentNumber: conflictingChallan.installmentNumber,
      includedChallanIds: [oldChallan._id, conflictingChallan._id],
      dueDate: conflictingChallan.dueDate,
      billingMonth: conflictingChallan.billingMonth,
      status: "issued",
      remarks: `Merged from ${oldChallan.challanNo} (Monthly Fee Part ${oldChallan.installmentNumber}) and ${conflictingChallan.challanNo} (Monthly Fee Part ${conflictingChallan.installmentNumber}) on ${new Date().toLocaleDateString()}`,
    });

    // Matches applyMergeItem's own convention elsewhere in this file: a
    // fully-absorbed challan is marked `status: "merged"` (not isDeleted —
    // that's reserved for outright cancellation), so it stays visible to
    // historical/audit queries while dropping out of every "unpaid" one.
    const mergeNote = (otherNo) =>
      `Merged into ${merged.challanNo} with ${otherNo} on ${new Date().toLocaleDateString()}`;

    // The model's pre("save") hook unconditionally recomputes
    // netAmount/remainingAmount from originalTotal/fine/arrears/paid on
    // every save (regardless of status) — so a bare `remainingAmount = 0`
    // here would just get silently overwritten back to a nonzero value.
    // Zeroing the source fields too makes that recalculation itself land
    // on 0, instead of fighting it.
    oldChallan.status = "merged";
    oldChallan.originalTotal = 0;
    oldChallan.fineAmount = 0;
    oldChallan.arrears = 0;
    oldChallan.discountAmount = 0;
    oldChallan.remainingAmount = 0;
    oldChallan.remarks = oldChallan.remarks
      ? `${oldChallan.remarks} | ${mergeNote(conflictingChallan.challanNo)}`
      : mergeNote(conflictingChallan.challanNo);
    await oldChallan.save();

    conflictingChallan.status = "merged";
    conflictingChallan.originalTotal = 0;
    conflictingChallan.fineAmount = 0;
    conflictingChallan.arrears = 0;
    conflictingChallan.discountAmount = 0;
    conflictingChallan.remainingAmount = 0;
    conflictingChallan.remarks = conflictingChallan.remarks
      ? `${conflictingChallan.remarks} | ${mergeNote(oldChallan.challanNo)}`
      : mergeNote(oldChallan.challanNo);
    await conflictingChallan.save();

    return merged;
  }

  // Keeps the plan's own record of "which month is installment #N" in sync
  // with a physical challan's billingMonth after a renew/shift — otherwise
  // generate()'s configured-month validator (line ~1232) would throw on the
  // next installment using a now-stale month.
  static async _syncPreferenceMonth(studentId, semesterId, installmentNumber, newMonth) {
    if (!semesterId || !installmentNumber) return;
    const pref = await StudentFeePreference.findOne({ studentId, semesterId });
    if (!pref || !Array.isArray(pref.customMonths)) return;
    const idx = installmentNumber - 1;
    if (idx < 0 || idx >= pref.customMonths.length) return;
    pref.customMonths[idx] = newMonth;
    pref.markModified("customMonths");
    await pref.save();
  }

  static async bulkDelete(ids) {
    const res = await StudentChallan.updateMany(
      { _id: { $in: ids }, status: { $ne: "paid" } },
      { isDeleted: true, status: "cancelled", deletedAt: new Date() },
    );
    return res.modifiedCount;
  }

  // Delete previous challans the accountant ticked "Delete Instead" on
  // during single-generate (rather than merging them forward) — same
  // soft-delete as bulkDelete, but first notes any outstanding fine being
  // written off in the challan's own remarks, so it isn't silently lost
  // from the audit trail just because the record itself got cancelled.
  static async deletePreviousDuesChallans(ids) {
    if (!ids?.length) return 0;
    const challans = await StudentChallan.find({
      _id: { $in: ids },
      status: { $ne: "paid" },
    });
    let count = 0;
    for (const c of challans) {
      if (c.fineAmount > 0) {
        const note = `Deleted with outstanding fine of Rs ${c.fineAmount} written off on ${new Date().toLocaleDateString()}`;
        c.remarks = c.remarks ? `${c.remarks} | ${note}` : note;
      }
      c.isDeleted = true;
      c.status = "cancelled";
      c.deletedAt = new Date();
      await c.save();
      count++;
    }
    return count;
  }

  static async bulkUpdateDate(ids, newDate) {
    const res = await StudentChallan.updateMany(
      { _id: { $in: ids } },
      { dueDate: new Date(newDate) },
    );
    return res.modifiedCount;
  }

  // ── Daily Invoice (College) ──────────────────────────────────────────────
  // Shared filter-query builder for the Daily Invoice table and its two
  // bulk actions, so "Change Unpaid Invoice Date" / "Clear Unpaid Invoices"
  // always act on exactly the same set of records the admin is currently
  // looking at, not a separately-derived one.
  static async _buildDailyInvoiceQuery(filters = {}, scope = "college") {
    const { invoiceNo, dueFrom, dueTo, paidFrom, paidTo, name, status } =
      filters;
    const programIds = await this.getProgramIdsForScope(scope);
    const q = { isDeleted: false, programId: { $in: programIds } };

    const cleanInvoiceNo = safeString(invoiceNo);
    if (cleanInvoiceNo) {
      const regex = new RegExp(cleanInvoiceNo, "i");
      q.challanNo = regex;
    }

    if (dueFrom || dueTo) {
      q.dueDate = {};
      if (safeString(dueFrom)) q.dueDate.$gte = new Date(dueFrom);
      if (safeString(dueTo)) q.dueDate.$lte = new Date(dueTo);
    }
    if (paidFrom || paidTo) {
      q.paidAt = {};
      if (safeString(paidFrom)) q.paidAt.$gte = new Date(paidFrom);
      if (safeString(paidTo)) q.paidAt.$lte = new Date(paidTo);
    }

    const cleanStatus = safeString(status);
    if (cleanStatus === "paid") q.status = "paid";
    else if (cleanStatus === "unpaid")
      q.status = { $in: ["issued", "partial", "overdue"] };
    else q.status = { $nin: ["cancelled", "merged", "draft"] };

    const cleanName = safeString(name);
    if (cleanName) {
      const regex = new RegExp(cleanName, "i");
      const matchedInfos = await PersonalInfo.find({ fullName: regex })
        .select("studentId")
        .lean();
      q.studentId = { $in: matchedInfos.map((i) => i.studentId) };
    }

    return q;
  }

  // Flat, filterable, paginated invoice list scoped to one program-level
  // (College/HSSC by default) — a different shape from getPaginated (which
  // is University-scoped, department/program/semester driven, and hides
  // HSSC) so it's a parallel method rather than a further-overloaded one.
  static async getDailyInvoices(query = {}, scope = "college") {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, parseInt(query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const q = await this._buildDailyInvoiceQuery(query, scope);

    const [totalCount, rows, summaryAgg] = await Promise.all([
      StudentChallan.countDocuments(q),
      StudentChallan.find(q)
        .populate({
          path: "studentId",
          select: "studentId",
          populate: [{ path: "personalInfo", select: "fullName cnic phone" }],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      // Totals across the WHOLE filtered set (not just the current page) —
      // computed server-side since the table itself never loads more than
      // one page's worth of rows into the browser.
      StudentChallan.aggregate([
        { $match: q },
        {
          $group: {
            _id: null,
            totalAmount: {
              $sum: { $subtract: [{ $ifNull: ["$netAmount", 0] }, { $ifNull: ["$fineAmount", 0] }] },
            },
            totalPaidAmount: { $sum: { $ifNull: ["$paidAmount", 0] } },
          },
        },
      ]),
    ]);

    // Late fine from the Late Fine setting (snapshotted on each challan),
    // shown here as "what this would cost if paid after the due date" even
    // for invoices that haven't actually gone overdue yet.
    const DEFAULT_LATE_FEE = await getLateFineAmount(null);
    const data = rows.map((c) => {
      const baseAmount = (c.netAmount || 0) - (c.fineAmount || 0);
      const isPaid = c.status === "paid";
      return {
        _id: c._id,
        challanNo: c.challanNo,
        regNo: c.studentId?.studentId || "N/A",
        name: c.studentId?.personalInfo?.fullName || "Unknown",
        dueDate: c.dueDate,
        amount: baseAmount,
        afterDueDateAmount: baseAmount + (c.lateFeeAmount ?? DEFAULT_LATE_FEE),
        amountPaid: c.paidAmount || 0,
        paidDate: c.paidAt || null,
        mobile: c.studentId?.personalInfo?.phone || "N/A",
        status: isPaid ? "PAID" : "UNPAID",
        paidBy: isPaid ? "Manual" : "",
      };
    });

    return {
      data,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.max(Math.ceil(totalCount / limit), 1),
      },
      summary: {
        totalAmount: summaryAgg[0]?.totalAmount || 0,
        totalPaidAmount: summaryAgg[0]?.totalPaidAmount || 0,
      },
    };
  }

  // "Change Unpaid Invoice Date" — bulk-shifts the due date of every
  // UNPAID invoice matching the current filters (status filter is forced
  // to unpaid regardless of what the UI's dropdown was set to, since this
  // button explicitly only ever targets unpaid invoices).
  static async bulkShiftUnpaidInvoiceDueDate(filters, newDueDate, scope = "college") {
    if (!newDueDate) throw new AppError("A new due date is required.", 400);
    const q = await this._buildDailyInvoiceQuery(
      { ...filters, status: "unpaid" },
      scope,
    );
    const res = await StudentChallan.updateMany(q, {
      dueDate: new Date(newDueDate),
    });
    return res.modifiedCount;
  }

  // "Clear Unpaid Invoices" — non-destructive: cancels (never hard-deletes)
  // every UNPAID invoice matching the current filters, the same
  // soft-cancel semantics `deleteChallan`/`bulkDelete` already use
  // elsewhere in this file, so the records remain for history/audit.
  static async bulkCancelUnpaidInvoices(filters, scope = "college") {
    const q = await this._buildDailyInvoiceQuery(
      { ...filters, status: "unpaid" },
      scope,
    );
    const res = await StudentChallan.updateMany(q, {
      status: "cancelled",
      remarks: "Bulk-cancelled via Daily Invoice (unpaid clear-out)",
    });
    return res.modifiedCount;
  }

  static async createCustomInstallments(originalId, list) {
    const org = await StudentChallan.findById(originalId);
    if (!org) throw new AppError("Not Found", 404);

    org.status = "cancelled";
    org.isDeleted = true;
    org.deletionReason = "Split";
    await org.save();

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      await StudentChallan.create({
        challanNo: await this.generateChallanNo(),
        studentId: org.studentId,
        termId: org.termId,
        programId: org.programId,
        departmentId: org.departmentId,
        semesterId: org.semesterId,
        challanType: "INSTALLMENT",
        isInstallment: true,
        installmentGroup: org.challanNo,
        installmentNumber: i + 1,
        originalTotal: item.amount,
        netAmount: item.amount,
        remainingAmount: item.amount,
        dueDate: new Date(item.dueDate),
        status: "issued",
        feeDetails: { [`Payment Part ${i + 1}`]: item.amount },
        feeSetupRemark: org.feeSetupRemark || "",
      });
    }
    return true;
  }

  static async getFinanceReports(query) {
    const {
      reportType,
      termId,
      category,
      excludeType,
      month,
      departmentId,
      programId,
      semesterId,
      scope,
    } = query;
    const matchStage = {
      isDeleted: false,
      status: { $ne: "cancelled" },
    };
    // scope "all" covers every program (classes of a school/college).
    // Older callers still pass "college" / default "university".
    if (scope !== "all") {
      const validProgramIds = await this.getProgramIdsForScope(
        scope === "college" ? "college" : "university",
      );
      matchStage.programId = { $in: validProgramIds };
    }

    const cleanT = safeString(termId);
    if (cleanT) matchStage.termId = new mongoose.Types.ObjectId(cleanT);
    const cleanDept = safeString(departmentId);
    if (cleanDept)
      matchStage.departmentId = new mongoose.Types.ObjectId(cleanDept);
    const cleanProg = safeString(programId);
    if (cleanProg)
      matchStage.programId = new mongoose.Types.ObjectId(cleanProg);
    const cleanSem = safeString(semesterId);
    if (cleanSem)
      matchStage.semesterId = new mongoose.Types.ObjectId(cleanSem);
    const cleanCat = safeString(category);
    if (cleanCat) matchStage.challanType = cleanCat;
    const cleanExclude = safeString(excludeType);
    if (cleanExclude)
      matchStage.challanType = { $not: new RegExp(cleanExclude, "i") };

    // A student who came through the Admission Process but hasn't paid a
    // single fee yet (feeActivated: false — see StudentProfile.js) stays
    // out of this analytics report entirely, same rule applied everywhere
    // outside the Admission/Accountant "New Admissions" screens.
    const excludedStudentIds = (
      await StudentProfile.find({ feeActivated: false }).select("_id").lean()
    ).map((s) => s._id);
    matchStage.studentId = { $nin: excludedStudentIds };

    // The frontend's month picker sends "YYYY-MM" (e.g. "2026-03"), not a
    // bare month name — matching that string directly against
    // `billingMonth` (which only ever stores a name like "March") could
    // never match anything, so this filter always silently returned zero
    // results. Parsed here into a real month name + date range, using the
    // same billingMonth-priority rule as the Monthly Finance Report: a
    // challan's own billingMonth wins when it has one; only challans with
    // no billingMonth at all fall back to matching by Due Date.
    const cleanMonth = safeString(month);
    if (cleanMonth) {
      const ymMatch = /^(\d{4})-(\d{1,2})$/.exec(cleanMonth);
      if (ymMatch) {
        const targetYear = parseInt(ymMatch[1], 10);
        const targetMonthNum = parseInt(ymMatch[2], 10);
        const startDate = new Date(targetYear, targetMonthNum - 1, 1);
        const endDate = new Date(targetYear, targetMonthNum, 1);
        const monthName = startDate.toLocaleString("default", {
          month: "long",
        });
        matchStage.$or = [
          { billingMonth: new RegExp(`^${monthName}$`, "i") },
          {
            $and: [
              {
                $or: [
                  { billingMonth: { $exists: false } },
                  { billingMonth: null },
                  { billingMonth: "" },
                ],
              },
              { dueDate: { $gte: startDate, $lt: endDate } },
            ],
          },
        ];
      } else {
        // Backward-compatible fallback for a plain month-name string.
        matchStage.billingMonth = new RegExp(`^${cleanMonth}$`, "i");
      }
    }

    let groupField = "$programId",
      lookupFrom = "programs",
      lookupAs = "program",
      nameField = "$program.name";

    switch (reportType) {
      case "session":
        groupField = "$termId";
        lookupFrom = "terms";
        lookupAs = "term";
        nameField = "$term.name";
        break;
      case "department":
        groupField = "$departmentId";
        lookupFrom = "departments";
        lookupAs = "department";
        nameField = "$department.name";
        break;
      case "semester":
        groupField = "$semesterId";
        lookupFrom = "semesters";
        lookupAs = "semester";
        nameField = "$semester.name";
        break;
    }

    const reportData = await StudentChallan.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupField,
          totalChallans: { $sum: 1 },
          totalGenerated: { $sum: "$netAmount" },
          totalCollected: { $sum: "$paidAmount" },
          totalPending: { $sum: "$remainingAmount" },
          paidCount: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },
          unpaidCount: {
            $sum: { $cond: [{ $ne: ["$status", "paid"] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: lookupFrom,
          localField: "_id",
          foreignField: "_id",
          as: lookupAs,
        },
      },
      { $unwind: { path: `$${lookupAs}`, preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: nameField,
          totalChallans: 1,
          totalGenerated: 1,
          totalCollected: 1,
          totalPending: 1,
          paidCount: 1,
          unpaidCount: 1,
        },
      },
      { $sort: { totalGenerated: -1 } },
    ]);

    const summary = reportData.reduce(
      (acc, curr) => {
        acc.totalRevenue += curr.totalCollected;
        acc.totalReceivable += curr.totalGenerated;
        acc.totalPending += curr.totalPending;
        return acc;
      },
      { totalRevenue: 0, totalReceivable: 0, totalPending: 0 },
    );

    return { reportData, summary };
  }

  static async getMasterFinancialReport(query, scope = "university") {
    const { departmentId, termId, programId, semesterId } = query;
    // "university" hides HSSC/College programs; "college" is the inverse —
    // this same function is what powers the College module's own Master
    // Audit export, which must see HSSC students instead of always getting
    // zero results from the university-only restriction.
    const validProgramIds = await this.getProgramIdsForScope(scope);

    const cleanDept = safeString(departmentId);
    const cleanT = safeString(termId);
    const cleanProg = safeString(programId);
    const cleanSem = safeString(semesterId);

    // The STUDENT is the base population now (not the challan) — filtered
    // by the student's own current department/program/semester/term — so
    // a student with a fee setup or installment plan but ZERO challans
    // generated yet still shows up, instead of being invisible because
    // the old version only ever looked at existing challans. StudentProfile
    // has no `isActive` field (that was a copy-paste mismatch with a
    // different query elsewhere) — it uses a `status` enum instead.
    // Withdrawn students are excluded, matching the same default the main
    // Student Directory already applies — this report is meant to reflect
    // the currently-enrolled roster's current-semester fee position, not
    // former students who are no longer being billed.
    //
    // A student who was admitted but has never actually paid anything must
    // not appear here, not shown with a Rs 0 "Paid" row — Master Data is
    // meant to list students who are actually paying and whose admission is
    // confirmed, not everyone who's simply been admitted.
    //
    // This used to be gated purely on `feeActivated: { $ne: false }`, on
    // the theory that "missing" (not explicitly false) meant "predates the
    // field, but has real payment history". In practice most of the roster
    // (1300+ students) predates the field, and a large share of those have
    // never had a single payment recorded — they showed up in Master Data
    // as all-zero rows. So the gate below is a real check straight against
    // StudentChallan (paidAmount > 0 on a live challan — i.e. this specific
    // student has actually made at least one payment in the system) rather
    // than trusting a boolean that was never backfilled for legacy data.
    const studentQuery = {
      programId: { $in: validProgramIds },
      status: { $ne: "withdrawn" },
    };
    if (cleanDept) studentQuery.departmentId = new mongoose.Types.ObjectId(cleanDept);
    if (cleanProg) studentQuery.programId = new mongoose.Types.ObjectId(cleanProg);
    if (cleanSem) studentQuery.semesterId = new mongoose.Types.ObjectId(cleanSem);
    if (cleanT) studentQuery.termId = new mongoose.Types.ObjectId(cleanT);

    const candidateStudents = await StudentProfile.find(studentQuery)
      .populate("programId", "name code")
      .populate("departmentId", "name")
      .populate("termId", "name")
      .populate("semesterId", "name number")
      .populate("personalInfo", "fullName cnic phone email")
      .lean();

    if (!candidateStudents.length) return { summaryRows: [], challanRows: [] };

    const paidStudentIds = new Set(
      (
        await StudentChallan.find({
          studentId: { $in: candidateStudents.map((s) => s._id) },
          isDeleted: false,
          paidAmount: { $gt: 0 },
        })
          .select("studentId")
          .lean()
      ).map((c) => c.studentId.toString()),
    );
    const students = candidateStudents.filter((s) => paidStudentIds.has(s._id.toString()));

    if (!students.length) return { summaryRows: [], challanRows: [] };

    const studentIds = students.map((s) => s._id);
    const studentMap = new Map(students.map((s) => [s._id.toString(), s]));

    // Fee-type filter — defaults to Tuition only. `challanType` is a joined
    // string like "TUITION_EXAM" (or "INSTALLMENT" for split tuition plans,
    // or "MISC"/"GENERAL" for general fees), not a clean enum, so each
    // selected category is matched as a substring; installment challans are
    // always tuition (only tuition can be split into installments) so they
    // only match when "tuition" is selected. "admission" intentionally
    // matches both ADMISSION and READMISSION challans.
    let feeTypes = query.feeTypes;
    if (!feeTypes) feeTypes = ["tuition"];
    else if (typeof feeTypes === "string")
      feeTypes = feeTypes.split(",").map((t) => t.trim()).filter(Boolean);
    feeTypes = feeTypes.map((t) => t.toLowerCase());

    const typeConditions = [];
    if (feeTypes.includes("tuition"))
      typeConditions.push({ challanType: /TUITION/i }, { isInstallment: true });
    if (feeTypes.includes("admission"))
      typeConditions.push({ challanType: /ADMISSION/i });
    if (feeTypes.includes("exam")) typeConditions.push({ challanType: /EXAM/i });
    if (feeTypes.includes("misc"))
      typeConditions.push({ challanType: /MISC|GENERAL/i });

    const categoryMap = {
      tuition: ["ACADEMIC"],
      admission: ["ADMISSION", "READMISSION"],
      exam: ["EXAM"],
      misc: ["MISC"],
    };
    const allowedCategories = [
      ...new Set(feeTypes.flatMap((t) => categoryMap[t] || [])),
    ];

    // Fee structures + installment preferences — keyed by
    // studentId_semesterId so EACH SEMESTER'S OWN setup is used. The old
    // version summed every fee structure a student ever had into ONE
    // student-wide number and stamped it on every row, which meant a
    // report spanning multiple semesters silently showed only the latest
    // (or a wrongly-summed) setup instead of each semester's real one.
    const feeStructures = await StudentFeeStructure.find({
      studentId: { $in: studentIds },
      isActive: true,
      ...(allowedCategories.length > 0
        ? { category: { $in: allowedCategories } }
        : {}),
    }).lean();

    const feeSetupMap = new Map();
    // Fee structures with no semesterId of their own (old data predating
    // that field — currently ALL of them, system-wide) can't be matched to
    // a specific semester directly, but a student with exactly ONE such
    // record has an unambiguous answer for which semester it's for: theirs,
    // right now. Collected per student here so the fallback below can tell
    // that unambiguous case apart from a genuinely ambiguous one (several
    // untagged records, no way to know which is current).
    const untaggedFeeByStudent = new Map();
    feeStructures.forEach((fs) => {
      const sid = fs.studentId?.toString();
      if (!sid) return;
      const amount =
        fs.feeItems && fs.feeItems.length > 0
          ? fs.feeItems.reduce((acc, item) => acc + (item.amount || 0), 0)
          : fs.totalAmount || 0;
      const semId = fs.semesterId?.toString();
      if (semId) {
        // A fee structure with its own real semesterId counts toward
        // exactly that semester's total — never folded into any other.
        const key = `${sid}_${semId}`;
        feeSetupMap.set(key, (feeSetupMap.get(key) || 0) + amount);
      } else {
        if (!untaggedFeeByStudent.has(sid)) untaggedFeeByStudent.set(sid, []);
        untaggedFeeByStudent.get(sid).push(amount);
      }
    });

    // Legacy fallback: a student whose ONLY fee structure predates
    // semesterId tracking still gets it applied to their current semester
    // — the same "exactly one untagged record = this student's real fee"
    // convention already used when a challan is generated and by the
    // scholarship service's own tuition lookup. Without this, "Total Fee"
    // silently showed 0 for every such student even though a real challan
    // for that exact amount had already been billed and was visibly
    // sitting in this same report — which today is effectively everyone,
    // since no fee structure in the system currently has a semesterId set.
    untaggedFeeByStudent.forEach((amounts, sid) => {
      if (amounts.length !== 1) return;
      const curSemId = (
        studentMap.get(sid)?.semesterId?._id || studentMap.get(sid)?.semesterId
      )?.toString();
      if (!curSemId) return;
      const key = `${sid}_${curSemId}`;
      if (!feeSetupMap.has(key)) feeSetupMap.set(key, amounts[0]);
    });

    const preferences = await StudentFeePreference.find({
      studentId: { $in: studentIds },
    }).lean();
    // Same legacy fallback as the fee structures above, for installment
    // preferences missing a semesterId.
    const prefMap = new Map();
    const untaggedPrefByStudent = new Map();
    preferences.forEach((p) => {
      const sid = p.studentId?.toString();
      if (!sid) return;
      if (p.semesterId) {
        prefMap.set(`${sid}_${p.semesterId.toString()}`, p);
      } else {
        if (!untaggedPrefByStudent.has(sid)) untaggedPrefByStudent.set(sid, []);
        untaggedPrefByStudent.get(sid).push(p);
      }
    });
    untaggedPrefByStudent.forEach((prefs, sid) => {
      if (prefs.length !== 1) return;
      const curSemId = (
        studentMap.get(sid)?.semesterId?._id || studentMap.get(sid)?.semesterId
      )?.toString();
      if (!curSemId) return;
      const key = `${sid}_${curSemId}`;
      if (!prefMap.has(key)) prefMap.set(key, prefs[0]);
    });

    // Challans for these students, scoped to the selected fee type(s) —
    // grouped by studentId_semesterId. A student/semester with none simply
    // gets zeros in the summary rather than being excluded.
    const challanBaseMatch = {
      studentId: { $in: studentIds },
      isDeleted: false,
      status: { $ne: "cancelled" },
    };
    const challanMatch =
      typeConditions.length > 0
        ? { ...challanBaseMatch, $or: typeConditions }
        : challanBaseMatch;

    const challans = await StudentChallan.find(challanMatch)
      .populate("semesterId", "name number")
      .populate("termId", "name")
      .sort({ studentId: 1, dueDate: -1 })
      .lean();

    // Grand total paid across EVERY fee type (ignores the feeTypes filter
    // above) — student-level, not semester-scoped, since it's meant as the
    // full all-time picture regardless of the dropdown selection.
    //
    // Also used to build a per-(student, semester) Challan Count that, like
    // the grand total, ignores the feeTypes filter — it must count every
    // challan the student has for that semester regardless of type, not
    // just the ones matching whichever fee types were selected for the
    // export (which is what `semChallans.length` below would give).
    const allChallansForTotals = await StudentChallan.find(challanBaseMatch)
      .select("studentId semesterId paidAmount")
      .lean();
    const grandPaidMap = new Map();
    const challanCountMap = new Map();
    allChallansForTotals.forEach((c) => {
      const sid = c.studentId?.toString();
      if (!sid) return;
      grandPaidMap.set(sid, (grandPaidMap.get(sid) || 0) + (c.paidAmount || 0));
      const semId = (c.semesterId?._id || c.semesterId)?.toString() || "none";
      const key = `${sid}_${semId}`;
      challanCountMap.set(key, (challanCountMap.get(key) || 0) + 1);
    });

    const FamilyInfoModel =
      mongoose.models.FamilyInfo || mongoose.model("FamilyInfo");
    const familyInfos = await FamilyInfoModel.find({
      studentId: { $in: studentIds },
    }).lean();
    const familyMap = new Map(
      familyInfos.map((f) => [f.studentId.toString(), f]),
    );

    const scholarshipIds = [
      ...new Set(
        challans.map((c) => c.scholarshipId?.toString()).filter(Boolean),
      ),
    ];
    const StudentScholarshipModel =
      mongoose.models.StudentScholarship ||
      mongoose.model("StudentScholarship");
    const scholarshipApps = await StudentScholarshipModel.find({
      _id: { $in: scholarshipIds },
    })
      .populate("scholarshipPlanId", "title")
      .lean();
    const scholarshipNameMap = new Map(
      scholarshipApps.map((a) => [
        a._id.toString(),
        a.scholarshipPlanId?.title || "N/A",
      ]),
    );

    // Active-scholarship fallback — a student can have an approved,
    // currently-active scholarship with a fee already set up but nothing
    // billed yet (nothing generated so far, or the scholarship fully
    // covers the fee so no challan is ever needed), in which case the
    // challan-derived scholarshipName/scholarshipAmount above stay at
    // their default (N/A / 0) even though the deduction is real. Resolved
    // once here for every student in this report, using the same match
    // rules as ScholarshipService.getStudentActiveScholarship, so the
    // summary row reflects the scholarship that WOULD apply the moment a
    // challan is generated — not just what's already been billed.
    const allApprovedScholarships = await StudentScholarshipModel.find({
      studentId: { $in: studentIds },
      status: "approved",
    })
      .populate("scholarshipPlanId")
      .lean();
    const approvedByStudent = new Map();
    allApprovedScholarships.forEach((app) => {
      const asid = app.studentId?.toString();
      if (!asid) return;
      if (!approvedByStudent.has(asid)) approvedByStudent.set(asid, []);
      approvedByStudent.get(asid).push(app);
    });
    const resolveActiveScholarshipPlan = (sid, termId, semesterId) => {
      if (!termId) return null;
      const apps = approvedByStudent.get(sid) || [];
      const now = new Date();
      const matched = apps.find((app) => {
        const plan = app.scholarshipPlanId;
        if (!plan || !plan.active) return false;
        if (semesterId && app.semesterScope === "selective") {
          const inScope = (app.semesterIds || []).some(
            (s) => s.toString() === semesterId,
          );
          if (!inScope) return false;
        }
        if (plan.termId && plan.termId.toString() === termId.toString())
          return true;
        const validDate = !plan.validTo || new Date(plan.validTo) >= now;
        return !plan.termId && validDate;
      });
      return matched?.scholarshipPlanId || null;
    };

    const challansByKey = new Map();
    challans.forEach((c) => {
      const sid = c.studentId?.toString();
      if (!sid) return;
      const semId = (c.semesterId?._id || c.semesterId)?.toString() || "none";
      const key = `${sid}_${semId}`;
      if (!challansByKey.has(key)) challansByKey.set(key, []);
      challansByKey.get(key).push(c);
    });

    // Exactly ONE key per student — their own CURRENT semester
    // (StudentProfile.semesterId), never a past one. Previously this was
    // the union of every semester any of feeSetupMap/prefMap/challansByKey
    // mentioned, which meant a student with fee/challan history from
    // several semesters produced one row PER semester — the Master Data
    // export showing "multiple records, current and previous semester" for
    // the same student. Keying strictly off the student's current semester
    // means `feeSetupMap.get(key)` / `challansByKey.get(key)` below can
    // only ever resolve that semester's own data (past-semester entries
    // simply don't match this key and are correctly left out), while every
    // student still gets exactly one row — zeroed out, not omitted — even
    // when they have no fee setup/installment/challan yet for it.
    const allKeys = new Set();
    students.forEach((s) => {
      const curSemId =
        (s.semesterId?._id || s.semesterId)?.toString() || "none";
      allKeys.add(`${s._id.toString()}_${curSemId}`);
    });

    const SemesterModel =
      mongoose.models.Semester || mongoose.model("Semester");
    const semesterIdsNeeded = [...allKeys]
      .map((k) => k.split("_")[1])
      .filter(
        (id) =>
          id && id !== "none" && id !== "undefined" && id !== "null",
      );
    const semesterDocs = await SemesterModel.find({
      _id: { $in: semesterIdsNeeded },
    })
      .select("number")
      .lean();
    const semesterNumberMap = new Map(
      semesterDocs.map((s) => [s._id.toString(), s.number]),
    );

    const summaryRows = [...allKeys]
      .map((key) => {
        const [sid, semId] = key.split("_");
        const student = studentMap.get(sid);
        if (!student) return null;

        const semChallans = challansByKey.get(key) || [];
        const pref = prefMap.get(key);
        const familyData = familyMap.get(sid);

        let netAmount = 0,
          paidAmount = 0,
          remainingAmount = 0,
          scholarshipAmount = 0,
          fineCollected = 0;
        let scholarshipName = "N/A";
        semChallans.forEach((c) => {
          netAmount += c.netAmount || 0;
          paidAmount += c.paidAmount || 0;
          remainingAmount += c.remainingAmount || 0;
          scholarshipAmount += c.scholarshipAmount || 0;
          if (c.status === "paid") fineCollected += c.fineAmount || 0;
          if (c.scholarshipId) {
            const nm = scholarshipNameMap.get(c.scholarshipId.toString());
            if (nm && nm !== "N/A") scholarshipName = nm;
          }
        });

        const paymentStatus =
          semChallans.length === 0
            ? "No Challan Yet"
            : netAmount > 0 && paidAmount >= netAmount
              ? "Paid"
              : paidAmount > 0
                ? "Partial"
                : "Unpaid";

        const configuredTotalFee = feeSetupMap.get(key) || 0;

        // No scholarship was found on any already-generated challan for
        // this row — check whether the student has one actively approved
        // that would apply to this fee anyway (see resolveActiveScholarshipPlan
        // above), so a scholarship shows up here from the moment it's
        // approved, not only after a challan happens to get billed. Shown
        // even when there's no fee setup yet (or it computes to a 0
        // deduction) — a student with an assigned scholarship and nothing
        // else set up yet must still show the plan NAME, just with a 0
        // amount, instead of being hidden entirely until a fee exists.
        if (scholarshipName === "N/A") {
          const studentTermId = student.termId?._id || student.termId;
          const activePlan = resolveActiveScholarshipPlan(
            sid,
            studentTermId,
            semId !== "none" ? semId : undefined,
          );
          if (activePlan) {
            scholarshipName = activePlan.title || "N/A";
            scholarshipAmount =
              configuredTotalFee > 0
                ? Math.min(
                    ScholarshipService.calculateScholarshipAmount(
                      configuredTotalFee,
                      activePlan,
                    ),
                    configuredTotalFee,
                  )
                : 0;
          }
        }

        // The TRUE remaining balance for the whole semester — not just the
        // sum of `remainingAmount` on challans that happen to have been
        // generated already. An installment plan with, say, 2 of 4 challans
        // generated so far would otherwise show "Outstanding" as only the
        // unpaid part of those 2, silently ignoring the 2 not-yet-billed
        // installments — understating how much the student actually still
        // owes for the semester.
        const outstanding = Math.max(0, configuredTotalFee - paidAmount);

        // For installment plans, the full planned month-by-month schedule
        // (derived from the configured percentages against the semester's
        // total fee) — independent of which installments have actually been
        // billed yet, so "this month has this amount" is visible up front
        // instead of only appearing once each challan is generated.
        let installmentMonths = [];
        if (pref && pref.defaultInstallments > 1) {
          const n = pref.defaultInstallments;
          const pct =
            Array.isArray(pref.customPercentages) &&
            pref.customPercentages.length === n
              ? pref.customPercentages
              : Array(n).fill(100 / n);
          // "amount" mode's figures are fixed — use the actual configured
          // Rupee amount instead of re-deriving one from percentage × the
          // current fee total (which is exactly what fixed mode avoids).
          const fixedAmounts =
            pref.installmentMode === "amount" &&
            Array.isArray(pref.customAmounts) &&
            pref.customAmounts.length === n
              ? pref.customAmounts
              : null;
          installmentMonths = pct.map((p, i) => ({
            month: pref.customMonths?.[i] || `Monthly Fee Part ${i + 1}`,
            amount: fixedAmounts
              ? Math.round(fixedAmounts[i])
              : Math.round((configuredTotalFee * p) / 100),
          }));
        }

        return {
          studentId: student.studentId || "N/A",
          studentName: student.personalInfo?.fullName || "N/A",
          fatherName: familyData?.fatherName || "N/A",
          department: student.departmentId?.name || "N/A",
          program: student.programId?.name || "N/A",
          semester: semesterNumberMap.get(semId)
            ? `Sem ${semesterNumberMap.get(semId)}`
            : "N/A",
          session: student.termId?.name || "N/A",
          configuredTotalFee,
          configuredInstallments: pref?.defaultInstallments || 1,
          totalFeeGenerated: netAmount,
          totalPaid: paidAmount,
          outstanding,
          installmentMonths,
          scholarshipName,
          scholarshipAmount,
          fineCollected,
          installmentsPaid: semChallans.filter(
            (c) => c.isInstallment && c.status === "paid",
          ).length,
          totalInstallments: pref?.defaultInstallments || 1,
          paymentStatus,
          grandTotalPaid: grandPaidMap.get(sid) || 0,
          // Every challan for this student+semester, regardless of type —
          // not `semChallans.length`, which only counts the ones matching
          // whichever fee types were selected for this export.
          challanCount: challanCountMap.get(key) || 0,
        };
      })
      .filter(Boolean);

    // Per-challan detail rows, for the "All Challans" sheet — scoped to
    // each student's own CURRENT semester only, same as the summary sheet
    // above (a student's past-semester challans are real records but don't
    // belong in a report that's meant to reflect where they are now).
    const currentSemesterChallans = challans.filter((c) => {
      const sid = c.studentId?.toString();
      const student = sid ? studentMap.get(sid) : null;
      if (!student) return false;
      const curSemId = (student.semesterId?._id || student.semesterId)?.toString();
      const challanSemId = (c.semesterId?._id || c.semesterId)?.toString();
      return !!curSemId && curSemId === challanSemId;
    });

    const challanRows = currentSemesterChallans.map((c) => {
      const sid = c.studentId?.toString();
      const student = studentMap.get(sid);
      const familyData = familyMap.get(sid);
      return {
        challanNo: c.challanNo,
        studentId: student?.studentId || "N/A",
        studentName: student?.personalInfo?.fullName || "N/A",
        fatherName: familyData?.fatherName || "N/A",
        cnic: student?.personalInfo?.cnic || "N/A",
        phone: student?.personalInfo?.phone || "N/A",
        department: student?.departmentId?.name || "N/A",
        program: student?.programId?.name || "N/A",
        semester: c.semesterId?.number ? `Sem ${c.semesterId.number}` : "N/A",
        session: c.termId?.name || "N/A",
        studentStatus: student?.status
          ? String(student.status).toUpperCase()
          : "N/A",
        challanType: c.challanType
          ? c.challanType.replace(/_/g, " ").toUpperCase()
          : "N/A",
        billingMonth: c.billingMonth || "N/A",
        isInstallment: c.isInstallment ? "Yes" : "No",
        installmentGroup: c.installmentGroup || "N/A",
        originalAmount: c.originalTotal || 0,
        scholarshipName: c.scholarshipId
          ? scholarshipNameMap.get(c.scholarshipId.toString()) || "N/A"
          : "N/A",
        scholarshipAmount: c.scholarshipAmount || 0,
        fineAmount: c.fineAmount || 0,
        netAmount: c.netAmount || 0,
        paidAmount: c.paidAmount || 0,
        remainingAmount: c.remainingAmount || 0,
        generatedDate: c.createdAt,
        dueDate: c.dueDate,
        paidDate: c.paidAt || null,
        status: c.status ? c.status.toLowerCase() : "n/a",
        remarks: c.remarks || "None",
      };
    });

    return { summaryRows, challanRows };
  }

  static async getMonthlyReport(query) {
    try {
      const { month, year, excludeType, departmentId, scope } = query;
      // Powers both the University and College Dashboard's monthly
      // summary — university-only by default silently zeroed out the
      // College dashboard for every HSSC student.
      const validProgramIds = await this.getProgramIdsForScope(
        scope === "college" ? "college" : "university",
      );

      const cleanMonth = safeString(month);
      const cleanYear = safeString(year);
      const m = cleanMonth
        ? parseInt(cleanMonth, 10)
        : new Date().getMonth() + 1;
      const y = cleanYear ? parseInt(cleanYear, 10) : new Date().getFullYear();
      const targetMonth = isNaN(m) ? new Date().getMonth() + 1 : m;
      const targetYear = isNaN(y) ? new Date().getFullYear() : y;

      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 1);

      // A challan is placed in exactly ONE month's report — its own
      // billingMonth when it has one (this is now set correctly for both
      // installment and whole-fee challans), falling back to its Due Date
      // only for older challans that predate billingMonth being tracked.
      // Matching on "billingMonth OR dueDate" (inclusive) let a single
      // challan double-count into two different months' reports whenever
      // its due date landed in a different month than its actual billing
      // month (e.g. billed for August but due in October) — so "current"
      // and "previous" months could both show the same challan.
      // A student who came through the Admission Process but hasn't paid a
      // single fee yet (feeActivated: false — see StudentProfile.js) stays
      // out of the Monthly Finance Report entirely, same rule applied
      // everywhere outside the Admission/Accountant "New Admissions"
      // screens.
      const excludedStudentIds = (
        await StudentProfile.find({ feeActivated: false }).select("_id").lean()
      ).map((s) => s._id);

      const monthName = startDate.toLocaleString("default", { month: "long" });
      // feeActivated only ever flips true once a student's FIRST challan is
      // paid — for a brand-new admission that first challan is their own
      // admission-fee challan. Applying the exclusion above to admission-type
      // challans too meant a still-unpaid ("generated") Admission Fee
      // challan could never appear in this report, since its owner is by
      // definition not yet fee-activated — exactly the "Admission Fee"
      // category filter always coming back empty for anyone who hasn't
      // paid yet. Admission (not readmission) challans are exempt from the
      // exclusion so they show regardless of activation status; every
      // other category still only reports on activated students.
      const admissionTypeClause = {
        $and: [{ challanType: /admission/i }, { challanType: { $not: /readmission/i } }],
      };
      const matchStage = {
        isDeleted: false,
        status: { $ne: "cancelled" },
        programId: { $in: validProgramIds },
        $and: [
          { $or: [{ studentId: { $nin: excludedStudentIds } }, admissionTypeClause] },
          {
            $or: [
              { billingMonth: new RegExp(`^${monthName}$`, "i") },
              {
                $and: [
                  {
                    $or: [
                      { billingMonth: { $exists: false } },
                      { billingMonth: null },
                      { billingMonth: "" },
                    ],
                  },
                  { dueDate: { $gte: startDate, $lt: endDate } },
                ],
              },
            ],
          },
        ],
      };

      const cleanExclude = safeString(excludeType);
      if (cleanExclude)
        matchStage.challanType = { $not: new RegExp(cleanExclude, "i") };
      const cleanDept = safeString(departmentId);
      if (cleanDept)
        matchStage.departmentId = new mongoose.Types.ObjectId(cleanDept);

      const detailedList = await StudentChallan.find(matchStage)
        .populate({
          path: "studentId",
          select: "studentId personalInfo",
          populate: [{ path: "personalInfo", select: "fullName cnic" }],
        })
        .populate({ path: "programId", select: "name _id" })
        .populate({ path: "departmentId", select: "name _id" })
        .populate({ path: "termId", select: "name _id" })
        .populate({ path: "semesterId", select: "name number _id" })
        .sort({ dueDate: 1 })
        .lean();

      // ... The rest of the reporting aggregation remains identical to your code
      // (Mapping family infos, fee structures, and historical paid challans)
      const studentMongoIds = [
        ...new Set(
          detailedList.map((c) => c.studentId?._id?.toString()).filter(Boolean),
        ),
      ];
      const FamilyInfoModel =
        mongoose.models.FamilyInfo || mongoose.model("FamilyInfo");
      const familyInfos = await FamilyInfoModel.find({
        studentId: { $in: studentMongoIds },
      }).lean();
      const familyMap = new Map(
        familyInfos.map((f) => [f.studentId.toString(), f]),
      );

      // An installment challan IS a tuition/Academic fee — just paid in
      // parts instead of one lump sum — not a separate fee category. It
      // used to be checked first and given its own "INSTALLMENT" bucket,
      // which made the exact same underlying fee show up as two different
      // options in the report's Category filter depending on whether that
      // particular student paid tuition in one go or split into
      // installments. Both now map to ACADEMIC.
      const getMappedCategory = (cType) => {
        const type = (cType || "").toLowerCase();
        if (type.includes("hostel")) return "HOSTEL";
        if (type.includes("admission") && !type.includes("readmission"))
          return "ADMISSION";
        if (type.includes("readmission")) return "READMISSION";
        if (type.includes("exam")) return "EXAM";
        if (type.includes("misc") || type.includes("general")) return "MISC";
        if (
          type.includes("tuition") ||
          type.includes("installment") ||
          type.includes("academic")
        )
          return "ACADEMIC";
        return type.replace(/_/g, " ").toUpperCase();
      };

      let summary = {
        totalChallans: 0,
        totalOriginalAmount: 0,
        totalGeneratedAmount: 0,
        totalCollectedAmount: 0,
        totalPendingAmount: 0,
        totalFines: 0,
        totalDiscounts: 0,
        totalScholarships: 0,
        paidCount: 0,
        unpaidCount: 0,
      };

      const details = detailedList.map((c) => {
        const sid = c.studentId?._id?.toString();
        const familyData = familyMap.get(sid);
        const mappedCategory = getMappedCategory(c.challanType);
        let baseAmount = c.originalTotal || 0;
        let actualPaid = c.paidAmount || 0;
        if (c.status === "paid" && actualPaid === 0) actualPaid = c.netAmount;

        summary.totalChallans += 1;
        summary.totalOriginalAmount += baseAmount;
        summary.totalGeneratedAmount += c.netAmount || 0;
        summary.totalCollectedAmount += actualPaid;
        summary.totalPendingAmount += c.remainingAmount || 0;
        summary.totalFines += c.fineAmount || 0;
        summary.totalDiscounts += c.discountAmount || 0;
        summary.totalScholarships += c.scholarshipAmount || 0;
        if (c.status === "paid") summary.paidCount += 1;
        else summary.unpaidCount += 1;

        return {
          id: c._id.toString(),
          challanNo: c.challanNo,
          studentName: c.studentId?.personalInfo?.fullName || "N/A",
          fatherName: familyData?.fatherName || "N/A",
          studentRegNo: c.studentId?.studentId || "N/A",
          program: c.programId?.name || "N/A",
          department: c.departmentId?.name || "N/A",
          session: c.termId?.name || "N/A",
          semester: c.semesterId?.number
            ? `Section ${c.semesterId.number}`
            : "N/A",
          type: mappedCategory,
          // Table display keeps the "paid as an installment" detail even
          // though the Category FILTER (`type` above) now unifies it with
          // ordinary lump-sum Tuition — this is cosmetic nuance, not a
          // different fee category.
          displayType:
            mappedCategory === "ACADEMIC" && c.isInstallment
              ? `Academic (Monthly Part #${c.installmentNumber || "-"})`
              : mappedCategory,
          rawType: c.challanType || "UNKNOWN",
          status: c.status,
          billingMonth: c.billingMonth || "N/A", // ✅
          originalAmount: baseAmount,
          fineAmount: c.fineAmount || 0,
          scholarshipAmount: c.scholarshipAmount || 0,
          discountAmount: c.discountAmount || 0,
          arrears: c.arrears || 0,
          netAmount: c.netAmount || 0,
          paidAmount: actualPaid,
          balance: c.remainingAmount || 0,
          dueDate: c.dueDate,
          paidAt: c.paidAt || null,
          paymentMethod: c.paymentMethod || "N/A",
          paymentReference: c.paymentReference || "N/A",
          generatedOn: c.createdAt,
        };
      });

      return {
        period: {
          month: targetMonth,
          year: targetYear,
          monthName: startDate.toLocaleString("default", { month: "long" }),
        },
        summary,
        details,
      };
    } catch (error) {
      console.error("🔥 CRITICAL DB ERROR in getMonthlyReport: ", error);
      throw error;
    }
  }

  static async createGeneral(data) {
    const { studentRegNo, feeTitle, amount, dueDate, remarks } = data;
    const student = await StudentProfile.findOne({ studentId: studentRegNo });
    if (!student)
      throw new AppError(
        `Student with Reg No '${studentRegNo}' not found.`,
        404,
      );

    const challanNo = await this.generateChallanNo();
    const newChallan = await StudentChallan.create({
      challanNo,
      studentId: student._id,
      programId: student.programId || null,
      departmentId: student.departmentId || null,
      termId: student.termId || null,
      semesterId: student.semesterId || null,
      challanType: "MISC",
      feeDetails: { [feeTitle]: Number(amount) },
      originalTotal: Number(amount),
      netAmount: Number(amount),
      remainingAmount: Number(amount),
      dueDate: new Date(dueDate),
      remarks: remarks || "",
      status: "issued",
      issuedAt: new Date(),
    });

    await newChallan.populate({
      path: "studentId",
      populate: [{ path: "personalInfo" }],
    });
    return newChallan;
  }

  // The very first ADMISSION-type challan generated for a student (by
  // creation order) — used by the admission-acceptance email so it can
  // attach the actual voucher when one already exists, not just a
  // generic promise that one is coming. `readmission` is deliberately
  // excluded from the match since it shares the "admission" substring.
  static async getFirstAdmissionChallan(studentId) {
    return await StudentChallan.findOne({
      studentId,
      isDeleted: false,
      $and: [
        { challanType: /admission/i },
        { challanType: { $not: /readmission/i } },
      ],
    })
      .populate("programId", "name")
      .populate("departmentId", "name")
      .populate("termId", "name")
      .populate("semesterId", "name number")
      .sort({ createdAt: 1 })
      .lean();
  }
}
