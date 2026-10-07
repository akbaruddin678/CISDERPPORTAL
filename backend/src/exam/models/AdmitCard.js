import mongoose from "mongoose";

const admitCardSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Term",
      required: true,
    },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: "Program" },
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true,
    },
    // The exam round this card admits the student to (e.g. "Mid Term",
    // "Final Exam") — a card only ever covers exams of this one type.
    examType: { type: String, required: true },
    exams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Exam" }],
    isEligible: { type: Boolean, default: true },
    // Set when an admin overrode the fee-not-paid confirmation to issue
    // this card anyway — kept permanently on the card (not just at the
    // moment of generation) so gate/invigilation staff can still see the
    // student owed fees when the card is later viewed or printed.
    feeWarning: { type: Boolean, default: false },
    feeStatusAtIssue: {
      type: String,
      enum: ["paid", "pending", "overdue", "not_generated"],
      default: "paid",
    },
    // Active: exam(s) still upcoming, card is valid to present.
    // Expired: exam(s) have started/finished, card auto-lapses.
    // Revoked: manually invalidated by admin regardless of exam timing.
    status: {
      type: String,
      enum: ["Active", "Expired", "Revoked"],
      default: "Active",
    },
  },
  { timestamps: true },
);

// One card per student per exam round per term/semester.
admitCardSchema.index(
  { studentId: 1, termId: 1, semesterId: 1, examType: 1 },
  { unique: true },
);

export default mongoose.model("AdmitCard", admitCardSchema);
