import { useParams } from "react-router-dom";
import { useGetLatestChallanQuery } from "../api/admissionApi";
import { useAuth } from "../../auth/context/AuthContext";

export const useChallanDetailController = () => {
  const { id } = useParams();
  const { userData } = useAuth();

  // Get the specific challan from cached list
  const {
    data: challanData,
    isLoading,
    isError,
    refetch,
  } = useGetLatestChallanQuery(userData?.id, {
    skip: !userData?.id, // Skip if no user ID
  });
  const challan = challanData?.data?.find((c) => c._id === id);
  return {
    challan,
    isLoading,
    isError,
    notFound: !isLoading && !challan, // Flag for 404 state
  };
};
