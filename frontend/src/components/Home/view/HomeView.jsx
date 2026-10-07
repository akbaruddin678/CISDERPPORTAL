import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import { WelcomeCard } from "./WelcomeCard";

const HomeView = () => {
  const { dispatchAuthLogout, userData } = useAuth();
  const navigate = useNavigate();

  // Mock status - replace with real hook
  const admissionStatus = {
    hasPendingAdmission: false,
    admissionComplete: false,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <WelcomeCard
        userName={userData?.name}
        {...admissionStatus}
        onNavigateToAdmission={() => navigate("/admission")}
        onLogout={dispatchAuthLogout}
      />
    </div>
  );
};

export default HomeView;
