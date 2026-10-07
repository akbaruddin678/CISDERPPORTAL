import mongoose from "mongoose";

// One row per student ID card ever issued. Re-issuing marks the previous
// active card "replaced", so a student has at most one active card at a time
// while the full history is kept.
const studentIdCardSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
      index: true,
    },
    cardNumber: { type: String, required: true, unique: true },

    issueDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    issueTermId: { type: mongoose.Schema.Types.ObjectId, ref: "Term", required: true },
    endTermId: { type: mongoose.Schema.Types.ObjectId, ref: "Term", required: true },

    // What was printed, frozen at issue time (the student's profile can
    // change later without altering the card record).
    photoUrl: { type: String },
    snapshot: {
      fullName: String,
      fatherName: String,
      regNo: String,
      cnic: String,
      programName: String,
      departmentName: String,
    },

    status: {
      type: String,
      enum: ["active", "replaced", "revoked"],
      default: "active",
      index: true,
    },
    revokedReason: { type: String },
    revokedAt: { type: Date },

    printCount: { type: Number, default: 0 },
    lastPrintedAt: { type: Date },

    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    issuedByName: { type: String },
  },
  { timestamps: true },
);

// A student can hold only one active card.
studentIdCardSchema.index(
  { studentId: 1 },
  { name: "studentId_active_unique", unique: true, partialFilterExpression: { status: "active" } },
);

export default mongoose.models.StudentIdCard ||
  mongoose.model("StudentIdCard", studentIdCardSchema);
