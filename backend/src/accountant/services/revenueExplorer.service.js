import mongoose from "mongoose";
import StudentChallan from "../model/StudentChallan.js";
import StudentProfile from "../../student/models/StudentProfile.js";
import StudentFeePreference from "../model/StudentFeePreference.js";
import Department from "../../catalog/model/Department.js";
import Program from "../../catalog/model/Program.js";
import Semester from "../../catalog/model/Semester.js";
import { StudentChallanService } from "./studentChallan.service.js";

const safeObjectId = (id) =>
  id && mongoose.Types.ObjectId.isValid(id)
    ? new mongoose.Types.ObjectId(id)
    : null;

// Same substring-based classification used throughout the rest of this
// module (e.g. the College Print Challans filters, getMonthlyReport) —
// `challanType` is a free-form joined string ("TUITION", "TUITION_EXAM",
// "INSTALLMENT", ...), not a fixed enum, so category detection has to be
// a $switch over substrings rather than an exact match.
const CATEGORY_SWITCH = {
  $switch: {
    branches: [
      {
        case: { $regexMatch: { input: "$challanType", regex: /hostel/i } },
        then: "HOSTEL",
      },
      {
        case: {
          $regexMatch: { input: "$challanType", regex: /readmission/i },
        },
        then: "READMISSION",
      },
      {
        case: {
          $regexMatch: { input: "$challanType", regex: /admission/i },
        },
        then: "ADMISSION",
      },
      {
        case: { $regexMatch: { input: "$challanType", regex: /exam/i } },
        then: "EXAM",
      },
      {
        case: {
          $regexMatch: { input: "$challanType", regex: /misc|general/i },
        },
        then: "MISC",
      },
      {
        case: {
          $regexMatch: {
            input: "$challanType",
            regex: /tuition|installment|academic/i,
          },
        },
        then: "ACADEMIC",
      },
    ],
    default: "OTHER",
  },
};

const CATEGORIES = ["ACADEMIC", "EXAM", "ADMISSION", "READMISSION", "MISC"];

function buildCategoryGroupFields() {
  const fields = {};
  CATEGORIES.forEach((cat) => {
    fields[`${cat}_generated`] = {
      $sum: {
        $cond: [{ $eq: ["$_category", cat] }, "$netAmount", 0],
      },
    };
    fields[`${cat}_collected`] = {
      $sum: {
        $cond: [{ $eq: ["$_category", cat] }, "$paidAmount", 0],
      },
    };
    fields[`${cat}_pending`] = {
      $sum: {
        $cond: [{ $eq: ["$_category", cat] }, "$remainingAmount", 0],
      },
    };
  });
  return fields;
}

function extractCategories(row) {
  const categories = {};
  CATEGORIES.forEach((cat) => {
    categories[cat] = {
      generated: row[`${cat}_generated`] || 0,
      collected: row[`${cat}_collected`] || 0,
      pending: row[`${cat}_pending`] || 0,
    };
  });
  return categories;
}

export class RevenueExplorerService {
  // A challan is placed in exactly ONE month — its own billingMonth when it
  // has one, falling back to Due Date only for challans that predate
  // billingMonth tracking. Same rule as getMonthlyReport, applied here so
  // this new drill-down never double-counts a challan the way an inclusive
  // "billingMonth OR dueDate" match would.
  static buildMonthMatch(month, year) {
    const targetMonth = parseInt(month, 10) || new Date().getMonth() + 1;
    const targetYear = parseInt(year, 10) || new Date().getFullYear();
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 1);
    const monthName = startDate.toLocaleString("default", { month: "long" });

    return {
      period: { month: targetMonth, year: targetYear, monthName },
      match: {
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
    };
  }

