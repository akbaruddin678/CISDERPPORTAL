import mongoose from "mongoose";

const courseMaterialSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Term",
      required: true,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    materialType: {
      type: String,
      enum: [
        "Syllabus",
        "Lecture Notes",
        "Presentation",
        "Reading Material",
        "Video Link",
        "Other",
      ],
      default: "Lecture Notes",
    },
    fileUrl: {
      type: String, // URL from Cloudinary, S3, or your local static folder
    },
    fileType: {
      type: String, // e.g., "pdf", "docx", "mp4", "link"
    },
    isPublished: {
      type: Boolean,
      default: true, // If false, hidden from students until the teacher publishes it
    },
  },
  { timestamps: true },
);

// Indexes to make queries faster since students will load this frequently
courseMaterialSchema.index({ courseId: 1, termId: 1 });
courseMaterialSchema.index({ instructorId: 1 });

// The bulletproof export to prevent Nodemon overwrite crashes
export default mongoose.models.CourseMaterial ||
  mongoose.model("CourseMaterial", courseMaterialSchema);
