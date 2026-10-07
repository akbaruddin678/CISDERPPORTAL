import mongoose from "mongoose";
import { campusScopedPlugin } from "../../core/middleware/campusContext.js";

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      index: true,
      sparse: true,
    },
    externalId: { type: String, sparse: true },
    studentId: { type: String, unique: true, index: true },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: "Program" },
    termId: { type: mongoose.Schema.Types.ObjectId, ref: "Term" },
    // Set once, when the StudentProfile is first created, and NEVER
    // overwritten by semester promotion (unlike `termId`, which
    // bulkSemesterPromotion overwrites every promotion cycle). This is the
    // student's "batch" — the academic-lifecycle engine and (later) per-batch
    // Program Regulations key off this, not off the ever-changing `termId`.
    // Nullable only for legacy rows until the one-off backfill script runs
    // (backend/scripts/2026-09-backfill-admission-term-id.mjs).
    admissionTermId: { type: mongoose.Schema.Types.ObjectId, ref: "Term", index: true, immutable: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: "Semester" },

    status: {
      type: String,
      enum: [
        "active",
        "deferred",
        "suspended",
        "graduated",
        "withdrawn",
        "approved",
        // --- Academic lifecycle (degree audit / graduation clearance) ---
        "academically_completed", // passed the degree audit; off active rosters, clearance not yet started
        "clearance_in_progress",  // a GraduationClearance is currently open for this student
        "cleared",                // Finance has signed off; awaiting Registrar's final degree issuance
        // Exceeded their Program Regulation's maxDurationSemesters (time-bar)
        // — set automatically by the Degree Audit, never by a promotion.
        "struck_off_time_barred",
      ],
      default: "active",
      index: true,
    },

    // ✅ ADDED HERE: Permanent record of the initial admission remark
    remark: {
      type: String,
      default: "",
    },

    // ✅ ADDED HERE: Permanent history of all promotions/proofs (Starting with Admission)
    promotionRemarks: [
      {
        remark: String,
        proofDoc: String,
        date: Date,
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: String,
      },
    ],

    createdFromApplicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
    },
    promotionDate: { type: Date },
    promotedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Accountant's "new admission reviewed" flag — shown as the Status
    // column (Mark as Completed/Pending) on the accountant's admissions list.
    admissionReviewCompleted: { type: Boolean, default: false },
    admissionReviewCompletedAt: { type: Date, default: null },
    admissionReviewCompletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Independent from `status` (which tracks academic standing). This
    // tracks the post-promotion admission/payment lifecycle: an "active"
    // admission is auto-flipped to "cancelled_non_payment" by the nightly
    // cron when the student's admission-fee challan goes overdue unpaid
    // (see StudentChallanService.autoCancelAdmissionsForOverdueChallans).
    // The record itself is NEVER deleted — "re_admitted" is a manual staff
    // action reactivating the same record after a cancellation.
    admissionLifecycleStatus: {
      type: String,
      enum: ["active", "cancelled_non_payment", "re_admitted"],
      default: "active",
      index: true,
    },
    cancelledAt: { type: Date, default: null },
    cancelledReason: { type: String, default: null },
    reAdmittedAt: { type: Date, default: null },
    reAdmittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Gates visibility in every OTHER module (Registrar Directory, HOD,
    // Teacher, etc.) for students who arrived through the Admission
    // Process: a brand-new admission starts with feeActivated: false and
    // is invisible everywhere except the Admission/Accountant "New
    // Admissions" screens (which need to see unpaid students by design)
    // until their first challan is ever paid — flipped permanently true by
    // StudentChallan's post-save hook and never reset back to false.
    // Defaults to true so any student created outside this flow (manual
    // registration, legacy records) is unaffected.
    feeActivated: { type: Boolean, default: true, index: true },
    feeActivatedAt: { type: Date, default: null },

    // Soft-delete (Tier 1) — denormalized copy of the same flag set on the
    // originating Admission, so every existing StudentProfile.find(...)
    // query can exclude trashed students with one extra filter key. See
    // admissionTrashController.js.
    isTrashed: { type: Boolean, default: false, index: true },
    trashedAt: { type: Date, default: null },
    trashedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Unified audit trail of every `status` transition, whichever subsystem
    // caused it (degree audit, graduation clearance, future probation/
    // freeze). Distinct from GraduationClearance.history, which records
    // actions INSIDE a clearance document, not the student record's own
    // status changes.
    lifecycleHistory: [
      {
        at: { type: Date, default: Date.now },
        from: { type: String },
        to: { type: String, required: true },
        reason: { type: String, default: "" },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        byName: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

studentProfileSchema.virtual("personalInfo", {
  ref: "PersonalInfo",
  localField: "_id",
  foreignField: "studentId",
  justOne: true,
});

// Pushes one lifecycleHistory entry and sets `status`, in one place, so
// every caller (degree audit, graduation clearance, future probation/
// freeze) writes the exact same shape. Mutates the in-memory document only
// — the caller still calls `.save()` (or saves as part of a transaction).
export function transitionStatus(student, to, { reason = "", by = null, byName = "" } = {}) {
  const from = student.status;
  student.status = to;
  student.lifecycleHistory.push({ at: new Date(), from, to, reason, by, byName });
  return student;
}

studentProfileSchema.plugin(campusScopedPlugin);
const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);
export default StudentProfile;
