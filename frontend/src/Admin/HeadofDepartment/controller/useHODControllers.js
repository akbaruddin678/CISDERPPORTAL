import { useMemo } from "react";
import { useGetHodDashboardStatsQuery } from "../api/hodDashboardApi";

export const useHODController = () => {
  const { data, isFetching, refetch } = useGetHodDashboardStatsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const raw = data?.data;

  const stats = useMemo(
    () => ({
      pendingMarksCount: raw?.pendingMarksCount ?? 0,
      pendingAttendanceCount: raw?.pendingAttendanceCount ?? 0,
      pendingUfmCount: raw?.pendingUfmCount ?? 0,
      pendingReEvalCount: raw?.pendingReEvalCount ?? 0,
      departmentCourseCount: raw?.departmentCourseCount ?? 0,
      departmentStudentCount: raw?.departmentStudentCount ?? 0,
    }),
    [raw],
  );

  const actionItems = useMemo(() => {
    const items = [];
    if (stats.pendingMarksCount > 0) {
      items.push({
        key: "marks",
        label: `${stats.pendingMarksCount} marks submission${stats.pendingMarksCount === 1 ? "" : "s"} awaiting your review`,
        path: "/hod/approve-marks",
      });
    }
    if (stats.pendingAttendanceCount > 0) {
      items.push({
        key: "attendance",
        label: `${stats.pendingAttendanceCount} attendance submission${stats.pendingAttendanceCount === 1 ? "" : "s"} awaiting your review`,
        path: "/hod/approve-attendance",
      });
    }
    if (stats.pendingUfmCount > 0) {
      items.push({
        key: "ufm",
        label: `${stats.pendingUfmCount} open UFM case${stats.pendingUfmCount === 1 ? "" : "s"}`,
        path: "/hod/approve-ufm",
      });
    }
    if (stats.pendingReEvalCount > 0) {
      items.push({
        key: "reeval",
        label: `${stats.pendingReEvalCount} pending re-evaluation appeal${stats.pendingReEvalCount === 1 ? "" : "s"}`,
        path: "/hod/approve-appeals",
      });
    }
    return items;
  }, [stats]);

  return {
    stats,
    actionItems,
    isLoading: isFetching,
    refetch,
  };
};
