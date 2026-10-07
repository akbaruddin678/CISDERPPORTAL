// PDF + Excel export for the Scholarship & Aid module (Plans and
// Applications) — same institute-branded report style already established
// by studentDirectoryExport.js (ExcelJS for the workbook, jsPDF +
// jspdf-autotable for the PDF), so every export across the accountant area
// looks and behaves the same way. Both libraries are dynamically imported
// to keep them out of the main bundle.

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

const NAVY = { argb: "FF1E3A8A" };
const SLATE_BORDER = { argb: "FFD9DEE7" };
const STRIPE = { argb: "FFF4F5FA" };

const fmtRs = (v) => `Rs ${Number(v || 0).toLocaleString()}`;
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const planGrantValue = (p) =>
  p.type === "percentage" ? `${p.maxPercentage || 0}%` : fmtRs(p.maxAmount);

const rowsFromPlans = (plans) =>
  plans.map((p, i) => ({
    sno: i + 1,
    title: p.title || "—",
    term: p.termName || "Any Term",
    type: p.type === "percentage" ? "Percentage" : "Fixed Amount",
    value: planGrantValue(p),
    status: p.active ? "Active" : "Inactive",
    assignments: `${p.activeAssignments || 0} / ${p.totalAssignments || 0}`,
    created: fmtDate(p.createdAt),
  }));

const rowsFromApplications = (apps) =>
  apps.map((a, i) => ({
    sno: i + 1,
    name: a.studentName || "N/A",
    regNo: a.studentRegNo || "—",
    cnic: a.studentCNIC || "—",
    department: a.studentDepartment || "—",
    program: a.studentProgram || "—",
    semester: a.studentSemesterNumber ? `Semester ${a.studentSemesterNumber}` : "—",
    plan: a.planTitle || "—",
    tuition: a.hasFeeSetup ? fmtRs(a.tuitionAmount) : "Not set up",
    deduction: a.hasFeeSetup ? fmtRs(a.scholarshipAmount) : "—",
    net: a.hasFeeSetup ? fmtRs(a.netAmount) : "—",
    status: (a.status || "pending").charAt(0).toUpperCase() + (a.status || "pending").slice(1),
    applied: fmtDate(a.appliedAt),
  }));

export async function drawExcelHeader(ws, columnsCount, subtitle, recordCount) {
  ws.mergeCells(1, 1, 1, columnsCount);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = "CISD";
  titleCell.font = { bold: true, size: 16, color: NAVY };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 26;

  ws.mergeCells(2, 1, 2, columnsCount);
  const subtitleCell = ws.getCell(2, 1);
  subtitleCell.value = subtitle;
  subtitleCell.font = { bold: true, size: 11, color: { argb: "FF64748B" } };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(2).height = 20;

  ws.mergeCells(3, 1, 3, columnsCount);
  const metaCell = ws.getCell(3, 1);
  metaCell.value = `Generated ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}  •  ${recordCount} Record${recordCount === 1 ? "" : "s"}`;
  metaCell.font = { italic: true, size: 9, color: { argb: "FF94A3B8" } };
  metaCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(3).height = 18;

  ws.addRow({});
}

export function styleExcelHeaderRow(ws, headerRowIdx, columnsCount) {
  const headerRow = ws.getRow(headerRowIdx);
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
  ws.autoFilter = { from: { row: headerRowIdx, column: 1 }, to: { row: headerRowIdx, column: columnsCount } };
}

export function styleExcelDataRows(ws, rows) {
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
  });
}

export function downloadExcelBlob(wb, filename) {
  return wb.xlsx.writeBuffer().then((buf) => {
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  });
}

export async function exportScholarshipPlansExcel(plans, { scopeLabel = "All Plans" } = {}) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "CISD ERP";
  wb.created = new Date();

  const ws = wb.addWorksheet("Scholarship Plans", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });

  const columns = [
    { header: "#", key: "sno", width: 6 },
    { header: "Plan Title", key: "title", width: 28 },
    { header: "Term", key: "term", width: 18 },
    { header: "Type", key: "type", width: 16 },
    { header: "Grant Value", key: "value", width: 16 },
    { header: "Status", key: "status", width: 14 },
    { header: "Active / Total Assigned", key: "assignments", width: 20 },
    { header: "Created", key: "created", width: 16 },
  ];
  ws.columns = columns;

  await drawExcelHeader(ws, columns.length, `Scholarship Plans — ${scopeLabel}`, plans.length);
  const headerRowIdx = 5;
  columns.forEach((c, i) => (ws.getRow(headerRowIdx).getCell(i + 1).value = c.header));
  styleExcelHeaderRow(ws, headerRowIdx, columns.length);
  styleExcelDataRows(ws, rowsFromPlans(plans));

  await downloadExcelBlob(
    wb,
    `Scholarship_Plans_${scopeLabel.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

export async function exportScholarshipApplicationsExcel(apps, { scopeLabel = "All Applications" } = {}) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "CISD ERP";
  wb.created = new Date();

  const ws = wb.addWorksheet("Scholarship Applications", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });

  const columns = [
    { header: "#", key: "sno", width: 6 },
    { header: "Student Name", key: "name", width: 24 },
    { header: "Reg No.", key: "regNo", width: 18 },
    { header: "CNIC", key: "cnic", width: 18 },
    { header: "Class", key: "department", width: 26 },
    { header: "Program", key: "program", width: 22 },
    { header: "Section", key: "semester", width: 14 },
    { header: "Plan", key: "plan", width: 22 },
    { header: "Tuition", key: "tuition", width: 16 },
    { header: "Deduction", key: "deduction", width: 16 },
    { header: "Net Payable", key: "net", width: 16 },
    { header: "Status", key: "status", width: 14 },
    { header: "Applied", key: "applied", width: 16 },
  ];
  ws.columns = columns;

  await drawExcelHeader(ws, columns.length, `Scholarship Applications — ${scopeLabel}`, apps.length);
  const headerRowIdx = 5;
  columns.forEach((c, i) => (ws.getRow(headerRowIdx).getCell(i + 1).value = c.header));
  styleExcelHeaderRow(ws, headerRowIdx, columns.length);
  const rows = rowsFromApplications(apps);
  styleExcelDataRows(ws, rows);

  await downloadExcelBlob(
    wb,
    `Scholarship_Applications_${scopeLabel.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

export async function buildBrandedPdf(subtitle) {
  const { default: jsPDF } = await import("jspdf");
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
    doc.text(subtitle, pageWidth / 2, 21.5, { align: "center" });
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.6);
    doc.line(14, 26, pageWidth - 14, 26);
  };

  return { doc, pageWidth, drawHeader };
}

