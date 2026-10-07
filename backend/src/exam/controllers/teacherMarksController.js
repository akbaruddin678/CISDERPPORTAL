import { asyncHandler } from "../../core/utils/asyncHandler.js";
import Exam from "../models/Exam.js";
import ExamResult from "../models/ExamResult.js";
import ExamMarksSubmission from "../models/ExamMarksSubmission.js";
import CourseAssignment from "../../course/models/CourseAssignment.js";
import StudentCourseRegistration from "../../course/models/StudentCourseRegistration.js";
import StaffProfile from "../../staff/models/StaffProfile.js";
import Program from "../../catalog/model/Program.js";
import { assertProgramInScope } from "../../course/middleware/courseAssignmentScope.js";

// A DRAFT marks submission left untouched this long is auto-submitted to
// the HOD so marks don't get stuck in draft indefinitely.
const DRAFT_WINDOW_HOURS = 48;

const resolveTeacherId = async (req) => {
  const staffProfile = await StaffProfile.findOne({ userId: req.user._id })
    .select("_id")
    .lean();
  return staffProfile?._id || null;
};

const isAdmin = (req) => req.user?.roles?.includes("admin");

// Resolves the CourseAssignment and confirms the caller (teacher) owns it,
// or is an admin. Returns the assignment doc or null.
const resolveOwnedAssignment = async (req, courseAssignmentId, teacherId) => {
  const assignment = await CourseAssignment.findById(courseAssignmentId).lean();
  if (!assignment) return null;
  if (!isAdmin(req) && String(assignment.instructorId) !== String(teacherId)) {
    return null;
  }
  return assignment;
};

// Every student actually registered under a course assignment's course/term/
// semester — the roster a teacher's (or that section's) marks submission
// covers. Reused when bulk-flipping ExamResult.status on publish/review.
const fetchAssignmentStudentIds = async (assignment) => {
  const registrations = await StudentCourseRegistration.find({
    courseAssignmentId: assignment._id,
    status: { $in: ["Registered", "In-Progress", "Passed", "Failed"] },
  })
    .select("studentId")
    .lean();
  return registrations.map((r) => r.studentId);
};

// Combines an Exam's `date` with an "HH:mm" time string into one real Date,
// so completion can be gated on whether the exam has actually finished.
const combineDateAndTime = (date, timeStr) => {
  const d = new Date(date);
  if (!timeStr) return d;
  const [hh, mm] = timeStr.split(":").map(Number);
  d.setHours(hh || 0, mm || 0, 0, 0);
  return d;
};

const sweepExpiredMarksDrafts = async (courseAssignmentId, teacherId) => {
  const now = Date.now();
  const drafts = await ExamMarksSubmission.find({
    courseAssignmentId,
    teacherId,
    status: "DRAFT",
    completedAt: { $ne: null },
  })
    .select("_id examId completedAt")
    .lean();

  const expired = drafts.filter(
    (d) => (now - new Date(d.completedAt).getTime()) / 36e5 >= DRAFT_WINDOW_HOURS,
  );
  if (expired.length === 0) return;

  await ExamMarksSubmission.updateMany(
    { _id: { $in: expired.map((d) => d._id) } },
    {
      $set: {
        status: "PENDING_HOD",
        autoPublished: true,
        publishedAt: new Date(),
        hodRemarks: "",
      },
    },
  );

  const assignment = await CourseAssignment.findById(courseAssignmentId).lean();
  const studentIds = assignment ? await fetchAssignmentStudentIds(assignment) : [];
  if (studentIds.length > 0) {
    await ExamResult.updateMany(
      {
        examId: { $in: expired.map((d) => d.examId) },
        studentId: { $in: studentIds },
      },
      { $set: { status: "Submitted" } },
    );
  }
};

