import mongoose from "mongoose";

// A global, cross-module record of every data-changing action any user
// performs anywhere in the app (created by the activityLogger middleware,
// see core/middleware/activityLogger.js) — read-only page views are
// intentionally NOT logged here, by design, to keep this a change log
// rather than a page-view tracker.
const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    userEmail: { type: String, index: true },
    userRoles: { type: [String], default: [] },

    method: { type: String, required: true },
    // A short human-readable verb — the last meaningful route segment
    // when it looks like one (e.g. "mark-paid"), otherwise derived from
    // the HTTP method (create/update/delete). See deriveAction().
    action: { type: String, index: true },
    // The route's top-level segment (e.g. "accountant", "exam") — used to
    // group/filter the log by module without needing a fixed enum, since
    // new route prefixes get added to this app fairly often.
    module: { type: String, index: true },
    route: { type: String, required: true },

    statusCode: { type: Number },
    success: { type: Boolean, default: true },
    durationMs: { type: Number },

    ipAddress: { type: String },
    userAgent: { type: String },

    // Sanitized request payload (passwords/tokens redacted) — kept small
    // and capped by the middleware, not meant as a full before/after diff.
    requestBody: { type: mongoose.Schema.Types.Mixed },
    // Best-effort correlation id — a :id route param when present.
    entityId: { type: String },

    reviewed: { type: Boolean, default: false, index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    note: { type: String },
  },
  { timestamps: true },
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ userEmail: "text", route: "text", note: "text" });

export default mongoose.models.ActivityLog ||
  mongoose.model("ActivityLog", activityLogSchema);
