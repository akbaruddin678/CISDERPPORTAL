// models/StudentScholarship.js
import mongoose from "mongoose";
import { campusScopedPlugin } from "../../core/middleware/campusContext.js";

const StudentScholarshipSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    scholarshipPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScholarshipPlan",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "revoked"],
      default: "pending",
    },

    appliedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    rejectionReason: { type: String, trim: true },

    // "all" (default) applies the same way regardless of which semester is
    // being billed — matches every pre-existing record with no migration.
    // "selective" restricts the deduction to only the semesters listed in
    // semesterIds; enforced in ScholarshipService.getStudentActiveScholarship.
    semesterScope: {
      type: String,
      enum: ["all", "selective"],
      default: "all",
    },
    semesterIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Semester" },
    ],
  },
  { timestamps: true }
);

// Not unique — a student can re-apply to the same plan after a rejection
// or revocation. ScholarshipService.applyForScholarship enforces "only one
// live (pending/approved) application per student+plan" itself, reusing
// the same rejected/revoked document instead of inserting a duplicate.
StudentScholarshipSchema.index({ studentId: 1, scholarshipPlanId: 1 });

StudentScholarshipSchema.index({ studentId: 1 });
StudentScholarshipSchema.index({ status: 1 });

StudentScholarshipSchema.plugin(campusScopedPlugin);
export default mongoose.model("StudentScholarship", StudentScholarshipSchema);
