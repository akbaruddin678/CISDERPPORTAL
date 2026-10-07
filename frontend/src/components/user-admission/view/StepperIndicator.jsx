// src/components/user-admission/view/StepperIndicator.jsx
import React from "react";

const labels = ["Personal", "Education", "Documents", "Declaration"];

const StepperIndicator = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      {labels.map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;

        return (
          <div key={label} className="flex-1 flex flex-col items-center">
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full text-white ${
                isActive
                  ? "bg-blue-600"
                  : isDone
                  ? "bg-green-500"
                  : "bg-gray-300"
              }`}
            >
              {stepNum}
            </div>
            <span
              className={`mt-2 text-xs font-medium ${
                isActive
                  ? "text-blue-600"
                  : isDone
                  ? "text-green-600"
                  : "text-gray-500"
              }`}
            >
              {label}
            </span>
            {idx !== labels.length && (
              <div className="w-full h-[2px] bg-gray-200 mt-3">
                <div
                  className={`h-[2px] ${
                    currentStep > stepNum ? "bg-green-500" : "bg-gray-200"
                  }`}
                  style={{
                    width:
                      currentStep > stepNum
                        ? "100%"
                        : currentStep === stepNum
                        ? "50%"
                        : "0%",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepperIndicator;
