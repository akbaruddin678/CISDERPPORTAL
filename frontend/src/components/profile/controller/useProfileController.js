import React, { useEffect, useMemo } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import {
  useGetMyAdmissionQuery,
  useGetLatestChallanQuery,
} from "../../../components/user-admission/api/admissionApi";
import { useNavigate } from "react-router-dom";

export const useProfileController = () => {
  const { userData, dispatchAuthLogout } = useAuth();
  const navigate = useNavigate();

 
  const {
    data: admissionResponse,
    isLoading: admissionLoading,
    isError: admissionError,
    error: admissionErrorDetail,
  } = useGetMyAdmissionQuery(null, {
    skip: !userData?.id,
  });

  const admissionData = admissionResponse?.data || null;

  
  const queryId = admissionData?._id || userData?.id;

  const {
    data: challanResponse,
    isLoading: challanLoading,
    isError: challanError,
  } = useGetLatestChallanQuery(queryId, {
    skip: !queryId, 
  });

  
  const challanData = useMemo(() => {
    if (!challanResponse?.data) return null;

    const rawData = challanResponse.data;

  
    if (rawData.challans && Array.isArray(rawData.challans)) {
      return rawData.challans[0] || null;
    }

    if (Array.isArray(rawData)) {
      return rawData[0] || null;
    }

    // Case 3: Backend returns a direct object { _id: ..., amount: ... }
    return rawData;
  }, [challanResponse]);

  // 4. Auto-Logout Handler
  useEffect(() => {
    if (admissionErrorDetail?.status === 401) {
      dispatchAuthLogout();
      navigate("/login");
    }
  }, [admissionErrorDetail, dispatchAuthLogout, navigate]);

  const navigateToAdmission = () => navigate("/admission");

  return {
    userData,
    admissionData,
    challanData, // ✅ Now perfectly extracted and passed to ProfileView
    isLoading: admissionLoading || challanLoading,
    isError: admissionError || challanError,
    navigateToAdmission,
  };
};

export default useProfileController;
