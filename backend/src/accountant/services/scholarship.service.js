import ScholarshipPlan from "../model/ScholarshipPlan.js";
import StudentScholarship from "../model/StudentScholarship.js";
import StudentFeeStructure from "../model/StudentFeeStructure.js";
import StudentProfile from "../../student/models/StudentProfile.js";
import PersonalInfo from "../../student/models/PersonalInfo.js";
import { AppError } from "../middleware/errorHandler.js";

export class ScholarshipService {
  // ============ SCHOLARSHIP PLANS ============
  static calculateScholarshipAmount(totalFee, plan) {
    if (!plan) return 0;
    let discount = 0;
    if (plan.type === "fixed") {
      discount = plan.maxAmount || 0;
    } else if (plan.type === "percentage") {
      const percentage = Math.min(Math.max(plan.maxPercentage || 0, 0), 100);
      discount = (totalFee * percentage) / 100;
    }
    return discount;
  }

  // `semesterId` is optional and backward-compatible: when omitted, behaves
  // exactly as before (every caller that hasn't been updated for selective
  // semester scoping is unaffected). When provided, an application whose
  // OWN semesterScope is "selective" only matches if semesterId is one of
  // its semesterIds — an "all" scope (the default) always matches.
  static async getStudentActiveScholarship(studentId, termId, semesterId) {
    // 1. Find APPROVED applications for this student
    const applications = await StudentScholarship.find({
      studentId: studentId,
      status: "approved",
    }).populate("scholarshipPlanId");

    // 2. Filter in memory: Find one that matches the requested Term
    const matchedApp = applications.find((app) => {
      const plan = app.scholarshipPlanId;
      if (!plan || !plan.active) return false;

      if (semesterId && app.semesterScope === "selective") {
        const inScope = (app.semesterIds || []).some(
          (s) => s.toString() === semesterId.toString(),
        );
        if (!inScope) return false;
      }

      // CHECK: Does the PLAN belong to this term?
      // (Assuming Plan has termId, or acts as a general scholarship valid for dates)

      // Option A: Plan is specific to a term
      if (plan.termId && plan.termId.toString() === termId.toString()) {
        return true;
      }

      // Option B: Plan is date-based (if termId is null in plan)
      const now = new Date();
      const validDate = !plan.validTo || new Date(plan.validTo) >= now;

      return !plan.termId && validDate;
    });

    if (!matchedApp) return null;

    return {
      applicationId: matchedApp._id,
      plan: matchedApp.scholarshipPlanId,
    };
  }

  // Resolves the scholarship that would actually apply to this student's
  // CURRENT semester tuition — same tuition (ACADEMIC) fee lookup and
  // percentage/fixed calculation studentChallan.service.js's generate()
  // uses when actually issuing a challan, so the Student Profile/Dossier
  // always shows exactly what a new challan would reflect. Re-resolved
  // live from the student's current semesterId/termId every call, so a
  // promotion (which only changes semesterId, never the scholarship
  // record itself) is picked up automatically with no extra code.
  static async getScholarshipPreview(studentId) {
    const student = await StudentProfile.findById(studentId)
      .select("semesterId termId")
      .lean();

    const empty = {
      hasScholarship: false,
      plan: null,
      tuitionPortion: 0,
      scholarshipAmount: 0,
      netTuition: 0,
    };
    if (!student) return empty;

    const sSemId = student.semesterId;
    const termId = student.termId;

    // Tuition (ACADEMIC) portion for the student's current semester — same
    // lookup + legacy-untagged fallback used at real challan generation.
    let tuitionPortion = 0;
    const q = { studentId, category: "ACADEMIC", isActive: true };
    if (sSemId) q.semesterId = sSemId;
    else if (termId) q.termId = termId;
    let fs = await StudentFeeStructure.findOne(q);
    if (!fs && sSemId) {
      const legacyCandidates = await StudentFeeStructure.find({
        studentId,
        category: "ACADEMIC",
        isActive: true,
        semesterId: { $in: [null, undefined] },
      });
      if (legacyCandidates.length === 1) fs = legacyCandidates[0];
    }
    if (fs) {
      tuitionPortion =
        fs.feeItems?.length > 0
          ? fs.feeItems.reduce((sum, item) => sum + (item.amount || 0), 0)
          : fs.totalAmount || 0;
    }

    if (!termId) return { ...empty, tuitionPortion, netTuition: tuitionPortion };

    const scholarshipData = await this.getStudentActiveScholarship(studentId, termId, sSemId);
    if (!scholarshipData) {
      return { ...empty, tuitionPortion, netTuition: tuitionPortion };
    }

    const plan = scholarshipData.plan;
    let scholarshipAmount = Math.min(
      this.calculateScholarshipAmount(tuitionPortion, plan),
      tuitionPortion,
    );

    return {
      hasScholarship: true,
      applicationId: scholarshipData.applicationId,
      plan: {
        _id: plan._id,
        title: plan.title,
        type: plan.type,
        maxPercentage: plan.maxPercentage,
        maxAmount: plan.maxAmount,
      },
      tuitionPortion,
      scholarshipAmount,
      netTuition: Math.max(0, tuitionPortion - scholarshipAmount),
    };
  }

