// src/Admin/accountant/common/ChallanPrintTemplate.js

const LOGO_URL = window.location.origin + "/cisd-logo.png";

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

// Used only for older challans created before the Late Fine setting existed.
// New challans carry their own `lateFeeAmount` (0 = no fine).
export const LATE_FEE = 2000;

const COLLEGE_NAME_1 = "College of International";
const COLLEGE_NAME_2 = "Skills Development";
const COLLEGE_PHONE = "051-3757665";

const getPrintStyles = () => `
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
  body { background: #fff; color: #111; }
  @media print {
    @page { size: A4 landscape; margin: 0 !important; }
    body { margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .challan-page { width: 297mm !important; height: 209mm !important; padding: 5mm !important; page-break-after: always; }
    .challan-page:last-child { page-break-after: auto; }
    .no-print { display: none !important; }
  }
  .challan-page { width: 297mm; min-height: 209mm; padding: 5mm; margin: 0 auto; }
  .challan-row { display: flex; gap: 0; width: 100%; height: 199mm; }
  .challan-card { flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 0 2.2mm; border-right: 0.3mm dashed #777; }
  .challan-card:last-child { border-right: none; }

  .banner { display: flex; align-items: center; gap: 6px; background: #0b2a6b; color: #fff; padding: 5px 7px; border-radius: 3px; }
  .banner .logo { width: 34px; height: 34px; background: #fff; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .banner .logo img { width: 28px; height: 28px; object-fit: contain; }
  .banner .name { font-size: 12.5px; font-weight: 800; line-height: 1.15; letter-spacing: 0.1px; }
  .tel { text-align: center; font-size: 9px; font-weight: 600; margin-top: 3px; color: #333; }
  .copy-title { text-align: center; font-size: 11px; font-weight: 800; color: #c62828; margin: 1px 0 4px; text-transform: uppercase; letter-spacing: 0.4px; }

  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .info td { border: 0.3mm solid #000; padding: 3px 4px; font-size: 9px; vertical-align: middle; word-wrap: break-word; }
  .info .lbl { width: 24%; background: #f3f6e9; font-size: 8.5px; }
  .info .val { font-weight: 700; }
  .info .lbl.sm { width: 20%; }

  .month-line { display: flex; justify-content: space-between; align-items: center; font-size: 9.5px; margin: 5px 2px 4px; }
  .month-line b { font-size: 10.5px; }

  .fees td, .fees th { border: 0.3mm solid #000; padding: 3px 5px; font-size: 9px; }
  .fees th { background: #eef3dc; font-size: 9px; font-weight: 800; text-align: center; }
  .fees .sr { width: 11%; text-align: center; }
  .fees .amt { width: 28%; text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
  .fees .neg { color: #15803d; }
  .fees .pos-red { color: #b91c1c; }
  .fees tr.total td { background: #e6ecd3; font-weight: 800; font-size: 10px; }
  .fees tr.after td { font-weight: 700; }
  .fees td.empty-row { height: 15px; }

  .words { font-size: 8px; margin: 4px 0; padding: 3px 4px; border: 0.3mm solid #bbb; background: #fafafa; line-height: 1.25; }
  .notes { font-size: 8px; line-height: 1.35; margin-top: 3px; color: #222; }
  .notes b { font-size: 8.5px; }
  .spacer { flex: 1; }
  .sign { display: flex; justify-content: space-between; align-items: flex-end; gap: 8px; padding: 4px 2px 2px; }
  .sign .box { width: 48%; text-align: center; }
  .sign .box img { height: 32px; width: auto; object-fit: contain; display: block; margin: 0 auto 1px; }
  .sign .line { border-top: 0.3mm solid #000; margin-top: 18px; padding-top: 2px; font-size: 8.5px; font-weight: 700; }
  .sign .box.stamp .line { margin-top: 2px; }
  .challan-no { font-size: 8px; color: #555; text-align: center; margin-top: 3px; letter-spacing: 0.3px; }
`;

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const num = (v) => new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(v || 0);

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

