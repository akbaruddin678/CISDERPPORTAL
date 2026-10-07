import mongoose from "mongoose";
import StudentProfile from "../../student/models/StudentProfile.js";
import CreditOverride from "../models/CreditOverride.js";
import { resolveViewer, getActorName } from "../../graduation/services/graduationAccess.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";

const isId = (v) => mongoose.isValidObjectId(v);

// POST /api/course/credit-overrides  { studentId, semesterId, termId?, maxCredits, reason }
// The Department Head's "Override_Credit_Limit" permission from the spec:
// temporarily raises (or lowers) one specific student's effective max
// credits for one specific semester, department-scoped exactly like every
// other HOD action in this feature (graduation/services/graduationAccess.js's
// resolveViewer — an HOD's authority is bounded to their own StaffProfile.
// departmentId, looked up fresh from the DB, never trusted from the client).
export const grantCreditOverride = asyncHandler(async (req, res) => {
  const { studentId, semesterId, termId, maxCredits, reason } = req.body;
  if (!isId(studentId) || !isId(semesterId)) {
    return res.status(400).json({ success: false, message: "A valid studentId and semesterId are required." });
  }
  if (typeof maxCredits !== "number" || maxCredits < 0) {
    return res.status(400).json({ success: false, message: "maxCredits must be a non-negative number." });
  }
  if (!reason || !String(reason).trim()) {
    return res.status(400).json({ success: false, message: "A reason is required." });
  }

  const viewer = await resolveViewer(req.user);
  if (!viewer.admin && !viewer.hod) {
    return res.status(403).json({ success: false, message: "Only a Head of Department can grant a credit override." });
  }

  const student = await StudentProfile.findById(studentId).select("departmentId programId").lean();
  if (!student) return res.status(404).json({ success: false, message: "Student not found." });

  if (!viewer.admin) {
    if (!viewer.hodDepartmentId) {
      return res.status(403).json({ success: false, message: "Your staff profile is not linked to a department. Contact HR." });
    }
    if (String(student.departmentId) !== String(viewer.hodDepartmentId)) {
      return res.status(403).json({ success: false, message: "This student is not in your department." });
    }
  }

  const actorName = await getActorName(req.user);
  const override = await CreditOverride.findOneAndUpdate(
    { studentId, semesterId },
    {
      studentId,
      semesterId,
      termId: termId || undefined,
      maxCredits,
      reason: String(reason).trim(),
      approvedBy: req.user._id,
      approvedByName: actorName,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  res.status(200).json({
    success: true,
    message: `Credit limit for this student raised to ${maxCredits} for this semester.`,
    data: override,
  });
});
