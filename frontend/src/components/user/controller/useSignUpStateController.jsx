import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useSendRegistrationOtpMutation,
  useVerifyRegistrationOtpMutation,
  useCompleteRegistrationMutation,
} from "../api/userApi";
import {
  signupEmailStepSchema,
  signupOtpStepSchema,
  signupCompleteStepSchema,
} from "../services/signupValidation";
import { baseUrl } from "../../base/baseurl";

const useSignUpStateController = () => {
  const navigate = useNavigate();
  const { openAlert } = useGlobalAlert();

  // email -> otp -> complete -> done
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [schools, setSchools] = useState([]);
  const [campusId, setCampusId] = useState("");

  useEffect(() => {
    fetch(`${baseUrl}/api/schools/public`)
      .then((response) => response.json())
      .then((payload) => setSchools(payload.data || []))
      .catch(() => setSchools([]));
  }, []);

  const [sendRegistrationOtp, { isLoading: sendingOtp }] =
    useSendRegistrationOtpMutation();
  const [verifyRegistrationOtp, { isLoading: verifyingOtp }] =
    useVerifyRegistrationOtpMutation();
  const [completeRegistration, { isLoading: completingSignup }] =
    useCompleteRegistrationMutation();

  const {
    handleSubmit: handleEmailSubmit,
    control: emailControl,
    formState: { errors: emailErrors },
  } = useForm({ resolver: yupResolver(signupEmailStepSchema) });

  const {
    handleSubmit: handleOtpSubmit,
    control: otpControl,
    formState: { errors: otpErrors },
    reset: resetOtpForm,
  } = useForm({ resolver: yupResolver(signupOtpStepSchema) });

  const {
    handleSubmit: handleCompleteSubmit,
    control: completeControl,
    formState: { errors: completeErrors },
  } = useForm({ resolver: yupResolver(signupCompleteStepSchema) });

  const onSubmitEmail = async (data) => {
    try {
      if (!campusId) throw { data: { error: "Please select the CISD campus you are applying to." } };
      await sendRegistrationOtp({ email: data.email }).unwrap();
      setEmail(data.email);
      openAlert({
        message: "A 6-digit verification code has been sent to your email.",
        severity: "success",
      });
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
      const result = await verifyRegistrationOtp({ email, otp: data.otp }).unwrap();
      setVerifyToken(result.verifyToken);
      openAlert({ message: "Email verified.", severity: "success" });
      setStep("complete");
    } catch (err) {
      openAlert({
        message: err?.data?.error || "Invalid or expired code.",
        severity: "error",
      });
    }
  };

  const onSubmitComplete = async (data) => {
    try {
      await completeRegistration({
        email,
        verifyToken,
        name: data.name,
        password: data.password,
        confirmPassword: data.confirmPassword,
        campusId,
      }).unwrap();
      openAlert({
        message: "Account created successfully! Please log in.",
        severity: "success",
        duration: 6000,
      });
      setStep("done");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      openAlert({
        message: err?.data?.error || "Failed to create account.",
        severity: "error",
      });
    }
  };

  const resendOtp = async () => {
    try {
      await sendRegistrationOtp({ email }).unwrap();
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
    onSubmitEmail: handleEmailSubmit(onSubmitEmail),
    emailControl,
    emailErrors,
    onSubmitOtp: handleOtpSubmit(onSubmitOtp),
    otpControl,
    otpErrors,
    onSubmitComplete: handleCompleteSubmit(onSubmitComplete),
    completeControl,
    completeErrors,
    sendingOtp,
    verifyingOtp,
    completingSignup,
    resendOtp,
    goBackToEmail: () => setStep("email"),
    schools,
    campusId,
    setCampusId,
  };
};

export default useSignUpStateController;
