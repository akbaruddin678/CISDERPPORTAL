import autoTable from "jspdf-autotable";

// Shared PDF-drawing logic for both the Results & Grading screen's "print
// transcript" shortcut and the Transcript & Degree screen's official
// documents — previously duplicated near-verbatim in
// useExamResultController.js and useCertificationController.js.

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// Institute logo — load once per print action (batch or single) and reuse,
// same pattern as the Admit Card generator.
export async function getInstituteLogo() {
  try {
    return await loadImage(`${window.location.origin}/cisd-logo.png`);
  } catch {
    return null; // logo is a nice-to-have — documents still generate without it
  }
}

const INK = [15, 23, 42];

export function drawBrandedHeader(doc, { title, subtitle, logoImg }) {
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.8);
  doc.rect(10, 10, 190, 277);

  doc.setFillColor(...INK);
  doc.rect(10, 10, 190, 32, "F");
  if (logoImg) {
    try {
      doc.addImage(logoImg, "PNG", 16, 14, 24, 24);
    } catch {
      // malformed/undecodable image shouldn't block the document
    }
  }
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("CISD", 105, 20, { align: "center" });
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.text("Office of the Controller of Examinations", 105, 26, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, 105, 34, { align: "center" });
  doc.setTextColor(0, 0, 0);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 105, 47, { align: "center" });
    doc.setTextColor(0, 0, 0);
  }
}

// One official transcript page. Caller owns page creation/pagination
// (doc.addPage() between students in a batch run).
export function drawTranscriptPage(doc, result, { terms, programs, filters }, logoImg) {
  drawBrandedHeader(doc, {
    title: "OFFICIAL ACADEMIC TRANSCRIPT",
    logoImg,
  });

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Student Name:", 20, 58);
  doc.text("Roll Number:", 20, 65);
  doc.text("Session:", 120, 58);
  doc.text("Program:", 120, 65);

  doc.setFont("helvetica", "normal");
  doc.text(result.name?.toUpperCase() || "N/A", 55, 58);
  doc.text(result.rollNo || "N/A", 55, 65);
  doc.text(terms.find((t) => t._id === filters.termId)?.name || "N/A", 140, 58);
  doc.text(programs.find((p) => p._id === result.programId)?.name || "N/A", 140, 65);

  const courseRows = (result.courses || []).map((c, i) => [
    i + 1,
    c.courseCode || "N/A",
    c.courseTitle || "N/A",
    c.credits || 0,
    `${c.totalMarks || 0}/${c.maxMarks || 0}`,
    c.grade || "F",
    parseFloat(c.gp || 0).toFixed(2),
  ]);

  autoTable(doc, {
    startY: 75,
    head: [["#", "Course Code", "Subject Title", "Cr.Hrs", "Marks", "Grade", "GP"]],
    body: courseRows,
    theme: "grid",
    headStyles: { fillColor: INK, textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 10 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 20, right: 20 },
  });

  const finalY = doc.lastAutoTable.finalY + 15;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Total Credits Earned:", 20, finalY);
  doc.text("Semester GPA (SGPA):", 80, finalY);
  doc.text("Academic Status:", 140, finalY);

  doc.setFont("helvetica", "normal");
  doc.text(`${result.totalCredits}`, 65, finalY);
  doc.text(`${result.sgpa}`, 125, finalY);

  doc.setTextColor(...(result.status === "Pass" ? [22, 163, 74] : [220, 38, 38]));
  doc.text(`${result.status}`, 175, finalY);
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("__________________________", 20, 265);
  doc.text("Registrar", 20, 270);
  doc.text("__________________________", 150, 265);
  doc.text("Controller of Examinations", 150, 270);
}

// Landscape provisional degree certificate — only issued for a fully-passed,
// officially declared result (guarded by the caller before invoking this).
export function drawDegreeCertificatePage(doc, result, { programs }, logoImg) {
  doc.setLineWidth(2);
  doc.setDrawColor(...INK);
  doc.rect(15, 15, 267, 180);
  doc.setLineWidth(0.5);
  doc.rect(17, 17, 263, 176);

  if (logoImg) {
    try {
      doc.addImage(logoImg, "PNG", 133, 22, 22, 22);
    } catch {
      // logo optional
    }
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  doc.text("CISD", 148, 50, { align: "center" });

  doc.setFontSize(28);
  doc.setFont("times", "bold");
  doc.text("PROVISIONAL DEGREE CERTIFICATE", 148, 62, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text("This is to certify that", 148, 80, { align: "center" });

  doc.setFontSize(26);
  doc.setFont("times", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(result.name?.toUpperCase() || "UNKNOWN STUDENT", 148, 98, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Roll Number: ${result.rollNo}`, 148, 111, { align: "center" });
  doc.text(
    "has successfully completed the prescribed requirements for the degree of",
    148,
    124,
    { align: "center" },
  );

  const programName =
    programs.find((p) => p._id === result.programId)?.name || "BACHELOR OF SCIENCE";
  doc.setFontSize(20);
  doc.setFont("times", "bold");
  doc.setTextColor(...INK);
  doc.text(programName.toUpperCase(), 148, 138, { align: "center" });

  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(`with a CGPA of ${result.sgpa}`, 148, 152, { align: "center" });

  doc.setFontSize(11);
  doc.text("_________________________", 60, 178, { align: "center" });
  doc.text("Registrar", 60, 184, { align: "center" });
  doc.text("_________________________", 237, 178, { align: "center" });
  doc.text("Vice Chancellor", 237, 184, { align: "center" });
}
