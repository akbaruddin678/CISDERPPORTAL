import StudentCourseRegistration from "../models/StudentCourseRegistration.js";
import ExamResult from "../../exam/models/ExamResult.js";

const id = (value) => String(value?._id || value || "");

// Same "has this student passed course X" logic as
// lms/controllers/lmsCourseController.js::buildRegistrationPlan (lines
// 20-55) — copied here as a shared helper rather than a fourth divergent
// implementation, so the admin registration screen's read-only prerequisite
// display never disagrees with what the mobile self-service flow enforces.
// The lms controller itself is left untouched.
export async function getPassedCourseIds(studentId) {
  const history = await StudentCourseRegistration.find({ studentId })
    .select("courseId status")
    .lean();
  const passed = new Set(
    history.filter((row) => row.status === "Passed").map((row) => id(row.courseId)),
  );
  const failed = new Set(
    history.filter((row) => row.status === "Failed").map((row) => id(row.courseId)),
  );

  // The official report card is authoritative even when an older
  // registration row was never backfilled from Registered to Passed/Failed.
  const verifiedResults = await ExamResult.find({
    studentId,
    status: { $in: ["Verified", "Locked"] },
    isAbsent: false,
  })
    .populate("examId", "courseId totalMarks")
    .lean();
  const totalsByCourse = new Map();
  verifiedResults.forEach((result) => {
    const courseId = id(result.examId?.courseId);
    if (!courseId) return;
    const totals = totalsByCourse.get(courseId) || { obtained: 0, total: 0 };
    totals.obtained += result.obtainedMarks || 0;
    totals.total += result.examId?.totalMarks || 0;
    totalsByCourse.set(courseId, totals);
  });
  totalsByCourse.forEach((totals, courseId) => {
    if (!totals.total) return;
    if ((totals.obtained / totals.total) * 100 >= 50) {
      passed.add(courseId);
      failed.delete(courseId);
    } else {
      failed.add(courseId);
      passed.delete(courseId);
    }
  });

  return passed;
}
