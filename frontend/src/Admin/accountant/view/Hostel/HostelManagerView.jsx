import React, { useMemo, useState } from "react";
import AssignHostelModal from "./modals/AssignHostelModal";
import BulkChallanModal from "./modals/BulkChallanModal";
import HostelChallanDetailModal from "./modals/HostelChallanDetailModal";
import EditAllocationModal from "./modals/EditAllocationModal";
import HostelFeeView from "./HostelFeeView";
import {
  fmt,
  StatusBadge,
  LoadingState,
  EmptyState,
  IconBtn,
} from "../../common/Hostelshared";
import {
  Home,
  Receipt,
  BarChart2,
  Plus,
  Search,
  X,
  DoorOpen,
  Users,
  TrendingUp,
  Banknote,
  BadgeCheck,
  Building2,
  Calendar as CalendarIcon,
  Printer,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
} from "lucide-react";

// --- New Imports for Reporting ---
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Print Helpers & Formatting ──────────────────────────────────────────────
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
    : "HOSTEL FEE";

  let feeRowsHTML = `
    <tr style="background:#f0f0f0;">
      <td class="fee-label" style="font-weight:900;">${challanTypeLabel} (Base)</td>
      <td class="fee-amount" style="font-weight:900;">${fmtPKR(challan.originalTotal)}</td>
    </tr>`;

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

  return `
    <div class="challan-card">
      <div class="copy-label">${copyTitle}</div>
      <div class="bank-name-main">CISD</div>
      <div class="challan-header">
        <div class="logo-container"><img src="${LOGO_URL}" class="logo-img" alt="CISD Logo" onerror="this.style.display='none'" /></div>
        <div class="header-content">
          <div class="fee-challan-title">Fee Challan</div>
          <div class="address">Faisal Sea Square, Main G.T Road, Gate-1 B-17 Islamabad</div>
          <div class="onebill-box">
            <div class="onebill-label">1Bill Invoice No.</div>
            <div class="onebill-id">${invoiceId}</div>
          </div>
        </div>
        <div class="logo-container"><img src="${ONEBILL_URL}" class="logo-img" alt="1Bill" onerror="this.style.display='none'" /></div>
      </div>
      <div class="separator-line"></div>
      <div class="info-section">
        <table class="info-table">
          <tr><td class="info-label">Due Date</td><td class="info-value">${fmtDate(challan.dueDate)}</td><td class="info-label">Reg ID</td><td class="info-value">${student.studentId || "N/A"}</td></tr>
          <tr><td class="info-label">Name</td><td class="info-value">${personal.fullName || "N/A"}</td><td class="info-label">Father Name</td><td class="info-value">${fatherName}</td></tr>
          <tr><td class="info-label">Program</td><td class="info-value">${programName}</td><td class="info-label">Semester</td><td class="info-value">${semesterNum}</td></tr>
          <tr><td class="info-label">Session</td><td class="info-value">${sessionName}</td><td class="info-label">Type</td><td class="info-value">${challanTypeLabel}</td></tr>
          <tr><td class="info-label">Challan No.</td><td class="info-value" colspan="3">${challan.challanNo}</td></tr>
        </table>
      </div>
      <div class="separator-line"></div>
      <div class="content-area">
        <div class="fee-details-title">FEE DETAILS</div>
        <div class="table-container">
          <table class="fee-table">
            ${feeRowsHTML}
            <tr><td style="border:none;">&nbsp;</td><td style="border:none;"></td></tr>
            <tr class="total-row"><td class="fee-label">GRAND TOTAL</td><td class="fee-amount">${fmtPKR(challan.netAmount)}</td></tr>
          </table>
          <div class="amount-in-words"><strong>Amount in Words:</strong> ${toWords(challan.netAmount)}</div>
          <div class="footer-notes">
            <p><strong>Note:</strong></p>
            <p>1- Pay via 1Link/1-Bill, Banking Apps, ATMs, Easypaisa, JazzCash, etc.</p>
            <p>2- Direct deposit by visiting any bank branch nationwide.</p>
            <p>A late fee of 2,000 will be charged after the due date. Five days after the due date, the fee increases to 5,000.</p>
          </div>
        </div>
        <div class="signature-section">
          <div class="signature-box"><div class="signature-line"></div><div class="signature-label">BANK OFFICIAL</div></div>
          <div class="signature-box">
            <img src="${STAMP_URL}" style="height:42px;width:auto;object-fit:contain;display:block;margin:0 auto 2px;" alt="Stamp" onerror="this.style.display='none'" />
            <div class="signature-line"></div><div class="signature-label">ACCOUNTS OFFICER</div>
          </div>
        </div>
      </div>
    </div>`;
};

