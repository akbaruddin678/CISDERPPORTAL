import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    fileType: {
      type: String,
      enum: [
        "pdf",
        "word",
        "excel",
        "powerpoint",
        "image",
        "video",
        "audio",
        "other",
      ],
      default: "other",
    },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const lectureSchema = new mongoose.Schema(
  {
    courseAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseAssignment",
      required: true,
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
      index: true,
    },
    week: { type: String, required: true },
    topic: { type: String, required: true },
    description: { type: String, default: "" },
    notes: { type: String, default: "" },
    date: { type: Date, default: Date.now },
    attachments: [attachmentSchema],
  },
  { timestamps: true },
);

lectureSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    ret.attachments = (ret.attachments || []).map((a) => ({
      ...a,
      id: String(a._id),
      _id: undefined,
    }));
    return ret;
  },
});

export default mongoose.models.Lecture || mongoose.model("Lecture", lectureSchema);
