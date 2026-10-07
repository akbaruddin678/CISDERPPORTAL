import mongoose from "mongoose";

const studentMentorshipSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
      index: true,
    },
    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Term",
      required: true,
    },

    // Logs of meetings between the teacher and the student
    meetingLogs: [
      {
        date: { type: Date, required: true },
        discussionTopic: { type: String, required: true },
        academicProgress: {
          type: String,
          enum: ["Excellent", "Satisfactory", "At Risk", "Critical"],
        },
        actionItems: { type: String },
      },
    ],
  },
  { timestamps: true },
);

// Ensure a student only has one mentor per term
studentMentorshipSchema.index({ studentId: 1, termId: 1 }, { unique: true });

export default mongoose.model("StudentMentorship", studentMentorshipSchema);
