import mongoose from "mongoose";

const CLEARANCE_STATUS = ["Pending", "Cleared", "Blocked"];

const degreeClearanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    termId: { type: mongoose.Schema.Types.ObjectId, ref: "Term" },
    clearances: {
      library: { type: String, enum: CLEARANCE_STATUS, default: "Pending" },
      hostel: { type: String, enum: [...CLEARANCE_STATUS, "N/A"], default: "N/A" },
      finance: { type: String, enum: CLEARANCE_STATUS, default: "Pending" },
      hod: { type: String, enum: CLEARANCE_STATUS, default: "Pending" },
    },
    coeStatus: { type: String, enum: ["Pending", "Cleared"], default: "Pending" },
    vcStatus: { type: String, enum: ["Pending", "Approved"], default: "Pending" },
    overallStatus: { type: String, default: "In Progress" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "StaffProfile" },
  },
  { timestamps: true },
);

// Recomputes coeStatus/overallStatus from the current clearance flags —
// called whenever any clearance or the VC status changes, so the two
// derived fields never drift from the underlying booleans.
degreeClearanceSchema.methods.recalculate = function () {
  const entries = Object.entries(this.clearances.toObject ? this.clearances.toObject() : this.clearances);
  const blocked = entries.find(([, v]) => v === "Blocked");

  if (blocked) {
    this.coeStatus = "Pending";
    this.overallStatus = `Blocked – ${blocked[0].charAt(0).toUpperCase() + blocked[0].slice(1)}`;
    return;
  }

  const allCleared = entries.every(([, v]) => v === "Cleared" || v === "N/A");
  if (allCleared) {
    this.coeStatus = "Cleared";
    this.overallStatus = this.vcStatus === "Approved" ? "Degree Issued" : "Pending VC";
    return;
  }

  this.coeStatus = "Pending";
  const pending = entries.find(([, v]) => v === "Pending");
  this.overallStatus = pending
    ? `Pending – ${pending[0].charAt(0).toUpperCase() + pending[0].slice(1)}`
    : "In Progress";
};

export default mongoose.model("DegreeClearance", degreeClearanceSchema);
