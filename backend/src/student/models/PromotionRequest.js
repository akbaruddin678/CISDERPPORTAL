import mongoose from "mongoose";

const PromotionOverrideSchema = new mongoose.Schema(
  {
    // Link to the Student
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    // Link to the Semester they are stuck in/promoting to
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true,
    },

    // --- ACCOUNTS DEPARTMENT SECTION ---
    accounts: {
      isCleared: { type: Boolean, default: false }, // The "Allow" Toggle
      remarks: { type: String, default: "" }, // The "Reason"
      actionBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      actionDate: { type: Date },
    },

    // --- FUTURE: EXAMS DEPARTMENT (Easy to add later) ---
    /* exams: {
      isCleared: { type: Boolean, default: false },
      remarks: String
    }
    */
  },
  { timestamps: true }
);

// ✅ THE FIX: This Index prevents duplicates.
// A student can only have ONE override record per semester.
PromotionOverrideSchema.index(
  { studentId: 1, semesterId: 1 },
  { unique: true }
);

export default mongoose.model("PromotionOverride", PromotionOverrideSchema);
