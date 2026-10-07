import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { useGetDepartmentsQuery } from "../../../components/catalog/api/catalogApi";
import { useCreateStaffMutation, useGetAllStaffQuery } from "../api/HrApi.js";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

export const ONBOARD_STEPS = [
  "Identity",
  "Contact",
  "Academic",
  "Employment",
  "Payroll",
  "IT Access",
  "Documents",
  "Review",
];

const EMPTY_ADDRESS = { address: "", city: "", province: "", country: "Pakistan" };

const initialFormState = {
  // Step 1 — Personal Identity & Demographics
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

  // Step 2 — Contact & Emergency Information
  email: "",
  phone: "",
  currentAddress: { ...EMPTY_ADDRESS },
  permanentAddress: { ...EMPTY_ADDRESS },
  sameAsCurrent: false,
  emergencyContacts: [],

  // Step 3 — Academic & Professional Credentials
  highestDegree: "",
  qualifications: [],
  teachingSpecializations: [],
  experienceYears: 0,
  industryExperienceYears: 0,
  researchProfile: { orcidId: "", googleScholarUrl: "", publicationsCount: 0 },

  // Step 4 — Employment & Contract Details
  role: "teacher",
  designation: "",
  departmentId: "",
  employmentType: "Full-Time",
  reportingTo: "",
  dateOfJoining: "",
  contractStartDate: "",
  contractEndDate: "",
  probationDurationMonths: "",
  probationStartDate: "",
  probationEndDate: "",
  shift: "Day Shift",
  workingDays: [],

  // Step 5 — Payroll & Financial Integration
  salaryGrade: "",
  basicSalary: "",
  phdAllowance: 0,
  researchAllowance: 0,
  housingAllowance: 0,
  transportAllowance: 0,
  bankName: "",
  branchCode: "",
  accountTitle: "",
  accountNumber: "",
  iban: "",
  ntn: "",
  taxBracket: "",
  pfEnrolled: false,
  pfEmployeePercent: 0,
  pfEmployerPercent: 0,

  // Step 6 — System Provisioning & IT Access
  biometricId: "",

  // Step 8 — HR Onboarding Checklist (optional pre-ticking at submit time)
  onboardingChecklist: {
    idCardIssued: false,
    handbookProvided: false,
    laptopAllocated: false,
    workspaceAssigned: false,
    orientationCompleted: false,
  },
};

const slugify = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

