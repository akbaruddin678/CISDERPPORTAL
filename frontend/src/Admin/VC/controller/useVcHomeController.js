import { useGetVcDashboardStatsQuery } from "../api/vcDashboardApi";
import { useGetFeeAnalyticsQuery } from "../../Dashboard/api/feeAnalyticsApi";

// Quick-glance KPI strip for the VC home page — same pattern as the
// Registrar home's stats row (see Registrar/controller/useRegistrarControllers.js).
// The full breakdown (admission funnel, fee-collection charts, department
// splits) lives on the VC Dashboard page — this is just the headline numbers.
export const useVcHomeController = () => {
  const { data, isFetching } = useGetVcDashboardStatsQuery();
  const { data: feeRes, isFetching: isFeeFetching } = useGetFeeAnalyticsQuery({ month: "ALL" });

  const d = data?.data;
  const stats = {
    totalActiveStudents: d?.university?.totalActiveStudents ?? 0,
    totalStaff: d?.university?.totalStaff ?? 0,
    activeCampaign: d?.admissions?.activeCampaign ?? null,
    collectionRate: feeRes?.data?.kpis?.collectionRate ?? 0,
  };

  return {
    stats,
    isLoading: isFetching || isFeeFetching,
  };
};
