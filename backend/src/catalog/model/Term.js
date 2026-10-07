import mongoose from "mongoose";

const termSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, 
    code: { type: String, unique: true, required: true, index: true }, 

    // Supports both systems in one database
    termType: {
      type: String,
      enum: ["semester", "annual", "short"],
      default: "semester",
    },

    isActive: { type: Boolean, default: true },

   
    startDate: { type: Date },
    endDate: { type: Date },
    applicationOpenAt: { type: Date },
    applicationCloseAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.models.Term || mongoose.model("Term", termSchema);
