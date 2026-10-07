import mongoose from "mongoose";

const courseAssignmentSchema = new mongoose.Schema(
  {
    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Term",
      required: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true,
    },
    section: {
      type: String,
      required: true,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
    },
    capacity: {
      type: Number,
      default: 50,
      min: 1,
    },
    courseType: {
      type: String,
      enum: ["MANDATORY", "ELECTIVE"],
      default: "MANDATORY",
      index: true,
    },
    enrolledCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

// This compound index ensures you don't accidentally assign the exact same course
// to the exact same section twice in a single term.
courseAssignmentSchema.index(
  { termId: 1, programId: 1, courseId: 1, semesterId: 1, section: 1 },
  { unique: true },
);

export default mongoose.model("CourseAssignment", courseAssignmentSchema);
