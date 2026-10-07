// models/EducationHistory.js
import mongoose from "mongoose";

const educationHistorySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
      index: true,
    },
    educationProgram: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDateOrResultAwaited: { type: Date },
    obtainedMarks: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    institution: { type: String },
    board: { type: String },
    grade: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("EducationHistory", educationHistorySchema);