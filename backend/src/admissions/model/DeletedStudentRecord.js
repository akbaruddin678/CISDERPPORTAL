import mongoose from "mongoose";
import { campusScopedPlugin } from "../../core/middleware/campusContext.js";

const deletedStudentRecordSchema = new mongoose.Schema(
  {
    admissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admission",
      required: true,
    },
    studentProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      default: null,
    },
    // Full point-in-time snapshot of everything belonging to this
    // student/applicant — the permanent audit trail and the "record for
    // restore" the record is built from. Never deleted, even after the
    // live documents are permanently removed.
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },

    status: {
      type: String,
      enum: ["trashed", "restored", "permanently_deleted"],
      default: "trashed",
      index: true,
    },

    trashedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    trashedAt: { type: Date, default: Date.now },
    trashRemark: { type: String, default: "" },

    restoredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    restoredAt: { type: Date, default: null },

    permanentlyDeletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    permanentlyDeletedAt: { type: Date, default: null },
    permanentDeleteRemark: { type: String, default: null },
  },
  { timestamps: true },
);

deletedStudentRecordSchema.plugin(campusScopedPlugin);
export default mongoose.model("DeletedStudentRecord", deletedStudentRecordSchema);
