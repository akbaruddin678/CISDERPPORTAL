import { useState, useEffect } from "react";
import {
  useGetMonthlyFinanceReportQuery,
  useGetFinanceReportsQuery,
} from "../api/studentChallanApi";
import { useGetDepartmentsQuery } from "../api/depsemtermpro";

export const useCOISDashboard = () => {
  const [selectedDept, setSelectedDept] = useState("");

  // 1. AUTO-DETECT COLLEGE DEPARTMENT
  const { data: deptData } = useGetDepartmentsQuery();

  useEffect(() => {
    if (deptData?.data && !selectedDept) {
      const coisDept = deptData.data.find(
        (d) =>
          d.name?.toLowerCase().includes("college") ||
          d.name?.toLowerCase().includes("intermediate") ||
          d.departmentName?.toLowerCase().includes("college"),
      );
      if (coisDept) setSelectedDept(coisDept._id);
      else if (deptData.data.length > 0) setSelectedDept(deptData.data[0]._id);
    }
  }, [deptData, selectedDept]);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // 2. FETCH OVERALL SUMMARY (Current Month)
  // `scope: "college"` — these endpoints default to university-only
  // students unless told otherwise, which silently zeroed out this whole
  // dashboard for every HSSC/College student.
  const { data: monthlyRes, isLoading: loadingMonthly } =
    useGetMonthlyFinanceReportQuery(
      {
        month: currentMonth,
        year: currentYear,
        departmentId: selectedDept,
        excludeType: "hostel",
        scope: "college",
      },
      { skip: !selectedDept },
    );

  // 3. FETCH BREAKDOWN FOR CHARTS (By Semester)
  const { data: semesterReports, isLoading: loadingSemesters } =
    useGetFinanceReportsQuery(
      {
        reportType: "semester",
        departmentId: selectedDept,
        excludeType: "hostel",
        scope: "college",
      },
      { skip: !selectedDept },
    );

  // 4. PARSE SUMMARY DATA
  const monthlyData = monthlyRes?.data || {};
  const summary = monthlyData.summary || {
    totalGeneratedAmount: 0,
    totalCollectedAmount: 0,
    totalPendingAmount: 0,
    paidCount: 0,
    unpaidCount: 0,
    totalChallans: 0,
  };

  // 5. PARSE CHART DATA
  const rawChartData = semesterReports?.data?.reportData || [];
  const chartData = rawChartData.map((item) => ({
    name: item.name || "Unknown",
    Collected: item.totalCollected || 0,
    Pending: item.totalPending || 0,
    Generated: item.totalGenerated || 0,
  }));

  return {
    stats: {
      totalCollected: summary.totalCollectedAmount,
      totalPending: summary.totalPendingAmount,
      totalGenerated: summary.totalGeneratedAmount,
      paidCount: summary.paidCount,
      totalCount: summary.totalChallans,
    },
    chartData,
    currentMonthName: new Date(currentYear, currentMonth - 1).toLocaleString(
      "default",
      { month: "long" },
    ),
    currentYear,
    loading: loadingMonthly || loadingSemesters || !selectedDept,
  };
};
