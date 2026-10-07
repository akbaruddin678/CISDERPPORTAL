import React, { useState, useEffect, useRef } from "react";
import {
  BarChart3,
  Download,
  Filter,
  FileText,
  Printer,
  TrendingUp,
  CreditCard,
  AlertCircle,
  RefreshCcw,
  Loader2,
  PieChart as PieIcon,
  Maximize2,
  ArrowLeft,
  LayoutDashboard,
  TableProperties,
  ChevronDown,
  Calendar,
  Check,
  X,
  Building2,
  GraduationCap,
} from "lucide-react";
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

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

// --- Sub-Components ---
const SummaryCard = ({ label, value, icon: Icon, colorClass, bgClass }) => (
  <div
    className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg group cursor-default ${bgClass}`}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          {label}
        </p>
        <p className={`text-2xl font-bold ${colorClass} tracking-tight`}>
          {value}
        </p>
      </div>
      <div
        className={`p-3 rounded-xl ${bgClass} group-hover:scale-110 transition-transform ${colorClass}`}
      >
        <Icon size={20} strokeWidth={2} />
      </div>
    </div>
  </div>
);

const FilterChip = ({ label, value, onClear }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all bg-indigo-100 text-indigo-700 border border-indigo-200">
    <span className="font-semibold">{label}:</span>
    <span className="max-w-[200px] truncate">{value}</span>
    {onClear && (
      <button
        onClick={onClear}
        className="ml-1 hover:bg-white rounded-full p-0.5 transition-colors flex items-center justify-center"
      >
        <X size={12} />
      </button>
    )}
  </div>
);

const ActionBar = ({
  onExportExcel,
  onExportPDF,
  onPrint,
  onFullscreen,
  isLoading,
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <button
      onClick={onExportExcel}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 disabled:opacity-50 transition-colors font-semibold text-sm hover:shadow-sm"
    >
      <Download size={16} /> <span className="hidden sm:inline">Excel</span>
    </button>
    <button
      onClick={onExportPDF}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100 disabled:opacity-50 transition-colors font-semibold text-sm hover:shadow-sm"
    >
      <FileText size={16} /> <span className="hidden sm:inline">PDF</span>
    </button>
    <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
    {onFullscreen && (
      <button
        onClick={onFullscreen}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-200 disabled:opacity-50 transition-colors font-semibold text-sm hover:shadow-sm"
      >
        <Maximize2 size={16} /> <span className="hidden sm:inline">Expand</span>
      </button>
    )}
    <button
      onClick={onPrint}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors font-semibold text-sm shadow-md"
    >
      <Printer size={16} /> <span className="hidden sm:inline">Print</span>
    </button>
  </div>
);

// ✅ Custom Multi-Select Dropdown Component
const MultiSelectDropdown = ({
  options,
  selectedValues,
  onChange,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const currentSelected = Array.isArray(selectedValues)
    ? selectedValues
    : selectedValues
      ? [selectedValues]
      : [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (val) => {
    if (currentSelected.includes(val)) {
      onChange(currentSelected.filter((v) => v !== val));
    } else {
      onChange([...currentSelected, val]);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <div
        className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 text-sm font-bold rounded-xl cursor-pointer hover:bg-slate-100 transition-all min-w-[200px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-slate-700 truncate mr-2">
          {currentSelected.length === 0
            ? placeholder
            : currentSelected.length === 1
              ? options?.find((o) => o.value === currentSelected[0])?.label ||
                placeholder
              : `${currentSelected.length} Categories Selected`}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[240px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="max-h-60 overflow-y-auto p-1.5 flex flex-col gap-1">
            {options?.map((opt) => {
              const isSelected = currentSelected.includes(opt.value);
              return (
                <div
                  key={opt.value}
                  onClick={() => toggleOption(opt.value)}
                  className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                  {isSelected && (
                    <Check
                      size={14}
                      className="text-indigo-600 shrink-0 ml-2"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================
// VIEW 1: ANALYTICS GRAPHS
// =========================================================
const AnalyticsDashboard = ({ summary, reportData, isLoading }) => {
  const overallRecovery =
    summary.totalReceivable > 0
      ? Math.round((summary.totalRevenue / summary.totalReceivable) * 100)
      : 0;

  const barData = reportData.map((row) => ({
    name: row.name || row.number || "Unknown",
    Generated: row.totalGenerated || 0,
    Collected: row.totalCollected || 0,
  }));

  const pieData = [
    { name: "Collected", value: summary.totalRevenue, color: "#10B981" },
    { name: "Pending", value: summary.totalPending, color: "#F43F5E" },
  ].filter((d) => d.value > 0);

  if (isLoading)
    return (
      <div className="p-20 text-center text-slate-400">
        <Loader2 className="animate-spin mx-auto mb-4" size={32} /> Loading
        Analytics...
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Receivable"
          value={formatCurrency(summary.totalReceivable)}
          icon={CreditCard}
          colorClass="text-slate-700"
          bgClass="bg-white border-slate-200"
        />
        <SummaryCard
          label="Total Collected"
          value={formatCurrency(summary.totalRevenue)}
          icon={TrendingUp}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50 border-emerald-200"
        />
        <SummaryCard
          label="Amount Pending"
          value={formatCurrency(summary.totalPending)}
          icon={AlertCircle}
          colorClass="text-rose-600"
          bgClass="bg-rose-50 border-rose-200"
        />
        <SummaryCard
          label="Recovery Rate"
          value={`${overallRecovery}%`}
          icon={PieIcon}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50 border-indigo-200"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 mb-6">
            Revenue Breakdown
          </h3>
          <div className="flex-1 min-h-[300px]">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E2E8F0"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748B" }}
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
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar
                    dataKey="Generated"
                    fill="#818CF8"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                  <Bar
                    dataKey="Collected"
                    fill="#34D399"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-center mt-20">
                No graphical data available.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-sm font-bold text-slate-900 w-full mb-2">
            Recovery Status
          </h3>
          <div className="w-full h-[300px] relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={70}
                    outerRadius={100}
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
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-center mt-20">No data</p>
            )}
            {pieData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Collected
                </span>
                <span className="text-3xl font-black text-slate-800">
                  {overallRecovery}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// VIEW 2: DATA TABLE
// =========================================================
const DataTable = ({ reportData, summary, isLoading }) => {
  const overallRecovery =
    summary.totalReceivable > 0
      ? Math.round((summary.totalRevenue / summary.totalReceivable) * 100)
      : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-500 min-h-[500px]">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[900px]">
          <thead className="bg-slate-900 text-white sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-center">
                Invoices
              </th>
              <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-center">
                Status
              </th>
              <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">
                Generated
              </th>
              <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">
                Collected
              </th>
              <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">
                Pending
              </th>
              <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-center">
                Recovery
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-16 text-center text-slate-400"
                >
                  <Loader2 className="animate-spin mx-auto mb-2" size={24} />{" "}
                  Loading...
                </td>
              </tr>
            ) : reportData.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-16 text-center text-slate-400"
                >
                  <FileText size={32} className="mx-auto mb-2 opacity-30" /> No
                  Data Found
                </td>
              </tr>
            ) : (
              reportData.map((row, idx) => {
                const recoveryRate =
                  row.totalGenerated > 0
                    ? ((row.totalCollected / row.totalGenerated) * 100).toFixed(
                        1,
                      )
                    : 0;
                const isExcellent = recoveryRate >= 85;
                const isWarning = recoveryRate < 70;

                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {row.name || row.number || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg font-semibold text-slate-700 text-xs">
                        {row.totalChallans}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-emerald-600">
                            {row.paidCount}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            paid
                          </span>
                        </div>
                        <div className="w-px h-4 bg-slate-200"></div>
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-rose-600">
                            {row.unpaidCount}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            unpaid
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-600">
                      {formatCurrency(row.totalGenerated)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">
                      {formatCurrency(row.totalCollected)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-rose-600">
                      {formatCurrency(row.totalPending)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span
                          className={`text-xs font-bold ${isExcellent ? "text-emerald-600" : isWarning ? "text-amber-600" : "text-blue-600"}`}
                        >
                          {recoveryRate}%
                        </span>
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isExcellent ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-blue-500"}`}
                            style={{ width: `${Math.min(recoveryRate, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {!isLoading && reportData.length > 0 && (
            <tfoot className="bg-slate-900 text-white sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <tr>
                <td className="px-6 py-4 font-bold text-xs uppercase tracking-wider">
                  Grand Total
                </td>
                <td className="px-6 py-4 text-center font-bold">
                  {reportData.reduce(
                    (sum, item) => sum + item.totalChallans,
                    0,
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-emerald-400 font-bold">
                      {reportData.reduce(
                        (sum, item) => sum + item.paidCount,
                        0,
                      )}
                    </span>
                    <span className="text-slate-500">/</span>
                    <span className="text-rose-400 font-bold">
                      {reportData.reduce(
                        (sum, item) => sum + item.unpaidCount,
                        0,
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-mono font-bold text-slate-300">
                  {formatCurrency(summary.totalReceivable)}
                </td>
                <td className="px-6 py-4 text-right font-mono font-black text-emerald-400 text-[13px]">
                  {formatCurrency(summary.totalRevenue)}
                </td>
                <td className="px-6 py-4 text-right font-mono font-bold text-rose-400">
                  {formatCurrency(summary.totalPending)}
                </td>
                <td className="px-6 py-4 text-center font-bold text-indigo-400">
                  {overallRecovery}%
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

// =========================================================
// MAIN VIEW COMPONENT
// =========================================================
const ReportGenerationView = ({
  filters,
  setFilters,
  reportData,
  summary,
  terms,
  feeCategoryOptions,
  monthOptions,
  isLoading,
  onExportExcel,
  onExportPDF,
  onPrint,
  onResetFilters,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState("analytics");

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col animate-in fade-in duration-300">
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
          <button
            onClick={() => setIsFullscreen(false)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Exit Full Screen
          </button>
          <h2 className="text-lg font-bold text-slate-900 hidden md:block">
            Financial Report - Full View
          </h2>
          <ActionBar
            onExportExcel={onExportExcel}
            onExportPDF={onExportPDF}
            onPrint={onPrint}
            isLoading={isLoading}
          />
        </div>
        <div className="flex-1 overflow-hidden p-6 flex flex-col">
          {activeTab === "analytics" ? (
            <AnalyticsDashboard
              summary={summary}
              reportData={reportData}
              isLoading={isLoading}
            />
          ) : (
            <DataTable
              reportData={reportData}
              summary={summary}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-600">
      <style>{`@media print { @page { size: A4 landscape; margin: 8mm; } body { background-color: white !important; } .no-print { display: none !important; } * { box-shadow: none !important; } }`}</style>
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4 no-print animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hidden sm:flex items-center justify-center">
                <BarChart3 size={24} strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                Financial Reports
              </h1>
            </div>
            <p className="text-slate-500 font-medium text-sm sm:text-base max-w-xl">
              Analyze, print, and export comprehensive fee collections and
              recovery metrics.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl no-print">
              <button
                onClick={() => setFilters({ ...filters, scope: "university" })}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all ${
                  (filters.scope || "university") === "university"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Building2 size={15} /> University
              </button>
              <button
                onClick={() => setFilters({ ...filters, scope: "college" })}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all ${
                  filters.scope === "college"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <GraduationCap size={15} /> College
              </button>
            </div>
            <ActionBar
              onExportExcel={onExportExcel}
              onExportPDF={onExportPDF}
              onPrint={onPrint}
              onFullscreen={() => setIsFullscreen(true)}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 no-print animate-in fade-in slide-in-from-top-4 duration-500 delay-100 flex flex-col xl:flex-row xl:items-center gap-4">
          <div className="flex items-center gap-2 px-2 border-r border-slate-100 shrink-0">
            <Filter size={16} className="text-indigo-600" />
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
              Filters
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full">
            <select
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-sm font-bold rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-slate-700 cursor-pointer transition-all"
              value={filters.reportType}
              onChange={(e) =>
                setFilters({ ...filters, reportType: e.target.value })
              }
            >
              <option value="program">Program Wise</option>
              <option value="session">Session Wise</option>
              <option value="department">Department Wise</option>
            </select>

            <MultiSelectDropdown
              options={feeCategoryOptions}
              selectedValues={filters.category}
              onChange={(newCategories) =>
                setFilters({ ...filters, category: newCategories })
              }
              placeholder="All Categories"
            />

            <select
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-sm font-bold rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-slate-700 cursor-pointer transition-all"
              value={filters.termId}
              onChange={(e) =>
                setFilters({ ...filters, termId: e.target.value })
              }
            >
              <option value="">All Sessions</option>
              {terms.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* MONTH FILTER */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Calendar size={16} />
              </div>
              <select
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 text-sm font-bold rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-slate-700 cursor-pointer transition-all appearance-none"
                value={filters.month}
                onChange={(e) =>
                  setFilters({ ...filters, month: e.target.value })
                }
              >
                <option value="">All Months</option>
                {monthOptions?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            <button
              onClick={onResetFilters}
              className="p-2.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors ml-auto"
              title="Reset Filters"
            >
              <RefreshCcw size={16} />
            </button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(filters.category?.length > 0 || filters.termId || filters.month) && (
          <div className="flex flex-wrap gap-2 px-1">
            {filters.category?.length > 0 && (
              <FilterChip
                label="Category"
                value={filters.category
                  .map(
                    (c) =>
                      feeCategoryOptions?.find((o) => o.value === c)?.label ||
                      c,
                  )
                  .filter(Boolean)
                  .join(", ")}
                onClear={() => setFilters({ ...filters, category: [] })}
              />
            )}
            {filters.termId && (
              <FilterChip
                label="Session"
                value={terms.find((t) => t._id === filters.termId)?.name}
                onClear={() => setFilters({ ...filters, termId: "" })}
              />
            )}
            {filters.month && (
              <FilterChip
                label="Month"
                value={
                  monthOptions.find((m) => m.value === filters.month)?.label
                }
                onClear={() => setFilters({ ...filters, month: "" })}
              />
            )}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 no-print border-b border-slate-200 bg-white rounded-t-2xl px-2 pt-2">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2.5 px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === "analytics" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            <LayoutDashboard size={16} /> Analytics Dashboard
          </button>
          <button
            onClick={() => setActiveTab("table")}
            className={`flex items-center gap-2.5 px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === "table" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            <TableProperties size={16} /> Detailed Ledger Table
          </button>
        </div>

        {/* Main Content Area */}
        <div className="print-container">
          {activeTab === "analytics" ? (
            <AnalyticsDashboard
              summary={summary}
              reportData={reportData}
              isLoading={isLoading}
            />
          ) : (
            <DataTable
              reportData={reportData}
              summary={summary}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportGenerationView;
