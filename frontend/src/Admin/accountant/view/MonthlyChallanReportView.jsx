import { useState } from "react";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  X,
  Wallet,
  Receipt,
} from "lucide-react";
import { CircularProgress } from "@mui/material";

const STATUS_CONFIG = {
  paid: {
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Paid",
  },
  issued: {
    dot: "bg-blue-500",
    pill: "bg-blue-50 text-blue-700 border-blue-200",
    label: "Issued",
  },
  overdue: {
    dot: "bg-rose-500",
    pill: "bg-rose-50 text-rose-700 border-rose-200",
    label: "Overdue",
  },
  partial: {
    dot: "bg-amber-500",
    pill: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Partial",
  },
};

// Tailwind's build-time class scanner needs literal class names in the
// source — `text-${align}` would never get generated in the production
// bundle, so this maps to the full literal strings instead.
const ALIGN_CLASS = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

const fmtCurrency = (val) =>
  `Rs ${Number(val || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status?.toLowerCase()] || {
    dot: "bg-slate-400",
    pill: "bg-slate-50 text-slate-500 border-slate-200",
    label: status || "—",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${cfg.pill}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const Select = ({ value, onChange, children, className = "" }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="appearance-none w-full pl-3 pr-7 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-200"
    >
      {children}
    </select>
    <ChevronDown
      size={13}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
    />
  </div>
);

const SummaryCard = ({ label, value, sub, icon, accent, bg }) => (
  <div className="bg-white rounded-xl border border-slate-100 p-4">
    <div className="flex items-center gap-2 mb-2.5">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: bg, color: accent }}
      >
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </span>
    </div>
    <div className="text-lg font-bold text-slate-900 leading-tight mb-0.5">
      {value}
    </div>
    <div className="text-[11px] text-slate-400">{sub}</div>
  </div>
);

const MonthlyChallanReportView = (props) => {
  const {
    selectedMonth,
    selectedYear,
    handleMonthChange,
    handleYearChange,
    yearOptions,
    monthOptions,

    filters,
    handleFilterChange,
    clearFilters,
    hasActiveFilters,
    programOptions,
    sessionOptions,
    departmentOptions,
    semesterOptions,
    categoryOptions,

    summary,
    details,
    period,
    isLoading,
    refetch,
    handleExportExcel,
    handleExportPDF,
  } = props;

  const [exportOpen, setExportOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const totalDeductions =
    (summary?.totalDiscounts || 0) + (summary?.totalScholarships || 0);
  const collectionRate = summary?.totalGeneratedAmount
    ? Math.round(
        ((summary.totalCollectedAmount || 0) / summary.totalGeneratedAmount) *
          100,
      )
    : 0;

  const summaryCards = [
    {
      label: "Base Fees",
      value: fmtCurrency(summary?.totalOriginalAmount),
      sub: `${summary?.totalChallans || 0} challan${summary?.totalChallans === 1 ? "" : "s"}`,
      icon: <DollarSign size={14} />,
      accent: "#3b82f6",
      bg: "#eff6ff",
    },
    {
      label: "Fines & Arrears",
      value: fmtCurrency(summary?.totalFines),
      sub: "Late fees applied",
      icon: <AlertCircle size={14} />,
      accent: "#f59e0b",
      bg: "#fffbeb",
    },
    {
      label: "Schol. & Discounts",
      value: fmtCurrency(totalDeductions),
      sub: "Total deductions",
      icon: <TrendingDown size={14} />,
      accent: "#8b5cf6",
      bg: "#f5f3ff",
    },
    {
      label: "Net Generated",
      value: fmtCurrency(summary?.totalGeneratedAmount),
      sub: "Total payable",
      icon: <Receipt size={14} />,
      accent: "#6366f1",
      bg: "#eef2ff",
    },
    {
      label: "Collected",
      value: fmtCurrency(summary?.totalCollectedAmount),
      sub: `${collectionRate}% collection rate`,
      icon: <TrendingUp size={14} />,
      accent: "#10b981",
      bg: "#ecfdf5",
    },
    {
      label: "Pending",
      value: fmtCurrency(summary?.totalPendingAmount),
      sub: "Outstanding dues",
      icon: <Wallet size={14} />,
      accent: "#f43f5e",
      bg: "#fff1f2",
    },
  ];

  // Filters recompute the underlying data (see controller), so pagination
  // must reset whenever the filtered result set changes shape, or an
  // admin could land on a now-empty page 4 of a 1-row result.
  const totalPages = Math.max(1, Math.ceil((details?.length || 0) / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedDetails = (details || []).slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const activeFilterCount = Object.entries(filters || {}).filter(
    ([key, val]) => val !== "all" && val !== "" && key !== "dateField",
  ).length;

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-4">
      {/* ── HEADER ── */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 md:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <Calendar size={18} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800">
              Monthly Finance Report
            </h1>
            <p className="text-xs text-slate-400">
              Showing data for{" "}
              <span className="font-semibold text-slate-600">
                {period?.monthName} {period?.year}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedMonth} onChange={handleMonthChange}>
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Select value={selectedYear} onChange={handleYearChange}>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          <button
            onClick={refetch}
            title="Refresh"
            className="w-[34px] h-[34px] rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <RefreshCw
              size={14}
              className={`text-indigo-600 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              disabled={!details || details.length === 0 || isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              <Download size={13} /> Export <ChevronDown size={12} />
            </button>
            {exportOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setExportOpen(false)}
                />
                <div className="absolute top-[calc(100%+6px)] right-0 bg-white border border-slate-100 rounded-xl shadow-lg z-50 min-w-[170px] overflow-hidden py-1">
                  {[
                    {
                      icon: (
                        <FileSpreadsheet size={14} className="text-emerald-600" />
                      ),
                      label: "Export to Excel",
                      action: handleExportExcel,
                    },
                    {
                      icon: <FileText size={14} className="text-rose-600" />,
                      label: "Export to PDF",
                      action: handleExportPDF,
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        item.action();
                        setExportOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 text-left"
                    >
                      {item.icon} {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── SUMMARY CARDS — reflect the CURRENT filters, not the whole month ── */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      {/* ── FILTER BAR ── */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="px-4 md:px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Filter size={14} className="text-indigo-600" />
            <span className="text-xs font-bold text-slate-700">Filters</span>
            {activeFilterCount > 0 && (
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {activeFilterCount} active
              </span>
            )}
          </div>

          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Search student, reg no, challan no..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <span className="ml-auto text-[11px] font-bold text-slate-400">
            {details?.length || 0} result{details?.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="px-4 md:px-5 py-3.5 flex flex-wrap items-center gap-2">
          <Select
            value={filters.dateField}
            onChange={(e) => handleFilterChange("dateField", e.target.value)}
            className="w-[140px]"
          >
            <option value="all">No Date Filter</option>
            <option value="dueDate">Due Date</option>
            <option value="paidAt">Paid Date</option>
            <option value="generatedOn">Issue Date</option>
          </Select>

          {filters.dateField !== "all" && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs outline-none cursor-pointer focus:ring-2 focus:ring-indigo-200"
              />
              <span className="text-slate-300 font-bold">–</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs outline-none cursor-pointer focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          )}

          <Select
            value={filters.department}
            onChange={(e) => handleFilterChange("department", e.target.value)}
            className="w-[150px]"
          >
            <option value="all">All Departments</option>
            {departmentOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>

          <Select
            value={filters.program}
            onChange={(e) => handleFilterChange("program", e.target.value)}
            className="w-[150px]"
          >
            <option value="all">All Programs</option>
            {programOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>

          <Select
            value={filters.semester}
            onChange={(e) => handleFilterChange("semester", e.target.value)}
            className="w-[130px]"
          >
            <option value="all">All Semesters</option>
            {semesterOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>

          <Select
            value={filters.session}
            onChange={(e) => handleFilterChange("session", e.target.value)}
            className="w-[130px]"
          >
            <option value="all">All Sessions</option>
            {sessionOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>

          <Select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="w-[130px]"
          >
            <option value="all">All Categories</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>

          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="w-[130px]"
          >
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </Select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-colors"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-60">
              <CircularProgress size={30} sx={{ color: "#6366f1" }} />
            </div>
          ) : !details || details.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-slate-400 gap-2">
              <Calendar size={36} className="opacity-20" />
              <p className="text-sm font-semibold text-slate-500">
                {hasActiveFilters
                  ? "No records match current filters"
                  : `No challans for ${period?.monthName || ""} ${period?.year || ""}`}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 sticky top-0 z-10">
                  {[
                    { h: "Challan No", align: "left" },
                    { h: "Student", align: "left" },
                    { h: "Father Name", align: "left" },
                    { h: "Program/Dept", align: "left" },
                    { h: "Session/Sem", align: "left" },
                    { h: "Type", align: "left" },
                    { h: "Base Fee", align: "right" },
                    { h: "Prev. Paid", align: "right" },
                    { h: "Deductions", align: "right" },
                    { h: "Fines/Arrears", align: "right" },
                    { h: "Net Amount", align: "right" },
                    { h: "Paid", align: "right" },
                    { h: "Balance", align: "right" },
                    { h: "Dates", align: "left" },
                    { h: "Status", align: "center" },
                  ].map(({ h, align }) => (
                    <th
                      key={h}
                      className={`px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 border-b border-slate-100 whitespace-nowrap ${ALIGN_CLASS[align]}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedDetails.map((row, i) => (
                  <tr
                    key={row.id || i}
                    className="border-b border-slate-50 hover:bg-indigo-50/40 transition-colors odd:bg-white even:bg-slate-50/40"
                  >
                    <td className="px-3.5 py-2.5 font-mono font-bold text-indigo-600 whitespace-nowrap">
                      {row.challanNo}
                    </td>
                    <td className="px-3.5 py-2.5 min-w-[140px]">
                      <div className="font-semibold text-slate-800">
                        {row.studentName}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {row.studentRegNo}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 font-semibold text-slate-700">
                      {row.fatherName}
                    </td>
                    <td className="px-3.5 py-2.5 min-w-[130px]">
                      <div className="text-slate-600 font-medium">
                        {row.program || "-"}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {row.department || "-"}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 min-w-[100px]">
                      <div className="text-slate-600">{row.session || "-"}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {row.semester || "-"}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-600 font-medium capitalize whitespace-nowrap">
                      {row.displayType || row.type}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-slate-600 whitespace-nowrap">
                      {fmtCurrency(row.originalAmount)}
                    </td>
                    <td
                      className="px-3.5 py-2.5 text-right font-mono font-semibold text-slate-700 whitespace-nowrap"
                      title={`Historically paid for ${row.type}`}
                    >
                      {fmtCurrency(row.historicalPaidAmount)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-violet-600 whitespace-nowrap">
                      {fmtCurrency(
                        (row.scholarshipAmount || 0) + (row.discountAmount || 0),
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-amber-600 whitespace-nowrap">
                      {fmtCurrency((row.fineAmount || 0) + (row.arrears || 0))}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {fmtCurrency(row.netAmount)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                      {fmtCurrency(row.paidAmount)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                      {fmtCurrency(row.balance)}
                    </td>
                    <td className="px-3.5 py-2.5 min-w-[110px]">
                      <div className="text-slate-500 flex items-center gap-1">
                        <span className="text-[9px] uppercase text-slate-400 font-bold">
                          Due:
                        </span>
                        {fmtDate(row.dueDate)}
                      </div>
                      <div className="text-emerald-600 flex items-center gap-1 mt-0.5">
                        <span className="text-[9px] uppercase text-slate-400 font-bold">
                          Paid:
                        </span>
                        {row.paidAt ? fmtDate(row.paidAt) : "-"}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-center">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {details && details.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 md:px-5 py-3 border-t border-slate-100 bg-slate-50/60 text-[11px] text-slate-500">
            <span>
              Page {safePage} of {totalPages} — {details.length} total
              result{details.length === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyChallanReportView;
