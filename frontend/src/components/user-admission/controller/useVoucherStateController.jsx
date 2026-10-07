import { useGetMyVoucherQuery } from "../../user-admission/api/admissionApi";

export const useVoucherStateController = () => {
  const { data, isLoading, isError, refetch } = useGetMyVoucherQuery();

  return {
    voucher: data?.voucher,
    isLoading,
    isError,
    refetch,
  };
};
