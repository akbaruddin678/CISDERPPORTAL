import { useEffect, useMemo, useState } from "react";
import {
  useGetDepartmentsQuery,
  useGetProgramsQuery,
  useGetSemestersQuery,
  useGetSessionsQuery,
} from "../../Admission/services/studentApi";
import { useLazyGetMasterFinancialReportQuery } from "../../accountant/api/studentChallanApi";
import { downloadBlob } from "../../Admission/common/cardFiles";
import { buildMasterFinancialWorkbook } from "../../accountant/common/masterFinancialWorkbook";
import { errorText, useToast } from "../../Graduation/common/graduationHelpers";

const fmtRs = (v) => `Rs ${Number(v || 0).toLocaleString()}`;

// "Each and every thing about account" — the full per-student ledger
// (same data the existing Master Data Excel export is built from, see
// StudentReportController.jsx) rendered as a real, searchable on-screen
// table for the VC, plus the Revenue Explorer drill-down as a second tab.
export const useVcAccountsController = () => {
  const [toast, notify] = useToast();
  const [tab, setTab] = useState("report");

  const { data: deptRes } = useGetDepartmentsQuery();
  const { data: progRes } = useGetProgramsQuery();
  const { data: semRes } = useGetSemestersQuery();
  const { data: sessionRes } = useGetSessionsQuery();
  const departments = deptRes?.data || [];
  const allPrograms = useMemo(() => progRes?.data || [], [progRes]);
  const allSemesters = useMemo(() => semRes?.data || [], [semRes]);
  const sessions = sessionRes?.data || [];

  const [filters, setFilters] = useState({ departmentId: "", programId: "", semesterId: "", termId: "" });
  const idOf = (v) => v?._id || v;
  const programs = useMemo(
    () => (filters.departmentId ? allPrograms.filter((p) => idOf(p.departmentId) === filters.departmentId) : allPrograms),
    [allPrograms, filters.departmentId],
  );
  const semesters = useMemo(
    () => (filters.programId ? allSemesters.filter((s) => idOf(s.programId) === filters.programId) : allSemesters),
    [allSemesters, filters.programId],
  );
  const setFilter = (key, value) =>
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "departmentId") {
        next.programId = "";
        next.semesterId = "";
      }
      if (key === "programId") next.semesterId = "";
      return next;
    });

  const [fetchReport, { data: reportRes, isFetching, error }] = useLazyGetMasterFinancialReportQuery();
  const hasFetched = !!reportRes;
  const runReport = () => {
    setPage(1);
    fetchReport(filters);
  };
  const clearFilters = () => {
    const emptyFilters = { departmentId: "", programId: "", semesterId: "", termId: "" };
    setFilters(emptyFilters);
    setSearch("");
    setPage(1);
    fetchReport(emptyFilters);
  };
  // Auto-run once on first mount with no filters (whole university).
  useEffect(() => {
    fetchReport(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summaryRows = useMemo(() => reportRes?.data?.summaryRows || [], [reportRes]);
  const challanRows = reportRes?.data?.challanRows || [];

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return summaryRows;
    return summaryRows.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) ||
        r.studentId.toLowerCase().includes(q) ||
        r.fatherName.toLowerCase().includes(q),
    );
  }, [summaryRows, search]);
  useEffect(() => setPage(1), [search, reportRes]);
  const pagedRows = useMemo(
    () => filteredRows.slice((page - 1) * pageSize, page * pageSize),
    [filteredRows, page],
  );

  const totals = useMemo(
    () =>
      summaryRows.reduce(
        (acc, r) => ({
          fee: acc.fee + (r.totalFeeGenerated || 0),
          paid: acc.paid + (r.totalPaid || 0),
          outstanding: acc.outstanding + (r.outstanding || 0),
        }),
        { fee: 0, paid: 0, outstanding: 0 },
      ),
    [summaryRows],
  );

  const [isExporting, setIsExporting] = useState(false);
  const handleExport = async () => {
    if (!summaryRows.length) return;
    setIsExporting(true);
    try {
      const blob = await buildMasterFinancialWorkbook(summaryRows, challanRows);
      downloadBlob(blob, `Master_Financial_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch {
      notify("Export failed. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return {
    toast,
    tab,
    setTab,
    departments,
    programs,
    semesters,
    sessions,
    filters,
    setFilter,
    runReport,
    clearFilters,
    search,
    setSearch,
    rows: pagedRows,
    filteredRowCount: filteredRows.length,
    page,
    setPage,
    pageSize,
    totalRowCount: summaryRows.length,
    totals,
    isLoading: isFetching && !hasFetched,
    isFetching,
    errorMessage: error ? errorText(error) : "",
    isExporting,
    handleExport,
    fmtRs,
  };
};
