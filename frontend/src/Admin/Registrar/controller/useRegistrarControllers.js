import { useGetRegistrarDashboardStatsQuery } from "../api/registrarDashboardApi";

export const useRegistrarController = () => {
  const { data, isFetching, isError, error, refetch } = useGetRegistrarDashboardStatsQuery();

  const stats = {
    totalActiveStudents: data?.data?.totalActiveStudents ?? 0,
    pendingAdmissions: data?.data?.pendingAdmissions ?? 0,
    activeCampaign: data?.data?.activeCampaign ?? null,
    pendingClearances: data?.data?.pendingClearances ?? 0,
  };

  return {
    stats,
    isLoading: isFetching,
    isError,
    error,
    refetch,
  };
};
