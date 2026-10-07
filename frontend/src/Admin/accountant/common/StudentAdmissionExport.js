// PDF + Excel export for the accountant "New Admissions" table — one export
// per currently-visible section (state tab), same dynamic-import pattern
// already used by StudentReportController.jsx (jspdf/jspdf-autotable/xlsx are
// all loaded on demand, not bundled into the main chunk).

const rowsFromStudents = (students) =>
  students.map((s) => ({
    "Reg No": s.studentId || "-",
    "Student Name": s.personalInfo?.fullName || "N/A",
    "Father Name": s.familyInfo?.fatherName || s.personalInfo?.fatherName || "-",
    Program: s.programId?.name || s.program?.name || "-",
    Department: s.departmentId?.name || "-",
    Stage: `Sem ${s.semesterId?.number || s.semester?.number || 1}`,
    Phone: s.personalInfo?.phone || "-",
    "Challan Status": (s.challanStatus || "not_generated").replace("_", " "),
    "Date Added": new Date(s.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  }));

export async function exportAdmissionsExcel(students, { sectionLabel }) {
  const XLSX = await import("xlsx");
  const rows = rowsFromStudents(students);
  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = Object.keys(rows[0] || {}).map(() => ({ wch: 18 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Admissions");

  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  const blob = new Blob([buf], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `New_Admissions_${sectionLabel.replace(/\s+/g, "_")}_${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportAdmissionsPDF(students, { sectionLabel }) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.width;

  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.setFont(undefined, "bold");
  doc.text("CISD", pageWidth / 2, 14, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont(undefined, "normal");
  doc.text(`New Admissions — ${sectionLabel}`, pageWidth / 2, 20, { align: "center" });
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.4);
  doc.line(14, 24, pageWidth - 14, 24);

  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, pageWidth - 14, 10, {
    align: "right",
  });
  doc.text(`Total: ${students.length}`, 14, 10);

  const rows = rowsFromStudents(students);
  const headers = Object.keys(rows[0] || {
    "Reg No": "", "Student Name": "", "Father Name": "", Program: "",
    Department: "", Stage: "", Phone: "", "Challan Status": "", "Date Added": "",
  });

  autoTable(doc, {
    startY: 28,
    head: [headers],
    body: rows.map((r) => headers.map((h) => r[h])),
    theme: "grid",
    styles: { fontSize: 7.5, cellPadding: 1.6 },
    headStyles: { fillColor: [79, 70, 229], fontStyle: "bold" },
  });

  doc.save(
    `New_Admissions_${sectionLabel.replace(/\s+/g, "_")}_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`,
  );
}
