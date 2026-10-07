import { useGetInventoryStatsQuery } from "../api/HrApi";

export const useInventoryDashboardController = () => {
  const { data, isFetching, refetch } = useGetInventoryStatsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const stats = data?.data || {
    totalItemTypes: 0,
    totalUnits: 0,
    assignedUnits: 0,
    lowStockCount: 0,
    activeAssignments: 0,
    byCategory: {},
  };

  return { stats, isLoading: isFetching, refetch };
};
