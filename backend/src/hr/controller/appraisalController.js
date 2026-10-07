import StaffProfile from "../../staff/models/StaffProfile.js";
import StaffAppraisal from "../../staff/models/StaffAppraisal.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { computeOverallScore } from "../../staff/utils/appraisalScoring.js";

const APPRAISAL_STATUSES = ["Draft", "Pending Employee Review", "Completed"];

// Finds the target staff's manager via their active/primary role
// assignment's reportsTo — the real "who evaluates this person" answer
// the model was designed around (evaluatorId's own comment: "Usually
// HOD"), instead of defaulting to whichever HR user happens to be
// clicking "New Appraisal".
const resolveManagerId = async (staffId) => {
  const target = await StaffProfile.findById(staffId).select("roleAssignments").lean();
  const assignments = (target?.roleAssignments || []).filter(
    (r) => r.status === "active" && r.reportsTo,
  );
  const primary = assignments.find((r) => r.isPrimary);
  return (primary || assignments[0])?.reportsTo || null;
};

// ============================================================================
// CREATE APPRAISAL — evaluatorId auto-derives from the target staff's
// manager (roleAssignments[].reportsTo) when not explicitly supplied,
// falling back to the calling HR user's own profile if no manager is on
// file. KPIs are created goal+weightage only — scoring happens later, by
// the employee's self-assessment then the evaluator, not up front by HR.
// ============================================================================
export const createAppraisal = asyncHandler(async (req, res) => {
  const { staffId, evaluatorId, reviewPeriod, kpis = [] } = req.body;
  if (!staffId || !reviewPeriod || kpis.length === 0) {
    return res.status(400).json({
      success: false,
      message: "staffId, reviewPeriod and at least one KPI are required.",
    });
  }

  let resolvedEvaluatorId = evaluatorId || (await resolveManagerId(staffId));
  if (!resolvedEvaluatorId) {
    const evaluatorProfile = await StaffProfile.findOne({ userId: req.user._id })
      .select("_id")
      .lean();
    resolvedEvaluatorId = evaluatorProfile?._id;
  }
  if (!resolvedEvaluatorId) {
    return res.status(400).json({ success: false, message: "evaluatorId could not be resolved." });
  }

  const appraisal = await StaffAppraisal.create({
    staffId,
    evaluatorId: resolvedEvaluatorId,
    reviewPeriod,
    kpis,
    overallScore: computeOverallScore(kpis),
  });

  res.status(201).json({ success: true, message: "Appraisal created.", data: appraisal });
});

// ============================================================================
// GET APPRAISALS — filterable by reviewPeriod.
// ============================================================================
export const getAppraisals = asyncHandler(async (req, res) => {
  const { reviewPeriod } = req.query;
  const query = {};
  if (reviewPeriod) query.reviewPeriod = reviewPeriod;

  const appraisals = await StaffAppraisal.find(query)
    .populate({
      path: "staffId",
      select: "employeeId departmentId personalInfo",
      populate: [
        { path: "personalInfo", select: "name" },
        { path: "departmentId", select: "name" },
      ],
    })
    .populate({
      path: "evaluatorId",
      populate: { path: "personalInfo", select: "name" },
    })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, data: appraisals });
});

// ============================================================================
// UPDATE APPRAISAL — edit KPI scores/feedback/status, recomputes
// overallScore whenever kpis are touched.
// ============================================================================
export const updateAppraisal = asyncHandler(async (req, res) => {
  const { kpis, evaluatorFeedback, employeeComments, status } = req.body;
  if (status && !APPRAISAL_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${APPRAISAL_STATUSES.join(", ")}.`,
    });
  }

  const appraisal = await StaffAppraisal.findById(req.params.id);
  if (!appraisal) {
    return res.status(404).json({ success: false, message: "Appraisal not found." });
  }

  if (kpis) {
    appraisal.kpis = kpis;
    appraisal.overallScore = computeOverallScore(kpis);
  }
  if (evaluatorFeedback !== undefined) appraisal.evaluatorFeedback = evaluatorFeedback;
  if (employeeComments !== undefined) appraisal.employeeComments = employeeComments;
  if (status) appraisal.status = status;

  await appraisal.save();
  res.status(200).json({ success: true, message: "Appraisal updated.", data: appraisal });
});
