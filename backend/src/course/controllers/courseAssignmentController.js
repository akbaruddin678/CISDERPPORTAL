import mongoose from "mongoose";
import CourseAssignment from "../models/CourseAssignment.js";
import StudentProfile from "../../student/models/StudentProfile.js";
import StudentCourseRegistration from "../models/StudentCourseRegistration.js";
import Exam from "../../exam/models/Exam.js";
import ExamMarksSubmission from "../../exam/models/ExamMarksSubmission.js";
import ExamAttendanceSubmission from "../../exam/models/ExamAttendanceSubmission.js";
import UFMReport from "../../exam/models/UFMReport.js";
import ExamResult from "../../exam/models/ExamResult.js";
import ReEvaluation from "../../exam/models/ReEvaluation.js";
import Course from "../models/Course.js";
import CourseWithdrawalRecord from "../models/CourseWithdrawalRecord.js";
import StaffProfile from "../../staff/models/StaffProfile.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import {
  assertProgramInScope,
  assertProgramsInScope,
} from "../middleware/courseAssignmentScope.js";

// ============================================================================
// 1. GET ALL ASSIGNMENTS (For the Table)
// ============================================================================
export const getAssignments = asyncHandler(async (req, res) => {
  const { termId, programId, semesterId } = req.query;

  // HODs must scope every read to a specific program within their own
  // department — never allow a blanket cross-department listing.
  if (req.hodDepartmentId) {
    if (!programId) {
      return res.status(400).json({
        success: false,
        message: "programId is required.",
      });
    }
    const inScope = await assertProgramInScope(req, programId);
    if (!inScope) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view allocations for this program.",
      });
    }
  }

  const query = {};
  if (termId) query.termId = termId;
  if (programId) query.programId = programId;
  if (semesterId) query.semesterId = semesterId;

  const assignments = await CourseAssignment.find(query)
    .populate("courseId", "title code creditHours level status")
    .populate("semesterId", "number name")
    .populate({
      path: "instructorId",
      populate: {
        path: "personalInfo",
        model: "Person", // Matches the unified Person model
        select: "name contact",
      },
    })
    .lean();

  // Counts are section-specific. A registration stores its CourseAssignment
  // so Section A and B never share or overstate the same roster.
  if (assignments.length > 0) {
    const counts = await StudentCourseRegistration.aggregate([
      {
        $match: {
          courseAssignmentId: { $in: assignments.map((a) => a._id) },
          status: { $in: ["Registered", "In-Progress"] },
        },
      },
      {
        $group: {
          _id: "$courseAssignmentId",
          count: { $sum: 1 },
        },
      },
    ]);
    const countMap = new Map(
      counts.map((c) => [
        String(c._id),
        c.count,
      ]),
    );
    for (const a of assignments) {
      a.registeredCount = countMap.get(String(a._id)) || 0;
    }
  }

  res.status(200).json({ success: true, data: assignments });
});

// ============================================================================
// 2. CREATE ALLOCATIONS (Assign Course to Semester + Teacher)
// ============================================================================
export const createAllocation = asyncHandler(async (req, res) => {
  const {
    termId,
    programId,
    semesterId,
    // Preferred shape — lets a multi-course assignment give each course its
    // own instructor: [{ courseId, instructorId }]. `courseIds` + a single
    // `instructorId` is still accepted (applies that one instructor to
    // every course) for older callers.
    courses,
    courseIds,
    sections,
    capacity,
    courseType,
    instructorId,
  } = req.body;

  const courseEntries =
    Array.isArray(courses) && courses.length > 0
      ? courses
      : (courseIds || []).map((courseId) => ({ courseId, instructorId }));

  if (
    !termId ||
    !programId ||
    !semesterId ||
    courseEntries.length === 0 ||
    !sections?.length
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields." });
  }

  // Hard rule, not just a disabled chip in the UI — refuse to assign a
  // course into a semester nobody is currently enrolled in.
  const hasActiveStudents = await StudentProfile.exists({
    programId,
    semesterId,
    status: "active",
  });
  if (!hasActiveStudents) {
    return res.status(400).json({
      success: false,
      message:
        "This semester has no active students — a course can't be assigned to it.",
    });
  }

  const inScope = await assertProgramInScope(req, programId);
  if (!inScope) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to allocate courses for this program.",
    });
  }

  const courseIdList = courseEntries.map((c) => c.courseId);

  // A course can only live in ONE semester within a given session (term) for
  // a given program — offering the same course across multiple semesters in
  // the same session is a curriculum-planning error, not a valid scenario.
  const conflicts = await CourseAssignment.find({
    termId,
    programId,
    courseId: { $in: courseIdList },
    semesterId: { $ne: semesterId },
  })
    .populate("courseId", "title code")
    .populate("semesterId", "number")
    .lean();

  if (conflicts.length > 0) {
    const seen = new Set();
    const details = [];
    for (const c of conflicts) {
      const key = String(c.courseId?._id || c.courseId);
      if (seen.has(key)) continue;
      seen.add(key);
      details.push(
        `${c.courseId?.code ? `${c.courseId.code} - ` : ""}${
          c.courseId?.title || "This course"
        } is already offered in Semester ${
          c.semesterId?.number ?? "?"
        } for this session.`,
      );
    }
    return res.status(409).json({
      success: false,
      message:
        "One or more selected courses are already offered in a different semester within this session.",
      conflicts: details,
    });
  }

  for (const entry of courseEntries) {
    for (const sec of sections) {
      await CourseAssignment.findOneAndUpdate(
        { termId, programId, semesterId, courseId: entry.courseId, section: sec },
        {
          instructorId: entry.instructorId || null,
          capacity,
          courseType: entry.courseType || courseType || "MANDATORY",
        },
        { upsert: true, new: true },
      );
    }
  }

  res
    .status(201)
    .json({
      success: true,
      message: "Course allocated to semester successfully.",
    });
});

