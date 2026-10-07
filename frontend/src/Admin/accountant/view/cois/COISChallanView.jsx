import React, { useRef, useCallback, useState, useMemo } from "react";
import {
  Search,
  Check,
  Users,
  X,
  Receipt,
  SlidersHorizontal,
  ChevronRight,
  Loader2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowLeft,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Image as ImageIcon,
  MessageSquare,
  Globe,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import { Checkbox } from "@mui/material";
import { useCOISChallan } from "../../controller/useCOISChallan";

// ✅ Import the extracted printing logic perfectly
import { buildChallanPage, openPrintWindow } from "../../common/ChallanPrintTemplate";

// Import your existing ERP Components
import ChallanTable from "../../view/Challan/ChallanTable";
import {
  GenerateModal,
  InstallmentModal,
  EditDateModal,
  DiscountModal,
  DetailModal,
  MarkPaidModal,
} from "../../view/Challan/ChallanModals";

// ─── Helpers & Formatting ──────────────────────────────────────────────────
const STAMP_URL = window.location.origin + "/accountss.jpeg";

const fmtPKR = (val) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(val || 0);

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "N/A");

const Avatar = ({ name = "" }) => {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className={`w-9 h-9 text-xs rounded-full flex items-center justify-center font-bold shrink-0 border-2 border-white`}
      style={{
        background: `hsl(${hue},55%,88%)`,
        color: `hsl(${hue},55%,30%)`,
      }}
    >
      {initials || "?"}
    </div>
  );
};