// Drives the 8-step "New Employee Onboarding Wizard" — collects the full
// spec's Steps 1-8 into one form state and submits everything in a single
// multipart request on the Review step (matches the spec's own framing:
// "Once HR clicks Complete Onboarding, the portal should automatically...").
export const useHrOnboardController = () => {
  const { openAlert } = useGlobalAlert();
  const navigate = useNavigate();
  const location = useLocation();
  const [createStaff, { isLoading }] = useCreateStaffMutation();
  const { data: deptsRes } = useGetDepartmentsQuery();
  const departments = extractArray(deptsRes);
  const { data: staffRes } = useGetAllStaffQuery();
  const allStaff = extractArray(staffRes);

  const [activeStep, setActiveStepRaw] = useState(0);
  const [formData, setFormData] = useState(initialFormState);

  // Two things can jump straight here with prefilled details instead of HR
  // re-typing everything: a hired job applicant (Recruitment module — the
  // narrow {applicantName,email,phone} shape), or an approved application
  // from the public /teacher-onboarding page (a JobApplication with
  // source:"public_onboarding", field names matching this wizard's own
  // initialFormState almost 1:1 — see JobApplication.js). Both are stored
  // in the same collection and both carry `applicantName`, so which one
  // this is can't be told from field shape alone — `sourceOnboardingRequestId`
  // being present is the actual, unambiguous signal (only set by the
  // Onboarding Requests review page's Approve action).
  const [sourceOnboardingRequestId, setSourceOnboardingRequestId] = useState(null);
  useEffect(() => {
    const prefill = location.state?.prefillFromApplication;
    if (!prefill) return;

    const isOnboardingRequest = Boolean(location.state?.sourceOnboardingRequestId);
    if (isOnboardingRequest) {
      setSourceOnboardingRequestId(location.state.sourceOnboardingRequestId);
    }

    // Recruitment applicant — narrow shape, name comes as one string.
    if (!isOnboardingRequest) {
      const [firstName, ...rest] = (prefill.applicantName || "").trim().split(/\s+/);
      setFormData((prev) => ({
        ...prev,
        firstName: firstName || prev.firstName,
        lastName: rest.join(" ") || prev.lastName,
        email: prefill.email || prev.email,
        phone: prefill.phone || prev.phone,
      }));
      return;
    }

    // Approved public onboarding request — richer shape, map every field
    // this wizard actually collects except Payroll (the public wizard never
    // asked for it) and Reports To / Onboarding Checklist (HR-only, set
    // here instead — see HrOnboardStep4Employment.jsx / Step8Review.jsx).
    setFormData((prev) => ({
      ...prev,
      firstName: prefill.firstName || prev.firstName,
      middleName: prefill.middleName || prev.middleName,
      lastName: prefill.lastName || prev.lastName,
      nationalId: prefill.nationalId || prev.nationalId,
      passportNumber: prefill.passportNumber || prev.passportNumber,
      dob: prefill.dob ? String(prefill.dob).slice(0, 10) : prev.dob,
      gender: prefill.gender || prev.gender,
      bloodGroup: prefill.bloodGroup || prev.bloodGroup,
      maritalStatus: prefill.maritalStatus || prev.maritalStatus,
      disabilityStatus: prefill.disabilityStatus || prev.disabilityStatus,
      dependents: prefill.dependents?.length ? prefill.dependents : prev.dependents,
      email: prefill.email || prev.email,
      phone: prefill.phone || prev.phone,
      currentAddress: prefill.currentAddress || prev.currentAddress,
      permanentAddress: prefill.permanentAddress || prev.permanentAddress,
      emergencyContacts: prefill.emergencyContacts?.length ? prefill.emergencyContacts : prev.emergencyContacts,
      highestDegree: prefill.highestDegree || prev.highestDegree,
      qualifications: prefill.qualifications?.length ? prefill.qualifications : prev.qualifications,
      teachingSpecializations: prefill.teachingSpecializations?.length
        ? prefill.teachingSpecializations
        : prev.teachingSpecializations,
      // Nullish coalescing, not `||` — a genuine 0 years of experience is a
      // valid, meaningful value and must not be discarded in favor of the
      // wizard's own default.
      experienceYears: prefill.experienceYears ?? prev.experienceYears,
      industryExperienceYears: prefill.industryExperienceYears ?? prev.industryExperienceYears,
      researchProfile: prefill.researchProfile || prev.researchProfile,
      contractStartDate: prefill.contractStartDate ? String(prefill.contractStartDate).slice(0, 10) : prev.contractStartDate,
      contractEndDate: prefill.contractEndDate ? String(prefill.contractEndDate).slice(0, 10) : prev.contractEndDate,
      probationDurationMonths: prefill.probation?.durationMonths ?? prev.probationDurationMonths,
      probationStartDate: prefill.probation?.startDate
        ? String(prefill.probation.startDate).slice(0, 10)
        : prev.probationStartDate,
      probationEndDate: prefill.probation?.endDate
        ? String(prefill.probation.endDate).slice(0, 10)
        : prev.probationEndDate,
      shift: prefill.shift || prev.shift,
      workingDays: prefill.workingDays?.length ? prefill.workingDays : prev.workingDays,
      biometricId: prefill.biometricId || prev.biometricId,
      // `prefill.role` here is the applicant's own self-selected, purely
      // descriptive "Staff Category" from the public form (e.g. "security",
      // "maintenance") — NOT a system permission level, and it must never be
      // copied directly into the actual login role. A public, unauthenticated
      // submitter can never be allowed to self-declare a privileged role like
      // HR/Registrar/Accountant/HOD, so this only ever maps to the two
      // non-privileged roles, and HR can still change it here before submit.
      role: prefill.role === "teaching_faculty" ? "teacher" : "staff",
      designation: prefill.designation || prev.designation,
      departmentId: prefill.departmentId?._id || prefill.departmentId || prev.departmentId,
      employmentType: prefill.employmentType || prev.employmentType,
    }));
  }, [location.state]);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [pendingDocuments, setPendingDocuments] = useState([]); // {file, docType, category, expiryDate}
  const [completed, setCompleted] = useState(null); // { staffId } once submitted

  const update = (patch) => setFormData((prev) => ({ ...prev, ...patch }));
  const updateNested = (key, patch) =>
    setFormData((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const addArrayItem = (key, item) =>
    setFormData((prev) => ({ ...prev, [key]: [...prev[key], item] }));
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
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));

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

  // Auto-computes probation end date from start + N months — same
  // auto-suggest UX as the existing +90-day default, generalized to the
  // spec's 3/6/12-month dropdown.
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
    !!formData.designation.trim() && !!formData.dateOfJoining,
    true,
    true,
    true,
    true,
  ];

  const canAdvance = stepValidity[activeStep];

  const goNext = () => {
    if (!canAdvance) {
      openAlert({
        message: "Please fill in the required fields before continuing.",
        severity: "warning",
      });
      return;
    }
    setActiveStepRaw((s) => Math.min(s + 1, ONBOARD_STEPS.length - 1));
  };
  const goBack = () => setActiveStepRaw((s) => Math.max(s - 1, 0));

  // Stepper tabs can only jump to an already-reachable step (every step
  // strictly before it already valid) — prevents skipping ahead of
  // required fields via the step labels themselves.
  const setActiveStep = (i) => {
    if (i <= activeStep || stepValidity.slice(0, i).every(Boolean)) setActiveStepRaw(i);
  };

  const addPendingDocument = (doc) => setPendingDocuments((prev) => [...prev, doc]);
  const removePendingDocument = (idx) =>
    setPendingDocuments((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!stepValidity.every(Boolean)) {
      openAlert({
        message: "Some required fields are missing — please review earlier steps.",
        severity: "warning",
      });
      return;
    }

    const f = formData;
    const fd = new FormData();

    fd.append("firstName", f.firstName);
    // Backend only models firstName/lastName — middle name is folded into
    // the surname portion so it still shows up in the person's full name.
    fd.append("lastName", [f.middleName, f.lastName].filter(Boolean).join(" "));
    fd.append("email", f.email);
    fd.append("phone", f.phone);
    fd.append("nationalId", f.nationalId);
    fd.append("passportNumber", f.passportNumber);
    fd.append("dob", f.dob);
    fd.append("gender", f.gender);
    fd.append("bloodGroup", f.bloodGroup);
    fd.append("maritalStatus", f.maritalStatus);
    fd.append("disabilityStatus", JSON.stringify(f.disabilityStatus));
    fd.append("dependents", JSON.stringify(f.dependents));

    fd.append("currentAddress", JSON.stringify(f.currentAddress));
    fd.append(
      "permanentAddress",
      JSON.stringify(f.sameAsCurrent ? f.currentAddress : f.permanentAddress),
    );
    fd.append("emergencyContacts", JSON.stringify(f.emergencyContacts));
    fd.append("address", f.currentAddress.address);
    fd.append("city", f.currentAddress.city);

    fd.append("highestDegree", f.highestDegree);
    fd.append("qualifications", JSON.stringify(f.qualifications));
    fd.append("teachingSpecializations", JSON.stringify(f.teachingSpecializations));
    fd.append("experienceYears", f.experienceYears);
    fd.append("industryExperienceYears", f.industryExperienceYears);
    fd.append("researchProfile", JSON.stringify(f.researchProfile));

    fd.append("primaryRole", f.role);
    fd.append("designation", f.designation);
    fd.append("departmentId", f.departmentId);
    fd.append("employmentType", f.employmentType);
    fd.append("reportingTo", f.reportingTo);
    fd.append("joiningDate", f.dateOfJoining);
    if (["Visiting", "Adjunct", "Contract"].includes(f.employmentType)) {
      fd.append("contractStartDate", f.contractStartDate);
      fd.append("contractEndDate", f.contractEndDate);
    }
    fd.append("probationStartDate", f.probationStartDate);
    fd.append("probationEndDate", f.probationEndDate);
    if (f.probationDurationMonths) fd.append("probationDurationMonths", f.probationDurationMonths);
    fd.append("shift", f.shift);
    fd.append("workingDays", JSON.stringify(f.workingDays));

    // StaffEmploymentInfo is only created server-side when a basic salary
    // is actually provided (it's a required field on that model) — Payroll
    // is the one fully-optional step in the wizard.
    if (f.basicSalary) {
      fd.append("salaryGrade", f.salaryGrade);
      fd.append("basicSalary", f.basicSalary);
      fd.append("phdAllowance", f.phdAllowance);
      fd.append("researchAllowance", f.researchAllowance);
      fd.append("housingAllowance", f.housingAllowance);
      fd.append("transportAllowance", f.transportAllowance);
      fd.append("bankName", f.bankName);
      fd.append("branchCode", f.branchCode);
      fd.append("accountTitle", f.accountTitle);
      fd.append("accountNumber", f.accountNumber);
      fd.append("iban", f.iban);
      fd.append("ntn", f.ntn);
      fd.append("taxBracket", f.taxBracket);
      fd.append("pfEnrolled", f.pfEnrolled);
      fd.append("pfEmployeePercent", f.pfEmployeePercent);
      fd.append("pfEmployerPercent", f.pfEmployerPercent);
    }

    fd.append("biometricId", f.biometricId);

    if (sourceOnboardingRequestId) fd.append("sourceOnboardingRequestId", sourceOnboardingRequestId);

    if (profilePhoto) fd.append("profilePhoto", profilePhoto);

    if (pendingDocuments.length) {
      const meta = pendingDocuments.map((d) => ({
        docType: d.docType,
        category: d.category,
        expiryDate: d.expiryDate || null,
      }));
      fd.append("documentsMeta", JSON.stringify(meta));
      pendingDocuments.forEach((d) => fd.append("documents", d.file));
    }

    try {
      const response = await createStaff(fd).unwrap();
      openAlert({
        message: response.message || "Employee onboarded successfully!",
        severity: "success",
      });
      setCompleted({ staffId: response.data?.staffId });
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to onboard employee.",
        severity: "error",
      });
    }
  };

  const resetWizard = () => {
    setFormData(initialFormState);
    setProfilePhoto(null);
    setPhotoPreview(null);
    setPendingDocuments([]);
    setActiveStepRaw(0);
    setCompleted(null);
  };

  const goToNewProfile = () => {
    if (completed?.staffId) navigate(`/hr/employee/${completed.staffId}`);
  };

  return {
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
    isLoading,
    completed,
    resetWizard,
    goToNewProfile,
  };
};
