import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    challanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentChallan",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    installmentAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentInstallmentAssignment",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["bank_deposit", "online_transfer", "cash"],
      default: "bank_deposit",
      required: true,
    },
    // The Bank Scroll Number or Reference ID
    transactionId: {
      type: String,
      trim: true,
      required: true,
    },
    bankName: {
      type: String,
      trim: true,
      default: "University Bank", // Set your default bank if applicable
    },
    branchCode: {
      type: String,
      trim: true,
    },
    // Date the payment was actually deposited in the bank
    depositDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["verified", "bounced", "refunded"],
      default: "verified",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

PaymentSchema.index({ studentId: 1, depositDate: -1 });
PaymentSchema.index({ transactionId: 1 }, { unique: true }); // Ensure unique bank scroll numbers
PaymentSchema.index({ challanId: 1 });

export default mongoose.model("Payment", PaymentSchema);
