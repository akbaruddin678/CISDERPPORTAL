import React from "react";
import { Button } from "@mui/material";
import InputField from "../../../shared/shared/InputField/UI/InputField";
import PasswordField from "./PasswordField";
import { Link } from "react-router-dom";
import cisdLogo from "../../../assets/cisd-logo.png";
import campusBackground from "../../../assets/cisd-campus.png";

const LoginView = ({ onSubmit, control, errors, loginLoading }) => {
  return (
    <div className="min-h-screen bg-[#ffffff] flex items-center justify-center p-4 relative">
      {/* Full Screen Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={campusBackground} 
          alt="CISD Campus" 
          className="w-full h-full object-cover"
        />
        {/* Dark Overlay for better readability */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Login Box - Same as before */}
      <div className="w-full max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100 relative z-10">
        {/* Left Section - CISD Image Background */}
        <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
          {/* CISD Background Image */}
          <div className="absolute inset-0">
            <img 
              src={campusBackground} 
              alt="CISD Campus" 
              className="w-full h-full object-cover"
            />
            {/* Dark Overlay for better text readability */}
            <div className="absolute inset-0 bg-[#e0d5d5]/80 backdrop-blur-[1px]"></div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#616161]/90 to-[#424242]/80"></div>
          </div>

          {/* Logo and Content */}
          <div className="relative z-10 flex flex-col justify-between w-full h-full p-12">
            {/* Logo */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-2xl border border-gray-300">
                <img 
                  src={cisdLogo}
                  alt="CISD Logo" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">CISD Admission Portal</h1>
                <p className="text-gray-300 text-sm">CISD</p>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <div className="w-48 h-48 mb-8 bg-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                <img 
                  src={cisdLogo}
                  alt="CISD Logo" 
                  className="w-32 h-32 object-contain"
                />
              </div>
              
              <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
                Welcome to <span className="text-[#e0e0e0]">CISD</span>
              </h2>
              <p className="text-gray-200 text-xl leading-relaxed max-w-md">
                Login to complete your application process and join our educational community.
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
                <div className="w-10 h-10 bg-[#f3f1f1] rounded-lg flex items-center justify-center">
                  <img 
                    src={cisdLogo}
                    alt="CISD Logo" 
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">CISD Admission PORTAL</h1>
                  <p className="text-gray-600 text-xs">CISD</p>
                </div>
              </div>
            </div>

            {/* Form Header */}
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Welcome Back</h2>
              <p className="text-gray-600 text-lg">Sign in to continue your application</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              <InputField
                name="email"
                control={control}
                label="Email Address"
                type="email"
                errors={errors}
                className="bg-gray-50 border-gray-200 focus:border-[#616161]"
              />
              
              <PasswordField
                name="password"
                control={control}
                label="Password"
                errors={errors}
              />

              <div className="text-right -mt-2">
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-[#616161] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loginLoading}
                className="py-4 text-lg font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                style={{
                  backgroundColor: '#616161',
                  backgroundImage: 'linear-gradient(135deg, #616161 0%, #757575 100%)'
                }}
              >
                {loginLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">NEW TO CISD ADMISSION PORTAL?</span>
                </div>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <Link 
                  to="/signup" 
                  className="inline-flex items-center justify-center w-full py-3 px-4 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:border-[#616161] hover:text-[#616161] transition-all duration-200 hover:shadow-md"
                >
                  Create New Account
                </Link>
              </div>
            </form>

            {/* Footer Links */}
            <div className="mt-12 text-center">
              <p className="text-gray-500 text-sm">
                By continuing, you agree to our{" "}
                <Link to="/terms" className="text-[#616161] hover:underline font-medium">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-[#616161] hover:underline font-medium">
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
