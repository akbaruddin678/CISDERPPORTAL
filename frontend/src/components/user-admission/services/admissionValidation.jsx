import * as yup from "yup";

const MAX_FILE_SIZE = 500 * 1024; // 500KB
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const SUPPORTED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

const getFile = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value; // URL is valid
  if (value instanceof File) return value;
  if (value instanceof FileList && value.length > 0) return value[0];
  if (Array.isArray(value) && value.length > 0) return value[0];
  return null;
};

const requiredFile = (fieldName) =>
  yup
    .mixed()
    .test("required", `${fieldName} is required`, (value) => !!getFile(value));

const optionalFile = () => yup.mixed().nullable();

// EXPORT 1: Document Schema
export const getDocumentSchema = (educationDetails = []) => {
  const hasMatric = educationDetails.some((e) => e.educationProgram === "SSC");
  const hasInter = educationDetails.some((e) => e.educationProgram === "HSSC");

  return yup.object().shape({
    profilePhoto: requiredFile("Profile photograph"),
    cnicDoc_front: requiredFile("CNIC (Front)"),
    cnicDoc_back: requiredFile("CNIC (Back)"),
    domicileDoc: optionalFile(),
    matricCertificate: hasMatric
      ? requiredFile("Matric Certificate")
      : optionalFile(),
    fscCertificate: hasInter
      ? requiredFile("Inter Certificate")
      : optionalFile(),
  });
};

// EXPORT 2: Personal Info Schema
export const personalInfoSchema = yup.object().shape({
  fullName: yup.string().required("Full name is required"),
  fatherName: yup.string().required("Father name is required"),

  // --- PHONE VALIDATION ---
  phone: yup
    .string()
    .matches(/^[0-9]{11}$/, "Phone number must be 11 digits")
    .required("Phone number is required"),

  guardianPhone: yup
    .string()
    .matches(/^[0-9]{11}$/, "Invalid Phone")
    .required("Guardian phone is required")
    .notOneOf(
      [yup.ref("phone")],
      "Guardian phone cannot be same as Student phone"
    ), // <--- ADDED

  dob: yup.mixed().required("Date of Birth is required"),

  // --- CNIC VALIDATION ---
  cnic: yup
    .string()
    .matches(/^[0-9]{13}$/, "CNIC must be 13 digits")
    .required("CNIC is required")
    .notOneOf(
      [yup.ref("fatherCnic"), yup.ref("motherCnic")],
      "Student CNIC cannot match Parents' CNIC"
    ), // <--- ADDED

  fatherCnic: yup
    .string()
    .matches(/^[0-9]{13}$/, "Invalid CNIC")
    .required("Father CNIC is required")
    .notOneOf(
      [yup.ref("cnic"), yup.ref("motherCnic")],
      "Father CNIC cannot match Student or Mother"
    ), // <--- ADDED

  motherCnic: yup
    .string()
    .matches(/^[0-9]{13}$/, "Invalid CNIC")
    .required("Mother's CNIC is required")
    .notOneOf(
      [yup.ref("cnic"), yup.ref("fatherCnic")],
      "Mother CNIC cannot match Student or Father"
    ), // <--- ADDED

  motherName: yup.string().required("Mother's name is required"),

  gender: yup.string().required("Gender is required"),

  // Addresses
  currentAddress: yup.string().required("Current Address is required"),
  currentDistrict: yup.string().required("Current District is required"),
  currentProvince: yup.string().required("Current Province is required"),
  currentCountry: yup.string().required("Current Country is required"),
  permanentAddress: yup.string().required("Permanent Address is required"),
  permanentDistrict: yup.string().required("Permanent District is required"),
  permanentProvince: yup.string().required("Permanent Province is required"),
  permanentCountry: yup.string().required("Permanent Country is required"),

  // Family & Other
  fatherStatus: yup.string().required("Father's Status is required"),
  fathersProfession: yup.string().required("Profession is required"),
  guardianDesignation: yup.string().required("Designation is required"),
  familyIncome: yup.string().required("Income is required"),
  applyingForDepartment: yup.string().required("Department is required"),
  applyingForProgram: yup.string().required("Program is required"),
  applyingSession: yup.string().required("Session is required"),
});

// EXPORT 3: Education Schema
export const educationSchema = yup.object().shape({
  educationDetails: yup.array().of(
    yup.object().shape({
      educationProgram: yup.string().required("Program is required"),
      startDate: yup.mixed().required("Start Date is required"),
      obtainedMarks: yup.number().required("Obtained marks required"),
      totalMarks: yup.number().required("Total marks required"),
      percentage: yup.number().required("Percentage required"),
      institution: yup.string().required("Institution required"),
      board: yup.string().required("Board required"),
    })
  ),
});

// EXPORT 4: Declaration Schema
export const declarationSchema = yup.object().shape({
  agreeDeclaration: yup
    .string()
    .oneOf(["yes"], "Required")
    .required("Required"),
});
