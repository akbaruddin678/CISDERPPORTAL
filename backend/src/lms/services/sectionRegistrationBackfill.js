import mongoose from "mongoose";
import CourseAssignment from "../../course/models/CourseAssignment.js";
import StudentCourseRegistration from "../../course/models/StudentCourseRegistration.js";

const ACTIVE_STATUSES = ["Registered", "In-Progress"];
const sortSections = (a, b) => String(a.section).localeCompare(String(b.section), undefined, { numeric: true });

// Upgrade active registrations created before section-aware enrollment. The
// update is lazy, idempotent and keeps mandatory courses in one cohort section.
export async function backfillCurrentRegistrationSections(student) {
  if (!student?._id || !student.termId || !student.programId) return;

  const legacy = await StudentCourseRegistration.find({
    studentId: student._id,
    termId: student.termId,
    status: { $in: ACTIVE_STATUSES },
    $or: [{ courseAssignmentId: { $exists: false } }, { courseAssignmentId: null }],
  }).lean();
  if (!legacy.length) return;

  const assignments = await CourseAssignment.find({
    termId: student.termId,
    programId: student.programId,
    courseId: { $in: legacy.map((row) => row.courseId) },
  }).sort({ section: 1 }).lean();
  const byCourse = new Map();
  assignments.forEach((assignment) => {
    const key = String(assignment.courseId);
    if (!byCourse.has(key)) byCourse.set(key, []);
    byCourse.get(key).push(assignment);
  });

  const mandatoryRows = legacy.filter((row) =>
    (byCourse.get(String(row.courseId)) || []).some((assignment) => assignment.courseType !== "ELECTIVE"),
  );
  const commonLabels = mandatoryRows.length
    ? (byCourse.get(String(mandatoryRows[0].courseId)) || [])
        .filter((assignment) => assignment.courseType !== "ELECTIVE")
        .map((assignment) => assignment.section)
        .filter((label) => mandatoryRows.every((row) =>
          (byCourse.get(String(row.courseId)) || []).some((assignment) => assignment.courseType !== "ELECTIVE" && assignment.section === label),
        ))
        .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
    : [];

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const claimedMandatory = [];
      for (const label of commonLabels) {
        const attempt = [];
        for (const row of mandatoryRows) {
          const candidate = (byCourse.get(String(row.courseId)) || []).find(
            (assignment) => assignment.courseType !== "ELECTIVE" && assignment.section === label,
          );
          const claimed = candidate
            ? await CourseAssignment.findOneAndUpdate(
                { _id: candidate._id, $expr: { $lt: [{ $ifNull: ["$enrolledCount", 0] }, "$capacity"] } },
                { $inc: { enrolledCount: 1 } },
                { new: true, session },
              )
            : null;
          if (!claimed) {
            await Promise.all(attempt.map((item) =>
              CourseAssignment.updateOne({ _id: item.assignment._id }, { $inc: { enrolledCount: -1 } }, { session }),
            ));
            attempt.length = 0;
            break;
          }
          attempt.push({ row, assignment: claimed });
        }
        if (attempt.length === mandatoryRows.length) {
          claimedMandatory.push(...attempt);
          break;
        }
      }

      for (const item of claimedMandatory) {
        const updated = await StudentCourseRegistration.updateOne(
          { _id: item.row._id, courseAssignmentId: null },
          { $set: { courseAssignmentId: item.assignment._id, section: item.assignment.section } },
          { session },
        );
        if (!updated.modifiedCount) {
          await CourseAssignment.updateOne({ _id: item.assignment._id }, { $inc: { enrolledCount: -1 } }, { session });
        }
      }

      const optionalRows = legacy.filter((row) => !mandatoryRows.some((mandatory) => String(mandatory._id) === String(row._id)));
      for (const row of optionalRows) {
        let claimed = null;
        for (const candidate of [...(byCourse.get(String(row.courseId)) || [])].sort(sortSections)) {
          claimed = await CourseAssignment.findOneAndUpdate(
            { _id: candidate._id, $expr: { $lt: [{ $ifNull: ["$enrolledCount", 0] }, "$capacity"] } },
            { $inc: { enrolledCount: 1 } },
            { new: true, session },
          );
          if (claimed) break;
        }
        if (claimed) {
          const updated = await StudentCourseRegistration.updateOne(
            { _id: row._id, courseAssignmentId: null },
            { $set: { courseAssignmentId: claimed._id, section: claimed.section } },
            { session },
          );
          if (!updated.modifiedCount) {
            await CourseAssignment.updateOne({ _id: claimed._id }, { $inc: { enrolledCount: -1 } }, { session });
          }
        }
      }
    });
  } finally {
    await session.endSession();
  }
}
