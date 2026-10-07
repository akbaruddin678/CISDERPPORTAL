// src/Admin/accountant/view/Challan/ChallanPrintTemplate.js

const LOGO_URL = window.location.origin + "/cisd-logo.png";
const ONEBILL_URL = window.location.origin + "/onelink.png";
const STAMP_URL = window.location.origin + "/accountss.jpeg";

const fmtPKR = (val) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(val || 0);

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "N/A");

const toWords = (n) => {
  if (!n || n === 0) return "Zero Rupees Only";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const convert = (num) => {
    if (num === 0) return "";
    if (num < 20) return ones[num] + " ";
    if (num < 100)
      return (
        tens[Math.floor(num / 10)] +
        (num % 10 ? " " + ones[num % 10] : "") +
        " "
      );
    if (num < 1000)
      return ones[Math.floor(num / 100)] + " Hundred " + convert(num % 100);
    if (num < 100000)
      return (
        convert(Math.floor(num / 1000)) + "Thousand " + convert(num % 1000)
      );
    if (num < 10000000)
      return (
        convert(Math.floor(num / 100000)) + "Lakh " + convert(num % 100000)
      );
    return (
      convert(Math.floor(num / 10000000)) + "Crore " + convert(num % 10000000)
    );
  };
  const rupees = Math.floor(n);
  const paisa = Math.round((n - rupees) * 100);
  let result = convert(rupees).trim() + " Rupees";
  if (paisa > 0) result += " and " + convert(paisa).trim() + " Paisa";
  return result + " Only";
};

const getPrintStyles = () => `
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
  @media print {
    @page { size: A4 landscape; margin: 0mm !important; }
    body { margin: 0 !important; padding: 0 !important; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .challan-page { width: 297mm !important; height: 209mm !important; padding: 6mm !important; page-break-after: always; display: flex; flex-direction: column; justify-content: center; }
    .challan-page:last-child { page-break-after: auto; }
    .challan-row-container { display: flex !important; flex-direction: row !important; width: 100% !important; height: 100% !important; gap: 3mm !important; justify-content: space-between !important; align-items: stretch !important; page-break-inside: avoid !important; break-inside: avoid !important; }
    .challan-card { flex: 1 !important; min-width: 0 !important; border: 0.5mm dashed #000 !important; background: white !important; position: relative !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; page-break-inside: avoid !important; break-inside: avoid !important; }
    .info-label, .fee-label { background-color: #f5f5f5 !important; }
    .total-row { background-color: #e0e0e0 !important; }
    .footer-notes { background-color: #fffde7 !important; }
    .copy-label { padding: 2px 6px; background-color: #fff !important; border: 0.3mm solid #555 !important; color: #000 !important; }
    .no-print { display: none !important; }
  }
  .challan-card { position: relative; display: flex; flex-direction: column; border: 1px dashed #333; }
  .copy-label { position: absolute; top: 5px; left: 5px; background: #e8e8e8; padding: 2px 7px; font-weight: bold; font-size: 8px; z-index: 10; border-radius: 2px; border: 0.2mm solid #555; }
  .bank-name-main { font-size: 15px; font-weight: bold; color: #1a237e; text-align: center; padding: 20px 6px 2px; letter-spacing: 0.2px; }
  .challan-header { display: flex; align-items: center; gap: 8px; padding: 2px 6px 6px; }
  .logo-container { flex-shrink: 0; width: 55px; height: 55px; display: flex; align-items: center; justify-content: center; }
  .logo-img { width: 50px; height: 50px; object-fit: contain; border-radius: 6px; }
  .header-content { flex: 1; text-align: center; }
  .fee-challan-title { font-size: 12px; font-weight: bold; color: #d32f2f; text-transform: uppercase; line-height: 1.2; margin-bottom: 2px; }
  .address { font-size: 9px; color: #333; line-height: 1.2; margin-bottom: 3px; }
  .onebill-box { margin-top: 4px; border: 2px solid #000; padding: 3px 5px; background: #e0f7fa; display: inline-block; }
  .onebill-label { font-size: 7px; font-weight: bold; text-transform: uppercase; }
  .onebill-id { font-size: 13px; font-weight: bold; letter-spacing: 1px; }
  .separator-line { border-top: 0.5mm solid #000; margin: 4px 0; flex-shrink: 0; }
  .info-section { padding: 0 6px; flex-shrink: 0; }
  .info-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9px; }
  .info-table td { border: 0.4mm solid #000; padding: 3px 4px; vertical-align: middle; word-wrap: break-word; }
  .info-label { font-weight: bold; background: #f5f5f5; width: 22%; font-size: 8.5px; }
  .info-value { width: 28%; font-size: 8.5px; }
  .fee-details-title { text-align: center; font-size: 11px; font-weight: bold; margin: 5px 0 3px; text-decoration: underline; flex-shrink: 0; }
  .content-area { flex: 1; display: flex; flex-direction: column; padding: 0 6px; }
  .table-container { flex: 1; }
  .fee-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9px; }
  .fee-table td { border: 0.4mm solid #000; padding: 2px 4px; vertical-align: middle; }
  .fee-label { font-weight: bold; background: #f5f5f5; width: 70%; font-size: 8.5px; }
  .fee-amount { text-align: right; width: 30%; font-weight: bold; font-family: 'Courier New', monospace; padding-right: 6px; font-size: 8.5px; }
  .total-row { font-weight: bold; background: #e0e0e0; }
  .total-row .fee-amount { font-size: 10px; }
  .amount-in-words { font-size: 8px; margin: 4px 0; border: 0.4mm solid #ccc; padding: 3px 4px; background: #fafafa; }
  .footer-notes { margin: 4px 0; padding: 4px 5px; border: 0.4mm solid #000; background: #fffde7; font-size: 7.5px; line-height: 1.3; border-radius: 2px; }
  .signature-section { display: flex; justify-content: space-between; align-items: flex-end; margin: 6px 0 4px; padding-top: 4px; flex-shrink: 0; }
  .signature-box { text-align: center; width: 45%; }
  .signature-line { width: 100%; border-top: 0.4mm solid #000; margin: 2px 0; }
  .signature-label { font-size: 8px; font-weight: bold; }
`;

