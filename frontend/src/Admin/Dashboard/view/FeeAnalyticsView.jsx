import React, { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  Loader2,
  Lock,
  FileDown,
  ShieldAlert,
  Landmark,
  Clock,
  TrendingUp,
  CalendarDays,
  Building2,
  Filter,
  RefreshCw,
  X,
  Maximize2,
  Minimize2,
  AlertCircle,
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

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e"];

export const FeeAnalyticsView = ({
  filters,
  handleFilterChange,
  departments,
  programs,
  terms,
  semesters,
  data,
  isLoading,
  isFetching,
  isReportModalOpen,
  setIsReportModalOpen,
  handleGenerateReport,
  isLocking,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedWidget, setExpandedWidget] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getDisplayMonth = (monthValue) => {
    if (!monthValue) return "the selected period";
    const [y, m] = monthValue.split("-");
    const d = new Date(y, parseInt(m) - 1);
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const totalExpectedRevenue = data?.kpis?.totalExpected || 0;
  const totalCollected = data?.kpis?.totalCollected || 0;
  const totalPending = data?.kpis?.totalPending || 0;
  const totalOverdue = data?.kpis?.totalOverdue || 0;
  const collectionRate = data?.kpis?.collectionRate || 0;

  const hasActiveFilters =
    filters.departmentId !== "ALL" ||
    filters.programId !== "ALL" ||
    filters.termId !== "ALL" ||
    filters.semesterId !== "ALL";

  const getObjId = (obj, field) => {
    if (!obj || !obj[field]) return null;
    return typeof obj[field] === "object" ? obj[field]._id : obj[field];
  };

  const filteredPrograms = useMemo(() => {
    if (filters.departmentId === "ALL") return programs;
    return programs.filter(
      (p) =>
        getObjId(p, "departmentId") === filters.departmentId ||
        getObjId(p, "department") === filters.departmentId,
    );
  }, [programs, filters.departmentId]);

  const filteredSemesters = useMemo(() => {
    if (filters.programId === "ALL") return semesters;
    return semesters.filter(
      (s) =>
        getObjId(s, "programId") === filters.programId ||
        getObjId(s, "program") === filters.programId,
    );
  }, [semesters, filters.programId]);

  const getSelectedDepartmentName = () => {
    if (filters.departmentId === "ALL") return "All Departments";
    const dept = departments.find((d) => (d._id || d.code) === filters.departmentId);
    return dept ? (dept.name || dept.code) : "All Departments";
  };

  const getSelectedProgramName = () => {
    if (filters.programId === "ALL") return "All Programs";
    const prog = programs.find((p) => (p._id || p.code) === filters.programId);
    return prog ? (prog.name || prog.code) : "All Programs";
  };

  // --- WIDGET RENDERERS ---

  const renderTable = () => (
    <div className="overflow-auto h-full custom-scrollbar pr-1">
      <table className="w-full text-left text-sm border-collapse min-w-[450px]">
        <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm">
          <tr>
            <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
              Class
            </th>
            <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 text-right">
              Expected
            </th>
            <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 text-right">
              Collected
            </th>
            <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 text-right">
              Pending
            </th>
            <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 text-center">
              Rate
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.departmentData?.length > 0 ? (
            data.departmentData.map((dept, index) => {
              const total = (dept.collected || 0) + (dept.pending || 0);
              const rate =
                total > 0 ? Math.round((dept.collected / total) * 100) : 0;
              return (
                <tr
                  key={index}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="px-3 py-2.5 font-medium text-slate-700 flex items-center gap-2 whitespace-nowrap text-[13px]">
                    <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                      <Building2 size={10} />
                    </div>
                    {dept.department || "Unknown"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-600 whitespace-nowrap text-[13px]">
                    ₨ {formatCurrency(total)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-emerald-600 whitespace-nowrap text-[13px]">
                    ₨ {formatCurrency(dept.collected)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-amber-500 whitespace-nowrap text-[13px]">
                    ₨ {formatCurrency(dept.pending)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex justify-center">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide ${rate >= 80 ? "bg-emerald-50 text-emerald-600" : rate >= 50 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"}`}
                      >
                        {rate}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan="5"
                className="px-4 py-8 text-center text-slate-400 font-medium text-[13px]"
              >
                No departmental data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderStatusOverview = () => (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data.statusData}
          innerRadius="60%"
          outerRadius="80%"
          paddingAngle={4}
          dataKey="value"
          stroke="none"
          isAnimationActive={false}
        >
          {data.statusData?.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <RechartsTooltip
          formatter={(value) => `₨ ${formatCurrency(value)}`}
          contentStyle={{
            borderRadius: "10px",
            border: "none",
            boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
            fontSize: "12px",
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={24}
          iconType="circle"
          wrapperStyle={{
            fontSize: "11px",
            fontWeight: "600",
            color: "#64748b",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderDepartmentBar = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data.departmentData}
        margin={{ top: 10, right: 10, left: 35, bottom: 60 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#f1f5f9"
        />
        <XAxis
          dataKey="department"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "#64748b", fontWeight: "600" }}
          angle={-35}
          textAnchor="end"
          height={70}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: "600" }}
          tickFormatter={(val) => `₨ ${formatCurrency(val)}`}
          width={90}
        />
        <RechartsTooltip
          formatter={(value) => `₨ ${formatCurrency(value)}`}
          cursor={{ fill: "#f8fafc" }}
          contentStyle={{
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            fontSize: "12px",
          }}
        />
        <Legend
          verticalAlign="top"
          height={24}
          iconType="circle"
          wrapperStyle={{ fontSize: "11px", fontWeight: "600" }}
        />
        <Bar
          dataKey="collected"
          name="Collected"
          fill="#10b981"
          radius={[3, 3, 0, 0]}
          maxBarSize={24}
          isAnimationActive={false}
        />
        <Bar
          dataKey="pending"
          name="Pending"
          fill="#f59e0b"
          radius={[3, 3, 0, 0]}
          maxBarSize={24}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderSemesterChart = () => {
    // ✅ FIXED: Merge duplicate semesters dynamically
    const aggregatedSemesters = Object.values(
      (data.semesterData || []).reduce((acc, curr) => {
        let semName = curr.semester;
        if (!semName || semName === "Semester Unknown" || semName === "Unknown") {
          semName = "Other";
        }
        
        if (!acc[semName]) {
          acc[semName] = { semester: semName, collected: 0, pending: 0 };
        }
        
        acc[semName].collected += (curr.collected || 0);
        acc[semName].pending += (curr.pending || 0);
        return acc;
      }, {})
    ).sort((a, b) => {
      if (a.semester === 'Other') return 1;
      if (b.semester === 'Other') return -1;
      return a.semester.localeCompare(b.semester);
    });

    const CustomSemesterTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        const isAllDepts = filters.departmentId === "ALL";
        const isAllProgs = filters.programId === "ALL";

        return (
          <div className="bg-white p-3 border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] rounded-xl min-w-[200px]">
            <p className="font-bold text-slate-800 text-[13px] mb-2 border-b border-slate-100 pb-2">
              {label}
            </p>
            <div className="flex flex-col gap-2 text-[12px]">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500 font-medium">Collected:</span>
                <span className="font-bold text-rose-600">₨ {formatCurrency(payload[0].value)}</span>
              </div>
              
              {/* ✅ FIXED: Only show Department & Program context if they are specifically filtered */}
              {(!isAllDepts || !isAllProgs) && (
                <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-slate-50">
                  {!isAllDepts && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400 font-medium">Class:</span>
                      <span className="font-semibold text-slate-600 text-right truncate max-w-[120px]">{getSelectedDepartmentName()}</span>
                    </div>
                  )}
                  {!isAllProgs && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400 font-medium">Program:</span>
                      <span className="font-semibold text-slate-600 text-right truncate max-w-[120px]">{getSelectedProgramName()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Inform user if this is an aggregated view */}
              {(isAllDepts && isAllProgs) && (
                <div className="mt-1 pt-2 border-t border-slate-50 text-slate-400 text-[10px] text-center italic">
                  Aggregated across all programs
                </div>
              )}
            </div>
          </div>
        );
      }
      return null;
    };

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={aggregatedSemesters}
          layout="vertical"
          margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="#f1f5f9"
          />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: "600" }}
            tickFormatter={(val) => `₨ ${formatCurrency(val)}`}
          />
          <YAxis
            dataKey="semester"
            type="category"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#64748b", fontWeight: "600" }}
            width={70}
          />
          <RechartsTooltip cursor={{ fill: "#f8fafc" }} content={<CustomSemesterTooltip />} />
          <Bar
            dataKey="collected"
            fill="#6366f1"
            radius={[0, 4, 4, 0]}
            barSize={20}
            isAnimationActive={false}
            activeBar={{ fill: '#ef4444' }}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const MiniKPICard = ({
    title,
    value,
    icon: Icon,
    colorClass,
    bgClass,
    borderClass,
  }) => (
    <div
      className={`p-4 rounded-2xl flex flex-col justify-center border transition-all shadow-sm ${bgClass} ${borderClass}`}
    >
      <div className="flex justify-between items-start mb-1">
        <p
          className={`text-[11px] font-bold uppercase tracking-wider ${colorClass}`}
        >
          {title}
        </p>
        <Icon size={16} className={`${colorClass} opacity-80`} />
      </div>
      <p
        className={`text-xl lg:text-2xl font-black text-slate-800 tracking-tight`}
      >
        {title === "Recovery Rate" ? (
          `${value}%`
        ) : (
          <>
            <span className="text-sm font-semibold opacity-60 mr-1">₨</span>
            {formatCurrency(value)}
          </>
        )}
      </p>
    </div>
  );

  const DashboardCard = ({ id, title, children, className }) => (
    <div
      className={`bg-white rounded-3xl border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col group relative overflow-hidden transition-all ${className}`}
    >
      <div className="px-5 py-3.5 flex justify-between items-center bg-white z-10 flex-none border-b border-slate-50">
        <h3 className="text-[13px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
          {title}
          {isFetching && (
            <Loader2 size={12} className="animate-spin text-indigo-400" />
          )}
        </h3>
        <button
          onClick={() => setExpandedWidget(id)}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
        >
          <Maximize2 size={14} />
        </button>
      </div>
      <div className="flex-1 min-h-0 px-5 pb-5 pt-3">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-400" size={28} />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* FIXED SCREEN LAYOUT */}
      <div className="h-screen w-screen overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-slate-50 to-slate-100/80 flex flex-col font-inter text-slate-800 antialiased selection:bg-indigo-100">
        {/* --- TOP HEADER --- */}
        <div className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-5 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center shadow-sm">
              <Landmark className="text-white" size={14} />
            </div>
           <h1 className="text-[15px] flex items-center gap-2.5 tracking-tight">
  <span className="font-black text-slate-800">Financial Overview</span>
  
  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
  
  <span className="font-semibold text-slate-500">Dashboard</span>
  
  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
  
  <span className="font-medium text-slate-600">
    Welcome, <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500 ml-0.5">ANK</span>
  </span>
</h1>
            <span className="ml-2 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-wider rounded border border-emerald-100 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{" "}
              Live
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3 text-[12px] font-semibold text-slate-500 pr-3 border-r border-slate-200">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={12} className="text-slate-400" />{" "}
                {currentTime.toLocaleDateString("en-GB")}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={12} className="text-slate-400" />{" "}
                {currentTime.toLocaleTimeString("en-US", {
                  hour12: true,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-bold rounded-md flex items-center gap-2 transition-colors shadow-sm"
            >
              <Lock size={12} className="text-emerald-400" /> Month End Close
            </button>
          </div>
        </div>

        {/* --- FILTER BAR --- */}
        <div className="h-12 bg-white/40 backdrop-blur-md border-b border-slate-200/60 px-4 sm:px-5 flex items-center gap-2 shrink-0 z-10 overflow-x-auto scrollbar-hide">
          <Filter size={14} className="text-slate-400 shrink-0 mr-1" />
          <input
            type="month"
            value={filters.month}
            onChange={(e) => handleFilterChange("month", e.target.value)}
            className="shrink-0 px-2 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all shadow-sm"
          />

          <select
            value={filters.departmentId}
            onChange={(e) => handleFilterChange("departmentId", e.target.value)}
            className="shrink-0 px-2 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all shadow-sm max-w-[140px] truncate"
          >
            <option value="ALL">All Classes</option>
            {departments.map((d) => (
              <option key={d._id || d.code} value={d._id || d.code}>
                {d.name || d.code}
              </option>
            ))}
          </select>

          <select
            value={filters.programId}
            onChange={(e) => handleFilterChange("programId", e.target.value)}
            className="shrink-0 px-2 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all shadow-sm max-w-[140px] truncate"
          >
            <option value="ALL">All Programs</option>
            {filteredPrograms.map((p) => (
              <option key={p._id || p.code} value={p._id || p.code}>
                {p.name || p.code}
              </option>
            ))}
          </select>

          <select
            value={filters.termId}
            onChange={(e) => handleFilterChange("termId", e.target.value)}
            className="shrink-0 px-2 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all shadow-sm max-w-[120px] truncate"
          >
            <option value="ALL">All Sessions</option>
            {terms.map((t) => (
              <option key={t._id || t.name} value={t._id || t.name}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={filters.semesterId}
            onChange={(e) => handleFilterChange("semesterId", e.target.value)}
            className="shrink-0 px-2 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all shadow-sm max-w-[120px] truncate"
          >
            <option value="ALL">All Sections</option>
            {filteredSemesters.map((s) => (
              <option key={s._id || s.number} value={s._id || s.number}>
                Section {s.number}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={() => {
                handleFilterChange("departmentId", "ALL");
                handleFilterChange("programId", "ALL");
                handleFilterChange("termId", "ALL");
                handleFilterChange("semesterId", "ALL");
              }}
              className="shrink-0 ml-1 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
              title="Clear Filters"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 min-h-0 p-4 lg:p-5 flex flex-col gap-4 lg:gap-5 overflow-hidden">
          {/* ROW 1: TOP HORIZONTAL KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 shrink-0">
            <MiniKPICard
              title="Expected Revenue"
              value={totalExpectedRevenue}
              icon={Landmark}
              bgClass="bg-blue-50/60 hover:bg-blue-50"
              borderClass="border-blue-100"
              colorClass="text-blue-600"
            />
            <MiniKPICard
              title="Total Collected"
              value={totalCollected}
              icon={Wallet}
              bgClass="bg-emerald-50/60 hover:bg-emerald-50"
              borderClass="border-emerald-100"
              colorClass="text-emerald-600"
            />
            <MiniKPICard
              title="Pending (Not Due)"
              value={totalPending}
              icon={Clock}
              bgClass="bg-amber-50/60 hover:bg-amber-50"
              borderClass="border-amber-100"
              colorClass="text-amber-600"
            />
            <MiniKPICard
              title="Overdue (Defaulters)"
              value={totalOverdue}
              icon={AlertCircle}
              bgClass="bg-rose-50/60 hover:bg-rose-50"
              borderClass="border-rose-100"
              colorClass="text-rose-600"
            />
            <MiniKPICard
              title="Recovery Rate"
              value={collectionRate}
              icon={TrendingUp}
              bgClass="bg-indigo-50/60 hover:bg-indigo-50"
              borderClass="border-indigo-100"
              colorClass="text-indigo-600"
            />
          </div>

          {/* ROW 2: Ledger (Left) & Semester Chart (Right) */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
            <DashboardCard
              id="deptTable"
              title="Departmental Ledger"
              className="lg:col-span-2"
            >
              {renderTable()}
            </DashboardCard>
            <DashboardCard
              id="semesterChart"
              title="Collections by Section"
              className="lg:col-span-1"
            >
              {renderSemesterChart()}
            </DashboardCard>
          </div>

          {/* ROW 3: Status Pie & Dept Bar Graph */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
            <DashboardCard
              id="status"
              title="Status Distribution"
              className="lg:col-span-1"
            >
              {renderStatusOverview()}
            </DashboardCard>
            <DashboardCard
              id="deptBar"
              title="Collections by Class"
              className="lg:col-span-2"
            >
              {renderDepartmentBar()}
            </DashboardCard>
          </div>
        </div>

        {/* --- EXPANDED WIDGET OVERLAY --- */}
        {expandedWidget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-6xl h-[85vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-scale-in border border-slate-100">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <Maximize2 size={16} className="text-indigo-600" /> Expanded
                  View
                </h2>
                <button
                  onClick={() => setExpandedWidget(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all border border-transparent hover:border-slate-200"
                >
                  <Minimize2 size={16} />
                </button>
              </div>
              <div className="flex-1 p-6 min-h-0 overflow-auto bg-slate-50/30">
                {expandedWidget === "semesterChart" && renderSemesterChart()}
                {expandedWidget === "status" && renderStatusOverview()}
                {expandedWidget === "deptBar" && renderDepartmentBar()}
                {expandedWidget === "deptTable" && renderTable(true)}
              </div>
            </div>
          </div>
        )}

        {/* --- MONTH-END LOCK MODAL --- */}
        {isReportModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-8 text-center border-b border-slate-100">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <Lock size={24} className="text-slate-700" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 mb-1 tracking-tight">
                  Month-End Close
                </h2>
                <p className="text-slate-500 text-xs font-medium">
                  Finalize records for {getDisplayMonth(filters.month)}
                </p>
              </div>
              <div className="p-6 bg-slate-50/50 space-y-5">
                <div className="bg-white border border-rose-100 p-3.5 rounded-2xl flex gap-3 shadow-sm">
                  <ShieldAlert
                    size={18}
                    className="shrink-0 text-rose-500 mt-0.5"
                  />
                  <div>
                    <p className="font-bold text-[13px] text-slate-800 mb-0.5">
                      Irreversible Action
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Locking{" "}
                      <span className="font-bold text-slate-700">
                        {getDisplayMonth(filters.month)}
                      </span>{" "}
                      will permanently finalize all transactions. No backdating
                      or modifications will be possible.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsReportModalOpen(false)}
                    disabled={isLocking}
                    className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-[13px] transition-all shadow-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  {/* <button
                    onClick={handleGenerateReport}
                    disabled={isLocking || !filters.month}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
                  >
                    {isLocking ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />{" "}
                        Locking...
                      </>
                    ) : (
                      <>
                        <FileDown size={14} /> Confirm & Lock
                      </>
                    )}
                  </button> */}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};