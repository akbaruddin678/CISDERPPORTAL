// models/ScholarshipPlan.js
import mongoose from "mongoose";

const ScholarshipPlanSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["fixed", "percentage"],
      required: true,
    },
    maxAmount: {
      type: Number,
      min: 0,
    },
    maxPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Term",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    remark: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
    validFrom: {
      type: Date,
    },
    validTo: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Add unique index for title
ScholarshipPlanSchema.index({ title: 1 }, { unique: true });

// Validation for dates
ScholarshipPlanSchema.pre('save', function(next) {
  if (this.validTo && this.validFrom && this.validTo < this.validFrom) {
    return next(new Error('Valid To date must be later than Valid From date.'));
  }
  
  // Validate based on type
  if (this.type === 'fixed' && !this.maxAmount) {
    return next(new Error('maxAmount is required for fixed type scholarships'));
  }
  
  if (this.type === 'percentage' && !this.maxPercentage) {
    return next(new Error('maxPercentage is required for percentage type scholarships'));
  }
  
  next();
});

export default mongoose.model("ScholarshipPlan", ScholarshipPlanSchema);