import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import cisdLogo from "../../../assets/cisd-logo.png";
import { useResetPasswordMutation } from "../api/userApi";

// Landing page for the HR onboarding "welcome, set your password" email —
// reuses the existing /api/user/reset-password endpoint (normally reached
// via the forgot-password OTP flow) with the token supplied in the URL
// instead of from a verify-otp response. Mirrors VerifyEmail.jsx's
// single-file, Tailwind-styled "land from an email link" pattern.
const SetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | success | error
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !token) {
      setStatus("error");
      setErrorMessage("Invalid link. No token found.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    try {
      await resetPassword({ email, resetToken: token, password, confirmPassword }).unwrap();
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error?.data?.message || "This link is invalid or has expired.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lime-50 via-white to-sky-50 p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden text-center">
        <div className="bg-[#0b2a6b] p-6">
          <div className="mx-auto mb-3 inline-flex rounded-xl bg-white p-2">
            <img src={cisdLogo} alt="CISD logo" className="h-10 w-auto object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome — Set Your Password</h2>
        </div>

        <div className="p-8">
          {status === "success" ? (
            <div className="animate-fade-in">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Password Set!</h3>
              <p className="text-gray-500 mb-8">You can now log in with your new password.</p>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 px-4 bg-[#0b2a6b] hover:bg-[#12388a] text-white rounded-full font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="text-left animate-fade-in">
              <p className="text-gray-500 text-sm mb-6 text-center">
                Set a password for <span className="font-semibold text-gray-700">{email || "your account"}</span> to
                finish setting up your employee portal access.
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full p-3 border rounded-xl mb-4"
              />

              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full p-3 border rounded-xl mb-4"
              />

              {(status === "error" || errorMessage) && (
                <p className="text-red-500 mb-4 px-4 bg-red-50 py-2 rounded-lg text-sm border border-red-100">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#0b2a6b] hover:bg-[#12388a] disabled:opacity-60 text-white rounded-full font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? "Setting Password..." : "Set Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