// ============================================================================
// GET SCHEDULED EXAMS for the teacher's own course offering
// ============================================================================
export const getScheduledExams = asyncHandler(async (req, res) => {
  const { courseAssignmentId } = req.query;
  if (!courseAssignmentId) {
    return res
      .status(400)
      .json({ success: false, message: "courseAssignmentId is required." });
  }

  const teacherId = await resolveTeacherId(req);
  if (!isAdmin(req) && !teacherId) {
    return res.status(403).json({
      success: false,
      message: "Your account is not linked to a staff profile.",
    });
  }

  const assignment = await resolveOwnedAssignment(req, courseAssignmentId, teacherId);
  if (!assignment) {
    return res
      .status(403)
      .json({ success: false, message: "You are not assigned to this course." });
  }

  if (!isAdmin(req)) {
    await sweepExpiredMarksDrafts(courseAssignmentId, teacherId);
  }

  const exams = await Exam.find({
    termId: assignment.termId,
    courseId: assignment.courseId,
    semesterId: assignment.semesterId,
    publishStatus: "PUBLISHED",
  })
    .sort({ date: 1 })
    .lean();

  const submissions = await ExamMarksSubmission.find({
    courseAssignmentId,
    examId: { $in: exams.map((e) => e._id) },
  }).lean();
  const submissionByExamId = new Map(
    submissions.map((s) => [String(s.examId), s]),
  );

  const data = exams.map((e) => ({
    ...e,
    submission: submissionByExamId.get(String(e._id)) || null,
  }));

  res.status(200).json({ success: true, data });
});

// ============================================================================
// MARK EXAM COMPLETE — unlocks mark entry for this teacher's own section of
// an exam, once it has actually finished. Idempotent: repeat calls just
// return the existing submission rather than resetting it.
// ============================================================================
export const markExamComplete = asyncHandler(async (req, res) => {
  const { courseAssignmentId, examId } = req.body;
  if (!courseAssignmentId || !examId) {
    return res.status(400).json({
      success: false,
      message: "courseAssignmentId and examId are required.",
    });
  }

  const teacherId = await resolveTeacherId(req);
  if (!isAdmin(req) && !teacherId) {
    return res.status(403).json({
      success: false,
      message: "Your account is not linked to a staff profile.",
    });
  }

  const assignment = await resolveOwnedAssignment(req, courseAssignmentId, teacherId);
  if (!assignment) {
    return res
      .status(403)
      .json({ success: false, message: "You are not assigned to this course." });
  }

  const exam = await resolveExamForAssignment(assignment, examId);
  if (!exam) {
    return res
      .status(404)
      .json({ success: false, message: "Exam not found for this course." });
  }

  // Sessional has no fixed date/time — it's a running mark the teacher
  // enters off ongoing class performance, not a scheduled event, so it's
  // never gated on "has the exam happened yet."
  if (exam.type !== "Sessional") {
    const examEndsAt = combineDateAndTime(exam.date, exam.endTime);
    if (Date.now() < examEndsAt.getTime()) {
      return res
        .status(400)
        .json({ success: false, message: "This exam hasn't finished yet." });
    }
  }

  const submission = await ExamMarksSubmission.findOneAndUpdate(
    { examId, courseAssignmentId },
    {
      $setOnInsert: {
        teacherId,
        status: "DRAFT",
        completedAt: new Date(),
      },
    },
    { upsert: true, new: true },
  );

  res
    .status(200)
    .json({ success: true, message: "Exam marked complete.", data: submission });
});

// Re-fetches the exam and confirms it actually belongs to this course
// assignment's course/term/semester — a defense-in-depth cross-check on top
// of the assignment ownership check (which is what actually authorizes the
// caller; Exam has no section/instructor of its own to authorize against).
const resolveExamForAssignment = async (assignment, examId) =>
  Exam.findOne({
    _id: examId,
    courseId: assignment.courseId,
    termId: assignment.termId,
    semesterId: assignment.semesterId,
    publishStatus: "PUBLISHED",
  }).lean();

