import mongoose from "mongoose";

// One document per (exam, course section) — tracks the workflow state of
// Exam-Cell staff recording attendance for one scheduled exam, separately
// from the actual per-student rows in ExamAttendance. Chain is
// DRAFT -> PENDING_HOD -> APPROVED, with a RETURNED decision sending it
// back to DRAFT for Exam-Cell staff to fix and re-submit. This is a single
// departmental sign-off (unlike the 3-stage Marks chain) — nothing
// downstream depends on attendance being "officially declared" beyond the
// HOD's own review.
const examAttendanceSubmissionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    courseAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseAssignment",
      required: true,
    },
    // Exam-Cell staff (role manager/admin) who recorded this — not the
    // course's own teacher, matching who ran attendance-taking before.
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PENDING_HOD", "APPROVED", "RETURNED"],
      default: "DRAFT",
    },
    completedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    hodRemarks: { type: String, default: "" },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

examAttendanceSubmissionSchema.index(
  { examId: 1, courseAssignmentId: 1 },
  { unique: true },
);

export default mongoose.model(
  "ExamAttendanceSubmission",
  examAttendanceSubmissionSchema,
);
