// Graduate roll (Excel + PDF) and the official transcript (PDF) for the
// degree-clearance flow. Reuses the institute-branded Excel/PDF helpers the
// accountant exports already share; libraries are imported lazily.
import {
  drawExcelHeader,
  styleExcelHeaderRow,
  styleExcelDataRows,
  downloadExcelBlob,
  buildBrandedPdf,
  finishPdf,
} from "../../accountant/common/scholarshipExport";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const rowsFromGraduates = (list) =>
  list.map((g, i) => ({
    sno: i + 1,
    serial: g.degreeSerial || "—",
    name: g.student?.fullName || "—",
    regNo: g.student?.regNo || "—",
    cnic: g.student?.cnic || "—",
    department: g.department?.name || "—",
    program: g.program?.name || "—",
    cgpa: g.cgpa != null ? Number(g.cgpa).toFixed(2) : "—",
    credits: g.earnedCredits != null ? g.earnedCredits : "—",
    date: fmtDate(g.graduatedAt),
  }));

const stamp = () => new Date().toISOString().slice(0, 10);

export async function exportGraduatesExcel(list, { scopeLabel = "All Graduates" } = {}) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "CISD ERP";
  wb.created = new Date();
  const ws = wb.addWorksheet("Graduate List", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });
  const columns = [
    { header: "#", key: "sno", width: 6 },
    { header: "Degree Serial", key: "serial", width: 18 },
    { header: "Student Name", key: "name", width: 26 },
    { header: "Reg No.", key: "regNo", width: 18 },
    { header: "CNIC", key: "cnic", width: 18 },
    { header: "Class", key: "department", width: 26 },
    { header: "Program", key: "program", width: 24 },
    { header: "CGPA", key: "cgpa", width: 10 },
    { header: "Credits", key: "credits", width: 10 },
    { header: "Graduation Date", key: "date", width: 16 },
  ];
  ws.columns = columns;
  await drawExcelHeader(ws, columns.length, `Graduation Roll — ${scopeLabel}`, list.length);
  const headerRowIdx = 5;
  columns.forEach((c, i) => (ws.getRow(headerRowIdx).getCell(i + 1).value = c.header));
  styleExcelHeaderRow(ws, headerRowIdx, columns.length);
  styleExcelDataRows(ws, rowsFromGraduates(list));
  await downloadExcelBlob(wb, `Graduate_List_${scopeLabel.replace(/\s+/g, "_")}_${stamp()}.xlsx`);
}

