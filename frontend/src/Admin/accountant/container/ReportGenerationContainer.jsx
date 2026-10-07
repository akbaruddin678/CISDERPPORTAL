import React, { useState, useMemo} from "react";
import {
  BarChart3,
  Download,
  Filter,
  FileText,
  Printer,
  TrendingUp,
  CreditCard,
  AlertCircle,
  RefreshCcw,
  Loader2,
  PieChart as PieIcon,
  Maximize2,
  ArrowLeft,
  LayoutDashboard,
  TableProperties,
  ChevronDown,
  Calendar,
  Check,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Make sure these paths map correctly to your local project structure
import { useGetFinanceReportsQuery } from "../api/studentChallanApi";
import { useGetTermsQuery } from "../api/depsemtermpro";
import ReportGenerationView from "../view/ReportGenerationView";

const ReportGenerationContainer = () => {
  const [filters, setFilters] = useState({
    reportType: "program",
    termId: "",
    category: [], // ✅ Always an array to hold multiple selections
    month: "",
    scope: "university", // "university" | "college"
  });

  const cleanFilters = useMemo(() => {
    const result = {};
    if (filters.reportType) result.reportType = filters.reportType;
    if (filters.termId) result.termId = filters.termId;
    if (filters.month) result.month = filters.month;
    // Scope is intentionally NOT included here — it's applied separately
    // below for each of the two scoped queries (University/College), since
    // exports need both at once regardless of which one is on screen.

    if (filters.category && filters.category.length > 0) {
      let expandedCategories = [...filters.category];

      // ✅ 1. Expand "ACADEMIC" to cover both TUITION and INSTALLMENT seamlessly
      if (expandedCategories.includes("ACADEMIC")) {
        expandedCategories.push("TUITION", "INSTALLMENT");
      }

      // ✅ 2. Expand "HOSTEL" to cover all hostel-related fees seamlessly
      if (expandedCategories.includes("HOSTEL")) {
        expandedCategories.push(
          "HOSTEL_ADMISSION",
          "HOSTEL ADMISSION",
          "HOSTEL FEE",
        );
      }

      // Add all known variants here so the backend can exclude them properly
      const knownCategories = [
        "TUITION",
        "ADMISSION",
        "READMISSION",
        "EXAM",
        "MISC",
        "HOSTEL",
        "HOSTEL_ADMISSION",
        "HOSTEL ADMISSION",
        "HOSTEL FEE",
        "INSTALLMENT",
        "ACADEMIC",
        "GENERAL",
        "LATE_FEE",
        "FINE",
        "TRANSPORT",
        "SPORTS",
        "LIBRARY",
        "LAB",
      ];

      // ✅ 3. Find everything the user DID NOT select
      const toExclude = knownCategories.filter(
        (cat) => !expandedCategories.includes(cat),
      );

      // ✅ 4. Apply the Exclusion Hack so it works flawlessly with the backend
      if (toExclude.length > 0) {
        result.excludeType = toExclude.map((cat) => `^${cat}$`).join("|");
      }
    }
    return result;
  }, [filters]);

  // Both scopes are always fetched (not just whichever the toggle shows)
  // so PDF/Excel exports can combine University + College into one report
  // on demand, without needing an extra round-trip when the user clicks
  // export.
  const universityQueryParams = useMemo(
    () => ({ ...cleanFilters, scope: "university" }),
    [cleanFilters],
  );
  const collegeQueryParams = useMemo(
    () => ({ ...cleanFilters, scope: "college" }),
    [cleanFilters],
  );

  const { data: universityRes, isFetching: isFetchingUniversity } =
    useGetFinanceReportsQuery(universityQueryParams);
  const { data: collegeRes, isFetching: isFetchingCollege } =
    useGetFinanceReportsQuery(collegeQueryParams);

  const { data: termsRes } = useGetTermsQuery();

  const emptySummary = { totalRevenue: 0, totalReceivable: 0, totalPending: 0 };

  const universityReportData = universityRes?.data?.reportData || [];
  const universitySummary = universityRes?.data?.summary || emptySummary;
  const collegeReportData = collegeRes?.data?.reportData || [];
  const collegeSummary = collegeRes?.data?.summary || emptySummary;

  // On-screen dashboard/table still follows the University/College toggle
  // — only the exports combine both at once.
  const isCollegeScope = filters.scope === "college";
  const reportData = isCollegeScope ? collegeReportData : universityReportData;
  const summary = isCollegeScope ? collegeSummary : universitySummary;
  const isFetching = isCollegeScope ? isFetchingCollege : isFetchingUniversity;

  const terms = termsRes?.data || [];

  // ✅ Added HOSTEL to options
  const feeCategoryOptions = [
    { value: "ACADEMIC", label: "Academic Fee" },
    { value: "ADMISSION", label: "Admission Fee" },
    { value: "READMISSION", label: "Re-Admission Fee" },
    { value: "EXAM", label: "Exam Fee" },
    { value: "HOSTEL", label: "Hostel Fee" },
    { value: "MISC", label: "Miscellaneous Fee" },
  ];

  const monthOptions = useMemo(() => {
    const months = [];
    const startYear = 2026;
    const startMonth = 2; // 0-indexed: 2 is March

    for (let i = 0; i < 36; i++) {
      const d = new Date(startYear, startMonth + i, 1);
      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, "0");
      months.push({
        value: `${year}-${monthNum}`,
        label: d.toLocaleString("en-US", { month: "long", year: "numeric" }),
      });
    }
    return months;
  }, []);

  // --- HANDLERS ---
  const handleResetFilters = () => {
    setFilters({
      reportType: "program",
      termId: "",
      category: [],
      month: "",
      scope: "university",
    });
  };

  // Shared by both exports — one place computing University/College/Combined
  // totals so the numbers in the Excel and PDF reports can never disagree.
  const sectionTotals = (rows) =>
    rows.reduce(
      (acc, r) => ({
        totalChallans: acc.totalChallans + (r.totalChallans || 0),
        paidCount: acc.paidCount + (r.paidCount || 0),
        unpaidCount: acc.unpaidCount + (r.unpaidCount || 0),
        totalGenerated: acc.totalGenerated + (r.totalGenerated || 0),
        totalCollected: acc.totalCollected + (r.totalCollected || 0),
        totalPending: acc.totalPending + (r.totalPending || 0),
      }),
      { totalChallans: 0, paidCount: 0, unpaidCount: 0, totalGenerated: 0, totalCollected: 0, totalPending: 0 },
    );

  const recoveryPct = (t) =>
    t.totalGenerated > 0 ? Math.round((t.totalCollected / t.totalGenerated) * 100 * 100) / 100 : 0;

  const handleExportExcel = () => {
    if (universityReportData.length === 0 && collegeReportData.length === 0) {
      return alert("No data to export");
    }

    const uniTotals = sectionTotals(universityReportData);
    const colTotals = sectionTotals(collegeReportData);
    const grandTotals = sectionTotals([...universityReportData, ...collegeReportData]);

    const rowToExcel = (type, item) => ({
      Type: type,
      "Category Name": item.name || "Unknown",
      "Total Invoices": item.totalChallans,
      "Paid Count": item.paidCount,
      "Unpaid Count": item.unpaidCount,
      "Total Generated (PKR)": item.totalGenerated,
      "Total Collected (PKR)": item.totalCollected,
      "Total Pending (PKR)": item.totalPending,
      "Recovery Rate (%)":
        item.totalGenerated > 0
          ? ((item.totalCollected / item.totalGenerated) * 100).toFixed(2)
          : 0,
    });

    const subtotalToExcel = (type, label, totals) => ({
      Type: type,
      "Category Name": label,
      "Total Invoices": totals.totalChallans,
      "Paid Count": totals.paidCount,
      "Unpaid Count": totals.unpaidCount,
      "Total Generated (PKR)": totals.totalGenerated,
      "Total Collected (PKR)": totals.totalCollected,
      "Total Pending (PKR)": totals.totalPending,
      "Recovery Rate (%)": recoveryPct(totals),
    });

    const excelData = [
      ...universityReportData.map((item) => rowToExcel("University", item)),
      subtotalToExcel("University", "UNIVERSITY SUBTOTAL", uniTotals),
      ...collegeReportData.map((item) => rowToExcel("College", item)),
      subtotalToExcel("College", "COLLEGE SUBTOTAL", colTotals),
      subtotalToExcel("Combined", "GRAND TOTAL (University + College)", grandTotals),
    ];

    const ws = XLSX.utils.json_to_sheet(excelData);
    const colWidths = [12, 26, 14, 12, 13, 20, 20, 18, 16];
    ws["!cols"] = colWidths.map((width) => ({ wch: width }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Combined Financial Report");

    XLSX.writeFile(
      wb,
      `Finance_Report_Combined_${filters.reportType}_${filters.month || "All"}.xlsx`,
    );
  };

  const handleExportPDF = () => {
    if (universityReportData.length === 0 && collegeReportData.length === 0) {
      return alert("No data to export");
    }

    const uniTotals = sectionTotals(universityReportData);
    const colTotals = sectionTotals(collegeReportData);
    const grandTotals = sectionTotals([...universityReportData, ...collegeReportData]);
    const overallRecovery = recoveryPct(grandTotals);

    const doc = new jsPDF("landscape");
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(20);
    doc.setTextColor(30, 58, 138);
    doc.text("CISD", pageWidth / 2, 18, {
      align: "center",
      fontStyle: "bold",
    });

    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Combined Financial Summary Report (University + College) - ${filters.reportType.toUpperCase()} WISE`,
      pageWidth / 2,
      28,
      { align: "center" },
    );

    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    let metaText = `Generated: ${new Date().toLocaleDateString()} | Type: ${filters.reportType}`;

    // ✅ Export PDF shows correctly mapped multiple categories
    if (filters.category?.length > 0) {
      metaText += ` | Categories: ${filters.category
        .map((c) => feeCategoryOptions.find((o) => o.value === c)?.label || c)
        .join(", ")}`;
    }

    if (filters.month) {
      metaText += ` | Month: ${monthOptions.find((m) => m.value === filters.month)?.label}`;
    }
    doc.text(metaText, 14, 36);

    doc.setFillColor(230, 240, 250);
    doc.setDrawColor(200, 210, 230);
    doc.rect(14, 40, pageWidth - 28, 18, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);

    const summaryItems = [
      `Total Receivable: PKR ${grandTotals.totalGenerated.toLocaleString()}`,
      `Total Collected: PKR ${grandTotals.totalCollected.toLocaleString()}`,
      `Total Pending: PKR ${grandTotals.totalPending.toLocaleString()}`,
      `Recovery: ${overallRecovery}%`,
    ];

    const itemWidth = (pageWidth - 28) / summaryItems.length;
    summaryItems.forEach((item, idx) =>
      doc.text(item, 20 + idx * itemWidth, 50),
    );

    // University vs College vs Combined — quick side-by-side comparison
    // above the full detailed breakdown below.
    autoTable(doc, {
      startY: 62,
      head: [["Scope", "Generated (PKR)", "Collected (PKR)", "Pending (PKR)", "Recovery %"]],
      body: [
        ["University", uniTotals.totalGenerated.toLocaleString(), uniTotals.totalCollected.toLocaleString(), uniTotals.totalPending.toLocaleString(), `${recoveryPct(uniTotals)}%`],
        ["College", colTotals.totalGenerated.toLocaleString(), colTotals.totalCollected.toLocaleString(), colTotals.totalPending.toLocaleString(), `${recoveryPct(colTotals)}%`],
        ["Combined", grandTotals.totalGenerated.toLocaleString(), grandTotals.totalCollected.toLocaleString(), grandTotals.totalPending.toLocaleString(), `${overallRecovery}%`],
      ],
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 4, font: "helvetica", halign: "center" },
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: { 0: { halign: "left", fontStyle: "bold" } },
    });

    const tableColumns = [
      "Scope",
      "Category",
      "Invoices",
      "Paid",
      "Unpaid",
      "Generated (PKR)",
      "Collected (PKR)",
      "Pending (PKR)",
      "Recovery %",
    ];

    const rowOf = (type, row) => {
      const recovery =
        row.totalGenerated > 0
          ? ((row.totalCollected / row.totalGenerated) * 100).toFixed(1)
          : "0";
      return [
        type,
        row.name || "Unknown",
        row.totalChallans.toString(),
        row.paidCount.toString(),
        row.unpaidCount.toString(),
        row.totalGenerated.toLocaleString(),
        row.totalCollected.toLocaleString(),
        row.totalPending.toLocaleString(),
        `${recovery}%`,
      ];
    };

    const subtotalRow = (label, totals) => [
      "",
      label,
      totals.totalChallans.toString(),
      totals.paidCount.toString(),
      totals.unpaidCount.toString(),
      totals.totalGenerated.toLocaleString(),
      totals.totalCollected.toLocaleString(),
      totals.totalPending.toLocaleString(),
      `${recoveryPct(totals)}%`,
    ];

    const tableRows = [
      ...universityReportData.map((r) => rowOf("University", r)),
      subtotalRow("UNIVERSITY SUBTOTAL", uniTotals),
      ...collegeReportData.map((r) => rowOf("College", r)),
      subtotalRow("COLLEGE SUBTOTAL", colTotals),
      subtotalRow("GRAND TOTAL", grandTotals),
    ];
    const grandTotalRowIndex = tableRows.length - 1;
    const subtotalRowIndices = new Set([
      universityReportData.length,
      universityReportData.length + 1 + collegeReportData.length,
      grandTotalRowIndex,
    ]);

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: doc.lastAutoTable.finalY + 8,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 5, font: "helvetica" },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { halign: "center", fontStyle: "bold", cellWidth: 22 },
        1: { halign: "left", fontStyle: "bold" },
        2: { halign: "center" },
        3: { halign: "center", textColor: [21, 128, 61] },
        4: { halign: "center", textColor: [225, 29, 72] },
        5: { halign: "right" },
        6: { halign: "right", fontStyle: "bold", textColor: [21, 128, 61] },
        7: { halign: "right", fontStyle: "bold", textColor: [225, 29, 72] },
        8: { halign: "center", fontStyle: "bold" },
      },
      willDrawCell: function (data) {
        if (data.section !== "body") return;
        if (data.row.index === grandTotalRowIndex) {
          doc.setFillColor(199, 210, 254);
        } else if (subtotalRowIndices.has(data.row.index)) {
          doc.setFillColor(241, 245, 249);
        }
      },
    });

    doc.save(`Finance_Report_Combined_${filters.reportType}_${Date.now()}.pdf`);
  };

  return (
    <ReportGenerationView
      filters={filters}
      setFilters={setFilters}
      reportData={reportData}
      summary={summary}
      terms={terms}
      feeCategoryOptions={feeCategoryOptions}
      monthOptions={monthOptions}
      isLoading={isFetching}
      onExportExcel={handleExportExcel}
      onExportPDF={handleExportPDF}
      onPrint={() => window.print()}
      onResetFilters={handleResetFilters}
    />
  );
};

export default ReportGenerationContainer;
