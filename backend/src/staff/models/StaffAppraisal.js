import mongoose from "mongoose";

const staffAppraisalSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
    },
    evaluatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
    }, // Usually HOD
    reviewPeriod: { type: String, required: true }, // e.g., "2025-2026"

    kpis: [
      {
        goal: { type: String, required: true },
        weightage: { type: Number, required: true }, // %
        score: { type: Number, min: 1, max: 5 }, // 1 to 5 rating
        comments: { type: String },
      },
    ],

    overallScore: { type: Number },
    evaluatorFeedback: { type: String },
    employeeComments: { type: String }, // Self-assessment response

    status: {
      type: String,
      enum: ["Draft", "Pending Employee Review", "Completed"],
      default: "Draft",
    },
  },
  { timestamps: true },
);

export default mongoose.model("StaffAppraisal", staffAppraisalSchema);