// ============================================================================
// GET EXAM ROSTER — enrolled students + their existing ExamResult (if any)
// for one specific scheduled exam, so marks are entered against the real
// exam instance rather than a generic mid/final/sessional bucket.
// ============================================================================
export const getExamRoster = asyncHandler(async (req, res) => {
  const { courseAssignmentId, examId } = req.query;
  if (!courseAssignmentId || !examId) {
    return res.status(400).json({
      success: false,
      message: "courseAssignmentId and examId are required.",
    });
  }

  const teacherId = await resolveTeacherId(req);
  if (!isAdmin(req) && !teacherId) {
    return res.status(403).json({
      success: false,
      message: "Your account is not linked to a staff profile.",
    });
  }

  const assignment = await resolveOwnedAssignment(req, courseAssignmentId, teacherId);
  if (!assignment) {
    return res
      .status(403)
      .json({ success: false, message: "You are not assigned to this course." });
  }

  const exam = await resolveExamForAssignment(assignment, examId);
  if (!exam) {
    return res
      .status(404)
      .json({ success: false, message: "Exam not found for this course." });
  }

  const submission = await ExamMarksSubmission.findOne({
    examId,
    courseAssignmentId,
  }).lean();
  if (!submission) {
    return res.status(400).json({
      success: false,
      message: "Mark this exam as complete before entering marks.",
    });
  }

  const registrations = await StudentCourseRegistration.find({
    courseAssignmentId: assignment._id,
    status: { $in: ["Registered", "In-Progress", "Passed", "Failed"] },
  })
    .populate({
      path: "studentId",
      select: "studentId personalInfo",
      populate: { path: "personalInfo", select: "fullName" },
    })
    .lean();

  const results = await ExamResult.find({ examId }).lean();
  const resultByStudentId = new Map(results.map((r) => [String(r.studentId), r]));

  const students = registrations
    .filter((r) => r.studentId)
    .map((r) => {
      const result = resultByStudentId.get(String(r.studentId._id));
      return {
        resultId: result?._id ? String(result._id) : null,
        registrationId: String(r._id),
        studentId: String(r.studentId._id),
        rollNo: r.studentId.studentId,
        name: r.studentId.personalInfo?.fullName || "Unknown",
        obtainedMarks: result?.obtainedMarks ?? null,
        isAbsent: result?.isAbsent || false,
      };
    });

  res.status(200).json({ success: true, data: { exam, submission, students } });
});

// ============================================================================
// SAVE EXAM MARKS — bulk upsert into ExamResult, re-validated against this
// course/term/semester so a studentId can't be used to write marks onto an
// unrelated course, and clamped to the exam's own totalMarks.
// ============================================================================
export const saveExamMarks = asyncHandler(async (req, res) => {
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

  const teacherId = await resolveTeacherId(req);
  if (!isAdmin(req) && !teacherId) {
    return res.status(403).json({
      success: false,
      message: "Your account is not linked to a staff profile.",
    });
  }

  const assignment = await resolveOwnedAssignment(req, courseAssignmentId, teacherId);
  if (!assignment) {
    return res
      .status(403)
      .json({ success: false, message: "You are not assigned to this course." });
  }

  const exam = await resolveExamForAssignment(assignment, examId);
  if (!exam) {
    return res
      .status(404)
      .json({ success: false, message: "Exam not found for this course." });
  }

  const submission = await ExamMarksSubmission.findOne({
    examId,
    courseAssignmentId,
  }).lean();
  if (!submission || !["DRAFT", "RETURNED"].includes(submission.status)) {
    return res.status(400).json({
      success: false,
      message: "Marks are locked for this exam — it isn't editable right now.",
    });
  }

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
    .filter((r) => validStudentIds.has(String(r.studentId)))
    .map((r) => {
      const isAbsent = Boolean(r.isAbsent);
      const obtainedMarks = isAbsent
        ? 0
        : Math.min(Math.max(Number(r.obtainedMarks) || 0, 0), exam.totalMarks);
      return {
        updateOne: {
          filter: { examId, studentId: r.studentId },
          update: {
            $set: { obtainedMarks, isAbsent, enteredBy: teacherId, status: "Draft" },
          },
          upsert: true,
        },
      };
    });

  if (ops.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No valid marks records to save." });
  }

  await ExamResult.bulkWrite(ops);

  res.status(200).json({
    success: true,
    message: `Marks saved for ${ops.length} student(s).`,
  });
});

