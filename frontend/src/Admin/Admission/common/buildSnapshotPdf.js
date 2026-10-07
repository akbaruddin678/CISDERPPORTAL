import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Builds a full multi-section record from a trash snapshot (the exact
// payload returned by POST /api/admissions/trash/:admissionId) and
// downloads it — this is "the full record of that student" the deleting
// admin needs a copy of before the record leaves the active views.
export const downloadSnapshotPdf = (snapshot) => {
  if (!snapshot) return;
  const { admission, personalInfo, familyInfo, educationHistory, studentDocuments, challans } = snapshot;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFontSize(16);
  doc.text("Deleted Student Record", 14, 16);
  doc.setFontSize(10);
  doc.text(`Snapshot taken: ${new Date(snapshot.snapshotTakenAt || Date.now()).toLocaleString()}`, 14, 22);

  let cursorY = 30;

  autoTable(doc, {
    startY: cursorY,
    head: [["Personal Information", ""]],
    body: [
      ["Full Name", admission?.fullName || personalInfo?.fullName || "N/A"],
      ["CNIC", admission?.cnic || "N/A"],
      ["Phone", admission?.phone || "N/A"],
      ["Email", personalInfo?.email || "N/A"],
      ["Gender", admission?.gender || "N/A"],
      ["Application Status", admission?.status || "N/A"],
    ],
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
  });
  cursorY = doc.lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: cursorY,
    head: [["Family Information", ""]],
    body: [
      ["Father Name", admission?.fatherName || familyInfo?.fatherName || "N/A"],
      ["Father CNIC", admission?.fathernic || familyInfo?.fatherCnic || "N/A"],
      ["Mother Name", admission?.motherName || familyInfo?.motherName || "N/A"],
      ["Guardian Phone", admission?.guardianPhone || familyInfo?.guardianPhone || "N/A"],
    ],
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
  });
  cursorY = doc.lastAutoTable.finalY + 8;

  if (educationHistory?.length) {
    autoTable(doc, {
      startY: cursorY,
      head: [["Program", "Institution", "Board", "Obtained", "Total"]],
      body: educationHistory.map((e) => [
        e.educationProgram || "N/A",
        e.institution || "N/A",
        e.board || "N/A",
        e.obtainedMarks ?? "N/A",
        e.totalMarks ?? "N/A",
      ]),
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    });
    cursorY = doc.lastAutoTable.finalY + 8;
  }

  if (challans?.length) {
    autoTable(doc, {
      startY: cursorY,
      head: [["Challan No.", "Type", "Status", "Net Amount", "Paid"]],
      body: challans.map((c) => [
        c.challanNo || "N/A",
        c.challanType || "N/A",
        c.status || "N/A",
        c.netAmount ?? "N/A",
        c.paidAmount ?? "N/A",
      ]),
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    });
    cursorY = doc.lastAutoTable.finalY + 8;
  }

  if (studentDocuments) {
    const docLinks = Object.entries(studentDocuments).filter(
      ([, v]) => typeof v === "string" && v.startsWith("http"),
    );
    if (docLinks.length) {
      autoTable(doc, {
        startY: cursorY,
        head: [["Document", "URL"]],
        body: docLinks,
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      });
    }
  }

  const fileName = (admission?.fullName || "student").replace(/\s+/g, "_");
  doc.save(`${fileName}_Deleted_Record.pdf`);
};