// "Fee for the month of" — billingMonth is either a month name ("October",
// the installment plan's month) or a date-like value; falls back to the due
// date's month. Printed as e.g. "Oct/26".
const monthLabel = (challan) => {
  const yearOf = (d) => {
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? new Date().getFullYear() : dt.getFullYear();
  };
  const short = (idx, year) =>
    `${new Date(2000, idx, 1).toLocaleString("en-GB", { month: "short" })}/${String(year).slice(-2)}`;

  const raw = challan.billingMonth;
  if (raw) {
    const idx = MONTH_NAMES.indexOf(String(raw).trim().toLowerCase());
    if (idx >= 0) {
      // A month earlier than the due date's month belongs to the due date's year.
      const due = new Date(challan.dueDate);
      const year = Number.isNaN(due.getTime()) ? yearOf(challan.createdAt) : due.getFullYear();
      return short(idx, year);
    }
    const d = /^\d{4}-\d{2}$/.test(String(raw)) ? new Date(`${raw}-01`) : new Date(raw);
    if (!Number.isNaN(d.getTime())) return short(d.getMonth(), d.getFullYear());
  }
  const due = new Date(challan.dueDate);
  if (Number.isNaN(due.getTime())) return "N/A";
  return short(due.getMonth(), due.getFullYear());
};

// Groups the challan's itemised fees into the standard particulars shown on
// the printed challan. Anything that does not match a standard head goes to
// "Other Charges". Every itemised amount is already part of originalTotal, so
// whatever is not itemised (the base fee) is added to the matching head.
const buildParticulars = (challan) => {
  const heads = { registration: 0, admission: 0, monthly: 0, course: 0, other: 0 };
  let itemized = 0;
  const detailLines = [];

  Object.entries(challan.feeDetails || {}).forEach(([key, amount]) => {
    if (!(amount > 0) || key.toLowerCase().includes("arrears")) return;
    const k = key.toLowerCase();
    if (k.includes("fine")) {
      detailLines.push({ label: key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()), amount, tone: "red" });
      return;
    }
    itemized += amount;
    if (k.includes("regist")) heads.registration += amount;
    else if (k.includes("admission")) heads.admission += amount;
    else if (k.includes("tuition") || k.includes("monthly")) heads.monthly += amount;
    else if (k.includes("course") || k.includes("exam")) heads.course += amount;
    else heads.other += amount;
  });

  const remainder = Math.max(0, (challan.originalTotal || 0) - itemized);
  if (remainder > 0) {
    const type = String(challan.challanType || "").toLowerCase();
    if (type.includes("regist")) heads.registration += remainder;
    else if (type.includes("admission")) heads.admission += remainder;
    else heads.monthly += remainder;
  }

  const rows = [
    ["Registration Fee", heads.registration],
    ["Admission Fee", heads.admission],
    ["Monthly Fee", heads.monthly],
    ["Course Fee", heads.course],
    ["Other Charges", heads.other],
  ].map(([label, amount]) => ({ label, amount }));

  if (challan.arrears > 0 && !detailLines.length) rows.push({ label: "Arrears / Previous Dues", amount: challan.arrears, tone: "red" });
  detailLines.forEach((l) => rows.push(l));
  if (challan.fineAmount > 0 && !detailLines.length) rows.push({ label: "Late Fine", amount: challan.fineAmount, tone: "red" });
  if (challan.scholarshipAmount > 0) rows.push({ label: "Scholarship", amount: -challan.scholarshipAmount, tone: "green" });
  if (challan.discountAmount > 0) {
    rows.push({
      label: `Discount${challan.discountReason ? ` (${esc(challan.discountReason)})` : ""}`,
      amount: -challan.discountAmount,
      tone: "green",
    });
  }
  return rows;
};

