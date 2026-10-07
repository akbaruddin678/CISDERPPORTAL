import crypto from "crypto";
import mongoose from "mongoose";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import JobApplication from "../../staff/models/JobApplication.js";
import PendingRegistration from "../../user/model/PendingRegistration.js";
import { uploadToR2 } from "../../core/utils/cloudflareR2.js";
import { hashPassword, comparePassword } from "../../core/utils/password.js";
import { sendOnboardingOtpEmail } from "../../core/utils/email.js";

const CNIC_REGEX = /^[0-9]{13}$/;
const PHONE_REGEX = /^[0-9]{11}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENDER_VALUES = ["male", "female", "other"];
const OTP_PURPOSE = "staff_onboarding";

// Converts an empty/invalid id into null instead of letting Mongoose throw
// a raw CastError — same helper manualAdmissionController.js uses.
const sanitizeId = (id) => {
  if (!id) return null;
  return mongoose.isValidObjectId(id) ? id : null;
};

// A blank/whitespace-only number input reaches here as "" — treat it as
// "not provided" (0) rather than letting Mongoose's Number caster choke on
// it, and reject anything genuinely non-numeric with a clear message
// instead of a raw CastError.
const parseNonNegativeNumber = (val, fieldLabel) => {
  if (val === undefined || val === null || val === "") return { value: 0 };
  const num = Number(val);
  if (Number.isNaN(num) || num < 0) {
    return { error: `${fieldLabel} must be a non-negative number.` };
  }
  return { value: num };
};

const parseJson = (val, fallback) => {
  if (val === undefined || val === null || val === "") return fallback;
  if (typeof val !== "string") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
};

