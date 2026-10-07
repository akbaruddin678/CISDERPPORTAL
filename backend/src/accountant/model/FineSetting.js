import mongoose from "mongoose";

// One document per campus (campusId = null is the default for every campus
// that has not set its own). `lateFineAmount` is the flat fine charged on a
// challan once its due date has passed. 0 means "never impose a fine".
// Deliberately NOT campus-scoped by the plugin: the service reads and writes
// it by explicit campusId so the daily overdue job (which has no request
// campus) picks the right one.
const FineSettingSchema = new mongoose.Schema(
  {
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "School", default: null, index: true },
    lateFineAmount: { type: Number, required: true, min: 0, default: 0 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

FineSettingSchema.index({ campusId: 1 }, { unique: true });

export default mongoose.models.FineSetting || mongoose.model("FineSetting", FineSettingSchema);
