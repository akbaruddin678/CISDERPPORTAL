import mongoose from "mongoose";

// One row per issued login token (main staff/admin auth only — the
// separate student LMS portal has its own independent auth and is not
// tracked here). `jti` is the unique id embedded in that token's JWT
// payload at login, so `protect` can look a request's token up here on
// every authenticated request and reject it the instant the session is
// revoked — password change, admin force-logout, or self-service logout —
// even though the JWT itself is still cryptographically valid until it
// naturally expires.
const userSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jti: { type: String, required: true, unique: true, index: true },

    ipAddress: { type: String },
    userAgent: { type: String },

    loginAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },

    isActive: { type: Boolean, default: true, index: true },
    revokedAt: { type: Date },
    revokedReason: {
      type: String,
      enum: ["logout", "password_changed", "admin_revoked", null],
      default: null,
    },

    // Mirrors the JWT's own `exp` claim — a TTL index cleans the row up
    // automatically once the token itself would have expired anyway, so
    // this collection doesn't grow forever with dead sessions.
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

userSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.UserSession ||
  mongoose.model("UserSession", userSessionSchema);