// ============================================================================
// PUBLISH EXAM MARKS — locks this section's marks for the exam and sends
// them to the HOD for review.
// ============================================================================
export const publishExamMarks = asyncHandler(async (req, res) => {
  const { courseAssignmentId, examId } = req.body;
  if (!courseAssignmentId || !examId) {
    return res.status(400).json({
      success: false,
      message: "courseAssignmentId and examId are required.",
    });
  }

  const teacherId = await resolveTeacherId(req);
  if (!isAdmin(req) && !teacherId) {
    return res.status(403).json({
      success: false,
      message: "Your account is not linked to a staff profile.",
    });
  }

  const assignment = await resolveOwnedAssignment(req, courseAssignmentId, teacherId);
  if (!assignment) {
    return res
      .status(403)
      .json({ success: false, message: "You are not assigned to this course." });
  }

  const exam = await resolveExamForAssignment(assignment, examId);
  if (!exam) {
    return res
      .status(404)
      .json({ success: false, message: "Exam not found for this course." });
  }

  const submission = await ExamMarksSubmission.findOne({
    examId,
    courseAssignmentId,
  });
  if (!submission || !["DRAFT", "RETURNED"].includes(submission.status)) {
    return res.status(400).json({
      success: false,
      message: "This submission can't be published right now.",
    });
  }

  const studentIds = await fetchAssignmentStudentIds(assignment);
  if (studentIds.length > 0) {
    await ExamResult.updateMany(
      { examId, studentId: { $in: studentIds } },
      { $set: { status: "Submitted" } },
    );
  }

  submission.status = "PENDING_HOD";
  submission.publishedAt = new Date();
  submission.autoPublished = false;
  submission.hodRemarks = "";
  await submission.save();

  res.status(200).json({
    success: true,
    message: "Marks published to HOD for review.",
    data: submission,
  });
});

// ============================================================================
// LIST SUBMISSIONS FOR REVIEW — every non-draft marks submission this caller
// can see. HOD callers get it scoped to their own department (via
// resolveHodDepartment setting req.hodDepartmentId); Academia/VC/Registrar/
// admin callers are unscoped (req.hodDepartmentId is unset for those routes).
// Frontend filters by status client-side, same list serves every stage.
// ============================================================================
export const getSubmissionsForReview = asyncHandler(async (req, res) => {
  const assignmentQuery = {};
  if (req.hodDepartmentId) {
    const programs = await Program.find({ departmentId: req.hodDepartmentId })
      .select("_id")
      .lean();
    assignmentQuery.programId = { $in: programs.map((p) => p._id) };
  }

  const assignments = await CourseAssignment.find(assignmentQuery)
    .populate("courseId", "title code")
    .populate("semesterId", "number")
    .populate("termId", "name")
    .populate({
      path: "instructorId",
      populate: { path: "personalInfo", select: "fullName" },
    })
    .lean();

  if (assignments.length === 0) {
    return res.status(200).json({ success: true, data: [] });
  }

  const assignmentMap = new Map(assignments.map((a) => [String(a._id), a]));

  const submissions = await ExamMarksSubmission.find({
    courseAssignmentId: { $in: [...assignmentMap.keys()] },
    status: { $ne: "DRAFT" },
  })
    .populate("examId", "type date totalMarks weightage status")
    .sort({ updatedAt: -1 })
    .lean();

  const data = submissions.map((s) => {
    const assignment = assignmentMap.get(String(s.courseAssignmentId));
    return {
      id: String(s._id),
      status: s.status,
      hodRemarks: s.hodRemarks,
      completedAt: s.completedAt,
      publishedAt: s.publishedAt,
      autoPublished: s.autoPublished,
      exam: s.examId,
      courseTitle: assignment?.courseId?.title || "Unknown Course",
      courseCode: assignment?.courseId?.code || "N/A",
      section: assignment?.section || "",
      semesterNumber: assignment?.semesterId?.number,
      termName: assignment?.termId?.name || "Unknown Session",
      teacherName:
        assignment?.instructorId?.personalInfo?.fullName || "Unknown Teacher",
    };
  });

  res.status(200).json({ success: true, data });
});

