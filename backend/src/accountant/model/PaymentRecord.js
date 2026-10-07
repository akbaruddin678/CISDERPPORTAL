import mongoose from "mongoose";
import { campusScopedPlugin } from "../../core/middleware/campusContext.js";

const expenseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  proofs: [{ type: String }], // Array of Cloudflare R2 image URLs
  // Make sure "User" matches the name of your actual Admin/Staff model!
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const paymentRecordSchema = new mongoose.Schema(
  {
    // ✅ NEW: Tells us if this is an allocation, received income, or direct expense
    recordType: {
      type: String,
      enum: ["allocation", "received", "direct"],
      default: "allocation",
    },
    title: { type: String, required: true },
    description: { type: String },

    // ✅ NEW: Where the money came from (for received/direct)
    source: { type: String },

    // ✅ NEW: Financial Fields
    allocatedAmount: { type: Number, default: 0 },
    receivedAmount: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }, // specifically for direct expenses

    date: { type: Date, default: Date.now },

    // ✅ NEW: Proofs handling
    initialProof: { type: String }, // Handover proof for allocations/received
    proofs: [{ type: String }], // Array of proofs for direct expenses

    // ✅ FIX FOR THE 500 ERROR: These must exist in the root schema to be populated!
    headOfAccount: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    status: { type: String, enum: ["Open", "Closed"], default: "Open" },
    expenses: [expenseSchema],
  },
  { timestamps: true },
);

paymentRecordSchema.plugin(campusScopedPlugin);
export default mongoose.model("PaymentRecord", paymentRecordSchema);
