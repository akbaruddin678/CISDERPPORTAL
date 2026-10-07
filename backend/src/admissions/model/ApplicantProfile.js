import mongoose from "mongoose";

const applicantProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      index: true,
    },
    education: [
      {
        level: String,
        institution: String,
        board: String,
        year: Number,
        gradeOrCgpa: String,
        documents: [String],
      },
    ],
    currentTermId: { type: mongoose.Schema.Types.ObjectId, ref: "Term" },
  },
  { timestamps: true }
);

export default mongoose.model("ApplicantProfile", applicantProfileSchema);
