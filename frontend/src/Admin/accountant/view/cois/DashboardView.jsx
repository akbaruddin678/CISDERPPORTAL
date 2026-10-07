import React from "react";
import {
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Wallet,
} from "lucide-react";
import { useCOISDashboard } from "../../controller/useCOISDashboard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const DashboardView = () => {
  const { stats, chartData, currentMonthName, currentYear, loading } =
    useCOISDashboard();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-violet-500 mb-4" />
        <p className="font-bold">Loading Financial Overview...</p>
      </div>
    );
  }

  // Data for the Donut Chart
  const pieData = [
    { name: "Collected", value: stats.totalCollected, color: "#10b981" }, // Emerald-500
    { name: "Pending", value: stats.totalPending, color: "#f43f5e" }, // Rose-500
  ];

  const recoveryRate =
    stats.totalGenerated > 0
      ? Math.round((stats.totalCollected / stats.totalGenerated) * 100)
      : 0;

  const statCards = [
    {
      title: "Total Collected",
      val: stats.totalCollected,
      isCurrency: true,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Pending Dues",
      val: stats.totalPending,
      isCurrency: true,
      icon: AlertCircle,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      title: "Paid Challans",
      val: stats.paidCount,
      isCurrency: false,
      icon: CheckCircle2,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Total Issued",
      val: stats.totalCount,
      isCurrency: false,
      icon: Users,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            Financial Overview
          </h1>
          <p className="text-sm font-medium text-slate-500">
            College Division Summary for {currentMonthName} {currentYear}
          </p>
        </div>
        <div className="bg-white px-4 py-2 border border-slate-200 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">
            Total Expected Revenue
          </p>
          <p className="text-lg font-black text-indigo-600">
            Rs. {stats.totalGenerated.toLocaleString()}
          </p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:border-violet-200 transition-colors group"
          >
            <div
              className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}
            >
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {s.title}
            </p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {s.isCurrency
                ? `Rs. ${s.val.toLocaleString()}`
                : s.val.toLocaleString()}
            </h3>
          </div>
        ))}
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BAR CHART: Breakdown by Semester */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Wallet className="text-violet-500 w-5 h-5" /> Revenue by Semester
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Comparison of collected vs pending fees across active parts.
            </p>
          </div>
          <div className="h-[300px] w-full">
            {chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium text-sm border-2 border-dashed border-slate-100 rounded-xl">
                No active semester data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  barSize={30}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickFormatter={(value) => `Rs.${value / 1000}k`}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value) => [`Rs. ${value.toLocaleString()}`]}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: "12px",
                      fontWeight: 600,
                      paddingTop: "10px",
                    }}
                  />
                  <Bar
                    dataKey="Collected"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar dataKey="Pending" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* DONUT CHART: Recovery Rate */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-2">
            <h2 className="text-base font-bold text-slate-800">
              Recovery Rate
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Overall collection health.
            </p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[250px]">
            {stats.totalGenerated === 0 ? (
              <div className="text-slate-400 font-medium text-sm text-center border-2 border-dashed border-slate-100 rounded-xl p-8 w-full">
                No invoices generated.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `Rs. ${value.toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-slate-800">
                    {recoveryRate}%
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Collected
                  </span>
                </div>
              </>
            )}
          </div>

          {stats.totalGenerated > 0 && (
            <div className="mt-4 flex justify-between gap-4 text-xs font-bold bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-slate-600">Collected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <span className="text-slate-600">Pending</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
