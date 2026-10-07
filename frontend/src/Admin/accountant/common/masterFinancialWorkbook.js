// Shared Master Data workbook builder — used by both the University Student
// Report module and the College/Intermediate Studies module, so both sides
// produce the exact same report design instead of two different exports.

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const CURRENCY_FMT = '"Rs. "#,##0';
const HEADER_FILL = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1E3A8A" },
};
const HEADER_FONT = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
const THIN = { style: "thin", color: { argb: "FFD9DEE7" } };
const CELL_BORDER = { top: THIN, bottom: THIN, left: THIN, right: THIN };
const STRIPE_FILL = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF3F5F9" },
};

// Adds a styled sheet: bold white-on-blue header row, frozen header,
// autofilter, thin borders on every cell, currency number formats on the
// given columns, and light row-striping — the same treatment for every
// sheet in the workbook so the whole file reads as one designed document
// instead of a bare data dump.
function addStyledSheet(wb, name, columns, rows, moneyKeys = []) {
  const ws = wb.addWorksheet(name);
  ws.columns = columns;
  ws.addRows(rows);

  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = CELL_BORDER;
  });
  headerRow.height = 26;

  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };

  const moneyCols = new Set(
    columns
      .map((c, i) => (moneyKeys.includes(c.key) ? i + 1 : null))
      .filter(Boolean),
  );

  for (let r = 2; r <= rows.length + 1; r++) {
    const row = ws.getRow(r);
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = CELL_BORDER;
      if (moneyCols.has(colNumber)) cell.numFmt = CURRENCY_FMT;
      if (r % 2 === 0) cell.fill = STRIPE_FILL;
    });
  }
  return ws;
}

