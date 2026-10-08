import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { useGetFinanceReportsQuery } from "../api/studentChallanApi";
import { useGetCompleteCatalogQuery } from "../api/depsemtermpro";
import ReportGenerationView from "../view/ReportGenerationView";

const REPORT_TYPE_LABELS = {
  department: "Class",
  program: "Program",
  semester: "Section",
  session: "Session",
};

const initialFilters = {
  reportType: "department",
  termId: "",
  departmentId: "",
  programId: "",
  semesterId: "",
  category: [], // always an array to hold multiple selections
  month: "",
};

const ReportGenerationContainer = () => {
  const [filters, setFilters] = useState(initialFilters);

  // Class -> Program -> Section: choosing a class narrows programs and
  // sections, and changing a parent clears the children.
  const setFiltersCascade = (next) => {
    setFilters((prev) => {
      const merged = typeof next === "function" ? next(prev) : next;
      const updated = { ...merged };
      if (updated.departmentId !== prev.departmentId) {
        updated.programId = "";
        updated.semesterId = "";
      } else if (updated.programId !== prev.programId) {
        updated.semesterId = "";
      }
      return updated;
    });
  };

  const cleanFilters = useMemo(() => {
    const result = { scope: "all" };
    if (filters.reportType) result.reportType = filters.reportType;
    if (filters.termId) result.termId = filters.termId;
    if (filters.departmentId) result.departmentId = filters.departmentId;
    if (filters.programId) result.programId = filters.programId;
    if (filters.semesterId) result.semesterId = filters.semesterId;
    if (filters.month) result.month = filters.month;

    if (filters.category && filters.category.length > 0) {
      let expandedCategories = [...filters.category];

      // "ACADEMIC" covers both TUITION and INSTALLMENT challans
      if (expandedCategories.includes("ACADEMIC")) {
        expandedCategories.push("TUITION", "INSTALLMENT");
      }

      const knownCategories = [
        "TUITION",
        "ADMISSION",
        "READMISSION",
        "EXAM",
        "MISC",
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

      // Whatever the user did NOT select is sent as an exclusion pattern.
      const toExclude = knownCategories.filter(
        (cat) => !expandedCategories.includes(cat),
      );
      if (toExclude.length > 0) {
        result.excludeType = toExclude.map((cat) => `^${cat}$`).join("|");
      }
    }
    return result;
  }, [filters]);

  const { data: reportRes, isFetching } = useGetFinanceReportsQuery(cleanFilters);
  const { data: catalogRes } = useGetCompleteCatalogQuery();

  const emptySummary = { totalRevenue: 0, totalReceivable: 0, totalPending: 0 };
  const reportData = reportRes?.data?.reportData || [];
  const summary = reportRes?.data?.summary || emptySummary;

  const catalog = catalogRes?.data || {
    departments: [],
    programs: [],
    terms: [],
    semesters: [],
  };
  const terms = catalog.terms;
  const departments = catalog.departments;

  const programs = useMemo(() => {
    if (!filters.departmentId) return catalog.programs;
    return catalog.programs.filter(
      (p) => String(p.departmentId?._id || p.departmentId) === String(filters.departmentId),
    );
  }, [catalog.programs, filters.departmentId]);

  // Sections follow the chosen program; with only a class chosen they are
  // every section of that class's programs.
  const sections = useMemo(() => {
    let list = catalog.semesters;
    if (filters.programId) {
      list = list.filter(
        (s) => String(s.programId?._id || s.programId) === String(filters.programId),
      );
    } else if (filters.departmentId) {
      const programIds = new Set(programs.map((p) => String(p._id)));
      list = list.filter((s) => programIds.has(String(s.programId?._id || s.programId)));
    }
    return [...list].sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [catalog.semesters, filters.programId, filters.departmentId, programs]);

  const feeCategoryOptions = [
    { value: "ACADEMIC", label: "Academic / Monthly Fee" },
    { value: "ADMISSION", label: "Admission Fee" },
    { value: "READMISSION", label: "Re-Admission Fee" },
    { value: "EXAM", label: "Exam Fee" },
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

  const handleResetFilters = () => setFilters(initialFilters);

  const totals = reportData.reduce(
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

  const groupLabel = REPORT_TYPE_LABELS[filters.reportType] || "Name";

  // One line describing the active filters, used in both exports.
  const filterSummary = () => {
    const parts = [];
    const dept = departments.find((d) => d._id === filters.departmentId);
    const prog = catalog.programs.find((p) => p._id === filters.programId);
    const sec = catalog.semesters.find((s) => s._id === filters.semesterId);
    const term = terms.find((t) => t._id === filters.termId);
    if (dept) parts.push(`Class: ${dept.name}`);
    if (prog) parts.push(`Program: ${prog.name}`);
    if (sec) parts.push(`Section: ${sec.name || sec.number}`);
    if (term) parts.push(`Session: ${term.name}`);
    if (filters.category?.length > 0) {
      parts.push(
        `Categories: ${filters.category
          .map((c) => feeCategoryOptions.find((o) => o.value === c)?.label || c)
          .join(", ")}`,
      );
    }
    if (filters.month) {
      parts.push(`Month: ${monthOptions.find((m) => m.value === filters.month)?.label}`);
    }
    return parts.join(" | ");
  };

  const handleExportExcel = () => {
    if (reportData.length === 0) return alert("No data to export");

    const rowToExcel = (name, item) => ({
      [groupLabel]: name,
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

    const excelData = [
      ...reportData.map((item) => rowToExcel(item.name || "Unknown", item)),
      rowToExcel("TOTAL", totals),
    ];

    const ws = XLSX.utils.json_to_sheet(excelData);
    ws["!cols"] = [26, 14, 12, 13, 20, 20, 18, 16].map((wch) => ({ wch }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financial Report");
    XLSX.writeFile(wb, `Finance_Report_${filters.reportType}_${filters.month || "All"}.xlsx`);
  };

  const handleExportPDF = () => {
    if (reportData.length === 0) return alert("No data to export");

    const doc = new jsPDF("landscape");
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(20);
    doc.setTextColor(30, 58, 138);
    doc.text("CISD", pageWidth / 2, 18, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Financial Summary Report - ${groupLabel.toUpperCase()} WISE`, pageWidth / 2, 28, {
      align: "center",
    });

    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    const meta = `Generated: ${new Date().toLocaleDateString()}${filterSummary() ? ` | ${filterSummary()}` : ""}`;
    doc.text(doc.splitTextToSize(meta, pageWidth - 28), 14, 36);

    doc.setFillColor(230, 240, 250);
    doc.setDrawColor(200, 210, 230);
    doc.rect(14, 44, pageWidth - 28, 18, "FD");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    const summaryItems = [
      `Total Receivable: PKR ${totals.totalGenerated.toLocaleString()}`,
      `Total Collected: PKR ${totals.totalCollected.toLocaleString()}`,
      `Total Pending: PKR ${totals.totalPending.toLocaleString()}`,
      `Recovery: ${recoveryPct(totals)}%`,
    ];
    const itemWidth = (pageWidth - 28) / summaryItems.length;
    summaryItems.forEach((item, idx) => doc.text(item, 20 + idx * itemWidth, 54));

    const rowOf = (name, row) => [
      name,
      String(row.totalChallans),
      String(row.paidCount),
      String(row.unpaidCount),
      row.totalGenerated.toLocaleString(),
      row.totalCollected.toLocaleString(),
      row.totalPending.toLocaleString(),
      `${row.totalGenerated > 0 ? ((row.totalCollected / row.totalGenerated) * 100).toFixed(1) : "0"}%`,
    ];
    const tableRows = [...reportData.map((r) => rowOf(r.name || "Unknown", r)), rowOf("TOTAL", totals)];
    const totalRowIndex = tableRows.length - 1;

    autoTable(doc, {
      head: [[groupLabel, "Invoices", "Paid", "Unpaid", "Generated (PKR)", "Collected (PKR)", "Pending (PKR)", "Recovery %"]],
      body: tableRows,
      startY: 68,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 5, font: "helvetica" },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
      columnStyles: {
        0: { halign: "left", fontStyle: "bold" },
        1: { halign: "center" },
        2: { halign: "center", textColor: [21, 128, 61] },
        3: { halign: "center", textColor: [225, 29, 72] },
        4: { halign: "right" },
        5: { halign: "right", fontStyle: "bold", textColor: [21, 128, 61] },
        6: { halign: "right", fontStyle: "bold", textColor: [225, 29, 72] },
        7: { halign: "center", fontStyle: "bold" },
      },
      willDrawCell: (data) => {
        if (data.section === "body" && data.row.index === totalRowIndex) {
          doc.setFillColor(199, 210, 254);
        }
      },
    });

    doc.save(`Finance_Report_${filters.reportType}_${Date.now()}.pdf`);
  };

  return (
    <ReportGenerationView
      filters={filters}
      setFilters={setFiltersCascade}
      reportData={reportData}
      summary={summary}
      terms={terms}
      departments={departments}
      programs={programs}
      sections={sections}
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
