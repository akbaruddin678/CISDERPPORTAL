import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      index: true,
    },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: "Program" },
    termId: { type: mongoose.Schema.Types.ObjectId, ref: "Term" },
    type: {
      type: String,
      enum: ["unconditional", "conditional"],
      default: "unconditional",
    },
    conditions: [String],
    issuedAt: Date,
    expiresAt: Date,
    status: {
      type: String,
      enum: ["issued", "accepted", "declined", "expired", "revoked"],
      default: "issued",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Offer", offerSchema);
