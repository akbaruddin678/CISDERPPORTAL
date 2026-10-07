import React, { useState, useMemo } from "react";
import {
  Search,
  Printer,
  Eye,
  Filter,
  FileText,
  X,
  Calendar,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
  School,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Image as ImageIcon,
  MessageSquare,
  Globe,
  Layers,
  FileSpreadsheet,
  TrendingUp,
  Hash,
  BadgeCheck,
  Banknote,
} from "lucide-react";

// ─── Helpers & Formatting ──────────────────────────────────────────────────
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

// ─── Excel Export ─────────────────────────────────────────────────────────
const exportToExcel = (challans, filters) => {
  // Build CSV content as a fallback that opens in Excel
  const headers = [
    "Challan No.",
    "Student Name",
    "Registration ID",
    "Father Name",
    "Program",
    "Semester",
    "Session",
    "Challan Type",
    "Due Date",
    "Original Amount (PKR)",
    "Arrears (PKR)",
    "Fine Amount (PKR)",
    "Scholarship (PKR)",
    "Discount (PKR)",
    "Net Amount (PKR)",
    "Status",
    "Payment Source",
    "1Bill Invoice No.",
  ];

  const rows = challans.map((c) => {
    const student = c.studentId || {};
    const personal = student.personalInfo || {};
    const fatherName =
      student.familyInfo?.fatherName || personal.fatherName || "";
    const isPaid = c.status === "paid";
    const isManual = isPaid && (c.paymentProof || c.paymentRemark);
    const invoiceSuffix =
      c.paymentReference && c.paymentReference !== "00000000"
        ? c.paymentReference
        : c.challanNo;
    const invoiceId = `101340${invoiceSuffix}`;
    let challanTypeLabel = c.challanType
      ? c.challanType.replace(/_/g, " ").toUpperCase()
      : "FEE";
    if (c.isInstallment && c.installmentNumber) {
      challanTypeLabel =
        challanTypeLabel === "INSTALLMENT"
          ? `INSTALLMENT ${c.installmentNumber}`
          : `${challanTypeLabel} (INSTALLMENT ${c.installmentNumber})`;
    }
    return [
      c.challanNo || "",
      personal.fullName || "",
      student.studentId || "",
      fatherName,
      c.programId?.name || "",
      c.semesterId?.number ? `Semester ${c.semesterId.number}` : "",
      c.termId?.name || "",
      challanTypeLabel,
      fmtDate(c.dueDate),
      c.originalTotal || 0,
      c.arrears || 0,
      c.fineAmount || 0,
      c.scholarshipAmount || 0,
      c.discountAmount || 0,
      c.netAmount || 0,
      c.isDeleted ? "Void" : c.status || "",
      isPaid ? (isManual ? "System / Manual" : "Portal / 1Link") : "—",
      invoiceId,
    ];
  });

  // Use SheetJS if available, otherwise fallback to CSV
  if (typeof window !== "undefined" && window.XLSX) {
    const wb = window.XLSX.utils.book_new();
    const wsData = [headers, ...rows];
    const ws = window.XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws["!cols"] = [
      { wch: 14 },
      { wch: 28 },
      { wch: 14 },
      { wch: 22 },
      { wch: 22 },
      { wch: 12 },
      { wch: 16 },
      { wch: 22 },
      { wch: 12 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 12 },
      { wch: 20 },
      { wch: 18 },
    ];

    window.XLSX.utils.book_append_sheet(wb, ws, "Challans");

    // Summary sheet
    const statusCounts = challans.reduce((acc, c) => {
      const s = c.isDeleted ? "void" : c.status;
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    const totalNet = challans.reduce((sum, c) => sum + (c.netAmount || 0), 0);
    const paidNet = challans
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + (c.netAmount || 0), 0);

    const summaryData = [
      ["CISD — Challan Export Summary"],
      ["Generated On", new Date().toLocaleString("en-GB")],
      ["Total Records", challans.length],
      [],
      ["Status Breakdown"],
      ["Status", "Count"],
      ...Object.entries(statusCounts).map(([k, v]) => [
        k.charAt(0).toUpperCase() + k.slice(1),
        v,
      ]),
      [],
      ["Financial Summary"],
      ["Metric", "Amount (PKR)"],
      ["Total Net Payable", totalNet],
      ["Total Collected (Paid)", paidNet],
      ["Outstanding", totalNet - paidNet],
    ];
    const wsSummary = window.XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary["!cols"] = [{ wch: 28 }, { wch: 22 }];
    window.XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    const dateStr = new Date().toISOString().slice(0, 10);
    window.XLSX.writeFile(wb, `CISD_Challans_${dateStr}.xlsx`);
  } else {
    // CSV fallback
    const escape = (v) => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const csvContent = [headers, ...rows]
      .map((row) => row.map(escape).join(","))
      .join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CISD_Challans_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
};

// ─── Print Helpers ────────────────────────────────────────────────────────
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
  let feeRowsHTML = `<tr style="background:#f0f0f0;"><td class="fee-label" style="font-weight:900;">${challanTypeLabel} (Base)</td><td class="fee-amount" style="font-weight:900;">${fmtPKR(challan.originalTotal)}</td></tr>`;
  if (challan.feeDetails) {
    Object.entries(challan.feeDetails).forEach(([key, amount]) => {
      if (amount > 0 && !key.toLowerCase().includes("arrears")) {
        const label = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase());
        feeRowsHTML += `<tr><td class="fee-label">${label}</td><td class="fee-amount">—</td></tr>`;
      }
    });
  }
  if (challan.arrears > 0)
    feeRowsHTML += `<tr><td class="fee-label">Arrears / Previous</td><td class="fee-amount">${fmtPKR(challan.arrears)}</td></tr>`;
  if (challan.fineAmount > 0)
    feeRowsHTML += `<tr><td class="fee-label">Late Fine</td><td class="fee-amount" style="color:#dc2626">${fmtPKR(challan.fineAmount)}</td></tr>`;
  if (challan.scholarshipAmount > 0)
    feeRowsHTML += `<tr><td class="fee-label">Scholarship</td><td class="fee-amount" style="color:#16a34a">(${fmtPKR(challan.scholarshipAmount)})</td></tr>`;
  if (challan.discountAmount > 0)
    feeRowsHTML += `<tr><td class="fee-label">Discount${challan.discountReason ? ` (${challan.discountReason})` : ""}</td><td class="fee-amount" style="color:#16a34a">(${fmtPKR(challan.discountAmount)})</td></tr>`;
  return `<div class="challan-card"><div class="copy-label">${copyTitle}</div><div class="bank-name-main">CISD</div><div class="challan-header"><div class="logo-container"><img src="${LOGO_URL}" class="logo-img" alt="CISD Logo" onerror="this.style.display='none'" /></div><div class="header-content"><div class="fee-challan-title">Fee Challan</div><div class="address">Faisal Sea Square, Main G.T Road, Gate-1 B-17 Islamabad</div><div class="onebill-box"><div class="onebill-label">1Bill Invoice No.</div><div class="onebill-id">${invoiceId}</div></div></div><div class="logo-container"><img src="${ONEBILL_URL}" class="logo-img" alt="1Bill" onerror="this.style.display='none'" /></div></div><div class="separator-line"></div><div class="info-section"><table class="info-table"><tr><td class="info-label">Due Date</td><td class="info-value">${fmtDate(challan.dueDate)}</td><td class="info-label">Reg ID</td><td class="info-value">${student.studentId || "N/A"}</td></tr><tr><td class="info-label">Name</td><td class="info-value">${personal.fullName || "N/A"}</td><td class="info-label">Father Name</td><td class="info-value">${fatherName}</td></tr><tr><td class="info-label">Program</td><td class="info-value">${programName}</td><td class="info-label">Semester</td><td class="info-value">${semesterNum}</td></tr><tr><td class="info-label">Session</td><td class="info-value">${sessionName}</td><td class="info-label">Type</td><td class="info-value">${challanTypeLabel}</td></tr><tr><td class="info-label">Challan No.</td><td class="info-value" colspan="3">${challan.challanNo}</td></tr></table></div><div class="separator-line"></div><div class="content-area"><div class="fee-details-title">FEE DETAILS</div><div class="table-container"><table class="fee-table">${feeRowsHTML}<tr><td style="border:none;">&nbsp;</td><td style="border:none;"></td></tr><tr class="total-row"><td class="fee-label">GRAND TOTAL</td><td class="fee-amount">${fmtPKR(challan.netAmount)}</td></tr></table><div class="amount-in-words"><strong>Amount in Words:</strong> ${toWords(challan.netAmount)}</div><div class="footer-notes"><p><strong>Note:</strong></p><p>1- Pay via 1Link/1-Bill, Banking Apps, ATMs, Easypaisa, JazzCash, etc.</p><p>2- Direct deposit by visiting any bank branch nationwide.</p><p>A late fee of 2,000 will be charged after the due date. Five days after the due date, the fee increases to 5,000.</p></div></div><div class="signature-section"><div class="signature-box"><div class="signature-line"></div><div class="signature-label">BANK OFFICIAL</div></div><div class="signature-box"><img src="${STAMP_URL}" style="height:42px;width:auto;object-fit:contain;display:block;margin:0 auto 2px;" alt="Stamp" onerror="this.style.display='none'" /><div class="signature-line"></div><div class="signature-label">ACCOUNTS OFFICER</div></div></div></div></div>`;
};

