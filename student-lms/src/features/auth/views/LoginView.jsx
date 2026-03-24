import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { useStudentLoginMutation } from "../api/authApi";
import { setCredentials } from "../slice/authSlice";
import { Loader2, Eye, EyeOff } from "lucide-react"; // ✅ Imported Eye and EyeOff

import neiLogo from "../../../assets/neilogo.png";
import nei from "../../../assets/nei.png";

const LoginView = () => {
  // --- LOGIC ---
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // ✅ Added state for password visibility
  const [errorMsg, setErrorMsg] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [login, { isLoading: loginLoading }] = useStudentLoginMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const response = await login({ identifier, password }).unwrap();
      dispatch(setCredentials({ user: response.user, token: response.token }));
      navigate("/");
    } catch (err) {
      setErrorMsg(err.data?.message || "Invalid credentials");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // --- UI ---
  return (
    <div className="min-h-screen bg-[#ffffff] flex items-center justify-center p-4 relative">
      {/* Full Screen Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={nei}
          alt="NEI Campus"
          className="w-full h-full object-cover"
        />
        {/* Dark Overlay for better readability */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Login Box */}
      <div className="w-full max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100 relative z-10">
        {/* Left Section - NEI Image Background */}
        <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
          {/* NEI Background Image */}
          <div className="absolute inset-0">
            <img
              src={nei}
              alt="NEI Campus"
              className="w-full h-full object-cover"
            />
            {/* Dark Overlay for better text readability */}
            <div className="absolute inset-0 bg-[#e0d5d5]/80 backdrop-blur-[1px]"></div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#616161]/90 to-[#424242]/80"></div>
          </div>

          {/* Logo and Content */}
          <div className="relative z-10 flex flex-col justify-between w-full h-full p-12">
            {/* Logo Header */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-2xl border border-gray-300">
                <img
                  src={neiLogo}
                  alt="NEI Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  NEI Student Portal
                </h1>
                <p className="text-gray-300 text-sm">
                  National Excellence Institute
                </p>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <div className="w-48 h-48 mb-8 bg-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 p-8 shadow-xl">
                <img
                  src={neiLogo}
                  alt="NEI Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
                Welcome to <span className="text-[#e0e0e0]">NEI LMS</span>
              </h2>
              <p className="text-gray-200 text-xl leading-relaxed max-w-md">
                Login to access your academic dashboard, enrolled courses, and
                transcripts.
              </p>
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-gray-300 text-sm">
                Empowering students through quality education
              </p>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-10 left-10 w-6 h-6 bg-white/20 rounded-full"></div>
          <div className="absolute top-20 right-16 w-4 h-4 bg-white/15 rounded-full"></div>
          <div className="absolute bottom-24 left-20 w-3 h-3 bg-white/10 rounded-full"></div>
        </div>

        {/* Right Section - Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex items-center justify-center bg-white">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="md:hidden flex justify-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#f3f1f1] rounded-lg flex items-center justify-center border border-gray-200">
                  <img
                    src={neiLogo}
                    alt="NEI Logo"
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">
                    NEI STUDENT PORTAL
                  </h1>
                  <p className="text-gray-600 text-xs">
                    National Excellence Institute
                  </p>
                </div>
              </div>
            </div>

            {/* Form Header */}
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                National Excellence Institute
              </h2>
              <p className="text-gray-600 text-lg">
                Sign in to your student account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email/Roll Number Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email Address or Roll Number
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#616161]/20 focus:border-[#616161] outline-none transition-all"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. FA23-BCS-001 or email@student.edu"
                  required
                />
              </div>

              {/* Password Input with Toggle */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} // ✅ Dynamic type
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#616161]/20 focus:border-[#616161] outline-none transition-all pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  {/* ✅ Toggle Button */}
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium text-center">
                  {errorMsg}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-4 text-lg text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                style={{
                  backgroundColor: "#616161",
                  backgroundImage:
                    "linear-gradient(135deg, #616161 0%, #757575 100%)",
                }}
              >
                {loginLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">
                    HAVING TROUBLE LOGGING IN?
                  </span>
                </div>
              </div>

              {/* Contact Admin Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "Please contact the IT Helpdesk or your batch advisor to reset your password.",
                    )
                  }
                  className="inline-flex items-center justify-center w-full py-3.5 px-4 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:border-[#616161] hover:text-[#616161] hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
                >
                  Contact Administration
                </button>
              </div>
            </form>

            {/* Footer Links */}
            <div className="mt-12 text-center">
              <p className="text-gray-500 text-sm">
                By continuing, you agree to our{" "}
                <Link
                  to="/terms"
                  className="text-[#616161] hover:underline font-medium"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="text-[#616161] hover:underline font-medium"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
