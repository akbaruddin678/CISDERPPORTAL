import mongoose from "mongoose";

const staffLeaveRequestSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
      index: true,
    },
    leaveType: {
      type: String,
      enum: ["Casual", "Medical", "Annual", "Unpaid", "Maternity"],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: { type: Number, required: true },
    reason: { type: String, required: true },
    attachmentUrl: { type: String }, // e.g., Medical Certificate

    status: {
      type: String,
      enum: ["Pending", "Approved_HOD", "Approved_HR", "Rejected"],
      default: "Pending",
    },

    // Audit Trail — stage-scoped, so the HR review never overwrites the
    // HOD's remarks/identity (and vice versa).
    hodReview: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "StaffProfile" },
      remarks: { type: String },
      reviewedAt: { type: Date },
    },
    hrReview: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "StaffProfile" },
      remarks: { type: String },
      reviewedAt: { type: Date },
    },
  },
  { timestamps: true },
);

export default mongoose.model("StaffLeaveRequest", staffLeaveRequestSchema);
