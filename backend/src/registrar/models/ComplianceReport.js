import mongoose from "mongoose";

const complianceReportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    authority: { type: String, required: true },
    dueDate: { type: Date, required: true },
    submittedDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["Draft", "Pending", "Submitted"],
      default: "Pending",
    },
    fileUrl: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "StaffProfile" },
  },
  { timestamps: true },
);

export default mongoose.model("ComplianceReport", complianceReportSchema);
