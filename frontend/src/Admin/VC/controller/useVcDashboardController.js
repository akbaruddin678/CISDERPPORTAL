import { useMemo } from "react";
import { useGetVcDashboardStatsQuery } from "../api/vcDashboardApi";
import { useGetFeeAnalyticsQuery } from "../../Dashboard/api/feeAnalyticsApi";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

// The Vice Chancellor's real executive dashboard: everything the /vc/dashboard
// tile used to just... not show (it pointed back at the tile grid itself).
// Pulls two already-real, already-used data sources and shapes them for the
// view — no numbers are invented here:
//   - /api/vc/dashboard-stats (new, admission funnel + university headcounts
//     + what's waiting on the VC's desk)
//   - /api/fee-analytics (existing, the same source the Accountant/Viewer
//     fee analytics screen uses, university-wide, all-time)
export const useVcDashboardController = () => {
  const {
    data: vcRes,
    isFetching: isVcFetching,
    error: vcError,
    refetch: refetchVc,
  } = useGetVcDashboardStatsQuery();
  const {
    data: feeRes,
    isFetching: isFeeFetching,
    error: feeError,
    refetch: refetchFee,
  } = useGetFeeAnalyticsQuery({ month: "ALL" });

  const vc = vcRes?.data;
  const fee = feeRes?.data;

  const university = {
    totalActiveStudents: vc?.university?.totalActiveStudents ?? 0,
    totalGraduatedStudents: vc?.university?.totalGraduatedStudents ?? 0,
    totalStaff: vc?.university?.totalStaff ?? 0,
    totalDepartments: vc?.university?.totalDepartments ?? 0,
    totalPrograms: vc?.university?.totalPrograms ?? 0,
  };

  const admissions = {
    draft: vc?.admissions?.draft ?? 0,
    submitted: vc?.admissions?.submitted ?? 0,
    underReview: vc?.admissions?.underReview ?? 0,
    rejected: vc?.admissions?.rejected ?? 0,
    acceptedAwaitingChallan: vc?.admissions?.acceptedAwaitingChallan ?? 0,
    challanGenerated: vc?.admissions?.challanGenerated ?? 0,
    feePaid: vc?.admissions?.feePaid ?? 0,
    feeOverdue: vc?.admissions?.feeOverdue ?? 0,
    activeCampaign: vc?.admissions?.activeCampaign ?? null,
  };

  const recentAdmissions = useMemo(
    () =>
      (vc?.admissions?.recent || []).map((a) => ({
        ...a,
        appliedAtLabel: fmtDate(a.appliedAt),
      })),
    [vc],
  );

  const pendingActions = {
    marksAwaitingVcApproval: vc?.pendingActions?.marksAwaitingVcApproval ?? 0,
    graduationClearancesInProgress: vc?.pendingActions?.graduationClearancesInProgress ?? 0,
  };

  const studentsByDepartment = vc?.studentsByDepartment || [];

  const feeKpis = {
    totalExpected: fee?.kpis?.totalExpected ?? 0,
    totalCollected: fee?.kpis?.totalCollected ?? 0,
    totalPending: fee?.kpis?.totalPending ?? 0,
    totalOverdue: fee?.kpis?.totalOverdue ?? 0,
    collectionRate: fee?.kpis?.collectionRate ?? 0,
  };
  const feeDepartmentData = fee?.departmentData || [];
  const feeMonthlyTrend = fee?.monthlyTrend || [];

  const isLoading = (isVcFetching && !vc) || (isFeeFetching && !fee);
  const errorMessage = vcError || feeError ? "Some dashboard data couldn't be loaded. Please refresh." : "";

  const refetch = () => {
    refetchVc();
    refetchFee();
  };

  return {
    isLoading,
    isFetching: isVcFetching || isFeeFetching,
    errorMessage,
    refetch,
    university,
    studentsByDepartment,
    admissions,
    recentAdmissions,
    pendingActions,
    feeKpis,
    feeDepartmentData,
    feeMonthlyTrend,
  };
};
