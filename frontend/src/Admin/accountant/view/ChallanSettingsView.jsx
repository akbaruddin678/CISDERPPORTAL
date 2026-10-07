import React from "react";
import ChallanSettingsModal from "./ChallanSettingsModal";
import { Tooltip } from "@mui/material";
import {
  Plus,
  Edit2,
  Trash2,
  Settings,
  BookOpen,
  UserPlus,
  RefreshCw,
  FileText,
  LayoutGrid,
  ChevronDown,
  Filter,
  Layers,
  Loader2,
  Wallet,
  Printer,
} from "lucide-react";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
.jmono { font-family: 'JetBrains Mono', monospace !important; }
.sr-scroll::-webkit-scrollbar { width: 4px; }
.sr-scroll::-webkit-scrollbar-track { background: transparent; }
.sr-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
.print-header { display: none; }
@media print {
  .no-print { display: none !important; }
  .print-header { display: block !important; }
  body, .print-area { background: white !important; }
  .print-area, .print-area * { box-shadow: none !important; }
  .print-area table { width: 100% !important; border-collapse: collapse !important; }
  .print-area th, .print-area td { border: 1px solid #cbd5e1 !important; }
}
`;

const ChallanSettingsView = (props) => {
  const {
    activeTab,
    setActiveTab,
    tableData = [],
    handleDelete,
    handleEdit,
    handleAdd,
    sessionOptions,
    selectedSession,
    setSelectedSession,
    departmentOptions,
    selectedDepartment,
    setSelectedDepartment,
    programOptions,
    selectedProgram,
    setSelectedProgram,
    isLoading,
    modalState,
    closeModal,
    generateBreakdown,
    ...rest
  } = props;

  const formatCurrency = (val) =>
    Number(val).toLocaleString("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    });

  const TABS = [
    { label: "Tuition (Section)", icon: BookOpen },
    { label: "Admission (Fresh)", icon: UserPlus },
    { label: "Re-Admission", icon: RefreshCw },
    { label: "Exam Fee", icon: FileText },
    { label: "General / Misc", icon: LayoutGrid },
    { label: "Basic Fee (Section)", icon: Wallet },
  ];

  // Tuition, Exam and Basic are all set up per-semester (one distinct row
  // per semesterNumber) — Admission/Re-Admission/Misc are flat per-program.
  const isSemesterTab = activeTab === 0 || activeTab === 3 || activeTab === 5;
  const selectedSessionLabel = sessionOptions.find(
    (o) => o.value === selectedSession,
  )?.label;
  const selectedProgramLabel = programOptions.find(
    (o) => o.value === selectedProgram,
  )?.label;

  return (
    <>
      <style>{FONTS}</style>
      <div
        className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 print-area"
        style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
      >
        {/* ── HEADER ── */}
        <header className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-8 py-5 bg-white border-b border-slate-200 shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <Settings size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                Fee Structure Setup
              </h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Configure baseline financial templates for programs and
                sessions.
              </p>
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-100"
          >
            <Plus size={16} strokeWidth={3} />
            Create New Fee
          </button>
        </header>

        {/* ── TABS ── */}
        <div className="no-print bg-white border-b border-slate-200 px-8 shrink-0 z-10 sticky top-0 overflow-x-auto sr-scroll">
          <div className="flex gap-2 min-w-max pt-2">
            {TABS.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all ${
                    isActive
                      ? "bg-slate-50 text-indigo-700 border-t-2 border-indigo-600"
                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-50 border-t-2 border-transparent"
                  }`}
                >
                  <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* ── FILTERS ── */}
          {activeTab !== 4 && (
            <div className="no-print px-8 py-4 bg-slate-50 border-b border-slate-200 shrink-0 z-10">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 mr-2">
                  <Filter size={14} className="text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Filters
                  </span>
                </div>

                <div className="relative w-full sm:w-64">
                  <select
                    value={selectedSession}
                    onChange={(e) => {
                      setSelectedSession(e.target.value);
                      setSelectedDepartment("");
                    }}
                    className="w-full pl-4 pr-10 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 cursor-pointer shadow-sm transition-all"
                  >
                    <option value="">All Sessions</option>
                    {sessionOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={14}
                  />
                </div>

                <div className="relative w-full sm:w-64">
                  <select
                    disabled={!selectedSession}
                    value={selectedDepartment}
                    onChange={(e) => {
                      setSelectedDepartment(e.target.value);
                      setSelectedProgram("");
                    }}
                    className="w-full pl-4 pr-10 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 shadow-sm transition-all"
                  >
                    <option value="">All Classes</option>
                    {departmentOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={14}
                  />
                </div>

                <div className="relative w-full sm:w-64">
                  <select
                    disabled={!selectedDepartment}
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 shadow-sm transition-all"
                  >
                    <option value="">All Programs</option>
                    {programOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={14}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── TABLE CONTAINER ── */}
          <div className="flex-1 overflow-auto sr-scroll p-8 bg-slate-50/50">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
              {/* Print-only header — hidden on screen, shown when printing */}
              <div className="print-header px-6 pt-6 pb-2">
                <h2 className="text-lg font-black text-slate-900">
                  {TABS[activeTab]?.label} — Fee Structure
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {selectedProgramLabel && <>Program: {selectedProgramLabel} · </>}
                  {selectedSessionLabel && <>Session: {selectedSessionLabel} · </>}
                  Generated: {new Date().toLocaleDateString()}
                </p>
              </div>

              <div className="no-print px-6 py-3 border-b border-slate-100 flex justify-end">
                <button
                  onClick={() => window.print()}
                  disabled={tableData.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors"
                >
                  <Printer size={14} strokeWidth={2.5} />
                  Print Setup
                </button>
              </div>

              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <Loader2 size={32} className="animate-spin text-indigo-500" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Loading Records...
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto sr-scroll">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">
                          {isSemesterTab ? "Semester" : "Name / Reference"}
                        </th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">
                          Total Amount
                        </th>
                        {activeTab !== 4 && (
                          <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">
                            Fee Breakdown
                          </th>
                        )}
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tableData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={activeTab !== 4 ? 4 : 3}
                            className="py-20 text-center"
                          >
                            <div className="flex flex-col items-center justify-center gap-3">
                              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-dashed border-slate-200">
                                <Layers size={28} className="text-slate-300" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-500">
                                  No configurations found
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                  Adjust your filters or click "Create New Fee"
                                  to begin.
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        tableData.map((row) => (
                          <tr
                            key={row._id}
                            className="hover:bg-slate-50/80 transition-colors group"
                          >
                            {/* COL 1: Reference */}
                            <td className="px-6 py-4">
                              {activeTab === 4 ? (
                                <p className="font-bold text-slate-800">
                                  {row.name}
                                </p>
                              ) : isSemesterTab ? (
                                <div className="flex flex-col items-start">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-sm font-black">
                                    {row.academicLevel === "YEAR"
                                      ? "Year"
                                      : "Semester"}{" "}
                                    {row.levelNumber || row.semesterNumber}
                                  </span>
                                  <p className="text-[11px] font-semibold text-slate-400 mt-1.5">
                                    {row.programId?.name} · {row.termId?.name}
                                  </p>
                                </div>
                              ) : (
                                <div className="flex flex-col items-start">
                                  <p className="font-bold text-slate-900 text-[13px]">
                                    {row.programId?.name}
                                  </p>
                                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                    {row.termId?.name}
                                  </p>
                                </div>
                              )}
                            </td>

                            {/* COL 2: Amount */}
                            <td className="px-6 py-4">
                              <div className="flex flex-col items-start gap-1">
                                <span className="jmono text-[15px] font-black text-slate-800">
                                  {formatCurrency(
                                    activeTab === 4
                                      ? row.amount
                                      : row.totalAmount,
                                  )}
                                </span>
                                {/* ✅ DISPLAY REGISTRATION FEE (Tab 1 & 2) */}
                                {(activeTab === 1 || activeTab === 2) &&
                                  row.registrationFee > 0 && (
                                    <span className="text-[10px] font-bold text-blue-600 mt-0.5 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                      + Reg:{" "}
                                      {formatCurrency(row.registrationFee)}
                                    </span>
                                  )}
                                {/* DISPLAY SECURITY DEPOSIT (Tab 1) */}
                                {activeTab === 1 && row.securityDeposit > 0 && (
                                  <span className="text-[10px] font-bold text-amber-600 mt-0.5 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                    + Sec: {formatCurrency(row.securityDeposit)}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* COL 3: Breakdown */}
                            {activeTab !== 4 && (
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                                  {row.feeItems
                                    ?.slice(0, 4)
                                    .map((item, idx) => (
                                      <Tooltip
                                        key={idx}
                                        title={`${item.headId?.name || "Fee"}: ${item.percentageValue}%`}
                                        placement="top"
                                        arrow
                                      >
                                        <span className="inline-flex items-center gap-1.5 text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-lg cursor-help hover:border-indigo-300 hover:text-indigo-700 transition-colors shadow-sm">
                                          <span className="font-semibold truncate max-w-[80px]">
                                            {item.headId?.name?.split(" ")[0] ||
                                              "Fee"}
                                          </span>
                                          <span className="font-black text-slate-800">
                                            {item.percentageValue}%
                                          </span>
                                        </span>
                                      </Tooltip>
                                    ))}
                                  {row.feeItems?.length > 4 && (
                                    <span className="inline-flex items-center text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                                      +{row.feeItems.length - 4}
                                    </span>
                                  )}
                                </div>
                              </td>
                            )}

                            {/* COL 4: Actions */}
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEdit(row)}
                                  className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                                  title="Edit Structure"
                                >
                                  <Edit2 size={15} strokeWidth={2.5} />
                                </button>
                                <button
                                  onClick={() => handleDelete(row._id)}
                                  className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm"
                                  title="Delete Structure"
                                >
                                  <Trash2 size={15} strokeWidth={2.5} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <ChallanSettingsModal
          isOpen={modalState.isOpen && modalState.name === "feeModal"}
          onClose={closeModal}
          activeTab={activeTab}
          generateBreakdown={generateBreakdown}
          {...rest}
        />
      </div>
    </>
  );
};

export default ChallanSettingsView;
