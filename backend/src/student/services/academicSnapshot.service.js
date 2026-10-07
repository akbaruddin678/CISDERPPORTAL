import StudentProfile from "../models/StudentProfile.js";
import StudentCourseRegistration from "../../course/models/StudentCourseRegistration.js";
import Course from "../../course/models/Course.js";
import ExamResult from "../../exam/models/ExamResult.js";
import Semester from "../../catalog/model/Semester.js";
import { creditsOf } from "../../core/utils/credits.js";
import { resolveRegulation } from "../../catalog/services/programRegulation.service.js";

// Shared "academic rules engine" — the pure CGPA / earned-credits /
// curriculum-coverage computation, extracted out of
// graduation/services/graduationAcademic.service.js::buildAcademicReport so
// it can be reused by anything that needs a student's raw academic standing
// without the graduation-clearance-specific checks[]/confirmation framing.
// Currently consumed by: graduationAcademic.service.js (clearance checks)
// and exam/controllers/degreeAuditController.js (automatic degree audit).

export const DEFAULT_MIN_CGPA = 2.0;

// Same percentage -> grade table the student transcript / course history use
// (course/controllers/studentCourseController.js), so a snapshot computed
// here never disagrees with what the student or exam staff already see.
const GRADE_THRESHOLDS = [
  { min: 85, grade: "A", points: 4.0 },
  { min: 80, grade: "A-", points: 3.7 },
  { min: 75, grade: "B+", points: 3.3 },
  { min: 70, grade: "B", points: 3.0 },
  { min: 65, grade: "B-", points: 2.7 },
  { min: 60, grade: "C+", points: 2.3 },
  { min: 55, grade: "C", points: 2.0 },
  { min: 50, grade: "D", points: 1.0 },
];
const gradeFor = (pct) =>
  GRADE_THRESHOLDS.find((t) => pct >= t.min) || { grade: "F", points: 0.0 };

const round2 = (n) => Number(n.toFixed(2));

