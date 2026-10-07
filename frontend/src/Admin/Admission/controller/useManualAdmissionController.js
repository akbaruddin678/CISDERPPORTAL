import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { useGetCompleteCatalogQuery } from "../../../components/user-admission/api/catalogApi";
import { useCreateManualAdmissionMutation } from "../services/manualAdmissionApi";

const EMPTY_EDUCATION_ROW = {
  educationProgram: "",
  institution: "",
  board: "",
  session: "",
  startDate: "",
  obtainedMarks: "",
  totalMarks: "",
};

const CNIC_REGEX = /^[0-9]{13}$/;
const PHONE_REGEX = /^[0-9]{11}$/;

const initialFormState = {
  // Personal
  fullName: "",
  email: "",
  phone: "",
  cnic: "",
  dob: "",
  gender: "",

  // Address
  currentAddress: "",
  currentDistrict: "",
  currentProvince: "",
  currentCountry: "Pakistan",
  permanentAddress: "",
  permanentDistrict: "",
  permanentProvince: "",
  permanentCountry: "Pakistan",
  sameAsCurrent: false,

  // Family / Guardian
  fatherName: "",
  fathernic: "",
  motherName: "",
  motherCnic: "",
  guardianStatus: "",
  guardianPhone: "",
  fathersProfession: "",
  guardianDesignation: "",
  incomeBracket: "",

  // Applied For
  academicDepartment: "",
  applyingForProgram: "",
  applyingSession: "",

  // Staff note
  remark: "",
};

// Drives the Manual Admission form — an admission-office staff member
// registers a walk-in student directly (skips the self-service OTP/email
// verification signup entirely). Reuses the exact same catalog query the
// public admission wizard uses so department/program/session choices stay
// in sync (frontend/src/components/user-admission/view/PersonalInfoForm.jsx).
export const useManualAdmissionController = () => {
  const { openAlert } = useGlobalAlert();
  const navigate = useNavigate();

  const { data: catalogData } = useGetCompleteCatalogQuery({ excludeLevel: "HSSC" });
  const departments = Array.isArray(catalogData?.data?.departments) ? catalogData.data.departments : [];
  const terms = Array.isArray(catalogData?.data?.terms) ? catalogData.data.terms : [];
  const allPrograms = useMemo(
    () => (Array.isArray(catalogData?.data?.programs) ? catalogData.data.programs : []),
    [catalogData],
  );

  const [formData, setFormData] = useState(initialFormState);
  const [educationDetails, setEducationDetails] = useState([{ ...EMPTY_EDUCATION_ROW }]);
  const [result, setResult] = useState(null); // { admission, tempPassword } once created

  const [createManualAdmission, { isLoading }] = useCreateManualAdmissionMutation();

  const programs = useMemo(() => {
    if (!formData.academicDepartment) return allPrograms;
    return allPrograms.filter(
      (p) => (p.departmentId?._id || p.departmentId) === formData.academicDepartment,
    );
  }, [allPrograms, formData.academicDepartment]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: type === "checkbox" ? checked : value };
      if (name === "academicDepartment") next.applyingForProgram = "";
      return next;
    });
  };

  // Keeps the permanent address mirrored to the current address on every
  // change while "same as current" is checked — not just once at the
  // moment the checkbox is ticked, which previously left the permanent
  // address blank if staff checked the box before filling the current
  // address in (the natural order). Mirrors PersonalInfoForm.jsx's own
  // continuous-sync useEffect.
  useEffect(() => {
    if (!formData.sameAsCurrent) return;
    setFormData((prev) => {
      if (
        prev.permanentAddress === prev.currentAddress &&
        prev.permanentDistrict === prev.currentDistrict &&
        prev.permanentProvince === prev.currentProvince &&
        prev.permanentCountry === prev.currentCountry
      ) {
        return prev;
      }
      return {
        ...prev,
        permanentAddress: prev.currentAddress,
        permanentDistrict: prev.currentDistrict,
        permanentProvince: prev.currentProvince,
        permanentCountry: prev.currentCountry,
      };
    });
  }, [
    formData.sameAsCurrent,
    formData.currentAddress,
    formData.currentDistrict,
    formData.currentProvince,
    formData.currentCountry,
  ]);

  const addEducationRow = () => setEducationDetails((prev) => [...prev, { ...EMPTY_EDUCATION_ROW }]);
  const removeEducationRow = (index) =>
    setEducationDetails((prev) => prev.filter((_, i) => i !== index));
  const updateEducationRow = (index, field, value) =>
    setEducationDetails((prev) => {
      const rows = [...prev];
      rows[index] = { ...rows[index], [field]: value };
      return rows;
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.cnic ||
      !formData.dob ||
      !formData.gender ||
      !formData.fatherName ||
      !formData.guardianStatus ||
      !formData.currentAddress ||
      !formData.currentDistrict ||
      !formData.currentProvince ||
      !formData.academicDepartment ||
      !formData.applyingForProgram ||
      !formData.applyingSession
    ) {
      return openAlert({
        message:
          "Full name, email, phone, CNIC, date of birth, gender, father's name, guardian status, current address, department, program and session are required.",
        severity: "warning",
      });
    }
    if (!CNIC_REGEX.test(formData.cnic)) {
      return openAlert({ message: "CNIC must be exactly 13 digits, no dashes or spaces.", severity: "warning" });
    }
    if (!PHONE_REGEX.test(formData.phone)) {
      return openAlert({ message: "Phone must be exactly 11 digits.", severity: "warning" });
    }
    if (formData.fathernic && formData.cnic === formData.fathernic) {
      return openAlert({ message: "Student CNIC cannot be the same as father's CNIC.", severity: "warning" });
    }
    if (formData.motherCnic && formData.cnic === formData.motherCnic) {
      return openAlert({ message: "Student CNIC cannot be the same as mother's CNIC.", severity: "warning" });
    }
    if (formData.guardianPhone && formData.guardianPhone === formData.phone) {
      return openAlert({ message: "Guardian phone cannot be the same as the student's phone.", severity: "warning" });
    }

    const educationRows = educationDetails.filter(
      (row) => row.educationProgram || row.institution || row.board || row.startDate,
    );
    const incompleteRow = educationRows.find((row) => !row.educationProgram || !row.startDate);
    if (incompleteRow) {
      return openAlert({
        message: "Each education entry needs at least a qualification and a start date.",
        severity: "warning",
      });
    }

    try {
      const response = await createManualAdmission({
        ...formData,
        educationDetails: educationRows,
      }).unwrap();
      setResult(response.data);
      openAlert({ message: "Admission registered and accepted.", severity: "success" });
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to register admission.",
        severity: "error",
      });
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEducationDetails([{ ...EMPTY_EDUCATION_ROW }]);
    setResult(null);
  };

  const goToAdmissionDetail = () => {
    if (result?.admission?._id) {
      navigate(`/admission-office/admission-detail/${result.admission._id}`);
    }
  };

  return {
    formData,
    handleChange,
    departments,
    programs,
    terms,

    educationDetails,
    addEducationRow,
    removeEducationRow,
    updateEducationRow,

    handleSubmit,
    isLoading,
    result,
    resetForm,
    goToAdmissionDetail,
  };
};
