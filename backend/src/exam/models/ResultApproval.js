import mongoose from "mongoose";

const resultApprovalSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    currentStep: {
      type: String,
      enum: ["Faculty", "HoD", "Dean", "CoE"],
      default: "Faculty",
    },
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    comments: { type: String },
    approvalHistory: [
      {
        role: { type: String, required: true },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        action: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("ResultApproval", resultApprovalSchema);
