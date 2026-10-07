import mongoose from "mongoose";

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
    type: {
      type: String,
      enum: [
        "Sessional",
        "Quiz",
        "Assignment",
        "Practical",
        "Mid Term",
        "Final Exam",
      ],
      required: true,
    },
    weightage: { type: Number, default: 0 }, // e.g., 30 for 30%
    totalMarks: { type: Number, required: true },
    // Scheduling fields are intentionally optional at the schema level — a
    // DRAFT/SCHEDULED exam plan-row can exist with marks allocated but no
    // date yet. publishExams() enforces these are all filled in before an
    // exam can move to PUBLISHED (see examController.js).
    date: { type: Date, default: null },
    startTime: { type: String, default: "" },
    endTime: { type: String, default: "" },
    duration: { type: Number, default: 0 }, // in minutes
    isAnonymized: { type: Boolean, default: false },
    // Exam-day lifecycle — unrelated to publishStatus below.
    status: {
      type: String,
      enum: ["Scheduled", "Ongoing", "Completed", "Cancelled"],
      default: "Scheduled",
    },
    // Admin-facing setup lifecycle: DRAFT/SCHEDULED stay editable and
    // hidden from teachers; PUBLISHED locks the exam and is what makes it
    // appear on the teacher's side (see teacherMarksController.js's
    // getScheduledExams/resolveExamForAssignment).
    publishStatus: {
      type: String,
      enum: ["DRAFT", "SCHEDULED", "PUBLISHED"],
      default: "DRAFT",
      index: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Exam", examSchema);
