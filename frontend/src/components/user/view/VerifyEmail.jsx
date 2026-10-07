import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import cisdLogo from "../../../assets/cisd-logo.png";
import { useVerifyUserEmailMutation } from "../api/userApi";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const [verifyEmail, { isLoading }] = useVerifyUserEmailMutation();
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState("");

  // Auto-trigger verification on mount (Standard UX)
  useEffect(() => {
    if (token) {
      handleVerification();
    } else {
      setStatus("error");
      setErrorMessage("Invalid link. No token found.");
    }
  }, [token]);

  const handleVerification = async () => {
    setStatus("loading");
    try {
      await verifyEmail({ token }).unwrap();
      setStatus("success");
    } catch (error) {
      setStatus("error");
      // Unverified registrations are purged automatically once expired
      // (see backend applicantCleanupCron.js) — "expired" here effectively
      // means the whole registration is gone, not just this specific link.
      if (error?.data?.error?.includes("expired")) {
        setErrorMessage(
          "This link has expired (10 minute limit) and the registration was removed. Please sign up again.",
        );
      } else {
        setErrorMessage(error?.data?.error || "Verification failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lime-50 via-white to-sky-50 p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden text-center">
        
        {/* Header */}
        <div className="bg-[#0b2a6b] p-6">
          <div className="mx-auto mb-3 inline-flex rounded-xl bg-white p-2">
            <img src={cisdLogo} alt="CISD logo" className="h-10 w-auto object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-white">Email Verification</h2>
        </div>

        <div className="p-8">
          
          {/* 1. LOADING STATE */}
          {status === "loading" && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-[#0b2a6b] rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Verifying your token...</p>
            </div>
          )}

          {/* 2. SUCCESS STATE */}
          {status === "success" && (
            <div className="animate-fade-in">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Verified Successfully!</h3>
              <p className="text-gray-500 mb-8">Your account is now active.</p>
              
              {/* ✅ The Requested Button */}
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 px-4 bg-[#0b2a6b] hover:bg-[#12388a] text-white rounded-full font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Go to Login
              </button>
            </div>
          )}

          {/* 3. ERROR STATE */}
          {status === "error" && (
            <div className="animate-fade-in">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Verification Failed</h3>
              <p className="text-red-500 mb-8 px-4 bg-red-50 py-2 rounded-lg text-sm border border-red-100">
                {errorMessage}
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/signup")}
                  className="w-full py-3 px-4 bg-white border-2 border-gray-200 text-gray-700 rounded-full font-bold hover:bg-gray-50 transition-colors"
                >
                  Register Again
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="block w-full text-sm text-[#0b2a6b] hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;