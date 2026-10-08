import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { accountantLinks } from "../services/accountantLink";
import {
  useGetFinanceReportsQuery,
  useGetChallansPaginatedQuery,
  useGetMonthlyFinanceReportQuery,
} from "../../accountant/api/studentChallanApi";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Receipt,
  ChevronLeft,
  ChevronRight,
  List,
  Grid3x3,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Banknote,
  Activity,
  UserPlus,
} from "lucide-react";

/* ─── Currency Formatter ─── */
const fmt = (val) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(val || 0);

/* ─── Skeleton Loader ─── */
const Skeleton = ({ w = "100%", h = 16, r = 6 }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: r,
      background:
        "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }}
  />
);

/* ─── Module Card ─── */
const ModuleCard = ({ link }) => {
  const navigate = useNavigate();
  const Icon = link.icon;
  return (
    <button
      onClick={() => navigate(link.path)}
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: "18px 20px",
        textAlign: "left",
        cursor: "pointer",
        transition:
          "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
        e.currentTarget.style.borderColor = link.accent + "44";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "#e2e8f0";
      }}
    >
      {/* accent top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: link.accent,
          borderRadius: "14px 14px 0 0",
          opacity: 0,
          transition: "opacity 0.15s ease",
        }}
        className="card-accent-bar"
      />

      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: link.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
          color: link.accent,
        }}
      >
        <Icon size={18} />
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: 2,
        }}
      >
        {link.title}
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: link.accent,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 8,
        }}
      >
        {link.subtitle}
      </div>
      <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5, flex: 1 }}>
        {link.description}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          marginTop: 12,
          fontSize: 11,
          fontWeight: 700,
          color: link.accent,
        }}
      >
        Open <ArrowUpRight size={11} />
      </div>
    </button>
  );
};

/* ─── Stat Card ─── */
const StatCard = ({ label, value, sub, icon, color, bg, loading, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: "#fff",
      borderRadius: 12,
      border: "1px solid #e2e8f0",
      padding: "16px 18px",
      cursor: onClick ? "pointer" : "default",
      transition: "border-color 0.15s ease, transform 0.15s ease",
    }}
    onMouseEnter={(e) => {
      if (!onClick) return;
      e.currentTarget.style.borderColor = color + "66";
      e.currentTarget.style.transform = "translateY(-2px)";
    }}
    onMouseLeave={(e) => {
      if (!onClick) return;
      e.currentTarget.style.borderColor = "#e2e8f0";
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 10,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        {label}
      </span>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
        }}
      >
        {icon}
      </div>
    </div>
    {loading ? (
      <Skeleton h={24} r={6} />
    ) : (
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "#0f172a",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    )}
    {sub && (
      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{sub}</div>
    )}
  </div>
);

