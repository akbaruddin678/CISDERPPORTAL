import mongoose from "mongoose";

const feeItemSchema = new mongoose.Schema({
  headId: { type: mongoose.Schema.Types.ObjectId, ref: "FeeHead", required: true },
  isPercentage: { type: Boolean, default: false },
  percentageValue: { type: Number, default: 0 },
  amount: { type: Number, required: true },
  frequency: { type: String, default: "SEMESTER" }
}, { _id: false });

// Baseline per-semester fee — same shape as AcademicFeeStructure, kept as
// its own category/model so it can be configured and billed separately.
const basicFeeStructureSchema = new mongoose.Schema({
  programId: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true },
  termId: { type: mongoose.Schema.Types.ObjectId, ref: "Term", required: true },
  semesterNumber: { type: Number, required: true, min: 1, max: 12 },
  academicLevel: { type: String, default: "SEMESTER" },
  feeItems: [feeItemSchema],
  totalAmount: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Prevent duplicate for same Semester
basicFeeStructureSchema.index({ programId: 1, termId: 1, semesterNumber: 1 }, { unique: true });

export default mongoose.model("BasicFeeStructure", basicFeeStructureSchema);
