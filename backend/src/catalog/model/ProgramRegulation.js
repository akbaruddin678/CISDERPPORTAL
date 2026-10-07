import mongoose from "mongoose";

// The rules that decide when a student in one Program+Batch is "done" and
// how much they can carry per semester. Keyed by (programId, admissionTermId)
// — admissionTermId is the "batch" (see StudentProfile.js's own comment on
// that field: set once at admission, never overwritten by promotion), so
// different intakes of the same Program can carry different rules, exactly
// as required ("Fall 2022 batch might need 130 credits, Fall 2024 needs 136").
//
// Every limit field is optional. A missing field means "no rule for this
// yet" — the callers that consume this (computeAcademicSnapshot, the Degree
// Audit's time-bar check, course-registration credit limits) all treat an
// absent regulation, or an absent field on one, as "fall back to the
// pre-Phase-2 behavior for that check", never as a hard failure.
const programRegulationSchema = new mongoose.Schema(
  {
    programId: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true, index: true },
    admissionTermId: { type: mongoose.Schema.Types.ObjectId, ref: "Term", required: true, index: true },

    minTotalCredits: { type: Number, min: 0 },
    minDurationSemesters: { type: Number, min: 1 },
    maxDurationSemesters: { type: Number, min: 1 },
    minCreditsPerSemester: { type: Number, min: 0 },
    maxCreditsPerSemester: { type: Number, min: 0 },
    // Applies instead of maxCreditsPerSemester when the registration term's
    // termType is "short" (this codebase's summer/short-session marker).
    maxSummerCredits: { type: Number, min: 0 },
    version: { type: Number, default: 1, min: 1 },
    changeHistory: [
      {
        version: Number,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        changedByName: String,
        values: mongoose.Schema.Types.Mixed,
        changedAt: { type: Date, default: Date.now },
      },
    ],

    // A locked batch rulebook is immutable. A policy change is represented
    // by a new record for a new admissionTermId, never by rewriting history.
    isLocked: { type: Boolean, default: false },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lockedByName: { type: String, default: "" },
    lockedAt: { type: Date },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdByName: { type: String, default: "" },
  },
  { timestamps: true },
);

programRegulationSchema.index({ programId: 1, admissionTermId: 1 }, { unique: true });

export default mongoose.models.ProgramRegulation ||
  mongoose.model("ProgramRegulation", programRegulationSchema);
