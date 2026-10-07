import { useEffect, useState } from "react";
import { useGlobalAlert } from "../../shared/Alert/context/AlertContext";
import { useGetDepartmentsQuery } from "../../components/catalog/api/catalogApi";
import {
  useSendOnboardingOtpMutation,
  useVerifyOnboardingOtpMutation,
  useSubmitOnboardingRequestMutation,
} from "../api/publicOnboardingApi";

const CNIC_REGEX = /^[0-9]{13}$/;
const PHONE_REGEX = /^[0-9]{11}$/;
const EMPTY_ADDRESS = { address: "", city: "", province: "" };

// IT Access is temporarily out — no email/IT provisioning notifications are
// wired up yet, will re-enable once that's ready. Just remove "IT Access"
// from this list + STEP_COMPONENTS in TeacherOnboardingView.jsx to bring it
// back later; the step component itself (HrOnboardStep6ItAccess.jsx) is
// untouched and still used by the internal HR wizard.
export const ONBOARD_STEPS = ["Identity", "Contact", "Academic", "Employment", "Documents", "Review"];

const slugify = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

// Mirrors useHrOnboardController.js's initialFormState field-for-field,
// minus everything Payroll (Step 5) — existing employees self-registering
// here shouldn't declare their own salary/bank details; HR sets those
// during review on the real internal wizard.
const initialFormState = {
  firstName: "",
  middleName: "",
  lastName: "",
  nationalId: "",
  passportNumber: "",
  dob: "",
  gender: "male",
  bloodGroup: "",
  maritalStatus: "Not Specified",
  disabilityStatus: { hasDisability: false, details: "" },
  dependents: [],

  email: "",
  phone: "",
  currentAddress: { ...EMPTY_ADDRESS },
  permanentAddress: { ...EMPTY_ADDRESS },
  sameAsCurrent: false,
  emergencyContacts: [],

  highestDegree: "",
  qualifications: [],
  teachingSpecializations: [],
  experienceYears: 0,
  industryExperienceYears: 0,
  researchProfile: { orcidId: "", googleScholarUrl: "", publicationsCount: 0 },

  // "role" stays a purely descriptive Staff Category, never a literal
  // system login role — see the security note in handleSubmit below.
  role: "teaching_faculty",
  designation: "",
  departmentId: "",
  employmentType: "Full-Time",
  dateOfJoining: "",
  contractStartDate: "",
  contractEndDate: "",
  probationDurationMonths: "",
  probationStartDate: "",
  probationEndDate: "",
  shift: "Day Shift",
  workingDays: [],

  biometricId: "",
};

