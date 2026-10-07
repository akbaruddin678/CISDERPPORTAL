import React from "react";
import {
  Building2,
  Receipt,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  Users,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  TrendingDown,
  X,
  SlidersHorizontal,
  BadgeCheck,
  Clock,
  AlertTriangle,
  Minus,
} from "lucide-react";

/* ─────────────────────────────
   FONTS
───────────────────────────── */
const FONT_IMPORT = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
  * { font-family: 'Plus Jakarta Sans', sans-serif; }
  .mono { font-family: 'JetBrains Mono', monospace; }
  .dc-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
  .dc-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 99px; }
  .dc-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
  .dc-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  select option { background: #fff; color: #1e293b; }
`;

/* ─────────────────────────────
   FORMATTERS
───────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const fmtShort = (n) => {
  if (!n) return "PKR 0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
};

/* ─────────────────────────────
   STATUS BADGE
───────────────────────────── */
const BADGE = {
  paid: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: BadgeCheck,
    label: "Paid",
  },
  overdue: {
    bg: "bg-red-50    text-red-700    border-red-200",
    icon: AlertTriangle,
    label: "Overdue",
  },
  issued: {
    bg: "bg-amber-50  text-amber-700  border-amber-200",
    icon: Clock,
    label: "Pending",
  },
  partial: {
    bg: "bg-blue-50   text-blue-700   border-blue-200",
    icon: Minus,
    label: "Partial",
  },
};
const StatusBadge = ({ status }) => {
  const b = BADGE[status?.toLowerCase()] || {
    bg: "bg-slate-50 text-slate-600 border-slate-200",
    icon: Minus,
    label: status,
  };
  const Icon = b.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${b.bg}`}
    >
      <Icon size={9} strokeWidth={2.5} />
      {b.label}
    </span>
  );
};

/* ─────────────────────────────
   KPI CARD
───────────────────────────── */
const KCOLORS = {
  blue: {
    bg: "bg-blue-600",
    light: "bg-blue-50",
    text: "text-blue-600",
    val: "text-blue-700",
    border: "border-blue-100",
  },
  violet: {
    bg: "bg-violet-600",
    light: "bg-violet-50",
    text: "text-violet-600",
    val: "text-violet-700",
    border: "border-violet-100",
  },
  emerald: {
    bg: "bg-emerald-600",
    light: "bg-emerald-50",
    text: "text-emerald-600",
    val: "text-emerald-700",
    border: "border-emerald-100",
  },
  rose: {
    bg: "bg-rose-500",
    light: "bg-rose-50",
    text: "text-rose-600",
    val: "text-rose-700",
    border: "border-rose-100",
  },
};
const KpiCard = ({ label, value, sub, icon: Icon, color }) => {
  const c = KCOLORS[color];
  return (
    <div
      className={`bg-white rounded-2xl border ${c.border} p-5 flex items-start justify-between gap-4 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
          {label}
        </p>
        <p className={`text-2xl font-extrabold ${c.val} leading-none mono`}>
          {value}
        </p>
        {sub && (
          <p className="text-xs text-slate-400 mt-1.5 font-medium">{sub}</p>
        )}
      </div>
      <div className={`${c.light} p-3 rounded-xl shrink-0`}>
        <Icon size={20} className={c.text} strokeWidth={2} />
      </div>
    </div>
  );
};

/* ─────────────────────────────
   RATE BADGE
───────────────────────────── */
const RateBadge = ({ rate }) => {
  const cfg =
    rate >= 75
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : rate >= 40
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-rose-50 text-rose-700 border-rose-200";
  return (
    <span
      className={`text-[10px] font-bold border rounded-full px-2.5 py-0.5 uppercase tracking-wide ${cfg}`}
    >
      {rate}% collected
    </span>
  );
};

/* ─────────────────────────────
   PROGRESS BAR
───────────────────────────── */
const ProgressBar = ({ rate }) => {
  const bar =
    rate >= 75 ? "bg-emerald-500" : rate >= 40 ? "bg-amber-400" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${bar} transition-all duration-500`}
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  );
};

