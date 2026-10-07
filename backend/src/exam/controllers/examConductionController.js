import { asyncHandler } from "../../core/utils/asyncHandler.js";
import UFMReport from "../models/UFMReport.js";
import Exam from "../models/Exam.js";
import ExamAttendance from "../models/ExamAttendance.js";
import ExamAttendanceSubmission from "../models/ExamAttendanceSubmission.js";
import CourseAssignment from "../../course/models/CourseAssignment.js";
import StudentCourseRegistration from "../../course/models/StudentCourseRegistration.js";
import StaffProfile from "../../staff/models/StaffProfile.js";

export const reportUFM = async (req, res) => {
  try {
    const ufm = await UFMReport.create(req.body);
    res.status(201).json({ success: true, data: ufm });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// ATTENDANCE — Exam-Cell entry side. Attendance is recorded by Exam-Cell
// staff (manager/admin), not the course's own teacher, so there is no
// ownership check here the way teacherMarksController.js has for teachers —
// just a flat role gate (enforced at the route level).
// ============================================================================

const resolveStaffId = async (req) => {
  const staffProfile = await StaffProfile.findOne({ userId: req.user._id })
    .select("_id")
    .lean();
  return staffProfile?._id || null;
};

const resolveExamForAssignment = async (assignment, examId) =>
  Exam.findOne({
    _id: examId,
    courseId: assignment.courseId,
    termId: assignment.termId,
    semesterId: assignment.semesterId,
    publishStatus: "PUBLISHED",
  }).lean();

// ============================================================================
// GET ATTENDANCE ROSTER — resolves/creates (upsert DRAFT) the submission for
// one exam+course-assignment, returns the registered students joined with
// any existing ExamAttendance rows (default "Pending").
// ============================================================================
export const getAttendanceRoster = asyncHandler(async (req, res) => {
  const { courseAssignmentId, examId } = req.query;
  if (!courseAssignmentId || !examId) {
    return res.status(400).json({
      success: false,
      message: "courseAssignmentId and examId are required.",
    });
  }

  const assignment = await CourseAssignment.findById(courseAssignmentId).lean();
  if (!assignment) {
    return res
      .status(404)
      .json({ success: false, message: "Course assignment not found." });
  }

  const exam = await resolveExamForAssignment(assignment, examId);
  if (!exam) {
    return res
      .status(404)
      .json({ success: false, message: "Exam not found for this course." });
  }

  const staffId = await resolveStaffId(req);
  const submission = await ExamAttendanceSubmission.findOneAndUpdate(
    { examId, courseAssignmentId },
    { $setOnInsert: { recordedBy: staffId, status: "DRAFT" } },
    { upsert: true, new: true },
  );

  const registrations = await StudentCourseRegistration.find({
    termId: assignment.termId,
    courseId: assignment.courseId,
    semesterId: assignment.semesterId,
    status: { $in: ["Registered", "In-Progress", "Passed", "Failed"] },
  })
    .populate({
      path: "studentId",
      select: "studentId personalInfo",
      populate: { path: "personalInfo", select: "fullName" },
    })
    .lean();

  const attendanceRows = await ExamAttendance.find({ examId }).lean();
  const statusByStudentId = new Map(
    attendanceRows.map((a) => [String(a.studentId), a.status]),
  );

  const students = registrations
    .filter((r) => r.studentId)
    .map((r) => ({
      studentId: String(r.studentId._id),
      rollNo: r.studentId.studentId,
      name: r.studentId.personalInfo?.fullName || "Unknown",
      status: statusByStudentId.get(String(r.studentId._id)) || "Pending",
    }));

  res.status(200).json({ success: true, data: { exam, submission, students } });
});

// ============================================================================
// SAVE ATTENDANCE — bulk upsert into ExamAttendance (the same collection
// marksController.js reads from for display), re-validated against this
// course/term/semester. Only allowed while the submission is editable.
// ============================================================================
export const saveAttendance = asyncHandler(async (req, res) => {
  const { courseAssignmentId, examId, records } = req.body;
  if (
    !courseAssignmentId ||
    !examId ||
    !Array.isArray(records) ||
    records.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "courseAssignmentId, examId and records[] are required.",
    });
  }

  const assignment = await CourseAssignment.findById(courseAssignmentId).lean();
  if (!assignment) {
    return res
      .status(404)
      .json({ success: false, message: "Course assignment not found." });
  }

  const exam = await resolveExamForAssignment(assignment, examId);
  if (!exam) {
    return res
      .status(404)
      .json({ success: false, message: "Exam not found for this course." });
  }

  const submission = await ExamAttendanceSubmission.findOne({
    examId,
    courseAssignmentId,
  }).lean();
  if (!submission || !["DRAFT", "RETURNED"].includes(submission.status)) {
    return res.status(400).json({
      success: false,
      message: "Attendance is locked for this exam — it isn't editable right now.",
    });
  }

  const validStatuses = new Set(["Pending", "Present", "Late", "Absent"]);
  const studentIds = records.map((r) => r.studentId).filter(Boolean);
  const validRegistrations = await StudentCourseRegistration.find({
    studentId: { $in: studentIds },
    termId: assignment.termId,
    courseId: assignment.courseId,
    semesterId: assignment.semesterId,
  })
    .select("studentId")
    .lean();
  const validStudentIds = new Set(
    validRegistrations.map((r) => String(r.studentId)),
  );

  const ops = records
    .filter(
      (r) => validStudentIds.has(String(r.studentId)) && validStatuses.has(r.status),
    )
    .map((r) => ({
      updateOne: {
        filter: { examId, studentId: r.studentId },
        update: { $set: { status: r.status } },
        upsert: true,
      },
    }));

  if (ops.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No valid attendance records to save." });
  }

  await ExamAttendance.bulkWrite(ops);

  if (!submission.completedAt) {
    await ExamAttendanceSubmission.updateOne(
      { examId, courseAssignmentId },
      { $set: { completedAt: new Date() } },
    );
  }

  res.status(200).json({
    success: true,
    message: `Attendance saved for ${ops.length} student(s).`,
  });
});