// Drives the public, no-login /teacher-onboarding page — for EXISTING
// university employees self-registering their full profile into the ERP
// (not a job-application form for new hires). Two phases: (1) verify the
// applicant owns their email via a 6-digit OTP (mirrors
// useSignUpStateController.jsx's exact same-page state-machine pattern —
// "email" -> "otp" -> "wizard", not separate routes), then (2) the actual
// 7-step wizard, reusing the exact same step components the internal HR
// wizard uses (Admin/HrDepartment/view/onboard/steps/*) in `publicMode`.
// Submits to a pending JobApplication (source:"public_onboarding") once
// the OTP-issued verifyToken is attached — never creates a live account.
export const useTeacherOnboardingController = () => {
  const { openAlert } = useGlobalAlert();

  // --- OTP gate ---
  const [otpStage, setOtpStage] = useState("email"); // "email" | "otp" | "wizard"
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [sendOnboardingOtp, { isLoading: isSendingOtp }] = useSendOnboardingOtpMutation();
  const [verifyOnboardingOtp, { isLoading: isVerifyingOtp }] = useVerifyOnboardingOtpMutation();

  const submitEmail = async (e) => {
    e.preventDefault();
    try {
      await sendOnboardingOtp(otpEmail.trim().toLowerCase()).unwrap();
      openAlert({ message: "A 6-digit verification code has been sent to your email.", severity: "success" });
      setOtpStage("otp");
    } catch (error) {
      openAlert({ message: error.data?.message || "Failed to send verification code.", severity: "error" });
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    try {
      const result = await verifyOnboardingOtp({ email: otpEmail.trim().toLowerCase(), otp: otpCode }).unwrap();
      setVerifyToken(result.verifyToken);
      setFormData((prev) => ({ ...prev, email: otpEmail.trim().toLowerCase() }));
      openAlert({ message: "Email verified.", severity: "success" });
      setOtpStage("wizard");
    } catch (error) {
      openAlert({ message: error.data?.message || "Invalid or expired code.", severity: "error" });
    }
  };

  const resendOtp = async () => {
    try {
      await sendOnboardingOtp(otpEmail.trim().toLowerCase()).unwrap();
      setOtpCode("");
      openAlert({ message: "A new code has been sent.", severity: "success" });
    } catch (error) {
      openAlert({ message: error.data?.message || "Failed to resend code.", severity: "error" });
    }
  };

  const goBackToEmail = () => setOtpStage("email");

  // --- Wizard (mirrors useHrOnboardController.js's step logic) ---
  const { data: deptsRes } = useGetDepartmentsQuery();
  const departments = Array.isArray(deptsRes?.data) ? deptsRes.data : Array.isArray(deptsRes) ? deptsRes : [];
  // Never fetched — the "Reports To" field that would need this is hidden
  // in publicMode (a public page must not expose the internal staff
  // directory), so this is just a stable empty array for the shared step
  // components' prop signature.
  const allStaff = [];

  const [activeStep, setActiveStepRaw] = useState(0);
  const [formData, setFormData] = useState(initialFormState);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [submitOnboardingRequest] = useSubmitOnboardingRequestMutation();

  const update = (patch) => setFormData((prev) => ({ ...prev, ...patch }));
  const updateNested = (key, patch) => setFormData((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  const addArrayItem = (key, item) => setFormData((prev) => ({ ...prev, [key]: [...prev[key], item] }));
  const removeArrayItem = (key, idx) =>
    setFormData((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) }));
  const updateArrayItem = (key, idx, patch) =>
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].map((item, i) => (i === idx ? { ...item, ...patch } : item)),
    }));
  const toggleArrayValue = (key, value) =>
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value],
    }));

  // Same continuous "same as current" sync fix applied to Manual Admission
  // — copies on every change while checked, not just once at check-time.
  useEffect(() => {
    if (!formData.sameAsCurrent) return;
    setFormData((prev) => {
      if (JSON.stringify(prev.permanentAddress) === JSON.stringify(prev.currentAddress)) return prev;
      return { ...prev, permanentAddress: { ...prev.currentAddress } };
    });
  }, [formData.sameAsCurrent, formData.currentAddress]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const officialEmailPreview = formData.firstName
    ? `${slugify(formData.firstName)}.${slugify(formData.lastName)}@neiedu.online`
    : "";

  const setDateOfJoining = (value) => {
    setFormData((prev) => {
      const next = { ...prev, dateOfJoining: value };
      if (value && !prev.probationStartDate) next.probationStartDate = value;
      return next;
    });
  };
  const setProbationDuration = (months) => {
    setFormData((prev) => {
      const next = { ...prev, probationDurationMonths: months };
      if (months && prev.probationStartDate) {
        const end = new Date(prev.probationStartDate);
        end.setMonth(end.getMonth() + Number(months));
        next.probationEndDate = end.toISOString().split("T")[0];
      }
      return next;
    });
  };

  const stepValidity = [
    !!formData.firstName.trim(),
    !!formData.email.trim() && !!formData.phone.trim(),
    true,
    !!formData.designation.trim(),
    true, // Documents
    true, // Review
  ];
  const canAdvance = stepValidity[activeStep];

  const goNext = () => {
    if (!canAdvance) {
      openAlert({ message: "Please fill in the required fields before continuing.", severity: "warning" });
      return;
    }
    setActiveStepRaw((s) => Math.min(s + 1, ONBOARD_STEPS.length - 1));
  };
  const goBack = () => setActiveStepRaw((s) => Math.max(s - 1, 0));
  const setActiveStep = (i) => {
    if (i <= activeStep || stepValidity.slice(0, i).every(Boolean)) setActiveStepRaw(i);
  };

  const addPendingDocument = (doc) => setPendingDocuments((prev) => [...prev, doc]);
  const removePendingDocument = (idx) => setPendingDocuments((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!stepValidity.every(Boolean)) {
      openAlert({ message: "Some required fields are missing — please review earlier steps.", severity: "warning" });
      return;
    }
    if (formData.nationalId && !CNIC_REGEX.test(formData.nationalId.trim())) {
      openAlert({ message: "National ID (CNIC) must be exactly 13 digits, no dashes or spaces.", severity: "warning" });
      return;
    }
    if (!PHONE_REGEX.test(formData.phone.trim())) {
      openAlert({ message: "Phone must be exactly 11 digits.", severity: "warning" });
      return;
    }

    const f = formData;
    const fd = new FormData();
    fd.append("firstName", f.firstName.trim());
    fd.append("middleName", f.middleName.trim());
    fd.append("lastName", f.lastName.trim());
    fd.append("nationalId", f.nationalId.trim());
    fd.append("passportNumber", f.passportNumber);
    fd.append("dob", f.dob);
    fd.append("gender", f.gender);
    fd.append("bloodGroup", f.bloodGroup);
    fd.append("maritalStatus", f.maritalStatus);
    fd.append("disabilityStatus", JSON.stringify(f.disabilityStatus));
    fd.append("dependents", JSON.stringify(f.dependents));

    fd.append("email", f.email.trim());
    fd.append("phone", f.phone.trim());
    fd.append("currentAddress", JSON.stringify(f.currentAddress));
    fd.append("permanentAddress", JSON.stringify(f.sameAsCurrent ? f.currentAddress : f.permanentAddress));
    fd.append("emergencyContacts", JSON.stringify(f.emergencyContacts));

    fd.append("highestDegree", f.highestDegree);
    fd.append("qualifications", JSON.stringify(f.qualifications));
    fd.append("teachingSpecializations", JSON.stringify(f.teachingSpecializations));
    fd.append("experienceYears", f.experienceYears);
    fd.append("industryExperienceYears", f.industryExperienceYears);
    fd.append("researchProfile", JSON.stringify(f.researchProfile));

    // Wire field is still "role" for backend compatibility — it's stored as
    // a free-form descriptive Staff Category on the JobApplication record,
    // never used as a literal system login role. A public, unauthenticated
    // submitter must never be able to self-declare a privileged role — HR
    // assigns the real one when approving (useHrOnboardController.js).
    fd.append("role", f.role);
    fd.append("designation", f.designation);
    if (f.departmentId) fd.append("departmentId", f.departmentId);
    fd.append("employmentType", f.employmentType);
    if (f.contractStartDate) fd.append("contractStartDate", f.contractStartDate);
    if (f.contractEndDate) fd.append("contractEndDate", f.contractEndDate);
    fd.append(
      "probation",
      JSON.stringify({
        startDate: f.probationStartDate || null,
        endDate: f.probationEndDate || null,
        durationMonths: f.probationDurationMonths || null,
      }),
    );
    fd.append("shift", f.shift);
    fd.append("workingDays", JSON.stringify(f.workingDays));
    fd.append("biometricId", f.biometricId);

    fd.append("verifyToken", verifyToken);

    if (profilePhoto) fd.append("profilePhoto", profilePhoto);
    if (pendingDocuments.length) {
      fd.append(
        "documentsMeta",
        JSON.stringify(pendingDocuments.map((d) => ({ docType: d.docType, category: d.category }))),
      );
      pendingDocuments.forEach((d) => fd.append("documents", d.file));
    }

    setSubmitLoading(true);
    try {
      await submitOnboardingRequest(fd).unwrap();
      setCompleted(true);
    } catch (error) {
      openAlert({ message: error.data?.message || "Failed to submit your application.", severity: "error" });
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetWizard = () => {
    setFormData(initialFormState);
    setProfilePhoto(null);
    setPhotoPreview(null);
    setPendingDocuments([]);
    setActiveStepRaw(0);
    setCompleted(false);
    setOtpStage("email");
    setOtpEmail("");
    setOtpCode("");
    setVerifyToken("");
  };

  return {
    otpStage,
    otpEmail,
    setOtpEmail,
    otpCode,
    setOtpCode,
    submitEmail,
    submitOtp,
    resendOtp,
    goBackToEmail,
    isSendingOtp,
    isVerifyingOtp,

    activeStep,
    setActiveStep,
    goNext,
    goBack,
    canAdvance,
    stepValidity,
    formData,
    update,
    updateNested,
    addArrayItem,
    removeArrayItem,
    updateArrayItem,
    toggleArrayValue,
    departments,
    allStaff,
    photoPreview,
    handleFileChange,
    officialEmailPreview,
    setDateOfJoining,
    setProbationDuration,
    pendingDocuments,
    addPendingDocument,
    removePendingDocument,
    handleSubmit,
    isLoading: submitLoading,
    completed,
    resetWizard,
  };
};