// ============================================================================
// GET SUBMISSION ROSTER FOR REVIEW — read-only view of one submission's
// marks. Department-scoped only when req.hodDepartmentId is set (HOD
// callers); Academia/VC/Registrar/admin are unscoped.
// ============================================================================
export const getSubmissionRosterForReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const submission = await ExamMarksSubmission.findById(id).lean();
  if (!submission) {
    return res.status(404).json({ success: false, message: "Submission not found." });
  }

  const assignment = await CourseAssignment.findById(
    submission.courseAssignmentId,
  ).lean();
  if (!assignment) {
    return res
      .status(404)
      .json({ success: false, message: "Course assignment not found." });
  }

  const inScope = await assertProgramInScope(req, assignment.programId);
  if (!inScope) {
    return res.status(403).json({
      success: false,
      message: "This submission is outside your department.",
    });
  }

  const exam = await Exam.findById(submission.examId).lean();

  const registrations = await StudentCourseRegistration.find({
    courseAssignmentId: assignment._id,
    status: { $in: ["Registered", "In-Progress", "Passed", "Failed"] },
  })
    .populate({
      path: "studentId",
      select: "studentId personalInfo",
      populate: { path: "personalInfo", select: "fullName" },
    })
    .lean();

  const results = await ExamResult.find({ examId: submission.examId }).lean();
  const resultByStudentId = new Map(results.map((r) => [String(r.studentId), r]));

  const students = registrations
    .filter((r) => r.studentId)
    .map((r) => {
      const result = resultByStudentId.get(String(r.studentId._id));
      return {
        studentId: String(r.studentId._id),
        rollNo: r.studentId.studentId,
        name: r.studentId.personalInfo?.fullName || "Unknown",
        obtainedMarks: result?.obtainedMarks ?? null,
        isAbsent: result?.isAbsent || false,
      };
    });

  res.status(200).json({ success: true, data: { submission, exam, students } });
});

// Which role(s) may approve a submission currently sitting at a given
// status, and what status it advances to on approval. Checked against the
// caller's real req.user.roles — never a client-supplied role string (this
// is the deliberate difference from the unsecured Course-approval workflow
// this pattern is modeled after).
const STAGE_CONFIG = {
  PENDING_HOD: { roles: ["hod", "admin"], nextStatus: "PENDING_ACADEMIA" },
  PENDING_ACADEMIA: {
    roles: ["head_of_academia", "admin"],
    nextStatus: "PENDING_VC",
  },
  PENDING_VC: { roles: ["vc", "vice_vc", "admin"], nextStatus: "APPROVED" },
};

// ============================================================================
// REVIEW DECISION (shared by the HOD/Academia/VC review routes) — approve
// advances the submission to the next stage, only bulk-verifying this
// section's ExamResult rows once it reaches the final APPROVED (VC) step
// (that's what makes a result count toward transcripts). Return always
// sends it back to Draft so the teacher can fix and re-publish, regardless
// of which stage returned it.
// ============================================================================
export const reviewMarksSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { decision, remarks } = req.body;

  if (!["APPROVED", "RETURNED"].includes(decision)) {
    return res.status(400).json({
      success: false,
      message: "decision must be APPROVED or RETURNED.",
    });
  }

  const submission = await ExamMarksSubmission.findById(id);
  if (!submission) {
    return res.status(404).json({ success: false, message: "Submission not found." });
  }

  const stage = STAGE_CONFIG[submission.status];
  if (!stage) {
    return res.status(400).json({
      success: false,
      message: "This submission isn't awaiting review right now.",
    });
  }

  const callerRoles = req.user?.roles || [];
  if (!stage.roles.some((r) => callerRoles.includes(r))) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to review this submission's current stage.",
    });
  }

  const nextStatus = decision === "APPROVED" ? stage.nextStatus : "DRAFT";

  const assignment = await CourseAssignment.findById(
    submission.courseAssignmentId,
  ).lean();
  const studentIds = assignment ? await fetchAssignmentStudentIds(assignment) : [];

  if (studentIds.length > 0 && (nextStatus === "APPROVED" || nextStatus === "DRAFT")) {
    await ExamResult.updateMany(
      { examId: submission.examId, studentId: { $in: studentIds } },
      { $set: { status: nextStatus === "APPROVED" ? "Verified" : "Draft" } },
    );
  }

  submission.status = nextStatus;
  submission.hodRemarks = nextStatus === "DRAFT" ? remarks || "" : "";
  submission.reviewedBy = await resolveTeacherId(req);
  submission.reviewedAt = new Date();
  await submission.save();

  res.status(200).json({
    success: true,
    message:
      decision === "APPROVED"
        ? nextStatus === "APPROVED"
          ? "Marks approved — officially declared."
          : "Marks approved and forwarded to the next stage."
        : "Marks returned to the teacher.",
    data: submission,
  });
});

