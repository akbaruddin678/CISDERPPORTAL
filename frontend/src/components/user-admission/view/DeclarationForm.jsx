// src/components/user-admission/view/steps/DeclarationForm.jsx
import React from "react";
import { useController } from "react-hook-form";

const DeclarationForm = ({ control, errors }) => {
  const { field } = useController({
    name: "agreeDeclaration",
    control,
    defaultValue: "",
  });

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl mb-4 border border-blue-200">
          <svg
            className="w-8 h-8 text-blue-600"
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
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Declaration & Agreement
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
          Please carefully read and agree to the declaration below to proceed
          with your application
        </p>
      </div>

      {/* Declaration Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Card Header */}
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Declaration Statement
              </h3>
              <p className="text-sm text-gray-600">
                Read carefully before agreeing
              </p>
            </div>
          </div>
        </div>

        {/* Declaration Content */}
        <div className="p-6 md:p-8">
          <div className="bg-gradient-to-br from-gray-50 to-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-inner mb-8">
            <div className="relative">
              {/* Decorative Quote Mark */}
              <div className="absolute -top-4 -left-4 text-blue-200 text-6xl font-serif">
                "
              </div>

              <div className="relative z-10 space-y-4 text-gray-700">
                <p className="text-base md:text-lg font-medium text-gray-900 mb-4">
                  I hereby solemnly declare that:
                </p>

                <div className="space-y-5 pl-2">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-sm font-bold text-blue-600">1</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      All information provided in this application is{" "}
                      <span className="font-semibold text-gray-900">
                        true, correct, and complete
                      </span>{" "}
                      to the best of my knowledge and belief.
                    </p>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-sm font-bold text-blue-600">2</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      I have{" "}
                      <span className="font-semibold text-gray-900">
                        not withheld any information
                      </span>{" "}
                      that could affect the processing of my application.
                    </p>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-sm font-bold text-blue-600">3</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      All documents submitted are{" "}
                      <span className="font-semibold text-gray-900">
                        genuine and authentic
                      </span>{" "}
                      and belong to me.
                    </p>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-sm font-bold text-blue-600">4</span>
                    </div>
                    <div>
                      <p className="text-gray-700 leading-relaxed mb-2">
                        I understand that providing false information or
                        documents may result in:
                      </p>
                      <ul className="space-y-2 ml-6">
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 mt-1.5">•</span>
                          <span className="text-gray-700">
                            Immediate cancellation of admission
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 mt-1.5">•</span>
                          <span className="text-gray-700">
                            Disciplinary action by the university
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 mt-1.5">•</span>
                          <span className="text-gray-700">
                            Legal consequences as per university regulations
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-sm font-bold text-blue-600">5</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      I agree to{" "}
                      <span className="font-semibold text-gray-900">
                        abide by all rules and regulations
                      </span>{" "}
                      of the university throughout my academic tenure.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 italic">
                    By agreeing below, I acknowledge that I have read,
                    understood, and voluntarily accept all terms and conditions
                    stated above.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Agreement Options */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Select Your Agreement
            </h4>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Agree Option */}
              <label
                className={`relative cursor-pointer border-2 rounded-xl p-6 transition-all duration-200 ${
                  field.value === "yes"
                    ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg scale-[1.02]"
                    : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50 hover:shadow-md"
                }`}
                onClick={() => field.onChange("yes")}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      field.value === "yes"
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300"
                    }`}
                  >
                    {field.value === "yes" && (
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
                    )}
                  </div>
                  <input
                    type="radio"
                    id="agreeYes"
                    value="yes"
                    checked={field.value === "yes"}
                    onChange={() => {}}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
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
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-bold text-gray-900">I Agree</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Yes, I accept and agree to all terms and conditions stated
                      in the declaration above.
                    </p>
                  </div>
                </div>
                {field.value === "yes" && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
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
                    </div>
                  </div>
                )}
              </label>

              {/* Disagree Option */}
              <label
                className={`relative cursor-pointer border-2 rounded-xl p-6 transition-all duration-200 ${
                  field.value !== "yes"
                    ? "border-red-300 bg-gradient-to-br from-red-50 to-pink-50 shadow-lg scale-[1.02]"
                    : "border-gray-200 bg-white hover:border-red-200 hover:bg-red-50/50 hover:shadow-md"
                }`}
                onClick={() => field.onChange("")}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      field.value !== "yes"
                        ? "border-red-400 bg-red-400"
                        : "border-gray-300"
                    }`}
                  >
                    {field.value !== "yes" && (
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
                  <input
                    type="radio"
                    id="agreeNo"
                    value=""
                    checked={field.value !== "yes"}
                    onChange={() => {}}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-5 h-5 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-bold text-gray-900">
                        I Do Not Agree
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      No, I do not agree to the terms. Note: Your application
                      cannot proceed without agreement.
                    </p>
                  </div>
                </div>
                {field.value !== "yes" && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-red-400 rounded-full flex items-center justify-center">
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
                    </div>
                  </div>
                )}
              </label>
            </div>

            {/* Error Message */}
            {errors.agreeDeclaration && (
              <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg animate-shake">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-red-600"
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
                  </div>
                  <div>
                    <p className="text-red-700 font-medium">
                      {errors.agreeDeclaration.message}
                    </p>
                    <p className="text-red-600 text-sm mt-1">
                      You must agree to the declaration to proceed with your
                      application.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Important Note */}
            <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
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
                  </div>
                </div>
                <div>
                  <h5 className="font-semibold text-blue-800 mb-1">
                    Important Notice
                  </h5>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    <span className="font-semibold">
                      Your agreement is mandatory
                    </span>{" "}
                    for processing this application. By selecting "I Agree", you
                    are providing digital consent equivalent to a physical
                    signature. The university reserves the right to verify all
                    information and take appropriate action if any discrepancies
                    are found.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="px-6 md:px-8 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>This is a legally binding agreement</span>
            </div>
            <div className="text-right">
              <span className="font-medium text-gray-700">Required Field</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeclarationForm;