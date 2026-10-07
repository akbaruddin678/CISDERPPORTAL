import mongoose from "mongoose";

// Kept purely as a read-side reference for Marks Upload (marksController.js
// shows any existing attendance status alongside the marks grid) — the
// standalone attendance-taking screen/endpoints that used to write to this
// collection have been removed; no new records are created here anymore.
const examAttendanceSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Present", "Late", "Absent"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

examAttendanceSchema.index({ examId: 1, studentId: 1 }, { unique: true });

export default mongoose.model("ExamAttendance", examAttendanceSchema);
