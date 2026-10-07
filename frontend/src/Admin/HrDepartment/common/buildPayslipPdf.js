// Branded payslip PDF — mirrors the logo-header + autoTable-per-section
// pattern already used across this app's other downloadable reports
// (frontend/src/Admin/Admission/common/buildStudentProfilePdf.js), so
// every generated document looks consistent.

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

const money = (n) => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;

export async function buildPayslipPdf(slip) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.width;

  let logoImg = null;
  try {
    logoImg = await loadImage(`${window.location.origin}/cisd-logo.png`);
  } catch {
    // Logo is a nice-to-have — the slip still generates fine without it.
  }

  if (logoImg) {
    try {
      doc.addImage(logoImg, "PNG", 14, 10, 20, 20);
    } catch {
      // A malformed/undecodable image shouldn't block the slip.
    }
  }
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138);
  doc.setFont(undefined, "bold");
  doc.text("CISD", pageWidth / 2, 17, { align: "center" });
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont(undefined, "normal");
  doc.text("Salary Slip", pageWidth / 2, 23, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.setFont(undefined, "bold");
  doc.text(`${MONTHS[slip.month - 1]} ${slip.year}`, pageWidth - 14, 13, { align: "right" });
  doc.setFont(undefined, "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, pageWidth - 14, 18, { align: "right" });

  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.6);
  doc.line(14, 33, pageWidth - 14, 33);

  const sectionHead = (fillColor = [79, 70, 229]) => ({
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 1.8 },
    headStyles: { fillColor, textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 45, fillColor: [248, 250, 252] } },
  });

  let y = 38;
  const sectionTitle = (title) => {
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

  const staffName = slip.staffId?.personalInfo?.name || "N/A";
  const employeeId = slip.staffId?.employeeId || "N/A";
  const departmentName = slip.staffId?.departmentId?.name || "N/A";

  sectionTitle("Employee Information");
  table([
    ["Employee Name", staffName, "Employee ID", employeeId],
    ["Department", departmentName, "Status", slip.status || "N/A"],
  ], { columnStyles: { 0: { fontStyle: "bold", cellWidth: 32 }, 2: { fontStyle: "bold", cellWidth: 32 } } });

  sectionTitle("Earnings");
  const earningsRows = [["Basic Salary", money(slip.basicSalary)]];
  (slip.allowances || []).forEach((a) => earningsRows.push([a.name, money(a.amount)]));
  table(earningsRows, { columnStyles: { 0: { fontStyle: "bold", cellWidth: 90 } } });

  if ((slip.deductions || []).length > 0) {
    sectionTitle("Deductions");
    table(
      slip.deductions.map((d) => [d.name, money(d.amount)]),
      { columnStyles: { 0: { fontStyle: "bold", cellWidth: 90 } }, headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontStyle: "bold" } },
    );
  }

  sectionTitle("Net Payable");
  table([["Net Payable", money(slip.netPayable)]], {
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 90 } },
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: "bold" },
    bodyStyles: { fontStyle: "bold", fontSize: 10 },
  });

  if (slip.status === "Paid") {
    sectionTitle("Payment Details");
    table([
      ["Payment Date", slip.paymentDate ? new Date(slip.paymentDate).toLocaleDateString("en-GB") : "N/A"],
      ["Transaction ID", slip.transactionId || "N/A"],
    ], { columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } } });
  }

  doc.save(`Payslip_${employeeId}_${MONTHS[slip.month - 1]}_${slip.year}.pdf`);
}
