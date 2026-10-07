// src/exam/models/MarkDistribution.js
import mongoose from "mongoose";

const markDistributionSchema = new mongoose.Schema(
  {
    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Term",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    mid: { type: Number, default: 20 },
    final: { type: Number, default: 50 },
    sessional: { type: Number, default: 30 },
  },
  { timestamps: true },
);

markDistributionSchema.index({ termId: 1, courseId: 1 }, { unique: true });

export default mongoose.model("MarkDistribution", markDistributionSchema);
