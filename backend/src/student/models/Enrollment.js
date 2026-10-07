import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      index: true,
    },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: "Program" },
    termId: { type: mongoose.Schema.Types.ObjectId, ref: "Term" },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: "Semester" },
    status: {
      type: String,
      enum: ["enrolled", "suspended", "withdrawn"],
      default: "enrolled",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Enrollment", enrollmentSchema);
