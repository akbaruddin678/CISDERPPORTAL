import mongoose from "mongoose";

const feeItemSchema = new mongoose.Schema(
  {
    headId: { type: mongoose.Schema.Types.ObjectId, ref: "FeeHead" }, // Optional
    headName: { type: String, default: "Fee" }, // Snapshot name
    isPercentage: { type: Boolean, default: false },
    percentageValue: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    frequency: { type: String, default: "ONCE" }, // Added to match your "old system"
  },
  { _id: false },
);

const studentFeeStructureSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Term",
      required: true,
    },
    // Allows Tuition, Admission, etc. separately
    category: {
      type: String,
      enum: ["ACADEMIC", "ADMISSION", "READMISSION", "EXAM", "MISC"],
      required: true,
    },
    totalAmount: { type: Number, required: true, min: 0 },
    feeItems: [feeItemSchema], // The breakdown array

    isActive: { type: Boolean, default: true },
    remarks: { type: String },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Unique Constraint: One "Tuition" structure per student per term
studentFeeStructureSchema.index(
  { studentId: 1, termId: 1, category: 1 },
  { unique: true },
);

export default mongoose.model("StudentFeeStructure", studentFeeStructureSchema);
