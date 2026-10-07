import { asyncHandler } from "../middleware/asyncHandler.js";
import StudentProfile from "../../student/models/StudentProfile.js";

// ✅ UPDATED IMPORTS: Pointing to the new folder structure
import StudentCourseRegistration from "../../course/models/StudentCourseRegistration.js";
import TimetableEntry from "../../registrar/models/TimetableEntry.js";
import CourseMaterial from "../../course/models/CourseMaterial.js"; // Make sure you moved this file here too!
import Exam from "../../exam/models/Exam.js"; // Updated to default import
import { backfillCurrentRegistrationSections } from "../services/sectionRegistrationBackfill.js";

// ==========================================
// 1. GET STUDENT TIMETABLE
// ==========================================
export const getMyTimetable = asyncHandler(async (req, res) => {
  const studentId = req.studentProfileId;

  const student = await StudentProfile.findById(studentId);
  if (!student) return res.status(404).json({ message: "Profile not found" });
  await backfillCurrentRegistrationSections(student);

  // 1. Find all courses the student is currently registered for
  const registrations = await StudentCourseRegistration.find({
    studentId,
    termId: student.termId,
    status: { $in: ["Registered", "In-Progress"] },
  });

  const assignmentIds = registrations.map((registration) => registration.courseAssignmentId).filter(Boolean);
  const entries = await TimetableEntry.find({ courseAssignmentId: { $in: assignmentIds } })
    .populate({ path: "courseAssignmentId", populate: { path: "courseId", select: "code title" } })
    .lean();

  // 3. Format data perfectly for the React frontend (Group by Day)
  const scheduleData = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
  };

  entries.forEach((entry) => {
    const assignment = entry.courseAssignmentId;
    if (!assignment || !scheduleData[entry.day]) return;
    scheduleData[entry.day].push({
      course: `${assignment.courseId?.code || ""} ${assignment.courseId?.title || "Course"}`.trim(),
      time: entry.slot,
      room: entry.room,
      section: assignment.section,
      type: "Class",
      color: "bg-blue-50 border-blue-200 text-blue-800",
    });
  });

  // Sort times chronologically per day
  for (let day in scheduleData) {
    scheduleData[day].sort((a, b) => a.time.localeCompare(b.time));
  }

  res.status(200).json({ success: true, data: scheduleData });
});

// ==========================================
// 2. GET CLASSROOM MATERIALS
// ==========================================
export const getClassroomMaterials = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.studentProfileId;
  const student = await StudentProfile.findById(studentId);

  const materials = await CourseMaterial.find({
    courseId,
    termId: student.termId,
  }).sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: materials });
});

// ==========================================
// 3. GET DATESHEET
// ==========================================
export const getMyDateSheet = asyncHandler(async (req, res) => {
  const studentId = req.studentProfileId;

  // 1. Get the student's profile to know their active term and program
  const student = await StudentProfile.findById(studentId);
  if (!student) return res.status(404).json({ message: "Profile not found" });

  // 2. Find the courses the student is actually registered for this term
  const registrations = await StudentCourseRegistration.find({
    studentId,
    termId: student.termId,
    status: { $in: ["Registered", "In-Progress"] },
  });

  const registeredCourseIds = registrations.map((r) => r.courseId);

  if (registeredCourseIds.length === 0) {
    return res.status(200).json({ success: true, data: [] });
  }

  // 3. Fetch scheduled exams for those specific courses
  const exams = await Exam.find({
    termId: student.termId,
    courseId: { $in: registeredCourseIds },
    // Optionally filter by type: { $in: ["Mid Term", "Final Exam"] }
  })
    .populate("courseId", "code title")
    .sort({ date: 1, startTime: 1 }); // Sort chronologically

  res.status(200).json({ success: true, data: exams });
});
