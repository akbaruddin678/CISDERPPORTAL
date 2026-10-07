import mongoose from "mongoose";

const alumniProfileSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
      unique: true,
    },
    graduationYear: { type: Number, required: true },
    employer: { type: String, default: "" },
    designation: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Employed", "Seeking", "Higher Ed"],
      default: "Seeking",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "StaffProfile" },
  },
  { timestamps: true },
);

export default mongoose.model("AlumniProfile", alumniProfileSchema);