const RESULT_GRADE_THRESHOLDS = [
  { min: 85, grade: "A", gp: 4.0 },
  { min: 80, grade: "A-", gp: 3.7 },
  { min: 75, grade: "B+", gp: 3.3 },
  { min: 70, grade: "B", gp: 3.0 },
  { min: 65, grade: "B-", gp: 2.7 },
  { min: 60, grade: "C+", gp: 2.3 },
  { min: 55, grade: "C", gp: 2.0 },
  { min: 50, grade: "C-", gp: 1.7 },
];

const gradeForPercentage = (percentage) => {
  const match = RESULT_GRADE_THRESHOLDS.find((t) => percentage >= t.min);
  return match ? { grade: match.grade, gp: match.gp } : { grade: "F", gp: 0 };
};

// ============================================================================
// STUDENT RESULTS OVERVIEW — replaces the legacy StudentCourseRegistration-
// bucket based getExamResults. Aggregates real ExamResult rows per student
// per course; a course only counts as "officially declared" once every Exam
// scheduled for it has a Verified ExamResult (i.e. reached final VC
// approval) — otherwise it's shown as still in progress/provisional.
// ============================================================================
export const getStudentResultsOverview = asyncHandler(async (req, res) => {
  const { termId, programId, semesterId } = req.query;
  const query = { termId };
  if (programId && programId !== "all") query.programId = programId;
  if (semesterId && semesterId !== "all") query.semesterId = semesterId;

  const registrations = await StudentCourseRegistration.find(query)
    .populate("courseId", "title code creditHours")
    .populate({ path: "studentId", populate: { path: "personalInfo" } })
    .lean();

  const courseIds = [
    ...new Set(
      registrations.map((r) => String(r.courseId?._id)).filter(Boolean),
    ),
  ];
  const exams = await Exam.find({
    termId,
    courseId: { $in: courseIds },
    publishStatus: "PUBLISHED",
  })
    .select("courseId totalMarks")
    .lean();
  const examsByCourse = new Map();
  exams.forEach((e) => {
    const key = String(e.courseId);
    if (!examsByCourse.has(key)) examsByCourse.set(key, []);
    examsByCourse.get(key).push(e);
  });

  const studentIds = [
    ...new Set(
      registrations.map((r) => String(r.studentId?._id)).filter(Boolean),
    ),
  ];
  const results = await ExamResult.find({
    studentId: { $in: studentIds },
    examId: { $in: exams.map((e) => e._id) },
  }).lean();
  const resultsByStudentExam = new Map(
    results.map((r) => [`${r.studentId}_${r.examId}`, r]),
  );

  const resultsByStudent = {};

  registrations.forEach((reg) => {
    if (!reg.studentId || !reg.courseId) return;
    const sid = String(reg.studentId._id);
    const cid = String(reg.courseId._id);

    if (!resultsByStudent[sid]) {
      resultsByStudent[sid] = {
        studentId: sid,
        name: reg.studentId.personalInfo?.fullName || "N/A",
        rollNo: reg.studentId.studentId || "N/A",
        programId: reg.programId,
        semesterId: reg.semesterId,
        courses: [],
        totalCredits: 0,
        earnedPoints: 0,
        hasPendingCourses: false,
      };
    }

    const courseExams = examsByCourse.get(cid) || [];
    let verifiedCount = 0;
    let officialObtained = 0;
    let officialTotal = 0;
    let anyMarksEntered = false;

    courseExams.forEach((exam) => {
      const result = resultsByStudentExam.get(`${sid}_${exam._id}`);
      if (!result) return;
      anyMarksEntered = true;
      if (result.status === "Verified") {
        verifiedCount += 1;
        officialObtained += result.isAbsent ? 0 : result.obtainedMarks || 0;
        officialTotal += exam.totalMarks || 0;
      }
    });

    const isFullyDeclared =
      courseExams.length > 0 && verifiedCount === courseExams.length;
    const percentage = officialTotal > 0 ? (officialObtained / officialTotal) * 100 : 0;
    const { grade, gp } = isFullyDeclared
      ? gradeForPercentage(percentage)
      : { grade: "Pending", gp: 0 };
    const credits = reg.courseId?.creditHours || 3;

    resultsByStudent[sid].courses.push({
      courseCode: reg.courseId?.code,
      courseTitle: reg.courseId?.title,
      credits,
      officialObtained: isFullyDeclared ? officialObtained : null,
      officialTotal: isFullyDeclared ? officialTotal : null,
      isFullyDeclared,
      hasMarksInProgress: anyMarksEntered && !isFullyDeclared,
      grade,
      gp,
    });

    if (isFullyDeclared) {
      resultsByStudent[sid].totalCredits += credits;
      resultsByStudent[sid].earnedPoints += gp * credits;
    } else {
      resultsByStudent[sid].hasPendingCourses = true;
    }
  });

  const finalResults = Object.values(resultsByStudent).map((student) => ({
    ...student,
    sgpa:
      student.totalCredits > 0
        ? (student.earnedPoints / student.totalCredits).toFixed(2)
        : "0.00",
    status: student.hasPendingCourses
      ? "Pending"
      : student.totalCredits > 0 &&
          student.earnedPoints / student.totalCredits >= 2.0
        ? "Pass"
        : "Fail",
  }));

  res.status(200).json({ success: true, data: finalResults });
});

