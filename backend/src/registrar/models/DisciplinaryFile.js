import mongoose from "mongoose";

const disciplinaryFileSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    termId: { type: mongoose.Schema.Types.ObjectId, ref: "Term" },
    incident: { type: String, required: true },
    incidentDate: { type: Date, required: true },
    reportedBy: { type: String, required: true },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Under Review", "Action Taken", "Resolved", "Suspended"],
      default: "Under Review",
    },
    action: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "StaffProfile" },
  },
  { timestamps: true },
);

export default mongoose.model("DisciplinaryFile", disciplinaryFileSchema);
