import mongoose from "mongoose";

const payrollSlipSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
      index: true,
    },
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true }, // e.g., 2026

    basicSalary: { type: Number, required: true },
    allowances: [
      { name: { type: String }, amount: { type: Number } }, // e.g., House Rent, Transport
    ],
    deductions: [
      { name: { type: String }, amount: { type: Number } }, // e.g., Income Tax, Unpaid Leave
    ],

    netPayable: { type: Number, required: true },

    status: {
      type: String,
      enum: ["Generated", "Approved", "Paid"],
      default: "Generated",
    },
    paymentDate: { type: Date },
    transactionId: { type: String }, // Bank transaction reference
  },
  { timestamps: true },
);

// Ensure only one slip per staff member per month
payrollSlipSchema.index({ staffId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model("PayrollSlip", payrollSlipSchema);
