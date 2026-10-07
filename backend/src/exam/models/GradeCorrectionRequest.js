import mongoose from "mongoose";

const gradeCorrectionRequestSchema = new mongoose.Schema(
  {
    examResultId: { type: mongoose.Schema.Types.ObjectId, ref: "ExamResult", required: true, index: true },
    courseAssignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "CourseAssignment", required: true, index: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "StaffProfile", required: true },
    oldMarks: { type: Number, required: true },
    proposedMarks: { type: Number, required: true },
    reason: { type: String, required: true, trim: true, minlength: 10 },
    status: { type: String, enum: ["PENDING_HOD", "APPROVED", "REJECTED"], default: "PENDING_HOD", index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "StaffProfile" },
    reviewedAt: Date,
    reviewRemarks: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

gradeCorrectionRequestSchema.index(
  { examResultId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "PENDING_HOD" } },
);

export default mongoose.models.GradeCorrectionRequest ||
  mongoose.model("GradeCorrectionRequest", gradeCorrectionRequestSchema);
