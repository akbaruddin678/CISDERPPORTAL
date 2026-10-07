import mongoose from "mongoose";

const miscellaneousFeeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("MiscellaneousFee", miscellaneousFeeSchema);