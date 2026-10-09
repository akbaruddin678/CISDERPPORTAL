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
// New challans carry their own late-fine schedule.
export const LATE_FEE = 0;

const lateFineStages = (challan, total) => {
  const tiers = Array.isArray(challan.lateFineTiers) && challan.lateFineTiers.length
    ? challan.lateFineTiers
    : [{ durationDays: null, amount: challan.lateFeeAmount ?? LATE_FEE }];
  const base = Math.max(0, total - (challan.autoLateFineAmount || 0));
  let cumulativeFine = 0;
  let startDay = 1;

  return tiers.flatMap((tier, index) => {
    const amount = Math.max(0, Number(tier.amount) || 0);
    cumulativeFine += amount;
    const isLast = index === tiers.length - 1 || tier.durationDays === null;
    const duration = isLast ? null : Math.max(1, Number(tier.durationDays) || 1);
    const label = isLast
      ? `From day ${startDay} after due date`
      : startDay === startDay + duration - 1
        ? `Day ${startDay} after due date`
        : `Days ${startDay}-${startDay + duration - 1} after due date`;
    if (duration) startDay += duration;
    return cumulativeFine > 0 ? [{ label, amount: base + cumulativeFine }] : [];
  });
};

const COLLEGE_NAME = "College of International Skills Development";
const COLLEGE_PHONE = "051-3757665";

// Bank account the fee is deposited into.
const BANK = {
  name: "Faysal Bank",
  title: "College of International Skill Development",
  iban: "PK91FAYS3551499000008207",
};

const BANK_LOGO_URL = window.location.origin + "/faysal-bank-logo.png";
const BANK_LOGO_FALLBACK_URL = window.location.origin + "/faysal-bank-logo.svg";

