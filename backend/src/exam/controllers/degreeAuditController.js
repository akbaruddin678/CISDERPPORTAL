import mongoose from "mongoose";
import StudentProfile, { transitionStatus } from "../../student/models/StudentProfile.js";
import PersonalInfo from "../../student/models/PersonalInfo.js";
import Program from "../../catalog/model/Program.js";
import Term from "../../catalog/model/Term.js";
import { computeAcademicSnapshot } from "../../student/services/academicSnapshot.service.js";
import { resolveRegulation } from "../../catalog/services/programRegulation.service.js";
import { getActorName } from "../../graduation/services/graduationAccess.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";

const isId = (v) => mongoose.isValidObjectId(v);
const MS_PER_MONTH = 30.44 * 24 * 60 * 60 * 1000;
// Same "how many semesters has this taken" approximation the spec's own
// framing uses ("Current_Year - Admission_Year") — a semester is treated as
// ~6 months for this purpose. Documented as an approximation, not an exact
// academic-calendar calculation (this codebase has no per-batch calendar).
const elapsedSemesters = (startDate) =>
  Math.floor((Date.now() - new Date(startDate).getTime()) / MS_PER_MONTH / 6);

// Every active, not-trashed, fee-activated student of one Program, optionally
// narrowed to one admission batch. This is the full scan scope for the
// time-bar check; `finalSemester` (a subset) is the scope the completion
// check has always used.
async function loadScope(programId, admissionTermId) {
  const program = await Program.findById(programId).lean();
  if (!program) return { program: null, students: [], finalSemester: [] };

  const filter = {
    programId,
    status: "active",
    isTrashed: { $ne: true },
    feeActivated: { $ne: false },
  };
  if (admissionTermId) filter.admissionTermId = admissionTermId;

  // `status` and `lifecycleHistory` must be selected (not just readable via
  // schema defaults) — transitionStatus() reads/pushes onto them directly,
  // and an excluded path stays undefined on the hydrated doc even though
  // the schema default is `[]`.
  const students = await StudentProfile.find(filter)
    .populate("semesterId", "number")
    .select("studentId semesterId admissionTermId status lifecycleHistory");

  const finalSemester = students.filter(
    (s) => s.semesterId?.number != null && s.semesterId.number >= program.durationStages,
  );
  return { program, students, finalSemester };
}

// GET /api/exam/degree-audit/scope?programId=&admissionTermId=
// Preview: how many active, final-semester students are currently in scope
// — lets the Exam Office see the size of a run before committing to it.
export const getAuditScope = asyncHandler(async (req, res) => {
  const { programId, admissionTermId } = req.query;
  if (!isId(programId)) {
    return res.status(400).json({ success: false, message: "A valid programId is required." });
  }
  if (admissionTermId && !isId(admissionTermId)) {
    return res.status(400).json({ success: false, message: "Invalid admissionTermId." });
  }

  const { program, finalSemester } = await loadScope(programId, admissionTermId || null);
  if (!program) return res.status(404).json({ success: false, message: "Program not found." });

  res.json({
    success: true,
    data: { programName: program.name, durationStages: program.durationStages, count: finalSemester.length },
  });
});

