import { computeAcademicSnapshot } from "../../student/services/academicSnapshot.service.js";

const codes = (list, max = 6) => {
  const shown = list.slice(0, max).map((c) => c.code || c.title).join(", ");
  return list.length > max ? `${shown} +${list.length - max} more` : shown;
};

// One fact-based check. status: "pass" | "fail" (blocks) | "unverified"
// (data missing — an approver must confirm it manually with a remark).
const check = (key, label, status, detail) => ({ key, label, status, detail });

// Builds the full academic picture of a student for degree clearance: the
// raw computation (CGPA, credits, curriculum coverage) comes from the
// shared academicSnapshot.service.js "rules engine" — this function only
// adds the clearance-specific checks[]/confirmation framing on top of it.
// External contract (student/requirements/summary/checks/semesters) is
// unchanged from before this was split out.
export async function buildAcademicReport(studentObjectId) {
  const snap = await computeAcademicSnapshot(studentObjectId);
  if (!snap) return null;

  const {
    student,
    program,
    semesterNumber,
    durationStages,
    bestList,
    failed,
    pending,
    requiredIds,
    requiredCourses,
    earnedCredits,
    pendingCredits,
    cgpa,
    minCGPA,
    requiredCredits,
    requiredCreditsSource,
    semesters,
  } = snap;

  const checks = [];

  if (semesterNumber === null || !durationStages) {
    checks.push(
      check("standing", "Final semester", "unverified", "The student's current semester or the program duration is not recorded."),
    );
  } else if (semesterNumber >= durationStages) {
    checks.push(
      check("standing", "Final semester", "pass", `In semester ${semesterNumber} of ${durationStages}.`),
    );
  } else {
    checks.push(
      check(
        "standing",
        "Final semester",
        "unverified",
        `Currently in semester ${semesterNumber} of ${durationStages} — confirm the student has completed the program.`,
      ),
    );
  }

  if (!requiredIds.size) {
    checks.push(
      check(
        "curriculum",
        "Curriculum coverage",
        "unverified",
        "No curriculum is defined for this program, so required courses can't be checked automatically.",
      ),
    );
  } else {
    const notTaken = requiredCourses.filter((c) => !bestList.some((b) => b.courseId === String(c._id)));
    const requiredFailed = requiredCourses.filter((c) => failed.some((f) => f.courseId === String(c._id)));
    const requiredPending = requiredCourses.filter((c) => pending.some((p) => p.courseId === String(c._id)));
    if (notTaken.length || requiredFailed.length) {
      const parts = [];
      if (notTaken.length) parts.push(`not registered: ${codes(notTaken)}`);
      if (requiredFailed.length) parts.push(`failed: ${codes(requiredFailed)}`);
      checks.push(
        check("curriculum", "Curriculum coverage", "fail", `Required courses ${parts.join("; ")}.`),
      );
    } else if (requiredPending.length) {
      checks.push(
        check(
          "curriculum",
          "Curriculum coverage",
          "unverified",
          `${requiredPending.length} required course(s) have no verified result yet: ${codes(requiredPending)}.`,
        ),
      );
    } else {
      checks.push(
        check("curriculum", "Curriculum coverage", "pass", `All ${requiredCourses.length} required courses passed.`),
      );
    }
  }

  if (bestList.length === 0) {
    checks.push(
      check("coursework", "Registered courses passed", "unverified", "No course registrations are on record for this student."),
    );
  } else if (failed.length) {
    checks.push(
      check("coursework", "Registered courses passed", "fail", `${failed.length} course(s) failed: ${codes(failed)}.`),
    );
  } else if (pending.length) {
    checks.push(
      check(
        "coursework",
        "Registered courses passed",
        "unverified",
        `${pending.length} registered course(s) have no verified result yet: ${codes(pending)}.`,
      ),
    );
  } else {
    checks.push(
      check("coursework", "Registered courses passed", "pass", `All ${bestList.length} registered courses passed.`),
    );
  }

  if (requiredCredits === null) {
    checks.push(
      check(
        "credits",
        "Credit-hour requirement",
        "unverified",
        `The required credit hours are not defined for this program (earned ${earnedCredits}).`,
      ),
    );
  } else if (earnedCredits >= requiredCredits) {
    checks.push(
      check("credits", "Credit-hour requirement", "pass", `Earned ${earnedCredits} of ${requiredCredits} required credit hours.`),
    );
  } else if (earnedCredits + pendingCredits >= requiredCredits) {
    checks.push(
      check(
        "credits",
        "Credit-hour requirement",
        "unverified",
        `Earned ${earnedCredits} of ${requiredCredits} credit hours; ${pendingCredits} more are awaiting verified results.`,
      ),
    );
  } else {
    checks.push(
      check("credits", "Credit-hour requirement", "fail", `Earned only ${earnedCredits} of ${requiredCredits} required credit hours.`),
    );
  }

  if (cgpa === null) {
    checks.push(
      check("cgpa", `Minimum CGPA (${minCGPA.toFixed(2)})`, "unverified", "No graded courses yet, so CGPA can't be computed."),
    );
  } else if (pending.length) {
    checks.push(
      check(
        "cgpa",
        `Minimum CGPA (${minCGPA.toFixed(2)})`,
        "unverified",
        `Provisional CGPA ${cgpa.toFixed(2)} — ${pending.length} course(s) still await verified results.`,
      ),
    );
  } else if (cgpa >= minCGPA) {
    checks.push(check("cgpa", `Minimum CGPA (${minCGPA.toFixed(2)})`, "pass", `CGPA ${cgpa.toFixed(2)}.`));
  } else {
    checks.push(
      check("cgpa", `Minimum CGPA (${minCGPA.toFixed(2)})`, "fail", `CGPA ${cgpa.toFixed(2)} is below the required ${minCGPA.toFixed(2)}.`),
    );
  }

  checks.push(
    check(
      "finalProject",
      "Final-year project / thesis / internship",
      "unverified",
      "Not tracked in the system — confirm completion manually.",
    ),
  );

  return {
    student: {
      _id: student._id,
      studentId: student.studentId,
      status: student.status,
      programName: program?.name || "",
      semesterNumber,
      durationStages,
    },
    requirements: { minCGPA, requiredCredits, requiredCreditsSource },
    summary: {
      cgpa,
      earnedCredits,
      requiredCredits,
      pendingCredits,
      registeredCourses: bestList.length,
      passedCourses: snap.passed.length,
      failedCourses: failed.length,
      pendingCourses: pending.length,
    },
    checks,
    semesters,
  };
}

// Applies the "block on facts, confirm the rest manually" policy:
//   - any failing check blocks;
//   - each unverified check needs a non-empty confirmation remark.
// `confirmations` is { [checkKey]: remark }.
export function evaluateGate(checks, confirmations = {}) {
  const blockers = checks.filter((c) => c.status === "fail");
  const unconfirmed = [];
  const accepted = [];
  for (const c of checks.filter((x) => x.status === "unverified")) {
    const remark = String(confirmations?.[c.key] ?? "").trim();
    if (remark) accepted.push({ key: c.key, label: c.label, remark });
    else unconfirmed.push(c);
  }
  return { blockers, unconfirmed, accepted, ok: blockers.length === 0 && unconfirmed.length === 0 };
}
