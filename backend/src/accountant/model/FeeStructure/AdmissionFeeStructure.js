import mongoose from "mongoose";

const feeItemSchema = new mongoose.Schema({
  headId: { type: mongoose.Schema.Types.ObjectId, ref: "FeeHead", required: true },
  isPercentage: { type: Boolean, default: false },
  percentageValue: { type: Number, default: 0 },
  amount: { type: Number, required: true },
  frequency: { type: String, default: "ONCE" }
}, { _id: false });

const admissionFeeStructureSchema = new mongoose.Schema({
  programId: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true },
  termId: { type: mongoose.Schema.Types.ObjectId, ref: "Term", required: true },
  feeItems: [feeItemSchema],
  totalAmount: { type: Number, required: true }, 
  securityDeposit: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Prevent duplicate for same Program (One-Time Only)
admissionFeeStructureSchema.index({ programId: 1, termId: 1 }, { unique: true });

export default mongoose.model("AdmissionFeeStructure", admissionFeeStructureSchema);