const buildChallanPage = (challan) =>
  `<div class="challan-page"><div class="challan-row-container">${buildChallanCard(challan, "BANK COPY")}${buildChallanCard(challan, "OFFICE COPY")}${buildChallanCard(challan, "STUDENT COPY")}</div></div>`;

const openPrintWindow = (bodyHTML, title = "Fee Challan", winRef = null) => {
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

// ─── Status Config ────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  paid: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    label: "Paid",
  },
  issued: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
    label: "Pending",
  },
  overdue: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
    label: "Overdue",
  },
  cancelled: {
    bg: "bg-slate-100",
    text: "text-slate-500",
    border: "border-slate-200",
    dot: "bg-slate-400",
    label: "Cancelled",
  },
  void: {
    bg: "bg-slate-100",
    text: "text-slate-400",
    border: "border-slate-200",
    dot: "bg-slate-300",
    label: "Void",
  },
};

const StatusBadge = ({ status, isDeleted }) => {
  const key = isDeleted ? "void" : status || "issued";
  const cfg = STATUS_CONFIG[key] || STATUS_CONFIG.issued;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── Receipt Modal ────────────────────────────────────────────────────────
const ReceiptModal = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle size={18} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Payment Record
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Ref: {data.challanNo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {data.paymentRemark && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <MessageSquare size={12} /> Accountant's Remark
              </p>
              <div className="bg-amber-50 border border-amber-100 text-amber-800 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
                {data.paymentRemark}
              </div>
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <ImageIcon size={12} /> Attached Proof
            </p>
            {data.paymentProof ? (
              <div className="rounded-xl overflow-hidden border border-slate-200 relative group">
                <img
                  src={data.paymentProof}
                  alt="Payment Proof"
                  className="w-full h-auto object-contain max-h-[400px]"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://via.placeholder.com/400x300?text=Image+Not+Found";
                  }}
                />
                <a
                  href={data.paymentProof}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <div className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg">
                    <Download size={16} /> View Full Size
                  </div>
                </a>
              </div>
            ) : (
              <div className="p-10 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                <FileText size={36} className="opacity-20 mb-2" />
                <p className="text-sm font-medium">
                  No receipt image attached.
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <div className="text-sm text-slate-500">
            Paid:{" "}
            <span className="font-bold text-emerald-600 text-base">
              {fmtPKR(data.paidAmount)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Dossier Modal ────────────────────────────────────────────────────────
const DossierModal = ({ challan, onClose, onPrint }) => {
  const feeEntries = Object.entries(challan.feeDetails || {}).filter(
    ([, v]) => v > 0,
  );
  const fatherName =
    challan.studentId?.familyInfo?.fatherName ||
    challan.studentId?.personalInfo?.fatherName ||
    "—";
  const isPaid = challan.status === "paid";
  const isManual = isPaid && (challan.paymentProof || challan.paymentRemark);
  const statusCfg = STATUS_CONFIG[challan.status] || STATUS_CONFIG.issued;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-7 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm shadow-indigo-200">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Fee Challan Dossier
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                INV-{challan.challanNo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-rose-100 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-7 grid grid-cols-1 md:grid-cols-2 gap-7 bg-slate-50/30">
          {/* LEFT — Student Info */}
          <div className="space-y-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-200">
              Student Demographics
            </p>
            <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl border border-indigo-100">
                {challan.studentId?.personalInfo?.fullName?.charAt(0) || "S"}
              </div>
              <div>
                <p className="font-bold text-slate-900">
                  {challan.studentId?.personalInfo?.fullName ||
                    "Unknown Student"}
                </p>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  {challan.studentId?.studentId || "No ID"}
                </p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
              {[
                {
                  icon: <User size={13} />,
                  label: "Father's Name",
                  value: fatherName,
                },
                {
                  icon: <School size={13} />,
                  label: "Program",
                  value: challan.programId?.name || "—",
                },
                {
                  icon: <Layers size={13} />,
                  label: "Semester",
                  value: challan.semesterId?.number
                    ? `Semester ${challan.semesterId.number}`
                    : "—",
                },
                {
                  icon: <Calendar size={13} />,
                  label: "Session",
                  value: challan.termId?.name || "—",
                },
              ].map(({ icon, label, value }) => (
                <div
                  key={label}
                  className="flex justify-between items-center px-4 py-3"
                >
                  <span className="text-xs text-slate-400 flex items-center gap-2">
                    {icon} {label}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Financial */}
          <div className="space-y-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-200">
              Financial Overview
            </p>

            {/* Status card */}
            <div
              className={`p-4 rounded-xl flex justify-between items-center border ${statusCfg.bg} ${statusCfg.border}`}
            >
              <div>
                <p
                  className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${statusCfg.text}`}
                >
                  Payment Status
                </p>
                <div className="flex items-center gap-2">
                  <p
                    className={`text-base font-bold uppercase flex items-center gap-2 ${statusCfg.text}`}
                  >
                    {isPaid ? (
                      <CheckCircle size={16} />
                    ) : challan.status === "overdue" ? (
                      <AlertCircle size={16} />
                    ) : (
                      <Clock size={16} />
                    )}
                    {challan.status}
                  </p>
                  {isPaid && (
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${isManual ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"}`}
                    >
                      {isManual ? "Manual" : "Portal"}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Due Date
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {fmtDate(challan.dueDate)}
                </p>
              </div>
            </div>

            {/* Fee table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  <tr>
                    <th className="px-4 py-3 border-b border-slate-100">
                      Fee Particulars
                    </th>
                    <th className="px-4 py-3 border-b border-slate-100 text-right">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-800 font-bold text-sm">
                      Base Fee
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                      {fmtPKR(challan.originalTotal)}
                    </td>
                  </tr>
                  {feeEntries.map(([key]) => (
                    <tr key={key}>
                      <td className="px-4 py-2.5 pl-7 text-slate-400 text-xs">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (s) => s.toUpperCase())}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-400 text-xs">
                        —
                      </td>
                    </tr>
                  ))}
                  {challan.arrears > 0 && (
                    <tr>
                      <td className="px-4 py-2.5 text-amber-600 font-medium text-xs">
                        Arrears / Previous Due
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-amber-600">
                        {fmtPKR(challan.arrears)}
                      </td>
                    </tr>
                  )}
                  {challan.fineAmount > 0 && (
                    <tr>
                      <td className="px-4 py-2.5 text-rose-600 font-medium text-xs">
                        Late Fine
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-600">
                        {fmtPKR(challan.fineAmount)}
                      </td>
                    </tr>
                  )}
                  {challan.scholarshipAmount > 0 && (
                    <tr>
                      <td className="px-4 py-2.5 text-emerald-600 font-medium text-xs">
                        Scholarship Deduction
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-600">
                        −{fmtPKR(challan.scholarshipAmount)}
                      </td>
                    </tr>
                  )}
                  {challan.discountAmount > 0 && (
                    <tr>
                      <td className="px-4 py-2.5 text-emerald-600 font-medium text-xs">
                        Discount{" "}
                        {challan.discountReason &&
                          `(${challan.discountReason})`}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-600">
                        −{fmtPKR(challan.discountAmount)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-indigo-600 text-white">
                    <td className="px-4 py-3.5 font-bold uppercase tracking-wider text-xs">
                      Net Payable
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-base">
                      {fmtPKR(challan.netAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="px-7 py-4 border-t border-slate-100 bg-white flex justify-between items-center">
          <p className="text-xs text-slate-400 font-mono">
            1Bill: 101340{challan.paymentReference || "00000000"}
          </p>
          <div className="flex gap-3">
            <button
              className="px-5 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              onClick={onClose}
            >
              Close
            </button>
            {challan.status !== "cancelled" && (
              <button
                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all flex items-center gap-2"
                onClick={() => onPrint(challan)}
              >
                <Printer size={15} /> Print Challan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Stats Card ───────────────────────────────────────────────────────────
const StatsCard = ({ label, value, sub, icon, color }) => (
  <div
    className={`bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm`}
  >
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
        {label}
      </p>
      <p className="text-xl font-bold text-slate-900 leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  </div>
);

// ─── Filter Select ────────────────────────────────────────────────────────
const FilterSelect = ({ value, onChange, children, disabled, icon: Icon }) => (
  <div className="relative">
    <select
      className="w-full pl-4 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 appearance-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      {children}
    </select>
    {Icon && (
      <Icon
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
    )}
  </div>
);

// ─── Main View ────────────────────────────────────────────────────────────
const ChallanGenerationView = ({
  challans = [],
  terms = [],
  departments = [],
  programs = [],
  semesters = [],
  filters = {},
  isLoading = false,
  isPrinting = false,
  pagination = { page: 1, limit: 10 },
  totalPages = 1,
  selectedChallan = null,
  setSelectedChallan,
  handleFilterChange,
  handlePageChange,
  handleSearchClick,
  handleClearSearch,
  handleKeyDown,
  fetchPrintChallans,
}) => {
  const [receiptData, setReceiptData] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const safeChallans = useMemo(() => {
    return challans.filter((c) => {
      const type = (c.challanType || "").toLowerCase();
      return !type.includes("hostel");
    });
  }, [challans]);

  // Quick stats from current page
  const stats = useMemo(() => {
    const paid = safeChallans.filter((c) => c.status === "paid");
    const overdue = safeChallans.filter((c) => c.status === "overdue");
    const totalNet = safeChallans.reduce((s, c) => s + (c.netAmount || 0), 0);
    const paidNet = paid.reduce((s, c) => s + (c.netAmount || 0), 0);
    return {
      total: safeChallans.length,
      paid: paid.length,
      overdue: overdue.length,
      totalNet,
      paidNet,
    };
  }, [safeChallans]);

  const showEmptyState = safeChallans.length === 0 && !isLoading;

  const pageNumbers = (() => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const cur = pagination.page;
    const pages = new Set(
      [1, totalPages, cur, cur - 1, cur + 1].filter(
        (p) => p >= 1 && p <= totalPages,
      ),
    );
    return [...pages].sort((a, b) => a - b);
  })();

  const executeSinglePrint = (challan) => {
    if (!challan) return;
    openPrintWindow(
      buildChallanPage(challan),
      `Fee Challan — ${challan.challanNo}`,
    );
  };

  const executeBulkPrint = async () => {
    const win = window.open("", "_blank");
    if (!win) {
      alert("Pop-up blocked. Please allow pop-ups.");
      return;
    }
    win.document.open();
    win.document.write(
      "<html><body style='font-family: sans-serif; padding: 20px;'><h2 style='color:#4f46e5;'>Generating Bulk Challans, please wait...</h2></body></html>",
    );
    win.document.close();
    try {
      const res = await fetchPrintChallans({
        limit: 5000,
        search: filters.search,
        termId: filters.termId,
        departmentId: filters.departmentId,
        programId: filters.programId,
        semesterId: filters.semesterId,
        status: filters.status,
        month: filters.month,
        type: filters.type,
      }).unwrap();
      const list = (res?.data?.challans || []).filter((c) => {
        const type = (c.challanType || "").toLowerCase();
        return c.status !== "cancelled" && !type.includes("hostel");
      });
      if (!list.length) {
        win.close();
        alert("No active challans found.");
        return;
      }
      openPrintWindow(
        list.map(buildChallanPage).join(""),
        `Bulk Challans — ${list.length} record(s)`,
        win,
      );
    } catch (err) {
      win.close();
      alert("Failed to fetch challans for printing.");
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Load SheetJS dynamically if not available
      if (!window.XLSX) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      // Fetch all matching challans for export
      let exportData = safeChallans;
      try {
        const res = await fetchPrintChallans({
          limit: 10000,
          search: filters.search,
          termId: filters.termId,
          departmentId: filters.departmentId,
          programId: filters.programId,
          semesterId: filters.semesterId,
          status: filters.status,
          month: filters.month,
          type: filters.type,
        }).unwrap();
        const all = (res?.data?.challans || []).filter((c) => {
          const type = (c.challanType || "").toLowerCase();
          return !type.includes("hostel");
        });
        if (all.length) exportData = all;
      } catch (_) {
        /* fallback to current page */
      }
      exportToExcel(exportData, filters);
    } catch (err) {
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-5 md:p-7 flex flex-col gap-6">
      <ReceiptModal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 no-print">
        <div>
          
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Challan Generation
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            This module allows users to generate individual or bulk fee challans
            based on selected criteria, while also providing a reporting tool to
            export dynamically filtered grid data to Excel.
          </p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <button
            onClick={handleExport}
            disabled={isLoading || isExporting || safeChallans.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold shadow-sm text-sm disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={15} className="text-emerald-600" />
            )}
            Export Excel
          </button>
          <button
            onClick={executeBulkPrint}
            disabled={isLoading || isPrinting}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-sm shadow-indigo-200 text-sm disabled:opacity-50"
          >
            {isPrinting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Printer size={15} />
            )}
            Bulk Print
          </button>
        </div>
      </div>

    
      {/* ── Filters Panel ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm no-print overflow-hidden">
        {/* Search row */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:bg-white transition-all">
            <select
              className="bg-transparent border-r border-slate-200 py-2.5 pr-3 mr-3 text-xs font-bold text-slate-500 outline-none cursor-pointer"
              value={filters.searchType || "all"}
              onChange={(e) => handleFilterChange("searchType", e.target.value)}
            >
              <option value="all">All Fields</option>
              <option value="id">Reg ID</option>
              <option value="name">Name</option>
              <option value="challan">Invoice No.</option>
            </select>
            <Search size={15} className="text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              className="flex-1 bg-transparent py-2.5 text-sm outline-none text-slate-800 placeholder:text-slate-400"
              placeholder="Search records..."
              value={filters.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {filters.search && (
              <button
                onClick={() => handleFilterChange("search", "")}
                className="text-slate-400 hover:text-slate-600 p-1 ml-1"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSearchClick}
              disabled={isLoading}
              className="px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all text-sm flex items-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Search size={15} />
              )}{" "}
              Search
            </button>
            <button
              onClick={handleClearSearch}
              disabled={isLoading}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm shadow-sm"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <FilterSelect
            value={filters.departmentId || ""}
            onChange={(v) => handleFilterChange("departmentId", v.target.value)}
            icon={Filter}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            value={filters.programId || ""}
            onChange={(v) => handleFilterChange("programId", v.target.value)}
            icon={Filter}
            disabled={!filters.departmentId}
          >
            <option value="">All Programs</option>
            {programs.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            value={filters.semesterId || ""}
            onChange={(v) => handleFilterChange("semesterId", v.target.value)}
            icon={Layers}
            disabled={!filters.programId}
          >
            <option value="">All Semesters</option>
            {semesters.map((s) => (
              <option key={s._id} value={s._id}>
                Semester {s.number}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            value={filters.termId || ""}
            onChange={(v) => handleFilterChange("termId", v.target.value)}
            icon={Calendar}
          >
            <option value="">All Sessions</option>
            {terms.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            value={filters.month || ""}
            onChange={(v) => handleFilterChange("month", v.target.value)}
            icon={Calendar}
          >
            <option value="">All Months</option>
            {[
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
              // The backend matches this filter against each challan's
              // `billingMonth`, which is stored as a full month NAME
              // ("July"), not a numeric index — sending "7" here (the
              // previous behavior, from `value={i + 1}`) could never
              // match anything, silently returning zero challans for
              // both the on-screen grid and Bulk Print whenever a month
              // was selected.
            ].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            value={filters.type || ""}
            onChange={(v) => handleFilterChange("type", v.target.value)}
            icon={Layers}
          >
            <option value="">All Fee Types</option>
            <option value="tuition">Tuition / Installment</option>
            <option value="exam">Exam</option>
            <option value="admission">Admission</option>
            <option value="readmission">Readmission</option>
            <option value="misc">Misc / General</option>
          </FilterSelect>
          <FilterSelect
            value={filters.status || ""}
            onChange={(v) => handleFilterChange("status", v.target.value)}
            icon={Filter}
          >
            <option value="">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="issued">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </FilterSelect>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Table header */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Invoices Directory
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Page {pagination.page} of {totalPages}
            </p>
          </div>
          {/* Status quick-filter tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { label: "All", val: "" },
              { label: "Paid", val: "paid" },
              { label: "Pending", val: "issued" },
              { label: "Overdue", val: "overdue" },
            ].map(({ label, val }) => (
              <button
                key={label}
                onClick={() => handleFilterChange("status", val)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${filters.status === val ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-60 gap-3 text-slate-400">
              <Loader2 size={36} className="animate-spin text-indigo-400" />
              <p className="text-sm font-semibold">Fetching records...</p>
            </div>
          ) : showEmptyState ? (
            <div className="flex flex-col items-center justify-center h-60 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <AlertCircle size={28} className="opacity-40 text-slate-500" />
              </div>
              <p className="text-base font-bold text-slate-600">
                No Records Found
              </p>
              <p className="text-sm mt-1">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-4 py-3.5">Invoice</th>
                  <th className="px-4 py-3.5">Academic</th>
                  <th className="px-4 py-3.5 text-right">Amount</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-center">Source</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safeChallans.map((c) => {
                  const isPaid = c.status === "paid";
                  const isManual =
                    isPaid && (c.paymentProof || c.paymentRemark);
                  return (
                    <tr
                      key={c._id}
                      className={`group transition-colors hover:bg-slate-50/80 ${c.isDeleted ? "opacity-60" : ""}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${c.isDeleted ? "bg-slate-100 text-slate-400" : "bg-indigo-50 text-indigo-600"}`}
                          >
                            {c.studentId?.personalInfo?.fullName?.charAt(0) ||
                              "S"}
                          </div>
                          <div>
                            <p
                              className={`font-semibold text-sm leading-none ${c.isDeleted ? "text-slate-400 line-through" : "text-slate-800"}`}
                            >
                              {c.studentId?.personalInfo?.fullName || "Unknown"}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 mt-1">
                              {c.studentId?.studentId || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div
                          className={`inline-block px-2 py-1 rounded-lg bg-slate-100 font-mono text-xs font-bold ${c.isDeleted ? "text-slate-400" : "text-indigo-600"}`}
                        >
                          #{c.challanNo}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                          <Calendar size={10} /> {fmtDate(c.dueDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-semibold text-slate-700 max-w-[160px] truncate">
                          {c.programId?.name || "—"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {c.termId?.name || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className={`font-mono font-bold text-sm ${c.isDeleted ? "text-slate-300 line-through" : "text-slate-900"}`}
                        >
                          {fmtPKR(c.netAmount)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <StatusBadge
                          status={c.status}
                          isDeleted={c.isDeleted}
                        />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {isPaid ? (
                          isManual ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 text-[9px] font-bold uppercase tracking-wider rounded border border-indigo-200">
                                <User size={10} /> Manual
                              </span>
                              <button
                                onClick={() => setReceiptData(c)}
                                className="text-[10px] font-semibold text-indigo-500 hover:text-indigo-700 hover:underline flex items-center gap-1 transition-colors"
                              >
                                <Eye size={10} /> View Proof
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-wider rounded border border-emerald-200">
                              <Globe size={10} /> 1Link
                            </span>
                          )
                        ) : (
                          <span className="text-slate-300 text-lg font-bold">
                            ·
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedChallan(c)}
                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                            title="View Dossier"
                          >
                            <Eye size={14} />
                          </button>
                          {!c.isDeleted && (
                            <button
                              onClick={() => executeSinglePrint(c)}
                              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                              title="Print Challan"
                            >
                              <Printer size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Page {pagination.page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-40 transition-all shadow-sm"
              >
                <ChevronLeft size={14} />
              </button>
              {pageNumbers.map((p, idx) => {
                const prev = pageNumbers[idx - 1];
                const showEllipsis = prev && p - prev > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && (
                      <span className="px-1.5 text-slate-400 text-sm">…</span>
                    )}
                    <button
                      onClick={() => handlePageChange(p)}
                      className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all shadow-sm ${pagination.page === p ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600"}`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= totalPages}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-40 transition-all shadow-sm"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedChallan && (
        <DossierModal
          challan={selectedChallan}
          onClose={() => setSelectedChallan(null)}
          onPrint={executeSinglePrint}
        />
      )}
    </div>
  );
};

export default ChallanGenerationView;
