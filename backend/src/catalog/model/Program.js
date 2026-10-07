import mongoose from "mongoose";

const programSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      required: true,
      index: true,
      trim: true,
    }, // e.g., "BSCS", "FSC-PRE-MED"
    name: { type: String, required: true, trim: true },

    // Differentiates College programs (HSSC) from University programs (UG/PG)
    level: {
      type: String,
      enum: ["HSSC", "UG", "MS", "PHD", "DIPLOMA"],
      required: true,
    },

    // College = 2 durationStages (Part 1, Part 2) | ERP = 8 durationStages
    durationStages: { type: Number, required: true },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true },

    // Degree-clearance thresholds. Both optional: the minimum CGPA falls
    // back to 2.0, and the credit requirement falls back to the sum of the
    // program's curriculum credits (unverified/manual when neither exists).
    graduationRequirements: {
      minCGPA: { type: Number, min: 0, max: 4 },
      minCreditHours: { type: Number, min: 0 },
    },
  },
  { timestamps: true },
);

export default mongoose.models.Program ||
  mongoose.model("Program", programSchema);
