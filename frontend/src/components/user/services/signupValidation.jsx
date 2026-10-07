import * as yup from "yup";

export const signupEmailStepSchema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
});

export const signupOtpStepSchema = yup.object().shape({
  otp: yup
    .string()
    .matches(/^\d{6}$/, "Enter the 6-digit code")
    .required("Code is required"),
});

export const signupCompleteStepSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});
