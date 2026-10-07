// src/course/models/Course.js
import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true, trim: true, sparse: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },

    // ✅ CHANGED: Now a paragraph field for course content/syllabus details
    courseContent: { type: String, default: "" },

    owningDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    proposedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
      required: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "RETIRED"],
      default: "DRAFT",
      index: true,
    },
    rejectionReason: { type: String, default: "" },
    approvalLogs: [
      {
        actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        actorRole: String,
        action: String,
        comments: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    creditHours: {
      theory: { type: Number, default: 3 },
      lab: { type: Number, default: 0 },
    },
    prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    corequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    level: { type: String, enum: ["UG", "MS", "PHD", "CIS"], default: "UG" },
    isActive: { type: Boolean, default: true },
    clos: [
      {
        cloCode: { type: String, required: true },
        description: { type: String, required: true },
        weightage: { type: Number, required: true },
        mappedPlos: [{ type: String }],
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

courseSchema.virtual("totalCredits").get(function () {
  return (this.creditHours.theory || 0) + (this.creditHours.lab || 0);
});

courseSchema.pre("save", function (next) {
  if (this.status === "ACTIVE" && !this.code) {
    next(
      new Error("Course code must be assigned by Registrar before activation."),
    );
  } else {
    next();
  }
});

export default mongoose.models.Course || mongoose.model("Course", courseSchema);