// POST /api/exam/degree-audit/run  { programId, admissionTermId? }
// The automated "Batch Completion" step, run in two passes over the same
// scope:
//   1. Time-bar: every active student (any semester) whose batch has a
//      maxDurationSemesters regulation and has exceeded it is struck off —
//      transitioned to struck_off_time_barred and excluded from pass 2.
//   2. Completion: every remaining active, final-semester student is judged
//      against their CGPA/credit/curriculum requirements (batch-aware via
//      computeAcademicSnapshot) and, if they meet them, transitioned to
//      academically_completed. Students who don't yet qualify are reported
//      back with the specific reason, never silently skipped.
// Response shape mirrors graduation/controller/graduationController.js::
// bulkAction's existing { done: [], failed: [] } convention, plus a third
// `timeBarred` bucket for pass 1.
export const runDegreeAudit = asyncHandler(async (req, res) => {
  const { programId, admissionTermId } = req.body;
  if (!isId(programId)) {
    return res.status(400).json({ success: false, message: "A valid programId is required." });
  }
  if (admissionTermId && !isId(admissionTermId)) {
    return res.status(400).json({ success: false, message: "Invalid admissionTermId." });
  }

  const { program, students, finalSemester } = await loadScope(programId, admissionTermId || null);
  if (!program) return res.status(404).json({ success: false, message: "Program not found." });

  const infos = await PersonalInfo.find({ studentId: { $in: students.map((s) => s._id) } })
    .select("studentId fullName")
    .lean();
  const nameOf = new Map(infos.map((i) => [String(i.studentId), i.fullName]));
  const actorName = await getActorName(req.user);

  // ---- Pass 1: time-bar ----
  const timeBarred = [];
  const struckOffIds = new Set();
  // One regulation lookup per distinct batch in scope, not per student.
  const regulationByBatch = new Map();
  for (const student of students) {
    const batchKey = student.admissionTermId ? String(student.admissionTermId) : null;
    if (!batchKey) continue;
    if (!regulationByBatch.has(batchKey)) {
      // eslint-disable-next-line no-await-in-loop
      regulationByBatch.set(batchKey, await resolveRegulation(program._id, student.admissionTermId));
    }
    const regulation = regulationByBatch.get(batchKey);
    if (!regulation?.maxDurationSemesters) continue;

    // eslint-disable-next-line no-await-in-loop
    const term = await Term.findById(student.admissionTermId).select("startDate name").lean();
    if (!term?.startDate) continue;

    const semestersElapsed = elapsedSemesters(term.startDate);
    if (semestersElapsed > regulation.maxDurationSemesters) {
      transitionStatus(student, "struck_off_time_barred", {
        reason: `Exceeded the ${regulation.maxDurationSemesters}-semester time limit for the ${term.name} batch (${semestersElapsed} semesters elapsed).`,
        by: req.user._id,
        byName: actorName,
      });
      // eslint-disable-next-line no-await-in-loop
      await student.save();
      struckOffIds.add(String(student._id));
      timeBarred.push({
        studentId: student._id,
        regNo: student.studentId,
        fullName: nameOf.get(String(student._id)) || "",
        semestersElapsed,
        maxAllowed: regulation.maxDurationSemesters,
      });
    }
  }

  // ---- Pass 2: completion, on whoever wasn't just struck off ----
  const done = [];
  const failed = [];

  for (const student of finalSemester) {
    if (struckOffIds.has(String(student._id))) continue;
    // eslint-disable-next-line no-await-in-loop
    const snap = await computeAcademicSnapshot(student._id);
    const fullName = nameOf.get(String(student._id)) || "";
    const row = {
      studentId: student._id,
      regNo: student.studentId,
      fullName,
      cgpa: snap.cgpa,
      earnedCredits: snap.earnedCredits,
      requiredCredits: snap.requiredCredits,
    };

    const notTaken = snap.requiredCourses.filter(
      (c) => !snap.bestList.some((b) => b.courseId === String(c._id)),
    );
    const cgpaOk = snap.cgpa !== null && snap.cgpa >= snap.minCGPA;
    const creditsOk = snap.requiredCredits !== null && snap.earnedCredits >= snap.requiredCredits;
    const curriculumOk =
      snap.requiredIds.size > 0 && snap.failed.length === 0 && notTaken.length === 0 && snap.pending.length === 0;

    const reasons = [];
    if (!cgpaOk) {
      reasons.push(
        snap.cgpa === null
          ? "No graded courses yet."
          : `CGPA ${snap.cgpa.toFixed(2)} below required ${snap.minCGPA.toFixed(2)}.`,
      );
    }
    if (!creditsOk) {
      reasons.push(
        snap.requiredCredits === null
          ? "Required credit hours are not defined for this program."
          : `Earned ${snap.earnedCredits} of ${snap.requiredCredits} required credits.`,
      );
    }
    if (!curriculumOk) {
      reasons.push(
        snap.requiredIds.size === 0
          ? "No curriculum is defined for this program."
          : "Not all curriculum courses are passed / verified.",
      );
    }

    if (cgpaOk && creditsOk && curriculumOk) {
      transitionStatus(student, "academically_completed", {
        reason: "Passed the degree audit",
        by: req.user._id,
        byName: actorName,
      });
      // eslint-disable-next-line no-await-in-loop
      await student.save();
      done.push(row);
    } else {
      failed.push({ ...row, reasons });
    }
  }

  const parts = [`${done.length} became eligible`];
  if (failed.length) parts.push(`${failed.length} not yet eligible`);
  if (timeBarred.length) parts.push(`${timeBarred.length} struck off (time-barred)`);

  res.json({
    success: true,
    message: `${parts.join(", ")}.`,
    data: { done, failed, timeBarred },
  });
});
