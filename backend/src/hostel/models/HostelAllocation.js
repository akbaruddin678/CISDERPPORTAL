import mongoose from "mongoose";

const hostelAllocationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    hostelName: { type: String, required: true },
    roomNumber: { type: String, required: true },

    // Changed monthlyRent to Number for calculation consistency
    monthlyRent: { type: Number, required: true },
    admissionFee: { type: Number, default: 0 },
    securityDeposit: { type: Number, default: 0 },

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

// Ensure a student has only one active allocation
hostelAllocationSchema.index(
  { studentId: 1 },
  { unique: true, partialFilterExpression: { status: "ALLOCATED" } }
);

export default mongoose.model("HostelAllocation", hostelAllocationSchema);
