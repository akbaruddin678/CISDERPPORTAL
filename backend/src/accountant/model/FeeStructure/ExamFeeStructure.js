import mongoose from "mongoose";

const feeItemSchema = new mongoose.Schema({
  headId: { type: mongoose.Schema.Types.ObjectId, ref: "FeeHead", required: true },
  amount: { type: Number, required: true },
}, { _id: false });

const examFeeSchema = new mongoose.Schema({
  programId: { type: mongoose.Schema.Types.ObjectId, ref: "Program", required: true },
  termId: { type: mongoose.Schema.Types.ObjectId, ref: "Term", required: true },
  
  // "levelNumber" stores either the Semester # (1-12) or Year # (1-5)
  levelNumber: { type: Number, required: true }, 
  academicLevel: { type: String, enum: ["SEMESTER", "YEAR"], required: true },

  feeItems: [feeItemSchema],
  totalAmount: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Unique: Only one exam fee per semester/year for a program
examFeeSchema.index({ programId: 1, termId: 1, levelNumber: 1 }, { unique: true });

export default mongoose.model("ExamFeeStructure", examFeeSchema);