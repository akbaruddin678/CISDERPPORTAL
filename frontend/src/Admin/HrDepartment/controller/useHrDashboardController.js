import { useMemo } from "react";
import { useGetHrDashboardStatsQuery } from "../api/HrApi";

export const useHrDashboardController = () => {
  const { data, isFetching, isError, error, refetch } = useGetHrDashboardStatsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const stats = useMemo(
    () => ({
      activeEmployees: data?.data?.activeEmployees ?? 0,
      totalEmployeeRecords: data?.data?.totalEmployeeRecords ?? 0,
      onLeaveToday: data?.data?.onLeaveToday ?? 0,
      pendingLeaveReviews: data?.data?.pendingLeaveReviews ?? 0,
      openJobPostings: data?.data?.openJobPostings ?? 0,
      expiringSoonCount: data?.data?.expiringSoonCount ?? 0,
    }),
    [data],
  );

  const departmentBreakdown = useMemo(() => data?.data?.departmentBreakdown ?? [], [data]);
  const employmentTypeBreakdown = useMemo(
    () => data?.data?.employmentTypeBreakdown ?? [],
    [data],
  );

  const actionItems = useMemo(() => {
    const items = [];
    if (stats.pendingLeaveReviews > 0) {
      items.push({
        key: "pending-leaves",
        label: `${stats.pendingLeaveReviews} leave request${stats.pendingLeaveReviews === 1 ? "" : "s"} awaiting HR review`,
        path: "/hr/leaves",
      });
    }
    if (stats.expiringSoonCount > 0) {
      items.push({
        key: "expiring-contracts",
        label: `${stats.expiringSoonCount} contract${stats.expiringSoonCount === 1 ? "" : "s"} expiring within 30 days`,
        path: "/hr/employees",
      });
    }
    return items;
  }, [stats.expiringSoonCount, stats.pendingLeaveReviews]);

  return {
    stats,
    departmentBreakdown,
    employmentTypeBreakdown,
    actionItems,
    isLoading: isFetching,
    isError,
    error,
    refetch,
  };
};
