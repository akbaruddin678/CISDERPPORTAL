import mongoose from "mongoose";

// Trash/audit trail for the Student Management screen's delete flow —
// same two-tier pattern as backend/src/admissions/model/DeletedStudentRecord.js
// (soft-delete first, permanent-delete later), kept as a SEPARATE model
// (not reused) because Mongoose model names must be unique per connection
// and that one is already registered under the exact name
// "DeletedStudentRecord". A student trashed here is never actually
// removed until this record's status becomes "permanently_deleted" — via
// staff action or the retention-period auto-purge cron.
const StudentTrashRecordSchema = new mongoose.Schema(
  {
    studentProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
      index: true,
    },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["trashed", "restored", "permanently_deleted"],
      default: "trashed",
      index: true,
    },
    trashedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    trashedAt: { type: Date, default: Date.now },
    trashRemark: { type: String, required: true },
    restoredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    restoredAt: { type: Date, default: null },
    permanentlyDeletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    permanentlyDeletedAt: { type: Date, default: null },
    permanentDeleteRemark: { type: String, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("StudentTrashRecord", StudentTrashRecordSchema);