const getPrintStyles = () => `
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  :root { --navy: #0b2a6b; --navy2: #14408f; --green: #0a7a4b; --ink: #111827; --muted: #6b7280; --line: #e5e7eb; --soft: #f3f6fb; }
  body { background: #fff; color: var(--ink); }
  @media print {
    @page { size: A4 landscape; margin: 0 !important; }
    body { margin: 0 !important; padding: 0 !important; }
    .challan-page { width: 297mm !important; height: 209mm !important; padding: 5mm !important; page-break-after: always; }
    .challan-page:last-child { page-break-after: auto; }
    .no-print { display: none !important; }
  }
  .challan-page { width: 297mm; min-height: 209mm; padding: 5mm; margin: 0 auto; }
  .challan-row { display: flex; width: 100%; height: 199mm; }
  .challan-card { flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 0 3mm; border-right: 0.3mm dashed #9ca3af; }
  .challan-card:last-child { border-right: none; }
  .challan-card:first-child { padding-left: 0; }
  .challan-card:last-child { padding-right: 0; }

  /* Header */
  .head { display: flex; align-items: center; gap: 7px; padding: 0 0 7px; border-bottom: 0.6mm solid var(--navy); }
  .head .tile { width: 48px; height: 48px; flex-shrink: 0; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
  .head .tile img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .head .tile.cisd { background: var(--navy); padding: 4px; }
  .head .tile.bank { background: #fff; border: 0.3mm solid var(--line); padding: 3px; }
  .head .mid { flex: 1; text-align: center; min-width: 0; }
  .head .name { font-size: 11px; font-weight: 800; line-height: 1.2; color: var(--navy); text-transform: uppercase; letter-spacing: 0.2px; }
  .head .tel { font-size: 8.5px; color: var(--muted); margin-top: 2px; font-weight: 600; }

  .meta { display: flex; justify-content: space-between; align-items: center; margin: 7px 0 8px; }
  .meta .copy { background: var(--navy); color: #fff; font-size: 8.5px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; padding: 3px 9px; border-radius: 20px; }
  .meta .no { font-size: 8.5px; color: var(--muted); font-weight: 600; }
  .meta .no b { color: var(--ink); letter-spacing: 0.3px; }

  /* Amount hero */
  .hero { background: linear-gradient(135deg, var(--navy), var(--navy2)); color: #fff; border-radius: 8px; padding: 9px 11px; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .hero .lab { font-size: 8px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; opacity: .8; }
  .hero .amt { font-size: 22px; font-weight: 800; line-height: 1.1; margin-top: 2px; font-variant-numeric: tabular-nums; }
  .hero .amt small { font-size: 11px; font-weight: 700; opacity: .85; margin-right: 3px; }
  .hero .due { text-align: right; }
  .hero .due .d { font-size: 12px; font-weight: 800; margin-top: 2px; }
  .words { font-size: 8.3px; color: var(--muted); margin: 4px 2px 0; line-height: 1.3; font-style: italic; }

  /* Section titles */
  .sec { font-size: 8.5px; font-weight: 800; letter-spacing: 0.9px; text-transform: uppercase; color: var(--navy); margin: 10px 0 4px; display: flex; align-items: center; gap: 6px; }
  .sec::after { content: ""; flex: 1; height: 0.25mm; background: var(--line); }

  /* Student details */
  .kv { width: 100%; border-collapse: collapse; }
  .kv td { padding: 3.2px 0; font-size: 9.5px; border-bottom: 0.2mm solid var(--line); vertical-align: top; }
  .kv td.k { width: 33%; color: var(--muted); font-weight: 600; }
  .kv td.v { font-weight: 700; color: var(--ink); word-break: break-word; }
  .kv tr:last-child td { border-bottom: none; }
  .kv td.v.big { font-size: 11px; color: var(--navy); }

  /* Fee breakdown */
  .month { display: flex; justify-content: space-between; align-items: center; background: var(--soft); border-radius: 6px; padding: 5px 9px; font-size: 9.3px; color: var(--muted); font-weight: 600; margin-bottom: 4px; }
  .month b { color: var(--navy); font-size: 11px; }
  .fees { width: 100%; border-collapse: collapse; }
  .fees th { text-align: left; font-size: 8px; letter-spacing: .7px; text-transform: uppercase; color: var(--muted); font-weight: 700; padding: 3px 5px; border-bottom: 0.3mm solid var(--navy); }
  .fees th.r, .fees td.r { text-align: right; }
  .fees td { padding: 4.2px 5px; font-size: 9.6px; border-bottom: 0.2mm solid var(--line); }
  .fees tr:nth-child(even) td { background: #fafbfd; }
  .fees td.r { font-weight: 700; font-variant-numeric: tabular-nums; }
  .fees .neg { color: #15803d; }
  .fees .red { color: #b91c1c; }
  .fees tr.total td { background: var(--soft); border-top: 0.4mm solid var(--navy); border-bottom: none; font-weight: 800; font-size: 11px; color: var(--navy); padding: 6px 5px; }

  /* Late fine */
  .late { margin-top: 7px; border: 0.3mm solid #f1c0c0; background: #fff6f6; border-radius: 6px; padding: 5px 8px; }
  .late .t { font-size: 8px; font-weight: 800; color: #b91c1c; letter-spacing: .7px; text-transform: uppercase; margin-bottom: 2px; }
  .late .r { display: flex; justify-content: space-between; font-size: 9px; padding: 1.5px 0; color: #7f1d1d; }
  .late .r b { font-variant-numeric: tabular-nums; }

  /* Bank */
  .bank { margin-top: 10px; border: 0.3mm solid #b7dfca; border-left: 1.2mm solid var(--green); background: #f4fbf7; border-radius: 6px; padding: 6px 9px; }
  .bank .t { font-size: 8px; font-weight: 800; color: var(--green); letter-spacing: .8px; text-transform: uppercase; margin-bottom: 3px; }
  .bank .r { display: flex; gap: 6px; font-size: 9.3px; padding: 1.5px 0; }
  .bank .r span:first-child { width: 17%; color: var(--muted); font-weight: 600; flex-shrink: 0; }
  .bank .r span:last-child { font-weight: 700; word-break: break-word; }
  .bank .iban { font-family: Consolas, 'Courier New', monospace; font-size: 10.5px; letter-spacing: .4px; color: var(--green); }

  .notes { font-size: 8.3px; line-height: 1.5; margin-top: 8px; color: #4b5563; padding-left: 10px; }
  .notes li { margin-bottom: 1px; }
  .spacer { flex: 1; min-height: 6px; }
  .sign { display: flex; justify-content: space-between; gap: 14px; padding: 0 2px; }
  .sign .box { flex: 1; text-align: center; }
  .sign .line { border-top: 0.3mm solid #111; margin-top: 26px; padding-top: 3px; font-size: 8.5px; font-weight: 700; color: #374151; }
  .foot { text-align: center; font-size: 7.5px; color: #9ca3af; margin-top: 7px; letter-spacing: .3px; }
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
  const stages = lateFineStages(challan, total);
  // Only the heads that actually carry an amount are printed.
  let rows = buildParticulars(challan).filter((r) => r.amount);
  if (!rows.length) rows = [{ label: "Monthly Fee", amount: 0 }];

  const feeRows = rows
    .map((r, i) => {
      const amt = r.amount < 0 ? `(${num(-r.amount)})` : num(r.amount);
      const cls = r.tone === "green" ? "neg" : r.tone === "red" ? "red" : "";
      return `<tr><td style="width:9%;color:#9ca3af">${i + 1}</td><td>${r.label}</td><td class="r ${cls}">${amt}</td></tr>`;
    })
    .join("");

  const lateBox = stages.length
    ? `<div class="late"><div class="t">Late fine — payable after due date</div>${stages
        .map((s) => `<div class="r"><span>${s.label}</span><b>Rs ${num(s.amount)}</b></div>`)
        .join("")}</div>`
    : "";

  return `<div class="challan-card">
    <div class="head">
      <div class="tile cisd"><img src="${LOGO_URL}" alt="CISD" onerror="this.style.display='none'" /></div>
      <div class="mid">
        <div class="name">${COLLEGE_NAME}</div>
        <div class="tel">Tel: ${COLLEGE_PHONE}</div>
      </div>
      <div class="tile bank"><img src="${BANK_LOGO_URL}" alt="${BANK.name}" onerror="this.onerror=null;this.src='${BANK_LOGO_FALLBACK_URL}'" /></div>
    </div>

    <div class="meta">
      <span class="copy">${copyTitle}</span>
      <span class="no">Challan No: <b>${esc(challan.challanNo)}</b></span>
    </div>

    <div class="hero">
      <div>
        <div class="lab">Amount payable</div>
        <div class="amt"><small>PKR</small>${num(total)}</div>
      </div>
      <div class="due">
        <div class="lab">Due date</div>
        <div class="d">${fmtDate(challan.dueDate)}</div>
      </div>
    </div>
    <div class="words">${toWords(total)}</div>

    <div class="sec">Student details</div>
    <table class="kv">
      <tr><td class="k">Name</td><td class="v big">${esc(personal.fullName || "N/A")}</td></tr>
      <tr><td class="k">Father name</td><td class="v">${esc(fatherName)}</td></tr>
      <tr><td class="k">ID card no</td><td class="v">${esc(cnicText)}</td></tr>
      <tr><td class="k">Reg. ID</td><td class="v">${esc(student.studentId || "N/A")}</td></tr>
      <tr><td class="k">Class</td><td class="v">${esc(className)}</td></tr>
      <tr><td class="k">Program</td><td class="v">${esc(programName)}</td></tr>
      <tr><td class="k">Section</td><td class="v">${esc(sectionName)}</td></tr>
      <tr><td class="k">Session</td><td class="v">${esc(sessionName)}</td></tr>
      <tr><td class="k">Issue date</td><td class="v">${issueDate}</td></tr>
    </table>

    <div class="sec">Fee details</div>
    <div class="month"><span>Fee for the month of</span><b>${monthLabel(challan)}</b></div>
    <table class="fees">
      <tr><th>#</th><th>Particulars</th><th class="r">Amount (Rs)</th></tr>
      ${feeRows}
      <tr class="total"><td></td><td>Total payable</td><td class="r">${num(total)}</td></tr>
    </table>
    ${lateBox}

    <div class="bank">
      <div class="t">Deposit in ${BANK.name} only</div>
      <div class="r"><span>Bank</span><span>${BANK.name}</span></div>
      <div class="r"><span>Title</span><span>${BANK.title}</span></div>
      <div class="r"><span>IBAN</span><span class="iban">${BANK.iban}</span></div>
    </div>

    <ul class="notes">
      ${stages.length ? "<li>Late fine is added automatically after the due date, as shown above.</li>" : ""}
      <li>This challan is valid up to the 25th of the month.</li>
      <li>Please keep the stamped student copy as proof of payment.</li>
    </ul>

    <div class="spacer"></div>

    <div class="sign">
      <div class="box"><div class="line">Depositor</div></div>
      <div class="box"><div class="line">Bank stamp &amp; signature</div></div>
    </div>
    <div class="foot">${COLLEGE_NAME} · Tel ${COLLEGE_PHONE}</div>
  </div>`;
};

export const buildChallanPage = (challan) =>
  `<div class="challan-page"><div class="challan-row">${buildChallanCard(challan, "Bank Copy")}${buildChallanCard(challan, "College Copy")}${buildChallanCard(challan, "Student Copy")}</div></div>`;

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
  const htmlTemplate = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>${title}</title><style>${getPrintStyles()}</style></head><body>${bodyHTML || "<h2 style='text-align:center; margin-top: 50px;'>Error: No content generated.</h2>"}<script>window.onload = function() { setTimeout(function() { window.print(); }, 800); };</script></body></html>`;
  win.document.open();
  win.document.write(htmlTemplate);
  win.document.close();
};