// ============================================================================
// SEND / VERIFY OTP — proves the applicant owns the email before their
// onboarding request is accepted. Mirrors userController.js's
// sendRegistrationOtp/verifyRegistrationOtp almost line-for-line (same OTP
// mechanics: 6 digits, bcrypt-hashed, 10-minute expiry, 5-attempt cap,
// 15-minute verifyToken) but tagged purpose:"staff_onboarding" on the same
// PendingRegistration collection, and — unlike registration — this never
// creates a User. The email is only ever used to gate submitOnboardingRequest
// below; no account exists at any point in this flow.
// ============================================================================
export const sendOnboardingOtp = asyncHandler(async (req, res) => {
  const emailNorm = String(req.body.email || "").trim().toLowerCase();
  if (!emailNorm || !EMAIL_REGEX.test(emailNorm)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address." });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = await hashPassword(otp);

  await PendingRegistration.findOneAndUpdate(
    { email: emailNorm, purpose: OTP_PURPOSE },
    {
      email: emailNorm,
      purpose: OTP_PURPOSE,
      otpHash,
      otpExpires: Date.now() + 10 * 60 * 1000,
      otpAttempts: 0,
      verifyToken: undefined,
      verifyTokenExpires: undefined,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const sent = await sendOnboardingOtpEmail(emailNorm, otp);
  if (!sent) {
    return res.status(500).json({ success: false, message: "Failed to send verification code. Please try again." });
  }

  res.status(200).json({ success: true, message: "A 6-digit verification code has been sent to your email." });
});

export const verifyOnboardingOtp = asyncHandler(async (req, res) => {
  const emailNorm = String(req.body.email || "").trim().toLowerCase();
  const { otp } = req.body;
  if (!emailNorm || !otp) {
    return res.status(400).json({ success: false, message: "Email and code are required." });
  }

  const pending = await PendingRegistration.findOne({ email: emailNorm, purpose: OTP_PURPOSE });
  if (!pending || !pending.otpHash || !pending.otpExpires) {
    return res.status(400).json({ success: false, message: "No verification request found. Please start again." });
  }
  if (pending.otpExpires < Date.now()) {
    pending.otpHash = undefined;
    pending.otpExpires = undefined;
    pending.otpAttempts = 0;
    await pending.save();
    return res.status(400).json({ success: false, message: "This code has expired. Please request a new one." });
  }
  if (pending.otpAttempts >= 5) {
    pending.otpHash = undefined;
    pending.otpExpires = undefined;
    pending.otpAttempts = 0;
    await pending.save();
    return res.status(400).json({ success: false, message: "Too many incorrect attempts. Please request a new code." });
  }

  const ok = await comparePassword(String(otp), pending.otpHash);
  if (!ok) {
    pending.otpAttempts += 1;
    await pending.save();
    return res.status(400).json({ success: false, message: "Incorrect code. Please try again." });
  }

  const verifyToken = crypto.randomBytes(32).toString("hex");
  pending.verifyToken = verifyToken;
  pending.verifyTokenExpires = Date.now() + 15 * 60 * 1000;
  pending.otpHash = undefined;
  pending.otpExpires = undefined;
  pending.otpAttempts = 0;
  await pending.save();

  res.status(200).json({ success: true, verifyToken });
});

// ============================================================================
// SUBMIT ONBOARDING REQUEST — public, unauthenticated (/teacher-onboarding).
// Stored as a JobApplication with source:"public_onboarding" and jobId:null
// (reuses the existing Recruitment application collection/pipeline instead
// of a brand-new one — this Atlas project is already at its 500-collection
// cap). Creates a pending (status:"Applied") record only; never touches
// User/StaffProfile directly. Same validation discipline as the Manual
// Admission fix: reject bad data with a clear message at entry time.
// ============================================================================
export const submitOnboardingRequest = asyncHandler(async (req, res) => {
  const b = req.body;
  // departmentId is deliberately optional — Security, Maintenance,
  // Transport, and other support-staff categories don't belong to any
  // academic department, only teaching/administrative roles typically do
  // (matches the internal HR onboarding wizard's own "Not Applicable"
  // department option).
  const phone = String(b.phone || "").trim();
  const nationalId = String(b.nationalId || "").trim();
  const { firstName, email, dob, gender } = b;
  const departmentId = sanitizeId(b.departmentId);

  if (!firstName || !email || !phone || !dob || !gender) {
    return res.status(400).json({
      success: false,
      message: "Full name, email, phone, date of birth, and gender are required.",
    });
  }
  if (!PHONE_REGEX.test(phone)) {
    return res.status(400).json({ success: false, message: "Phone must be exactly 11 digits." });
  }
  if (nationalId && !CNIC_REGEX.test(nationalId)) {
    return res.status(400).json({ success: false, message: "National ID (CNIC) must be exactly 13 digits, no dashes or spaces." });
  }
  if (!GENDER_VALUES.includes(gender)) {
    return res.status(400).json({ success: false, message: "Gender must be male, female, or other." });
  }
  if (Number.isNaN(new Date(dob).getTime())) {
    return res.status(400).json({ success: false, message: "Date of birth is not a valid date." });
  }
  if (b.departmentId && !departmentId) {
    return res.status(400).json({ success: false, message: "Invalid department selected." });
  }
  for (const [field, label] of [
    ["contractStartDate", "Contract start date"],
    ["contractEndDate", "Contract end date"],
  ]) {
    if (b[field] && Number.isNaN(new Date(b[field]).getTime())) {
      return res.status(400).json({ success: false, message: `${label} is not a valid date.` });
    }
  }

  const experienceCheck = parseNonNegativeNumber(b.experienceYears, "Teaching experience (years)");
  if (experienceCheck.error) {
    return res.status(400).json({ success: false, message: experienceCheck.error });
  }
  const industryExperienceCheck = parseNonNegativeNumber(b.industryExperienceYears, "Industry experience (years)");
  if (industryExperienceCheck.error) {
    return res.status(400).json({ success: false, message: industryExperienceCheck.error });
  }

  const emailNorm = String(email).trim().toLowerCase();

  // Must have completed the OTP verification above for this exact email —
  // proves the applicant actually owns it before anything is stored.
  const verified = await PendingRegistration.findOne({
    email: emailNorm,
    purpose: OTP_PURPOSE,
    verifyToken: b.verifyToken,
  });
  if (!b.verifyToken || !verified || verified.verifyTokenExpires < Date.now()) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email before submitting.",
    });
  }

  const alreadyPending = await JobApplication.findOne({
    email: emailNorm,
    source: "public_onboarding",
    status: "Applied",
  });
  if (alreadyPending) {
    return res.status(400).json({
      success: false,
      message: "A request with this email is already pending review. Please wait for HR to respond.",
    });
  }

  let profilePhotoUrl = null;
  const photoFile = req.files?.profilePhoto?.[0];
  if (photoFile) {
    try {
      profilePhotoUrl = await uploadToR2(photoFile, "onboarding-requests/photos");
    } catch {
      profilePhotoUrl = null;
    }
  }

  const documentFiles = req.files?.documents || [];
  const documentsMeta = parseJson(b.documentsMeta, []);
  const documents = [];
  for (let i = 0; i < documentFiles.length; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const url = await uploadToR2(documentFiles[i], "onboarding-requests/documents");
      documents.push({
        docType: documentsMeta[i]?.docType || documentFiles[i].originalname,
        category: documentsMeta[i]?.category || "general",
        url,
      });
    } catch {
      // A single failed document upload shouldn't block the whole submission.
    }
  }

  const lastName = (b.lastName || "").trim();
  const request = await JobApplication.create({
    source: "public_onboarding",
    jobId: null,
    applicantName: `${firstName.trim()} ${lastName}`.trim(),
    firstName: firstName.trim(),
    middleName: (b.middleName || "").trim(),
    lastName,
    nationalId: nationalId || "",
    passportNumber: b.passportNumber || "",
    dob,
    gender,
    bloodGroup: b.bloodGroup || "",
    maritalStatus: b.maritalStatus || "Not Specified",
    disabilityStatus: parseJson(b.disabilityStatus, undefined),
    dependents: parseJson(b.dependents, []),
    email: emailNorm,
    phone,
    currentAddress: parseJson(b.currentAddress, {}),
    permanentAddress: parseJson(b.permanentAddress, {}),
    emergencyContacts: parseJson(b.emergencyContacts, []),
    highestDegree: b.highestDegree || "",
    qualifications: parseJson(b.qualifications, []),
    teachingSpecializations: parseJson(b.teachingSpecializations, []),
    experienceYears: experienceCheck.value,
    industryExperienceYears: industryExperienceCheck.value,
    researchProfile: parseJson(b.researchProfile, undefined),
    role: b.role || "teaching_faculty",
    designation: b.designation || "",
    departmentId,
    employmentType: b.employmentType || "Full-Time",
    contractStartDate: b.contractStartDate || null,
    contractEndDate: b.contractEndDate || null,
    probation: parseJson(b.probation, undefined),
    shift: b.shift || "Day Shift",
    workingDays: parseJson(b.workingDays, []),
    biometricId: b.biometricId || "",
    profilePhotoUrl,
    documents,
    status: "Applied",
  });

  // Consume the verification ticket — a submitted request can't be
  // replayed to submit a second one with the same proof-of-email.
  await PendingRegistration.deleteOne({ _id: verified._id });

  res.status(201).json({
    success: true,
    message: "Your application has been submitted. HR will review it and contact you.",
    data: { requestId: request._id },
  });
});
