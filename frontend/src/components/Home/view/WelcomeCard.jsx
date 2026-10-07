import { ActionButton } from "./ActionButton";
import { AdmissionStatusBanner } from "./AdmissionStatusBanner";

export const WelcomeCard = ({
  userName,
  hasPendingAdmission,
  admissionComplete,
  onNavigateToAdmission,
  onLogout,
}) => (
  <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Welcome, {userName || "User"}!
      </h1>
      <p className="text-gray-600 mb-6">
        Manage your university journey from here.
      </p>

      <AdmissionStatusBanner
        hasPendingAdmission={hasPendingAdmission}
        admissionComplete={admissionComplete}
      />

      <div className="flex flex-col space-y-3">
        {!admissionComplete && (
          <ActionButton onClick={onNavigateToAdmission} variant="accent">
            {hasPendingAdmission ? "View Status" : "Start Admission"}
          </ActionButton>
        )}

        <ActionButton onClick={onLogout} variant="secondary">
          Logout
        </ActionButton>
      </div>
    </div>
  </div>
);
