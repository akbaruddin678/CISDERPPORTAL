import mongoose from "mongoose";

// A HOD-decided record of a student being dropped/withdrawn from a course —
// HOD is the sole decision-maker (no separate submit-then-approve chain),
// created at the same moment StudentCourseRegistration.status flips to
// "Dropped". Registrar only ever reads this as a register, never acts on it.
const courseWithdrawalRecordSchema = new mongoose.Schema(
  {
    studentCourseRegistrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentCourseRegistration",
      required: true,
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
    },
    withdrawalType: {
      type: String,
      enum: ["Drop", "Withdrawal"],
      required: true,
    },
    reason: { type: String, required: true },
    decidedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model("CourseWithdrawalRecord", courseWithdrawalRecordSchema);
