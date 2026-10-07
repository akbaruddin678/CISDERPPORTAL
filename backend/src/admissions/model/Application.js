import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    applicantUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      index: true,
    },
    termId: { type: mongoose.Schema.Types.ObjectId, ref: "Term", index: true },
    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "under_review",
        "shortlisted",
        "offered",
        "conditionally_offered",
        "rejected",
        "accepted",
        "withdrawn",
      ],
      default: "draft",
      index: true,
    },
    scores: { test: Number, interview: Number, composite: Number },
    remarks: [
      {
        byUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        at: Date,
        text: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Application", applicationSchema);
