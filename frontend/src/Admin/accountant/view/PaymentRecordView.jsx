import React, { useRef } from "react";
import {
  Wallet, Plus, Image as ImageIcon, FileText, UploadCloud, X,
  Calendar, PieChart, CreditCard, ArrowDownToLine, ArrowUpRight,
  Landmark, Receipt, Edit3, Trash2, AlertTriangle, FileSpreadsheet,
  Printer, TrendingUp, TrendingDown, CheckCircle, MoreVertical,
  ChevronRight, BookOpen, DollarSign, Layers,
} from "lucide-react";
import { CircularProgress } from "@mui/material";
import * as XLSX from "xlsx";

/* ─── Google Fonts ─── */
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600&display=swap');`;

/* ─── Currency ─── */
const fmt = (n) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n || 0);

const fmtShort = (n) => {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
};

/* ─── Print Word (HTML → .doc) ─── */
const exportWord = (data, title) => {
  const rows = data.map(r => `
    <tr>
      <td>${r.title || r.description || "—"}</td>
      <td>${r.type}</td>
      <td>${r.source || "—"}</td>
      <td>${fmt(r.baseAmount)}</td>
      <td>${fmt(r.spent)}</td>
      <td>${fmt(r.remaining)}</td>
      <td>${new Date(r.date).toLocaleDateString("en-GB")}</td>
    </tr>`).join("");

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${title}</title>
    <style>
      body{font-family:Calibri,sans-serif;font-size:11pt;color:#1e293b}
      h1{font-size:18pt;font-weight:700;color:#1e293b;margin-bottom:4px}
      p.sub{font-size:9pt;color:#64748b;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;font-size:10pt}
      th{background:#1e293b;color:#fff;padding:8px 10px;text-align:left;font-weight:600;font-size:9pt;text-transform:uppercase;letter-spacing:.05em}
      td{padding:7px 10px;border-bottom:1pt solid #e2e8f0;vertical-align:top}
      tr:nth-child(even) td{background:#f8fafc}
    </style></head>
    <body>
    <h1>${title}</h1>
    <p class="sub">Generated on ${new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}</p>
    <table>
      <thead><tr>
        <th>Title / Description</th><th>Type</th><th>Source</th>
        <th>Total Amount</th><th>Amount Spent</th><th>Balance</th><th>Date</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </body></html>`;

  const blob = new Blob([html], { type: "application/msword" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${title.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0,10)}.doc`;
  a.click();
};

/* ─── Print Excel ─── */
const exportExcel = (data, title) => {
  const rows = data.map(r => ({
    "Title / Description": r.title || r.description || "—",
    "Record Type":         r.type,
    "Source":              r.source || "—",
    "Total Amount (PKR)":  r.baseAmount,
    "Amount Spent (PKR)":  r.spent,
    "Balance (PKR)":       r.remaining,
    "Date":                new Date(r.date).toLocaleDateString("en-GB"),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0]).map(k => ({ wch: Math.max(k.length + 2, 16) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Financial Records");
  XLSX.writeFile(wb, `${title.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0,10)}.xlsx`);
};

/* ─── Build export rows from records ─── */
const buildExportRows = (records, type) =>
  records.map(r => ({
    title:       r.title || r.description,
    type,
    source:      r.source || "—",
    baseAmount:  r.allocatedAmount || r.receivedAmount || r.amount || 0,
    spent:       r.expenses?.reduce((s, e) => s + e.amount, 0) || 0,
    remaining:   (r.allocatedAmount || r.receivedAmount || 0) - (r.expenses?.reduce((s,e)=>s+e.amount,0)||0),
    date:        r.date || r.createdAt,
  }));

/* ─── Stat Card ─── */
const StatCard = ({ label, value, sub, icon: Icon, color }) => {
  const palette = {
    slate:   { bg: "bg-slate-900",   icon: "bg-slate-800 text-slate-300",   val: "text-white",        border: "border-slate-800" },
    emerald: { bg: "bg-emerald-600", icon: "bg-emerald-500 text-white",     val: "text-white",        border: "border-emerald-500" },
    rose:    { bg: "bg-rose-600",    icon: "bg-rose-500 text-white",        val: "text-white",        border: "border-rose-500" },
    indigo:  { bg: "bg-indigo-600",  icon: "bg-indigo-500 text-white",      val: "text-white",        border: "border-indigo-500" },
  }[color] || {};

  return (
    <div className={`${palette.bg} rounded-2xl p-5 flex items-start justify-between gap-4 border ${palette.border}`}>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 mb-2">{label}</p>
        <p className={`text-2xl font-black leading-none ${palette.val}`} style={{ fontFamily: "'Geist Mono', monospace" }}>
          {value}
        </p>
        {sub && <p className="text-xs text-white/40 mt-1.5 font-medium">{sub}</p>}
      </div>
      <div className={`${palette.icon} p-2.5 rounded-xl shrink-0`}>
        <Icon size={18} strokeWidth={2} />
      </div>
    </div>
  );
};

/* ─── Progress Bar ─── */
const SpendBar = ({ pct }) => {
  const bar = pct >= 90 ? "bg-rose-500" : pct >= 65 ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${bar} transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
};

/* ─── Fund Card ─── */
const FundCard = ({ record, userRole, setSelectedRecordForExpense, isReceivedFund, onEdit, onDelete, onDeleteExpense }) => {
  const isHeadOrAdmin    = userRole === "headofaccount" || userRole === "admin";
  const isAccountantOrAdmin = userRole === "accountant" || userRole === "admin";
  const totalSpent = record.expenses?.reduce((s, e) => s + e.amount, 0) || 0;
  const base       = record.allocatedAmount || record.receivedAmount || 0;
  const pct        = base > 0 ? Math.min((totalSpent / base) * 100, 100) : 0;
  const remaining  = base - totalSpent;
  const canEdit    = isHeadOrAdmin || (isReceivedFund && isAccountantOrAdmin);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group">

      {/* Card top accent */}
      <div className={`h-1 w-full ${isReceivedFund ? "bg-indigo-500" : "bg-slate-700"}`} />

      {/* Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className={`inline-block text-[9px] font-black uppercase tracking-[0.18em] px-2.5 py-1 rounded-md mb-2 ${
              isReceivedFund ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}>
              {isReceivedFund ? "External Receipt" : "Budget Allocation"}
            </span>
            <h3 className="font-bold text-slate-900 text-[15px] leading-snug truncate">{record.title}</h3>
            {isReceivedFund && record.source && (
              <p className="text-xs text-indigo-500 font-semibold mt-1">Source: {record.source}</p>
            )}
            <p className="text-[11px] text-slate-400 font-medium mt-1.5 flex items-center gap-1">
              <Calendar size={11} />
              {new Date(record.date || record.createdAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}
            </p>
          </div>

          {/* Amount box */}
          <div className="text-right shrink-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
              {isReceivedFund ? "Amount Received" : "Budget Amount"}
            </p>
            <p className="text-xl font-black text-slate-900" style={{ fontFamily: "'Geist Mono', monospace" }}>
              {fmt(base)}
            </p>
          </div>
        </div>

        {/* Edit/Delete — shown on hover */}
        {canEdit && (
          <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(record, isReceivedFund ? "received" : "allocation")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all">
              <Edit3 size={12} /> Edit
            </button>
            <button onClick={() => onDelete(record._id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-all">
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Spend progress */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex justify-between items-center mb-2.5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Amount Spent</p>
            <p className="text-sm font-bold text-rose-600" style={{ fontFamily: "'Geist Mono', monospace" }}>
              {fmt(totalSpent)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Available Balance</p>
            <p className="text-base font-black text-emerald-600" style={{ fontFamily: "'Geist Mono', monospace" }}>
              {fmt(remaining)}
            </p>
          </div>
        </div>
        <SpendBar pct={pct} />
        <p className="text-[10px] text-slate-400 font-medium mt-1.5 text-right">{Math.round(pct)}% utilised</p>
      </div>

      {/* Expense ledger */}
      <div className="p-5 flex-1 bg-white">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-3 flex items-center gap-1.5">
          <BookOpen size={12} className="text-slate-400" /> Expense Entries
        </p>

        {!record.expenses?.length ? (
          <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs font-semibold">No expenses recorded yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}>
            {record.expenses.map((exp) => (
              <div key={exp._id}
                className="flex justify-between items-start bg-slate-50 hover:bg-slate-100 p-3.5 rounded-xl border border-slate-200 transition-colors group/exp">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="font-semibold text-slate-800 text-sm truncate">{exp.description}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(exp.date || exp.createdAt || Date.now()).toLocaleDateString("en-GB")}
                  </p>
                  {exp.proofs?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {exp.proofs.map((proof, i) => (
                        <a key={i} href={proof} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] bg-white text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md font-semibold hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                          <ImageIcon size={10} /> Proof {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="font-black text-rose-600 text-sm" style={{ fontFamily: "'Geist Mono', monospace" }}>
                    -{fmt(exp.amount)}
                  </span>
                  {isAccountantOrAdmin && (
                    <button onClick={() => onDeleteExpense(record._id, exp._id)}
                      className="text-slate-300 hover:text-rose-500 opacity-0 group-hover/exp:opacity-100 transition-all p-0.5">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
        {record.initialProof ? (
          <a href={record.initialProof} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
            <FileText size={13} /> View Supporting Document
          </a>
        ) : (
          <span className="text-[11px] text-slate-400 italic">No supporting document attached</span>
        )}

        {isAccountantOrAdmin && pct < 100 && (
          <button onClick={() => setSelectedRecordForExpense(record)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm">
            <Plus size={13} /> Add Expense
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Modal Shell ─── */
const Modal = ({ open, onClose, title, accentColor = "border-slate-700", children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white rounded-2xl w-full max-w-md shadow-2xl border-t-4 ${accentColor} overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

/* ─── Form Field ─── */
const Field = ({ label, children }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.18em] mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = (focus = "focus:border-indigo-400 focus:ring-indigo-100") =>
  `w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ${focus} font-medium text-slate-800 text-sm transition-all`;

/* ─── Tab Button ─── */
const Tab = ({ active, onClick, icon: Icon, label, activeColor }) => (
  <button onClick={onClick}
    className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
      active ? `${activeColor} text-white shadow-sm` : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
    }`}>
    <Icon size={15} /> {label}
  </button>
);

/* ══════════════════════════════════════════════════════
   MAIN VIEW
══════════════════════════════════════════════════════ */
const PaymentRecordView = ({
  userRole, allocations, receivedFunds, directExpenses,
  activeTab, setActiveTab, isLoading, isCreating, isAddingExpense,
  isAddingDirect, isAddingReceived, isDeleting,
  isAllocationModalOpen, setAllocationModalOpen,
  isReceivedFundModalOpen, setReceivedFundModalOpen,
  isDirectExpenseModalOpen, setDirectExpenseModalOpen,
  selectedRecordForExpense, setSelectedRecordForExpense,
  editingRecord, setEditingRecord, deletingRecordId, setDeletingRecordId,
  handleCreateOrUpdateAllocation, handleCreateOrUpdateReceivedFund,
  handleCreateOrUpdateDirectExpense, handleAddSubExpense,
  handleDeleteRecord, handleDeleteSubExpense, openEditModal,
}) => {
  const isHead      = userRole === "headofaccount" || userRole === "admin";
  const isAccountant = userRole === "accountant" || userRole === "admin";

  /* Summary totals */
  const totalAllocated = allocations.reduce((s, r) => s + (r.allocatedAmount || 0), 0);
  const totalReceived  = receivedFunds.reduce((s, r) => s + (r.receivedAmount || 0), 0);
  const totalDirect    = directExpenses.reduce((s, r) => s + (r.amount || 0), 0);
  const totalSpentAcrossAllocations = allocations.reduce(
    (s, r) => s + (r.expenses?.reduce((ss, e) => ss + e.amount, 0) || 0), 0);

  /* Build export data for current tab */
  const getExportData = () => {
    if (activeTab === "allocations") return buildExportRows(allocations, "Budget Allocation");
    if (activeTab === "received")    return buildExportRows(receivedFunds, "External Receipt");
    return directExpenses.map(r => ({
      title: r.description, type: "Direct Expense", source: r.source || "—",
      baseAmount: r.amount, spent: r.amount, remaining: 0, date: r.date || r.createdAt,
    }));
  };
  const exportTitle = activeTab === "allocations" ? "Budget Allocations Report"
    : activeTab === "received" ? "Received Funds Report" : "Direct Expenses Report";

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Geist', sans-serif" }}>
      <style>{FONTS}</style>

      <div className="max-w-screen-xl mx-auto px-5 md:px-8 py-8 flex flex-col gap-6">

        {/* ══ HEADER ══════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-md shrink-0">
              <Landmark size={22} className="text-white" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                Financial Records
              </h1>
              <p className="text-sm text-slate-400 font-medium mt-0.5">
                Budget allocations, external receipts, and expense tracking
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Export buttons */}
            <button
              onClick={() => exportExcel(getExportData(), exportTitle)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors">
              <FileSpreadsheet size={14} /> Export Excel
            </button>
            <button
              onClick={() => exportWord(getExportData(), exportTitle)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors">
              <FileText size={14} /> Export Word
            </button>

            {/* Action buttons */}
            {isHead && (
              <button
                onClick={() => { setEditingRecord(null); setAllocationModalOpen(true); }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm">
                <Plus size={14} /> New Budget Allocation
              </button>
            )}
            {isAccountant && (
              <>
                <button
                  onClick={() => { setEditingRecord(null); setReceivedFundModalOpen(true); }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm">
                  <ArrowDownToLine size={14} /> Record Receipt
                </button>
                <button
                  onClick={() => { setEditingRecord(null); setDirectExpenseModalOpen(true); }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors">
                  <CreditCard size={14} /> Record Expense
                </button>
              </>
            )}
          </div>
        </div>

        {/* ══ KPI STRIP ══════════════════════════════════════ */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatCard label="Total Budget Allocated" value={`PKR ${fmtShort(totalAllocated)}`} sub={`${allocations.length} records`} icon={Layers} color="slate" />
          <StatCard label="Total Funds Received"   value={`PKR ${fmtShort(totalReceived)}`}  sub={`${receivedFunds.length} records`} icon={ArrowDownToLine} color="indigo" />
          <StatCard label="Total Amount Spent"     value={`PKR ${fmtShort(totalSpentAcrossAllocations)}`} sub="across all budgets" icon={TrendingUp} color="emerald" />
          <StatCard label="Direct Expenditures"    value={`PKR ${fmtShort(totalDirect)}`}    sub={`${directExpenses.length} entries`} icon={CreditCard} color="rose" />
        </div>

        {/* ══ TABS ═══════════════════════════════════════════ */}
        <div className="bg-white border border-slate-200 rounded-2xl p-2 flex flex-wrap gap-1.5 shadow-sm w-fit">
          <Tab active={activeTab === "allocations"} onClick={() => setActiveTab("allocations")} icon={Layers}         label="Budget Allocations" activeColor="bg-slate-900" />
          <Tab active={activeTab === "received"}    onClick={() => setActiveTab("received")}    icon={ArrowDownToLine} label="Received Funds"     activeColor="bg-indigo-600" />
          <Tab active={activeTab === "direct"}      onClick={() => setActiveTab("direct")}      icon={CreditCard}      label="Direct Expenses"    activeColor="bg-rose-600" />
        </div>

        {/* ══ CONTENT ════════════════════════════════════════ */}
        {isLoading ? (
          <div className="flex justify-center py-32">
            <CircularProgress size={36} style={{ color: "#4F46E5" }} />
          </div>
        ) : (
          <div>

            {/* Budget Allocations */}
            {activeTab === "allocations" && (
              allocations.length === 0 ? (
                <EmptyState label="No budget allocations have been created yet" />
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {allocations.map(fund => (
                    <FundCard key={fund._id} record={fund} userRole={userRole}
                      setSelectedRecordForExpense={setSelectedRecordForExpense}
                      isReceivedFund={false} onEdit={openEditModal}
                      onDelete={setDeletingRecordId} onDeleteExpense={handleDeleteSubExpense} />
                  ))}
                </div>
              )
            )}

            {/* Received Funds */}
            {activeTab === "received" && (
              receivedFunds.length === 0 ? (
                <EmptyState label="No external receipts have been recorded yet" />
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {receivedFunds.map(fund => (
                    <FundCard key={fund._id} record={fund} userRole={userRole}
                      setSelectedRecordForExpense={setSelectedRecordForExpense}
                      isReceivedFund={true} onEdit={openEditModal}
                      onDelete={setDeletingRecordId} onDeleteExpense={handleDeleteSubExpense} />
                  ))}
                </div>
              )
            )}

            {/* Direct Expenses */}
            {activeTab === "direct" && (
              directExpenses.length === 0 ? (
                <EmptyState label="No direct expenses have been recorded yet" />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          {["Date", "Description", "Source of Funds", "Supporting Documents", "Amount", "Actions"].map(h => (
                            <th key={h} className={`px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 whitespace-nowrap ${h === "Amount" ? "text-right" : h === "Actions" ? "text-center" : "text-left"}`}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {directExpenses.map((exp, ri) => (
                          <tr key={exp._id} className={`hover:bg-slate-50/80 transition-colors ${ri % 2 === 1 ? "bg-slate-50/30" : ""}`}>
                            <td className="px-5 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                              {new Date(exp.date || exp.createdAt).toLocaleDateString("en-GB")}
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-semibold text-slate-800 text-sm">{exp.description}</p>
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-block bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
                                {exp.source || "External"}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex gap-2">
                                {exp.proofs?.map((proof, i) => (
                                  <a key={i} href={proof} target="_blank" rel="noreferrer"
                                    className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-indigo-100 hover:text-indigo-600 border border-slate-200 transition-colors"
                                    title={`Document ${i + 1}`}>
                                    <FileText size={13} />
                                  </a>
                                ))}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className="font-black text-rose-600 text-sm" style={{ fontFamily: "'Geist Mono', monospace" }}>
                                {fmt(exp.amount)}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-center">
                              {isAccountant && (
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={() => openEditModal(exp, "direct")}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                    <Edit3 size={14} />
                                  </button>
                                  <button onClick={() => setDeletingRecordId(exp._id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* ══════════════════ MODALS ══════════════════════════ */}

      {/* Budget Allocation Modal */}
      <Modal
        open={isAllocationModalOpen}
        onClose={() => { setAllocationModalOpen(false); setEditingRecord(null); }}
        title={editingRecord ? "Update Budget Allocation" : "New Budget Allocation"}
        accentColor="border-slate-800"
      >
        <form onSubmit={handleCreateOrUpdateAllocation} className="space-y-4">
          <Field label="Purpose / Title">
            <input required name="title" defaultValue={editingRecord?.title} type="text" className={inputCls()} placeholder="e.g. Department Supplies Q3" />
          </Field>
          <Field label="Allocated Amount (PKR)">
            <input required name="allocatedAmount" defaultValue={editingRecord?.allocatedAmount} type="number" className={inputCls()} placeholder="0" style={{ fontFamily: "'Geist Mono', monospace" }} />
          </Field>
          {!editingRecord && (
            <Field label="Supporting Document (Proof)">
              <input required name="proof" type="file" accept="image/*,application/pdf"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-700 cursor-pointer transition-all" />
            </Field>
          )}
          <button disabled={isCreating} type="submit"
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors mt-2 shadow-sm">
            {isCreating ? "Processing…" : editingRecord ? "Update Allocation" : "Confirm Allocation"}
          </button>
        </form>
      </Modal>

      {/* Received Fund Modal */}
      <Modal
        open={isReceivedFundModalOpen}
        onClose={() => { setReceivedFundModalOpen(false); setEditingRecord(null); }}
        title={editingRecord ? "Update Receipt Record" : "Record Received Funds"}
        accentColor="border-indigo-500"
      >
        <form onSubmit={handleCreateOrUpdateReceivedFund} className="space-y-4">
          <Field label="Title / Reference">
            <input required name="title" defaultValue={editingRecord?.title} type="text" className={inputCls("focus:border-indigo-400 focus:ring-indigo-100")} placeholder="e.g. Government Grant 2024" />
          </Field>
          <Field label="Source (Paying Party)">
            <input required name="source" defaultValue={editingRecord?.source} type="text" className={inputCls("focus:border-indigo-400 focus:ring-indigo-100")} placeholder="e.g. Ministry of Education" />
          </Field>
          <Field label="Amount Received (PKR)">
            <input required name="receivedAmount" defaultValue={editingRecord?.receivedAmount} type="number" className={inputCls("focus:border-indigo-400 focus:ring-indigo-100")} placeholder="0" style={{ fontFamily: "'Geist Mono', monospace" }} />
          </Field>
          {!editingRecord && (
            <Field label="Receipt / Supporting Document">
              <input required name="proof" type="file" accept="image/*,application/pdf"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer transition-all" />
            </Field>
          )}
          <button disabled={isAddingReceived} type="submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors mt-2 shadow-sm">
            {isAddingReceived ? "Saving…" : editingRecord ? "Update Record" : "Save Receipt"}
          </button>
        </form>
      </Modal>

      {/* Direct Expense Modal */}
      <Modal
        open={isDirectExpenseModalOpen}
        onClose={() => { setDirectExpenseModalOpen(false); setEditingRecord(null); }}
        title={editingRecord ? "Update Expense Record" : "Record Direct Expense"}
        accentColor="border-rose-500"
      >
        <form onSubmit={handleCreateOrUpdateDirectExpense} className="space-y-4">
          <Field label="Expense Description">
            <input required name="description" defaultValue={editingRecord?.description} type="text" className={inputCls("focus:border-rose-400 focus:ring-rose-100")} placeholder="e.g. Office stationery purchase" />
          </Field>
          <Field label="Source of Funds">
            <input required name="source" defaultValue={editingRecord?.source} type="text" className={inputCls("focus:border-rose-400 focus:ring-rose-100")} placeholder="e.g. Petty cash" />
          </Field>
          <Field label="Amount Spent (PKR)">
            <input required name="amount" defaultValue={editingRecord?.amount} type="number" className={inputCls("focus:border-rose-400 focus:ring-rose-100")} placeholder="0" style={{ fontFamily: "'Geist Mono', monospace" }} />
          </Field>
          {!editingRecord && (
            <Field label="Bills / Receipts (multiple allowed)">
              <input required name="proofs" type="file" multiple accept="image/*,application/pdf"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-rose-600 file:text-white hover:file:bg-rose-700 cursor-pointer transition-all" />
            </Field>
          )}
          <button disabled={isAddingDirect} type="submit"
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors mt-2 shadow-sm">
            {isAddingDirect ? "Saving…" : editingRecord ? "Update Expense" : "Save Expense"}
          </button>
        </form>
      </Modal>

      {/* Add Sub-Expense Modal */}
      <Modal
        open={!!selectedRecordForExpense}
        onClose={() => setSelectedRecordForExpense(null)}
        title="Add Expense Entry"
        accentColor="border-slate-700"
      >
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4">
          <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mb-0.5">Deducting from</p>
          <p className="font-bold text-slate-800 text-sm">{selectedRecordForExpense?.title}</p>
        </div>
        <form onSubmit={handleAddSubExpense} className="space-y-4">
          <Field label="Expense Description">
            <input required name="description" type="text" className={inputCls()} placeholder="Brief description of expense" />
          </Field>
          <Field label="Amount (PKR)">
            <input required name="amount" type="number" className={inputCls()} placeholder="0" style={{ fontFamily: "'Geist Mono', monospace" }} />
          </Field>
          <Field label="Supporting Documents (bills, receipts)">
            <input required name="proofs" type="file" multiple accept="image/*,application/pdf"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-700 cursor-pointer transition-all" />
          </Field>
          <button disabled={isAddingExpense} type="submit"
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors mt-2 shadow-sm">
            {isAddingExpense ? "Uploading…" : "Save Expense Entry"}
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      {deletingRecordId && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-7 shadow-2xl text-center">
            <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={26} className="text-rose-600" />
            </div>
            <h2 className="text-lg font-black text-slate-900 mb-2">Confirm Deletion</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              This will permanently delete the record along with all associated expense entries and documents. This action cannot be reversed.
            </p>
            <div className="flex gap-2.5">
              <button onClick={() => setDeletingRecordId(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors">
                Cancel
              </button>
              <button onClick={handleDeleteRecord} disabled={isDeleting}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors shadow-sm">
                {isDeleting ? "Deleting…" : "Delete Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Empty State ─── */
const EmptyState = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-28 gap-3 bg-white rounded-2xl border border-slate-200">
    <div className="p-4 bg-slate-100 rounded-2xl">
      <Receipt size={26} className="text-slate-400" />
    </div>
    <p className="font-semibold text-slate-500 text-sm">{label}</p>
  </div>
);

export default PaymentRecordView;