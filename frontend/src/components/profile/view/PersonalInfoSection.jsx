import React from "react";

export const PersonalInfoSection = ({ data }) => (
  <section className="mb-8">
    <h3 className="text-xl font-semibold text-indigo-700 mb-4 pb-2 border-b border-indigo-100">
      Personal Information
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <InfoField label="Full Name" value={data.fullName} />
      {/* <InfoField label="Semester No" value={data.semesterNo} /> */}
      {/* <InfoField label="Registration No" value={data.registrationNumber} /> */}
      <InfoField label="CNIC" value={data.cnic} />
      <InfoField label="Phone" value={data.phone} />
      <InfoField
        label="Date of Birth"
        value={
          data.dob ? new Date(data.dob).toLocaleDateString() : "Not provided"
        }
      />

      <InfoField label="Current Address" value={data.currentAddress} />
      <InfoField label="Permanent Address" value={data.permanentAddress} />

      <InfoField label="Current Country" value={data.currentCountry} />
      <InfoField label="Permanent Country" value={data.permanentCountry} />

      <InfoField label="Current District" value={data.currentDistrict} />
      <InfoField label="Permanent District" value={data.permanentDistrict} />

      <InfoField label="Current Province" value={data.currentProvince} />
      <InfoField label="Permanent Province" value={data.permanentProvince} />
    </div>

    <h3 className="text-xl font-semibold text-indigo-700 mb-4 pb-2 border-b border-indigo-100">
      Family Information
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <InfoField label="Father Name" value={data.fatherName} />
      <InfoField label="Father CNIC" value={data.fathernic} />
      <InfoField label="Father Status" value={data.guardianStatus} />
      <InfoField label="Guardian Phone" value={data.guardianPhone} />
      <InfoField
        label="Father/Guardian Profession"
        value={data.fathersProfession}
      />
      <InfoField
        label="Guardian Designation"
        value={data.guardianDesignation}
      />
    </div>

    <h3 className="text-xl font-semibold text-indigo-700 mb-4 pb-2 border-b border-indigo-100">
      Family Income
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <InfoField label="Family Income " value={data.incomeBracket} />
    </div>
  </section>
);

// Enhanced helper component
const InfoField = ({ label, value }) => (
  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 transition-colors hover:bg-indigo-50">
    <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-1">
      {label}
    </p>
    <p className="font-medium text-gray-800 truncate">
      {value || "Not provided"}
    </p>
  </div>
);
