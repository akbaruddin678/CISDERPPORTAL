import React from "react";
import { Button } from "@mui/material";
import { Link } from "react-router-dom";
import { Mail, ShieldCheck, CheckCircle2, ArrowLeft } from "lucide-react";
import InputField from "../../../shared/shared/InputField/UI/InputField";
import PasswordField from "./PasswordField";
import cisdLogo from "../../../assets/cisd-logo.png";

const ForgotPasswordView = ({
  step,
  email,
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
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-[#1e3a8a] px-8 py-8 text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <img src={cisdLogo} alt="CISD Logo" className="w-9 h-9 object-contain" />
          </div>
          <h1 className="text-xl font-bold text-white">Reset Your Password</h1>
          <p className="text-blue-200 text-sm mt-1">
            Applicant accounts only
          </p>
        </div>

        <div className="p-8">
          {/* STEP 1 — email */}
          {step === "email" && (
            <form onSubmit={onSubmitEmail} className="space-y-6">
              <div className="text-center mb-2">
                <Mail className="mx-auto text-[#1e3a8a] mb-3" size={32} />
                <p className="text-gray-600 text-sm">
                  Enter the email you registered with — we'll send you a
                  6-digit verification code.
                </p>
              </div>

              <InputField
                name="email"
                control={emailControl}
                label="Email Address"
                type="email"
                errors={emailErrors}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={sendingOtp}
                className="py-3 text-base font-semibold rounded-xl"
                style={{ backgroundColor: "#1e3a8a" }}
              >
                {sendingOtp ? "Sending Code..." : "Send Verification Code"}
              </Button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-[#1e3a8a] mt-2"
              >
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </form>
          )}

          {/* STEP 2 — otp */}
          {step === "otp" && (
            <form onSubmit={onSubmitOtp} className="space-y-6">
              <div className="text-center mb-2">
                <ShieldCheck className="mx-auto text-[#1e3a8a] mb-3" size={32} />
                <p className="text-gray-600 text-sm">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-semibold text-gray-800">{email}</span>
                </p>
              </div>

              <InputField
                name="otp"
                control={otpControl}
                label="6-Digit Code"
                type="text"
                errors={otpErrors}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={verifyingOtp}
                className="py-3 text-base font-semibold rounded-xl"
                style={{ backgroundColor: "#1e3a8a" }}
              >
                {verifyingOtp ? "Verifying..." : "Verify Code"}
              </Button>

              <div className="flex items-center justify-between text-sm mt-2">
                <button
                  type="button"
                  onClick={goBackToEmail}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-[#1e3a8a]"
                >
                  <ArrowLeft size={14} /> Change Email
                </button>
                <button
                  type="button"
                  onClick={resendOtp}
                  className="text-[#1e3a8a] font-semibold hover:underline"
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}

          {/* STEP 3 — set new password */}
          {step === "reset" && (
            <form onSubmit={onSubmitReset} className="space-y-6">
              <div className="text-center mb-2">
                <ShieldCheck className="mx-auto text-[#1e3a8a] mb-3" size={32} />
                <p className="text-gray-600 text-sm">
                  Choose a new password for your account.
                </p>
              </div>

              <PasswordField
                name="password"
                control={resetControl}
                label="New Password"
                errors={resetErrors}
              />
              <PasswordField
                name="confirmPassword"
                control={resetControl}
                label="Confirm New Password"
                errors={resetErrors}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={resettingPassword}
                className="py-3 text-base font-semibold rounded-xl"
                style={{ backgroundColor: "#1e3a8a" }}
              >
                {resettingPassword ? "Saving..." : "Reset Password"}
              </Button>
            </form>
          )}

          {/* STEP 4 — done */}
          {step === "done" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="text-green-600" size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Password Reset Successfully
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Redirecting you to the login page...
              </p>
              <Link
                to="/login"
                className="inline-block w-full py-3 px-4 bg-[#1e3a8a] text-white rounded-xl font-semibold hover:bg-[#1e3a8a]/90 transition-colors"
              >
                Go to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordView;
