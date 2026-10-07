import mongoose from "mongoose";

const stopSchema = new mongoose.Schema({
  stopName: { type: String, required: true },
  monthlyFare: { type: Number, required: true },
  pickUpTime: { type: String }, // Optional
  dropOffTime: { type: String }, // Optional
});

const transportRouteSchema = new mongoose.Schema(
  {
    routeName: { type: String, required: true }, // e.g., "Route 1 - Blue Bus"
    driverName: { type: String },
    vehicleNumber: { type: String },
    capacity: { type: Number },
    stops: [stopSchema], // The list of stops and their prices
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("TransportRoute", transportRouteSchema);
