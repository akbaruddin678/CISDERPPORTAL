// PDF + Excel export for the Accountant "Directory" student roster — a
// clean, modern institute-branded report covering the core identity/
// academic fields (Reg No, Name, Father Name, CNIC, Status, Department,
// Program, Semester), independent of the financial workbook/PDF builders
// (masterFinancialWorkbook.js / buildStudentFinancialPDF in
// StudentReportController.jsx) which are ledger-focused. Both libraries are
// dynamically imported, matching the lazy-load convention already used by
// every other export in this module so they never bloat the main bundle.

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

const NAVY = { argb: "FF1E3A8A" };
const INDIGO = { argb: "FF4F46E5" };
const SLATE_BORDER = { argb: "FFD9DEE7" };
const STRIPE = { argb: "FFF4F5FA" };

const rowsFromStudents = (students) =>
  students.map((s, i) => ({
    sno: i + 1,
    regNo: s.studentId || "—",
    name: s.personalInfo?.fullName || "N/A",
    fatherName:
      s.personalInfo?.fatherName || s.familyInfo?.fatherName || "—",
    cnic: s.personalInfo?.cnic || "—",
    status: s.status || (s.isActive ? "Active" : "Inactive") || "—",
    scholarship: s.hasScholarship ? "Yes" : "No",
    scholarshipName: s.hasScholarship ? s.scholarshipName || "N/A" : "—",
    department: s.departmentId?.name || "—",
    program: s.programId?.name || s.program?.name || "—",
    semester:
      s.semesterId?.number || s.semester?.number
        ? `Semester ${s.semesterId?.number || s.semester?.number}`
        : "—",
  }));

