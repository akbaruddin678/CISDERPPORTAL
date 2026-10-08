import { asyncHandler } from "../../core/utils/asyncHandler.js";
import StudentProfile from "../../student/models/StudentProfile.js";
import Program from "../../catalog/model/Program.js";
import Department from "../../catalog/model/Department.js";
import Admission from "../../admissions/model/Admission.js";
import AdmissionCampaign from "../../admissions/model/AdmissionCampaign.js";
import StaffProfile from "../../staff/models/StaffProfile.js";
import ExamMarksSubmission from "../../exam/models/ExamMarksSubmission.js";
import GraduationClearance from "../../graduation/models/GraduationClearance.js";
import { StudentChallanService } from "../../accountant/services/studentChallan.service.js";

// ============================================================================
// One read-only executive rollup for the VC portal — admissions funnel +
// university headcounts + what's waiting on the VC's own desk. Fee
// collection detail is deliberately NOT duplicated here: the frontend calls
// the existing /api/fee-analytics endpoint directly (already open to any
// authenticated user, and already the single real source for that data —
// see finance/controller/feeAnalyticsController.js).
// ============================================================================
export const getVcDashboardStats = asyncHandler(async (req, res) => {
  // University is scoped the same way every other University-only screen
  // is (Student Directory, Student Management stats, HOD Students, ...):
  // HSSC/College programs excluded.
  const collegePrograms = await Program.find({ level: "HSSC" }).select("_id").lean();
  const collegeProgramIds = collegePrograms.map((p) => p._id);
  const universityFilter = {
    isTrashed: { $ne: true },
    programId: { $nin: collegeProgramIds },
  };

  const [
    totalActiveStudents,
    totalGraduatedStudents,
    totalStaff,
    totalDepartments,
    totalPrograms,
    departmentBreakdown,
    draftAdmissions,
    submittedAdmissions,
    underReviewAdmissions,
    rejectedAdmissions,
    activeCampaign,
    recentAdmissionsRaw,
    pendingMarksApprovals,
    graduationInProgress,
    newAdmissionStudents,
  ] = await Promise.all([
    StudentProfile.countDocuments({ ...universityFilter, status: "active" }),
    StudentProfile.countDocuments({ ...universityFilter, status: "graduated" }),
    StaffProfile.countDocuments({ status: "Active" }),
    Department.countDocuments({}),
    // `$ne: false` rather than `: true` — most Program records predate the
    // isActive field entirely (bulk-imported, never went through a save()
    // that applies schema defaults) and have it missing, not false. Same
    // convention as feeActivated elsewhere in the app.
    Program.countDocuments({ isActive: { $ne: false }, level: { $ne: "HSSC" } }),
    StudentProfile.aggregate([
      { $match: universityFilter },
      {
        $lookup: {
          from: "departments",
          localField: "departmentId",
          foreignField: "_id",
          as: "department",
        },
      },
      { $unwind: "$department" },
      {
        $group: {
          _id: "$departmentId",
          departmentName: { $first: "$department.name" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Admission.countDocuments({ status: "draft" }),
    Admission.countDocuments({ status: "submitted" }),
    Admission.countDocuments({ status: "under_review" }),
    Admission.countDocuments({ status: "rejected" }),
    AdmissionCampaign.findOne({ endDate: { $gte: new Date() } })
      .select("title startDate endDate")
      .sort({ endDate: -1 })
      .lean(),
    Admission.find({})
      .select("fullName cnic status academicDepartment applyingForProgram createdAt")
      .populate("academicDepartment", "name")
      .populate("applyingForProgram", "name")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    ExamMarksSubmission.countDocuments({ status: "PENDING_VC" }),
    GraduationClearance.countDocuments({ status: "in_progress" }),
    // Same "accepted -> admission-fee funnel" rollup admissionTrashController's
    // getAdmissionProcessStats uses, so this figure never disagrees with the
    // Admission Office's own dashboard.
    StudentProfile.find({ isTrashed: { $ne: true }, createdFromApplicationId: { $ne: null } })
      .select("_id semesterId")
      .populate("semesterId", "name number")
      .lean(),
  ]);

  const firstSemesterStudentIds = newAdmissionStudents
    .filter((s) => (s.semesterId?.number || 1) === 1)
    .map((s) => s._id.toString());
  const challanStatusMap = await StudentChallanService.getAdmissionChallanStatusForStudents(
    firstSemesterStudentIds,
  );

  let acceptedAwaitingChallan = 0;
  let challanGenerated = 0;
  let feePaid = 0;
  let feeOverdue = 0;
  firstSemesterStudentIds.forEach((id) => {
    const status = challanStatusMap.get(id)?.challanStatus || "not_generated";
    if (status === "not_generated") acceptedAwaitingChallan += 1;
    else if (status === "overdue") feeOverdue += 1;
    else if (status === "paid") feePaid += 1;
    else challanGenerated += 1;
  });

  const recentAdmissions = recentAdmissionsRaw.map((a) => ({
    _id: a._id,
    fullName: a.fullName || "Unnamed applicant",
    cnic: a.cnic || "",
    status: a.status,
    departmentName: a.academicDepartment?.name || "",
    programName: a.applyingForProgram?.name || "",
    appliedAt: a.createdAt,
  }));

  res.status(200).json({
    success: true,
    data: {
      university: {
        totalActiveStudents,
        totalGraduatedStudents,
        totalStaff,
        totalDepartments,
        totalPrograms,
      },
      studentsByDepartment: departmentBreakdown.map((d) => ({
        departmentName: d.departmentName || "Unknown",
        count: d.count,
      })),
      admissions: {
        draft: draftAdmissions,
        submitted: submittedAdmissions,
        underReview: underReviewAdmissions,
        rejected: rejectedAdmissions,
        acceptedAwaitingChallan,
        challanGenerated,
        feePaid,
        feeOverdue,
        activeCampaign,
        recent: recentAdmissions,
      },
      pendingActions: {
        marksAwaitingVcApproval: pendingMarksApprovals,
        graduationClearancesInProgress: graduationInProgress,
      },
    },
  });
});
