import mongoose from "mongoose";

const transportVehicleSchema = new mongoose.Schema(
  {
    registrationNumber: { type: String, required: true, unique: true }, // e.g., LE-1234
    vehicleType: {
      type: String,
      enum: ["Bus", "Coaster", "Van"],
      required: true,
    },
    capacity: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Active", "Maintenance", "Retired"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("TransportVehicle", transportVehicleSchema);
