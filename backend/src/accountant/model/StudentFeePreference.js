import mongoose from "mongoose";

const StudentFeePreferenceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    
    },
    
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true,
    },
    defaultInstallments: {
      type: Number,
      default: 1,
      min: 1,
      max: 12,
    },
    autoSplit: {
      type: Boolean,
      default: true,
    },
    // "percentage" (default) splits the LIVE tuition fee at generation time
    // — if the fee changes later, each installment's amount recalculates
    // against the new total. "amount" locks each installment to a fixed
    // Rupee figure instead, chosen once and never recalculated — needed
    // for plans set up around round/negotiated figures instead of clean
    // percentages (the College/Intermediate installment screen especially).
    installmentMode: {
      type: String,
      enum: ["percentage", "amount"],
      default: "percentage",
    },
    customPercentages: {
      type: [Number],
      default: [],
    },
    // Only meaningful when installmentMode is "amount" — one fixed Rupee
    // figure per installment, same length as customPercentages/customMonths.
    customAmounts: {
      type: [Number],
      default: [],
    },
    customMonths: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);


StudentFeePreferenceSchema.index({ studentId: 1, semesterId: 1 }, { unique: true });

export default mongoose.model(
  "StudentFeePreference",
  StudentFeePreferenceSchema
);