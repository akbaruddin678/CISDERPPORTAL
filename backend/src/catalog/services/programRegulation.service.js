import ProgramRegulation from "../model/ProgramRegulation.js";

// Single lookup point for "what rules apply to this student's batch of this
// program" — every consumer (academicSnapshot.service.js, the Degree Audit's
// time-bar check, course-registration credit limits) calls this instead of
// querying ProgramRegulation directly, so there is exactly one place that
// knows the (programId, admissionTermId) key shape.
export async function resolveRegulation(programId, admissionTermId) {
  if (!programId || !admissionTermId) return null;
  return ProgramRegulation.findOne({ programId, admissionTermId }).lean();
}
