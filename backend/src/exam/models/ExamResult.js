import mongoose from "mongoose";

const examResultSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    dummyRollNumber: { type: String }, // For Anonymization

    obtainedMarks: { type: Number, default: 0, required: true },
    isAbsent: { type: Boolean, default: false },

    // Added for OBE Support: Marks breakdown by CLO
    cloScores: [
      {
        cloCode: { type: String },
        marksObtained: { type: Number },
      },
    ],

    // Maker-Checker Workflow
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "StaffProfile" },
    isVerified: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["Draft", "Submitted", "Verified", "Locked"],
      default: "Draft",
    },
    remarks: { type: String },
  },
  { timestamps: true },
);

// One result per student per exam — saves upsert safely under this.
examResultSchema.index({ examId: 1, studentId: 1 }, { unique: true });

export default mongoose.model("ExamResult", examResultSchema);
