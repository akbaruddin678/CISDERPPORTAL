import mongoose from "mongoose";

const InstallmentPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true,
    },
    numberOfInstallments: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    scheduleConfig: [
      {
        installmentNumber: { type: Number, required: true },
        specificDueDate: { type: Date },
        daysAfterAssignment: { type: Number },
        percentage: { type: Number, required: true, default: 0 },
        billingMonth: { type: String, trim: true },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

InstallmentPlanSchema.index({ isActive: 1 });

InstallmentPlanSchema.index({ name: 1, semesterId: 1 }, { unique: true });

export default mongoose.model("InstallmentPlan", InstallmentPlanSchema);
