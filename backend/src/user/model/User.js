import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, index: true, required: true },
    phone: { type: String },
    passwordHash: { type: String, required: true },
    roles: {
      type: [String],
      enum: [
        "applicant",
        "student",
        "staff",
        "admin",
        "accountant",
        "headofaccount",
        "teacher",
        "admission",
        "hr",
        "manager",
        "hod", // Replaced 'head'
        "head_of_academia", // Added
        "vc", // Added
        "vice_vc", // Added
        "exam", // Added
        "viwer",
        "registrar",
        "course coordinator",
        "transport",
        // Degree-clearance desks (see graduation/): one login role per
        // auxiliary office, plus a generic officer role for offices an admin
        // adds later and assigns people to.
        "library",
        "hostel",
        "it_labs",
        "clearance_officer",
      ],
      default: ["applicant"],
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "disabled", "pending_verification"],
      default: "pending_verification",
    },
    emailVerified: { type: Boolean, default: false },
    verificationToken: String,
    verificationExpires: Date,
    // --- Forgot Password (OTP-based, applicant accounts only — enforced
    // in the controller since every role shares this one User model) ---
    // OTP is hashed (bcrypt) since it's low-entropy and worth protecting
    // even at rest; the follow-up reset token is high-entropy so it's kept
    // plain, matching how `verificationToken` above is already handled.
    resetOtpHash: String,
    resetOtpExpires: Date,
    resetOtpAttempts: { type: Number, default: 0 },
    resetToken: String,
    resetTokenExpires: Date,
    lastLoginAt: Date,
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "School", default: null, index: true },
    // Accountant / Admission logins that can see every campus instead of one.
    allCampuses: { type: Boolean, default: false },
    // Stamped whenever the password changes (self-service or admin reset) —
    // paired with UserSession revocation at that same moment so every
    // session the user had open is force-logged-out, not just recorded.
    passwordChangedAt: Date,
  },
  { timestamps: true },
);

export default mongoose.models.User || mongoose.model("User", userSchema);
