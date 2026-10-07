// Single source of truth for "how many credit hours is this course worth" —
// previously reimplemented separately in academicSnapshot.service.js and
// studentCourseController.js (and a third, slightly different version as
// Course.js's own `totalCredits` virtual, which lacked this fallback).
// Falls back to 3 credits when a course has no creditHours recorded at all,
// matching the two pre-existing call sites' behavior.
export const creditsOf = (course) =>
  (course?.creditHours?.theory || 0) + (course?.creditHours?.lab || 0) || 3;
