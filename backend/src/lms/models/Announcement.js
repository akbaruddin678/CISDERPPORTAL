import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    summary: { type: String },
    body: { type: String, trim: true, maxlength: 4000 },
    type: {
      type: String,
      enum: ["Academic", "Finance", "General", "Urgent"],
      default: "General",
    },
    active: { type: Boolean, default: true },
    date: { type: Date, default: Date.now },
    audienceRoles: [{ type: String, enum: ["student", "teacher"] }],
    recipientStudentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile" }],
    recipientStaffIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "StaffProfile" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

announcementSchema.index({ active: 1, audienceRoles: 1, createdAt: -1 });
announcementSchema.index({ active: 1, recipientStudentIds: 1, createdAt: -1 });
announcementSchema.index({ active: 1, recipientStaffIds: 1, createdAt: -1 });

export default mongoose.model("Announcement", announcementSchema);