export async function exportGraduatesPDF(list, { scopeLabel = "All Graduates" } = {}) {
  const { doc, pageWidth, drawHeader } = await buildBrandedPdf(`Graduation Roll — ${scopeLabel}`);
  const { default: autoTable } = await import("jspdf-autotable");
  drawHeader();
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${fmtDate(new Date())}`, pageWidth - 14, 32, { align: "right" });
  doc.text(`Total Graduates: ${list.length}`, 14, 32);

  const rows = rowsFromGraduates(list);
  autoTable(doc, {
    startY: 36,
    head: [["#", "Degree Serial", "Student Name", "Reg No.", "Department", "Program", "CGPA", "Credits", "Date"]],
    body: rows.map((r) => [r.sno, r.serial, r.name, r.regNo, r.department, r.program, r.cgpa, r.credits, r.date]),
    theme: "striped",
    styles: { fontSize: 8.5, cellPadding: 3, textColor: [30, 41, 59], lineColor: [217, 222, 231], lineWidth: 0.1 },
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
    alternateRowStyles: { fillColor: [244, 245, 250] },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { fontStyle: "bold", cellWidth: 30 },
      6: { halign: "center", cellWidth: 16, fontStyle: "bold" },
      7: { halign: "center", cellWidth: 16 },
    },
    didDrawPage: () => {
      if (doc.internal.getCurrentPageInfo().pageNumber > 1) drawHeader();
    },
    margin: { top: 30 },
  });
  finishPdf(doc, pageWidth, `Graduate_List_${scopeLabel.replace(/\s+/g, "_")}_${stamp()}.pdf`);
}

// Portrait, one section per semester, closing with the cumulative result.
export async function exportTranscriptPDF(transcript, { degreeSerial, graduatedAt } = {}) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.width;

  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138);
  doc.setFont(undefined, "bold");
  doc.text("CISD", pageWidth / 2, 16, { align: "center" });
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.setFont(undefined, "normal");
  doc.text("Official Academic Transcript", pageWidth / 2, 22.5, { align: "center" });
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.6);
  doc.line(14, 27, pageWidth - 14, 27);

  const s = transcript.student || {};
  const info = [
    ["Student", s.fullName || "—"],
    ["Reg No.", s.regNo || "—"],
    ["CNIC", s.cnic || "—"],
    ["Program", transcript.programName || "—"],
    ...(degreeSerial ? [["Degree Serial", degreeSerial]] : []),
    ...(graduatedAt ? [["Graduation Date", fmtDate(graduatedAt)]] : []),
  ];
  autoTable(doc, {
    startY: 32,
    body: info,
    theme: "plain",
    styles: { fontSize: 9.5, cellPadding: 1.6, textColor: [30, 41, 59] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 36, textColor: [100, 116, 139] } },
  });

  let y = doc.lastAutoTable.finalY + 6;
  for (const sem of transcript.semesters || []) {
    autoTable(doc, {
      startY: y,
      head: [
        [
          {
            content: `${sem.name}${sem.term ? `  ·  ${sem.term}` : ""}`,
            colSpan: 5,
            styles: { halign: "left", fillColor: [30, 58, 138] },
          },
          {
            content: `SGPA ${sem.sgpa != null ? Number(sem.sgpa).toFixed(2) : "—"}`,
            styles: { halign: "right", fillColor: [30, 58, 138] },
          },
        ],
        ["Code", "Course", "Cr", "%", "Grade", "GP"],
      ],
      body: sem.courses
        .filter((c) => c.counted !== false)
        .map((c) =>
          c.state === "graded"
            ? [c.code, c.title, c.credits, Number(c.percentage).toFixed(1), c.grade, Number(c.gradePoints).toFixed(1)]
            : [c.code, c.title, c.credits, "—", "—", "—"],
        ),
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 2, textColor: [30, 41, 59], lineColor: [217, 222, 231], lineWidth: 0.1 },
      headStyles: { textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 24 },
        2: { halign: "center", cellWidth: 12 },
        3: { halign: "center", cellWidth: 16 },
        4: { halign: "center", cellWidth: 16, fontStyle: "bold" },
        5: { halign: "center", cellWidth: 14 },
      },
      didParseCell: (data) => {
        if (data.section === "head" && data.row.index === 1) {
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.textColor = [71, 85, 105];
        }
      },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 5;
  }

  autoTable(doc, {
    startY: y + 1,
    body: [
      ["Cumulative GPA (CGPA)", transcript.cgpa != null ? Number(transcript.cgpa).toFixed(2) : "—"],
      [
        "Credit hours earned",
        transcript.requiredCredits != null
          ? `${transcript.earnedCredits} of ${transcript.requiredCredits}`
          : String(transcript.earnedCredits ?? "—"),
      ],
    ],
    theme: "plain",
    styles: { fontSize: 10.5, cellPadding: 2, textColor: [30, 41, 59], fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 60, textColor: [100, 116, 139] } },
    margin: { left: 14 },
  });

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated ${fmtDate(transcript.generatedAt)} by ${transcript.generatedBy || "Examination Office"} — computer generated document`,
    pageWidth / 2,
    doc.internal.pageSize.height - 8,
    { align: "center" },
  );

  const reg = (s.regNo || "student").replace(/\s+/g, "_");
  doc.save(`Transcript_${reg}.pdf`);
}
