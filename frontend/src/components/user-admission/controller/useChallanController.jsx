import { useAuth } from "../../auth/context/AuthContext";
import { useGetLatestChallanQuery } from "../../user-admission/api/admissionApi";
import { useNavigate } from "react-router-dom";

export const useChallanController = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  const {
    data: challanData,
    isLoading,
    isError,
    refetch,
  } = useGetLatestChallanQuery(userData?.id, {
    skip: !userData?.id,
  });

  const navigateToChallan = (challanId) => navigate(`/challan/${challanId}`);

  return {
    userData,
    challans: challanData?.data || [], // Ensure array is returned even if undefined
    isLoading,
    isError,
    refetch,
    navigateToChallan,
  };
};
