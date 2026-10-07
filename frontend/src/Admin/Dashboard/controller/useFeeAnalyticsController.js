import { useState, useEffect, useCallback } from "react";
import {
  useGetFeeAnalyticsQuery,
  useLockMonthAndGenerateReportMutation,
} from "../api/feeAnalyticsApi";
import {
  useGetDepartmentsQuery,
  useGetProgramsQuery,
  useGetTermsQuery,
  useGetSemestersQuery,
} from "../../accountant/api/depsemtermpro";

export const useFeeAnalyticsController = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");

  const [filters, setFilters] = useState({
    month: `${currentYear}-${currentMonth}`,
    departmentId: "ALL",
    programId: "ALL",
    termId: "ALL",
    semesterId: "ALL",
  });

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [previousData, setPreviousData] = useState(null);

  // Fetch filters
  const {
    data: deptRes,
    isLoading: isDeptLoading,
    error: deptError,
  } = useGetDepartmentsQuery();
  const {
    data: progRes,
    isLoading: isProgLoading,
    error: progError,
  } = useGetProgramsQuery();
  const {
    data: termRes,
    isLoading: isTermLoading,
    error: termError,
  } = useGetTermsQuery();
  const {
    data: semRes,
    isLoading: isSemLoading,
    error: semError,
  } = useGetSemestersQuery();

  const departments = deptRes?.data || deptRes || [];
  const programs = progRes?.data || progRes || [];
  const terms = termRes?.data || termRes || [];
  const semesters = semRes?.data || semRes || [];

  const formatMonthForAPI = useCallback((monthStr) => {
    if (!monthStr || monthStr === "ALL" || monthStr === "Current")
      return monthStr;
    const [year, month] = monthStr.split("-");
    return `${month}-${year}`;
  }, []);

  const apiFilters = {
    ...filters,
    month: formatMonthForAPI(filters.month),
  };

  const {
    data: analyticsRes,
    isLoading: isAnalyticsLoading,
    isFetching: isAnalyticsFetching,
    error: analyticsError,
    refetch,
  } = useGetFeeAnalyticsQuery(apiFilters, {
    pollingInterval: 30000,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  const [lockMonth, { isLoading: isLocking }] =
    useLockMonthAndGenerateReportMutation();

  const dashboardData = analyticsRes?.data || {
    kpis: {
      totalExpected: 0,
      totalCollected: 0,
      totalPending: 0,
      totalOverdue: 0,
      collectionRate: 0,
    },
    statusData: [],
    departmentData: [],
    semesterData: [], // ✅ Added to fallback
  };

  useEffect(() => {
    if (!isAnalyticsLoading && dashboardData && dashboardData.kpis) {
      setPreviousData(dashboardData);
    }
  }, [isAnalyticsLoading, dashboardData]);

  const displayData =
    isAnalyticsFetching && previousData && !isAnalyticsLoading
      ? previousData
      : dashboardData;

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      if (key === "departmentId") {
        newFilters.programId = "ALL";
        newFilters.semesterId = "ALL";
      }
      if (key === "programId") {
        newFilters.semesterId = "ALL";
      }
      return newFilters;
    });
  }, []);

  const handleGenerateReport = async () => {
    if (!filters.month) {
      alert("Please select a month before locking.");
      return;
    }
    try {
      const [year, month] = filters.month.split("-");
      const result = await lockMonth({
        targetMonth: filters.month,
        year,
        month,
      }).unwrap();
      alert(
        `✅ Month locked successfully!\n\nOfficial report for ${filters.month} has been generated and saved.\n\n${result?.message || ""}`,
      );
      setIsReportModalOpen(false);
      refetch();
    } catch (err) {
      console.error("Lock month error:", err);
      const errorMessage =
        err?.data?.message ||
        err?.error ||
        err?.message ||
        "Failed to lock month and generate report.";
      alert(`❌ Error: ${errorMessage}`);
    }
  };

  const hasError =
    deptError || progError || termError || semError || analyticsError;
  const errorMessage =
    deptError?.data?.message ||
    progError?.data?.message ||
    termError?.data?.message ||
    semError?.data?.message ||
    analyticsError?.data?.message ||
    "An error occurred while loading data.";

  const isInitialLoading =
    (isAnalyticsLoading && !previousData) ||
    isDeptLoading ||
    isProgLoading ||
    isTermLoading ||
    isSemLoading;

  return {
    filters,
    handleFilterChange,
    departments,
    programs,
    terms,
    semesters,
    data: displayData,
    isLoading: isInitialLoading,
    isFetching: isAnalyticsFetching,
    isReportModalOpen,
    setIsReportModalOpen,
    handleGenerateReport,
    isLocking,
    hasError,
    errorMessage,
    refetch,
  };
};
