// models/FineHistory.js
import mongoose from "mongoose";

const FineHistorySchema = new mongoose.Schema(
  {
    challanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentChallan",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    fineAmount: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true },
    addedAt: { type: Date, default: Date.now },
    isWaived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

FineHistorySchema.index({ studentId: 1, addedAt: -1 });
FineHistorySchema.index({ challanId: 1 });

export default mongoose.model("FineHistory", FineHistorySchema);
