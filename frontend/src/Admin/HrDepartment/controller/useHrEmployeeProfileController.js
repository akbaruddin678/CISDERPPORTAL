import { useEffect, useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetStaffByIdQuery,
  useUpdateStaffMutation,
  useUpdateStaffProfileDetailsMutation,
  useUpdateStaffContractMutation,
  useGetStaffEmploymentInfoQuery,
  useUpdateStaffEmploymentInfoMutation,
  useUpdateOnboardingChecklistMutation,
  useRegisterBiometricIdMutation,
  useGetAllStaffQuery,
  useUploadStaffDocumentMutation,
  useGetStaffDocumentsQuery,
  useVerifyStaffDocumentMutation,
  useDeleteStaffDocumentMutation,
} from "../api/HrApi";
import { useGetDepartmentsQuery } from "../../../components/catalog/api/catalogApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

const EMPTY_BASIC_INFO = {
  firstName: "",
  lastName: "",
  phone: "",
  dob: "",
  gender: "",
  nationalId: "",
  designation: "",
  departmentId: "",
  experienceYears: 0,
  joiningDate: "",
};

const EMPTY_PROFILE_DETAILS = {
  qualifications: [],
  dependents: [],
  emergencyContacts: [],
  currentAddress: { address: "", city: "", province: "", country: "Pakistan" },
  permanentAddress: { address: "", city: "", province: "", country: "Pakistan" },
  passportNumber: "",
  bloodGroup: "",
  maritalStatus: "Not Specified",
  disabilityStatus: { hasDisability: false, details: "" },
  highestDegree: "",
  teachingSpecializations: [],
  industryExperienceYears: 0,
  researchProfile: { orcidId: "", googleScholarUrl: "", publicationsCount: 0 },
};

const EMPTY_EMPLOYMENT_INFO = {
  salaryGrade: "",
  basicSalary: "",
  bankDetails: { bankName: "", branchCode: "", accountTitle: "", accountNumber: "", iban: "" },
  allowances: { phdAllowance: 0, researchAllowance: 0, housingAllowance: 0, transportAllowance: 0 },
  taxInfo: { ntn: "", taxBracket: "" },
  providentFund: { enrolled: false, employeeContributionPercent: 0, employerContributionPercent: 0 },
  reportingTo: "",
};

const EMPTY_CHECKLIST = {
  idCardIssued: false,
  handbookProvided: false,
  laptopAllocated: false,
  workspaceAssigned: false,
  orientationCompleted: false,
};

const EMPTY_CONTRACT = {
  employmentType: "Full-Time",
  contractStartDate: "",
  contractEndDate: "",
  probation: { startDate: "", endDate: "", durationMonths: "", status: "not_applicable" },
  tenureTrack: { isTenureTrack: false, lastPromotionDate: "", nextReviewDate: "", tenureStatus: "not_applicable" },
  roleAssignments: [],
  shift: "Day Shift",
  workingDays: [],
};

const toDateInput = (d) => (d ? new Date(d).toISOString().split("T")[0] : "");

