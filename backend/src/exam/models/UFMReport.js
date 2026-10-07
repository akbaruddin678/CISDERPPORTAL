import mongoose from "mongoose";

const ufmReportSchema = new mongoose.Schema(
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
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
    },
    violationType: { type: String, required: true }, // e.g., "Cheating", "Impersonation", "Device Found"
    evidenceUrls: [{ type: String }],
    statement: { type: String },
    committeeDecision: { type: String },
    status: {
      type: String,
      enum: ["Reported", "Under Review", "Resolved"],
      default: "Reported",
    },
  },
  { timestamps: true },
);

export default mongoose.model("UFMReport", ufmReportSchema);
