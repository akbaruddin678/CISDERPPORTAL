import mongoose from "mongoose";

// One document per (exam, teacher's section) — tracks the workflow state of
// a teacher's mark entry for one scheduled exam, separately from the actual
// per-student data in ExamResult. The chain is
// DRAFT -> PENDING_HOD -> PENDING_ACADEMIA -> PENDING_VC -> APPROVED, with
// a RETURNED branch (from any pending stage) sending it back to DRAFT for
// the teacher to fix and re-publish. Only the final APPROVED (VC) step
// marks the underlying ExamResult rows "Verified" for transcripts.
const examMarksSubmissionSchema = new mongoose.Schema(
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
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING_HOD",
        "PENDING_ACADEMIA",
        "PENDING_VC",
        "APPROVED",
        "RETURNED",
      ],
      default: "DRAFT",
    },
    // Set when the teacher clicks "Mark Complete" — the clock the 48h
    // auto-publish sweep counts from.
    completedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    autoPublished: { type: Boolean, default: false },
    // Remarks from whichever stage (HOD/Academia/VC) last returned this.
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

examMarksSubmissionSchema.index(
  { examId: 1, courseAssignmentId: 1 },
  { unique: true },
);

export default mongoose.model("ExamMarksSubmission", examMarksSubmissionSchema);