// Master Data export — the backend computes both sheets directly and
// SEPARATELY (`summaryRows`: exactly ONE row per student, always their
// CURRENT semester — zeroed out if they have no fee setup/installment/
// challan for it yet, but never omitted, and never a row for a past
// semester even if that's where their fee/challan history actually lives;
// `challanRows`: one row per actual challan, same current-semester-only
// scope). Each summary row's Fee Setup/Installments are scoped to that
// student's current semester specifically, not summed across every
// semester they've ever had.
export async function buildMasterFinancialWorkbook(summaryRows, challanRows) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "CISD ERP";
  wb.created = new Date();

  const summaryColumns = [
    { header: "Reg No", key: "regNo", width: 16 },
    { header: "Student Name", key: "studentName", width: 28 },
    { header: "Father Name", key: "fatherName", width: 24 },
    { header: "Program", key: "program", width: 30 },
    { header: "Class", key: "department", width: 24 },
    { header: "Section", key: "semester", width: 10 },
    { header: "Session", key: "session", width: 14 },
    { header: "Total Fee", key: "totalFee", width: 16 },
    { header: "Total Fee Generated", key: "totalFeeGenerated", width: 18 },
    { header: "Total Paid", key: "totalPaid", width: 14 },
    { header: "Outstanding", key: "outstanding", width: 14 },
    { header: "Scholarship Name", key: "scholarshipName", width: 20 },
    { header: "Scholarship Amount", key: "scholarshipAmount", width: 18 },
    { header: "Fine Collected", key: "fineCollected", width: 14 },
    { header: "Installments Paid", key: "installmentsPaid", width: 16 },
    { header: "Total Installments", key: "totalInstallments", width: 16 },
    { header: "Has Installment Plan", key: "hasPlan", width: 16 },
    { header: "Payment Status", key: "paymentStatus", width: 14 },
    {
      header: "Total Amount Paid (All Fee Types)",
      key: "grandTotalPaid",
      width: 24,
    },
    { header: "Challan Count", key: "challanCount", width: 14 },
  ];
  const summaryData = summaryRows.map((s) => ({
    regNo: s.studentId || "—",
    studentName: s.studentName || "—",
    fatherName: s.fatherName || "—",
    program: s.program || "—",
    department: s.department || "—",
    semester: s.semester || "—",
    session: s.session || "—",
    totalFee: s.configuredTotalFee || 0,
    totalFeeGenerated: s.totalFeeGenerated || 0,
    totalPaid: s.totalPaid || 0,
    outstanding: s.outstanding || 0,
    scholarshipName: s.scholarshipName || "—",
    scholarshipAmount: s.scholarshipAmount || 0,
    fineCollected: s.fineCollected || 0,
    installmentsPaid: s.installmentsPaid || 0,
    totalInstallments: s.totalInstallments || 1,
    hasPlan: (s.installmentMonths || []).length > 0 ? "Yes" : "No",
    paymentStatus: s.paymentStatus || "—",
    grandTotalPaid: s.grandTotalPaid || 0,
    challanCount: s.challanCount || 0,
  }));
  addStyledSheet(wb, "Student Summary", summaryColumns, summaryData, [
    "totalFee",
    "totalFeeGenerated",
    "totalPaid",
    "outstanding",
    "scholarshipAmount",
    "fineCollected",
    "grandTotalPaid",
  ]);

  // One row PER MONTH for every installment plan — August, September,
  // October etc. each get their own row instead of being crammed into a
  // single cell, so the schedule reads like a real ledger.
  const instRows = [];
  summaryRows.forEach((s) => {
    (s.installmentMonths || []).forEach((m, i) => {
      instRows.push({
        regNo: s.studentId || "—",
        studentName: s.studentName || "—",
        program: s.program || "—",
        semester: s.semester || "—",
        session: s.session || "—",
        installmentNo: i + 1,
        month: m.month || "—",
        amount: m.amount || 0,
      });
    });
  });
  if (instRows.length > 0) {
    const instColumns = [
      { header: "Reg No", key: "regNo", width: 16 },
      { header: "Student Name", key: "studentName", width: 28 },
      { header: "Program", key: "program", width: 30 },
      { header: "Section", key: "semester", width: 10 },
      { header: "Session", key: "session", width: 14 },
      { header: "Installment #", key: "installmentNo", width: 14 },
      { header: "Month", key: "month", width: 16 },
      { header: "Amount", key: "amount", width: 16 },
    ];
    addStyledSheet(wb, "Installment Schedule", instColumns, instRows, [
      "amount",
    ]);
  }

  const challanColumns = [
    { header: "Reg No", key: "regNo", width: 16 },
    { header: "Student Name", key: "studentName", width: 28 },
    { header: "Challan No", key: "challanNo", width: 18 },
    { header: "Type", key: "type", width: 18 },
    { header: "Billing Month", key: "billingMonth", width: 14 },
    { header: "Installment", key: "installment", width: 12 },
    { header: "Generated On", key: "generatedOn", width: 14 },
    { header: "Due Date", key: "dueDate", width: 14 },
    { header: "Base Amount", key: "baseAmount", width: 14 },
    { header: "Scholarship", key: "scholarship", width: 14 },
    { header: "Fine", key: "fine", width: 12 },
    { header: "Net Amount", key: "netAmount", width: 14 },
    { header: "Paid Amount", key: "paidAmount", width: 14 },
    { header: "Outstanding", key: "outstanding", width: 14 },
    { header: "Status", key: "status", width: 12 },
  ];
  const challanData = challanRows.map((r) => ({
    regNo: r.studentId || "—",
    studentName: r.studentName || "—",
    challanNo: r.challanNo || "—",
    type: r.challanType || "—",
    billingMonth: r.billingMonth || "—",
    installment: r.isInstallment === "Yes" ? "Yes" : "—",
    generatedOn: r.generatedDate
      ? new Date(r.generatedDate).toLocaleDateString("en-GB")
      : "—",
    dueDate: r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-GB") : "—",
    baseAmount: r.originalAmount || 0,
    scholarship: r.scholarshipAmount || 0,
    fine: r.fineAmount || 0,
    netAmount: r.netAmount || 0,
    paidAmount: r.paidAmount || 0,
    outstanding: r.remainingAmount || 0,
    status: r.status || "—",
  }));
  if (challanData.length > 0) {
    addStyledSheet(wb, "All Challans", challanColumns, challanData, [
      "baseAmount",
      "scholarship",
      "fine",
      "netAmount",
      "paidAmount",
      "outstanding",
    ]);
  }

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
