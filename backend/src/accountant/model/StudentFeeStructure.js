import mongoose from "mongoose";
import { campusScopedPlugin } from "../../core/middleware/campusContext.js";

const feeItemSchema = new mongoose.Schema(
  {
    headId: { type: mongoose.Schema.Types.ObjectId, ref: "FeeHead" },
    headName: { type: String, default: "Fee" },
    isPercentage: { type: Boolean, default: false },
    percentageValue: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    frequency: { type: String, default: "ONCE" },
  },
  { _id: false },
);

const studentFeeStructureSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Term",
    },
    // Only set for ACADEMIC/EXAM — these repeat once per semester (unlike
    // ADMISSION/READMISSION, which are one-time per program enrollment).
    // termId alone can't distinguish "semester 2's fee" from "semester 3's"
    // because promoting a student often keeps the same term.
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
    },
    category: {
      type: String,
      enum: ["ACADEMIC", "ADMISSION", "READMISSION", "EXAM", "MISC"],
      required: true,
    },
    title: { type: String },
    totalAmount: { type: Number, required: true, min: 0 },
    feeItems: [feeItemSchema],
    isActive: { type: Boolean, default: true },
    remarks: { type: String },
    // Optional staff-entered note about THIS fee setup (e.g. why the amount
    // is what it is) — kept separate from `remarks` above, which is used as
    // system-generated/fallback text (e.g. "Admission Processing", "Bulk
    // Fee") and isn't user-editable.
    feeSetupRemark: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);



studentFeeStructureSchema.plugin(campusScopedPlugin);
export default mongoose.model("StudentFeeStructure", studentFeeStructureSchema);
