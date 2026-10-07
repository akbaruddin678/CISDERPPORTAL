import mongoose from "mongoose";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import ExamResult from "../models/ExamResult.js";
import Exam from "../models/Exam.js";
import GradeCorrectionRequest from "../models/GradeCorrectionRequest.js";
import CourseAssignment from "../../course/models/CourseAssignment.js";
import StaffProfile from "../../staff/models/StaffProfile.js";
import AuditLog from "../models/AuditLog.js";
import { assertProgramInScope } from "../../course/middleware/courseAssignmentScope.js";

const staffFor = (userId) => StaffProfile.findOne({ userId }).select("_id").lean();
const letterGrade = (percentage) => {
  if (percentage >= 85) return "A";
  if (percentage >= 80) return "A-";
  if (percentage >= 75) return "B+";
  if (percentage >= 70) return "B";
  if (percentage >= 65) return "B-";
  if (percentage >= 60) return "C+";
  if (percentage >= 55) return "C";
  if (percentage >= 50) return "D";
  return "F";
};

export const createGradeCorrectionRequest = asyncHandler(async (req, res) => {
  const { examResultId, courseAssignmentId, proposedMarks, reason } = req.body;
  if (!mongoose.isValidObjectId(examResultId) || !mongoose.isValidObjectId(courseAssignmentId) || String(reason || "").trim().length < 10) {
    return res.status(400).json({ success: false, message: "A result, course section, and correction reason of at least 10 characters are required." });
  }
  const [teacher, result, assignment] = await Promise.all([
    staffFor(req.user._id),
    ExamResult.findById(examResultId).lean(),
    CourseAssignment.findById(courseAssignmentId).lean(),
  ]);
  if (!teacher || !result || !assignment || (!req.user.roles?.includes("admin") && String(assignment.instructorId) !== String(teacher._id))) {
    return res.status(403).json({ success: false, message: "You cannot request a correction for this result." });
  }
  const exam = await Exam.findById(result.examId).select("courseId termId semesterId totalMarks").lean();
  if (!exam || String(exam.courseId) !== String(assignment.courseId) || String(exam.termId) !== String(assignment.termId) || !["Verified", "Locked"].includes(result.status)) {
    return res.status(409).json({ success: false, message: "Only an officially approved result from this section can be corrected." });
  }
  const nextMarks = Number(proposedMarks);
  if (!Number.isFinite(nextMarks) || nextMarks < 0 || nextMarks > exam.totalMarks || nextMarks === result.obtainedMarks) {
    return res.status(400).json({ success: false, message: `Corrected marks must be different and between 0 and ${exam.totalMarks}.` });
  }
  const request = await GradeCorrectionRequest.create({
    examResultId,
    courseAssignmentId,
    requestedBy: teacher._id,
    oldMarks: result.obtainedMarks,
    proposedMarks: nextMarks,
    reason: reason.trim(),
  });
  res.status(201).json({ success: true, message: "Correction request sent to the HOD. The official result remains unchanged until approval.", data: request });
});

export const getMyGradeCorrectionRequests = asyncHandler(async (req, res) => {
  const teacher = await staffFor(req.user._id);
  const data = teacher ? await GradeCorrectionRequest.find({ requestedBy: teacher._id }).populate({ path: "examResultId", populate: { path: "studentId", select: "studentId" } }).sort({ createdAt: -1 }).lean() : [];
  res.json({ success: true, data });
});

export const getHodGradeCorrectionRequests = asyncHandler(async (req, res) => {
  const requests = await GradeCorrectionRequest.find({ status: "PENDING_HOD" })
    .populate({ path: "courseAssignmentId", populate: [{ path: "courseId", select: "code title" }, { path: "programId", select: "departmentId name" }] })
    .populate({ path: "examResultId", populate: { path: "studentId", select: "studentId" } })
    .populate({ path: "requestedBy", populate: { path: "personalInfo", select: "fullName name" } })
    .sort({ createdAt: 1 })
    .lean();
  const data = req.hodDepartmentId
    ? requests.filter((item) => String(item.courseAssignmentId?.programId?.departmentId) === String(req.hodDepartmentId))
    : requests;
  res.json({ success: true, data });
});

export const reviewGradeCorrectionRequest = asyncHandler(async (req, res) => {
  const { decision, remarks = "" } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(decision)) return res.status(400).json({ success: false, message: "Decision must be APPROVED or REJECTED." });
  const request = await GradeCorrectionRequest.findById(req.params.id);
  if (!request || request.status !== "PENDING_HOD") return res.status(409).json({ success: false, message: "This correction request is no longer pending." });
  const assignment = await CourseAssignment.findById(request.courseAssignmentId).lean();
  if (!assignment || !(await assertProgramInScope(req, assignment.programId))) return res.status(403).json({ success: false, message: "This correction is outside your department." });
  const reviewer = await staffFor(req.user._id);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (decision === "APPROVED") {
        const currentResult = await ExamResult.findById(request.examResultId).session(session).lean();
        const currentExam = currentResult ? await Exam.findById(currentResult.examId).session(session).lean() : null;
        const courseResults = currentResult && currentExam
          ? await ExamResult.find({ studentId: currentResult.studentId, status: { $in: ["Verified", "Locked"] } })
              .populate("examId", "courseId totalMarks")
              .session(session)
              .lean()
          : [];
        const sameCourse = courseResults.filter((item) => String(item.examId?.courseId) === String(currentExam?.courseId));
        const oldObtained = sameCourse.reduce((sum, item) => sum + (item.obtainedMarks || 0), 0);
        const totalMarks = sameCourse.reduce((sum, item) => sum + (item.examId?.totalMarks || 0), 0);
        const oldGrade = totalMarks ? letterGrade((oldObtained / totalMarks) * 100) : null;
        const newObtained = oldObtained - request.oldMarks + request.proposedMarks;
        const newGrade = totalMarks ? letterGrade((newObtained / totalMarks) * 100) : null;
        const updated = await ExamResult.findOneAndUpdate(
          { _id: request.examResultId, obtainedMarks: request.oldMarks },
          { $set: { obtainedMarks: request.proposedMarks, remarks: `Corrected after HOD approval: ${request.reason}` } },
          { new: true, session },
        );
        if (!updated) throw new Error("The result changed after this request was submitted. Review the latest result before trying again.");
        await AuditLog.create([{
          entity: "ExamResult",
          entityId: request.examResultId,
          action: "APPROVE_GRADE_CORRECTION",
          userId: req.user._id,
          previousValue: { obtainedMarks: request.oldMarks, courseGrade: oldGrade, requestedBy: request.requestedBy, reason: request.reason },
          newValue: { obtainedMarks: request.proposedMarks, courseGrade: newGrade, approvedBy: reviewer?._id, requestId: request._id },
          ipAddress: req.ip,
        }], { session });
      }
      request.status = decision;
      request.reviewedBy = reviewer?._id;
      request.reviewedAt = new Date();
      request.reviewRemarks = remarks;
      await request.save({ session });
    });
  } finally {
    await session.endSession();
  }
  res.json({ success: true, message: decision === "APPROVED" ? "Correction approved and the permanent audit trail was recorded." : "Correction request rejected.", data: request });
});
