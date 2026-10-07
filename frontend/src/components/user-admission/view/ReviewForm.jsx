// src/components/user-admission/view/ReviewForm.jsx
import React from "react";

const ReviewForm = ({
  personalInfo,
  educationDetails,
  documentUpload,
  declaration,
  onConfirm,
  onCancel,
  submitting = false,
}) => {
  // Helper function to format date
  const formatDate = (date) => {
    if (!date) return "Not provided";
    if (date?.$d) return new Date(date.$d).toLocaleDateString();
    if (date instanceof Date) return date.toLocaleDateString();
    if (typeof date === "string") return new Date(date).toLocaleDateString();
    return "Not provided";
  };

  // FIX: Helper to display value or "Not provided" handling objects properly
  const displayValue = (value) => {
    if (!value) return "Not provided";
    if (typeof value === "object") {
      // Handle populated objects (e.g. Program { _id, name })
      if (value.name) return value.name;
      // Handle simple Select options { label, value }
      if (value.label) return value.label;
      return "Selected"; // Fallback for other objects
    }
    return value;
  };

  // Get education details from the correct structure
  const educationData =
    educationDetails?.educationDetails || educationDetails || [];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-6 border border-blue-200 shadow-lg">
          <svg
            className="w-10 h-10 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Review Your Application
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-base">
          Please review all information carefully before submitting your
          application
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm font-medium text-blue-700">
            Once submitted, changes cannot be made
          </span>
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Personal Information
              </h3>
              <p className="text-sm text-gray-600">
                Your personal and contact details
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                label: "Full Name",
                value: displayValue(personalInfo?.fullName),
              },
              {
                label: "Father Name",
                value: displayValue(personalInfo?.fatherName),
              },
              {
                label: "Father CNIC",
                value: displayValue(personalInfo?.fatherCnic),
              },
              { label: "CNIC", value: displayValue(personalInfo?.cnic) },
              { label: "Phone", value: displayValue(personalInfo?.phone) },
              {
                label: "Guardian Phone",
                value: displayValue(personalInfo?.guardianPhone),
              },
              { label: "Date of Birth", value: formatDate(personalInfo?.dob) },
              { label: "Gender", value: displayValue(personalInfo?.gender) },
              {
                label: "Applying For Program",
                value: displayValue(personalInfo?.applyingForProgram), // Using safe helper
              },
              {
                label: "Applying Session",
                value: displayValue(personalInfo?.applyingSession), // Using safe helper
              },
              {
                label: "Applying For Department",
                value: displayValue(personalInfo?.applyingForDepartment), // Using safe helper
              },
            ].map((item, idx) => (
              <div key={idx} className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  {item.label}
                </label>
                <p className="text-gray-800 font-medium bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Family Information Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Family Information
              </h3>
              <p className="text-sm text-gray-600">
                Family and financial details
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                label: "Mother Name",
                value: displayValue(personalInfo?.motherName),
              },
              {
                label: "Mother CNIC",
                value: displayValue(personalInfo?.motherCnic),
              },
              {
                label: "Father Status",
                value: displayValue(personalInfo?.fatherStatus),
              },
              {
                label: "Father's Profession",
                value: displayValue(personalInfo?.fathersProfession),
              },
              {
                label: "Guardian Designation",
                value: displayValue(personalInfo?.guardianDesignation),
              },
              {
                label: "Family Income",
                value: displayValue(personalInfo?.familyIncome),
              },
            ].map((item, idx) => (
              <div key={idx} className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  {item.label}
                </label>
                <p className="text-gray-800 font-medium bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Address Information Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Address Information
              </h3>
              <p className="text-sm text-gray-600">
                Current and permanent addresses
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Current Address */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800">Current Address</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600">
                  Address
                </label>
                <p className="text-gray-800 font-medium bg-gray-50 p-3 rounded-lg border border-gray-200 mt-1">
                  {displayValue(personalInfo?.currentAddress)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  District
                </label>
                <p className="text-gray-800 font-medium bg-gray-50 p-3 rounded-lg border border-gray-200 mt-1">
                  {displayValue(personalInfo?.currentDistrict)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Province
                </label>
                <p className="text-gray-800 font-medium bg-gray-50 p-3 rounded-lg border border-gray-200 mt-1">
                  {displayValue(personalInfo?.currentProvince)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Country
                </label>
                <p className="text-gray-800 font-medium bg-gray-50 p-3 rounded-lg border border-gray-200 mt-1">
                  {displayValue(personalInfo?.currentCountry)}
                </p>
              </div>
            </div>
          </div>

          {/* Permanent Address */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800">Permanent Address</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600">
                  Address
                </label>
                <p className="text-gray-800 font-medium bg-gray-50 p-3 rounded-lg border border-gray-200 mt-1">
                  {displayValue(personalInfo?.permanentAddress)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  District
                </label>
                <p className="text-gray-800 font-medium bg-gray-50 p-3 rounded-lg border border-gray-200 mt-1">
                  {displayValue(personalInfo?.permanentDistrict)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Province
                </label>
                <p className="text-gray-800 font-medium bg-gray-50 p-3 rounded-lg border border-gray-200 mt-1">
                  {displayValue(personalInfo?.permanentProvince)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Country
                </label>
                <p className="text-gray-800 font-medium bg-gray-50 p-3 rounded-lg border border-gray-200 mt-1">
                  {displayValue(personalInfo?.permanentCountry)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Education Details Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <svg
                className="w-5 h-5 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l9-5-9-5-9 5 9 5z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l9 5m-9-5v10"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Education Details
              </h3>
              <p className="text-sm text-gray-600">
                {educationData.length} qualification(s) added
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {educationData && educationData.length > 0 ? (
            educationData.map((edu, index) => (
              <div
                key={index}
                className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200 last:mb-0"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <span className="text-amber-700 font-semibold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-800">
                      Education #{index + 1}
                    </h4>
                  </div>
                  {edu.percentage && (
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        edu.percentage >= 60
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {edu.percentage}%
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Education Program
                    </label>
                    <p className="text-gray-800 font-medium bg-white p-3 rounded-lg border border-gray-200 mt-1">
                      {displayValue(edu.educationProgram)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Board/University
                    </label>
                    <p className="text-gray-800 font-medium bg-white p-3 rounded-lg border border-gray-200 mt-1">
                      {displayValue(edu.board)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Institution
                    </label>
                    <p className="text-gray-800 font-medium bg-white p-3 rounded-lg border border-gray-200 mt-1">
                      {displayValue(edu.institution)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Start Date
                    </label>
                    <p className="text-gray-800 font-medium bg-white p-3 rounded-lg border border-gray-200 mt-1">
                      {formatDate(edu.startDate)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      End Date/Expected
                    </label>
                    <p className="text-gray-800 font-medium bg-white p-3 rounded-lg border border-gray-200 mt-1">
                      {formatDate(edu.endDateOrResultAwaited)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Session
                    </label>
                    <p className="text-gray-800 font-medium bg-white p-3 rounded-lg border border-gray-200 mt-1">
                      {displayValue(edu.session)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Obtained Marks
                    </label>
                    <p className="text-gray-800 font-medium bg-white p-3 rounded-lg border border-gray-200 mt-1">
                      {displayValue(edu.obtainedMarks)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Total Marks
                    </label>
                    <p className="text-gray-800 font-medium bg-white p-3 rounded-lg border border-gray-200 mt-1">
                      {displayValue(edu.totalMarks)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Percentage
                    </label>
                    <p className="text-gray-800 font-medium bg-white p-3 rounded-lg border border-gray-200 mt-1">
                      {edu.percentage
                        ? `${displayValue(edu.percentage)}%`
                        : "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l9-5-9-5-9 5 9 5z"
                  />
                </svg>
              </div>
              <p className="text-gray-500">No education details provided</p>
            </div>
          )}
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <svg
                className="w-5 h-5 text-cyan-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Uploaded Documents
              </h3>
              <p className="text-sm text-gray-600">
                Required documents and certificates
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              className={`p-4 border-2 rounded-xl ${
                documentUpload?.profilePhoto
                  ? "border-green-300 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {documentUpload?.profilePhoto ? (
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                <span
                  className={`font-medium ${
                    documentUpload?.profilePhoto
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  Profile Photo
                </span>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-xl ${
                documentUpload?.cnicDoc_front
                  ? "border-green-300 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {documentUpload?.cnicDoc_front ? (
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                <span
                  className={`font-medium ${
                    documentUpload?.cnicDoc_front
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  CNIC Front
                </span>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-xl ${
                documentUpload?.cnicDoc_back
                  ? "border-green-300 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {documentUpload?.cnicDoc_back ? (
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                <span
                  className={`font-medium ${
                    documentUpload?.cnicDoc_back
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  CNIC Back
                </span>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-xl ${
                documentUpload?.domicileDoc
                  ? "border-green-300 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {documentUpload?.domicileDoc ? (
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                <span
                  className={`font-medium ${
                    documentUpload?.domicileDoc
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  Domicile Certificate
                </span>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-xl ${
                documentUpload?.matricCertificate
                  ? "border-green-300 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {documentUpload?.matricCertificate ? (
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                <span
                  className={`font-medium ${
                    documentUpload?.matricCertificate
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  Matric Certificate
                </span>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-xl ${
                documentUpload?.fscCertificate
                  ? "border-green-300 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {documentUpload?.fscCertificate ? (
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                <span
                  className={`font-medium ${
                    documentUpload?.fscCertificate
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  FSC Certificate
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Declaration Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Declaration
              </h3>
              <p className="text-sm text-gray-600">Legal agreement status</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-gray-700 mb-6 leading-relaxed">
              I hereby declare that all information provided in this application
              is true and correct to the best of my knowledge. I understand that
              providing false information may result in cancellation of my
              admission or other disciplinary action by the university.
            </p>
            <div className="flex items-center gap-4">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  declaration?.agreeDeclaration === "yes"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              >
                {declaration?.agreeDeclaration === "yes" ? (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`font-semibold text-lg ${
                  declaration?.agreeDeclaration === "yes"
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {declaration?.agreeDeclaration === "yes"
                  ? "✓ I agree to the declaration"
                  : "✗ I do not agree to the declaration"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Important Note */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-amber-800 text-lg mb-2">
              Important Note
            </h4>
            <p className="text-amber-700 text-base">
              Please review all information carefully before submitting. Once
              submitted, you cannot make changes to this application.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="text-center lg:text-left">
            <h3 className="text-lg font-bold text-gray-900">
              Ready to Submit?
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Please ensure all information is correct before final submission.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <button
              onClick={onCancel}
              disabled={submitting}
              className="flex items-center justify-center gap-2 px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Go Back & Edit
            </button>

            <button
              onClick={onConfirm}
              disabled={submitting}
              className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                declaration?.agreeDeclaration === "yes"
                  ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700"
                  : "bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed"
              }`}
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                  Confirm & Submit Application
                </>
              )}
            </button>
          </div>
        </div>

        {declaration?.agreeDeclaration !== "yes" && (
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-700 font-medium">
                You must agree to the declaration before submitting your
                application.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewForm;
