import mongoose from "mongoose";

const courseDiscussionSchema = new mongoose.Schema(
  {
    courseAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseAssignment",
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    authorModel: {
      type: String,
      enum: ["StudentProfile", "StaffProfile"],
      required: true,
    },

    message: { type: String, required: true },

    replyToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseDiscussion",
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("CourseDiscussion", courseDiscussionSchema);
