import { asyncHandler } from "../../core/utils/asyncHandler.js";
import StudentProfile from "../../student/models/StudentProfile.js";
import Admission from "../../admissions/model/Admission.js";
import AdmissionCampaign from "../../admissions/model/AdmissionCampaign.js";
import GraduationClearance from "../../graduation/models/GraduationClearance.js";

export const getRegistrarDashboardStats = asyncHandler(async (req, res) => {
  const [totalActiveStudents, pendingAdmissions, activeCampaign, pendingClearances] = await Promise.all([
    StudentProfile.countDocuments({ status: "active" }),
    Admission.countDocuments({ status: { $in: ["submitted", "under_review"] } }),
    AdmissionCampaign.findOne({ endDate: { $gte: new Date() } }).select("title endDate").lean(),
    GraduationClearance.countDocuments({ status: "in_progress" }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalActiveStudents,
      pendingAdmissions,
      activeCampaign,
      pendingClearances,
    },
  });
});
