import mongoose from "mongoose";

const transportAllocationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransportRoute",
      required: true,
    },
    stopName: { type: String, required: true },

    // Fees are snapshotted from the Stop at time of allocation
    agreedMonthlyFare: { type: Number, required: true },

    allocationDate: { type: Date, default: Date.now },
    vacatedDate: { type: Date },
    status: {
      type: String,
      enum: ["ALLOCATED", "VACATED"],
      default: "ALLOCATED",
    },
  },
  { timestamps: true }
);

transportAllocationSchema.index(
  { studentId: 1 },
  { unique: true, partialFilterExpression: { status: "ALLOCATED" } }
);

export default mongoose.model("TransportAllocation", transportAllocationSchema);
