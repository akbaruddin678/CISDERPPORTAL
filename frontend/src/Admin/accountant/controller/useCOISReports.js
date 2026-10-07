import { useState, useMemo } from "react";
import {
  useGetMonthlyFinanceReportQuery,
  useUpdateFineAndDueDateMutation,
  useLazyGetMasterFinancialReportQuery, // ✅ Import the new lazy query
} from "../api/studentChallanApi";
import {
  useGetOverdueChallansQuery,
  useProcessOverdueChallansMutation,
} from "../api/fineManagementApi";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  buildMasterFinancialWorkbook,
  downloadBlob,
} from "../common/masterFinancialWorkbook";

const formatExportCurrency = (val) => `Rs. ${Number(val || 0).toLocaleString()}`;
const formatExportDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");

const extractArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data?.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
};

export const useCOISReports = () => {
  const { openAlert } = useGlobalAlert();
  const currentDate = new Date();

  const [activeTab, setActiveTab] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  // Fee-type filter for the Monthly Report table — "all" or one of the
  // categories the backend already tags each challan with (ACADEMIC, EXAM,
  // ADMISSION, etc.). This was entirely missing before — the table showed
  // a "Fee Type" column with no way to actually filter by it, so seeing
  // just Tuition-only or Exam-only records meant scrolling/scanning the
  // whole month by hand.
  const [selectedType, setSelectedType] = useState("all");
  // Session (termId name) and Program filters — same missing-filter gap as
  // Type: the table already showed a Session/Program per row, with no way
  // to actually narrow by either one.
  const [selectedSession, setSelectedSession] = useState("all");
  const [selectedProgram, setSelectedProgram] = useState("all");

  // Both reports below used to be gated behind `selectedDept` — an
  // auto-guessed single Department resolved by matching its name against
  // "college"/"intermediate" (falling back to whatever the FIRST
  // department in the whole system happened to be if no match was found).
  // If that guess was wrong, empty, or just slow to resolve, NOTHING
  // loaded — the month filter looked broken because there was a silent,
  // unrelated precondition blocking it. `scope: "college"` (the same
  // Program-level HSSC filter already proven correct everywhere else in
  // this module — Fee Setup, Installment, Challan Generation) is the real,
  // reliable way to scope this data, so both queries now use that alone
  // and load immediately.
  const { data: monthlyRes, isLoading: loadingMonthly } =
    useGetMonthlyFinanceReportQuery({
      month: selectedMonth,
      year: selectedYear,
      excludeType: "hostel",
      scope: "college",
    });

  // A generous explicit limit — this endpoint's backend default (10) was
  // silently capping the Overdue Challans list at 10 records with no
  // pagination in this UI to see the rest, while the "N defaulters" badge
  // still read that same capped array's length instead of the real total
  // the backend already computes separately.
  const {
    data: overdueRes,
    isLoading: loadingOverdue,
    refetch: refetchOverdue,
  } = useGetOverdueChallansQuery(
    { scope: "college", limit: 500 },
    { refetchOnMountOrArgChange: true },
  );

  const [processOverdue, { isLoading: isProcessingFines }] =
    useProcessOverdueChallansMutation();
  const [updateFineAndDate, { isLoading: isUpdatingFine }] =
    useUpdateFineAndDueDateMutation();

  // ✅ NEW: Master Report Lazy Query
  const [fetchMasterReport, { isFetching: isMasterExporting }] =
    useLazyGetMasterFinancialReportQuery();

  const monthlyData = monthlyRes?.data || {};
  const rawDetails = useMemo(
    () => monthlyData.details || [],
    [monthlyData.details],
  );

  const typeOptions = useMemo(
    () =>
      Array.from(new Set(rawDetails.map((d) => d.type).filter(Boolean))).sort(),
    [rawDetails],
  );
  const sessionOptions = useMemo(
    () =>
      Array.from(
        new Set(rawDetails.map((d) => d.session).filter(Boolean)),
      ).sort(),
    [rawDetails],
  );
  const programOptions = useMemo(
    () =>
      Array.from(
        new Set(rawDetails.map((d) => d.program).filter(Boolean)),
      ).sort(),
    [rawDetails],
  );

  const details = useMemo(
    () =>
      rawDetails.filter(
        (d) =>
          (selectedType === "all" || d.type === selectedType) &&
          (selectedSession === "all" || d.session === selectedSession) &&
          (selectedProgram === "all" || d.program === selectedProgram),
      ),
    [rawDetails, selectedType, selectedSession, selectedProgram],
  );

  // Recomputed from the currently-filtered `details` (not the raw backend
  // summary, which always reflects the whole month regardless of the Type
  // filter) — so the stat cards above the table actually change when the
  // filter changes, instead of silently staying fixed on the unfiltered
  // total while the table below them updates. Same fix already applied to
  // the University's Monthly Challan Report for the identical reason.
  const summary = useMemo(
    () =>
      details.reduce(
        (acc, c) => {
          acc.totalGeneratedAmount += c.netAmount || 0;
          acc.totalCollectedAmount += c.paidAmount || 0;
          acc.totalPendingAmount += c.balance || 0;
          if (c.status === "paid") acc.paidCount += 1;
          else acc.unpaidCount += 1;
          return acc;
        },
        {
          totalGeneratedAmount: 0,
          totalCollectedAmount: 0,
          totalPendingAmount: 0,
          paidCount: 0,
          unpaidCount: 0,
        },
      ),
    [details],
  );
  const overdueList = extractArray(overdueRes);
  // The real total count, independent of the `limit` the list itself was
  // capped at — falls back to the visible list's length only if the
  // backend response shape is ever missing `pagination` (defensive, not
  // expected in normal operation).
  const overdueTotal = overdueRes?.pagination?.total ?? overdueList.length;
  const periodName =
    monthlyData.period?.monthName ||
    new Date(selectedYear, selectedMonth - 1).toLocaleString("default", {
      month: "long",
    });

  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, i) => 2024 + i),
    [],
  );
  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const handleUpdateOverdue = async (id, fineAmount, dueDate) => {
    try {
      await updateFineAndDate({
        id,
        fineAmount: Number(fineAmount),
        dueDate,
      }).unwrap();
      openAlert({
        message: "Challan updated successfully!",
        severity: "success",
      });
      refetchOverdue();
      return true;
    } catch (e) {
      openAlert({
        message: e.data?.message || "Failed to update challan",
        severity: "error",
      });
      return false;
    }
  };

  const handleProcessFines = async () => {
    if (
      !window.confirm(
        "Scan all unpaid challans and automatically apply late fines?",
      )
    )
      return;
    try {
      await processOverdue().unwrap();
      openAlert({ message: "Overdue fines processed!", severity: "success" });
      refetchOverdue();
    } catch (error) {
      openAlert({
        message: error?.data?.message || "Failed to process fines.",
        severity: "error",
      });
    }
  };

  // Same Master Data report design as the University portal — built from
  // the shared workbook builder (styled Student Summary + Installment
  // Schedule + All Challans sheets) instead of a College-only flat dump.
  const handleExportMasterExcel = async () => {
    try {
      openAlert({
        message: "Generating Master Data Report. This may take a moment...",
        severity: "info",
      });
      const res = await fetchMasterReport({
        // The backend's default scope excludes HSSC/College programs
        // entirely — without this, every College student query returns
        // zero rows regardless of department/program filters. This alone
        // (not a specific departmentId) is what correctly scopes the
        // export to College students, matching every other COIS query.
        scope: "college",
        // The backend now defaults to Tuition-only when feeTypes is
        // omitted; a Master Data export is meant to cover every fee type.
        feeTypes: "tuition,admission,exam,misc",
      }).unwrap();
      const { summaryRows = [], challanRows = [] } = res?.data || {};

      if (summaryRows.length === 0)
        return openAlert({
          message: "No data found for Master Report.",
          severity: "warning",
        });

      const blob = await buildMasterFinancialWorkbook(summaryRows, challanRows);
      downloadBlob(
        blob,
        `COIS_Master_Financial_Report_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      openAlert({
        message: "Master Report Downloaded Successfully!",
        severity: "success",
      });
    } catch {
      openAlert({
        message: "Failed to generate Master Report",
        severity: "error",
      });
    }
  };

  // These were previously empty stubs — the Export Excel/PDF buttons in
  // the Reports tab rendered and were clickable but did nothing at all.
  // Built client-side (xlsx / jsPDF, dynamically imported), matching the
  // exact same pattern already used for the University's Monthly Challan
  // Report — there is no backend "/api/reports" export route.
  const handleExportExcel = async () => {
    if (!details || details.length === 0) {
      openAlert({ message: "No data to export.", severity: "warning" });
      return;
    }
    const XLSX = await import("xlsx");
    const exportData = details.map((row) => ({
      "Challan No": row.challanNo,
      "Student Name": row.studentName,
      "Father Name": row.fatherName,
      "Registration No": row.studentRegNo,
      Program: row.program,
      Department: row.department,
      Session: row.session,
      Semester: row.semester,
      "Fee Type": row.type,
      "Base Fee (PKR)": row.originalAmount || 0,
      "Fine (PKR)": row.fineAmount || 0,
      "Net Amount (PKR)": row.netAmount || 0,
      "Paid Amount (PKR)": row.paidAmount || 0,
      "Balance (PKR)": row.balance || 0,
      "Due Date": formatExportDate(row.dueDate),
      "Paid On": formatExportDate(row.paidAt),
      Status: row.status?.toUpperCase() || "UNKNOWN",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "COIS Monthly Report");
    XLSX.writeFile(
      wb,
      `COIS_Monthly_Report_${periodName}_${selectedYear}.xlsx`,
    );
  };

  const handleExportPDF = async () => {
    if (!details || details.length === 0) {
      openAlert({ message: "No data to export.", severity: "warning" });
      return;
    }
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "landscape", format: "a4" });
    doc.setFontSize(15);
    doc.text(
      `COIS Monthly Finance Report - ${periodName} ${selectedYear}`,
      10,
      15,
    );
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(
      `Generated: ${formatExportCurrency(summary.totalGeneratedAmount)}  |  Collected: ${formatExportCurrency(summary.totalCollectedAmount)}  |  Pending: ${formatExportCurrency(summary.totalPendingAmount)}`,
      10,
      22,
    );

    autoTable(doc, {
      startY: 28,
      head: [
        [
          "Challan No",
          "Student / Reg",
          "Program",
          "Type",
          "Net Amount",
          "Paid",
          "Balance",
          "Due Date",
          "Status",
        ],
      ],
      body: details.map((row) => [
        row.challanNo,
        `${row.studentName}\n(${row.studentRegNo})`,
        row.program,
        row.type,
        formatExportCurrency(row.netAmount),
        formatExportCurrency(row.paidAmount),
        formatExportCurrency(row.balance),
        formatExportDate(row.dueDate),
        row.status?.toUpperCase() || "-",
      ]),
      theme: "striped",
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      columnStyles: {
        4: { halign: "right" },
        5: { halign: "right", textColor: [21, 128, 61] },
        6: { halign: "right", textColor: [185, 28, 28] },
      },
    });

    doc.save(`COIS_Monthly_Report_${periodName}_${selectedYear}.pdf`);
  };

  return {
    activeTab,
    setActiveTab,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    selectedType,
    setSelectedType,
    typeOptions,
    selectedSession,
    setSelectedSession,
    sessionOptions,
    selectedProgram,
    setSelectedProgram,
    programOptions,
    yearOptions,
    monthOptions,
    summary,
    details,
    overdueList,
    overdueTotal,
    periodName,
    isLoading: loadingMonthly || loadingOverdue,
    isUpdatingFine,
    isProcessingFines,
    isMasterExporting, // ✅ Added exporting state
    handleUpdateOverdue,
    handleProcessFines,
    handleExportExcel,
    handleExportPDF,
    handleExportMasterExcel, // ✅ Added handler
  };
};
