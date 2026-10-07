import mongoose from "mongoose";

const transportDriverSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    cnic: { type: String, required: true, unique: true },
    licenseNumber: { type: String, required: true },
    contactNumber: { type: String, required: true },
    status: { type: String, enum: ["Active", "On Leave"], default: "Active" },
  },
  { timestamps: true }
);

export default mongoose.model("TransportDriver", transportDriverSchema);
