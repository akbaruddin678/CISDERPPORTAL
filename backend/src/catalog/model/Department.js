import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, index: true },
    headOfDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffProfile",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Department", departmentSchema);