const buildChallanCard = (challan, copyTitle) => {
  const student = challan.studentId || {};
  const personal = student.personalInfo || {};
  const fatherName = student.familyInfo?.fatherName || personal.fatherName || "—";
  const className =
    challan.departmentId?.name || student.departmentId?.name || challan.programId?.name || "N/A";
  const sectionName = challan.semesterId?.name || (challan.semesterId?.number ? `Section ${challan.semesterId.number}` : "N/A");
  const programName = challan.programId?.name || student.programId?.name || "N/A";
  const sessionName = challan.termId?.name || student.termId?.name || "N/A";
  // ID card number: 13 digits are shown as 12345-1234567-1.
  const rawCnic = String(personal.cnic || student.cnic || "").replace(/\D/g, "");
  const cnicText = rawCnic.length === 13
    ? `${rawCnic.slice(0, 5)}-${rawCnic.slice(5, 12)}-${rawCnic.slice(12)}`
    : rawCnic || "—";
  const issueDate = fmtDate(challan.issueDate || challan.createdAt);

  const total = challan.netAmount || 0;
  const lateFee = challan.lateFeeAmount ?? LATE_FEE;
  const rows = buildParticulars(challan);
  const minRows = 5;
  const fillers = Math.max(0, minRows - rows.length);

  const feeRows = rows
    .map((r, i) => {
      const amt = r.amount < 0 ? `(${num(-r.amount)})` : r.amount ? num(r.amount) : "";
      const cls = r.tone === "green" ? "neg" : r.tone === "red" ? "pos-red" : "";
      return `<tr><td class="sr">${i + 1}</td><td>${r.label}</td><td class="amt ${cls}">${amt}</td></tr>`;
    })
    .join("");
  const fillerRows = Array.from({ length: fillers }, () => `<tr><td class="sr empty-row"></td><td></td><td></td></tr>`).join("");

  return `<div class="challan-card">
    <div class="banner">
      <div class="logo"><img src="${LOGO_URL}" alt="CISD" onerror="this.style.display='none'" /></div>
      <div class="name">${COLLEGE_NAME_1}<br/>${COLLEGE_NAME_2}</div>
    </div>
    <div class="tel">Tel: ${COLLEGE_PHONE}</div>
    <div class="copy-title">${copyTitle}</div>

    <table class="info">
      <tr><td class="lbl">Issue Date:</td><td class="val">${issueDate}</td><td class="lbl sm">Due Date:</td><td class="val">${fmtDate(challan.dueDate)}</td></tr>
      <tr><td class="lbl">Student Name:</td><td class="val" colspan="3">${esc(personal.fullName || "N/A")}</td></tr>
      <tr><td class="lbl">Father Name:</td><td class="val" colspan="3">${esc(fatherName)}</td></tr>
      <tr><td class="lbl">ID Card No:</td><td class="val" colspan="3">${esc(cnicText)}</td></tr>
      <tr><td class="lbl">Reg. ID:</td><td class="val" colspan="3">${esc(student.studentId || "N/A")}</td></tr>
      <tr><td class="lbl">Class:</td><td class="val" colspan="3">${esc(className)}</td></tr>
      <tr><td class="lbl">Program:</td><td class="val" colspan="3">${esc(programName)}</td></tr>
      <tr><td class="lbl">Section:</td><td class="val" colspan="3">${esc(sectionName)}</td></tr>
      <tr><td class="lbl">Session:</td><td class="val" colspan="3">${esc(sessionName)}</td></tr>
    </table>

    <div class="month-line"><span>Fee For The Month(s) of:</span><b>${monthLabel(challan)}</b></div>

    <table class="fees">
      <tr><th class="sr">Sr.</th><th>Particulars</th><th class="amt" style="text-align:center">Amount</th></tr>
      ${feeRows}${fillerRows}
      <tr class="total"><td></td><td>Total =</td><td class="amt">${num(total)}</td></tr>
      ${lateFee > 0 ? `<tr class="after"><td></td><td style="text-align:right">Payable after due date</td><td class="amt">${num(total + lateFee)}</td></tr>` : ""}
    </table>

    <div class="words"><b>In words:</b> ${toWords(total)}</div>

    <div class="notes">
      <b>Note:</b><br/>
      ${lateFee > 0 ? "After the due date a fine will be charged.<br/>" : ""}
      This fee challan is valid up to the 25th of this month.
    </div>

    <div class="spacer"></div>

    <div class="sign">
      <div class="box"><div class="line">Depositor / Bank</div></div>
    </div>
    <div class="challan-no">Challan No: ${esc(challan.challanNo)}</div>
  </div>`;
};

export const buildChallanPage = (challan) =>
  `<div class="challan-page"><div class="challan-row">${buildChallanCard(challan, "Head Office Copy")}${buildChallanCard(challan, "College Copy")}${buildChallanCard(challan, "Student Copy")}</div></div>`;

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