/* ─────────────────────────────
   MAIN COMPONENT
───────────────────────────── */
const DepartmentChallanView = ({
  groupedData,
  terms,
  filters,
  setFilters,
  expandedDept,
  toggleDepartment,
  isLoading,
  handleDownloadChallan,
  handleExportExcel,
}) => {
  const totals = React.useMemo(() => {
    const t = { challans: 0, collected: 0, pending: 0, students: 0 };
    groupedData.forEach((d) => {
      t.challans += d.totalChallans;
      t.collected += d.collectedAmount;
      t.pending += d.pendingAmount;
      t.students += d.totalEnrolledStudents;
    });
    return t;
  }, [groupedData]);

  const hasFilters = filters.search || filters.termId || filters.status;
  const clearFilters = () => setFilters({ search: "", termId: "", status: "" });

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{FONT_IMPORT}</style>

      <div className="max-w-screen-xl mx-auto px-5 md:px-8 py-8 flex flex-col gap-6">
        {/* ══ HEADER ══════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {/* <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Building2 size={13} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600">
                Financial Analytics
              </span>
            </div> */}
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Department Wise Challan Report
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              {groupedData.length} departments &nbsp;·&nbsp;{" "}
              {totals.challans.toLocaleString()} total invoices
            </p>
          </div>

          <button
            onClick={() => handleExportExcel()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-700 active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-md shrink-0"
          >
            <FileSpreadsheet size={15} strokeWidth={2} />
            Export All to Excel
          </button>
        </div>

        {/* ══ KPI STRIP ═══════════════════════════ */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <KpiCard
            label="Departments"
            value={groupedData.length}
            sub="active units"
            icon={Building2}
            color="blue"
          />
          <KpiCard
            label="Students"
            value={totals.students.toLocaleString()}
            sub="unique enrolled"
            icon={Users}
            color="violet"
          />
          <KpiCard
            label="Collected"
            value={`PKR ${fmtShort(totals.collected)}`}
            sub={`${totals.challans} invoices`}
            icon={TrendingUp}
            color="emerald"
          />
          <KpiCard
            label="Pending"
            value={`PKR ${fmtShort(totals.pending)}`}
            sub="outstanding balance"
            icon={TrendingDown}
            color="rose"
          />
        </div>

        {/* ══ FILTER BAR ══════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5 p-3">
            <div className="hidden lg:flex items-center gap-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0">
              <SlidersHorizontal size={12} />
              Filters
            </div>
            <div className="hidden lg:block w-px h-5 bg-slate-100 mx-1 shrink-0" />

            {/* Search */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 flex-1 min-w-[180px] focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search student or challan number…"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="bg-transparent text-sm font-medium py-2.5 outline-none text-slate-700 placeholder:text-slate-400 w-full"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters({ ...filters, search: "" })}
                  className="text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Session */}
            <div className="relative">
              <select
                value={filters.termId}
                onChange={(e) =>
                  setFilters({ ...filters, termId: e.target.value })
                }
                className="appearance-none bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl pl-4 pr-9 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-slate-700 cursor-pointer w-full sm:w-52 transition-all"
              >
                <option value="">All Sessions</option>
                {terms.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* Status */}
            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="appearance-none bg-slate-50 border border-slate-200 text-sm font-semibold rounded-xl pl-4 pr-9 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-slate-700 cursor-pointer w-full sm:w-40 transition-all"
              >
                <option value="">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="issued">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors shrink-0"
              >
                <X size={11} /> Clear
              </button>
            )}
          </div>

          {/* Active pills */}
          {hasFilters && (
            <div className="border-t border-slate-100 px-4 py-2.5 flex flex-wrap gap-2 items-center">
              {filters.search && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full px-3 py-1">
                  "{filters.search}"
                  <button
                    onClick={() => setFilters({ ...filters, search: "" })}
                    className="hover:text-indigo-900"
                  >
                    <X size={10} />
                  </button>
                </span>
              )}
              {filters.termId && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full px-3 py-1">
                  {terms.find((t) => t._id === filters.termId)?.name ||
                    filters.termId}
                  <button
                    onClick={() => setFilters({ ...filters, termId: "" })}
                    className="hover:text-indigo-900"
                  >
                    <X size={10} />
                  </button>
                </span>
              )}
              {filters.status && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full px-3 py-1">
                  {filters.status}
                  <button
                    onClick={() => setFilters({ ...filters, status: "" })}
                    className="hover:text-indigo-900"
                  >
                    <X size={10} />
                  </button>
                </span>
              )}
              <span className="text-[11px] text-slate-400 font-medium ml-1">
                {groupedData.length} department
                {groupedData.length !== 1 ? "s" : ""} shown
              </span>
            </div>
          )}
        </div>

        {/* ══ DEPARTMENT LIST ══════════════════════ */}
        <div className="flex flex-col gap-2.5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3 bg-white rounded-2xl border border-slate-200">
              <Loader2 size={32} className="animate-spin text-indigo-500" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Loading records…
              </p>
            </div>
          ) : groupedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4 bg-white rounded-2xl border border-slate-200">
              <div className="p-4 bg-slate-100 rounded-2xl">
                <Receipt size={28} className="text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-700 text-lg">
                  No Records Found
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Try adjusting your filters
                </p>
              </div>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            groupedData.map((dept) => {
              const isExpanded = expandedDept === dept.departmentId;
              const rate =
                dept.totalAmount > 0
                  ? Math.round((dept.collectedAmount / dept.totalAmount) * 100)
                  : 0;

              return (
                <div
                  key={dept.departmentId}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? "border-indigo-300 shadow-lg shadow-indigo-100"
                      : "border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  {/* Dept header */}
                  <div
                    onClick={() => toggleDepartment(dept.departmentId)}
                    className={`px-5 py-4 cursor-pointer select-none transition-colors ${isExpanded ? "bg-indigo-50/60" : "hover:bg-slate-50"}`}
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                      {/* Left */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all ${
                            isExpanded
                              ? "bg-indigo-600 shadow-md shadow-indigo-200"
                              : "bg-slate-100"
                          }`}
                        >
                          <Building2
                            size={17}
                            strokeWidth={2.2}
                            className={
                              isExpanded ? "text-white" : "text-slate-500"
                            }
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-extrabold text-slate-800 text-[15px]">
                              {dept.departmentName}
                            </h3>
                            <RateBadge rate={rate} />
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                              <Users size={11} className="text-slate-300" />
                              {dept.totalEnrolledStudents} students
                            </span>
                            <span className="text-slate-200">·</span>
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                              <Receipt size={11} className="text-slate-300" />
                              {dept.totalChallans} invoices
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right */}
                      <div className="flex flex-wrap xl:flex-nowrap items-center gap-4 xl:gap-5">
                        {/* Progress */}
                        <div className="hidden lg:flex flex-col gap-1.5">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                            Collection
                          </p>
                          <ProgressBar rate={rate} />
                        </div>

                        <div className="hidden lg:block w-px h-8 bg-slate-100" />

                        {/* Collected */}
                        <div className="text-right">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500 mb-0.5">
                            Collected
                          </p>
                          <p className="text-[15px] font-extrabold text-emerald-600 mono">
                            {fmtShort(dept.collectedAmount)}
                          </p>
                        </div>

                        {/* Pending */}
                        <div className="text-right">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-rose-400 mb-0.5">
                            Pending
                          </p>
                          <p className="text-[15px] font-extrabold text-rose-500 mono">
                            {fmtShort(dept.pendingAmount)}
                          </p>
                        </div>

                        <div className="w-px h-8 bg-slate-100" />

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportExcel(dept.departmentId);
                            }}
                            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shadow-sm"
                            title="Export to Excel"
                          >
                            <FileSpreadsheet size={15} />
                          </button>
                          <div
                            className={`p-2 rounded-lg border transition-all ${
                              isExpanded
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200"
                                : "bg-white border-slate-200 text-slate-400"
                            }`}
                          >
                            {isExpanded ? (
                              <ChevronUp size={15} />
                            ) : (
                              <ChevronDown size={15} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded table */}
                  {isExpanded && (
                    <div className="border-t border-indigo-100">
                      <div className="overflow-x-auto max-h-[55vh] dc-scroll overflow-y-auto">
                        <table className="w-full min-w-[920px]">
                          {/* Head */}
                          <thead className="sticky top-0 z-10">
                            <tr className="bg-slate-50 border-b border-slate-200">
                              {[
                                ["Challan Info", "left"],
                                ["Student", "left"],
                                ["Program", "left"],
                                ["Dates", "left"],
                                ["Net Amount", "right"],
                                ["Status", "center"],
                                ["", "center"],
                              ].map(([h, a]) => (
                                <th
                                  key={h}
                                  className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-${a} whitespace-nowrap`}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>

                          {/* Body */}
                          <tbody className="divide-y divide-slate-100">
                            {dept.challansList.map((challan, ri) => (
                              <tr
                                key={challan._id}
                                className={`transition-colors hover:bg-indigo-50/40 ${ri % 2 === 1 ? "bg-slate-50/40" : "bg-white"}`}
                              >
                                {/* Challan */}
                                <td className="px-5 py-3.5">
                                  <p className="mono font-semibold text-indigo-600 text-xs tracking-wide">
                                    #{challan.challanNo}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide font-medium">
                                    {challan.challanType?.replace(/_/g, " ")}
                                  </p>
                                </td>

                                {/* Student */}
                                <td className="px-5 py-3.5">
                                  <p
                                    className="font-bold text-slate-800 text-sm truncate max-w-[190px]"
                                    title={challan.studentName}
                                  >
                                    {challan.studentName}
                                  </p>
                                  {challan.fatherName && (
                                    <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[190px]">
                                      <span className="text-slate-300 mr-1">
                                        S/D of
                                      </span>
                                      {challan.fatherName}
                                    </p>
                                  )}
                                  <p className="mono text-[10px] text-slate-400 mt-0.5">
                                    {challan.studentRollNo}
                                  </p>
                                </td>

                                {/* Program */}
                                <td className="px-5 py-3.5">
                                  <p
                                    className="text-xs font-medium text-slate-500 truncate max-w-[160px]"
                                    title={challan.programName}
                                  >
                                    {challan.programName}
                                  </p>
                                </td>

                                {/* Dates */}
                                <td className="px-5 py-3.5">
                                  <p className="text-[11px] text-slate-500 font-medium">
                                    <span className="text-[9px] font-black text-slate-400 uppercase mr-1.5">
                                      Iss
                                    </span>
                                    {new Date(
                                      challan.createdAt,
                                    ).toLocaleDateString("en-GB")}
                                  </p>
                                  <p className="text-[11px] text-rose-400 font-semibold mt-1">
                                    <span className="text-[9px] font-black text-rose-300 uppercase mr-1.5">
                                      Due
                                    </span>
                                    {new Date(
                                      challan.dueDate,
                                    ).toLocaleDateString("en-GB")}
                                  </p>
                                </td>

                                {/* Amount */}
                                <td className="px-5 py-3.5 text-right">
                                  <span className="mono font-bold text-slate-700 text-xs bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                                    {fmt(challan.netAmount)}
                                  </span>
                                  {challan.paidAmount > 0 &&
                                    challan.paidAmount < challan.netAmount && (
                                      <p className="text-[10px] text-emerald-500 font-medium mt-1">
                                        Paid: {fmt(challan.paidAmount)}
                                      </p>
                                    )}
                                </td>

                                {/* Status */}
                                <td className="px-5 py-3.5 text-center">
                                  <StatusBadge status={challan.status} />
                                </td>

                                {/* Action */}
                                <td className="px-5 py-3.5 text-center">
                                  <button
                                    onClick={() =>
                                      handleDownloadChallan(challan._id)
                                    }
                                    className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-lg transition-all shadow-sm"
                                    title="Print Challan"
                                  >
                                    <Printer size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Table footer */}
                      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-slate-50 border-t border-slate-200">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                          {dept.challansList.length} records ·{" "}
                          {dept.departmentName}
                        </p>
                        <div className="flex items-center gap-5 text-[11px] font-bold">
                          <span className="text-emerald-600">
                            Collected: {fmt(dept.collectedAmount)}
                          </span>
                          <span className="text-rose-500">
                            Pending: {fmt(dept.pendingAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
};

export default DepartmentChallanView;