// Powers the Employee Profile page (Staff Directory → "View Details") —
// fetches the full StaffProfile (Profile Management + Contract & Role
// Tracking fields) and the Document Vault list, and wires the 3 tabs'
// save actions.
export const useHrEmployeeProfileController = (staffId) => {
  const { openAlert } = useGlobalAlert();

  const { data: staffRes, isLoading, isFetching, refetch } = useGetStaffByIdQuery(staffId, {
    skip: !staffId,
  });
  const staff = staffRes?.data || null;

  const { data: docsRes, isLoading: isLoadingDocs } = useGetStaffDocumentsQuery(staffId, {
    skip: !staffId,
  });
  const documents = docsRes?.data || [];

  const { data: deptsRes } = useGetDepartmentsQuery();
  const departments = extractArray(deptsRes);

  // For the Payroll tab's "Reports To" select — excludes this staff member.
  const { data: allStaffRes } = useGetAllStaffQuery();
  const allStaff = extractArray(allStaffRes).filter((s) => s._id !== staffId);

  const [activeTab, setActiveTab] = useState("profile");

  // --- Basic Info (identity + core employment) — reuses the SAME
  // updateStaff endpoint the old Staff Directory "Edit" modal used, so
  // this is now the ONE place that data is editable, instead of two
  // separate surfaces covering overlapping fields.
  const [basicInfoForm, setBasicInfoForm] = useState(EMPTY_BASIC_INFO);
  const [updateStaff, { isLoading: isSavingBasicInfo }] = useUpdateStaffMutation();

  useEffect(() => {
    if (!staff) return;
    const fullName = staff.personalInfo?.name || "";
    const [first, ...rest] = fullName.split(" ");
    setBasicInfoForm({
      firstName: first || "",
      lastName: rest.join(" "),
      phone: staff.phone || staff.personalInfo?.contact?.phone || "",
      dob: toDateInput(staff.personalInfo?.dob),
      gender: staff.personalInfo?.gender || "",
      nationalId: staff.personalInfo?.nationalId || "",
      designation: staff.designation || "",
      departmentId: staff.departmentId?._id || staff.departmentId || "",
      experienceYears: staff.experienceYears || 0,
      joiningDate: toDateInput(staff.joiningDate),
    });
  }, [staff]);

  const saveBasicInfo = async () => {
    try {
      await updateStaff({ staffId, payload: basicInfoForm }).unwrap();
      openAlert({ message: "Basic info updated.", severity: "success" });
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to update basic info.",
        severity: "error",
      });
    }
  };

  // --- Profile tab form state ---
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE_DETAILS);
  const [updateProfileDetails, { isLoading: isSavingProfile }] =
    useUpdateStaffProfileDetailsMutation();

  useEffect(() => {
    if (!staff) return;
    setProfileForm({
      qualifications: staff.qualifications || [],
      dependents: staff.dependents || [],
      emergencyContacts: staff.emergencyContacts || [],
      currentAddress: staff.currentAddress || EMPTY_PROFILE_DETAILS.currentAddress,
      permanentAddress: staff.permanentAddress || EMPTY_PROFILE_DETAILS.permanentAddress,
      passportNumber: staff.passportNumber || "",
      bloodGroup: staff.bloodGroup || "",
      maritalStatus: staff.maritalStatus || "Not Specified",
      disabilityStatus: staff.disabilityStatus || EMPTY_PROFILE_DETAILS.disabilityStatus,
      highestDegree: staff.highestDegree || "",
      teachingSpecializations: staff.teachingSpecializations || [],
      industryExperienceYears: staff.industryExperienceYears || 0,
      researchProfile: staff.researchProfile || EMPTY_PROFILE_DETAILS.researchProfile,
    });
  }, [staff]);

  const saveProfileDetails = async () => {
    try {
      await updateProfileDetails({ staffId, payload: profileForm }).unwrap();
      openAlert({ message: "Profile updated.", severity: "success" });
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to update profile.",
        severity: "error",
      });
    }
  };

  // --- Contract tab form state ---
  const [contractForm, setContractForm] = useState(EMPTY_CONTRACT);
  const [updateContract, { isLoading: isSavingContract }] = useUpdateStaffContractMutation();

  useEffect(() => {
    if (!staff) return;
    setContractForm({
      employmentType: staff.employmentType || "Full-Time",
      contractStartDate: toDateInput(staff.contractStartDate),
      contractEndDate: toDateInput(staff.contractEndDate),
      probation: {
        startDate: toDateInput(staff.probation?.startDate),
        endDate: toDateInput(staff.probation?.endDate),
        durationMonths: staff.probation?.durationMonths || "",
        status: staff.probation?.status || "not_applicable",
      },
      tenureTrack: {
        isTenureTrack: staff.tenureTrack?.isTenureTrack || false,
        lastPromotionDate: toDateInput(staff.tenureTrack?.lastPromotionDate),
        nextReviewDate: toDateInput(staff.tenureTrack?.nextReviewDate),
        tenureStatus: staff.tenureTrack?.tenureStatus || "not_applicable",
      },
      roleAssignments: (staff.roleAssignments || []).map((r) => ({
        ...r,
        startDate: toDateInput(r.startDate),
        endDate: toDateInput(r.endDate),
      })),
      shift: staff.shift || "Day Shift",
      workingDays: staff.workingDays || [],
    });
  }, [staff]);

  const saveContract = async () => {
    try {
      await updateContract({ staffId, payload: contractForm }).unwrap();
      openAlert({ message: "Contract & role details updated.", severity: "success" });
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to update contract details.",
        severity: "error",
      });
    }
  };

  // --- Payroll & Employment Info tab (StaffEmploymentInfo) ---
  const { data: employmentInfoRes, isLoading: isLoadingEmploymentInfo } = useGetStaffEmploymentInfoQuery(staffId, {
    skip: !staffId,
  });
  const [employmentInfoForm, setEmploymentInfoForm] = useState(EMPTY_EMPLOYMENT_INFO);
  const [updateEmploymentInfo, { isLoading: isSavingEmploymentInfo }] = useUpdateStaffEmploymentInfoMutation();

  useEffect(() => {
    const info = employmentInfoRes?.data;
    if (!info) return;
    setEmploymentInfoForm({
      salaryGrade: info.salaryGrade || "",
      basicSalary: info.basicSalary || "",
      bankDetails: { ...EMPTY_EMPLOYMENT_INFO.bankDetails, ...info.bankDetails },
      allowances: { ...EMPTY_EMPLOYMENT_INFO.allowances, ...info.allowances },
      taxInfo: { ...EMPTY_EMPLOYMENT_INFO.taxInfo, ...info.taxInfo },
      providentFund: { ...EMPTY_EMPLOYMENT_INFO.providentFund, ...info.providentFund },
      reportingTo: info.reportingTo?._id || info.reportingTo || "",
    });
  }, [employmentInfoRes]);

  const saveEmploymentInfo = async () => {
    try {
      await updateEmploymentInfo({ staffId, payload: employmentInfoForm }).unwrap();
      openAlert({ message: "Payroll & employment info updated.", severity: "success" });
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to update payroll & employment info.",
        severity: "error",
      });
    }
  };

  // --- Onboarding Checklist tab ---
  const [checklistForm, setChecklistForm] = useState(EMPTY_CHECKLIST);
  const [updateChecklist, { isLoading: isSavingChecklist }] = useUpdateOnboardingChecklistMutation();

  useEffect(() => {
    if (!staff) return;
    setChecklistForm({ ...EMPTY_CHECKLIST, ...staff.onboardingChecklist });
  }, [staff]);

  const saveChecklist = async () => {
    try {
      await updateChecklist({ staffId, payload: checklistForm }).unwrap();
      openAlert({ message: "Onboarding checklist updated.", severity: "success" });
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to update checklist.",
        severity: "error",
      });
    }
  };

  // --- Biometric ID registration (Onboarding Checklist tab) ---
  const [biometricIdInput, setBiometricIdInput] = useState("");
  const [registerBiometricId, { isLoading: isSavingBiometricId }] = useRegisterBiometricIdMutation();

  useEffect(() => {
    if (!staff) return;
    setBiometricIdInput(staff.biometricId || "");
  }, [staff]);

  const saveBiometricId = async () => {
    if (!biometricIdInput.trim()) {
      return openAlert({ message: "Enter a Biometric ID first.", severity: "warning" });
    }
    try {
      await registerBiometricId({ staffId, biometricId: biometricIdInput.trim() }).unwrap();
      openAlert({ message: "Biometric ID registered.", severity: "success" });
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to register Biometric ID.",
        severity: "error",
      });
    }
  };

  // --- Documents tab ---
  const [uploadDoc, { isLoading: isUploadingDoc }] = useUploadStaffDocumentMutation();
  const [verifyDoc] = useVerifyStaffDocumentMutation();
  const [deleteDoc] = useDeleteStaffDocumentMutation();

  const uploadDocument = async ({ file, docType, category, expiryDate }) => {
    if (!file || !docType) {
      openAlert({ message: "A file and document type are required.", severity: "warning" });
      return false;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("docType", docType);
    formData.append("category", category || "Other");
    if (expiryDate) formData.append("expiryDate", expiryDate);

    try {
      await uploadDoc({ staffId, formData }).unwrap();
      openAlert({ message: "Document uploaded.", severity: "success" });
      return true;
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to upload document.",
        severity: "error",
      });
      return false;
    }
  };

  const verifyDocument = async (docId) => {
    try {
      await verifyDoc({ staffId, docId }).unwrap();
      openAlert({ message: "Document verified.", severity: "success" });
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to verify document.",
        severity: "error",
      });
    }
  };

  const deleteDocument = async (docId) => {
    if (!window.confirm("Delete this document permanently?")) return;
    try {
      await deleteDoc({ staffId, docId }).unwrap();
      openAlert({ message: "Document deleted.", severity: "success" });
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to delete document.",
        severity: "error",
      });
    }
  };

  return {
    staff,
    isLoading: isLoading || isFetching,
    refetch,
    departments,

    activeTab,
    setActiveTab,

    basicInfoForm,
    setBasicInfoForm,
    saveBasicInfo,
    isSavingBasicInfo,

    profileForm,
    setProfileForm,
    saveProfileDetails,
    isSavingProfile,

    contractForm,
    setContractForm,
    saveContract,
    isSavingContract,

    employmentInfoForm,
    setEmploymentInfoForm,
    saveEmploymentInfo,
    isSavingEmploymentInfo,
    isLoadingEmploymentInfo,
    allStaff,

    checklistForm,
    setChecklistForm,
    saveChecklist,
    isSavingChecklist,

    biometricIdInput,
    setBiometricIdInput,
    saveBiometricId,
    isSavingBiometricId,

    documents,
    isLoadingDocs,
    uploadDocument,
    isUploadingDoc,
    verifyDocument,
    deleteDocument,
  };
};
