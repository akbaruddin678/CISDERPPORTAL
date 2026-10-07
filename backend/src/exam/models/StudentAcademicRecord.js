import mongoose from "mongoose";

// This stores the compiled result at the end of a semester (SGPA/CGPA)
const studentAcademicRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
    },
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true,
    },
    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Term",
      required: true,
    },

    totalCreditsAttempted: { type: Number, required: true },
    totalCreditsEarned: { type: Number, required: true },
    sgpa: { type: Number, required: true }, // Semester GPA
    cgpa: { type: Number, required: true }, // Cumulative GPA

    academicStanding: {
      type: String,
      enum: ["Good", "Probation", "Suspended", "Graduated"],
      default: "Good",
    },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model(
  "StudentAcademicRecord",
  studentAcademicRecordSchema,
);
