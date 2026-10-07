import React from "react";
import { Button } from "@mui/material";
import { Link } from "react-router-dom";
import { Mail, ShieldCheck, CheckCircle2, ArrowLeft, UserPlus } from "lucide-react";
import InputField from "../../../shared/shared/InputField/UI/InputField";
import PasswordField from "./PasswordField";
import cisdLogo from "../../../assets/cisd-logo.png";

const SignUpView = ({
  step,
  email,
  onSubmitEmail,
  emailControl,
  emailErrors,
  onSubmitOtp,
  otpControl,
  otpErrors,
  onSubmitComplete,
  completeControl,
  completeErrors,
  sendingOtp,
  verifyingOtp,
  completingSignup,
  resendOtp,
  goBackToEmail,
  schools,
  campusId,
  setCampusId,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-sky-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 md:grid md:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden md:block">
          <img src="/site/cisd-team.jpg" alt="CISD students" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b2a6b] via-[#0b2a6b]/80 to-[#0b2a6b]/30" />
          <div className="relative flex h-full flex-col justify-between p-10 text-white">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-white p-2">
                <img src={cisdLogo} alt="CISD logo" className="h-9 w-auto object-contain" />
              </span>
              <span className="text-sm font-extrabold leading-tight">
                College of International
                <br />
                Skills Development
              </span>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold leading-tight">
                Join CISD <span className="text-[#9bd13d]">today.</span>
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">
                Create your account to complete your admission application. We will verify your email first, then you
                can set your name and password.
              </p>
            </div>
          </div>
        </div>

        {/* Right Section - Sign Up Form */}
        <div className="flex items-center justify-center p-8 sm:p-12 bg-white">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="md:hidden flex justify-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#f3f1f1] rounded-lg flex items-center justify-center">
                  <img src={cisdLogo} alt="CISD Logo" className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">CISD Admission PORTAL</h1>
                  <p className="text-gray-600 text-xs">CISD</p>
                </div>
              </div>
            </div>

            {/* STEP 1 — email */}
            {step === "email" && (
              <>
                <div className="text-center mb-10">
                  <Mail className="mx-auto text-[#0b2a6b] mb-3" size={32} />
                  <h2 className="text-3xl font-bold text-gray-800 mb-3">Create Account</h2>
                  {/* <p className="text-gray-600 text-lg">
                    Enter your email — we'll send you a 6-digit code to verify it
                    first.
                  </p> */}
                </div>

                <form onSubmit={onSubmitEmail} className="space-y-6">
                  <label className="block text-sm font-semibold text-gray-700">
                    Applying to campus
                    <select required value={campusId} onChange={(event) => setCampusId(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 outline-none focus:border-[#0b2a6b]">
                      <option value="">Select a CISD campus</option>
                      {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
                    </select>
                  </label>
                  <InputField
                    name="email"
                    control={emailControl}
                    label="Email Address"
                    type="email"
                    errors={emailErrors}
                    className="bg-gray-50 border-gray-200 focus:border-[#0b2a6b]"
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={sendingOtp}
                    className="py-4 text-lg font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    style={{
                      backgroundColor: "#0b2a6b",
                      backgroundImage: "none",
                    }}
                  >
                    {sendingOtp ? "Sending Code..." : "Send Verification Code"}
                  </Button>
                </form>
              </>
            )}

            {/* STEP 2 — otp */}
            {step === "otp" && (
              <>
                <div className="text-center mb-10">
                  <ShieldCheck className="mx-auto text-[#0b2a6b] mb-3" size={32} />
                  <h2 className="text-3xl font-bold text-gray-800 mb-3">Verify Your Email</h2>
                  <p className="text-gray-600 text-lg">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-semibold text-gray-800">{email}</span>
                  </p>
                </div>

                <form onSubmit={onSubmitOtp} className="space-y-6">
                  <InputField
                    name="otp"
                    control={otpControl}
                    label="6-Digit Code"
                    type="text"
                    errors={otpErrors}
                    className="bg-gray-50 border-gray-200 focus:border-[#0b2a6b]"
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={verifyingOtp}
                    className="py-4 text-lg font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    style={{
                      backgroundColor: "#0b2a6b",
                      backgroundImage: "none",
                    }}
                  >
                    {verifyingOtp ? "Verifying..." : "Verify Code"}
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={goBackToEmail}
                      className="flex items-center gap-1.5 text-gray-500 hover:text-[#0b2a6b]"
                    >
                      <ArrowLeft size={14} /> Change Email
                    </button>
                    <button
                      type="button"
                      onClick={resendOtp}
                      className="text-[#0b2a6b] font-semibold hover:underline"
                    >
                      Resend Code
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* STEP 3 — name + password */}
            {step === "complete" && (
              <>
                <div className="text-center mb-10">
                  <UserPlus className="mx-auto text-[#0b2a6b] mb-3" size={32} />
                  <h2 className="text-3xl font-bold text-gray-800 mb-3">
                    Almost Done
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Email verified. Set your name and password to finish.
                  </p>
                </div>

                <form onSubmit={onSubmitComplete} className="space-y-6">
                  <InputField
                    name="name"
                    control={completeControl}
                    label="Full Name"
                    type="text"
                    errors={completeErrors}
                    className="bg-gray-50 border-gray-200 focus:border-[#0b2a6b]"
                  />

                  <PasswordField
                    name="password"
                    control={completeControl}
                    label="Password"
                    errors={completeErrors}
                  />

                  <PasswordField
                    name="confirmPassword"
                    control={completeControl}
                    label="Confirm Password"
                    errors={completeErrors}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={completingSignup}
                    className="py-4 text-lg font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    style={{
                      backgroundColor: "#0b2a6b",
                      backgroundImage: "none",
                    }}
                  >
                    {completingSignup ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </>
            )}

            {/* STEP 4 — done */}
            {step === "done" && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="text-green-600" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Account Created
                </h3>
                <p className="text-gray-500 mb-8">Redirecting you to the login page...</p>
                <Link
                  to="/login"
                  className="inline-block w-full py-3 px-4 bg-[#0b2a6b] text-white rounded-full font-bold hover:bg-[#0b2a6b]/90 transition-colors"
                >
                  Go to Login
                </Link>
              </div>
            )}

            {step !== "done" && (
              <>
                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">
                      ALREADY HAVE AN ACCOUNT?
                    </span>
                  </div>
                </div>

                {/* Login Link */}
                <div className="text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center w-full py-3 px-4 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:border-[#0b2a6b] hover:text-[#0b2a6b] transition-all duration-200 hover:shadow-md"
                  >
                    Sign In to Your Account
                  </Link>
                </div>

                {/* Footer Links */}
                <div className="mt-12 text-center">
                  <p className="text-gray-500 text-sm">
                    By creating an account, you agree to our{" "}
                    <Link to="/signup" className="text-[#0b2a6b] hover:underline font-medium">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/signup" className="text-[#0b2a6b] hover:underline font-medium">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpView;
