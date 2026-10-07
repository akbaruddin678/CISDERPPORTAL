import StudentProfile from "../../student/models/StudentProfile.js";
import Enrollment from "../../student/models/Enrollment.js";
import PromotionRequest from "../../student/models/PromotionRequest.js";
import CourseAssignment from "../../course/models/CourseAssignment.js";
import StudentCourseRegistration from "../../course/models/StudentCourseRegistration.js";
import StudentFeeStructure from "../../accountant/model/StudentFeeStructure.js";
import StudentFeePreference from "../../accountant/model/StudentFeePreference.js";
import StudentChallan from "../../accountant/model/StudentChallan.js";
import InstallmentPlan from "../../accountant/model/InstallmentPlan.js";
import Exam from "../../exam/models/Exam.js";
import AdmitCard from "../../exam/models/AdmitCard.js";
import StudentAcademicRecord from "../../exam/models/StudentAcademicRecord.js";

// Anything that still points at a semester. The first two are "who is in it
// now"; the rest is history of students who were in it before (promotion
// trail, registrations, results, fees) — all of it blocks deletion.
const USAGE_CHECKS = [
  [StudentProfile, "students currently in it"],
  [Enrollment, "enrollment records"],
  [PromotionRequest, "promotion records"],
  [StudentAcademicRecord, "academic records"],
  [StudentCourseRegistration, "course registrations"],
  [CourseAssignment, "course assignments"],
  [Exam, "exams"],
  [AdmitCard, "admit cards"],
  [StudentFeeStructure, "fee structures"],
  [StudentFeePreference, "fee preferences"],
  [StudentChallan, "fee challans"],
  [InstallmentPlan, "installment plans"],
];

// Returns a plain-English list of what uses one semester, e.g.
// ["12 students currently in it", "40 course registrations"]. Empty = unused.
export const describeSemesterUsage = async (semester) => {
  const parts = [];
  if (semester.courses?.length) {
    parts.push(`${semester.courses.length} curriculum course(s)`);
  }
  for (const [Model, label] of USAGE_CHECKS) {
    // eslint-disable-next-line no-await-in-loop
    const n = await Model.countDocuments({ semesterId: semester._id });
    if (n > 0) parts.push(`${n} ${label}`);
  }
  return parts;
};

// One reason string per in-use semester ("Semester 5 has ..."); empty = all safe.
export const semesterUsage = async (semesters) => {
  const reasons = [];
  for (const sem of semesters) {
    // eslint-disable-next-line no-await-in-loop
    const parts = await describeSemesterUsage(sem);
    if (parts.length) reasons.push(`${sem.name} has ${parts.join(", ")}`);
  }
  return reasons;
};
