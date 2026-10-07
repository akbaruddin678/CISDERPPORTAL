import React from "react";
import ForgotPasswordView from "../view/ForgotPasswordView";
import useForgotPasswordController from "../controller/useForgotPasswordController";

const ForgotPasswordContainer = () => {
  const {
    step,
    email,
    AlertComponent,
    onSubmitEmail,
    emailControl,
    emailErrors,
    onSubmitOtp,
    otpControl,
    otpErrors,
    onSubmitReset,
    resetControl,
    resetErrors,
    sendingOtp,
    verifyingOtp,
    resettingPassword,
    resendOtp,
    goBackToEmail,
  } = useForgotPasswordController();

  return (
    <>
      <ForgotPasswordView
        step={step}
        email={email}
        onSubmitEmail={onSubmitEmail}
        emailControl={emailControl}
        emailErrors={emailErrors}
        onSubmitOtp={onSubmitOtp}
        otpControl={otpControl}
        otpErrors={otpErrors}
        onSubmitReset={onSubmitReset}
        resetControl={resetControl}
        resetErrors={resetErrors}
        sendingOtp={sendingOtp}
        verifyingOtp={verifyingOtp}
        resettingPassword={resettingPassword}
        resendOtp={resendOtp}
        goBackToEmail={goBackToEmail}
      />
      <AlertComponent />
    </>
  );
};

export default ForgotPasswordContainer;