  // Department → Program → Semester revenue, one level at a time — each
  // level scoped by its parent's id (departmentId when grouping by
  // program, programId when grouping by semester) and broken down by fee
  // category (Academic/Exam/Admission/Readmission/Misc), not just a single
  // lump total, so the drill-down can show "Tuition vs Exam vs Admission"
  // at every level as requested.
  static async getGroupedRevenue({
    month,
    year,
    groupBy = "department",
    departmentId,
    programId,
    scope = "university",
  }) {
    const validProgramIds = await StudentChallanService.getProgramIdsForScope(
      scope === "college" ? "college" : "university",
    );
    const { period, match: monthMatch } = this.buildMonthMatch(month, year);

    const matchStage = {
      isDeleted: false,
      status: { $ne: "cancelled" },
      programId: { $in: validProgramIds },
      ...monthMatch,
    };
    const cleanDept = safeObjectId(departmentId);
    if (cleanDept) matchStage.departmentId = cleanDept;
    const cleanProg = safeObjectId(programId);
    if (cleanProg) matchStage.programId = cleanProg;

    const groupFieldMap = {
      department: "$departmentId",
      program: "$programId",
      semester: "$semesterId",
    };
    const groupField = groupFieldMap[groupBy] || groupFieldMap.department;

    const rows = await StudentChallan.aggregate([
      { $match: matchStage },
      { $addFields: { _category: CATEGORY_SWITCH } },
      {
        $group: {
          _id: groupField,
          totalGenerated: { $sum: "$netAmount" },
          totalCollected: { $sum: "$paidAmount" },
          totalPending: { $sum: "$remainingAmount" },
          totalChallans: { $sum: 1 },
          paidCount: {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] },
          },
          unpaidCount: {
            $sum: { $cond: [{ $ne: ["$status", "paid"] }, 1, 0] },
          },
          ...buildCategoryGroupFields(),
        },
      },
      { $sort: { totalGenerated: -1 } },
    ]);

    const ids = rows.map((r) => r._id).filter(Boolean);
    let nameMap = new Map();
    if (groupBy === "department") {
      const docs = await Department.find({ _id: { $in: ids } })
        .select("name code")
        .lean();
      nameMap = new Map(docs.map((d) => [d._id.toString(), d]));
    } else if (groupBy === "program") {
      const docs = await Program.find({ _id: { $in: ids } })
        .select("name code departmentId")
        .lean();
      nameMap = new Map(docs.map((d) => [d._id.toString(), d]));
    } else if (groupBy === "semester") {
      const docs = await Semester.find({ _id: { $in: ids } })
        .select("name number programId")
        .lean();
      nameMap = new Map(docs.map((d) => [d._id.toString(), d]));
    }

    const items = rows
      .filter((r) => r._id)
      .map((r) => {
        const doc = nameMap.get(r._id.toString());
        const label =
          groupBy === "semester"
            ? doc?.name || (doc?.number ? `Semester ${doc.number}` : "Unknown")
            : doc?.name || "Unknown";
        return {
          id: r._id,
          name: label,
          code: doc?.code || null,
          number: doc?.number || null,
          totalGenerated: r.totalGenerated || 0,
          totalCollected: r.totalCollected || 0,
          totalPending: r.totalPending || 0,
          totalChallans: r.totalChallans || 0,
          paidCount: r.paidCount || 0,
          unpaidCount: r.unpaidCount || 0,
          categories: extractCategories(r),
        };
      });

    // Challans whose department/program/semester reference is missing or
    // was deleted still get counted (visible as "Unassigned") instead of
    // silently vanishing from the totals — a data-quality signal, not a
    // bug to hide.
    const unassignedTotal = rows
      .filter((r) => !r._id)
      .reduce((acc, r) => acc + (r.totalGenerated || 0), 0);

    return { period, items, unassignedTotal };
  }

  // The bottom of the drill-down — every student in one semester, with
  // their own challans for the selected month and their installment plan
  // status, so staff can go from "this semester under-collected" straight
  // down to exactly which students are behind, without a separate lookup.
  static async getSemesterStudents({ semesterId, month, year }) {
    const cleanSem = safeObjectId(semesterId);
    if (!cleanSem) return { period: null, students: [] };

    const { period, match: monthMatch } = this.buildMonthMatch(month, year);

    const students = await StudentProfile.find({ semesterId: cleanSem })
      .populate("personalInfo", "fullName phone email")
      .populate("programId", "name")
      .populate("departmentId", "name")
      .select("studentId personalInfo programId departmentId semesterId status")
      .lean();

    if (!students.length) return { period, students: [] };

    const studentIds = students.map((s) => s._id);

    const FamilyInfoModel =
      mongoose.models.FamilyInfo || mongoose.model("FamilyInfo");
    const [familyInfos, challans, preferences] = await Promise.all([
      FamilyInfoModel.find({ studentId: { $in: studentIds } }).lean(),
      StudentChallan.find({
        studentId: { $in: studentIds },
        semesterId: cleanSem,
        isDeleted: false,
        status: { $ne: "cancelled" },
        ...monthMatch,
      })
        .select(
          "studentId challanNo challanType status netAmount paidAmount remainingAmount dueDate billingMonth isInstallment installmentNumber",
        )
        .lean(),
      StudentFeePreference.find({
        studentId: { $in: studentIds },
        semesterId: cleanSem,
      })
        .select("studentId defaultInstallments customMonths autoSplit")
        .lean(),
    ]);

    const familyMap = new Map(
      familyInfos.map((f) => [f.studentId.toString(), f]),
    );
    const challansByStudent = new Map();
    challans.forEach((c) => {
      const key = c.studentId.toString();
      if (!challansByStudent.has(key)) challansByStudent.set(key, []);
      challansByStudent.get(key).push(c);
    });
    const prefMap = new Map(
      preferences.map((p) => [p.studentId.toString(), p]),
    );

    const result = students.map((s) => {
      const key = s._id.toString();
      const studentChallans = challansByStudent.get(key) || [];
      const pref = prefMap.get(key) || null;
      const totalGenerated = studentChallans.reduce(
        (a, c) => a + (c.netAmount || 0),
        0,
      );
      const totalCollected = studentChallans.reduce(
        (a, c) => a + (c.paidAmount || 0),
        0,
      );
      return {
        studentId: s._id,
        regNo: s.studentId,
        fullName: s.personalInfo?.fullName || "N/A",
        fatherName: familyMap.get(key)?.fatherName || "N/A",
        program: s.programId?.name || "N/A",
        department: s.departmentId?.name || "N/A",
        status: s.status,
        hasInstallmentPlan: Boolean(pref && pref.defaultInstallments > 1),
        installmentPlan: pref
          ? {
              count: pref.defaultInstallments,
              months: pref.customMonths || [],
            }
          : null,
        challansThisMonth: studentChallans,
        totalGenerated,
        totalCollected,
        totalPending: Math.max(0, totalGenerated - totalCollected),
      };
    });

    return { period, students: result };
  }
}
