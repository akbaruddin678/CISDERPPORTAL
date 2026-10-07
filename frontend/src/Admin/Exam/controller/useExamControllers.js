import { useMemo } from "react";
import { useGetDashboardStatsQuery } from "../api/examApi";

const formatExamDate = (date) =>
  date
    ? new Date(date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    : "TBD";

export const useExamController = () => {
  const { data, isFetching, isError, error, refetch } = useGetDashboardStatsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const raw = data?.data;

  const stats = useMemo(
    () => ({
      totalExams: raw?.totalExams ?? 0,
      publishedExams: raw?.publishedExams ?? 0,
      draftExams: raw?.draftExams ?? 0,
      upcomingExams: raw?.upcomingExams ?? 0,
      totalStudents: raw?.totalStudents ?? 0,
      activeAdmitCards: raw?.activeAdmitCards ?? 0,
      openUfmCount: raw?.openUfmCount ?? 0,
      pendingReEvaluationCount: raw?.pendingReEvaluationCount ?? 0,
    }),
    [raw],
  );

  const upcomingExamsList = useMemo(
    () =>
      (raw?.upcomingExamsList || []).map((exam) => ({
        id: exam._id,
        title: `${exam.courseId?.code || ""} — ${exam.courseId?.title || "Untitled Course"}`,
        type: exam.type,
        dateLabel: formatExamDate(exam.date),
        department: exam.departmentId?.name || "",
        program: exam.programId?.name || "",
      })),
    [raw],
  );

  const actionItems = useMemo(() => {
    const items = [];
    if (stats.openUfmCount > 0) {
      items.push({
        key: "ufm",
        label: `${stats.openUfmCount} unresolved UFM case${stats.openUfmCount === 1 ? "" : "s"}`,
        path: "/exam/ufm",
      });
    }
    if (stats.pendingReEvaluationCount > 0) {
      items.push({
        key: "reeval",
        label: `${stats.pendingReEvaluationCount} pending re-evaluation appeal${stats.pendingReEvaluationCount === 1 ? "" : "s"}`,
        path: "/exam/appeals",
      });
    }
    if (stats.draftExams > 0) {
      items.push({
        key: "drafts",
        label: `${stats.draftExams} exam${stats.draftExams === 1 ? "" : "s"} still in draft — not visible to teachers`,
        path: "/exam/create",
      });
    }
    return items;
  }, [stats]);

  return {
    stats,
    upcomingExamsList,
    actionItems,
    isLoading: isFetching,
    isError,
    error,
    refetch,
  };
};
