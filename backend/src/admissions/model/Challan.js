import mongoose from "mongoose";

const ChallanItemSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    label: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const ChallanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    admissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admission",
      index: true,
    },
    challanNo: { type: String, unique: true, index: true, required: true },
    items: { type: [ChallanItemSchema], default: [] },
    total: { type: Number, required: true },
    currency: { type: String, default: "PKR" },
    status: {
      type: String,
      enum: ["issued", "paid", "overdue", "cancelled"],
      default: "issued",
      index: true,
    },
    dueDate: { type: Date, required: true },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Challan", ChallanSchema);