const buildChallanCard = (challan, copyTitle) => {
  const student = challan.studentId || {};
  const personal = student.personalInfo || {};
  const fatherName =
    student.familyInfo?.fatherName || personal.fatherName || "—";
  const programName = challan.programId?.name || "N/A";
  const sessionName = challan.termId?.name || "N/A";
  const semesterNum = challan.semesterId?.number
    ? `Semester ${challan.semesterId.number}`
    : "N/A";
  const invoiceSuffix =
    challan.paymentReference && challan.paymentReference !== "00000000"
      ? challan.paymentReference
      : challan.challanNo;
  const invoiceId = `101340${invoiceSuffix}`;
  let challanTypeLabel = challan.challanType
    ? challan.challanType.replace(/_/g, " ").toUpperCase()
    : "FEE";
  if (challan.isInstallment && challan.installmentNumber) {
    challanTypeLabel =
      challanTypeLabel === "INSTALLMENT"
        ? `INSTALLMENT ${challan.installmentNumber}`
        : `${challanTypeLabel} (INSTALLMENT ${challan.installmentNumber})`;
  }
  // Each feeDetails entry (tuition sub-items, misc fees, merged previous
  // dues, ...) is ALREADY included in originalTotal — it was previously
  // shown with a blank "—" amount instead of its real value, and the
  // "(Base)" row always printed the FULL originalTotal on top of that,
  // so a challan built from itemized fees (e.g. Global Misc Fees) looked
  // like it was showing a generic, unrelated lump sum with no visible
  // amount for the fee that was actually selected. Now each line shows
  // its own real amount, and "(Base)" is only the REMAINDER not already
  // itemized — never a duplicate of what's listed below it.
  let itemizedRowsHTML = "";
  let itemizedTotal = 0;
  let hasItemizedFine = false;
  if (challan.feeDetails) {
    Object.entries(challan.feeDetails).forEach(([key, amount]) => {
      if (amount > 0 && !key.toLowerCase().includes("arrears")) {
        const label = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase());
        itemizedRowsHTML += `<tr><td class="fee-label">${label}</td><td class="fee-amount">${fmtPKR(amount)}</td></tr>`;
        // A carried-over "Fine on ..." line is display-only (never part of
        // originalTotal) — count it toward the row list but not toward the
        // base-remainder subtraction below, and skip the generic Arrears
        // fallback row so the same fine isn't shown twice.
        if (key.toLowerCase().includes("fine")) {
          hasItemizedFine = true;
        } else {
          itemizedTotal += amount;
        }
      }
    });
  }
  const baseRemainder = Math.max(0, (challan.originalTotal || 0) - itemizedTotal);
  let feeRowsHTML =
    baseRemainder > 0
      ? `<tr style="background:#f0f0f0;"><td class="fee-label" style="font-weight:900;">${challanTypeLabel} (Base)</td><td class="fee-amount" style="font-weight:900;">${fmtPKR(baseRemainder)}</td></tr>`
      : "";
  feeRowsHTML += itemizedRowsHTML;
  if (challan.arrears > 0 && !hasItemizedFine)
    feeRowsHTML += `<tr><td class="fee-label">Arrears / Previous</td><td class="fee-amount">${fmtPKR(challan.arrears)}</td></tr>`;
  if (challan.fineAmount > 0)
    feeRowsHTML += `<tr><td class="fee-label">Late Fine</td><td class="fee-amount" style="color:#dc2626">${fmtPKR(challan.fineAmount)}</td></tr>`;
  if (challan.scholarshipAmount > 0)
    feeRowsHTML += `<tr><td class="fee-label">Scholarship</td><td class="fee-amount" style="color:#16a34a">(${fmtPKR(challan.scholarshipAmount)})</td></tr>`;
  if (challan.discountAmount > 0)
    feeRowsHTML += `<tr><td class="fee-label">Discount${challan.discountReason ? ` (${challan.discountReason})` : ""}</td><td class="fee-amount" style="color:#16a34a">(${fmtPKR(challan.discountAmount)})</td></tr>`;
  return `<div class="challan-card"><div class="copy-label">${copyTitle}</div><div class="bank-name-main">CISD</div><div class="challan-header"><div class="logo-container"><img src="${LOGO_URL}" class="logo-img" alt="CISD Logo" onerror="this.style.display='none'" /></div><div class="header-content"><div class="fee-challan-title">Fee Challan</div><div class="address">Faisal Sea Square, Main G.T Road, Gate-1 B-17 Islamabad</div><div class="onebill-box"><div class="onebill-label">1Bill Invoice No.</div><div class="onebill-id">${invoiceId}</div></div></div><div class="logo-container"><img src="${ONEBILL_URL}" class="logo-img" alt="1Bill" onerror="this.style.display='none'" /></div></div><div class="separator-line"></div><div class="info-section"><table class="info-table"><tr><td class="info-label">Due Date</td><td class="info-value">${fmtDate(challan.dueDate)}</td><td class="info-label">Reg ID</td><td class="info-value">${student.studentId || "N/A"}</td></tr><tr><td class="info-label">Name</td><td class="info-value">${personal.fullName || "N/A"}</td><td class="info-label">Father Name</td><td class="info-value">${fatherName}</td></tr><tr><td class="info-label">Program</td><td class="info-value">${programName}</td><td class="info-label">Semester</td><td class="info-value">${semesterNum}</td></tr><tr><td class="info-label">Session</td><td class="info-value">${sessionName}</td><td class="info-label">Type</td><td class="info-value">${challanTypeLabel}</td></tr><tr><td class="info-label">Challan No.</td><td class="info-value" colspan="3">${challan.challanNo}</td></tr></table></div><div class="separator-line"></div><div class="content-area"><div class="fee-details-title">FEE DETAILS</div><div class="table-container"><table class="fee-table">${feeRowsHTML}<tr><td style="border:none;">&nbsp;</td><td style="border:none;"></td></tr><tr class="total-row"><td class="fee-label">GRAND TOTAL</td><td class="fee-amount">${fmtPKR(challan.netAmount)}</td></tr></table><div class="amount-in-words"><strong>Amount in Words:</strong> ${toWords(challan.netAmount)}</div><div class="footer-notes"><p><strong>Note:</strong></p><p>1- Pay via 1Link/1-Bill, Banking Apps, ATMs, Easypaisa, JazzCash, etc.</p><p>2- Direct deposit by visiting any bank branch nationwide.</p><p>A late fee of 2,000 will be charged after the due date. Five days after the due date, the fee increases to 5,000.</p></div></div><div class="signature-section"><div class="signature-box"><div class="signature-line"></div><div class="signature-label">BANK OFFICIAL</div></div><div class="signature-box"><img src="${STAMP_URL}" style="height:42px;width:auto;object-fit:contain;display:block;margin:0 auto 2px;" alt="Stamp" onerror="this.style.display='none'" /><div class="signature-line"></div><div class="signature-label">ACCOUNTS OFFICER</div></div></div></div></div>`;
};

export const buildChallanPage = (challan) =>
  `<div class="challan-page"><div class="challan-row-container">${buildChallanCard(challan, "BANK COPY")}${buildChallanCard(challan, "OFFICE COPY")}${buildChallanCard(challan, "STUDENT COPY")}</div></div>`;

export const openPrintWindow = (
  bodyHTML,
  title = "Fee Challan",
  winRef = null,
) => {
  const win = winRef || window.open("", "_blank");
  if (!win) {
    alert(
      "Pop-up blocked. Please allow pop-ups for this site to print challans.",
    );
    return;
  }
  const htmlTemplate = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>${title}</title><style>${getPrintStyles()}</style></head><body>${bodyHTML || "<h2 style='text-align:center; margin-top: 50px;'>Error: No content generated.</h2>"}<script>window.onload = function() { setTimeout(function() { window.print(); }, 800); };<\/script></body></html>`;
  win.document.open();
  win.document.write(htmlTemplate);
  win.document.close();
};
