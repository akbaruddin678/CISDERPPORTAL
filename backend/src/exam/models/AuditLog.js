import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    entity: { type: String, required: true }, // e.g., "ExamResult", "ReEvaluation"
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    action: { type: String, required: true }, // e.g., "UPDATE_GRADE", "LOCK_RESULT"
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    previousValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Indexes are highly recommended for Audit logs to search by entity or user quickly
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ userId: 1 });

// Audit entries are append-only at the application layer. Corrections create
// a new record; they can never rewrite or erase the evidence that already
// exists. Database-level retention/backup policies should mirror this rule.
[
  "updateOne",
  "updateMany",
  "findOneAndUpdate",
  "replaceOne",
  "deleteOne",
  "deleteMany",
  "findOneAndDelete",
].forEach((operation) => {
  auditLogSchema.pre(operation, function preventAuditMutation(next) {
    next(new Error("Audit logs are append-only and cannot be changed or deleted."));
  });
});

export default mongoose.model("AuditLog", auditLogSchema);