const buildChallanPage = (challan) => `
  <div class="challan-page">
    <div class="challan-row-container">
      ${buildChallanCard(challan, "BANK COPY")}
      ${buildChallanCard(challan, "OFFICE COPY")}
      ${buildChallanCard(challan, "STUDENT COPY")}
    </div>
  </div>`;

const TABS = [
  { id: "allocations", label: "Allocations", icon: Home },
  { id: "challans", label: "Fee Challans", icon: Receipt },
  { id: "reports", label: "Reports", icon: BarChart2 },
];

export default function HostelManagerView(props) {
  const {
    activeTab,
    setActiveTab,
    searchQ,
    setSearchQ,
    showAssignModal,
    setShowAssign,
    showBulkModal,
    setShowBulk,
    selectedChallan,
    setSelectedChallan,
    editingAllocation,
    setEditingAllocation,
    allocLoading,
    challanLoading,
    statsLoading,
    vacating,
    stats,
    allocations,
    challans,
    filteredAllocations,
    filteredChallans,
    handleVacate,
    jumpToStudentChallans,
    refetchAlloc,
    refetchChallans,
    statusFilter,
    setStatusFilter,
    sortKey,
    sortDir,
    handleSort,
    feeSelected,
    setFeeSelected,
    toggleAllFees,
    toggleOneFee,
    payingId,
    challanCounts,
    handleQuickPay,
    handleBulkDeleteFees,
    monthFilter,
    setMonthFilter,
    students,
    studentsLoading,
    assignSeat,
    assignLoading,
    generateBulkChallans,
    bulkLoading,
    markPaid,
    paying,
    updateFineDue,
    updFine,
    deleteChallan,
    deleting,
    updateAlloc,
    updAllocLoading,
  } = props;

  // ─── Print Executors ───
  const executeSinglePrint = (challan) => {
    if (!challan) return;
    const win = window.open("", "_blank");
    if (!win) {
      alert(
        "Pop-up blocked. Please allow pop-ups for this site to print challans.",
      );
      return;
    }
    win.document.open();
    win.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Fee Challan — ${challan.challanNo}</title><style>${getPrintStyles()}</style></head><body>${buildChallanPage(challan)}<script>setTimeout(function(){ window.print(); }, 800);</script></body></html>`,
    );
    win.document.close();
  };

  const executeBulkPrint = () => {
    const listToPrint =
      feeSelected.size > 0
        ? filteredChallans.filter((c) => feeSelected.has(c._id))
        : filteredChallans;

    if (!listToPrint.length) {
      alert("No challans found to print.");
      return;
    }

    const win = window.open("", "_blank");
    if (!win) {
      alert("Pop-up blocked.");
      return;
    }

    win.document.open();
    win.document.write(
      "<html><body style='font-family: sans-serif; padding: 20px;'><h2 style='color:#4f46e5;'>Preparing Print, please wait...</h2></body></html>",
    );

    const body = listToPrint.map(buildChallanPage).join("");

    win.document.open();
    win.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Bulk Challans — ${listToPrint.length} record(s)</title><style>${getPrintStyles()}</style></head><body>${body}<script>setTimeout(function(){ window.print(); }, 1000);</script></body></html>`,
    );
    win.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-[1500px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200">
                <Building2 size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-none">
                  Hostel Management
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Room allocation &amp; hostel fee management
                </p>
              </div>
            </div>
            <div className="flex gap-2.5">
              {activeTab === "challans" && filteredChallans.length > 0 && (
                <button
                  onClick={executeBulkPrint}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold text-sm shadow-sm"
                >
                  <Printer size={14} className="text-indigo-500" /> Print View
                </button>
              )}
              <button
                onClick={() => setShowBulk(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold text-sm shadow-sm"
              >
                <Receipt size={14} className="text-indigo-500" /> Bulk Challan
              </button>
              <button
                onClick={() => setShowAssign(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold text-sm shadow-sm shadow-indigo-200"
              >
                <Plus size={14} /> Assign Hostel
              </button>
            </div>
          </div>

          <nav className="flex gap-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                    active
                      ? "text-indigo-600 border-indigo-600"
                      : "text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300"
                  }`}
                >
                  <Icon size={15} /> {t.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-6 py-6 space-y-5">
        {/* Only show top stats on Allocations and Challans tab (Reports has its own dashboard) */}
        {!statsLoading && activeTab !== "reports" && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatsCard
              label="Occupied"
              value={stats.admitted ?? 0}
              sub="Active allocations"
              icon={<Users size={16} />}
              accent="indigo"
            />
            <StatsCard
              label="Vacated"
              value={stats.vacated ?? 0}
              sub="This session"
              icon={<DoorOpen size={16} />}
              accent="slate"
            />
            <StatsCard
              label="Generated"
              value={fmt(stats.totalGenerated ?? 0)}
              sub="Total hostel fee"
              icon={<TrendingUp size={16} />}
              accent="amber"
            />
            <StatsCard
              label="Collected"
              value={fmt(stats.collected ?? 0)}
              sub="Received so far"
              icon={<BadgeCheck size={16} />}
              accent="emerald"
            />
            <StatsCard
              label="Pending"
              value={fmt(stats.pending ?? 0)}
              sub="Outstanding balance"
              icon={<Banknote size={16} />}
              accent="rose"
            />
          </div>
        )}

        {activeTab !== "reports" && (
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-sm relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={
                  activeTab === "allocations"
                    ? "Search by name, reg no, hostel or room…"
                    : "Search by name, reg no or challan no…"
                }
                className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all placeholder:text-slate-400 text-slate-800"
              />
              {searchQ && (
                <button
                  onClick={() => setSearchQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {activeTab === "challans" && (
              <div className="relative">
                <CalendarIcon
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-slate-700 cursor-pointer"
                  title="Filter by month"
                />
                {monthFilter && (
                  <button
                    onClick={() => setMonthFilter("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "allocations" && (
          <AllocationTable
            data={filteredAllocations}
            loading={allocLoading}
            vacating={vacating}
            onVacate={handleVacate}
            onViewChallans={jumpToStudentChallans}
            onEdit={setEditingAllocation}
          />
        )}

        {activeTab === "challans" && (
          <HostelFeeView
            {...props}
            loading={challanLoading}
            filteredChallans={filteredChallans}
            onView={setSelectedChallan}
            onSinglePrint={executeSinglePrint}
            onBulkPrint={executeBulkPrint}
          />
        )}

        {activeTab === "reports" && <HostelReportsPanel challans={challans} />}
      </main>

      {/* ── Modals ── */}
      {showAssignModal && (
        <AssignHostelModal
          onClose={() => setShowAssign(false)}
          onSuccess={() => {
            setShowAssign(false);
            refetchAlloc();
            refetchChallans();
          }}
          students={students}
          studentsLoading={studentsLoading}
          onAssign={assignSeat}
          assignLoading={assignLoading}
        />
      )}

      {showBulkModal && (
        <BulkChallanModal
          allocations={allocations}
          onClose={() => setShowBulk(false)}
          onSuccess={() => {
            setShowBulk(false);
            refetchChallans();
          }}
          onGenerateBulk={generateBulkChallans}
          bulkLoading={bulkLoading}
        />
      )}

      {selectedChallan && (
        <HostelChallanDetailModal
          challan={selectedChallan}
          onClose={() => setSelectedChallan(null)}
          onRefresh={refetchChallans}
          onPay={markPaid}
          paying={paying}
          onUpdateFineDue={updateFineDue}
          updFine={updFine}
          onDeleteChallan={deleteChallan}
          deleting={deleting}
          onPrint={executeSinglePrint}
        />
      )}

      {editingAllocation && (
        <EditAllocationModal
          allocation={editingAllocation}
          onClose={() => setEditingAllocation(null)}
          onUpdate={updateAlloc}
          loading={updAllocLoading}
          onSuccess={() => {
            setEditingAllocation(null);
            refetchAlloc();
          }}
        />
      )}
    </div>
  );
}

// ─── Components ──────────────────────────────────────────────────────────────
function StatsCard({ label, value, sub, icon, accent }) {
  const colors = {
    indigo: {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      border: "border-t-indigo-500",
    },
    slate: {
      bg: "bg-slate-100",
      text: "text-slate-500",
      border: "border-t-slate-400",
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-t-amber-400",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-t-emerald-500",
    },
    rose: {
      bg: "bg-rose-50",
      text: "text-rose-600",
      border: "border-t-rose-500",
    },
  };
  const c = colors[accent] || colors.indigo;
  return (
    <div
      className={`bg-white border border-slate-200 border-t-2 ${c.border} rounded-2xl p-4 shadow-sm flex items-start gap-3`}
    >
      <div
        className={`w-8 h-8 rounded-xl ${c.bg} ${c.text} flex items-center justify-center shrink-0`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {label}
        </p>
        <p className="text-lg font-bold text-slate-900 leading-tight truncate">
          {value}
        </p>
        {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function AllocationTable({
  data,
  loading,
  onVacate,
  vacating,
  onViewChallans,
  onEdit,
}) {
  if (loading) return <LoadingState label="Loading allocations…" />;
  if (!data.length)
    return (
      <EmptyState
        icon="🏠"
        title="No active allocations"
        sub="Assign students to hostel rooms to get started."
      />
    );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h2 className="text-sm font-bold text-slate-900">Active Allocations</h2>
        <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
          {data.length} students
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
            <tr>
              {[
                "Student",
                "Reg No",
                "Program",
                "Hostel",
                "Room",
                "Monthly Rent",
                "Admitted On",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className={`px-4 py-3 ${h === "Actions" ? "text-right pr-6" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((a, i) => {
              const name = a.studentId?.personalInfo?.fullName ?? "—";
              const regNo = a.studentId?.studentId ?? "—";
              const prog = a.studentId?.programId?.name ?? "—";
              const initials = name
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")
                .toUpperCase();
              return (
                <tr
                  key={a._id ?? i}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {initials}
                      </div>
                      <span className="font-semibold text-slate-900">
                        {name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {regNo}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800 text-xs">
                    {prog}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700 text-xs">
                    {a.hostelName}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-lg text-xs font-bold">
                      {a.roomNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900 text-sm">
                    {fmt(a.monthlyRent)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(a.allocationDate).toLocaleDateString("en-PK", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 pr-6">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => onEdit(a)}
                        title="Edit Fee / Room"
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-all"
                      >
                        <span style={{ fontSize: 13 }}>✏️</span>
                      </button>
                      <button
                        onClick={() => onViewChallans(a)}
                        title="View Challans"
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                      >
                        <Receipt size={14} />
                      </button>
                      <button
                        onClick={() => onVacate(a._id, name)}
                        title="Vacate Seat"
                        disabled={vacating}
                        className="w-8 h-8 rounded-lg border border-rose-100 bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 hover:border-rose-200 transition-all disabled:opacity-50"
                      >
                        <DoorOpen size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── NEW MODERN REPORTS PANEL ──────────────────────────────────────────────────
function HostelReportsPanel({ challans }) {
  // --- State for Filters ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const selectedMonth = currentDate.getMonth(); // 0-11
  const selectedYear = currentDate.getFullYear();

  // --- Filter Challans by Selected Month (Based on Due Date) ---
  const monthlyChallans = useMemo(() => {
    return challans.filter((c) => {
      const date = new Date(c.dueDate || c.issueDate || c.createdAt);
      return (
        date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
      );
    });
  }, [challans, selectedMonth, selectedYear]);

  // --- Data for Graphs ---
  const { barData, pieData, summary } = useMemo(() => {
    let generated = 0,
      collected = 0,
      pending = 0;

    const statusCounts = { paid: 0, overdue: 0, issued: 0 };
    const typeMap = {};

    monthlyChallans.forEach((c) => {
      generated += c.netAmount || 0;
      if (c.status === "paid") collected += c.paidAmount || 0;
      if (c.status === "issued" || c.status === "overdue")
        pending += c.remainingAmount || 0;

      if (statusCounts[c.status] !== undefined) statusCounts[c.status]++;

      const t = c.challanType || "Unknown";
      if (!typeMap[t])
        typeMap[t] = { name: t.replace(/_/g, " "), Generated: 0, Collected: 0 };
      typeMap[t].Generated += c.netAmount || 0;
      if (c.status === "paid") typeMap[t].Collected += c.paidAmount || 0;
    });

    return {
      summary: { generated, collected, pending },
      pieData: [
        { name: "Paid", value: statusCounts.paid, color: "#22C55E" },
        { name: "Overdue", value: statusCounts.overdue, color: "#E11D48" },
        { name: "Pending", value: statusCounts.issued, color: "#F59E0B" },
      ].filter((d) => d.value > 0),
      barData: Object.values(typeMap),
    };
  }, [monthlyChallans]);

  // --- Export Functions ---
  const exportToExcel = () => {
    const dataToExport = monthlyChallans.map((c) => ({
      "Challan No": c.challanNo,
      "Student Name": c.studentId?.personalInfo?.fullName || "N/A",
      Type: c.challanType,
      Status: c.status.toUpperCase(),
      "Due Date": new Date(c.dueDate).toLocaleDateString(),
      "Net Amount": c.netAmount,
      "Paid Amount": c.paidAmount,
      Balance: c.remainingAmount,
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Report");
    XLSX.writeFile(
      wb,
      `Hostel_Report_${selectedMonth + 1}_${selectedYear}.xlsx`,
    );
  };

 const exportToPDF = () => {
   const doc = new jsPDF();
   doc.text(
     `Hostel Financial Report - ${currentDate.toLocaleString("default", { month: "long", year: "numeric" })}`,
     14,
     15,
   );

   const tableData = monthlyChallans.map((c) => [
     c.challanNo,
     c.studentId?.personalInfo?.fullName || "N/A",
     c.status.toUpperCase(),
     new Date(c.dueDate).toLocaleDateString(),
     `${c.netAmount}`,
     `${c.paidAmount}`,
   ]);


   autoTable(doc, {
     startY: 25,
     head: [["Challan No", "Student", "Status", "Due Date", "Total", "Paid"]],
     body: tableData,
     theme: "grid",
     styles: { fontSize: 8 },
   });
   doc.save(`Hostel_Report_${selectedMonth + 1}_${selectedYear}.pdf`);
 };

  return (
    <div className="space-y-6">
      {/* --- Filter & Action Bar --- */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center bg-slate-100 rounded-xl p-1">
          <button
            onClick={() =>
              setCurrentDate(new Date(selectedYear, selectedMonth - 1, 1))
            }
            className="p-2 hover:bg-white rounded-lg transition-all text-slate-600"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="px-4 font-bold text-slate-800 min-w-[150px] text-center flex items-center justify-center gap-2">
            <CalendarIcon size={14} className="text-indigo-500" />
            {currentDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </div>
          <button
            onClick={() =>
              setCurrentDate(new Date(selectedYear, selectedMonth + 1, 1))
            }
            className="p-2 hover:bg-white rounded-lg transition-all text-slate-600"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl font-semibold text-sm transition-all shadow-sm"
          >
            <Download size={14} /> Export Excel
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl font-semibold text-sm transition-all shadow-sm"
          >
            <FileText size={14} /> Export PDF
          </button>
        </div>
      </div>

      {/* --- Summary Mini-Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Generated This Month
            </p>
            <p className="text-xl font-black text-slate-900">
              {fmt(summary.generated)}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BadgeCheck size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Collected This Month
            </p>
            <p className="text-xl font-black text-slate-900">
              {fmt(summary.collected)}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Banknote size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pending / Overdue
            </p>
            <p className="text-xl font-black text-slate-900">
              {fmt(summary.pending)}
            </p>
          </div>
        </div>
      </div>

      {/* --- Modern Charts Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-6">
            Revenue by Fee Type
          </h3>
          <div className="h-[300px]">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E2E8F0"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `Rs${val / 1000}k`}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "#F8FAFC" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                  />
                  <Bar
                    dataKey="Generated"
                    fill="#818CF8"
                    radius={[4, 4, 0, 0]}
                    barSize={32}
                  />
                  <Bar
                    dataKey="Collected"
                    fill="#34D399"
                    radius={[4, 4, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No data for this month
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 mb-2">
            Collection Status
          </h3>
          <div className="flex-1 min-h-[250px] relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    verticalAlign="bottom"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No data
              </div>
            )}
            {/* Center Percentage */}
            {pieData.length > 0 && summary.generated > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  Collected
                </span>
                <span className="text-xl font-black text-slate-900">
                  {Math.round((summary.collected / summary.generated) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Financial Calendar View --- */}
      <FinancialCalendar
        challans={monthlyChallans}
        year={selectedYear}
        month={selectedMonth}
      />
    </div>
  );
}

function FinancialCalendar({ challans, year, month }) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // Map challans to specific days
  const dayData = {};

  challans.forEach((c) => {
    // Check Overdue/Pending (mapped to dueDate)
    if (
      c.status === "overdue" ||
      c.status === "issued" ||
      c.status === "pending"
    ) {
      if (c.dueDate) {
        const dDate = new Date(c.dueDate);
        if (dDate.getMonth() === month && dDate.getFullYear() === year) {
          const day = dDate.getDate();
          if (!dayData[day]) dayData[day] = { due: [], paid: [] };
          dayData[day].due.push(c);
        }
      }
    }
    // Check Paid (mapped to paidAt or updatedAt fallback)
    if (c.status === "paid") {
      const pDate = c.paidAt ? new Date(c.paidAt) : new Date(c.updatedAt);
      if (pDate.getMonth() === month && pDate.getFullYear() === year) {
        const day = pDate.getDate();
        if (!dayData[day]) dayData[day] = { due: [], paid: [] };
        dayData[day].paid.push(c);
      }
    }
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-sm font-bold text-slate-900">
          Monthly Financial Calendar
        </h3>
        <div className="flex gap-4 text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>{" "}
            Deadline / Overdue
          </span>
          <div className="w-px h-4 bg-slate-200"></div>
          <span className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>{" "}
            Payment Received
          </span>
        </div>
      </div>

      <div className="p-6 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
        <div className="min-w-[750px]">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-3 mb-3">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-3">
            {blanks.map((b) => (
              <div
                key={`blank-${b}`}
                className="min-h-[100px] bg-slate-50/30 rounded-xl border border-transparent"
              ></div>
            ))}

            {days.map((day) => {
              const data = dayData[day];
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={day}
                  className={`min-h-[100px] rounded-xl border p-2.5 transition-all hover:shadow-md hover:-translate-y-0.5 ${isToday ? "border-indigo-300 bg-indigo-50/40 shadow-sm" : "border-slate-200 bg-white"}`}
                >
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-indigo-600 text-white" : "text-slate-500"}`}
                  >
                    {day}
                  </span>

                  <div className="mt-2.5 flex flex-col gap-1.5">
                    {data?.due.length > 0 && (
                      <div
                        className="bg-rose-50 border border-rose-100 rounded-lg px-2 py-1.5 flex justify-between items-center cursor-help"
                        title={data.due
                          .map((c) => c.studentId?.personalInfo?.fullName)
                          .join(", ")}
                      >
                        <span className="text-[10px] font-bold text-rose-700">
                          {data.due.length} Due
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                      </div>
                    )}

                    {data?.paid.length > 0 && (
                      <div
                        className="bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1.5 flex justify-between items-center cursor-help"
                        title={data.paid
                          .map((c) => c.studentId?.personalInfo?.fullName)
                          .join(", ")}
                      >
                        <span className="text-[10px] font-bold text-emerald-700">
                          {data.paid.length} Paid
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
