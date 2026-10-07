import mongoose from "mongoose";

const jobPostingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g., "Assistant Professor of Computer Science"
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    employmentType: {
      type: String,
      enum: ["Full-Time", "Part-Time", "Contract", "Visiting"],
      required: true,
    },
    description: { type: String, required: true },
    requirements: [{ type: String }],

    status: {
      type: String,
      enum: ["Draft", "Published", "Closed"],
      default: "Draft",
    },
    applicationDeadline: { type: Date, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "StaffProfile" },
  },
  { timestamps: true },
);

export default mongoose.model("JobPosting", jobPostingSchema);
