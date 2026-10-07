import mongoose from "mongoose";

const reEvaluationSchema = new mongoose.Schema(
  {
    resultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamResult",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    feePaymentId: { type: String, required: true }, // Link to Finance Module
    requestDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["Applied", "Under Review", "Changed", "Unchanged"],
      default: "Applied",
    },
    oldMarks: { type: Number, required: true },
    newMarks: { type: Number },
    decisionNote: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("ReEvaluation", reEvaluationSchema);
