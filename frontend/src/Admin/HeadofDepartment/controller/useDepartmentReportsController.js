import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useGetTermsQuery } from "../../../components/catalog/api/catalogApi";
import { useGetDepartmentResultsOverviewQuery } from "../api/departmentReportsApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

// Department-wide — the backend scopes to the HOD's own department's
// programs automatically (via resolveHodDepartment), spanning every
// program/semester for the selected session at once, so there's no
// Program/Semester picker here, only Session.
const useDepartmentReportsController = () => {
  const [termId, setTermId] = useState("");

  const { data: termsRes } = useGetTermsQuery();
  const terms = extractArray(termsRes);

  useEffect(() => {
    if (terms.length > 0 && !termId) {
      const active = terms.find((t) => t.status) || terms[0];
      if (active) setTermId(active._id);
    }
  }, [terms, termId]);

  const { data: overviewRes, isFetching } = useGetDepartmentResultsOverviewQuery(
    { termId },
    { skip: !termId, refetchOnMountOrArgChange: true },
  );
  const overview = overviewRes?.data || null;
  const breakdown = overview?.breakdown || [];

  const sessionName = terms.find((t) => t._id === termId)?.name || "Session";

  const exportPdf = () => {
    if (!overview) return;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Department Results Report", 14, 18);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Session: ${sessionName}`, 14, 25);

    doc.setFontSize(11);
    doc.text(`Total Students: ${overview.totalStudents}`, 14, 34);
    doc.text(`Pass Rate: ${overview.passRate}%`, 80, 34);
    doc.text(`Avg SGPA: ${overview.avgSgpa}`, 140, 34);

    autoTable(doc, {
      startY: 42,
      head: [["Program", "Total Students", "Pass Rate", "Avg SGPA"]],
      body: breakdown.map((b) => [b.programName, b.totalStudents, `${b.passRate}%`, b.avgSgpa]),
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    });

    doc.save(`Department_Report_${sessionName}.pdf`);
  };

  const exportExcel = () => {
    if (!overview) return;
    const rows = breakdown.map((b) => ({
      Program: b.programName,
      "Total Students": b.totalStudents,
      "Pass Rate (%)": b.passRate,
      "Avg SGPA": b.avgSgpa,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Department Report");
    XLSX.writeFile(wb, `Department_Report_${sessionName}.xlsx`);
  };

  return {
    terms,
    termId,
    setTermId,
    overview,
    breakdown,
    isFetching,
    sessionName,
    exportPdf,
    exportExcel,
  };
};

export default useDepartmentReportsController;