// ============================================================================
// SUBMIT ATTENDANCE FOR REVIEW — locks this submission and sends it to the
// HOD for department-level sign-off.
// ============================================================================
export const submitAttendanceForReview = asyncHandler(async (req, res) => {
  const { courseAssignmentId, examId } = req.body;
  if (!courseAssignmentId || !examId) {
    return res.status(400).json({
      success: false,
      message: "courseAssignmentId and examId are required.",
    });
  }

  const submission = await ExamAttendanceSubmission.findOne({
    examId,
    courseAssignmentId,
  });
  if (!submission || !["DRAFT", "RETURNED"].includes(submission.status)) {
    return res.status(400).json({
      success: false,
      message: "This submission can't be submitted for review right now.",
    });
  }

  submission.status = "PENDING_HOD";
  submission.submittedAt = new Date();
  submission.hodRemarks = "";
  await submission.save();

  res.status(200).json({
    success: true,
    message: "Attendance submitted to HOD for review.",
    data: submission,
  });
});

// ============================================================================
// LIST ATTENDANCE SUBMISSIONS FOR HOD REVIEW — department-scoped directly
// via Exam.departmentId (Exam stores it, no CourseAssignment/Program hop
// needed the way marks' getSubmissionsForReview requires).
// ============================================================================
export const getAttendanceSubmissionsForReview = asyncHandler(async (req, res) => {
  const examQuery = {};
  if (req.hodDepartmentId) examQuery.departmentId = req.hodDepartmentId;

  const exams = await Exam.find(examQuery).select("_id type date courseId").lean();
  if (exams.length === 0) {
    return res.status(200).json({ success: true, data: [] });
  }
  const examMap = new Map(exams.map((e) => [String(e._id), e]));

  const submissions = await ExamAttendanceSubmission.find({
    examId: { $in: [...examMap.keys()] },
    status: { $ne: "DRAFT" },
  })
    .sort({ updatedAt: -1 })
    .lean();

  if (submissions.length === 0) {
    return res.status(200).json({ success: true, data: [] });
  }

  const assignmentIds = [...new Set(submissions.map((s) => String(s.courseAssignmentId)))];
  const assignments = await CourseAssignment.find({ _id: { $in: assignmentIds } })
    .populate("courseId", "title code")
    .populate("semesterId", "number")
    .populate("termId", "name")
    .lean();
  const assignmentMap = new Map(assignments.map((a) => [String(a._id), a]));

  const data = submissions.map((s) => {
    const exam = examMap.get(String(s.examId));
    const assignment = assignmentMap.get(String(s.courseAssignmentId));
    return {
      id: String(s._id),
      status: s.status,
      hodRemarks: s.hodRemarks,
      completedAt: s.completedAt,
      submittedAt: s.submittedAt,
      exam,
      courseTitle: assignment?.courseId?.title || "Unknown Course",
      courseCode: assignment?.courseId?.code || "N/A",
      section: assignment?.section || "",
      semesterNumber: assignment?.semesterId?.number,
      termName: assignment?.termId?.name || "Unknown Session",
    };
  });

  res.status(200).json({ success: true, data });
});

