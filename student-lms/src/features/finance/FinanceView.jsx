import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { useGetMyChallansQuery } from "./financeApi";
import {
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Loader2,
  Printer,
  TrendingDown,
  TrendingUp,
  FileText,
} from "lucide-react";

import neilogo from "../../assets/neilogo.png";
import logo1bill from "../../assets/onelink.png";

const FinanceView = () => {
  const user = useSelector((state) => state.auth.user);

  const {
    data: challansRes,
    isLoading,
    isError,
  } = useGetMyChallansQuery(user?.profileId, {
    skip: !user?.profileId,
  });

  const challans = challansRes?.data?.challans || challansRes?.data || [];

  // ── SUMMARIES (backend untouched) ────────────────────────────────
  const { totalDue, totalPaid, upcomingCount } = useMemo(() => {
    let due = 0, paid = 0, upcoming = 0;
    challans.forEach((challan) => {
      const amount = Number(challan.netAmount) || 0;
      if (challan.status === "paid") { paid += amount; }
      else { due += amount; upcoming += 1; }
    });
    return { totalDue: due, totalPaid: paid, upcomingCount: upcoming };
  }, [challans]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  const getStatusBadge = (status, dueDate) => {
    if (status === "paid") return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200">
        <CheckCircle2 size={12} /> Paid
      </span>
    );
    const isOverdue = new Date(dueDate) < new Date();
    if (isOverdue || status === "overdue") return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 font-semibold text-xs border border-red-200">
        <AlertCircle size={12} /> Overdue
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold text-xs border border-amber-200">
        <Clock size={12} /> Pending
      </span>
    );
  };

  // ── PRINT LOGIC (completely untouched) ───────────────────────────
  const handlePrint = (challan) => {
    if (!challan) return;
    const getAbsoluteUrl = (path) => new URL(path, window.location.origin).href;
    const logoUrl = getAbsoluteUrl(neilogo);
    const oneBillLogoUrl = getAbsoluteUrl(logo1bill);
    const formatPrintDate = (dateString) => {
      if (!dateString) return "N/A";
      try { return new Date(dateString).toLocaleDateString("en-GB"); } catch (e) { return "N/A"; }
    };
    const formatCurrency = (amount) => amount ? amount.toLocaleString("en-PK") : "0";
    const student = challan.studentId || {};
    const personalInfo = student.personalInfo || challan.personalInfo || {};
    const familyInfo = student.familyInfo || challan.familyInfo || {};
    const fatherName = familyInfo?.fatherName || personalInfo?.fatherName || student?.fatherName || "-";
    const programName = challan.programId?.name || student.programId?.name || user?.program || "N/A";
    const sessionName = challan.termId?.name || "N/A";
    const semesterName = challan.semesterId?.number ? ` ${challan.semesterId.number}` : "N/A";
    const invoiceSuffix = challan.paymentReference || "00000000";
    const fullOneBillId = `101340${invoiceSuffix}`;
    const challanTypeFormatted = challan.challanType ? challan.challanType.replace(/_/g, " ").toUpperCase() : "FEE";
    let feeRowsHTML = "";
    feeRowsHTML += `<tr style="background-color: #f0f0f0;"><td class="fee-label" style="font-weight:900;">${challanTypeFormatted}</td><td class="fee-amount" style="font-weight:900;">${formatCurrency(challan.netAmount)}</td></tr>`;
    if (challan.feeDetails) {
      Object.entries(challan.feeDetails).forEach(([key, amount]) => {
        if (amount > 0 && !key.toLowerCase().includes("arrears")) {
          const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
          feeRowsHTML += `<tr><td class="fee-label">${label}</td><td class="fee-amount">-</td></tr>`;
        }
      });
    }
    if (challan.arrears > 0) feeRowsHTML += `<tr><td class="fee-label">Arrears / Previous</td><td class="fee-amount">${formatCurrency(challan.arrears)}</td></tr>`;
    if (challan.fineAmount > 0) feeRowsHTML += `<tr><td class="fee-label">Late Fine</td><td class="fee-amount">${formatCurrency(challan.fineAmount)}</td></tr>`;
    if (challan.scholarshipAmount > 0) feeRowsHTML += `<tr><td class="fee-label">Scholarship</td><td class="fee-amount">(${formatCurrency(challan.scholarshipAmount)})</td></tr>`;
    if (challan.discountAmount > 0) feeRowsHTML += `<tr><td class="fee-label">Discount ${challan.discountReason ? `(${challan.discountReason})` : ""}</td><td class="fee-amount">(${formatCurrency(challan.discountAmount)})</td></tr>`;
    const generateCard = (copyTitle) => `
      <div class="challan-card">
        <div class="copy-label">${copyTitle}</div>
        <div class="bank-name-main">NATIONAL EXCELLENCE INSTITUTE</div>
        <div class="challan-header">
          <div class="logo-container"><img src="${logoUrl}" class="logo-img" alt="NEI Logo" onerror="this.style.display='none'"/></div>
          <div class="header-content">
            <div class="fee-challan-title">1BILL FEE CHALLAN</div>
            <div class="address">Faisal Sea Square, Main G.T Road, Gate-1 B-17 Islamabad</div>
            <div style="margin-top: 6px; border: 2px solid #000; padding: 4px; background: #e0f7fa;">
               <div style="font-size: 8px; font-weight: bold; text-transform: uppercase;">1 Bill Invoice </div>
               <div style="font-size: 14px; font-weight: bold; letter-spacing: 1px;">${fullOneBillId}</div>
            </div>
          </div>
          <div class="logo-container"><img src="${oneBillLogoUrl}" class="logo-img" style="object-fit:contain;" alt="1Bill Logo" onerror="this.style.display='none'"/></div>
        </div>
        <div class="separator-line"></div>
        <div class="content-area">
          <div class="info-section">
            <table class="info-table">
              <tr><td class="info-label">Due Date</td><td class="info-value">${formatPrintDate(challan.dueDate)}</td><td class="info-label">Reg ID</td><td class="info-value">${student.studentId || user?.rollNumber || "N/A"}</td></tr>
              <tr><td class="info-label">Name</td><td class="info-value">${personalInfo.fullName || user?.name || "N/A"}</td><td class="info-label">Father Name</td><td class="info-value">${fatherName}</td></tr>
              <tr><td class="info-label">Program</td><td class="info-value">${programName}</td><td class="info-label">Semester</td><td class="info-value">${semesterName}</td></tr>
              <tr><td class="info-label">Session</td><td class="info-value">${sessionName}</td><td class="info-label">Type</td><td class="info-value">${challanTypeFormatted}</td></tr>
              <tr><td class="info-label">Challan No</td><td class="info-value" colspan="3">${challan.challanNo}</td></tr>
            </table>
          </div>
          <div class="separator-line"></div>
          <div class="fee-details-title">FEE DETAILS</div>
          <div class="table-container">
            <table class="fee-table">
              ${feeRowsHTML}
              <tr><td style="border:none;">&nbsp;</td><td style="border:none;"></td></tr>
              <tr class="total-row"><td class="fee-label">GRAND TOTAL</td><td class="fee-amount">${formatCurrency(challan.netAmount)}</td></tr>
            </table>
            <div class="amount-in-words"><strong>Total (Rs):</strong> ${formatCurrency(challan.netAmount)}</div>
            <div class="footer-notes">
              <p><strong>Note:</strong></p>
              <p>1- Pay your Bills through 1Link/1-Bill (Invoice/Voucher), Banking Apps, ATMs, Easypaisa, Jazz Cash etc.</p>
              <p>2- Direct Deposit by visiting any Bank in country.</p>
              <p>3- Late fee Rs.500/day charged after due date.</p>
            </div>
          </div>
          <div class="signature-section">
            <div class="signature-box"><div class="signature-line"></div><div class="signature-label">BANK OFFICIAL</div></div>
            <div class="signature-box"><div class="signature-line"></div><div class="signature-label">ACCOUNTS OFFICER</div></div>
          </div>
        </div>
      </div>`;
    const htmlContent = `<!DOCTYPE html><html><head><title>Fee Challan - ${challan.challanNo}</title><style>* { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; } @media print { @page { size: A4 landscape; margin: 0mm; } body { width: 297mm !important; height: 210mm !important; margin: 0 !important; padding: 10mm !important; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; overflow: hidden !important; } .challan-row-container { display: flex !important; flex-direction: row !important; width: 277mm !important; height: 190mm !important; gap: 4mm !important; justify-content: space-between !important; align-items: stretch !important; page-break-inside: avoid !important; break-inside: avoid !important; } .challan-card { flex: 1 !important; min-width: 0 !important; border: 0.5mm dashed #000 !important; background: white !important; position: relative !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; page-break-inside: avoid !important; break-inside: avoid !important; } .info-label, .fee-label { background-color: #f5f5f5 !important; } .total-row { background-color: #e0e0e0 !important; } .footer-notes { background-color: #fffde7 !important; } .copy-label { padding: 2px 0.5px; background-color: rgb(255,255,255) !important; border: 0.2mm solid rgb(94,94,94) !important; color: #000000 !important } .no-print { display: none !important; } } .challan-header { text-align: center; padding: 2px 6px 6px; background: white; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: 10px; position: relative; } .logo-container { flex-shrink: 0; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; } .logo-img { width: 55px; height: 55px; object-fit: contain; border-radius: 8px; } .header-content { flex: 1; text-align: center; } .bank-name-main { font-size: 16px; font-weight: bold; color: #1a237e; margin-top: 24px; margin-bottom: 2px; text-align: center; width: 100%; letter-spacing: 0.2px; } .fee-challan-title { font-size: 13px; font-weight: bold; color: #d32f2f; margin-bottom: 3px; text-transform: uppercase; line-height: 1.1; } .address { font-size: 10px; color: #000; margin-bottom: 4px; line-height: 1.1; } .separator-line { border-top: 0.5mm solid #000; margin: 6px 0; flex-shrink: 0; } .info-section { width: 100%; padding: 6px; flex-shrink: 0; } .info-table { width: 100%; border-collapse: collapse; margin: 0; table-layout: fixed; font-size: 9px; } .info-table td { border: 0.5mm solid #000; padding: 4px 5px; vertical-align: middle; word-wrap: break-word; } .info-label { font-weight: bold; background: #f5f5f5; width: 20%; font-size: 9px; } .info-value { text-align: left; width: 30%; font-size: 9px; } .fee-details-title { text-align: center; font-size: 12px; font-weight: bold; margin: 8px 0 4px; text-decoration: underline; flex-shrink: 0; } .fee-table { width: 100%; border-collapse: collapse; margin: 0; table-layout: fixed; flex-grow: 1; font-size: 9px; } .fee-table td { border: 0.5mm solid #000; padding: 5px 6px; height: 26px; vertical-align: middle; } .fee-label { font-weight: bold; background: #f5f5f5; width: 70%; font-size: 9px; } .fee-amount { text-align: right; width: 30%; font-weight: bold; font-family: 'Courier New', monospace; padding-right: 8px; font-size: 9px; } .total-row { font-weight: bold; background: #e0e0e0; } .footer-notes { margin: 8px 6px; padding: 5px; border: 0.5mm solid #000; background: #fffde7; font-size: 8px; line-height: 1.2; flex-shrink: 0; } .signature-section { display: flex; justify-content: space-between; align-items: flex-end; margin: 10px 6px 6px; padding-top: 6px; flex-shrink: 0; } .signature-box { text-align: center; width: 45%; } .signature-line { width: 100%; border-top: 0.5mm solid #000; margin: 2px 0; } .signature-label { font-size: 8px; font-weight: bold; } .copy-label { position: absolute; top: 6px; left: 6px; background: #8f8f8f; padding: 2px 8px; font-weight: bold; font-size: 8px; z-index: 10; border-radius: 3px; color: white; } .content-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 0 6px; } .table-container { flex: 1; overflow-y: auto; margin-bottom: 0.5px; } .amount-in-words { font-size: 9px; margin-bottom: 5px; border: 1px solid #ccc; padding: 3px; }</style></head><body><div class="challan-row-container">${generateCard("BANK COPY")}${generateCard("OFFICE COPY")}${generateCard("STUDENT COPY")}</div><script>setTimeout(function() { window.print(); }, 800);</script></body></html>`;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };
  // ─────────────────────────────────────────────────────────────────

  const totalAll = totalDue + totalPaid;
  const paidPct  = totalAll > 0 ? Math.round((totalPaid / totalAll) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">

      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg shadow-red-900/20 no-print"
        style={{ background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%)" }}>
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute bottom-0 left-1/4 w-32 h-32 rounded-full bg-red-950/30 blur-xl" />
        <div className="absolute top-0 right-1/3 w-px h-full bg-white/5" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center">
                <Receipt size={16} className="text-red-200" />
              </div>
              <span className="text-red-200/80 text-xs font-semibold uppercase tracking-widest">Finance Portal</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Fee Vouchers</h1>
            <p className="text-red-200/70 mt-1 text-sm font-medium">Manage your tuition fees and payment history</p>
          </div>

          {/* Progress ring summary */}
          <div className="flex items-center gap-5 bg-white/10 border border-white/15 rounded-2xl px-6 py-4">
            <div className="relative w-14 h-14">
              <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5"/>
                <circle cx="28" cy="28" r="22" fill="none" stroke="#fca5a5" strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - paidPct / 100)}`}
                  strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-black text-white">{paidPct}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-red-200/70 font-semibold uppercase tracking-wider">Paid</p>
              <p className="text-lg font-black text-white">Rs. {totalPaid.toLocaleString()}</p>
              <p className="text-xs text-red-300/70 mt-0.5">of Rs. {totalAll.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">

        {/* Total Due */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <TrendingDown size={22} className="text-red-700" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Amount Due</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 truncate">Rs. {totalDue.toLocaleString()}</p>
          </div>
          <div className="ml-auto w-1 h-10 rounded-full bg-red-200 flex-shrink-0" />
        </div>

        {/* Total Paid */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={22} className="text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Paid</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5 truncate">Rs. {totalPaid.toLocaleString()}</p>
          </div>
          <div className="ml-auto w-1 h-10 rounded-full bg-emerald-200 flex-shrink-0" />
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <FileText size={22} className="text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{upcomingCount} voucher{upcomingCount !== 1 ? "s" : ""}</p>
          </div>
          <div className="ml-auto w-1 h-10 rounded-full bg-amber-200 flex-shrink-0" />
        </div>
      </div>

      {/* ── VOUCHER HISTORY ── */}
      <div className="no-print">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
            <Receipt size={15} className="text-red-900" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Voucher History</h2>
          {challans.length > 0 && (
            <span className="ml-auto text-xs font-bold bg-red-900 text-white px-2.5 py-0.5 rounded-full">
              {challans.length} total
            </span>
          )}
        </div>

        {/* ── STATES ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <Loader2 className="animate-spin text-red-900" size={22} />
            </div>
            <p className="font-semibold text-slate-500 text-sm">Loading your financial records…</p>
          </div>

        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 bg-red-50 rounded-2xl border border-red-100 text-center">
            <AlertCircle className="text-red-400 mb-3" size={36} />
            <p className="text-base font-bold text-red-800">Failed to load fee vouchers</p>
            <p className="text-sm text-red-600/70 mt-1">Please refresh or contact the accounts office.</p>
          </div>

        ) : challans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
              <Receipt className="text-slate-300" size={30} strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Vouchers Found</h3>
            <p className="text-sm text-slate-400 mt-1">No fee challans have been issued yet.</p>
          </div>

        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden printable-area">

            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest"
              style={{ background: "linear-gradient(135deg, #7f1d1d08, #7f1d1d03)" }}>
              <div className="col-span-3">Challan</div>
              <div className="col-span-2">Issued</div>
              <div className="col-span-2">Due Date</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-50">
              {challans.map((challan, idx) => {
                const isPaid    = challan.status === "paid";
                const isOverdue = !isPaid && new Date(challan.dueDate) < new Date();

                return (
                  <div
                    key={challan._id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50/60 transition-colors duration-150 group"
                  >
                    {/* Challan details */}
                    <div className="col-span-1 md:col-span-3 flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isPaid ? "bg-emerald-50" : isOverdue ? "bg-red-50" : "bg-amber-50"
                      }`}>
                        <Receipt size={15} className={isPaid ? "text-emerald-600" : isOverdue ? "text-red-600" : "text-amber-600"} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-red-900 uppercase tracking-wider">
                          #{challan.challanNo}
                        </p>
                        <p className="font-bold text-slate-800 text-sm leading-snug truncate">
                          {challan.challanType ? challan.challanType.replace("_", " ") : "Semester Fee"}
                        </p>
                        {challan.isInstallment && (
                          <span className="mt-1 inline-block text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            Installment {challan.installmentNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Issue Date */}
                    <div className="col-span-1 md:col-span-2 flex justify-between md:block">
                      <span className="md:hidden text-xs font-semibold text-slate-400">Issued</span>
                      <p className="text-sm text-slate-500 font-medium">{formatDate(challan.issuedAt)}</p>
                    </div>

                    {/* Due Date */}
                    <div className="col-span-1 md:col-span-2 flex justify-between md:block">
                      <span className="md:hidden text-xs font-semibold text-slate-400">Due</span>
                      <p className={`text-sm font-bold ${isOverdue && !isPaid ? "text-red-700" : "text-slate-800"}`}>
                        {formatDate(challan.dueDate)}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="col-span-1 md:col-span-2 flex justify-between md:block md:text-right">
                      <span className="md:hidden text-xs font-semibold text-slate-400">Amount</span>
                      <p className="text-lg font-black text-slate-900">
                        Rs. {Number(challan.netAmount || 0).toLocaleString()}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center">
                      <span className="md:hidden text-xs font-semibold text-slate-400">Status</span>
                      {getStatusBadge(challan.status, challan.dueDate)}
                    </div>

                    {/* Action */}
                    <div className="col-span-1 text-right md:text-center no-print mt-2 md:mt-0">
                      <button
                        onClick={() => handlePrint(challan)}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 w-full md:w-auto border ${
                          isPaid
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                            : "bg-red-50 border-red-200 text-red-800 hover:bg-red-100"
                        }`}
                        title={isPaid ? "Download Receipt" : "Print Voucher"}
                      >
                        {isPaid ? <Download size={13} /> : <Printer size={13} />}
                        <span>{isPaid ? "Receipt" : "Print"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          @page { margin: 1cm; size: portrait; }
          body { background-color: white !important; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default FinanceView;