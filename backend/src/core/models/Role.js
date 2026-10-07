import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, required: true }, // applicant, student, staff, admin
    name: { type: String, required: true },
    permissions: { type: [String], default: [] }, // e.g. "application.review", "student.read"
  },
  { timestamps: true }
);

export default mongoose.model("Role", roleSchema);
