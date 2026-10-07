import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const studentAuthSchema = new mongoose.Schema(
  {
    // Link directly to the student's academic profile
    studentProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
      unique: true,
    },
    // Login Credentials
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Never return password in queries by default
    },
    // ✅ REPLACED isLocked WITH status TO MATCH THE ADMIN UI
    status: {
      type: String,
      enum: ["ACTIVE", "BLOCKED", "PENDING"],
      default: "BLOCKED", // By default, new accounts are blocked until admin unblocks them
    },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Hash password before saving
studentAuthSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Helper method to compare passwords
studentAuthSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("StudentAuth", studentAuthSchema);
