import mongoose from "mongoose";
import { campusScopedPlugin } from "../../core/middleware/campusContext.js";

// Created once a Fee-Paid student is confirmed "Complete" from the
// Admission Process pipeline (see admissionTrashController.js ->
// completeAdmission). At that point the original Admission application
// document is permanently removed (freeing up their account to submit a
// fresh application later if ever needed) — this record is what's left
// behind as the permanent proof/archive that the admission happened, and
// is what powers the "Completed Admissions" dashboard widget. The
// StudentProfile itself is never touched by this flow.
const CompletedAdmissionRecordSchema = new mongoose.Schema(
  {
    studentProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
      index: true,
    },
    // The session/term this admission belongs to — powers "completed this
    // session" on the dashboard. Pulled from the student's own record, not
    // necessarily whichever term is active at query time.
    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Term",
      index: true,
    },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    completedAt: { type: Date, default: Date.now },
    remark: { type: String, default: "" },
  },
  { timestamps: true },
);

CompletedAdmissionRecordSchema.plugin(campusScopedPlugin);
export default mongoose.model("CompletedAdmissionRecord", CompletedAdmissionRecordSchema);
