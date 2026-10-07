import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    province: { type: String, default: "" },
    country: { type: String, default: "Pakistan" },
  },
  { _id: false },
);

const jobApplicationSchema = new mongoose.Schema(
  {
    // Only set for a real Recruitment posting response — a public
    // onboarding submission (see `source` below) isn't tied to a specific
    // posting, so this is intentionally optional, not required.
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPosting",
      index: true,
      default: null,
    },
    applicantName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    // Required for a real Recruitment submission (still enforced in
    // recruitmentController.js's addJobApplication itself); a public
    // onboarding submission carries its documents in `documents[]` below
    // instead, so this stays optional at the schema level.
    resumeUrl: { type: String },
    coverLetter: { type: String },

    // Distinguishes a real Recruitment-posting response (jobId set, the
    // existing flow) from an unsolicited application submitted through the
    // public, unauthenticated /teacher-onboarding page (jobId null, the
    // richer fields below populated). Both flow through the exact same
    // Applied → Hired/Rejected review pipeline.
    source: { type: String, enum: ["recruitment", "public_onboarding"], default: "recruitment" },

    // --- Fields only a public_onboarding submission populates — mirrors
    // useHrOnboardController.js's own initialFormState field names/shapes
    // so approving one is a near 1:1 prefill, not a translation step.
    firstName: { type: String, default: "" },
    middleName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    nationalId: { type: String, default: "" },
    passportNumber: { type: String, default: "" },
    dob: { type: Date, default: null },
    gender: { type: String, enum: ["male", "female", "other", null], default: null },
    bloodGroup: { type: String, default: "" },
    maritalStatus: { type: String, default: "Not Specified" },
    disabilityStatus: {
      hasDisability: { type: Boolean, default: false },
      details: { type: String, default: "" },
    },
    dependents: { type: [mongoose.Schema.Types.Mixed], default: [] },
    currentAddress: { type: AddressSchema, default: () => ({}) },
    permanentAddress: { type: AddressSchema, default: () => ({}) },
    emergencyContacts: { type: [mongoose.Schema.Types.Mixed], default: [] },
    highestDegree: { type: String, default: "" },
    qualifications: { type: [mongoose.Schema.Types.Mixed], default: [] },
    teachingSpecializations: { type: [String], default: [] },
    experienceYears: { type: Number, default: 0 },
    industryExperienceYears: { type: Number, default: 0 },
    researchProfile: {
      orcidId: { type: String, default: "" },
      googleScholarUrl: { type: String, default: "" },
      publicationsCount: { type: Number, default: 0 },
    },
    role: { type: String, default: "teacher" },
    designation: { type: String, default: "" },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null },
    employmentType: { type: String, default: "Full-Time" },
    contractStartDate: { type: Date, default: null },
    contractEndDate: { type: Date, default: null },
    probation: {
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      durationMonths: { type: Number, default: null },
    },
    shift: { type: String, default: "Day Shift" },
    workingDays: { type: [String], default: [] },
    biometricId: { type: String, default: "" },
    profilePhotoUrl: { type: String, default: null },
    documents: {
      type: [{ docType: String, category: String, url: String }],
      default: [],
    },
    rejectionReason: { type: String, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    // Set once HR completes the real onboarding wizard from this
    // application — links it to the resulting live staff account.
    convertedStaffId: { type: mongoose.Schema.Types.ObjectId, ref: "StaffProfile", default: null },

    status: {
      type: String,
      enum: [
        "Applied",
        "Shortlisted",
        "Interview Scheduled",
        "Offered",
        "Hired",
        "Rejected",
      ],
      default: "Applied",
    },
    interviewDate: { type: Date },
    interviewerNotes: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("JobApplication", jobApplicationSchema);
