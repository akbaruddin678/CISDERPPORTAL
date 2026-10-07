import mongoose from "mongoose";

const gradingSchemeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "Standard 4.0 Scale"
    type: {
      type: String,
      enum: ["Absolute", "Relative", "PassFail"],
      required: true,
    },
    gradePoints: [
      {
        grade: { type: String, required: true }, // A, B+, etc.
        minPercentage: { type: Number },
        maxPercentage: { type: Number },
        point: { type: Number, required: true }, // 4.0, 3.7, etc.
      },
    ],
    passingThreshold: { type: Number, default: 50 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("GradingScheme", gradingSchemeSchema);