export async function exportStudentDirectoryExcel(students, { scopeLabel = "All Students" } = {}) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "CISD ERP";
  wb.created = new Date();

  const ws = wb.addWorksheet("Student Directory", {
    views: [{ state: "frozen", ySplit: 4 }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });

  const columns = [
    { header: "#", key: "sno", width: 6 },
    { header: "Registration No.", key: "regNo", width: 20 },
    { header: "Student Name", key: "name", width: 26 },
    { header: "Father Name", key: "fatherName", width: 24 },
    { header: "CNIC", key: "cnic", width: 18 },
    { header: "Status", key: "status", width: 14 },
    { header: "Scholarship", key: "scholarship", width: 14 },
    { header: "Scholarship Name", key: "scholarshipName", width: 20 },
    { header: "Class", key: "department", width: 28 },
    { header: "Program", key: "program", width: 26 },
    { header: "Section", key: "semester", width: 14 },
  ];
  ws.columns = columns;

  // ── Branded title block (rows 1-3, above the data table) ──
  ws.mergeCells(1, 1, 1, columns.length);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = "CISD";
  titleCell.font = { bold: true, size: 16, color: NAVY };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 26;

  ws.mergeCells(2, 1, 2, columns.length);
  const subtitleCell = ws.getCell(2, 1);
  subtitleCell.value = `Student Directory — ${scopeLabel}`;
  subtitleCell.font = { bold: true, size: 11, color: { argb: "FF64748B" } };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(2).height = 20;

  ws.mergeCells(3, 1, 3, columns.length);
  const metaCell = ws.getCell(3, 1);
  metaCell.value = `Generated ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}  •  ${students.length} Record${students.length === 1 ? "" : "s"}`;
  metaCell.font = { italic: true, size: 9, color: { argb: "FF94A3B8" } };
  metaCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(3).height = 18;

  ws.addRow({});

  // ── Header row (row 5) ──
  const headerRowIdx = 5;
  const headerRow = ws.getRow(headerRowIdx);
  columns.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = c.header;
  });
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: NAVY };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10.5 };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: SLATE_BORDER },
      bottom: { style: "thin", color: SLATE_BORDER },
      left: { style: "thin", color: SLATE_BORDER },
      right: { style: "thin", color: SLATE_BORDER },
    };
  });
  headerRow.height = 24;
  ws.views = [{ state: "frozen", ySplit: headerRowIdx }];
  ws.autoFilter = {
    from: { row: headerRowIdx, column: 1 },
    to: { row: headerRowIdx, column: columns.length },
  };

  // ── Data rows ──
  const rows = rowsFromStudents(students);
  rows.forEach((r, idx) => {
    const row = ws.addRow(r);
    const isEven = idx % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = {
        top: { style: "thin", color: SLATE_BORDER },
        bottom: { style: "thin", color: SLATE_BORDER },
        left: { style: "thin", color: SLATE_BORDER },
        right: { style: "thin", color: SLATE_BORDER },
      };
      if (isEven) cell.fill = { type: "pattern", pattern: "solid", fgColor: STRIPE };
      cell.alignment = { vertical: "middle", horizontal: colNumber === 1 ? "center" : "left" };
      cell.font = { size: 10, color: { argb: "FF1E293B" } };
    });

    const statusCell = row.getCell(6);
    const isActive = /active/i.test(String(statusCell.value)) && !/inactive/i.test(String(statusCell.value));
    statusCell.font = {
      bold: true,
      size: 9.5,
      color: { argb: isActive ? "FF15803D" : "FF64748B" },
    };
    statusCell.alignment = { vertical: "middle", horizontal: "center" };

    const scholarshipCell = row.getCell(7);
    const hasScholarship = scholarshipCell.value === "Yes";
    scholarshipCell.font = {
      bold: true,
      size: 9.5,
      color: { argb: hasScholarship ? "FF7C3AED" : "FF94A3B8" },
    };
    scholarshipCell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Student_Directory_${scopeLabel.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportStudentDirectoryPDF(students, { scopeLabel = "All Students" } = {}) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.width;

  let logoImg = null;
  try {
    logoImg = await loadImage(`${window.location.origin}/cisd-logo.png`);
  } catch {
    // Logo is a nice-to-have — the report still generates fine without it.
  }

  const drawHeader = () => {
    if (logoImg) {
      try {
        doc.addImage(logoImg, "PNG", 14, 8, 18, 18);
      } catch {
        // Ignore — a malformed/undecodable image shouldn't block the report.
      }
    }
    doc.setFontSize(16);
    doc.setTextColor(30, 58, 138);
    doc.setFont(undefined, "bold");
    doc.text("CISD", pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.setFont(undefined, "normal");
    doc.text(`Student Directory — ${scopeLabel}`, pageWidth / 2, 21.5, { align: "center" });
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.6);
    doc.line(14, 26, pageWidth - 14, 26);
  };

  drawHeader();
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`,
    pageWidth - 14,
    32,
    { align: "right" },
  );
  doc.text(`Total Records: ${students.length}`, 14, 32);

  const rows = rowsFromStudents(students);
  const headers = ["#", "Reg No.", "Student Name", "Father Name", "CNIC", "Status", "Scholarship", "Scholarship Name", "Department", "Program", "Semester"];

  autoTable(doc, {
    startY: 36,
    head: [headers],
    body: rows.map((r) => [
      r.sno,
      r.regNo,
      r.name,
      r.fatherName,
      r.cnic,
      r.status,
      r.scholarship,
      r.scholarshipName,
      r.department,
      r.program,
      r.semester,
    ]),
    theme: "striped",
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [30, 41, 59],
      lineColor: [217, 222, 231],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: { fillColor: [244, 245, 250] },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { fontStyle: "bold", cellWidth: 28 },
      4: { cellWidth: 30 },
      5: { halign: "center", cellWidth: 22, fontStyle: "bold" },
      6: { halign: "center", cellWidth: 20, fontStyle: "bold" },
      7: { cellWidth: 26 },
      10: { halign: "center", cellWidth: 24 },
    },
    didParseCell: (data) => {
      // Color the Status and Scholarship columns the same way the
      // on-screen badges do, instead of leaving every row flat text color.
      if (data.section === "body" && data.column.index === 5) {
        const val = String(data.cell.raw || "").toLowerCase();
        data.cell.styles.textColor = val.includes("active") && !val.includes("inactive")
          ? [21, 128, 61]
          : [100, 116, 139];
      }
      if (data.section === "body" && data.column.index === 6) {
        data.cell.styles.textColor =
          data.cell.raw === "Yes" ? [124, 58, 237] : [148, 163, 184];
      }
    },
    didDrawPage: () => {
      // Repeat the branded header on every page a large roster spills onto.
      if (doc.internal.getCurrentPageInfo().pageNumber > 1) {
        drawHeader();
      }
    },
    margin: { top: 30 },
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 8,
      { align: "center" },
    );
  }

  doc.save(`Student_Directory_${scopeLabel.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
