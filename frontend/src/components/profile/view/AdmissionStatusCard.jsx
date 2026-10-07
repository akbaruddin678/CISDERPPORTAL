import React from "react";

const AdmissionStatusCard = ({ admissionData }) => {
  // --- HELPER: Safely extract text from Object or String ---
  const getName = (field) => {
    if (!field) return "N/A";
    // If it's an object (populated data), return the name property
    if (typeof field === "object" && field.name) return field.name;
    // If it's just a string/number, return it as is
    return field;
  };

  if (!admissionData) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {/* 1. Application Status */}
      <InfoCard label="Status" value={admissionData.status} isBadge={true} />

      {/* 2. Program Name (Protected) */}
      <InfoCard
        label="Applying For"
        value={getName(admissionData.applyingForProgram)}
      />

      {/* 3. Department Name (Protected) */}
      <InfoCard
        label="Class"
        value={getName(admissionData.academicDepartment)}
      />

      {/* 4. Session Name (Protected) */}
      <InfoCard
        label="Session"
        value={getName(admissionData.applyingSession)}
      />

      {/* 5. Date Applied */}
      <InfoCard
        label="Applied On"
        value={
          admissionData.createdAt
            ? new Date(admissionData.createdAt).toLocaleDateString()
            : "N/A"
        }
      />

      {/* 6. Application ID */}
      <InfoCard
        label="Application ID"
        value={admissionData.admissionId || admissionData._id || "N/A"}
      />
    </div>
  );
};

// --- SUB-COMPONENT: Generic Info Card ---
const InfoCard = ({ label, value, isBadge = false }) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>

      {isBadge ? (
        <div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${
              value === "approved"
                ? "bg-green-100 text-green-800"
                : value === "rejected"
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {value || "Pending"}
          </span>
        </div>
      ) : (
        <p
          className="text-gray-900 font-semibold text-sm truncate"
          title={String(value)}
        >
          {value}
        </p>
      )}
    </div>
  );
};

export default AdmissionStatusCard;
