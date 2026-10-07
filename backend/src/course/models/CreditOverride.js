import mongoose from "mongoose";

// An HOD-granted exception to a Program's regulation max-credits-per-semester
// for one specific student in one specific semester — same shape and
// upsert-by-unique-index pattern as student/models/PromotionRequest.js's
// PromotionOverride (an accountant exempting one defaulting student from a
// promotion block), just for credit limits instead of fee defaults.
const creditOverrideSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: "Semester", required: true },
    termId: { type: mongoose.Schema.Types.ObjectId, ref: "Term" },
    maxCredits: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedByName: { type: String, default: "" },
  },
  { timestamps: true },
);

// One override per student per semester — granting a new one for the same
// pair replaces the old one (upsert), it doesn't stack.
creditOverrideSchema.index({ studentId: 1, semesterId: 1 }, { unique: true });

export default mongoose.models.CreditOverride ||
  mongoose.model("CreditOverride", creditOverrideSchema);