  // Standalone tuition lookup for the Scholarship Assignment/Approval
  // flow — the same ACADEMIC fee lookup getScholarshipPreview uses, but
  // returned plain (no scholarship math) so the accountant can see a
  // student's real tuition amount, and whether it's even set up yet,
  // BEFORE a scholarship has necessarily been applied.
  static async getStudentFeeContext(studentId) {
    const student = await StudentProfile.findById(studentId)
      .select("semesterId termId")
      .populate("semesterId", "number")
      .lean();

    const empty = {
      studentId,
      termId: null,
      semesterId: null,
      semesterNumber: null,
      tuitionAmount: 0,
      hasFeeSetup: false,
    };
    if (!student) return empty;

    const sSemId = student.semesterId?._id || student.semesterId;
    const termId = student.termId;

    let tuitionAmount = 0;
    let hasFeeSetup = false;
    const q = { studentId, category: "ACADEMIC", isActive: true };
    if (sSemId) q.semesterId = sSemId;
    else if (termId) q.termId = termId;
    let fs = await StudentFeeStructure.findOne(q);
    if (!fs && sSemId) {
      const legacyCandidates = await StudentFeeStructure.find({
        studentId,
        category: "ACADEMIC",
        isActive: true,
        semesterId: { $in: [null, undefined] },
      });
      if (legacyCandidates.length === 1) fs = legacyCandidates[0];
    }
    if (fs) {
      hasFeeSetup = true;
      tuitionAmount =
        fs.feeItems?.length > 0
          ? fs.feeItems.reduce((sum, item) => sum + (item.amount || 0), 0)
          : fs.totalAmount || 0;
    }

    return {
      studentId,
      termId,
      semesterId: sSemId || null,
      semesterNumber: student.semesterId?.number ?? null,
      tuitionAmount,
      hasFeeSetup,
    };
  }

