import { asyncHandler } from "../../core/utils/asyncHandler.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import CourseAssignment from "../models/CourseAssignment.js";
import StudentCourseRegistration from "../models/StudentCourseRegistration.js";
import StaffProfile from "../../staff/models/StaffProfile.js";

const resolveTeacherId = async (req) => {
  const staffProfile = await StaffProfile.findOne({ userId: req.user._id })
    .select("_id")
    .lean();
  return staffProfile?._id || null;
};

const isAdmin = (req) => req.user?.roles?.includes("admin");

const assertOwnsAssignment = async (req, courseAssignmentId, teacherId) => {
  const assignment = await CourseAssignment.findById(courseAssignmentId).lean();
  if (!assignment) return null;
  if (!isAdmin(req) && String(assignment.instructorId) !== String(teacherId)) {
    return null;
  }
  return assignment;
};

const normalizeDate = (input) => {
  const d = input ? new Date(input) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEnrolledStudents = (assignment) =>
  StudentCourseRegistration.find({
    termId: assignment.termId,
    courseId: assignment.courseId,
    semesterId: assignment.semesterId,
    status: { $in: ["Registered", "In-Progress"] },
  })
    .populate({
      path: "studentId",
      select: "studentId personalInfo",
      populate: { path: "personalInfo", select: "fullName" },
    })
    .lean();

// ============================================================================
// GET ROSTER — enrolled students, with today's (or the given date's) marked
// status already merged in, for the "Mark Attendance" screen.
// ============================================================================
export const getRoster = asyncHandler(async (req, res) => {
  const { courseAssignmentId, date } = req.query;
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

  const assignment = await assertOwnsAssignment(req, courseAssignmentId, teacherId);
  if (!assignment) {
    return res
      .status(403)
      .json({ success: false, message: "You are not assigned to this course." });
  }

  const registrations = await getEnrolledStudents(assignment);

  const targetDate = normalizeDate(date);
  const todaysRecords = await AttendanceRecord.find({
    courseAssignmentId,
    date: targetDate,
  }).lean();
  const statusByStudent = new Map(
    todaysRecords.map((r) => [String(r.studentId), r.status]),
  );

  const roster = registrations
    .filter((r) => r.studentId)
    .map((r) => ({
      studentId: String(r.studentId._id),
      rollNo: r.studentId.studentId,
      name: r.studentId.personalInfo?.fullName || "Unknown",
      status: statusByStudent.get(String(r.studentId._id)) || null,
    }));

  res.status(200).json({ success: true, data: roster, date: targetDate });
});

// ============================================================================
// MARK ATTENDANCE — bulk upsert of statuses for one date
// ============================================================================
export const markAttendance = asyncHandler(async (req, res) => {
  const { courseAssignmentId, date, records } = req.body;
  if (!courseAssignmentId || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({
      success: false,
      message: "courseAssignmentId and records[] are required.",
    });
  }

  const teacherId = await resolveTeacherId(req);
  if (!isAdmin(req) && !teacherId) {
    return res.status(403).json({
      success: false,
      message: "Your account is not linked to a staff profile.",
    });
  }
  const assignment = await assertOwnsAssignment(req, courseAssignmentId, teacherId);
  if (!assignment) {
    return res
      .status(403)
      .json({ success: false, message: "You are not assigned to this course." });
  }

  const targetDate = normalizeDate(date);
  const resolvedTeacherId = teacherId || assignment.instructorId;

  const ops = records
    .filter((r) => r.studentId && ["Present", "Absent", "Late"].includes(r.status))
    .map((r) => ({
      updateOne: {
        filter: { courseAssignmentId, studentId: r.studentId, date: targetDate },
        update: { $set: { status: r.status, teacherId: resolvedTeacherId } },
        upsert: true,
      },
    }));

  if (ops.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No valid attendance records to save." });
  }

  await AttendanceRecord.bulkWrite(ops);

  res.status(200).json({
    success: true,
    message: `Attendance saved for ${ops.length} student(s).`,
  });
});

// ============================================================================
// CLASS REPORT — per-student aggregate stats across every session held
// ============================================================================
export const getClassReport = asyncHandler(async (req, res) => {
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
  const assignment = await assertOwnsAssignment(req, courseAssignmentId, teacherId);
  if (!assignment) {
    return res
      .status(403)
      .json({ success: false, message: "You are not assigned to this course." });
  }

  const registrations = await getEnrolledStudents(assignment);
  const records = await AttendanceRecord.find({ courseAssignmentId }).lean();

  const sessionDates = new Set(records.map((r) => new Date(r.date).getTime()));
  const totalSessions = sessionDates.size;

  const byStudent = new Map();
  records.forEach((r) => {
    const key = String(r.studentId);
    if (!byStudent.has(key)) byStudent.set(key, { Present: 0, Absent: 0, Late: 0 });
    byStudent.get(key)[r.status] += 1;
  });

  const students = registrations
    .filter((r) => r.studentId)
    .map((r) => {
      const key = String(r.studentId._id);
      const counts = byStudent.get(key) || { Present: 0, Absent: 0, Late: 0 };
      const attended = counts.Present + counts.Late;
      const percentage =
        totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;
      return {
        studentId: key,
        rollNo: r.studentId.studentId,
        name: r.studentId.personalInfo?.fullName || "Unknown",
        present: counts.Present,
        absent: counts.Absent,
        late: counts.Late,
        percentage,
      };
    });

  res.status(200).json({ success: true, data: { totalSessions, students } });
});

// ============================================================================
// INDIVIDUAL STUDENT REPORT — full day-by-day log + monthly breakdown
// ============================================================================
export const getStudentReport = asyncHandler(async (req, res) => {
  const { courseAssignmentId, studentId } = req.query;
  if (!courseAssignmentId || !studentId) {
    return res.status(400).json({
      success: false,
      message: "courseAssignmentId and studentId are required.",
    });
  }

  const teacherId = await resolveTeacherId(req);
  if (!isAdmin(req) && !teacherId) {
    return res.status(403).json({
      success: false,
      message: "Your account is not linked to a staff profile.",
    });
  }
  const assignment = await assertOwnsAssignment(req, courseAssignmentId, teacherId);
  if (!assignment) {
    return res
      .status(403)
      .json({ success: false, message: "You are not assigned to this course." });
  }

  const records = await AttendanceRecord.find({ courseAssignmentId, studentId })
    .sort({ date: 1 })
    .lean();

  const monthly = new Map();
  records.forEach((r) => {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthly.has(key)) {
      monthly.set(key, { month: key, present: 0, absent: 0, late: 0 });
    }
    const bucket = monthly.get(key);
    if (r.status === "Present") bucket.present += 1;
    else if (r.status === "Absent") bucket.absent += 1;
    else if (r.status === "Late") bucket.late += 1;
  });

  res.status(200).json({
    success: true,
    data: {
      log: records.map((r) => ({ date: r.date, status: r.status })),
      monthly: [...monthly.values()],
    },
  });
});
