import CourseAssignment from "../../course/models/CourseAssignment.js";
import StaffProfile from "../models/StaffProfile.js";
import StaffDocument from "../models/StaffDocument.js";
import ExamMarksSubmission from "../../exam/models/ExamMarksSubmission.js";
import StaffLeaveRequest from "../models/StaffLeaveRequest.js";
import ClassSubstitution from "../models/ClassSubstitution.js";
import TimetableEntry from "../../registrar/models/TimetableEntry.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";

// ==========================================
// ACADEMIC: ASSIGN TEACHER TO A CLASS
// ==========================================
export const assignTeacherToClass = asyncHandler(async (req, res) => {
  const { termId, programId, courseId, semesterId, section, instructorId } =
    req.body;

  // 1. Verify the teacher exists and is active
  const teacher = await StaffProfile.findOne({
    _id: instructorId,
    status: "Active",
  });
  if (!teacher) {
    return res
      .status(404)
      .json({ message: "Invalid or inactive teacher selected." });
  }

  // 2. Create the Academic Link
  const assignment = await CourseAssignment.create({
    termId,
    programId,
    courseId,
    semesterId,
    section,
    instructorId: teacher._id, 
    capacity: 50,
  });

  res.status(201).json({
    success: true,
    message: "Teacher successfully assigned to the course.",
    data: assignment,
  });
});

// ==========================================
// TEACHER: GET MY ASSIGNED COURSES
// (latest/active session vs. history)
// ==========================================
export const getMyAssignedCourses = asyncHandler(async (req, res) => {
  const staffProfile = await StaffProfile.findOne({ userId: req.user._id })
    .select("_id")
    .lean();

  if (!staffProfile) {
    return res.status(403).json({
      success: false,
      message:
        "Your account is not linked to a staff profile. Contact HR to update your record.",
    });
  }

  const assignments = await CourseAssignment.find({
    instructorId: staffProfile._id,
  })
    .populate("courseId", "title code creditHours level")
    .populate("semesterId", "number name")
    .populate("programId", "name code")
    .populate("termId", "name code startDate endDate isActive")
    .sort({ createdAt: -1 })
    .lean();

  if (assignments.length === 0) {
    return res.status(200).json({ success: true, data: [], activeTermId: null });
  }

  // Determine the "active" session: prefer a Term explicitly flagged isActive
  // among the teacher's own assignments; otherwise fall back to whichever
  // term has the most recent startDate. Everything else is "history".
  const termMap = new Map();
  assignments.forEach((a) => {
    if (a.termId?._id) termMap.set(String(a.termId._id), a.termId);
  });
  const terms = [...termMap.values()];
  const explicitlyActive = terms.find((t) => t.isActive);
  const latestTerm =
    explicitlyActive ||
    [...terms].sort(
      (a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0),
    )[0];
  const activeTermId = latestTerm ? String(latestTerm._id) : null;

  const data = assignments.map((a) => ({
    ...a,
    isActive: activeTermId ? String(a.termId?._id) === activeTermId : false,
  }));

  res.status(200).json({ success: true, data, activeTermId });
});

// ============================================================================
// TEACHER DASHBOARD STATS — backs the "My Classes & Schedule" home hub's
// KPI row (replaces the previously hardcoded fake numbers).
// ============================================================================
export const getTeacherDashboardStats = asyncHandler(async (req, res) => {
  const staffProfile = await StaffProfile.findOne({ userId: req.user._id })
    // userId must stay selected — it's the localField the personalInfo
    // virtual populate matches against; without it the populate silently
    // returns nothing.
    .select("_id userId designation")
    .populate("personalInfo", "name profilePhotoUrl")
    .lean();

  if (!staffProfile) {
    return res.status(200).json({
      success: true,
      data: {
        activeCourseCount: 0,
        pendingMarksCount: 0,
        pendingLeaveCount: 0,
        openSubstitutionCount: 0,
        teacherName: null,
        designation: null,
        profilePhotoUrl: null,
      },
    });
  }
  const staffId = staffProfile._id;

  const assignments = await CourseAssignment.find({ instructorId: staffId })
    .populate("termId", "isActive startDate")
    .select("termId")
    .lean();

  const termMap = new Map();
  assignments.forEach((a) => {
    if (a.termId?._id) termMap.set(String(a.termId._id), a.termId);
  });
  const terms = [...termMap.values()];
  const explicitlyActive = terms.find((t) => t.isActive);
  const latestTerm =
    explicitlyActive ||
    [...terms].sort(
      (a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0),
    )[0];
  const activeTermId = latestTerm ? String(latestTerm._id) : null;
  const activeCourseCount = activeTermId
    ? assignments.filter((a) => String(a.termId?._id) === activeTermId).length
    : 0;

  const [pendingMarksCount, pendingLeaveCount, openSubstitutionCount] = await Promise.all([
    ExamMarksSubmission.countDocuments({
      teacherId: staffId,
      status: { $in: ["DRAFT", "RETURNED"] },
    }),
    StaffLeaveRequest.countDocuments({
      staffId,
      status: { $in: ["Pending", "Approved_HOD"] },
    }),
    ClassSubstitution.countDocuments({
      status: "Requested",
      substituteTeacherId: null,
      requestingTeacherId: { $ne: staffId },
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      activeCourseCount,
      pendingMarksCount,
      pendingLeaveCount,
      openSubstitutionCount,
      teacherName: staffProfile.personalInfo?.name || null,
      designation: staffProfile.designation || null,
      profilePhotoUrl: staffProfile.personalInfo?.profilePhotoUrl || null,
    },
  });
});

// ============================================================================
// MY PROFILE — the logged-in teacher's own full details (identity, contact,
// academic credentials, employment/contract, and their document vault) for
// the standalone "My Profile" dashboard page. Read-only; editing profile
// fields remains an HR-only action via the Staff Directory.
// ============================================================================
export const getMyStaffProfile = asyncHandler(async (req, res) => {
  const staffProfile = await StaffProfile.findOne({ userId: req.user._id })
    .populate(
      "personalInfo",
      "name dob gender profilePhotoUrl contact emergencyContact nationalId",
    )
    .populate("departmentId", "name")
    .lean();

  if (!staffProfile) {
    return res.status(404).json({
      success: false,
      message: "Your account is not linked to a staff profile.",
    });
  }

  const documents = await StaffDocument.find({ staffId: staffProfile._id })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: { profile: staffProfile, documents },
  });
});

// ============================================================================
// MY TIMETABLE — the logged-in teacher's own weekly schedule (day, time
// slot, room) across every course they're assigned to, resolved from the
// Registrar/HOD-maintained TimetableEntry records. Read-only for teachers.
// ============================================================================
export const getMyTimetable = asyncHandler(async (req, res) => {
  const staffProfile = await StaffProfile.findOne({ userId: req.user._id })
    .select("_id")
    .lean();

  if (!staffProfile) {
    return res.status(200).json({ success: true, data: [] });
  }

  const myAssignments = await CourseAssignment.find({ instructorId: staffProfile._id })
    .select("_id")
    .lean();

  const entries = await TimetableEntry.find({
    courseAssignmentId: { $in: myAssignments.map((a) => a._id) },
  })
    .populate({
      path: "courseAssignmentId",
      populate: [
        { path: "courseId", select: "title code" },
        { path: "programId", select: "name" },
        { path: "semesterId", select: "number" },
        { path: "termId", select: "name isActive" },
      ],
    })
    .populate("roomId", "name capacity")
    .sort({ day: 1, slot: 1 })
    .lean();

  res.status(200).json({ success: true, data: entries });
});
