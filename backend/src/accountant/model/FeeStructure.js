import mongoose from "mongoose";

const FeeHeadSchema = new mongoose.Schema(
  {
    headName: { type: String, required: true },
    amount: { type: Number, default: 0 },
    isPercentage: { type: Boolean, default: false },
    percentageValue: { type: Number, default: 0 },
    isInstitutional: { type: Boolean, default: false },
    isExam: { type: Boolean, default: false },
    isStop: { type: Boolean, default: false },
    calculationType: { type: String, default: "MANUAL" },
  },
  { _id: false }
);

const FeeComponentSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: [
      "ACADEMIC",
      "ADMISSION",
      "TRANSPORT",
      "HOSTEL",
      "EXAM",
      "MISCELLANEOUS",
    ],
    required: true,
  },
  frequency: {
    type: String,
    enum: ["SEMESTER", "YEARLY", "MONTHLY", "ONCE"],
    required: true,
  },
  occurrenceNumber: { type: Number, default: null },
  month: { type: String, default: "" },
  displayName: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  breakdown: [FeeHeadSchema],
  remark: { type: String, default: "" },
  calculationType: { type: String },
  isActive: { type: Boolean, default: true },
});

const feeStructureSchema = new mongoose.Schema(
  {
    // Program/Dept can now be NULL for global fees like Transport
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      default: null,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Term",
      required: true,
    },
    feeComponents: [FeeComponentSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Flexible Index: Allows unique combination of (Session + Dept + Program) OR just (Session)
feeStructureSchema.index(
  { termId: 1, departmentId: 1, programId: 1 },
  { unique: true }
);

export default mongoose.model("FeeStructure", feeStructureSchema);
