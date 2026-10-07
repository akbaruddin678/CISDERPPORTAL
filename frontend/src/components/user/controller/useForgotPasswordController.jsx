import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useForgotPasswordMutation,
  useVerifyResetOtpMutation,
  useResetPasswordMutation,
} from "../api/userApi";
import {
  emailStepSchema,
  otpStepSchema,
  resetStepSchema,
} from "../services/forgotPasswordValidation";

const useForgotPasswordController = () => {
  const navigate = useNavigate();
  const { openAlert, AlertComponent } = useGlobalAlert();

  // email -> otp -> reset -> done
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [forgotPassword, { isLoading: sendingOtp }] =
    useForgotPasswordMutation();
  const [verifyResetOtp, { isLoading: verifyingOtp }] =
    useVerifyResetOtpMutation();
  const [resetPassword, { isLoading: resettingPassword }] =
    useResetPasswordMutation();

  const {
    handleSubmit: handleEmailSubmit,
    control: emailControl,
    formState: { errors: emailErrors },
  } = useForm({ resolver: yupResolver(emailStepSchema) });

  const {
    handleSubmit: handleOtpSubmit,
    control: otpControl,
    formState: { errors: otpErrors },
    reset: resetOtpForm,
  } = useForm({ resolver: yupResolver(otpStepSchema) });

  const {
    handleSubmit: handleResetSubmit,
    control: resetControl,
    formState: { errors: resetErrors },
  } = useForm({ resolver: yupResolver(resetStepSchema) });

  const onSubmitEmail = async (data) => {
    try {
      await forgotPassword({ email: data.email }).unwrap();
      setEmail(data.email);
      openAlert({ message: "A 6-digit code has been sent to your email.", severity: "success" });
      setStep("otp");
    } catch (err) {
      openAlert({
        message: err?.data?.error || "Failed to send code. Please try again.",
        severity: "error",
      });
    }
  };

  const onSubmitOtp = async (data) => {
    try {
      const result = await verifyResetOtp({ email, otp: data.otp }).unwrap();
      setResetToken(result.resetToken);
      openAlert({ message: "Code verified.", severity: "success" });
      setStep("reset");
    } catch (err) {
      openAlert({
        message: err?.data?.error || "Invalid or expired code.",
        severity: "error",
      });
    }
  };

  const onSubmitReset = async (data) => {
    try {
      await resetPassword({
        email,
        resetToken,
        password: data.password,
        confirmPassword: data.confirmPassword,
      }).unwrap();
      openAlert({
        message: "Password reset successfully. Please log in.",
        severity: "success",
      });
      setStep("done");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      openAlert({
        message: err?.data?.error || "Failed to reset password.",
        severity: "error",
      });
    }
  };

  const resendOtp = async () => {
    try {
      await forgotPassword({ email }).unwrap();
      resetOtpForm({ otp: "" });
      openAlert({ message: "A new code has been sent.", severity: "success" });
    } catch (err) {
      openAlert({
        message: err?.data?.error || "Failed to resend code.",
        severity: "error",
      });
    }
  };

  return {
    step,
    email,
    AlertComponent,
    onSubmitEmail: handleEmailSubmit(onSubmitEmail),
    emailControl,
    emailErrors,
    onSubmitOtp: handleOtpSubmit(onSubmitOtp),
    otpControl,
    otpErrors,
    onSubmitReset: handleResetSubmit(onSubmitReset),
    resetControl,
    resetErrors,
    sendingOtp,
    verifyingOtp,
    resettingPassword,
    resendOtp,
    goBackToEmail: () => setStep("email"),
  };
};

export default useForgotPasswordController;
