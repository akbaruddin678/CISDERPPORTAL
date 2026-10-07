import StudentCourseRegistration from "../models/StudentCourseRegistration.js";

// Same aggregate as courseAssignmentController.js::getAssignments (counts
// are section-specific, since a registration stores its own
// CourseAssignment) — factored out so this math isn't re-derived a third
// time for the registration drawer's read-only seat display.
export async function getRegisteredCountsByAssignment(assignmentIds) {
  if (!assignmentIds.length) return new Map();
  const counts = await StudentCourseRegistration.aggregate([
    {
      $match: {
        courseAssignmentId: { $in: assignmentIds },
        status: { $in: ["Registered", "In-Progress"] },
      },
    },
    { $group: { _id: "$courseAssignmentId", count: { $sum: 1 } } },
  ]);
  return new Map(counts.map((c) => [String(c._id), c.count]));
}
