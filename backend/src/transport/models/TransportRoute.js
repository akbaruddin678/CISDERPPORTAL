import mongoose from "mongoose";

const stopSchema = new mongoose.Schema({
  stopName: { type: String, required: true },
  pickupTime: { type: String, required: true }, // e.g., "07:30 AM"
  monthlyFare: { type: Number, required: true }, // FEE IS HERE
});

const transportRouteSchema = new mongoose.Schema(
  {
    routeName: { type: String, required: true, unique: true }, // e.g., "Route 1 - Blue"
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransportVehicle",
    },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "TransportDriver" },
    stops: [stopSchema],
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

export default mongoose.model("TransportRoute", transportRouteSchema);