// ─── Excel Export ─────────────────────────────────────────────────────────
const exportToExcel = (challans, filters) => {
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

  if (typeof window !== "undefined" && window.XLSX) {
    const wb = window.XLSX.utils.book_new();
    const ws = window.XLSX.utils.aoa_to_sheet([headers, ...rows]);
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

    window.XLSX.writeFile(
      wb,
      `CISD_Challans_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
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
    const blob = new Blob(["\uFEFF" + csvContent], {
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
                  label: "Section",
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
          <div className="space-y-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-200">
              Financial Overview
            </p>
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
export default function COISChallanView() {
  const {
    generationMode,
    setGenerationMode,
    selectedStudent,
    setSelectedStudent,
    selectedBulkStudents,
    setSelectedBulkStudents,
    terms,
    programs,
    semesters,
    miscFeesList,
    selectedTerm,
    setSelectedTerm,
    selectedProg,
    handleProgChange,
    selectedSem,
    setSelectedSem,
    search,
    setSearch,
    studentsList,
    loadMoreStudents,
    hasMore,
    isStudentsLoading,
    handleGenerateSingle,
    handleGenerateBulk,
    studentChallans,
    isChallanLoading,
    tableActions,
    isProcessing,
    fetchPrintChallans,
    filters,
    handleFilterChange,
    handleSearchClick,
    handleClearSearch,
    handleKeyDown,
    pagination,
    totalPages,
    handlePageChange,
  } = useCOISChallan();

  const [modals, setModals] = useState({
    gen: false,
    inst: null,
    date: null,
    disc: null,
    detail: null,
    pay: null,
  });
  const [receiptData, setReceiptData] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState(null);

  const [bulkDate, setBulkDate] = useState("");
  const [bulkFeeTypes, setBulkFeeTypes] = useState({
    tuition: true,
    admission: false,
    readmission: false,
    exam: false,
    general: false,
  });
  const [bulkMiscFees, setBulkMiscFees] = useState([]);
  const [showBulkMisc, setShowBulkMisc] = useState(false);

  const safeChallans = useMemo(
    () =>
      studentChallans.filter(
        (c) => !(c.challanType || "").toLowerCase().includes("hostel"),
      ),
    [studentChallans],
  );
  const allVisibleSelected =
    studentsList.length > 0 &&
    studentsList.every((s) =>
      selectedBulkStudents.some((sel) => sel._id === s._id),
    );

  const sentinelRef = useRef(null);
  const loaderCallback = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !isStudentsLoading)
        loadMoreStudents();
    },
    [hasMore, isStudentsLoading, loadMoreStudents],
  );

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(loaderCallback, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loaderCallback]);

  // ✅ Re-implementing the print executions to use the template
  const executeSinglePrint = (challan) => {
    if (!challan) return;
    openPrintWindow(
      buildChallanPage(challan),
      `Fee Challan — ${challan.challanNo}`,
    );
  };

  const executeBulkPrint = async () => {
    const win = window.open("", "_blank");
    if (!win) return alert("Pop-up blocked. Please allow pop-ups.");
    win.document.open();
    win.document.write(
      "<html><body style='font-family: sans-serif; padding: 20px;'><h2 style='color:#4f46e5;'>Generating Bulk Challans, please wait...</h2></body></html>",
    );
    win.document.close();
    try {
      const res = await fetchPrintChallans({
        limit: 5000,
        ...filters,
      }).unwrap();
      const list = (res?.data?.challans || []).filter(
        (c) =>
          c.status !== "cancelled" &&
          !(c.challanType || "").toLowerCase().includes("hostel"),
      );
      if (!list.length) {
        win.close();
        return alert("No active challans found.");
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
      let exportData = safeChallans;
      try {
        const res = await fetchPrintChallans({
          limit: 10000,
          ...filters,
        }).unwrap();
        const all = (res?.data?.challans || []).filter(
          (c) => !(c.challanType || "").toLowerCase().includes("hostel"),
        );
        if (all.length) exportData = all;
      } catch (_) {}
      exportToExcel(exportData, filters);
    } catch (err) {
      alert("Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  // ─── VIEW 1: STUDENT DETAIL & CHALLAN TABLE ───
  if (selectedStudent) {
    return (
      <div className="animate-in slide-in-from-right duration-300">
        <button
          onClick={() => setSelectedStudent(null)}
          className="mb-4 flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800"
        >
          <ArrowLeft size={18} /> Back to Directory
        </button>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Avatar
              name={selectedStudent.personalInfo?.fullName || "Student"}
            />
            <div>
              <h1 className="text-2xl font-bold">
                {selectedStudent.personalInfo?.fullName}
              </h1>
              <div className="flex gap-4 text-sm text-slate-500 mt-1 font-mono">
                <span>{selectedStudent.studentId}</span> •{" "}
                <span>{selectedStudent.programId?.name || "N/A"}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setModals({ ...modals, gen: true })}
            className="px-5 py-2.5 bg-violet-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-violet-700 shadow-sm"
          >
            <Plus size={18} /> Generate New
          </button>
        </div>

        {isChallanLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="animate-spin text-violet-500" size={32} />
          </div>
        ) : (
          <ChallanTable
            challans={studentChallans}
            onRowClick={(c) => setModals({ ...modals, detail: c })}
            actions={{
              onPay: (id) => setModals({ ...modals, pay: id }),
              onDelete: (id) => {
                if (window.confirm("Void Challan?"))
                  tableActions.deleteChallan(id);
              },
              onPrint: (id) =>
                executeSinglePrint(studentChallans.find((c) => c._id === id)), // ✅ Uses new template execution
              onInstallment: (id) =>
                setModals({
                  ...modals,
                  inst: studentChallans.find((c) => c._id === id),
                }),
              onEditDate: (id) =>
                setModals({
                  ...modals,
                  date: studentChallans.find((c) => c._id === id),
                }),
              onDiscount: (id) =>
                setModals({
                  ...modals,
                  disc: studentChallans.find((c) => c._id === id),
                }),
            }}
          />
        )}

        <GenerateModal
          isOpen={modals.gen}
          onClose={() => setModals({ ...modals, gen: false })}
          studentName={selectedStudent.personalInfo?.fullName}
          isLoading={isProcessing}
          onGenerate={async (f) => {
            await handleGenerateSingle(f);
            setModals({ ...modals, gen: false });
          }}
        />
        <InstallmentModal
          isOpen={!!modals.inst}
          onClose={() => setModals({ ...modals, inst: null })}
          totalAmount={modals.inst?.netAmount}
          isLoading={isProcessing}
          onConvert={async (r) => {
            await tableActions.createInstallments(modals.inst._id, r);
            setModals({ ...modals, inst: null });
          }}
        />
        <EditDateModal
          isOpen={!!modals.date}
          onClose={() => setModals({ ...modals, date: null })}
          currentDueDate={modals.date?.dueDate}
          isLoading={isProcessing}
          onUpdate={async (d) => {
            await tableActions.updateDueDate(modals.date._id, d);
            setModals({ ...modals, date: null });
          }}
        />
        <DiscountModal
          isOpen={!!modals.disc}
          onClose={() => setModals({ ...modals, disc: null })}
          challanData={modals.disc}
          isLoading={isProcessing}
          onApply={async (f) => {
            await tableActions.applyDiscount(modals.disc._id, f);
            setModals({ ...modals, disc: null });
          }}
          onRemove={async (id) => {
            await tableActions.removeDiscount(id);
            setModals({ ...modals, disc: null });
          }}
        />
        <DetailModal
          isOpen={!!modals.detail}
          onClose={() => setModals({ ...modals, detail: null })}
          data={modals.detail}
          student={selectedStudent}
        />
        <MarkPaidModal
          isOpen={!!modals.pay}
          onClose={() => setModals({ ...modals, pay: null })}
          isLoading={isProcessing}
          onConfirm={async (f) => {
            await tableActions.markPaid(modals.pay, f);
            setModals({ ...modals, pay: null });
          }}
        />
      </div>
    );
  }

  // ─── VIEW 2: DIRECTORY / BULK ───
  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col gap-6">
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
            Generate individual or bulk fee challans based on selected criteria,
            while also providing a reporting tool to export dynamically filtered
            grid data to Excel.
          </p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <button
            onClick={handleExport}
            disabled={
              isChallanLoading || isExporting || safeChallans.length === 0
            }
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold shadow-sm text-sm disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={15} className="text-emerald-600" />
            )}{" "}
            Export Excel
          </button>
          <button
            onClick={executeBulkPrint}
            disabled={isChallanLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-sm shadow-indigo-200 text-sm disabled:opacity-50"
          >
            <Printer size={15} /> Bulk Print
          </button>
        </div>
      </div>

      <div className="h-[calc(100vh-200px)] bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row overflow-hidden">
        {/* LEFT SIDEBAR */}
        <div className="w-full md:w-72 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-5 border-b border-slate-200 bg-white sticky top-0 z-20">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
              <button
                onClick={() => {
                  setGenerationMode("single");
                  setSelectedBulkStudents([]);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${generationMode === "single" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Individual
              </button>
              <button
                onClick={() => setGenerationMode("bulk")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${generationMode === "bulk" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Bulk Tools
              </button>
            </div>
          </div>
          <div className="p-5 space-y-4 border-b border-slate-200">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
              <SlidersHorizontal size={14} /> Directory Filters
            </h2>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                Academic Session *
              </label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Select Session...</option>
                {terms.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                Program (COIS)
              </label>
              <select
                value={selectedProg}
                onChange={(e) => handleProgChange(e.target.value)}
                className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">All Programs</option>
                {programs.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                Section / Part
              </label>
              <select
                disabled={!selectedProg}
                value={selectedSem}
                onChange={(e) => setSelectedSem(e.target.value)}
                className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-3 py-2.5 outline-none disabled:opacity-50 focus:ring-2 focus:ring-violet-500"
              >
                <option value="">All Parts</option>
                {semesters.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name || `Part ${s.number}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {generationMode === "bulk" && (
            <div className="p-5 space-y-4 bg-violet-50/50 flex-1">
              <h2 className="text-xs font-bold text-violet-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                <Layers size={14} /> Bulk Settings
              </h2>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                  Target Due Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={bulkDate}
                    onChange={(e) => setBulkDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <Calendar
                    className="absolute left-3 top-3 text-slate-400 pointer-events-none"
                    size={14}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                  Include Fee Types
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["tuition", "exam", "admission", "readmission"].map((t) => (
                    <label
                      key={t}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-[10px] font-bold transition-all ${bulkFeeTypes[t] ? "bg-violet-100 border-violet-300 text-violet-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={bulkFeeTypes[t]}
                        onChange={() =>
                          setBulkFeeTypes((p) => ({ ...p, [t]: !p[t] }))
                        }
                      />
                      <span className="capitalize">{t}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                onClick={() =>
                  handleGenerateBulk({
                    dueDate: bulkDate,
                    feeTypes: Object.keys(bulkFeeTypes).filter(
                      (k) => bulkFeeTypes[k],
                    ),
                    miscFeeIds: bulkMiscFees,
                  })
                }
                disabled={isProcessing || selectedBulkStudents.length === 0}
                className="w-full mt-4 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-all flex justify-center items-center gap-2 shadow-md"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Processing...
                  </>
                ) : (
                  `Generate Bulk (${selectedBulkStudents.length})`
                )}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR (Students Table) */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
            <div className="relative w-80">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search roll number or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-500 font-medium"
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto relative">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  {generationMode === "bulk" && (
                    <th className="px-6 py-4 w-10">
                      <Checkbox
                        size="small"
                        checked={allVisibleSelected}
                        indeterminate={
                          selectedBulkStudents.length > 0 && !allVisibleSelected
                        }
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (checked)
                            setSelectedBulkStudents([
                              ...new Set([
                                ...selectedBulkStudents,
                                ...studentsList,
                              ]),
                            ]);
                          else
                            setSelectedBulkStudents(
                              selectedBulkStudents.filter(
                                (s) =>
                                  !studentsList.some((ls) => ls._id === s._id),
                              ),
                            );
                        }}
                      />
                    </th>
                  )}
                  <th className="px-6 py-4">Roll No</th>
                  <th className="px-6 py-4">Student Profile</th>
                  <th className="px-6 py-4">Program & Session</th>
                  {generationMode === "single" && (
                    <th className="px-6 py-4 text-right">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentsList.map((student) => {
                  const isSelected =
                    generationMode === "bulk" &&
                    selectedBulkStudents.some((s) => s._id === student._id);
                  return (
                    <tr
                      key={student._id}
                      onClick={() => {
                        if (generationMode === "bulk")
                          setSelectedBulkStudents((p) =>
                            p.some((s) => s._id === student._id)
                              ? p.filter((s) => s._id !== student._id)
                              : [...p, student],
                          );
                        else setSelectedStudent(student);
                      }}
                      className={`cursor-pointer transition-colors ${isSelected ? "bg-violet-50/50" : "hover:bg-slate-50"}`}
                    >
                      {generationMode === "bulk" && (
                        <td className="px-6 py-3">
                          <Checkbox
                            size="small"
                            checked={isSelected}
                            readOnly
                          />
                        </td>
                      )}
                      <td className="px-6 py-3 font-mono font-bold text-slate-500">
                        {student.studentId}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={student.personalInfo?.fullName || "N/A"}
                          />
                          <div>
                            <p className="font-bold text-slate-800">
                              {student.personalInfo?.fullName || "N/A"}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {student.personalInfo?.phone || "No Phone"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <p className="font-bold text-slate-600">
                          {student.programId?.name || "—"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Sem {student.semesterId?.number || "—"}
                        </p>
                      </td>
                      {generationMode === "single" && (
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudent(student);
                            }}
                            className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 hover:bg-violet-600 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                          >
                            View / Generate
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div ref={sentinelRef} className="h-4" />
            {isStudentsLoading && (
              <div className="py-8 flex justify-center">
                <Loader2 size={24} className="animate-spin text-violet-500" />
              </div>
            )}
          </div>
        </div>
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
}
