import mongoose from "mongoose";

const timetableEntrySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      required: true,
    },
    slot: { type: String, required: true },
    courseAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseAssignment",
      required: true,
    },
    // Deprecated free-text pair, kept (not yet required) until every row is
    // backfilled onto roomId — see backend/scripts/2026-10-backfill-room-collection.mjs.
    // A later cleanup commit will flip roomId to required and drop these.
    room: { type: String },
    roomCapacity: { type: Number, min: 1 },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "StaffProfile" },
  },
  { timestamps: true },
);

export default mongoose.models.TimetableEntry || mongoose.model("TimetableEntry", timetableEntrySchema);
