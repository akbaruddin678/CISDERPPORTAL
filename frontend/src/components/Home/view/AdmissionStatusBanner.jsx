export const AdmissionStatusBanner = ({ 
    hasPendingAdmission,
    admissionComplete 
  }) => {
    if (admissionComplete) return null;
  
    return (
      <div className={`mb-6 p-4 rounded-lg ${
        hasPendingAdmission 
          ? "bg-blue-50 border border-blue-200" 
          : "bg-amber-50 border border-amber-200"
      }`}>
        <h3 className="font-medium text-gray-800 mb-1">
          {hasPendingAdmission ? "Admission in Progress" : "Admission Required"}
        </h3>
        <p className="text-sm text-gray-600">
          {hasPendingAdmission 
            ? "Your application is under review." 
            : "Complete your admission to access courses."}
        </p>
      </div>
    );
  };