// ============================================================================
// DEPARTMENT RESULTS OVERVIEW — same aggregation as getStudentResultsOverview
// above, scoped to the HOD's own department's programs (via
// resolveHodDepartment setting req.hodDepartmentId). Backs the Department
// Reports screen: KPI cards + a breakdown by program/semester.
// ============================================================================
export const getDepartmentResultsOverview = asyncHandler(async (req, res) => {
  const { termId, semesterId } = req.query;
  if (!termId) {
    return res.status(400).json({ success: false, message: "termId is required." });
  }

  const query = { termId };
  if (semesterId && semesterId !== "all") query.semesterId = semesterId;

  if (req.hodDepartmentId) {
    const programs = await Program.find({ departmentId: req.hodDepartmentId })
      .select("_id")
      .lean();
    query.programId = { $in: programs.map((p) => p._id) };
  }

  const registrations = await StudentCourseRegistration.find(query)
    .populate("courseId", "title code creditHours")
    .populate("programId", "name")
    .populate({ path: "studentId", populate: { path: "personalInfo" } })
    .lean();

  const courseIds = [
    ...new Set(registrations.map((r) => String(r.courseId?._id)).filter(Boolean)),
  ];
  const exams = await Exam.find({
    termId,
    courseId: { $in: courseIds },
    publishStatus: "PUBLISHED",
  })
    .select("courseId totalMarks")
    .lean();
  const examsByCourse = new Map();
  exams.forEach((e) => {
    const key = String(e.courseId);
    if (!examsByCourse.has(key)) examsByCourse.set(key, []);
    examsByCourse.get(key).push(e);
  });

  const studentIds = [
    ...new Set(registrations.map((r) => String(r.studentId?._id)).filter(Boolean)),
  ];
  const results = await ExamResult.find({
    studentId: { $in: studentIds },
    examId: { $in: exams.map((e) => e._id) },
  }).lean();
  const resultsByStudentExam = new Map(
    results.map((r) => [`${r.studentId}_${r.examId}`, r]),
  );

  const resultsByStudent = {};

  registrations.forEach((reg) => {
    if (!reg.studentId || !reg.courseId) return;
    const sid = String(reg.studentId._id);
    const cid = String(reg.courseId._id);

    if (!resultsByStudent[sid]) {
      resultsByStudent[sid] = {
        studentId: sid,
        name: reg.studentId.personalInfo?.fullName || "N/A",
        rollNo: reg.studentId.studentId || "N/A",
        programName: reg.programId?.name || "N/A",
        semesterId: reg.semesterId,
        totalCredits: 0,
        earnedPoints: 0,
        hasPendingCourses: false,
      };
    }

    const courseExams = examsByCourse.get(cid) || [];
    let verifiedCount = 0;
    let officialObtained = 0;
    let officialTotal = 0;

    courseExams.forEach((exam) => {
      const result = resultsByStudentExam.get(`${sid}_${exam._id}`);
      if (!result) return;
      if (result.status === "Verified") {
        verifiedCount += 1;
        officialObtained += result.isAbsent ? 0 : result.obtainedMarks || 0;
        officialTotal += exam.totalMarks || 0;
      }
    });

    const isFullyDeclared = courseExams.length > 0 && verifiedCount === courseExams.length;
    const percentage = officialTotal > 0 ? (officialObtained / officialTotal) * 100 : 0;
    const { gp } = isFullyDeclared ? gradeForPercentage(percentage) : { gp: 0 };
    const credits = reg.courseId?.creditHours || 3;

    if (isFullyDeclared) {
      resultsByStudent[sid].totalCredits += credits;
      resultsByStudent[sid].earnedPoints += gp * credits;
    } else {
      resultsByStudent[sid].hasPendingCourses = true;
    }
  });

  const perStudent = Object.values(resultsByStudent).map((student) => ({
    ...student,
    sgpa:
      student.totalCredits > 0
        ? student.earnedPoints / student.totalCredits
        : 0,
    status: student.hasPendingCourses
      ? "Pending"
      : student.totalCredits > 0 && student.earnedPoints / student.totalCredits >= 2.0
        ? "Pass"
        : "Fail",
  }));

  const declared = perStudent.filter((s) => s.status !== "Pending");
  const passed = declared.filter((s) => s.status === "Pass").length;
  const avgSgpa =
    declared.length > 0
      ? declared.reduce((sum, s) => sum + s.sgpa, 0) / declared.length
      : 0;

  const byProgram = {};
  perStudent.forEach((s) => {
    const key = s.programName;
    if (!byProgram[key]) {
      byProgram[key] = { programName: key, totalStudents: 0, passed: 0, sgpaSum: 0, declaredCount: 0 };
    }
    byProgram[key].totalStudents += 1;
    if (s.status === "Pass") byProgram[key].passed += 1;
    if (s.status !== "Pending") {
      byProgram[key].sgpaSum += s.sgpa;
      byProgram[key].declaredCount += 1;
    }
  });

  const breakdown = Object.values(byProgram).map((p) => ({
    programName: p.programName,
    totalStudents: p.totalStudents,
    passRate: p.declaredCount > 0 ? ((p.passed / p.declaredCount) * 100).toFixed(1) : "0.0",
    avgSgpa: p.declaredCount > 0 ? (p.sgpaSum / p.declaredCount).toFixed(2) : "0.00",
  }));

  res.status(200).json({
    success: true,
    data: {
      totalStudents: perStudent.length,
      declaredCount: declared.length,
      passRate: declared.length > 0 ? ((passed / declared.length) * 100).toFixed(1) : "0.0",
      avgSgpa: avgSgpa.toFixed(2),
      breakdown,
    },
  });
});
