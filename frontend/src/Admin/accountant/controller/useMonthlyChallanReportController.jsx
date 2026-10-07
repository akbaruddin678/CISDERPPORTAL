import { useState, useMemo } from "react";
import { useGetMonthlyFinanceReportQuery } from "../api/studentChallanApi";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const alphaNumSort = (arr) => {
  return arr.sort((a, b) =>
    String(a || "").localeCompare(String(b || ""), undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
};

const useMonthlyChallanReportController = () => {
  const currentDate = useMemo(() => new Date(), []);

  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // ✅ Added date filtering fields
  const [filters, setFilters] = useState({
    search: "",
    department: "all",
    program: "all",
    semester: "all",
    session: "all",
    category: "all",
    status: "all",
    dateField: "all", // 'dueDate', 'paidAt', 'generatedOn'
    startDate: "",
    endDate: "",
  });

  const { data, isLoading, isFetching, isError, refetch } =
    useGetMonthlyFinanceReportQuery({
      month: selectedMonth,
      year: selectedYear,
    });

  const reportData = data?.data || {};
  const rawDetails = useMemo(
    () => reportData.details || [],
    [reportData.details],
  );
  const period = reportData.period || { monthName: "", year: selectedYear };

  // --- Generate Filter Dropdown Options dynamically ---
  const departmentOptions = useMemo(
    () => alphaNumSort([...new Set(rawDetails.map((c) => c.department))]),
    [rawDetails],
  );
  const programOptions = useMemo(
    () => alphaNumSort([...new Set(rawDetails.map((c) => c.program))]),
    [rawDetails],
  );
  const sessionOptions = useMemo(
    () => alphaNumSort([...new Set(rawDetails.map((c) => c.session))]),
    [rawDetails],
  );
  const semesterOptions = useMemo(
    () => alphaNumSort([...new Set(rawDetails.map((c) => c.semester))]),
    [rawDetails],
  );
  const categoryOptions = useMemo(
    () => alphaNumSort([...new Set(rawDetails.map((c) => c.type))]),
    [rawDetails],
  );

  // --- Apply Filters ---
  const details = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return rawDetails.filter((c) => {
      // 1. Free-text search — challan no, student name/reg no, father name
      if (search) {
        const haystack = [
          c.challanNo,
          c.studentName,
          c.studentRegNo,
          c.fatherName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      // 2. Existing Standard Filters
      if (filters.department !== "all" && c.department !== filters.department)
        return false;
      if (filters.program !== "all" && c.program !== filters.program)
        return false;
      if (filters.semester !== "all" && c.semester !== filters.semester)
        return false;
      if (filters.session !== "all" && c.session !== filters.session)
        return false;
      if (filters.category !== "all" && c.type !== filters.category)
        return false;
      if (
        filters.status !== "all" &&
        c.status?.toLowerCase() !== filters.status.toLowerCase()
      )
        return false;

      // 3. Date Range Filter
      if (filters.dateField !== "all" && filters.startDate && filters.endDate) {
        const targetDateStr = c[filters.dateField];

        // If the record doesn't have the date (e.g. filtering by paid date, but it's unpaid)
        if (!targetDateStr) return false;

        const targetDate = new Date(targetDateStr).setHours(0, 0, 0, 0);
        const sDate = new Date(filters.startDate).setHours(0, 0, 0, 0);
        const eDate = new Date(filters.endDate).setHours(23, 59, 59, 999); // End of day

        if (targetDate < sDate || targetDate > eDate) {
          return false;
        }
      }

      return true;
    });
  }, [rawDetails, filters]);

  // Summary cards must reflect whatever is currently filtered, not the
  // whole month's unfiltered total — recomputed from the same `details`
  // array the table actually renders, so the two can never disagree.
  const summary = useMemo(() => {
    return details.reduce(
      (acc, c) => {
        acc.totalChallans += 1;
        acc.totalOriginalAmount += c.originalAmount || 0;
        acc.totalFines += (c.fineAmount || 0) + (c.arrears || 0);
        acc.totalDiscounts += c.discountAmount || 0;
        acc.totalScholarships += c.scholarshipAmount || 0;
        acc.totalGeneratedAmount += c.netAmount || 0;
        acc.totalCollectedAmount += c.paidAmount || 0;
        acc.totalPendingAmount += c.balance || 0;
        return acc;
      },
      {
        totalChallans: 0,
        totalOriginalAmount: 0,
        totalFines: 0,
        totalDiscounts: 0,
        totalScholarships: 0,
        totalGeneratedAmount: 0,
        totalCollectedAmount: 0,
        totalPendingAmount: 0,
      },
    );
  }, [details]);

  const hasActiveFilters = Object.values(filters).some(
    (val) => val !== "all" && val !== "",
  );

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      department: "all",
      program: "all",
      semester: "all",
      session: "all",
      category: "all",
      status: "all",
      dateField: "all",
      startDate: "",
      endDate: "",
    });
  };

  const handleMonthChange = (e) => setSelectedMonth(parseInt(e.target.value));
  const handleYearChange = (e) => setSelectedYear(parseInt(e.target.value));

  const yearOptions = useMemo(() => {
    const years = [];
    for (let i = 2024; i <= currentDate.getFullYear() + 1; i++) years.push(i);
    return years;
  }, [currentDate]);

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

  // ==========================================
  // HELPER FORMATTERS FOR EXPORT
  // ==========================================
  const formatExportCurrency = (val) =>
    Number(val || 0).toLocaleString("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    });

  const formatExportDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  const handleExportExcel = () => {
    if (!details || details.length === 0) return alert("No data to export.");

    const exportData = details.map((row) => ({
      "Challan No": row.challanNo,
      "Student Name": row.studentName,
      "Father Name": row.fatherName,
      "Registration No": row.studentRegNo,
      Department: row.department,
      Program: row.program,
      Session: row.session,
      Semester: row.semester,
      "Category Type": row.type,

      // Financials
      "Base Fee (PKR)": row.originalAmount || 0,
      "Prev. Paid (Same Category)": row.historicalPaidAmount || 0,
      "Deductions (Schol/Disc)":
        (row.scholarshipAmount || 0) + (row.discountAmount || 0),
      "Fines & Arrears": (row.fineAmount || 0) + (row.arrears || 0),
      "Net Payable (PKR)": row.netAmount || 0,
      "Paid Amount (PKR)": row.paidAmount || 0,
      "Balance Remaining": row.balance || 0,

      // Dates & Info
      "Due Date": formatExportDate(row.dueDate),
      "Paid On": formatExportDate(row.paidAt),
      "Issue Date": formatExportDate(row.generatedOn),

      "Payment Reference": row.paymentReference || "-",
      Status: row.status?.toUpperCase() || "UNKNOWN",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Finance Report");
    XLSX.writeFile(
      wb,
      `Monthly_Finance_Report_${period?.monthName}_${period?.year}.xlsx`,
    );
  };

  // ==========================================
  // PDF EXPORT
  // ==========================================
  const handleExportPDF = () => {
    if (!details || details.length === 0) return alert("No data to export.");

    const doc = new jsPDF({ orientation: "landscape", format: "a4" });

    doc.setFontSize(16);
    doc.text(
      `Monthly Finance Report - ${period.monthName} ${period.year}`,
      10,
      15,
    );

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Generated: ${formatExportCurrency(summary?.totalGeneratedAmount)}  |  Collected: ${formatExportCurrency(summary?.totalCollectedAmount)}  |  Pending: ${formatExportCurrency(summary?.totalPendingAmount)}`,
      10,
      22,
    );

    const tableColumn = [
      "Challan No",
      "Student / Reg",
      "Program / Dept",
      "Type",
      "Base Fee",
      "Prev. Paid",
      "Ded.",
      "Fines",
      "Net Amt",
      "Paid",
      "Balance",
      "Dates",
      "Status",
    ];

    const tableRows = details.map((row) => [
      row.challanNo,
      `${row.studentName}\n(${row.studentRegNo})`,
      `${row.program}\n${row.department}`,
      row.type,
      formatExportCurrency(row.originalAmount),
      formatExportCurrency(row.historicalPaidAmount),
      formatExportCurrency(
        (row.scholarshipAmount || 0) + (row.discountAmount || 0),
      ),
      formatExportCurrency((row.fineAmount || 0) + (row.arrears || 0)),
      formatExportCurrency(row.netAmount),
      formatExportCurrency(row.paidAmount),
      formatExportCurrency(row.balance),
      `Due: ${formatExportDate(row.dueDate)}\nPaid: ${formatExportDate(row.paidAt)}`,
      row.status?.toUpperCase() || "-",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      margin: { left: 5, right: 5 },
      styles: {
        fontSize: 5.5,
        cellPadding: 1.5,
        valign: "middle",
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 6,
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 16 },
        1: { cellWidth: 32 },
        2: { cellWidth: 30 },
        3: { cellWidth: 18 },

        // Financials (Right aligned)
        4: { halign: "right", cellWidth: 18 },
        5: { halign: "right", textColor: [51, 65, 85], cellWidth: 18 },
        6: { halign: "right", cellWidth: 16 },
        7: { halign: "right", cellWidth: 16 },
        8: { halign: "right", cellWidth: 20 },
        9: { halign: "right", textColor: [21, 128, 61], cellWidth: 20 },
        10: { halign: "right", textColor: [185, 28, 28], cellWidth: 20 },

        11: { cellWidth: 24 },
        12: { halign: "center", fontStyle: "bold", cellWidth: 14 },
      },
    });

    doc.save(`Monthly_Finance_Report_${period.monthName}_${period.year}.pdf`);
  };

  return {
    selectedMonth,
    selectedYear,
    handleMonthChange,
    handleYearChange,
    yearOptions,
    monthOptions,

    filters,
    handleFilterChange,
    clearFilters,
    hasActiveFilters,
    programOptions,
    sessionOptions,
    departmentOptions,
    semesterOptions,
    categoryOptions,

    summary,
    details,
    period,
    isLoading: isLoading || isFetching,
    isError,
    refetch,
    handleExportExcel,
    handleExportPDF,
  };
};

export default useMonthlyChallanReportController;
