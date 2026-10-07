import mongoose from "mongoose";

// Embedded sub-schemas for the "many" relationships on a profile
// (qualifications, dependents, emergency contacts, role assignments) —
// kept as arrays on StaffProfile rather than separate collections since
// they're always fetched/edited together with the profile as one unit,
// with no independent pagination or access-pattern need.
const qualificationSchema = new mongoose.Schema(
  {
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    yearCompleted: { type: Number },
    specialization: { type: String },
    cgpaOrDivision: { type: String },
    isVerified: { type: Boolean, default: false },
  },
  { _id: true, timestamps: false },
);

const dependentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    relation: { type: String, enum: ["spouse", "child", "other"], required: true },
    dob: { type: Date },
    cnic: { type: String },
    isBeneficiary: { type: Boolean, default: false },
  },
  { _id: true, timestamps: false },
);

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    relation: { type: String },
    phone: { type: String, required: true },
  },
  { _id: true, timestamps: false },
);

const addressSchema = new mongoose.Schema(
  {
    address: String,
    city: String,
    province: String,
    country: { type: String, default: "Pakistan" },
  },
  { _id: false },
);

// Historical log of `currentAddress` changes — auto-appended by the
// controller whenever currentAddress is updated, never directly editable.
const addressHistoryEntrySchema = new mongoose.Schema(
  {
    address: String,
    city: String,
    province: String,
    country: String,
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

// Concurrent role support — a staff member can simultaneously hold more
// than one of these (e.g. "Professor of CS" + "Dean of Engineering").
const roleAssignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    roleType: { type: String, enum: ["academic", "administrative"], required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: "StaffProfile" },
    isPrimary: { type: Boolean, default: false },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ["active", "ended"], default: "active" },
  },
  { _id: true, timestamps: false },
);

const staffProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    employeeId: { type: String, required: true, unique: true, index: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    designation: { type: String, required: true },
    employmentType: {
      type: String,
      enum: [
        "Full-Time",
        "Part-Time",
        "Visiting",
        "Contract",
        "Tenured",
        "Adjunct",
        "Work-Study",
      ],
      default: "Full-Time",
    },
    qualification: { type: String },
    specialization: { type: String },
    experienceYears: { type: Number, default: 0 },
    joiningDate: { type: Date, default: Date.now },
    phone: { type: String }, // Official work phone
    status: {
      type: String,
      enum: ["Active", "On Leave", "Suspended", "Resigned", "Terminated"],
      default: "Active",
    },

    // --- Profile Management ---
    passportNumber: { type: String },
    bloodGroup: { type: String },
    maritalStatus: {
      type: String,
      enum: ["Single", "Married", "Divorced", "Widowed", "Not Specified"],
      default: "Not Specified",
    },
    disabilityStatus: {
      hasDisability: { type: Boolean, default: false },
      details: { type: String },
    },
    qualifications: [qualificationSchema],
    dependents: [dependentSchema],
    emergencyContacts: [emergencyContactSchema],
    currentAddress: addressSchema,
    permanentAddress: addressSchema,
    addressHistory: [addressHistoryEntrySchema],

    // --- Academic & Professional Credentials ---
    highestDegree: {
      type: String,
      enum: ["PhD", "MS/MPhil", "Masters", "Bachelors", "Other"],
    },
    teachingSpecializations: [{ type: String }],
    // `experienceYears` (above) is teaching experience — already wired to
    // the UI as "Years of Experience"; this is the separate industry figure
    // the spec asks for alongside it.
    industryExperienceYears: { type: Number, default: 0 },
    researchProfile: {
      orcidId: { type: String },
      googleScholarUrl: { type: String },
      publicationsCount: { type: Number, default: 0 },
    },

    // --- Contract & Role Tracking ---
    // Only meaningful for time-bound types (Visiting/Adjunct/Contract) —
    // the daily alert cron flags these as they approach contractEndDate.
    contractStartDate: { type: Date },
    contractEndDate: { type: Date },
    contractEndAlertSentAt: { type: Date },
    roleAssignments: [roleAssignmentSchema],
    probation: {
      startDate: { type: Date },
      endDate: { type: Date },
      // Drives the UI's auto-computed end date (start + N months) — purely
      // a convenience default, `endDate` above stays the actual source of
      // truth used by the Contract tab and the alert cron.
      durationMonths: { type: Number, enum: [3, 6, 12] },
      status: {
        type: String,
        enum: ["in_progress", "confirmed", "terminated", "not_applicable"],
        default: "not_applicable",
      },
      reminderSentAt: { type: Date },
    },
    tenureTrack: {
      isTenureTrack: { type: Boolean, default: false },
      lastPromotionDate: { type: Date },
      nextReviewDate: { type: Date },
      tenureStatus: {
        type: String,
        enum: ["not_applicable", "tenure_track", "tenured"],
        default: "not_applicable",
      },
    },

    // --- Shift / Working Pattern ---
    shift: {
      type: String,
      enum: ["Day Shift", "Evening Shift", "Weekend Program"],
      default: "Day Shift",
    },
    workingDays: [{ type: String }],

    // --- System Provisioning ---
    // biometricId is the real join key the attendance-device/kiosk punch
    // endpoint matches incoming punches against — must be unique per staff.
    biometricId: { type: String, unique: true, sparse: true, trim: true },
    officialEmail: { type: String },

    // --- HR Onboarding Checklist (physical/logistical tasks) ---
    onboardingChecklist: {
      idCardIssued: { type: Boolean, default: false },
      handbookProvided: { type: Boolean, default: false },
      laptopAllocated: { type: Boolean, default: false },
      workspaceAssigned: { type: Boolean, default: false },
      orientationCompleted: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ✅ PROPER LINK: This links the Staff Profile directly to the unified Person table
staffProfileSchema.virtual("personalInfo", {
  ref: "Person",
  localField: "userId",
  foreignField: "userId",
  justOne: true,
});

export default mongoose.model("StaffProfile", staffProfileSchema);
