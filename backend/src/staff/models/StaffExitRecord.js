import mongoose from "mongoose";

const staffExitRecordSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["Resignation", "Termination", "Retirement", "Contract Expiry"],
      required: true,
    },
    noticeGivenDate: { type: Date, required: true },
    lastWorkingDay: { type: Date, required: true },
    reason: { type: String },

    // Clearance Checklist (True means cleared)
    clearances: {
      itDepartment: { type: Boolean, default: false },
      library: { type: Boolean, default: false },
      finance: { type: Boolean, default: false },
      departmentHod: { type: Boolean, default: false },
    },

    exitInterviewNotes: { type: String },
    finalSettlementAmount: { type: Number },
    finalSettlementPaid: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("StaffExitRecord", staffExitRecordSchema);
