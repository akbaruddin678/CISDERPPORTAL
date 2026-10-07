import mongoose from "mongoose";

const feeHeadSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  type: {
    type: String,
    enum: ["ACADEMIC", "ADMISSION", "TRANSPORT", "HOSTEL", "MISCELLANEOUS"],
    required: true,
  },
  isRefundable: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("FeeHead", feeHeadSchema);