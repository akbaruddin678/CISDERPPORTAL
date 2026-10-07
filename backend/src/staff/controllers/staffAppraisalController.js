import StaffProfile from "../models/StaffProfile.js";
import StaffAppraisal from "../models/StaffAppraisal.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { computeOverallScore } from "../utils/appraisalScoring.js";

const resolveStaffId = async (req) => {
  const staffProfile = await StaffProfile.findOne({ userId: req.user._id }).select("_id").lean();
  return staffProfile?._id || null;
};

// ============================================================================
// MY APPRAISALS — as the reviewee (subject).
// ============================================================================
export const getMyAppraisals = asyncHandler(async (req, res) => {
  const staffId = await resolveStaffId(req);
  if (!staffId) return res.status(200).json({ success: true, data: [] });

  const appraisals = await StaffAppraisal.find({ staffId })
    .populate({ path: "evaluatorId", populate: { path: "personalInfo", select: "name" } })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, data: appraisals });
});

// ============================================================================
// SUBMIT SELF-ASSESSMENT — only your own appraisal, only while it's
// actually waiting on you (status: Pending Employee Review).
// ============================================================================
export const submitSelfAssessment = asyncHandler(async (req, res) => {
  const { employeeComments } = req.body;
  if (!employeeComments || !employeeComments.trim()) {
    return res.status(400).json({ success: false, message: "employeeComments is required." });
  }

  const staffId = await resolveStaffId(req);
  const appraisal = await StaffAppraisal.findById(req.params.id);
  if (!appraisal) {
    return res.status(404).json({ success: false, message: "Appraisal not found." });
  }
  if (String(appraisal.staffId) !== String(staffId)) {
    return res.status(403).json({ success: false, message: "This isn't your appraisal." });
  }
  if (appraisal.status !== "Pending Employee Review") {
    return res.status(400).json({
      success: false,
      message: "This appraisal isn't currently open for self-assessment.",
    });
  }

  appraisal.employeeComments = employeeComments;
  await appraisal.save();

  res.status(200).json({ success: true, message: "Self-assessment submitted.", data: appraisal });
});

// ============================================================================
// APPRAISALS TO REVIEW — as the evaluator (whoever the target staff's
// manager is, per StaffProfile.roleAssignments[].reportsTo — not
// necessarily an HOD, though that's the common case).
// ============================================================================
export const getAppraisalsToReview = asyncHandler(async (req, res) => {
  const staffId = await resolveStaffId(req);
  if (!staffId) return res.status(200).json({ success: true, data: [] });

  const appraisals = await StaffAppraisal.find({ evaluatorId: staffId })
    .populate({
      path: "staffId",
      select: "employeeId departmentId personalInfo",
      populate: [
        { path: "personalInfo", select: "name" },
        { path: "departmentId", select: "name" },
      ],
    })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, data: appraisals });
});

// ============================================================================
// SUBMIT EVALUATOR SCORE — only appraisals where you are the evaluator;
// scores each KPI, records feedback, and finalizes the appraisal.
// ============================================================================
export const submitEvaluatorScore = asyncHandler(async (req, res) => {
  const { kpis, evaluatorFeedback } = req.body;
  if (!Array.isArray(kpis) || kpis.length === 0) {
    return res.status(400).json({ success: false, message: "kpis is required." });
  }

  const staffId = await resolveStaffId(req);
  const appraisal = await StaffAppraisal.findById(req.params.id);
  if (!appraisal) {
    return res.status(404).json({ success: false, message: "Appraisal not found." });
  }
  if (String(appraisal.evaluatorId) !== String(staffId)) {
    return res.status(403).json({
      success: false,
      message: "You aren't the evaluator for this appraisal.",
    });
  }

  appraisal.kpis = kpis;
  appraisal.overallScore = computeOverallScore(kpis);
  if (evaluatorFeedback !== undefined) appraisal.evaluatorFeedback = evaluatorFeedback;
  appraisal.status = "Completed";
  await appraisal.save();

  res.status(200).json({ success: true, message: "Appraisal completed.", data: appraisal });
});
