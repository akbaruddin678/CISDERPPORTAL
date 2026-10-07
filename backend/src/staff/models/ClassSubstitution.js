import mongoose from "mongoose";

const classSubstitutionSchema = new mongoose.Schema(
  {
    requestingTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
    },
    courseAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseAssignment",
      required: true,
    },

    dateOfAbsence: { type: Date, required: true },
    reason: { type: String, required: true },

    // The teacher covering the class
    substituteTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
    },

    status: {
      type: String,
      enum: [
        "Requested",
        "Accepted By Substitute",
        "Approved By HOD",
        "Rejected",
      ],
      default: "Requested",
    },
  },
  { timestamps: true },
);

export default mongoose.model("ClassSubstitution", classSubstitutionSchema);
