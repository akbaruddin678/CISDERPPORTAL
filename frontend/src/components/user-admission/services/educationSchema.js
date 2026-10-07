import * as yup from "yup";

export const educationSchema = yup.object().shape({
  educationDetails: yup.array().of(
    yup.object().shape({
      educationProgram: yup.string().required("Program is required"),
      startDate: yup
        .date()
        .typeError("Start Date is required")
        .required("Start Date is required"),
      obtainedMarks: yup
        .number()
        .typeError("Obtained marks must be a number")
        .required("Obtained marks are required")
        .min(0, "Marks cannot be negative"),
      totalMarks: yup
        .number()
        .typeError("Total marks must be a number")
        .required("Total marks are required")
        .moreThan(
          yup.ref("obtainedMarks"),
          "Total marks must be greater than obtained marks"
        ),
      percentage: yup
        .number()
        .typeError("Percentage must be a number")
        .required("Percentage is required")
        .min(0, "Percentage cannot be less than 0")
        .max(100, "Percentage cannot be more than 100"),
    })
  ),
});

export const declarationSchema = yup.object().shape({
  agreeDeclaration: yup
    .string()
    .oneOf(["yes"], "Select Yes and submit the Form")
    .required("You must agree to the declaration"),
});

const FILE_SIZE = 5 * 1024 * 1024;

const fileSizeTest = (fieldName) =>
  yup
    .mixed()
    .required(`${fieldName} is required`)
    .test("fileSize", "File size must be less than 50k", (value) => {
      if (!value) return false;
      const file = value instanceof File ? value : value[0];
      return file && file.size <= FILE_SIZE;
    });

export const documentSchema = yup.object().shape({
  profilePhoto: fileSizeTest("Profile photo"),
  cnicDoc_front: fileSizeTest("CNIC front"),
  cnicDoc_back: fileSizeTest("CNIC back"),
  domicileDoc: fileSizeTest("Docicile degree"),
  matricCertificate: fileSizeTest("Matric certificate"),
  fscCertificate: fileSizeTest("FSC certificate"),

});
