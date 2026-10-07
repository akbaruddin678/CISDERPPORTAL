import { asyncHandler } from "../middleware/asyncHandler.js";

// ✅ FIX 1: Point to the new course models directory
import StudentCourseRegistration from "../../course/models/StudentCourseRegistration.js";

// ✅ FIX 2: Use default import from the newly separated ExamResult file
import ExamResult from "../../exam/models/ExamResult.js";

export const getMyTranscripts = asyncHandler(async (req, res) => {
  const studentId = req.studentProfileId; // Securely from token

  // 1. Fetch all registered courses for the student
  const academicRecords = await StudentCourseRegistration.find({ studentId })
    .populate("courseId", "code title creditHours level")
    .populate("termId", "name")
    .populate("semesterId", "number")
    .lean();

  if (!academicRecords || academicRecords.length === 0) {
    return res.status(200).json({ success: true, data: [] });
  }

  // 2. Fetch all Exam Marks for this student AND populate the Exam to get the Course ID & Total Marks
  // Only HOD-approved (or admin manually-uploaded, which is auto-approved)
  // marks count toward the official transcript.
  const studentMarks = await ExamResult.find({
    studentId,
    isAbsent: false,
    status: "Verified",
  })
    .populate("examId", "courseId totalMarks type")
    .lean();

  // 3. Aggregate marks per course (Sum of Quizzes, Mid Terms, Finals)
  const courseTotals = {};

  studentMarks.forEach((mark) => {
    // Skip if exam data is missing or incomplete
    if (!mark.examId || !mark.examId.courseId) return;

    const cId = mark.examId.courseId.toString();

    if (!courseTotals[cId]) {
      courseTotals[cId] = { obtained: 0, total: 0 };
    }

    // Add up the obtained marks and the maximum possible marks for this exam
    courseTotals[cId].obtained += mark.obtainedMarks || 0;
    courseTotals[cId].total += mark.examId.totalMarks || 0;
  });

  // Helper function: Convert Percentage to Grade
  // (You can adjust these thresholds to match your University's exact policy)
  const calculateGrade = (percentage) => {
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

  // 4. Merge the calculated marks into the Course Registrations
  const mergedRecords = academicRecords.map((record) => {
    // Safety check in case courseId population failed
    if (!record.courseId || !record.courseId._id) return record;

    const cId = record.courseId._id.toString();
    const totals = courseTotals[cId];

    // If the student has been graded for this course
    if (totals && totals.total > 0) {
      const percentage = (totals.obtained / totals.total) * 100;
      const finalGrade = calculateGrade(percentage);

      return {
        ...record,
        grade: finalGrade,
        status: finalGrade === "F" ? "Failed" : "Passed",
        obtainedMarks: totals.obtained,
        totalMarks: totals.total,
        percentage: percentage.toFixed(2),
      };
    }

    // If no marks have been assigned yet, return as just "Registered"
    return record;
  });

  // 5. Sort chronologically by semester
  mergedRecords.sort(
    (a, b) => (a.semesterId?.number || 0) - (b.semesterId?.number || 0),
  );

  res.status(200).json({
    success: true,
    data: mergedRecords,
  });
});