/* ════════════════════════════════════════════
   MAIN DASHBOARD
════════════════════════════════════════════ */
const AccountantDashboard = () => {
  const navigate = useNavigate();
  const links = useMemo(() => accountantLinks(), []);
  const today = new Date();
  const currentMonthNum = today.getMonth() + 1;
  const currentYearNum = today.getFullYear();

  /* ── Data Fetching ──
     Every section below fires its OWN independent query with its OWN
     loading flag, on purpose — nothing here is combined into one big
     blocking "isInitialLoading". Each card/section reveals as soon as its
     own request resolves, so a slow one (e.g. the Monthly Report, which
     scans a full month of challans) never holds up the rest of the page. */
  const { data: financeRes, isLoading: statsLoading } =
    useGetFinanceReportsQuery({});
  const summary = financeRes?.data?.summary || {};
  const reportData = financeRes?.data?.reportData || [];

  const { data: overdueRes, isLoading: overdueLoading } =
    useGetChallansPaginatedQuery({ status: "overdue", limit: 1 });
  const overdueCount = overdueRes?.data?.totalItems || 0;

  const { data: pendingRes, isLoading: pendingLoading } =
    useGetChallansPaginatedQuery({ status: "issued", limit: 1 });
  const pendingCount = pendingRes?.data?.totalItems || 0;


  const { data: recentRes, isLoading: recentLoading } =
    useGetChallansPaginatedQuery({ limit: 5 });
  const recentActivity = recentRes?.data?.challans || [];

  const { data: calRes, isLoading: calLoading } = useGetChallansPaginatedQuery({
    limit: 200,
  });
  const allChallans = calRes?.data?.challans || [];

  // Current month only, by design — this is a dashboard glance, not the
  // full Monthly Challan Report screen (linked out to below for that).
  const { data: monthlyRes, isLoading: monthlyLoading } =
    useGetMonthlyFinanceReportQuery({
      month: currentMonthNum,
      year: currentYearNum,
    });
  const monthlySummary = monthlyRes?.data?.summary || {};
  const monthlyDetails = useMemo(
    () => monthlyRes?.data?.details || [],
    [monthlyRes],
  );
  const monthlyPeriod = monthlyRes?.data?.period || {};

  const dailyCollectionTrend = useMemo(() => {
    const daysInCurrentMonth = new Date(
      currentYearNum,
      currentMonthNum,
      0,
    ).getDate();
    const buckets = Array.from({ length: daysInCurrentMonth }, (_, i) => ({
      day: i + 1,
      collected: 0,
    }));
    monthlyDetails.forEach((c) => {
      if (!c.paidAt) return;
      const d = new Date(c.paidAt);
      if (
        d.getMonth() + 1 !== currentMonthNum ||
        d.getFullYear() !== currentYearNum
      )
        return;
      const bucket = buckets[d.getDate() - 1];
      if (bucket) bucket.collected += c.paidAmount || 0;
    });
    return buckets;
  }, [monthlyDetails, currentMonthNum, currentYearNum]);

  const monthlyStatusPie = useMemo(
    () => [
      { name: "Paid", value: monthlySummary.paidCount || 0, color: "#059669" },
      {
        name: "Unpaid",
        value: monthlySummary.unpaidCount || 0,
        color: "#dc2626",
      },
    ],
    [monthlySummary.paidCount, monthlySummary.unpaidCount],
  );

  /* ── Computed Stats ── */
  const totalRevenue = summary.totalRevenue || 0;
  const totalReceivable = summary.totalReceivable || 0;
  const totalPending = summary.totalPending || 0;
  const recovery =
    totalReceivable > 0
      ? Math.round((totalRevenue / totalReceivable) * 100)
      : 0;

  const paidCount = reportData.reduce((a, r) => a + r.paidCount, 0);
  const unpaidCount = reportData.reduce((a, r) => a + r.unpaidCount, 0);
  const totalCount = paidCount + unpaidCount;
  const paidPct =
    totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

  /* ── Calendar State ── */
  const [viewDate, setViewDate] = useState(new Date());
  const [calView, setCalView] = useState("grid");
  const yr = viewDate.getFullYear();
  const mo = viewDate.getMonth();
  const monthName = viewDate.toLocaleString("default", { month: "long" });

  const daysInMonth = new Date(yr, mo + 1, 0).getDate();
  const firstDay = new Date(yr, mo, 1).getDay();
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const deadlineMap = useMemo(() => {
    const map = new Map();
    allChallans.forEach((c) => {
      if (c.dueDate && c.status !== "paid" && c.status !== "cancelled") {
        const d = new Date(c.dueDate);
        if (d.getMonth() === mo && d.getFullYear() === yr) {
          const day = d.getDate();
          if (!map.has(day)) map.set(day, []);
          map.get(day).push(c);
        }
      }
    });
    return map;
  }, [allChallans, mo, yr]);

  const deadlineList = useMemo(
    () => Array.from(deadlineMap.entries()).sort((a, b) => a[0] - b[0]),
    [deadlineMap],
  );

  /* ── Search ── */
  const [search, setSearch] = useState("");
  const filteredLinks = useMemo(
    () =>
      links.filter(
        (l) =>
          l.title.toLowerCase().includes(search.toLowerCase()) ||
          l.subtitle.toLowerCase().includes(search.toLowerCase()),
      ),
    [links, search],
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "24px",
        fontFamily: "inherit",
      }}
    >
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .dash-fade { animation: fadeUp 0.4s ease both; }
      `}</style>

      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* ══════════════════════════════════════
            HEADER
        ══════════════════════════════════════ */}
        <div
          className="dash-fade"
          style={{
            background: "#0f172a",
            borderRadius: 18,
            padding: "28px 32px",
            marginBottom: 24,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Decorative orb */}
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#818cf8",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                CISD
              </span>
              <span style={{ color: "#334155", fontSize: 10 }}>•</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Accounts Department
              </span>
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 800,
                color: "#c20808",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              DEPARTMENT OF ACCOUNTS
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 13,
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              Student financial portfolios · Fee ledgers · Challan management ·
              Revenue oversight
            </p>
          </div>

          {/* Header KPIs */}
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              position: "relative",
              zIndex: 1,
            }}
          >
            {[
              {
                label: "Today",
                value: today.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                }),
                icon: <CalendarIcon size={13} />,
                color: "#818cf8",
              },
              {
                label: "Recovery Rate",
                value: statsLoading ? null : `${recovery}%`,
                icon: <TrendingUp size={13} />,
                color: "#34d399",
              },
              {
                label: "Overdue",
                value: overdueLoading ? null : overdueCount,
                icon: <AlertTriangle size={13} />,
                color: "#f87171",
              },
            ].map((k) => (
              <div
                key={k.label}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "10px 16px",
                  minWidth: 110,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginBottom: 4,
                    color: k.color,
                  }}
                >
                  {k.icon}
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      color: "#64748b",
                    }}
                  >
                    {k.label}
                  </span>
                </div>
                {k.value === null ? (
                  <Skeleton w={60} h={18} />
                ) : (
                  <div
                    style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9" }}
                  >
                    {k.value}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════
            STAT STRIP
        ══════════════════════════════════════ */}
        <div
          className="dash-fade"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 12,
            marginBottom: 24,
            animationDelay: "0.05s",
          }}
        >
          <StatCard
            label="Total Revenue"
            value={fmt(totalRevenue)}
            sub="Collected this cycle"
            icon={<Banknote size={14} />}
            color="#4f46e5"
            bg="#eef2ff"
            loading={statsLoading}
          />
          <StatCard
            label="Receivable"
            value={fmt(totalReceivable)}
            sub="Total billed"
            icon={<BarChart3 size={14} />}
            color="#0284c7"
            bg="#e0f2fe"
            loading={statsLoading}
          />
          <StatCard
            label="Outstanding"
            value={fmt(totalPending)}
            sub="Pending collection"
            icon={<TrendingDown size={14} />}
            color="#e11d48"
            bg="#fff1f2"
            loading={statsLoading}
          />
          <StatCard
            label="Active Invoices"
            value={pendingLoading ? "—" : pendingCount}
            sub="Issued, awaiting payment"
            icon={<Receipt size={14} />}
            color="#d97706"
            bg="#fffbeb"
            loading={pendingLoading}
          />
          <StatCard
            label="Overdue Accounts"
            value={overdueLoading ? "—" : overdueCount}
            sub="Missed deadlines"
            icon={<AlertTriangle size={14} />}
            color="#dc2626"
            bg="#fef2f2"
            loading={overdueLoading}
          />
          <StatCard
            label="Resolution Rate"
            value={statsLoading ? "—" : `${paidPct}%`}
            sub={`${paidCount} of ${totalCount} challans`}
            icon={<Activity size={14} />}
            color="#059669"
            bg="#ecfdf5"
            loading={statsLoading}
          />
        </div>

        {/* ══════════════════════════════════════
            MODULE GRID
        ══════════════════════════════════════ */}
        <div
          className="dash-fade"
          style={{ marginBottom: 24, animationDelay: "0.1s" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                Modules
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
                All available finance tools
              </p>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules…"
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: "#fff",
                fontSize: 13,
                color: "#334155",
                outline: "none",
                width: 200,
              }}
            />
          </div>

          {filteredLinks.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              No modules match "{search}"
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 12,
              }}
            >
              {filteredLinks.map((link) => (
                <ModuleCard key={link.path} link={link} />
              ))}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════
            BOTTOM ROW — Calendar + Activity + Chart
        ══════════════════════════════════════ */}
        <div
          className="dash-fade"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
            animationDelay: "0.15s",
          }}
        >
          {/* ── Calendar ── */}
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <CalendarIcon size={14} color="#4f46e5" /> Due Deadlines
              </h3>
              <div
                style={{
                  display: "flex",
                  background: "#f8fafc",
                  borderRadius: 7,
                  padding: 2,
                  gap: 1,
                }}
              >
                {[
                  { v: "grid", Icon: Grid3x3 },
                  { v: "list", Icon: List },
                ].map(({ v, Icon }) => (
                  <button
                    key={v}
                    onClick={() => setCalView(v)}
                    style={{
                      padding: "4px 7px",
                      borderRadius: 5,
                      border: "none",
                      cursor: "pointer",
                      background: calView === v ? "#fff" : "transparent",
                      color: calView === v ? "#4f46e5" : "#94a3b8",
                      boxShadow:
                        calView === v ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Icon size={13} />
                  </button>
                ))}
              </div>
            </div>

            {/* Month Nav */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                background: "#f8fafc",
                borderRadius: 8,
                padding: "6px 10px",
              }}
            >
              <button
                onClick={() => setViewDate(new Date(yr, mo - 1, 1))}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  display: "flex",
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}
                >
                  {monthName} {yr}
                </span>
                {(today.getMonth() !== mo || today.getFullYear() !== yr) && (
                  <button
                    onClick={() => setViewDate(new Date())}
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: "#4f46e5",
                      background: "#eef2ff",
                      border: "none",
                      borderRadius: 20,
                      padding: "2px 7px",
                      cursor: "pointer",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Today
                  </button>
                )}
              </div>
              <button
                onClick={() => setViewDate(new Date(yr, mo + 1, 1))}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  display: "flex",
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {calLoading ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Loader2
                  size={24}
                  color="#c7d2fe"
                  style={{ animation: "spin 1s linear infinite" }}
                />
              </div>
            ) : calView === "grid" ? (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    marginBottom: 4,
                  }}
                >
                  {daysOfWeek.map((d) => (
                    <div
                      key={d}
                      style={{
                        textAlign: "center",
                        fontSize: 9,
                        fontWeight: 700,
                        color: "#cbd5e1",
                        textTransform: "uppercase",
                        padding: "2px 0",
                      }}
                    >
                      {d}
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 2,
                  }}
                >
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`b${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                    (day) => {
                      const isToday =
                        day === today.getDate() &&
                        mo === today.getMonth() &&
                        yr === today.getFullYear();
                      const has = deadlineMap.has(day);
                      const cnt = has ? deadlineMap.get(day).length : 0;
                      return (
                        <div
                          key={day}
                          title={
                            has ? `${cnt} challan${cnt > 1 ? "s" : ""} due` : ""
                          }
                          style={{
                            aspectRatio: "1",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 7,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "default",
                            background: isToday
                              ? "#4f46e5"
                              : has
                                ? "#fff1f2"
                                : "transparent",
                            color: isToday
                              ? "#fff"
                              : has
                                ? "#be123c"
                                : "#475569",
                            border:
                              has && !isToday
                                ? "1px solid #fecdd3"
                                : "1px solid transparent",
                            position: "relative",
                          }}
                        >
                          {day}
                          {has && !isToday && (
                            <div
                              style={{
                                width: 4,
                                height: 4,
                                borderRadius: "50%",
                                background: "#f43f5e",
                                position: "absolute",
                                bottom: 2,
                              }}
                            />
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, overflowY: "auto" }}>
                {deadlineList.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 160,
                      color: "#cbd5e1",
                    }}
                  >
                    <CheckCircle2 size={28} style={{ marginBottom: 8 }} />
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>
                      No deadlines this month
                    </p>
                  </div>
                ) : (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {deadlineList.map(([day, challans]) => (
                      <div
                        key={day}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 11px",
                          borderRadius: 9,
                          border: "1px solid #fecdd3",
                          background: "#fff9f9",
                        }}
                      >
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 8,
                            background: "#fff1f2",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#be123c",
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 8,
                              fontWeight: 800,
                              textTransform: "uppercase",
                            }}
                          >
                            {monthName.slice(0, 3)}
                          </span>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 800,
                              lineHeight: 1,
                            }}
                          >
                            {day}
                          </span>
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#0f172a",
                            }}
                          >
                            {challans.length} Payment
                            {challans.length > 1 ? "s" : ""} Due
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>
                            {fmt(challans.reduce((a, b) => a + b.netAmount, 0))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Recent Activity ── */}
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px",
                fontSize: 13,
                fontWeight: 700,
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Activity size={14} color="#4f46e5" /> Live Activity
            </h3>

            {/* Alerts */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 9,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {overdueLoading ? (
                    <Loader2
                      size={14}
                      color="#ef4444"
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    <AlertTriangle size={14} color="#ef4444" />
                  )}
                </div>
                <div>
                  <div
                    style={{ fontSize: 12, fontWeight: 700, color: "#7f1d1d" }}
                  >
                    {overdueLoading
                      ? "Loading…"
                      : `${overdueCount} Overdue Accounts`}
                  </div>
                  <div style={{ fontSize: 10, color: "#b91c1c" }}>
                    Students missed recent fee deadlines
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 9,
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {pendingLoading ? (
                    <Loader2
                      size={14}
                      color="#f59e0b"
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  ) : (
                    <Clock size={14} color="#f59e0b" />
                  )}
                </div>
                <div>
                  <div
                    style={{ fontSize: 12, fontWeight: 700, color: "#78350f" }}
                  >
                    {pendingLoading
                      ? "Loading…"
                      : `${pendingCount} Active Invoices`}
                  </div>
                  <div style={{ fontSize: 10, color: "#b45309" }}>
                    Challans issued, awaiting payment
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 8,
              }}
            >
              Recent Challans
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {recentLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <Skeleton w={30} h={30} r={8} />
                    <div style={{ flex: 1 }}>
                      <Skeleton h={11} r={4} />
                      <div style={{ marginTop: 4 }}>
                        <Skeleton h={9} w="60%" r={4} />
                      </div>
                    </div>
                  </div>
                ))
              ) : recentActivity.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "#cbd5e1",
                    fontSize: 12,
                    padding: "20px 0",
                  }}
                >
                  No recent activity
                </div>
              ) : (
                recentActivity.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: "#f8fafc",
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        flexShrink: 0,
                        background:
                          item.status === "paid" ? "#ecfdf5" : "#eef2ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: item.status === "paid" ? "#059669" : "#4f46e5",
                      }}
                    >
                      {item.status === "paid" ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <Receipt size={14} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#0f172a",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.studentId?.personalInfo?.fullName ||
                          "Challan Generated"}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#94a3b8",
                          display: "flex",
                          gap: 6,
                          marginTop: 1,
                        }}
                      >
                        <span style={{ fontFamily: "monospace" }}>
                          {item.challanNo}
                        </span>
                        <span>·</span>
                        <span>{fmt(item.netAmount)}</span>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        padding: "2px 7px",
                        borderRadius: 20,
                        background:
                          item.status === "paid" ? "#ecfdf5" : "#f8fafc",
                        color: item.status === "paid" ? "#059669" : "#64748b",
                        border: `1px solid ${item.status === "paid" ? "#a7f3d0" : "#e2e8f0"}`,
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Revenue by Program ── */}
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <BarChart3 size={14} color="#4f46e5" /> Revenue by Program
              </h3>
              {/* Donut summary */}
              <div style={{ position: "relative", width: 44, height: 44 }}>
                <svg
                  viewBox="0 0 44 44"
                  style={{ width: 44, height: 44, transform: "rotate(-90deg)" }}
                >
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="5"
                  />
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="5"
                    strokeDasharray="113"
                    strokeDashoffset={113 - (113 * paidPct) / 100}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    fontWeight: 800,
                    color: "#4f46e5",
                  }}
                >
                  {statsLoading ? "…" : `${paidPct}%`}
                </div>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {statsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 5,
                      }}
                    >
                      <Skeleton w="40%" h={10} r={4} />
                      <Skeleton w="25%" h={10} r={4} />
                    </div>
                    <Skeleton h={7} r={99} />
                  </div>
                ))
              ) : reportData.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "#cbd5e1",
                    fontSize: 12,
                    paddingTop: 40,
                  }}
                >
                  No program data
                </div>
              ) : (
                reportData.map((item, i) => {
                  const target = item.totalGenerated || 0;
                  const achieved = item.totalCollected || 0;
                  const pct =
                    target > 0
                      ? Math.min(Math.round((achieved / target) * 100), 100)
                      : 0;
                  const barColor =
                    pct >= 80 ? "#059669" : pct >= 50 ? "#d97706" : "#dc2626";

                  return (
                    <div key={i}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                          fontSize: 11,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            color: "#334155",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "55%",
                          }}
                        >
                          {item.name || "N/A"}
                        </span>
                        <span
                          style={{
                            fontFamily: "monospace",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          {fmt(achieved)}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          background: "#f1f5f9",
                          borderRadius: 99,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: barColor,
                            borderRadius: 99,
                            transition: "width 0.8s ease",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          color: "#94a3b8",
                          marginTop: 2,
                          textAlign: "right",
                        }}
                      >
                        {pct}% of {fmt(target)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Legend */}
            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 14,
                paddingTop: 12,
                borderTop: "1px solid #f1f5f9",
              }}
            >
              {[
                { color: "#059669", label: "≥80% collected" },
                { color: "#d97706", label: "50–79%" },
                { color: "#dc2626", label: "<50%" },
              ].map((l) => (
                <div
                  key={l.label}
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: l.color,
                    }}
                  />
                  <span style={{ fontSize: 9, color: "#94a3b8" }}>
                    {l.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            MONTHLY REPORT — current month only. Its own query/loading
            flag (monthlyLoading), independent of everything above, so it
            reveals on its own timeline and never blocks the rest of the
            dashboard from rendering first.
        ══════════════════════════════════════ */}
        <div className="dash-fade" style={{ marginTop: 16, animationDelay: "0.25s" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 800,
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <BarChart3 size={16} color="#4f46e5" /> Monthly Report
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#4f46e5",
                  background: "#eef2ff",
                  padding: "3px 10px",
                  borderRadius: 20,
                }}
              >
                {monthlyPeriod.monthName ||
                  today.toLocaleString("default", { month: "long" })}{" "}
                {monthlyPeriod.year || currentYearNum}
              </span>
            </h2>
            <button
              onClick={() => navigate("/monthly-challan-reports")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "none",
                border: "none",
                color: "#4f46e5",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                padding: "6px 4px",
              }}
            >
              View Full Report <ArrowUpRight size={12} />
            </button>
          </div>

          {/* KPI row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <StatCard
              label="Generated"
              value={fmt(monthlySummary.totalGeneratedAmount)}
              sub={`${monthlySummary.totalChallans || 0} challans this month`}
              icon={<Receipt size={14} />}
              color="#4f46e5"
              bg="#eef2ff"
              loading={monthlyLoading}
            />
            <StatCard
              label="Collected"
              value={fmt(monthlySummary.totalCollectedAmount)}
              sub={`${monthlySummary.paidCount || 0} paid`}
              icon={<CheckCircle2 size={14} />}
              color="#059669"
              bg="#ecfdf5"
              loading={monthlyLoading}
            />
            <StatCard
              label="Pending"
              value={fmt(monthlySummary.totalPendingAmount)}
              sub={`${monthlySummary.unpaidCount || 0} unpaid`}
              icon={<TrendingDown size={14} />}
              color="#dc2626"
              bg="#fef2f2"
              loading={monthlyLoading}
            />
            <StatCard
              label="Fines Billed"
              value={fmt(monthlySummary.totalFines)}
              sub="late fee charges"
              icon={<AlertTriangle size={14} />}
              color="#d97706"
              bg="#fffbeb"
              loading={monthlyLoading}
            />
            <StatCard
              label="Discounts & Scholarships"
              value={fmt(
                (monthlySummary.totalDiscounts || 0) +
                  (monthlySummary.totalScholarships || 0),
              )}
              sub="total deductions"
              icon={<TrendingDown size={14} />}
              color="#8b5cf6"
              bg="#f5f3ff"
              loading={monthlyLoading}
            />
          </div>

          {/* Graphs row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 1fr",
              gap: 16,
            }}
            className="monthly-report-charts"
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                padding: 20,
              }}
            >
              <h3
                style={{
                  margin: "0 0 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <TrendingUp size={14} color="#4f46e5" /> Daily Collections —
                This Month
              </h3>
              {monthlyLoading ? (
                <Skeleton h={220} r={10} />
              ) : dailyCollectionTrend.every((d) => d.collected === 0) ? (
                <div
                  style={{
                    height: 220,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#cbd5e1",
                    fontSize: 12,
                  }}
                >
                  No collections recorded yet this month
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dailyCollectionTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      interval={2}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip
                      formatter={(v) => fmt(v)}
                      labelFormatter={(d) => `Day ${d}`}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="collected"
                      name="Collected"
                      fill="#4f46e5"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                padding: 20,
              }}
            >
              <h3
                style={{
                  margin: "0 0 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Activity size={14} color="#4f46e5" /> Payment Status
              </h3>
              {monthlyLoading ? (
                <Skeleton h={220} r={10} />
              ) : monthlySummary.totalChallans === 0 ? (
                <div
                  style={{
                    height: 220,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#cbd5e1",
                    fontSize: 12,
                  }}
                >
                  No challans this month
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={monthlyStatusPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {monthlyStatusPie.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={28}
                      iconType="circle"
                      wrapperStyle={{ fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .monthly-report-charts { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default AccountantDashboard;
