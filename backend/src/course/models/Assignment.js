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

const dueDateExtensionSchema = new mongoose.Schema(
  {
    previousDueDate: { type: Date, required: true },
    newDueDate: { type: Date, required: true },
    reason: { type: String, default: "" },
    extendedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const assignmentSchema = new mongoose.Schema(
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
    title: { type: String, required: true },
    instructions: { type: String, default: "" },
    totalMarks: { type: Number, default: null },
    dueDate: { type: Date, required: true },
    originalDueDate: { type: Date, required: true },
    allowLateSubmission: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Published",
    },
    attachments: [attachmentSchema],
    dueDateExtensions: [dueDateExtensionSchema],
  },
  { timestamps: true },
);

assignmentSchema.set("toJSON", {
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

export default mongoose.models.Assignment ||
  mongoose.model("Assignment", assignmentSchema);
