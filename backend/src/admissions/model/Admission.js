import mongoose from "mongoose";
import { campusScopedPlugin } from "../../core/middleware/campusContext.js";

const EducationDetailSchema = new mongoose.Schema(
  {
    educationProgram: { type: String },
    startDate: { type: Date },
    endDateOrResultAwaited: { type: Date },
    obtainedMarks: { type: Number },
    totalMarks: { type: Number },
    percentage: { type: Number },
    institution: { type: String },
    board: { type: String },
    session: { type: String },
  },
  { _id: false }
);

const AdmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
      unique: true,
    },
    // Track Progress
    currentStep: { type: Number, default: 1 },

    // Personal (Validation relaxed for Drafts)
    fullName: { type: String },
    dob: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    cnic: { type: String },
    phone: { type: String },

    // Address
    currentAddress: String,
    currentDistrict: String,
    currentProvince: String,
    currentCountry: String,
    permanentAddress: String,
    permanentDistrict: String,
    permanentProvince: String,
    permanentCountry: String,

    // Family
    fatherName: String,
    fathernic: String,
    motherName: String,
    motherCnic: String,
    guardianStatus: { type: String },
    guardianPhone: String,
    fathersProfession: String,
    guardianDesignation: String,
    incomeBracket: String,

    // Applied For
    academicDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    applyingForProgram: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
    },
    applyingSession: { type: mongoose.Schema.Types.ObjectId, ref: "Term" },

    // Education
    educationDetails: { type: [EducationDetailSchema], default: [] },

    // Declaration
    agreeDeclaration: { type: Boolean, default: false },

    // Uploads - Storing URLs directly on root or a sub-object
    // To match your frontend logic, we can store them individually or in a map.
    // Here we map them to the specific field names used in frontend.
    profilePhoto: String,
    cnicDoc_front: String,
    cnicDoc_back: String,
    domicileDoc: String,
    matricCertificate: String,
    fscCertificate: String,

    status: {
      type: String,
      enum: ["draft", "submitted", "under_review", "accepted", "rejected"],
      default: "draft",
      index: true,
    },

    // Free-form staff note about this application (e.g. "missing CNIC
    // copy, follow up") — shown and editable on every Admission Process
    // tab. Independent from `trashRemark` below, which is a one-time
    // deletion reason, not a live editable note.
    remark: { type: String, default: "" },

    // Audit trail — distinguishes a walk-in application an admission-office
    // staff member keyed in directly (Manual Admission) from the normal
    // self-service signup + wizard flow.
    entryMethod: { type: String, enum: ["self", "manual"], default: "self" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Soft-delete (Tier 1). While true, this admission is hidden from every
    // active list/query but nothing has actually been removed yet — see
    // admissionTrashController.js. Permanent deletion (Tier 2) is what
    // actually removes the document and frees `userId` for re-registration.
    isTrashed: { type: Boolean, default: false, index: true },
    trashedAt: { type: Date, default: null },
    trashedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    trashRemark: { type: String, default: null },
    restoredAt: { type: Date, default: null },
    restoredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

AdmissionSchema.plugin(campusScopedPlugin);

export default mongoose.model("Admission", AdmissionSchema);
