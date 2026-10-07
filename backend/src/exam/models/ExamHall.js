import mongoose from "mongoose";

const examHallSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    status: { type: String, default: "Active" },
  },
  { timestamps: true },
);

export default mongoose.model("ExamHall", examHallSchema);
