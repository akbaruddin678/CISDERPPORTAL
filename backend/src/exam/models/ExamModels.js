import mongoose from "mongoose";

// 1. EXAM (The Subject Paper/Assessment)
const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Term",
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
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

    // ✅ EXPANDED TYPES for University
    type: {
      type: String,
      enum: ["Quiz", "Assignment", "Practical", "Mid Term", "Final Exam"],
      required: true,
    },

    totalMarks: { type: Number, required: true },
    date: { type: Date, required: true },
    startTime: { type: String },
    duration: { type: Number, required: true },
    status: { type: String, default: "Scheduled" },
  },
  { timestamps: true },
);

// 2. EXAM REGISTRATION
const examRegistrationSchema = new mongoose.Schema(
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
    rollNumber: { type: String },
    isEligible: { type: Boolean, default: true },
    isFeeCleared: { type: Boolean, default: false },
  },
  { timestamps: true },
);
examRegistrationSchema.index({ studentId: 1, termId: 1 }, { unique: true });

// 3. EXAM RESULT (The Marks)
const examResultSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    obtainedMarks: { type: Number, default: 0 },
    isAbsent: { type: Boolean, default: false },
    remarks: { type: String }, // Optional teacher notes
  },
  { timestamps: true },
);
// Ensure one result per student per exam
examResultSchema.index({ examId: 1, studentId: 1 }, { unique: true });

export const Exam = mongoose.model("Exam", examSchema);
export const ExamRegistration = mongoose.model(
  "ExamRegistration",
  examRegistrationSchema,
);
export const ExamResult = mongoose.model("ExamResult", examResultSchema);