// ============================================================================
// 3. DELETE COURSE ASSIGNMENT
// ============================================================================
export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await CourseAssignment.findById(req.params.id);
  if (!assignment) {
    return res
      .status(404)
      .json({ success: false, message: "Assignment not found." });
  }

  const inScope = await assertProgramInScope(req, assignment.programId);
  if (!inScope) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to remove this offering.",
    });
  }

  await CourseAssignment.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: "Course offering removed." });
});

// ============================================================================
// 3b. BULK DELETE COURSE ASSIGNMENTS
// ============================================================================
export const bulkDeleteAssignments = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No assignment IDs provided." });
  }

  const targets = await CourseAssignment.find({ _id: { $in: ids } })
    .select("programId")
    .lean();

  if (targets.length === 0) {
    return res
      .status(404)
      .json({ success: false, message: "No matching course offerings found." });
  }

  const inScope = await assertProgramsInScope(
    req,
    targets.map((t) => t.programId),
  );
  if (!inScope) {
    return res.status(403).json({
      success: false,
      message:
        "You are not authorized to modify one or more of the selected offerings.",
    });
  }

  const result = await CourseAssignment.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
    message: `${result.deletedCount} course offering(s) removed.`,
    deletedCount: result.deletedCount,
  });
});

// ============================================================================
// 3c. BULK UNASSIGN INSTRUCTOR
// ============================================================================
export const bulkUnassignInstructor = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No assignment IDs provided." });
  }

  const targets = await CourseAssignment.find({ _id: { $in: ids } })
    .select("programId")
    .lean();

  if (targets.length === 0) {
    return res
      .status(404)
      .json({ success: false, message: "No matching course offerings found." });
  }

  const inScope = await assertProgramsInScope(
    req,
    targets.map((t) => t.programId),
  );
  if (!inScope) {
    return res.status(403).json({
      success: false,
      message:
        "You are not authorized to modify one or more of the selected offerings.",
    });
  }

  const result = await CourseAssignment.updateMany(
    { _id: { $in: ids } },
    { $set: { instructorId: null } },
  );

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} course offering(s) unassigned.`,
    modifiedCount: result.modifiedCount,
  });
});

// ============================================================================
// 4. GET ELIGIBLE STUDENTS & CURRENT ROSTER
// ============================================================================
export const getAssignmentRoster = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const assignment = await CourseAssignment.findById(id);
  if (!assignment)
    return res
      .status(404)
      .json({ success: false, message: "Assignment not found." });

  if (!(await assertProgramInScope(req, assignment.programId))) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to view this roster.",
    });
  }

  // 1. Get active students
  const eligibleStudents = await StudentProfile.find({
    programId: assignment.programId,
    semesterId: assignment.semesterId,
    status: "active",
  })
    .populate("personalInfo", "fullName")
    .lean();

  // 2. Get students registered in this specific course
  const registeredDocs = await StudentCourseRegistration.find({
    courseAssignmentId: assignment._id,
    status: { $in: ["Registered", "In-Progress"] },
  }).lean();

  const registeredStudentIds = registeredDocs.map((r) =>
    r.studentId.toString(),
  );

  // 3. Map status
  const roster = eligibleStudents.map((student) => ({
    _id: student._id,
    studentId: student.studentId,
    name: student.personalInfo?.fullName || "Unknown",
    isEnrolled: registeredStudentIds.includes(student._id.toString()),
  }));

  res.status(200).json({ success: true, data: roster });
});

// ============================================================================
// 5. BULK UPDATE ROSTER (Save Enrollments)
// ============================================================================
export const updateAssignmentRoster = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { studentIds } = req.body;

  const assignment = await CourseAssignment.findById(id);
  if (!assignment)
    return res
      .status(404)
      .json({ success: false, message: "Assignment not found." });

  if (!(await assertProgramInScope(req, assignment.programId))) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to update this roster.",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const uniqueStudentIds = [...new Set((studentIds || []).map(String))];
    if (uniqueStudentIds.length > assignment.capacity) {
      await session.abortTransaction();
      return res.status(409).json({ success: false, message: `Section ${assignment.section} is limited to ${assignment.capacity} students.` });
    }
    const eligibleCount = await StudentProfile.countDocuments({
      _id: { $in: uniqueStudentIds },
      programId: assignment.programId,
      semesterId: assignment.semesterId,
      status: "active",
    }).session(session);
    if (eligibleCount !== uniqueStudentIds.length) {
      await session.abortTransaction();
      return res.status(409).json({ success: false, message: "One or more selected students are not active in this program and semester." });
    }

    // 1. Wipe only this section's roster.
    await StudentCourseRegistration.deleteMany({
      courseAssignmentId: assignment._id,
    }).session(session);

    // 2. Insert new registrations
    if (uniqueStudentIds.length > 0) {
      const newRegistrations = uniqueStudentIds.map((sId) => ({
        studentId: sId,
        termId: assignment.termId,
        programId: assignment.programId,
        semesterId: assignment.semesterId,
        courseId: assignment.courseId,
        courseAssignmentId: assignment._id,
        section: assignment.section,
        status: "Registered",
      }));
      await StudentCourseRegistration.insertMany(newRegistrations, { session });
    }
    assignment.enrolledCount = uniqueStudentIds.length;
    await assignment.save({ session });

    await session.commitTransaction();
    res
      .status(200)
      .json({ success: true, message: "Class roster updated successfully." });
  } catch (error) {
    await session.abortTransaction();
    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message: error.code === 11000
        ? "A selected student is already registered for this course in another section."
        : error.message,
    });
  } finally {
    session.endSession();
  }
});

// ============================================================================
// 6. MONITOR FACULTY & COURSES — one row per course assignment in scope,
// cross-referenced with published-exam count and marks-submission progress
// so an HOD can see at a glance whether each section's exam/marks pipeline
// is on track. Same dept-scoping requirement as getAssignments.
// ============================================================================
const summarizeMarksStatus = (submissions) => {
  if (submissions.length === 0) return "Not Started";
  if (submissions.some((s) => ["DRAFT", "RETURNED"].includes(s.status))) {
    return "Needs Attention";
  }
  if (
    submissions.some((s) =>
      ["PENDING_HOD", "PENDING_ACADEMIA", "PENDING_VC"].includes(s.status),
    )
  ) {
    return "Pending Review";
  }
  if (submissions.every((s) => s.status === "APPROVED")) return "Approved";
  return "In Progress";
};

export const getFacultyMonitoringOverview = asyncHandler(async (req, res) => {
  const { termId, programId, semesterId } = req.query;

  if (req.hodDepartmentId) {
    if (!programId) {
      return res.status(400).json({ success: false, message: "programId is required." });
    }
    const inScope = await assertProgramInScope(req, programId);
    if (!inScope) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to monitor allocations for this program.",
      });
    }
  }

  const query = {};
  if (termId) query.termId = termId;
  if (programId) query.programId = programId;
  if (semesterId) query.semesterId = semesterId;

  const assignments = await CourseAssignment.find(query)
    .populate("courseId", "title code")
    .populate("semesterId", "number")
    .populate({
      path: "instructorId",
      populate: { path: "personalInfo", select: "fullName" },
    })
    .lean();

  if (assignments.length === 0) {
    return res.status(200).json({ success: true, data: [] });
  }

  const assignmentIds = assignments.map((a) => a._id);
  const courseIds = [...new Set(assignments.map((a) => String(a.courseId?._id || a.courseId)))];

  const [examCounts, submissions] = await Promise.all([
    Exam.aggregate([
      {
        $match: {
          courseId: { $in: courseIds.map((id) => new mongoose.Types.ObjectId(id)) },
          publishStatus: "PUBLISHED",
          ...(termId ? { termId: new mongoose.Types.ObjectId(termId) } : {}),
          ...(semesterId ? { semesterId: new mongoose.Types.ObjectId(semesterId) } : {}),
        },
      },
      { $group: { _id: "$courseId", count: { $sum: 1 } } },
    ]),
    ExamMarksSubmission.find({ courseAssignmentId: { $in: assignmentIds } })
      .select("courseAssignmentId status")
      .lean(),
  ]);

  const examCountByCourse = new Map(examCounts.map((e) => [String(e._id), e.count]));
  const submissionsByAssignment = new Map();
  submissions.forEach((s) => {
    const key = String(s.courseAssignmentId);
    if (!submissionsByAssignment.has(key)) submissionsByAssignment.set(key, []);
    submissionsByAssignment.get(key).push(s);
  });

  const data = assignments.map((a) => ({
    assignmentId: String(a._id),
    courseTitle: a.courseId?.title || "Unknown Course",
    courseCode: a.courseId?.code || "N/A",
    section: a.section || "",
    semesterNumber: a.semesterId?.number,
    instructorName: a.instructorId?.personalInfo?.fullName || "Unassigned",
    publishedExamCount: examCountByCourse.get(String(a.courseId?._id || a.courseId)) || 0,
    marksSubmissionStatus: summarizeMarksStatus(
      submissionsByAssignment.get(String(a._id)) || [],
    ),
  }));

  res.status(200).json({ success: true, data });
});

// ============================================================================
// 7. HOD DASHBOARD STATS — pending-action counts + department overview
// numbers backing the HOD landing page's KPI row + "Action Required" panel.
// ============================================================================
export const getHodDashboardStats = asyncHandler(async (req, res) => {
  const deptId = req.hodDepartmentId;

  // Every course/section belonging to programs in this department, used to
  // scope Marks submissions (which don't store departmentId directly).
  let assignmentIds = [];
  let examIds = [];
  let resultIds = [];
  let departmentCourseCount = 0;
  let departmentStudentCount = 0;

  if (deptId) {
    const [assignments, exams, courseCount] = await Promise.all([
      CourseAssignment.find({}).populate({ path: "programId", select: "departmentId" }).select("_id programId").lean(),
      Exam.find({ departmentId: deptId }).select("_id").lean(),
      Course.countDocuments({ owningDepartmentId: deptId }),
    ]);
    assignmentIds = assignments
      .filter((a) => String(a.programId?.departmentId) === String(deptId))
      .map((a) => a._id);
    examIds = exams.map((e) => e._id);
    departmentCourseCount = courseCount;

    const results = await ExamResult.find({ examId: { $in: examIds } }).select("_id").lean();
    resultIds = results.map((r) => r._id);

    departmentStudentCount = await StudentProfile.countDocuments({
      status: "active",
      departmentId: deptId,
    });
  } else {
    // Admin/manager callers are unscoped — counts span every department.
    const [assignments, exams, courseCount, studentCount] = await Promise.all([
      CourseAssignment.find({}).select("_id").lean(),
      Exam.find({}).select("_id").lean(),
      Course.countDocuments({}),
      StudentProfile.countDocuments({ status: "active" }),
    ]);
    assignmentIds = assignments.map((a) => a._id);
    examIds = exams.map((e) => e._id);
    departmentCourseCount = courseCount;
    departmentStudentCount = studentCount;
    const results = await ExamResult.find({ examId: { $in: examIds } }).select("_id").lean();
    resultIds = results.map((r) => r._id);
  }

  const [
    pendingMarksCount,
    pendingAttendanceCount,
    pendingUfmCount,
    pendingReEvalCount,
  ] = await Promise.all([
    ExamMarksSubmission.countDocuments({
      status: "PENDING_HOD",
      courseAssignmentId: { $in: assignmentIds },
    }),
    ExamAttendanceSubmission.countDocuments({
      status: "PENDING_HOD",
      examId: { $in: examIds },
    }),
    UFMReport.countDocuments({
      status: { $in: ["Reported", "Under Review"] },
      examId: { $in: examIds },
    }),
    ReEvaluation.countDocuments({
      status: { $in: ["Applied", "Under Review"] },
      resultId: { $in: resultIds },
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      pendingMarksCount,
      pendingAttendanceCount,
      pendingUfmCount,
      pendingReEvalCount,
      departmentCourseCount,
      departmentStudentCount,
    },
  });
});

// ============================================================================
// 8. COURSE WITHDRAWALS — HOD is the sole decision-maker (no separate
// submit-then-approve chain); Registrar only ever reads the register.
// ============================================================================

// Active registrations in the HOD's own department, for the "who am I
// withdrawing" picker on the new HOD screen.
export const getWithdrawableRegistrations = asyncHandler(async (req, res) => {
  const query = { status: { $in: ["Registered", "In-Progress"] } };

  if (req.hodDepartmentId) {
    const inScope = await assertProgramInScope(req, req.query.programId);
    if (!req.query.programId || !inScope) {
      return res.status(400).json({
        success: false,
        message: "A programId within your own department is required.",
      });
    }
    query.programId = req.query.programId;
  } else if (req.query.programId) {
    query.programId = req.query.programId;
  }

  const registrations = await StudentCourseRegistration.find(query)
    .populate({
      path: "studentId",
      select: "studentId personalInfo",
      populate: { path: "personalInfo", select: "fullName" },
    })
    .populate("courseId", "title code")
    .populate("semesterId", "number")
    .populate("termId", "name")
    .lean();

  res.status(200).json({ success: true, data: registrations });
});

// HOD directly withdraws a student from a course — one step, no approval
// chain. Sets the registration to "Dropped" and logs the decision.
export const createCourseWithdrawal = asyncHandler(async (req, res) => {
  const { studentCourseRegistrationId, withdrawalType, reason } = req.body;
  if (!studentCourseRegistrationId || !withdrawalType || !reason) {
    return res.status(400).json({
      success: false,
      message: "studentCourseRegistrationId, withdrawalType and reason are required.",
    });
  }

  const registration = await StudentCourseRegistration.findById(studentCourseRegistrationId);
  if (!registration) {
    return res.status(404).json({ success: false, message: "Course registration not found." });
  }

  const inScope = await assertProgramInScope(req, registration.programId);
  if (!inScope) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to withdraw a student outside your department.",
    });
  }

  const staffProfile = await StaffProfile.findOne({ userId: req.user._id }).select("_id").lean();
  if (!staffProfile) {
    return res.status(403).json({
      success: false,
      message: "Your account is not linked to a staff profile.",
    });
  }

  registration.status = "Dropped";
  await registration.save();

  const record = await CourseWithdrawalRecord.create({
    studentCourseRegistrationId,
    decidedBy: staffProfile._id,
    withdrawalType,
    reason,
  });

  res.status(201).json({ success: true, message: "Student withdrawn from course.", data: record });
});

// ============================================================================
// 9. SEMESTERS WITH ACTIVE STUDENTS — the Semester picker uses this to
// disable a semester nobody is currently enrolled in (same pattern as the
// Exam module's Create Exam screen).
// ============================================================================
export const getSemestersWithActiveStudents = asyncHandler(async (req, res) => {
  const { programId } = req.query;
  if (!programId) {
    return res
      .status(400)
      .json({ success: false, message: "programId is required." });
  }

  const inScope = await assertProgramInScope(req, programId);
  if (!inScope) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to view this program.",
    });
  }

  const counts = await StudentProfile.aggregate([
    {
      $match: {
        programId: new mongoose.Types.ObjectId(programId),
        status: "active",
      },
    },
    { $group: { _id: "$semesterId", activeStudentCount: { $sum: 1 } } },
  ]);

  res.status(200).json({
    success: true,
    data: counts.map((c) => ({
      semesterId: String(c._id),
      activeStudentCount: c.activeStudentCount,
    })),
  });
});

// Registrar-facing read-only register of every withdrawal decision made —
// mirrors the Exam Results Register pattern: Registrar sees, never acts.
export const getCourseWithdrawalRegister = asyncHandler(async (req, res) => {
  const records = await CourseWithdrawalRecord.find()
    .populate({
      path: "studentCourseRegistrationId",
      populate: [
        {
          path: "studentId",
          select: "studentId personalInfo",
          populate: { path: "personalInfo", select: "fullName" },
        },
        { path: "courseId", select: "title code" },
        { path: "semesterId", select: "number" },
        { path: "termId", select: "name" },
      ],
    })
    .populate({
      path: "decidedBy",
      populate: { path: "personalInfo", select: "fullName" },
    })
    .sort({ decidedAt: -1 })
    .lean();

  res.status(200).json({ success: true, data: records });
});