export function finishPdf(doc, pageWidth, filename) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 8, { align: "center" });
  }
  doc.save(filename);
}

export async function exportScholarshipPlansPDF(plans, { scopeLabel = "All Plans" } = {}) {
  const { doc, pageWidth, drawHeader } = await buildBrandedPdf(`Scholarship Plans — ${scopeLabel}`);
  const { default: autoTable } = await import("jspdf-autotable");

  drawHeader();
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`,
    pageWidth - 14,
    32,
    { align: "right" },
  );
  doc.text(`Total Records: ${plans.length}`, 14, 32);

  const rows = rowsFromPlans(plans);
  autoTable(doc, {
    startY: 36,
    head: [["#", "Plan Title", "Term", "Type", "Grant Value", "Status", "Active / Total", "Created"]],
    body: rows.map((r) => [r.sno, r.title, r.term, r.type, r.value, r.status, r.assignments, r.created]),
    theme: "striped",
    styles: { fontSize: 8.5, cellPadding: 3, textColor: [30, 41, 59], lineColor: [217, 222, 231], lineWidth: 0.1 },
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
    alternateRowStyles: { fillColor: [244, 245, 250] },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { fontStyle: "bold", cellWidth: 46 },
      4: { halign: "center", cellWidth: 26, fontStyle: "bold" },
      5: { halign: "center", cellWidth: 22, fontStyle: "bold" },
      6: { halign: "center", cellWidth: 30 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        data.cell.styles.textColor = data.cell.raw === "Active" ? [21, 128, 61] : [100, 116, 139];
      }
    },
    didDrawPage: () => {
      if (doc.internal.getCurrentPageInfo().pageNumber > 1) drawHeader();
    },
    margin: { top: 30 },
  });

  finishPdf(doc, pageWidth, `Scholarship_Plans_${scopeLabel.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function exportScholarshipApplicationsPDF(apps, { scopeLabel = "All Applications" } = {}) {
  const { doc, pageWidth, drawHeader } = await buildBrandedPdf(`Scholarship Applications — ${scopeLabel}`);
  const { default: autoTable } = await import("jspdf-autotable");

  drawHeader();
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`,
    pageWidth - 14,
    32,
    { align: "right" },
  );
  doc.text(`Total Records: ${apps.length}`, 14, 32);

  const rows = rowsFromApplications(apps);
  autoTable(doc, {
    startY: 36,
    head: [["#", "Student Name", "Reg No.", "CNIC", "Department", "Program", "Sem", "Plan", "Tuition", "Deduction", "Net Payable", "Status", "Applied"]],
    body: rows.map((r) => [
      r.sno,
      r.name,
      r.regNo,
      r.cnic,
      r.department,
      r.program,
      r.semester.replace("Semester ", ""),
      r.plan,
      r.tuition,
      r.deduction,
      r.net,
      r.status,
      r.applied,
    ]),
    theme: "striped",
    styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [30, 41, 59], lineColor: [217, 222, 231], lineWidth: 0.1 },
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
    alternateRowStyles: { fillColor: [244, 245, 250] },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { fontStyle: "bold", cellWidth: 26 },
      6: { halign: "center", cellWidth: 12 },
      8: { halign: "right" },
      9: { halign: "right" },
      10: { halign: "right", fontStyle: "bold" },
      11: { halign: "center", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 11) {
        const val = String(data.cell.raw || "").toLowerCase();
        data.cell.styles.textColor =
          val === "approved" ? [21, 128, 61] : val === "rejected" ? [190, 18, 60] : val === "revoked" ? [100, 116, 139] : [180, 83, 9];
      }
    },
    didDrawPage: () => {
      if (doc.internal.getCurrentPageInfo().pageNumber > 1) drawHeader();
    },
    margin: { top: 30 },
  });

  finishPdf(doc, pageWidth, `Scholarship_Applications_${scopeLabel.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
