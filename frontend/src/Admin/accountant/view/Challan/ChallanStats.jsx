import React, { useState } from "react";
import {
  Wallet,
  AlertCircle,
  FileText,
  ArrowUpRight,
  PieChart,
  Building2,
  BookOpen,
  Calendar,
  Search,
} from "lucide-react";

// --- Helper: Currency Formatter ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// --- 1. Top Summary Cards ---
const StatCard = ({ title, value, subValue, icon: Icon, color, trend }) => {
  const colorStyles = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    rose: "bg-rose-50 text-rose-600 border-rose-200",
  };
  const currentStyle = colorStyles[color] || colorStyles.indigo;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div
          className={`p-3.5 rounded-xl border ${currentStyle} transition-transform group-hover:scale-110`}
        >
          <Icon size={24} strokeWidth={2.5} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-[11px] font-bold bg-emerald-50 px-2.5 py-1 rounded-full text-emerald-700 border border-emerald-100">
            <ArrowUpRight size={14} />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
          {title}
        </p>
        <h3 className="text-3xl font-black text-slate-900 tracking-tight">
          {value}
        </h3>
        {subValue && (
          <p className="text-xs font-medium text-slate-500 mt-2 bg-slate-50 inline-block px-2 py-1 rounded-md border border-slate-100">
            {subValue}
          </p>
        )}
      </div>
    </div>
  );
};

// --- 2. Detailed Data Table Component ---
const DetailedStatsTable = ({ title, data, icon: Icon }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const safeData = data || [];
  const filteredData = safeData.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wide">
          <Icon className="text-indigo-500" size={18} /> {title}
        </h3>
        <div className="relative">
          <Search
            className="absolute left-3 top-2.5 text-slate-400"
            size={14}
          />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-3 py-2 text-xs font-medium border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-48 bg-white transition-all focus:w-56"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-auto max-h-[450px]">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-white text-slate-500 font-bold text-[10px] uppercase tracking-wider sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-5 py-4 border-b border-slate-100">Name</th>
              <th className="px-5 py-4 text-right border-b border-slate-100">
                Total Issued
              </th>
              <th className="px-5 py-4 text-right border-b border-slate-100">
                Collected
              </th>
              <th className="px-5 py-4 text-right border-b border-slate-100">
                Pending
              </th>
              <th className="px-5 py-4 text-center border-b border-slate-100 w-32">
                Recovery Rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-slate-50/30">
            {filteredData.length > 0 ? (
              filteredData.map((row, idx) => (
                <tr key={idx} className="hover:bg-white transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-700">
                    {row.name}
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-medium text-slate-500">
                    {formatCurrency(row.total)}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-emerald-600 font-bold bg-emerald-50/30">
                    {formatCurrency(row.paid)}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-rose-600 font-medium">
                    {formatCurrency(row.pending)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-400">Rate</span>
                        <span className="text-indigo-600">{row.rate}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${row.rate >= 80 ? "bg-emerald-500" : row.rate >= 50 ? "bg-indigo-500" : "bg-amber-500"}`}
                          style={{ width: `${row.rate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="p-12 text-center text-slate-400 font-medium"
                >
                  No data found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
// ✅ Direct Injection of the highly optimized backend DB aggregation
const ChallanStats = ({ backendStats }) => {
  const { summary, depts, progs, sems, isLoading } = backendStats;

  if (isLoading || !summary) {
    return (
      <div className="p-12 text-center text-slate-400 font-bold animate-pulse">
        Loading Live Database Statistics...
      </div>
    );
  }

  // Pure function to map raw API aggregate arrays into UI rows
  const formatData = (dataArray) => {
    return (dataArray || [])
      .map((d) => ({
        name: d.name || "Unknown",
        total: d.totalGenerated || 0,
        paid: d.totalCollected || 0,
        pending: d.totalPending || 0,
        rate:
          d.totalGenerated > 0
            ? Math.round((d.totalCollected / d.totalGenerated) * 100)
            : 0,
      }))
      .sort((a, b) => b.total - a.total);
  };

  const deptData = formatData(depts);
  const progData = formatData(progs);
  const semData = formatData(sems);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue Collected"
          value={formatCurrency(summary.totalRevenue)}
          subValue={`${summary.count} Active Challans`}
          icon={Wallet}
          color="emerald"
          trend={`${summary.rate}% Collection`}
        />
        <StatCard
          title="Pending Dues"
          value={formatCurrency(summary.pendingDues)}
          subValue="Outstanding Receivables"
          icon={AlertCircle}
          color="amber"
        />
        <StatCard
          title="Overdue Payments"
          value={formatCurrency(summary.overdueAmount)}
          subValue={`${summary.overdueCount} Late Challans`}
          icon={FileText}
          color="rose"
        />

        {/* Visual Rate Card (SaaS Style) */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/30 rounded-full blur-3xl group-hover:bg-indigo-400/40 transition-all duration-700"></div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/5">
                <PieChart size={24} className="text-indigo-300" />
              </div>
              <span className="text-[10px] font-black bg-emerald-500 px-2.5 py-1 rounded-full text-white uppercase tracking-widest shadow-sm">
                Live DB
              </span>
            </div>
            <div>
              <h4 className="text-5xl font-black tracking-tighter drop-shadow-sm">
                {summary.rate}%
              </h4>
              <p className="text-indigo-200 text-xs font-medium mt-1 mb-4 uppercase tracking-widest">
                Overall Recovery Rate
              </p>
              <div className="w-full bg-slate-800/50 h-2 rounded-full overflow-hidden border border-white/10">
                <div
                  className="bg-gradient-to-r from-indigo-400 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                  style={{ width: `${summary.rate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Breakdown Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DetailedStatsTable
          title="Department Performance"
          data={deptData}
          icon={Building2}
        />
        <DetailedStatsTable
          title="Program-wise Collection"
          data={progData}
          icon={BookOpen}
        />
      </div>

      {/* 3. Semester Breakdown Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <Calendar className="text-indigo-600" size={22} /> Semester-wise
            Breakdown
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {semData.length > 0 ? (
            semData.map((sem, idx) => (
              <div
                key={idx}
                className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-md hover:-translate-y-1 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h4
                    className="font-bold text-slate-800 text-sm leading-tight pr-2"
                    title={sem.name}
                  >
                    {sem.name}
                  </h4>
                  <span
                    className={`text-xs font-black px-2 py-1 rounded-md border shrink-0 ${sem.rate >= 80 ? "bg-emerald-100 text-emerald-700 border-emerald-200" : sem.rate >= 50 ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-rose-100 text-rose-700 border-rose-200"}`}
                  >
                    {sem.rate}%
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-500 font-bold uppercase">
                      Collected
                    </span>
                    <span className="font-mono font-bold text-emerald-600">
                      {formatCurrency(sem.paid)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-500 font-bold uppercase">
                      Pending
                    </span>
                    <span className="font-mono font-bold text-rose-500">
                      {formatCurrency(sem.pending)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${sem.rate >= 80 ? "bg-emerald-500" : "bg-indigo-500"}`}
                      style={{ width: `${sem.rate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <Search size={40} className="mb-3 opacity-20 text-slate-500" />
              <p className="font-bold text-slate-500">
                No semester data found.
              </p>
              <p className="text-xs mt-1">
                Challans must be generated to display metrics here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChallanStats;
