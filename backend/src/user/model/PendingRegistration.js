import mongoose from "mongoose";

// Holds an in-progress signup between "email submitted" and "account
// created" — no real User exists yet at this point (passwordHash is
// required on User, and we don't have one until the final step), so OTP
// state lives here instead of on a half-created User document. Unique on
// email so re-requesting a code (or restarting after expiry) just
// overwrites this same record via upsert rather than accumulating stale
// rows per address.
const pendingRegistrationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    // Also reused (not just applicant signup) for the public staff
    // onboarding page's "verify you own this email" step — same OTP
    // mechanics, a different purpose, keyed apart so a self-service
    // applicant signup and a staff onboarding request for the same address
    // never clash or overwrite each other's ticket.
    purpose: {
      type: String,
      enum: ["applicant_signup", "staff_onboarding"],
      default: "applicant_signup",
    },
    // OTP is hashed (bcrypt) since it's low-entropy and worth protecting
    // even at rest — same reasoning as User.resetOtpHash.
    otpHash: String,
    otpExpires: Date,
    otpAttempts: { type: Number, default: 0 },
    // Issued once the OTP is verified — gates the final "create account" /
    // "submit onboarding request" step so a captured OTP can't be replayed
    // there directly.
    verifyToken: String,
    verifyTokenExpires: Date,
  },
  { timestamps: true },
);

pendingRegistrationSchema.index({ email: 1, purpose: 1 }, { unique: true });

export default mongoose.models.PendingRegistration ||
  mongoose.model("PendingRegistration", pendingRegistrationSchema);
