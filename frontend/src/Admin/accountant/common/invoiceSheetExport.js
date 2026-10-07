// Builds the bulk "Invoice Sheet" .xlsx used to hand a batch of challans to
// the payment-gateway's bulk invoice upload feature. Unlike every other
// export in this app, this file is NOT a human-facing report — it gets
// re-uploaded into a third-party system that parses it by exact header
// name, so there's deliberately no branding/title block here: row 1 is the
// header row, row 2+ is data, matching the sample template exactly:
// Invoice Number | registration_number | first_name | amount |
// amount_after_due_date | due_date | description | email | phone |
// msc_1 | msc_2 | msc_3 | msc_4
//
// Field conventions (amount split, description, misc_1/2) mirror the
// existing single-invoice numbering so a record generated
// here and one synced automatically look the same to the gateway.
//
// `due_date` is per-row: each challan's own already-stored due date, not a
// single date picked for the whole batch.
//
// Invoice Number = a fixed 6-digit prefix + the challan's own
// `paymentReference` (a 10-digit string assigned when the challan is generated —
// e.g. paymentReference "1024203396" -> Invoice Number "1013401024203396").
// `paymentReference` isn't set until a challan has actually been synced, so
// any selected challan without one yet is left out of the sheet entirely
// rather than emitting a malformed/incomplete invoice number.
const INVOICE_NUMBER_PREFIX = "101340";

const HEADERS = [
  "Invoice Number",
  "registration_number",
  "first_name",
  "amount",
  "amount_after_due_date",
  "due_date",
  "description",
  "email",
  "phone",
  "msc_1",
  "msc_2",
  "msc_3",
  "msc_4",
];

function normalizePhone(raw) {
  let phone = (raw || "923000000000").replace(/\D/g, "");
  if (phone.startsWith("03")) phone = "92" + phone.substring(1);
  else if (phone.startsWith("3")) phone = "92" + phone;
  if (phone.length < 10 || phone.length > 15) phone = "923000000000";
  return phone;
}

function formatDueDate(raw) {
  const d = raw ? new Date(raw) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toRow(challan, { fineAmount }) {
  const student = challan.studentId || {};
  const personalInfo = student.personalInfo || {};

  // "amount" is the on-time/base figure with any already-stored fine
  // stripped back out — the chosen `fineAmount` for this sheet is what
  // turns into the after-due-date penalty, not whatever was previously
  // recorded on the challan.
  const baseAmount = Math.max(
    0,
    Math.floor((challan.netAmount || 0) - (challan.fineAmount || 0)),
  );
  const lateAmount = Math.floor(baseAmount + Math.max(0, Number(fineAmount) || 0));

  return {
    invoiceNumber: `${INVOICE_NUMBER_PREFIX}${challan.paymentReference}`,
    regNo: student.studentId || "",
    firstName: (personalInfo.fullName || "Student").trim(),
    amount: baseAmount,
    amountLate: lateAmount,
    // Each challan's own already-stored due date — not a shared date
    // picked for the whole batch.
    dueDate: formatDueDate(challan.dueDate),
    description: (challan.challanType || "Fee").replace(/_/g, " "),
    email: (personalInfo.email || student.email || "no-reply@college.edu").trim(),
    phone: normalizePhone(personalInfo.phone),
    misc1: `Challan-${challan.challanNo || ""}`,
    misc2: challan._id ? String(challan._id) : "",
    misc3: "NA",
    misc4: "NA",
  };
}

export async function exportInvoiceSheet(challans, { fineAmount = 0 } = {}) {
  const eligible = challans.filter((c) => !!c.paymentReference);
  const skipped = challans
    .filter((c) => !c.paymentReference)
    .map((c) => ({
      challanNo: c.challanNo || "",
      name: c.studentId?.personalInfo?.fullName || "Unknown student",
    }));

  if (eligible.length === 0) {
    return { generatedCount: 0, skipped };
  }

  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "CISD ERP";
  wb.created = new Date();

  const ws = wb.addWorksheet("Invoices");
  ws.columns = HEADERS.map((h) => ({ header: h, key: h, width: h === "email" ? 26 : h === "first_name" ? 22 : 16 }));

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.alignment = { vertical: "middle", horizontal: "left" };
  });

  eligible.forEach((challan) => {
    const r = toRow(challan, { fineAmount });
    ws.addRow([
      r.invoiceNumber,
      r.regNo,
      r.firstName,
      r.amount,
      r.amountLate,
      r.dueDate,
      r.description,
      r.email,
      r.phone,
      r.misc1,
      r.misc2,
      r.misc3,
      r.misc4,
    ]);
  });

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Invoice_Sheet_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);

  return { generatedCount: eligible.length, skipped };
}