  // Bulk version of getStudentActiveScholarship — used by exports/rosters
  // that need "does this student have an active scholarship, and what's
  // it called" for a whole batch at once instead of one DB round trip per
  // student. Each student is matched against THEIR OWN current termId
  // (same rule as getStudentActiveScholarship: plan.termId match, or a
  // date-based fallback for term-agnostic plans), so a plan tied to a
  // different term than the student is currently in correctly doesn't
  // count. Returns a Map keyed by studentId (string) → { hasScholarship,
  // scholarshipName } — every requested id is present, defaulting to
  // { hasScholarship: false, scholarshipName: null } when nothing matches.
  static async getBulkActiveScholarships(studentIds) {
    const result = new Map(
      studentIds.map((id) => [
        String(id),
        { hasScholarship: false, scholarshipName: null },
      ]),
    );
    if (!studentIds.length) return result;

    const [students, applications] = await Promise.all([
      StudentProfile.find({ _id: { $in: studentIds } })
        .select("termId semesterId")
        .lean(),
      StudentScholarship.find({
        studentId: { $in: studentIds },
        status: "approved",
      })
        .populate("scholarshipPlanId")
        .lean(),
    ]);

    const termByStudent = new Map(
      students.map((s) => [String(s._id), s.termId ? String(s.termId) : null]),
    );
    const semesterByStudent = new Map(
      students.map((s) => [
        String(s._id),
        s.semesterId ? String(s.semesterId) : null,
      ]),
    );
    const appsByStudent = new Map();
    applications.forEach((app) => {
      const sid = String(app.studentId);
      if (!appsByStudent.has(sid)) appsByStudent.set(sid, []);
      appsByStudent.get(sid).push(app);
    });

    const now = new Date();
    for (const sid of result.keys()) {
      const termId = termByStudent.get(sid);
      if (!termId) continue;
      const semesterId = semesterByStudent.get(sid);
      const apps = appsByStudent.get(sid) || [];
      const matched = apps.find((app) => {
        const plan = app.scholarshipPlanId;
        if (!plan || !plan.active) return false;
        if (semesterId && app.semesterScope === "selective") {
          const inScope = (app.semesterIds || []).some(
            (s) => String(s) === semesterId,
          );
          if (!inScope) return false;
        }
        if (plan.termId && String(plan.termId) === termId) return true;
        const validDate = !plan.validTo || new Date(plan.validTo) >= now;
        return !plan.termId && validDate;
      });
      if (matched) {
        result.set(sid, {
          hasScholarship: true,
          scholarshipName: matched.scholarshipPlanId?.title || "N/A",
        });
      }
    }

    return result;
  }

  /**
   * For Bulk Challan: Get scholarships where the PLAN matches the term
   */
  static async getBatchScholarshipsForTerm(termId) {
    // 1. We need to find Plans that belong to this Term first
    const relevantPlans = await ScholarshipPlan.find({
      termId: termId,
      active: true,
    }).select("_id");

    const planIds = relevantPlans.map((p) => p._id);

    // 2. Find Approved Applications for these specific Plans
    const applications = await StudentScholarship.find({
      scholarshipPlanId: { $in: planIds },
      status: "approved",
    }).populate("scholarshipPlanId");

    const scholarshipMap = new Map();

    for (const app of applications) {
      // Map StudentID -> { applicationId, planData }
      scholarshipMap.set(app.studentId.toString(), {
        applicationId: app._id,
        plan: app.scholarshipPlanId,
      });
    }

    return scholarshipMap;
  }

  static async createPlan(data) {
    const existingPlan = await ScholarshipPlan.findOne({
      title: { $regex: new RegExp(`^${data.title}$`, "i") },
    });

    if (existingPlan) {
      throw new AppError(
        "Scholarship plan with this title already exists",
        400
      );
    }

    // Validate type-specific fields
    if (data.type === "fixed" && !data.maxAmount) {
      throw new AppError(
        "maxAmount is required for fixed type scholarships",
        400
      );
    }

    if (data.type === "percentage" && !data.maxPercentage) {
      throw new AppError(
        "maxPercentage is required for percentage type scholarships",
        400
      );
    }

    // Validate dates
    if (
      data.validTo &&
      data.validFrom &&
      new Date(data.validTo) < new Date(data.validFrom)
    ) {
      throw new AppError("validTo must be later than validFrom", 400);
    }

    const plan = await ScholarshipPlan.create(data);
    return plan.populate("createdBy termId", "name email title");
  }