// Builds the full academic picture of a student: per-attempt course
// results, best-attempt-per-course CGPA/credits, and curriculum coverage.
// Only Verified, non-absent exam results count (the same rule the
// transcript uses); a course with none is "pending", not failed.
// Returns null if the student doesn't exist.
export async function computeAcademicSnapshot(studentObjectId) {
  const student = await StudentProfile.findById(studentObjectId)
    .select("studentId status programId departmentId semesterId termId admissionTermId")
    .populate("programId", "name code durationStages graduationRequirements")
    .populate("semesterId", "number name")
    .lean();
  if (!student) return null;

  const program = student.programId || null;
  // A batch-specific Program Regulation's minTotalCredits wins over the
  // Program's own graduationRequirements.minCreditHours when one exists for
  // this student's batch (admissionTermId) — see catalog/model/ProgramRegulation.js.
  // minCGPA has no per-batch equivalent in the regulations table, so it
  // always stays program-level, regulation or not.
  const regulation = program
    ? await resolveRegulation(program._id, student.admissionTermId)
    : null;
  const [registrations, results, programSemesters] = await Promise.all([
    StudentCourseRegistration.find({ studentId: student._id })
      .populate("courseId", "code title creditHours")
      .populate("termId", "name")
      .populate("semesterId", "number name")
      .lean(),
    ExamResult.find({ studentId: student._id, status: "Verified", isAbsent: false })
      .populate("examId", "courseId termId totalMarks")
      .lean(),
    program
      ? Semester.find({ programId: program._id, isActive: { $ne: false } })
          .select("number courses")
          .lean()
      : [],
  ]);

  // Marks per (course, term) attempt, with a per-course fallback for the
  // common case of a single registration whose exam sits in another term.
  const addTotals = (map, key, obtained, total) => {
    const cur = map.get(key) || { obtained: 0, total: 0 };
    cur.obtained += obtained;
    cur.total += total;
    map.set(key, cur);
  };
  const byCourseTerm = new Map();
  const byCourse = new Map();
  for (const r of results) {
    const ex = r.examId;
    if (!ex?.courseId || !(ex.totalMarks > 0)) continue;
    const c = String(ex.courseId);
    addTotals(byCourseTerm, `${c}_${ex.termId || ""}`, r.obtainedMarks || 0, ex.totalMarks);
    addTotals(byCourse, c, r.obtainedMarks || 0, ex.totalMarks);
  }

  const live = registrations.filter((r) => r.status !== "Dropped" && r.courseId?._id);
  const regCount = new Map();
  live.forEach((r) => {
    const c = String(r.courseId._id);
    regCount.set(c, (regCount.get(c) || 0) + 1);
  });

  const attempts = live.map((reg) => {
    const c = String(reg.courseId._id);
    const totals =
      byCourseTerm.get(`${c}_${reg.termId?._id || ""}`) ||
      (regCount.get(c) === 1 ? byCourse.get(c) : null);
    const base = {
      courseId: c,
      code: reg.courseId.code,
      title: reg.courseId.title,
      credits: creditsOf(reg.courseId),
      semesterNumber: reg.semesterId?.number ?? 0,
      semesterName: reg.semesterId?.name || `Semester ${reg.semesterId?.number ?? "?"}`,
      termId: reg.termId?._id ? String(reg.termId._id) : "",
      term: reg.termId?.name || "",
      isRetake: !!reg.isRetake,
    };
    if (totals && totals.total > 0) {
      const percentage = round2((totals.obtained / totals.total) * 100);
      const g = gradeFor(percentage);
      return {
        ...base,
        state: "graded",
        obtainedMarks: totals.obtained,
        totalMarks: totals.total,
        percentage,
        grade: g.grade,
        gradePoints: g.points,
        passed: g.grade !== "F",
      };
    }
    return { ...base, state: "pending", grade: null, gradePoints: null, passed: false };
  });

  // Best attempt per course: highest graded percentage, else "pending".
  const best = new Map();
  for (const a of attempts) {
    const cur = best.get(a.courseId);
    if (!cur) best.set(a.courseId, a);
    else if (a.state === "graded" && (cur.state !== "graded" || a.percentage > cur.percentage)) {
      best.set(a.courseId, a);
    }
  }
  const bestList = [...best.values()];
  const passed = bestList.filter((a) => a.state === "graded" && a.passed);
  const failed = bestList.filter((a) => a.state === "graded" && !a.passed);
  const pending = bestList.filter((a) => a.state === "pending");
  const graded = bestList.filter((a) => a.state === "graded");

  const earnedCredits = passed.reduce((s, a) => s + a.credits, 0);
  const pendingCredits = pending.reduce((s, a) => s + a.credits, 0);
  const gradedCredits = graded.reduce((s, a) => s + a.credits, 0);
  const qualityPoints = graded.reduce((s, a) => s + a.credits * a.gradePoints, 0);
  const cgpa = gradedCredits > 0 ? round2(qualityPoints / gradedCredits) : null;

  // Curriculum = every course listed on any active semester of the program.
  const requiredIds = new Set();
  programSemesters.forEach((s) => (s.courses || []).forEach((c) => requiredIds.add(String(c))));
  const requiredCourses = requiredIds.size
    ? await Course.find({ _id: { $in: [...requiredIds] } })
        .select("code title creditHours")
        .lean()
    : [];
  const curriculumCredits = requiredCourses.length
    ? requiredCourses.reduce((s, c) => s + creditsOf(c), 0)
    : null;

  const reqs = program?.graduationRequirements || {};
  const minCGPA = typeof reqs.minCGPA === "number" ? reqs.minCGPA : DEFAULT_MIN_CGPA;
  const hasRegulationCredits = typeof regulation?.minTotalCredits === "number" && regulation.minTotalCredits > 0;
  const hasProgramCredits = typeof reqs.minCreditHours === "number" && reqs.minCreditHours > 0;
  const requiredCredits = hasRegulationCredits
    ? regulation.minTotalCredits
    : hasProgramCredits
      ? reqs.minCreditHours
      : curriculumCredits;
  const requiredCreditsSource = hasRegulationCredits
    ? "batch"
    : hasProgramCredits
      ? "program"
      : curriculumCredits !== null
        ? "curriculum"
        : null;

  const semesterNumber = student.semesterId?.number ?? null;
  const durationStages = program?.durationStages ?? null;

  // Semester-wise transcript rows (all attempts; `counted` marks the one
  // that feeds CGPA).
  const groups = new Map();
  for (const a of attempts) {
    const key = `${a.semesterNumber}|${a.termId}`;
    if (!groups.has(key)) {
      groups.set(key, { number: a.semesterNumber, name: a.semesterName, term: a.term, courses: [] });
    }
    groups.get(key).courses.push({ ...a, counted: best.get(a.courseId) === a });
  }
  const semesters = [...groups.values()]
    .sort((a, b) => a.number - b.number || a.term.localeCompare(b.term))
    .map((g) => {
      const gradedRows = g.courses.filter((c) => c.state === "graded");
      const credits = gradedRows.reduce((s, c) => s + c.credits, 0);
      const points = gradedRows.reduce((s, c) => s + c.credits * c.gradePoints, 0);
      return {
        ...g,
        courses: g.courses.sort((a, b) => String(a.code).localeCompare(String(b.code))),
        sgpa: credits > 0 ? round2(points / credits) : null,
      };
    });

  return {
    student,
    program,
    regulation,
    semesterNumber,
    durationStages,
    attempts,
    bestList,
    passed,
    failed,
    pending,
    graded,
    earnedCredits,
    pendingCredits,
    gradedCredits,
    cgpa,
    requiredIds,
    requiredCourses,
    curriculumCredits,
    minCGPA,
    requiredCredits,
    requiredCreditsSource,
    semesters,
  };
}
