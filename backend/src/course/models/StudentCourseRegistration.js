import mongoose from "mongoose";

const studentCourseRegistrationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
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
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    courseAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseAssignment",
      index: true,
    },
    section: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Registered", "In-Progress", "Passed", "Failed", "Dropped"],
      default: "Registered",
    },
    grade: { type: String },
    isRetake: { type: Boolean, default: false },

    // Marks entered by the course's teacher (see exam/controllers/
    // teacherMarksController.js). Previously written via a `strict: false`
    // update since these weren't declared on the schema — now first-class.
    midMarks: { type: Number },
    finalMarks: { type: Number },
    sessionalMarks: { type: Number },
  },
  { timestamps: true },
);

studentCourseRegistrationSchema.index(
  { studentId: 1, termId: 1, courseId: 1 },
  { unique: true },
);
studentCourseRegistrationSchema.index({ courseAssignmentId: 1, status: 1 });

export default mongoose.model(
  "StudentCourseRegistration",
  studentCourseRegistrationSchema,
);
