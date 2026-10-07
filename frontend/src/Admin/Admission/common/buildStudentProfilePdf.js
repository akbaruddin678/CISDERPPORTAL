// Full single-student profile PDF — institute-branded, includes every
// section shown on the Student Details page (personal, address, family,
// academic, enrollment, education history, documents, remarks). Same
// logo-header + autoTable-per-section pattern already used for the
// Accountant's Student Financial Report (StudentReportController.jsx),
// so every downloadable report in this app looks consistent.

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A");

const fmtAddr = (a) =>
  !a ? "N/A" : [a.address, a.district, a.province, a.country].filter(Boolean).join(", ") || "N/A";

export async function buildStudentProfilePdf({
  student,
  personalInfo = {},
  familyInfo = {},
  educationHistory = [],
  documents = {},
  enrollment = {},
}) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  let logoImg = null;
  try {
    logoImg = await loadImage(`${window.location.origin}/cisd-logo.png`);
  } catch {
    // Logo is a nice-to-have — the report still generates fine without it.
  }

  const drawHeader = () => {
    if (logoImg) {
      try {
        doc.addImage(logoImg, "PNG", 14, 10, 20, 20);
      } catch {
        // A malformed/undecodable image shouldn't block the report.
      }
    }
    doc.setFontSize(16);
    doc.setTextColor(30, 58, 138);
    doc.setFont(undefined, "bold");
    doc.text("CISD", pageWidth / 2, 17, { align: "center" });
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont(undefined, "normal");
    doc.text("Official Student Profile", pageWidth / 2, 23, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.setFont(undefined, "bold");
    doc.text(`Reg No: ${student.studentId || "N/A"}`, pageWidth - 14, 13, { align: "right" });
    doc.setFont(undefined, "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${fmtDate(new Date())}`, pageWidth - 14, 18, { align: "right" });

    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.6);
    doc.line(14, 33, pageWidth - 14, 33);
  };

  drawHeader();

  const sectionHead = (fillColor = [79, 70, 229]) => ({
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 1.8 },
    headStyles: { fillColor, textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 45, fillColor: [248, 250, 252] } },
  });

  let y = 38;
  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - 15) {
      doc.addPage();
      drawHeader();
      y = 38;
    }
  };

  const sectionTitle = (title) => {
    ensureSpace(10);
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.setFont(undefined, "bold");
    doc.text(title, 14, y);
    y += 3;
  };

  const table = (body, opts = {}) => {
    autoTable(doc, { startY: y, body, ...sectionHead(), ...opts });
    y = doc.lastAutoTable.finalY + 8;
  };

  sectionTitle("Personal Information");
  table([
    ["Full Name", personalInfo.fullName || "N/A", "Gender", personalInfo.gender || "N/A"],
    ["CNIC", personalInfo.cnic || "N/A", "Date of Birth", fmtDate(personalInfo.dob)],
    ["Email", personalInfo.email || "N/A", "Phone", personalInfo.phone || "N/A"],
  ], { columnStyles: { 0: { fontStyle: "bold", cellWidth: 32 }, 2: { fontStyle: "bold", cellWidth: 32 } } });

  sectionTitle("Address Details");
  table([
    ["Current Address", fmtAddr(personalInfo.currentAddress)],
    ["Permanent Address", fmtAddr(personalInfo.permanentAddress)],
  ], { columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } } });

  sectionTitle("Family Information");
  table([
    ["Father Name", familyInfo.fatherName || "N/A", "Father CNIC", familyInfo.fatherCnic || "N/A"],
    ["Guardian Phone", familyInfo.guardianPhone || "N/A", "Family Income", familyInfo.incomeBracket || "N/A"],
  ], { columnStyles: { 0: { fontStyle: "bold", cellWidth: 32 }, 2: { fontStyle: "bold", cellWidth: 32 } } });

  sectionTitle("Academic Information");
  table([
    ["Program", student.program?.name || "N/A", "Department", student.department?.name || "N/A"],
    ["Semester", student.semester?.number ? `Semester ${student.semester.number}` : "N/A", "Session", student.session?.name || "N/A"],
    ["Status", student.status || "N/A", "Enrollment", enrollment?.status || "N/A"],
  ], { columnStyles: { 0: { fontStyle: "bold", cellWidth: 32 }, 2: { fontStyle: "bold", cellWidth: 32 } } });

  sectionTitle("Education History");
  if (educationHistory.length > 0) {
    ensureSpace(20);
    autoTable(doc, {
      startY: y,
      head: [["Program", "Institute", "Board", "Start", "End", "Marks", "%"]],
      body: educationHistory.map((edu) => [
        edu.educationProgram || "N/A",
        edu.institution || "N/A",
        edu.board || "N/A",
        fmtDate(edu.startDate),
        fmtDate(edu.endDateOrResultAwaited),
        `${edu.obtainedMarks ?? "-"}/${edu.totalMarks ?? "-"}`,
        edu.percentage ? `${edu.percentage}%` : "N/A",
      ]),
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 1.6 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: "bold" },
    });
    y = doc.lastAutoTable.finalY + 8;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.setFont(undefined, "italic");
    doc.text("No education records found.", 14, y + 4);
    y += 12;
  }

  sectionTitle("Documents Submitted");
  table([
    ["Profile Photo", documents.profilePhoto ? "Submitted" : "Not Submitted", "CNIC (Front)", documents.cnicDoc_front || documents.cnicFront ? "Submitted" : "Not Submitted"],
    ["CNIC (Back)", documents.cnicDoc_back || documents.cnicBack ? "Submitted" : "Not Submitted", "Domicile", documents.domicileDoc ? "Submitted" : "Not Submitted"],
    ["Matric Certificate", documents.matricCertificate ? "Submitted" : "Not Submitted", "FSc Certificate", documents.fscCertificate ? "Submitted" : "Not Submitted"],
  ], { columnStyles: { 0: { fontStyle: "bold", cellWidth: 38 }, 2: { fontStyle: "bold", cellWidth: 38 } } });

  const remarksArray = student.promotionRemarks || [];
  if (remarksArray.length > 0) {
    sectionTitle("Remarks & Promotion History");
    ensureSpace(20);
    autoTable(doc, {
      startY: y,
      head: [["Date", "Status", "Remark"]],
      body: remarksArray.map((r) => [fmtDate(r.date), r.status || "N/A", r.remark || "N/A"]),
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 1.6 },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 30 } },
    });
  }

  doc.save(`Student_${student.studentId || "Profile"}.pdf`);
}