// ============================================================================
// GET ATTENDANCE ROSTER FOR REVIEW — read-only, department-checked.
// ============================================================================
export const getAttendanceRosterForReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const submission = await ExamAttendanceSubmission.findById(id).lean();
  if (!submission) {
    return res.status(404).json({ success: false, message: "Submission not found." });
  }

  const exam = await Exam.findById(submission.examId).lean();
  if (!exam) {
    return res.status(404).json({ success: false, message: "Exam not found." });
  }

  if (req.hodDepartmentId && String(exam.departmentId) !== String(req.hodDepartmentId)) {
    return res.status(403).json({
      success: false,
      message: "This submission is outside your department.",
    });
  }

  const assignment = await CourseAssignment.findById(submission.courseAssignmentId).lean();
  if (!assignment) {
    return res
      .status(404)
      .json({ success: false, message: "Course assignment not found." });
  }

  const registrations = await StudentCourseRegistration.find({
    termId: assignment.termId,
    courseId: assignment.courseId,
    semesterId: assignment.semesterId,
    status: { $in: ["Registered", "In-Progress", "Passed", "Failed"] },
  })
    .populate({
      path: "studentId",
      select: "studentId personalInfo",
      populate: { path: "personalInfo", select: "fullName" },
    })
    .lean();

  const attendanceRows = await ExamAttendance.find({ examId: submission.examId }).lean();
  const statusByStudentId = new Map(
    attendanceRows.map((a) => [String(a.studentId), a.status]),
  );

  const students = registrations
    .filter((r) => r.studentId)
    .map((r) => ({
      studentId: String(r.studentId._id),
      rollNo: r.studentId.studentId,
      name: r.studentId.personalInfo?.fullName || "Unknown",
      status: statusByStudentId.get(String(r.studentId._id)) || "Pending",
    }));

  res.status(200).json({ success: true, data: { submission, exam, students } });
});

// ============================================================================
// REVIEW ATTENDANCE SUBMISSION — HOD approve/return. One-stage sign-off
// (unlike the 3-stage marks chain) — approve locks it in, return sends it
// back to DRAFT with remarks for Exam-Cell staff to fix and re-submit.
// ============================================================================
export const reviewAttendanceSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { decision, remarks } = req.body;

  if (!["APPROVED", "RETURNED"].includes(decision)) {
    return res.status(400).json({
      success: false,
      message: "decision must be APPROVED or RETURNED.",
    });
  }

  const submission = await ExamAttendanceSubmission.findById(id);
  if (!submission) {
    return res.status(404).json({ success: false, message: "Submission not found." });
  }
  if (submission.status !== "PENDING_HOD") {
    return res.status(400).json({
      success: false,
      message: "This submission isn't awaiting review right now.",
    });
  }

  const exam = await Exam.findById(submission.examId).select("departmentId").lean();
  if (req.hodDepartmentId && String(exam?.departmentId) !== String(req.hodDepartmentId)) {
    return res.status(403).json({
      success: false,
      message: "This submission is outside your department.",
    });
  }

  submission.status = decision === "APPROVED" ? "APPROVED" : "DRAFT";
  submission.hodRemarks = decision === "RETURNED" ? remarks || "" : "";
  submission.reviewedBy = await resolveStaffId(req);
  submission.reviewedAt = new Date();
  await submission.save();

  res.status(200).json({
    success: true,
    message:
      decision === "APPROVED"
        ? "Attendance approved."
        : "Attendance returned to Exam-Cell for correction.",
    data: submission,
  });
});