  static async getPlans(filters = {}) {
    const { page = 1, limit = 10, search, active, ...query } = filters;
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = {};
    if (search) {
      searchQuery.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Handle active filter
    if (active !== undefined) {
      searchQuery.active = active === "true";
    }

    // Combine queries
    const finalQuery = { ...query, ...searchQuery };

    const plans = await ScholarshipPlan.find(finalQuery)
      .populate("createdBy", "name email")
      .populate("termId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ScholarshipPlan.countDocuments(finalQuery);

    // How many students are currently linked to each plan — "properly show
    // the plan" needs this visible context, not just the grant value.
    const planIds = plans.map((p) => p._id);
    const counts = await StudentScholarship.aggregate([
      { $match: { scholarshipPlanId: { $in: planIds } } },
      {
        $group: {
          _id: "$scholarshipPlanId",
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
        },
      },
    ]);
    const countsByPlan = new Map(
      counts.map((c) => [c._id.toString(), c]),
    );
    const dataWithCounts = plans.map((p) => {
      const c = countsByPlan.get(p._id.toString());
      const obj = p.toObject();
      obj.totalAssignments = c?.total || 0;
      obj.activeAssignments = c?.active || 0;
      return obj;
    });

    return {
      data: dataWithCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getPlanById(id) {
    const plan = await ScholarshipPlan.findById(id)
      .populate("createdBy", "name email")
      .populate("termId", "name");

    if (!plan) {
      throw new AppError("Scholarship plan not found", 404);
    }

    return plan;
  }

  static async updatePlan(id, data) {
    const plan = await ScholarshipPlan.findById(id);

    if (!plan) {
      throw new AppError("Scholarship plan not found", 404);
    }

    // Check if title is being changed and if it already exists
    if (data.title && data.title !== plan.title) {
      const existingPlan = await ScholarshipPlan.findOne({
        title: { $regex: new RegExp(`^${data.title}$`, "i") },
        _id: { $ne: id },
      });

      if (existingPlan) {
        throw new AppError(
          "Scholarship plan with this title already exists",
          400
        );
      }
    }

    // Validate type-specific fields
    if (data.type === "fixed" && !data.maxAmount && plan.type !== "fixed") {
      throw new AppError(
        "maxAmount is required for fixed type scholarships",
        400
      );
    }

    if (
      data.type === "percentage" &&
      !data.maxPercentage &&
      plan.type !== "percentage"
    ) {
      throw new AppError(
        "maxPercentage is required for percentage type scholarships",
        400
      );
    }

    // Validate dates
    if (data.validTo && (data.validFrom || plan.validFrom)) {
      const validFrom = data.validFrom
        ? new Date(data.validFrom)
        : plan.validFrom;
      if (new Date(data.validTo) < validFrom) {
        throw new AppError("validTo must be later than validFrom", 400);
      }
    }

    Object.assign(plan, data);
    await plan.save();

    return plan.populate("createdBy termId", "name email title");
  }

  static async deletePlan(id) {
    const plan = await ScholarshipPlan.findById(id);

    if (!plan) {
      throw new AppError("Scholarship plan not found", 404);
    }

    // Check if there are any applications for this plan
    const applications = await StudentScholarship.countDocuments({
      scholarshipPlanId: id,
    });
    if (applications > 0) {
      throw new AppError("Cannot delete plan with existing applications", 400);
    }

    await plan.deleteOne();
  }

  static async togglePlanStatus(id, active) {
    const plan = await ScholarshipPlan.findById(id);

    if (!plan) {
      throw new AppError("Scholarship plan not found", 404);
    }

    plan.active = active;
    await plan.save();

    return plan.populate("createdBy termId", "name email title");
  }

  // ============ STUDENT APPLICATIONS ============

  static async applyForScholarship(data) {
    const {
      studentId,
      scholarshipPlanId,
      semesterScope = "all",
      semesterIds = [],
    } = data;

    // The model used to declare this compound index as unique; Mongoose
    // never drops a physical index just because the schema definition
    // changed, so the old constraint would otherwise keep blocking the
    // reactivate-on-reapply path below even after this fix ships.
    try {
      await StudentScholarship.collection.dropIndex(
        "studentId_1_scholarshipPlanId_1",
      );
    } catch (e) {}

    // Validate scholarship plan
    const scholarshipPlan = await ScholarshipPlan.findById(scholarshipPlanId);
    if (!scholarshipPlan) {
      throw new AppError("Scholarship plan not found", 404);
    }

    if (!scholarshipPlan.active) {
      throw new AppError("Scholarship plan is not active", 400);
    }

    // Check validity dates
    const now = new Date();
    if (
      scholarshipPlan.validFrom &&
      new Date(scholarshipPlan.validFrom) > now
    ) {
      throw new AppError("Scholarship plan has not started yet", 400);
    }

    if (scholarshipPlan.validTo && new Date(scholarshipPlan.validTo) < now) {
      throw new AppError("Scholarship plan has expired", 400);
    }

    if (semesterScope === "selective" && (!semesterIds || semesterIds.length === 0)) {
      throw new AppError(
        "Select at least one semester, or choose 'All Semesters'.",
        400,
      );
    }

    // A student can only ever have ONE row per plan — the compound index
    // (non-unique, see the model) exists for query speed, not uniqueness;
    // this findOne + reactivate is what actually enforces it. A rejected
    // or revoked application is REUSED (reset to pending) instead of a
    // second document being inserted, which is what "Re-apply" needs —
    // without this, re-applying to the same plan after a rejection throws
    // a duplicate-key error since the (studentId, scholarshipPlanId) pair
    // never changes.
    const existingApplication = await StudentScholarship.findOne({
      studentId,
      scholarshipPlanId,
    });

    if (existingApplication) {
      if (["pending", "approved"].includes(existingApplication.status)) {
        throw new AppError(
          "You already have an active application for this scholarship",
          400,
        );
      }

      existingApplication.status = "pending";
      existingApplication.appliedAt = now;
      existingApplication.approvedAt = undefined;
      existingApplication.approvedBy = undefined;
      existingApplication.rejectionReason = undefined;
      existingApplication.semesterScope = semesterScope;
      existingApplication.semesterIds = semesterScope === "selective" ? semesterIds : [];
      await existingApplication.save();

      return await StudentScholarship.findById(existingApplication._id)
        .populate("scholarshipPlanId", "title type maxAmount maxPercentage")
        .populate("approvedBy", "name email");
    }

    // Create application
    const application = await StudentScholarship.create({
      studentId,
      scholarshipPlanId,
      status: "pending",
      semesterScope,
      semesterIds: semesterScope === "selective" ? semesterIds : [],
    });

    // Populate and return
    return await StudentScholarship.findById(application._id)
      .populate("scholarshipPlanId", "title type maxAmount maxPercentage")
      .populate("approvedBy", "name email");
  }

  static async getStudentApplications(filters = {}) {
    const {
      page = 1,
      limit = 10,
      studentId,
      scholarshipPlanId,
      status,
      search,
      ...query
    } = filters;
    const skip = (page - 1) * limit;

    // Build query
    const searchQuery = { ...query };
    if (studentId) searchQuery.studentId = studentId;
    if (scholarshipPlanId) searchQuery.scholarshipPlanId = scholarshipPlanId;
    if (status) searchQuery.status = status;

    // `search` matches by student name (PersonalInfo) or registration
    // number (StudentProfile.studentId, e.g. "d005bsn01226510") — neither
    // field lives on StudentScholarship itself, so resolve to a set of
    // matching StudentProfile _ids first, same pattern used by the main
    // student directory search (studentController.getAllStudents).
    if (search && search.trim()) {
      const term = search.trim();
      const [matchingProfiles, matchingPersonalInfos] = await Promise.all([
        StudentProfile.find({ studentId: { $regex: term, $options: "i" } })
          .select("_id")
          .lean(),
        PersonalInfo.find({
          $or: [
            { fullName: { $regex: term, $options: "i" } },
            { cnic: { $regex: term, $options: "i" } },
          ],
        })
          .select("studentId")
          .lean(),
      ]);
      const matchedIds = new Set([
        ...matchingProfiles.map((p) => p._id.toString()),
        ...matchingPersonalInfos
          .filter((p) => p.studentId)
          .map((p) => p.studentId.toString()),
      ]);
      searchQuery.studentId = { $in: Array.from(matchedIds) };
    }

    // Get applications with basic population
    const applications = await StudentScholarship.find(searchQuery)
      .populate("scholarshipPlanId", "title type maxAmount maxPercentage")
      .populate("approvedBy", "name email")
      .populate("semesterIds", "number")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get all unique student IDs from applications
    const studentIds = applications
      .map((app) => app.studentId)
      .filter((id) => id) // Remove null/undefined
      .map((id) => id.toString());

    // If no student IDs, return empty transformed data
    if (studentIds.length === 0) {
      const total = await StudentScholarship.countDocuments(searchQuery);
      return {
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    // Fetch personal info for all students
    const personalInfos = await PersonalInfo.find({
      studentId: { $in: studentIds },
    });

    // Create a map for quick lookup: studentId -> personalInfo
    const personalInfoMap = {};
    personalInfos.forEach((info) => {
      personalInfoMap[info.studentId.toString()] = info.toObject();
    });

    // Academic context (department/program/semester) AND real tuition/
    // deduction amounts — the list previously showed only a name/CNIC/
    // contact card with no indication of where the student studies or
    // what the scholarship is actually worth for them. Only ever a page's
    // worth of students (≤ `limit`), so this is a couple of cheap batched
    // queries, not one round trip per row.
    const [studentProfiles, feeStructures] = await Promise.all([
      StudentProfile.find({ _id: { $in: studentIds } })
        .select("studentId departmentId programId semesterId")
        .populate("departmentId", "name")
        .populate("programId", "name")
        .populate("semesterId", "number")
        .lean(),
      StudentFeeStructure.find({
        studentId: { $in: studentIds },
        category: "ACADEMIC",
        isActive: true,
      }).lean(),
    ]);

    const profileMap = new Map(
      studentProfiles.map((p) => [p._id.toString(), p]),
    );
    const feesByStudent = new Map();
    feeStructures.forEach((fs) => {
      const sid = fs.studentId.toString();
      if (!feesByStudent.has(sid)) feesByStudent.set(sid, []);
      feesByStudent.get(sid).push(fs);
    });

    const tuitionAmountFor = (sid, semesterId) => {
      const candidates = feesByStudent.get(sid) || [];
      const semMatch = semesterId
        ? candidates.find(
            (fs) => fs.semesterId && fs.semesterId.toString() === semesterId.toString(),
          )
        : null;
      // Same legacy-untagged fallback used elsewhere in this module — if
      // there's exactly one fee record with no semesterId at all, treat
      // it as this student's tuition rather than showing nothing.
      const legacy =
        !semMatch && candidates.length === 1 && !candidates[0].semesterId
          ? candidates[0]
          : null;
      const fs = semMatch || legacy;
      if (!fs) return 0;
      return fs.feeItems?.length > 0
        ? fs.feeItems.reduce((sum, item) => sum + (item.amount || 0), 0)
        : fs.totalAmount || 0;
    };

    // Transform applications with student data
    const transformedApplications = applications.map((app) => {
      const application = app.toObject();
      const sid = application.studentId.toString();
      const studentPersonalInfo = personalInfoMap[sid];
      const profile = profileMap.get(sid);

      if (studentPersonalInfo) {
        // Add student data from PersonalInfo
        application.student = {
          _id: application.studentId,
          fullName: studentPersonalInfo.fullName,
          cnic: studentPersonalInfo.cnic,
          phone: studentPersonalInfo.phone,
          email: studentPersonalInfo.email,
          dob: studentPersonalInfo.dob,
          gender: studentPersonalInfo.gender,
          currentAddress: studentPersonalInfo.currentAddress,
          permanentAddress: studentPersonalInfo.permanentAddress,
        };
      } else {
        // In case personal info is not found (shouldn't happen but good to handle)
        application.student = {
          _id: application.studentId,
          fullName: "Not Available",
          email: "Not Available",
          // Other fields will be undefined
        };
      }

      application.student.regNo = profile?.studentId || null;
      application.student.department = profile?.departmentId?.name || null;
      application.student.program = profile?.programId?.name || null;
      application.student.semesterNumber = profile?.semesterId?.number ?? null;

      const tuitionAmount = tuitionAmountFor(sid, profile?.semesterId?._id);
      const plan = application.scholarshipPlanId;
      let scholarshipAmount = 0;
      if (tuitionAmount > 0 && plan) {
        scholarshipAmount =
          plan.type === "fixed"
            ? Math.min(plan.maxAmount || 0, tuitionAmount)
            : Math.min(
                Math.round((tuitionAmount * Math.min(plan.maxPercentage || 0, 100)) / 100),
                tuitionAmount,
              );
      }
      application.tuitionAmount = tuitionAmount;
      application.scholarshipAmount = scholarshipAmount;
      application.netAmount = Math.max(0, tuitionAmount - scholarshipAmount);
      application.hasFeeSetup = tuitionAmount > 0;

      return application;
    });

    const total = await StudentScholarship.countDocuments(searchQuery);

    return {
      data: transformedApplications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getApplicationById(id) {
    const application = await StudentScholarship.findById(id)
      .populate("studentId", "name email rollNumber")
      .populate("scholarshipPlanId", "title type maxAmount maxPercentage")
      .populate("approvedBy", "name email")
      .populate("semesterIds", "number");

    if (!application) {
      throw new AppError("Scholarship application not found", 404);
    }

    return application;
  }

  static async approveApplication(id, data) {
    const { approvedAmount, approvedBy, ...rest } = data;

    const application = await StudentScholarship.findById(id);
    if (!application) {
      throw new AppError("Scholarship application not found", 404);
    }

    if (application.status !== "pending") {
      throw new AppError("Only pending applications can be approved", 400);
    }

    // Get scholarship plan for validation
    const scholarshipPlan = await ScholarshipPlan.findById(
      application.scholarshipPlanId
    );
    if (!scholarshipPlan) {
      throw new AppError("Scholarship plan not found", 404);
    }

    // Validate approved amount
    if (approvedAmount) {
      if (
        scholarshipPlan.type === "fixed" &&
        approvedAmount > scholarshipPlan.maxAmount
      ) {
        throw new AppError(
          `Approved amount cannot exceed ${scholarshipPlan.maxAmount}`,
          400
        );
      }
      if (approvedAmount > application.appliedAmount) {
        throw new AppError("Approved amount cannot exceed applied amount", 400);
      }
      application.approvedAmount = approvedAmount;
    } else {
      // If no amount specified, approve the full applied amount
      application.approvedAmount = application.appliedAmount;
    }

    application.status = "approved";
    application.approvedAt = new Date();
    application.approvedBy = approvedBy;

    Object.assign(application, rest);

    await application.save();

    return await this.getApplicationById(id);
  }

  static async rejectApplication(id, data) {
    const { rejectionReason } = data;

    const application = await StudentScholarship.findById(id);
    if (!application) {
      throw new AppError("Scholarship application not found", 404);
    }

    if (application.status !== "pending") {
      throw new AppError("Only pending applications can be rejected", 400);
    }

    if (!rejectionReason) {
      throw new AppError("Rejection reason is required", 400);
    }

    application.status = "rejected";
    application.rejectionReason = rejectionReason;
    await application.save();

    return await this.getApplicationById(id);
  }

  static async revokeApplication(id, data) {
    const { rejectionReason } = data;

    const application = await StudentScholarship.findById(id);
    if (!application) {
      throw new AppError("Scholarship application not found", 404);
    }

    if (application.status !== "approved") {
      throw new AppError("Only approved applications can be revoked", 400);
    }

    if (!rejectionReason) {
      throw new AppError("Revocation reason is required", 400);
    }

    application.status = "revoked";
    application.rejectionReason = rejectionReason;
    await application.save();

    return await this.getApplicationById(id);
  }

  static async getApplicationsByStudent(studentId, filters = {}) {
    const { status } = filters;

    const query = { studentId };
    if (status) query.status = status;

    const applications = await StudentScholarship.find(query)
      .populate("scholarshipPlanId", "title type maxAmount maxPercentage")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });

    return applications;
  }

  // ============ UTILITIES ============

  static async checkEligibility(studentId, scholarshipPlanId) {
    const scholarshipPlan = await ScholarshipPlan.findById(scholarshipPlanId);
    if (!scholarshipPlan) {
      throw new AppError("Scholarship plan not found", 404);
    }

    // Check if plan is active
    if (!scholarshipPlan.active) {
      return {
        isEligible: false,
        reason: "Scholarship plan is not active",
      };
    }

    // Check validity dates
    const now = new Date();
    if (
      scholarshipPlan.validFrom &&
      new Date(scholarshipPlan.validFrom) > now
    ) {
      return {
        isEligible: false,
        reason: "Scholarship has not started yet",
      };
    }

    if (scholarshipPlan.validTo && new Date(scholarshipPlan.validTo) < now) {
      return {
        isEligible: false,
        reason: "Scholarship has expired",
      };
    }

    // Check if student already has an active application
    const existingApplication = await StudentScholarship.findOne({
      studentId,
      scholarshipPlanId,
      status: { $in: ["pending", "approved"] },
    });

    if (existingApplication) {
      return {
        isEligible: false,
        reason: "Already have an active application for this scholarship",
      };
    }

    // Additional eligibility checks can be added here
    // For example: CGPA requirements, department restrictions, etc.

    return {
      isEligible: true,
      maxAmount: scholarshipPlan.maxAmount,
      maxPercentage: scholarshipPlan.maxPercentage,
      type: scholarshipPlan.type,
      planDetails: {
        title: scholarshipPlan.title,
        description: scholarshipPlan.description,
      },
    };
  }

  static async getAvailablePlans(studentId, filters = {}) {
    const { active = true } = filters;

    const query = { active };

    // Check validity dates
    const now = new Date();
    query.$and = [];

    // Plan should be valid (validFrom <= now <= validTo or no dates specified)
    query.$and.push({
      $or: [{ validFrom: { $lte: now } }, { validFrom: null }],
    });

    query.$and.push({
      $or: [{ validTo: { $gte: now } }, { validTo: null }],
    });

    const plans = await ScholarshipPlan.find(query)
      .populate("termId", "name")
      .sort({ createdAt: -1 });

    // Check eligibility for each plan
    const availablePlans = await Promise.all(
      plans.map(async (plan) => {
        const eligibility = await this.checkEligibility(studentId, plan._id);
        return {
          ...plan.toObject(),
          eligibility,
        };
      })
    );

    // Filter out plans where student is not eligible
    return availablePlans.filter((plan) => plan.eligibility.isEligible);
  }

  static async getStatistics() {
    const [
      totalPlans,
      activePlans,
      totalApplications,
      pendingApplications,
      approvedApplications,
      totalApprovedAmount,
      totalAppliedAmount,
    ] = await Promise.all([
      ScholarshipPlan.countDocuments(),
      ScholarshipPlan.countDocuments({ active: true }),
      StudentScholarship.countDocuments(),
      StudentScholarship.countDocuments({ status: "pending" }),
      StudentScholarship.countDocuments({ status: "approved" }),
      StudentScholarship.aggregate([
        { $match: { status: "approved" } },
        { $group: { _id: null, total: { $sum: "$approvedAmount" } } },
      ]),
      StudentScholarship.aggregate([
        { $match: { status: "approved" } },
        { $group: { _id: null, total: { $sum: "$appliedAmount" } } },
      ]),
    ]);

    const percentageType = await ScholarshipPlan.countDocuments({
      type: "percentage",
    });
    const fixedType = await ScholarshipPlan.countDocuments({ type: "fixed" });

    // Recent activity
    const recentApplications = await StudentScholarship.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("studentId", "name")
      .populate("scholarshipPlanId", "title");

    return {
      plans: {
        total: totalPlans,
        active: activePlans,
        inactive: totalPlans - activePlans,
        byType: {
          percentage: percentageType,
          fixed: fixedType,
        },
      },
      applications: {
        total: totalApplications,
        byStatus: {
          pending: pendingApplications,
          approved: approvedApplications,
          rejected: await StudentScholarship.countDocuments({
            status: "rejected",
          }),
          revoked: await StudentScholarship.countDocuments({
            status: "revoked",
          }),
        },
        totalAppliedAmount: totalAppliedAmount[0]?.total || 0,
        totalApprovedAmount: totalApprovedAmount[0]?.total || 0,
      },
      recentActivity: recentApplications,
    };
  }
}
