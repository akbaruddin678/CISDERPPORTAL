// src/staff/models/StaffProfile.js
import mongoose from "mongoose";

const staffProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
      index: true,
    },
    employeeId: { type: String, unique: true, sparse: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    designation: { type: String }, // e.g., "Assistant Professor"
    phone: { type: String },
    hireDate: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.models.StaffProfile ||
  mongoose.model("StaffProfile", staffProfileSchema);
