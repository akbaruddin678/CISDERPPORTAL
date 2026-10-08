// PDF + Excel export for the Student Academic History page — one full
// "Academic Profile" document (personal/academic details, current-semester
// fee status, semester-wise course history) per student, and a lightweight
// list export for whichever batch is currently on screen. Same on-demand
// dynamic-import pattern already used by StudentAdmissionExport.js.

const fmtMoney = (n) => `Rs ${Number(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

const FEE_LABELS = {
  paid: "Fully Paid",
  partial: "Partially Paid",
  unpaid: "Unpaid",
  overdue: "Overdue",
  not_generated: "No Challan Generated",
};

const flattenHistory = (degreeHistory) => {
  const rows = [];
  Object.entries(degreeHistory || {}).forEach(([semName, sem]) => {
    (sem.courses || []).forEach((c) => {
      rows.push({
        semester: semName,
        term: sem.term || "-",
        sgpa: sem.sgpa ?? null,
        code: c.code || "-",
        title: c.title || "-",
        credits: c.creditHours ? `${c.creditHours.theory}Th + ${c.creditHours.lab}Lab` : "3",
        marks: c.obtainedMarks !== null && c.obtainedMarks !== undefined ? `${c.obtainedMarks}/${c.totalMarks}` : "-",
        grade: c.grade || "-",
        status: c.registrationStatus || "Registered",
      });
    });
  });
  return rows;
};

export async function exportStudentProfilePDF({ studentDetails, activeStudent, feeSummary, degreeHistory }) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const name = studentDetails?.personalInfo?.fullName || activeStudent?.personalInfo?.fullName || "Unknown Student";
  const regNo = studentDetails?.studentId || activeStudent?.studentId || "N/A";

  const doc = new jsPDF({ orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.width;

  doc.setFontSize(15);
  doc.setFont(undefined, "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("CISD", pageWidth / 2, 16, { align: "center" });
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Student Academic Profile", pageWidth / 2, 22, { align: "center" });
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(14, 28, pageWidth - 14, 28);
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, pageWidth - 14, 8, { align: "right" });

  let y = 38;
  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(name, 14, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.setTextColor(71, 85, 105);
  const infoLines = [
    `Reg No: ${regNo}      Status: ${studentDetails?.status || "-"}`,
    `Department: ${studentDetails?.department?.name || "-"}      Program: ${studentDetails?.program?.name || "-"}`,
    `Semester: ${studentDetails?.semester?.number ?? "-"}      Session: ${studentDetails?.session?.name || "-"}`,
    `Phone: ${studentDetails?.personalInfo?.phone || "-"}      Email: ${studentDetails?.personalInfo?.email || "-"}`,
    `CNIC: ${studentDetails?.personalInfo?.cnic || "-"}`,
    `Father's Name: ${studentDetails?.familyInfo?.fatherName || "-"}`,
  ];
  infoLines.forEach((line) => {
    doc.text(line, 14, y);
    y += 5.5;
  });

  y += 3;
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Fee Status — Current Semester", 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.setTextColor(71, 85, 105);
  const feeLabel = FEE_LABELS[feeSummary?.status] || "Not Generated";
  doc.text(
    `Status: ${feeLabel}      Net: ${fmtMoney(feeSummary?.net)}      Paid: ${fmtMoney(feeSummary?.paid)}      Due: ${fmtMoney(feeSummary?.remaining)}`,
    14,
    y,
  );
  y += 10;

  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Academic History — Semester Wise", 14, y);
  y += 4;

  const rows = flattenHistory(degreeHistory);

  autoTable(doc, {
    startY: y,
    head: [["Section", "Code", "Course Title", "Credits", "Marks", "Grade", "Status"]],
    body: rows.length
      ? rows.map((r) => [r.semester, r.code, r.title, r.credits, r.marks, r.grade, r.status])
      : [["-", "-", "No academic history available yet", "-", "-", "-", "-"]],
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 1.8 },
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`Academic_Profile_${regNo}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function exportStudentProfileExcel({ studentDetails, activeStudent, feeSummary, degreeHistory }) {
  const XLSX = await import("xlsx");

  const name = studentDetails?.personalInfo?.fullName || activeStudent?.personalInfo?.fullName || "Unknown Student";
  const regNo = studentDetails?.studentId || activeStudent?.studentId || "N/A";

  const profileRows = [
    { Field: "Name", Value: name },
    { Field: "Reg No", Value: regNo },
    { Field: "Status", Value: studentDetails?.status || "-" },
    { Field: "Department", Value: studentDetails?.department?.name || "-" },
    { Field: "Program", Value: studentDetails?.program?.name || "-" },
    { Field: "Semester", Value: studentDetails?.semester?.number ?? "-" },
    { Field: "Session", Value: studentDetails?.session?.name || "-" },
    { Field: "Phone", Value: studentDetails?.personalInfo?.phone || "-" },
    { Field: "Email", Value: studentDetails?.personalInfo?.email || "-" },
    { Field: "CNIC", Value: studentDetails?.personalInfo?.cnic || "-" },
    { Field: "Father's Name", Value: studentDetails?.familyInfo?.fatherName || "-" },
    { Field: "Fee Status (Current Semester)", Value: FEE_LABELS[feeSummary?.status] || "Not Generated" },
    { Field: "Net Amount (PKR)", Value: feeSummary?.net || 0 },
    { Field: "Paid Amount (PKR)", Value: feeSummary?.paid || 0 },
    { Field: "Remaining Amount (PKR)", Value: feeSummary?.remaining || 0 },
  ];

  const historyRows = flattenHistory(degreeHistory).map((r) => ({
    Semester: r.semester,
    Term: r.term,
    SGPA: r.sgpa ?? "-",
    Code: r.code,
    "Course Title": r.title,
    Credits: r.credits,
    Marks: r.marks,
    Grade: r.grade,
    Status: r.status,
  }));

  const wb = XLSX.utils.book_new();

  const profileSheet = XLSX.utils.json_to_sheet(profileRows);
  profileSheet["!cols"] = [{ wch: 30 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, profileSheet, "Profile");

  const historySheet = XLSX.utils.json_to_sheet(
    historyRows.length ? historyRows : [{ Semester: "-", Note: "No academic history available yet" }],
  );
  historySheet["!cols"] = Object.keys(historyRows[0] || { Semester: "", Term: "", SGPA: "", Code: "", "Course Title": "", Credits: "", Marks: "", Grade: "", Status: "" }).map(() => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(wb, historySheet, "Academic History");

  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  const blob = new Blob([buf], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Academic_Profile_${regNo}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Batch list export (whichever "Students in Selected Batch" table is
// currently on screen) ---
const rowsFromBatch = (students, getName, getRegNo) =>
  students.map((s) => ({
    "Reg No": getRegNo(s),
    "Student Name": getName(s),
    Status: s.status || "-",
  }));

export async function exportBatchListExcel(students, { getName, getRegNo, batchLabel }) {
  const XLSX = await import("xlsx");
  const rows = rowsFromBatch(students, getName, getRegNo);
  const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ "Reg No": "-", "Student Name": "No students in this batch", Status: "-" }]);
  sheet["!cols"] = [{ wch: 20 }, { wch: 30 }, { wch: 14 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Students");

  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  const blob = new Blob([buf], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Students_${(batchLabel || "Batch").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportBatchListPDF(students, { getName, getRegNo, batchLabel }) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.width;

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont(undefined, "bold");
  doc.text("CISD", pageWidth / 2, 14, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont(undefined, "normal");
  doc.text(`Students — ${batchLabel || "Selected Batch"}`, pageWidth / 2, 20, { align: "center" });
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.4);
  doc.line(14, 24, pageWidth - 14, 24);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, pageWidth - 14, 10, { align: "right" });
  doc.text(`Total: ${students.length}`, 14, 10);

  const rows = rowsFromBatch(students, getName, getRegNo);
  autoTable(doc, {
    startY: 28,
    head: [["Reg No", "Student Name", "Status"]],
    body: rows.length ? rows.map((r) => [r["Reg No"], r["Student Name"], r.Status]) : [["-", "No students in this batch", "-"]],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(`Students_${(batchLabel || "Batch").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
