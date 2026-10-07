
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  PieChart,
  CreditCard,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Loader2,
  Search,
  ArrowLeft,
  ChevronRight,
  SlidersHorizontal,
  GraduationCap,
  BookMarked,
  Sparkles,
  Layers,
  Save,
  Plus,
  Minus,
  Check,
  X,
  FileDown,
  Phone,
  Mail,
  Building2,
  Award,
  Edit,
  DownloadCloud,
  ShieldAlert,
  Zap,
  Calendar,
  Eye,
  Trash2,
  Printer,
  UserX,
} from "lucide-react";
import { Checkbox, Switch } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RPieChart,
  Pie,
  Cell,
} from "recharts";

// ─── CONTROLLER IMPORTS (unchanged) ────────────────────────────────────────
import DailyInvoiceView from "../view/cois/DailyInvoiceView";
import COISWithdrawView from "../view/cois/COISWithdrawView";
import { useCOISDashboard } from "../controller/useCOISDashboard";
import { useCOISFeeSetup } from "../controller/useCOISFeeSetup";
import { useCOISChallan } from "../controller/useCOISChallan";
import { useCOISInstallment } from "../controller/useCOISInstallment";
import { useCOISReports } from "../controller/useCOISReports";
import { useCOISStudent360 } from "../controller/useCOISStudent360";
import { useGetStudentsQuery } from "../api/accountantstudentApi";
import {
  useGetTermsQuery,
  useGetDepartmentsQuery,
  useGetProgramsByDepartmentQuery,
} from "../api/depsemtermpro";
import { useLazyGetMasterFinancialReportQuery } from "../api/studentChallanApi";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  buildMasterFinancialWorkbook,
  downloadBlob,
} from "../common/masterFinancialWorkbook";

// ─── EXISTING ERP COMPONENTS (unchanged) ───────────────────────────────────
import ChallanTable from "../view/Challan/ChallanTable";
import {
  GenerateModal,
  InstallmentModal,
  EditDateModal,
  DiscountModal,
  DetailModal,
  MarkPaidModal,
} from "../view/Challan/ChallanModals";
import {
  buildChallanPage,
  openPrintWindow,
} from "../common/ChallanPrintTemplate";

// ═══════════════════════════════════════════════════════════════════════════
// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');

  .cois-root * { box-sizing: border-box; }
  .cois-root {
    font-family: 'DM Sans', system-ui, sans-serif;
    background: #F5F4F1;
    min-height: 100vh;
    color: #1C1917;
  }

  /* ── NAV ── */
  .cois-nav {
    width: 220px;
    background: #FAFAF9;
    border-right: 1px solid #E7E5E4;
    display: flex;
    flex-direction: column;
    padding: 0;
    flex-shrink: 0;
    position: sticky;
    top: 0;
    height: 100vh;
  }
  .cois-nav-brand {
    padding: 24px 20px 20px;
    border-bottom: 1px solid #E7E5E4;
  }
  .cois-nav-brand-tag {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #4F46E5;
    margin-bottom: 4px;
  }
  .cois-nav-brand-title {
    font-size: 16px;
    font-weight: 700;
    color: #1C1917;
    line-height: 1.25;
  }
  .cois-nav-links {
    padding: 12px 10px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .cois-nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #78716C;
    cursor: pointer;
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
    transition: background 0.12s, color 0.12s;
  }
  .cois-nav-item:hover {
    background: #F0EFEB;
    color: #1C1917;
  }
  .cois-nav-item.active {
    background: #EEF2FF;
    color: #4F46E5;
  }
  .cois-nav-item.active svg { color: #4F46E5; }

  /* ── MAIN ── */
  .cois-main {
    flex: 1;
    overflow-y: auto;
    padding: 28px 32px;
  }

  /* ── PAGE HEADER ── */
  .page-header {
    margin-bottom: 24px;
  }
  .page-header h1 {
    font-size: 20px;
    font-weight: 700;
    color: #1C1917;
    margin: 0 0 4px;
  }
  .page-header p {
    font-size: 13px;
    color: #78716C;
    margin: 0;
  }

  /* ── STAT CARDS ── */
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat-card {
    background: #FFFFFF;
    border: 1px solid #E7E5E4;
    border-radius: 10px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .stat-icon {
    width: 36px; height: 36px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
  }
  .stat-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #A8A29E; }
  .stat-value { font-size: 22px; font-weight: 700; color: #1C1917; }

  /* ── CARD ── */
  .card {
    background: #FFFFFF;
    border: 1px solid #E7E5E4;
    border-radius: 10px;
  }
  .card-header {
    padding: 14px 20px;
    border-bottom: 1px solid #E7E5E4;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .card-title { font-size: 13px; font-weight: 700; color: #1C1917; }
  .card-body { padding: 16px 20px; }

  /* ── TABLES ── */
  .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .data-table thead th {
    background: #FAFAF9;
    padding: 10px 16px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #A8A29E;
    border-bottom: 1px solid #E7E5E4;
    text-align: left;
  }
  .data-table tbody td {
    padding: 11px 16px;
    border-bottom: 1px solid #F5F4F1;
    color: #44403C;
    vertical-align: middle;
  }
  .data-table tbody tr:last-child td { border-bottom: none; }
  .data-table tbody tr:hover td { background: #FAFAF9; }
  .data-table tbody tr.row-selected td { background: #EEF2FF; }

  /* ── SIDEBAR FILTER ── */
  .filter-sidebar {
    width: 200px;
    flex-shrink: 0;
    background: #FAFAF9;
    border-right: 1px solid #E7E5E4;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .filter-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #A8A29E; margin-bottom: 5px; display: block; }
  .filter-select {
    width: 100%;
    background: #FFFFFF;
    border: 1px solid #E7E5E4;
    border-radius: 7px;
    padding: 7px 10px;
    font-size: 12px;
    font-weight: 500;
    color: #1C1917;
    outline: none;
    font-family: inherit;
  }
  .filter-select:focus { border-color: #4F46E5; }

  /* ── SEARCH BAR ── */
  .search-wrap { position: relative; }
  .search-wrap svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #A8A29E; pointer-events: none; }
  .search-input {
    width: 100%;
    padding: 8px 12px 8px 34px;
    background: #FAFAF9;
    border: 1px solid #E7E5E4;
    border-radius: 7px;
    font-size: 13px;
    font-weight: 500;
    color: #1C1917;
    outline: none;
    font-family: inherit;
  }
  .search-input:focus { border-color: #4F46E5; background: #fff; }

  /* ── BUTTONS ── */
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 7px;
    font-size: 12px; font-weight: 600; cursor: pointer;
    border: 1px solid transparent; transition: all 0.12s;
    font-family: inherit;
  }
  .btn-primary { background: #4F46E5; color: #fff; border-color: #4F46E5; }
  .btn-primary:hover { background: #4338CA; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-ghost { background: transparent; color: #78716C; border-color: #E7E5E4; }
  .btn-ghost:hover { background: #F5F4F1; color: #1C1917; }
  .btn-danger { background: #FEF2F2; color: #B91C1C; border-color: #FECACA; }
  .btn-danger:hover { background: #FEE2E2; }

  /* ── BADGES ── */
  .badge {
    display: inline-flex; align-items: center;
    padding: 2px 8px; border-radius: 4px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
  }
  .badge-paid { background: #DCFCE7; color: #166534; }
  .badge-pending { background: #FEF9C3; color: #854D0E; }
  .badge-overdue { background: #FEE2E2; color: #991B1B; }
  .badge-void { background: #F3F4F6; color: #6B7280; }
  .badge-info { background: #EEF2FF; color: #3730A3; }

  /* ── TABS ── */
  .tab-bar { display: flex; gap: 0; border-bottom: 1px solid #E7E5E4; padding: 0 20px; }
  .tab-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 12px 16px;
    font-size: 12px; font-weight: 600; color: #78716C;
    background: transparent; border: none; border-bottom: 2px solid transparent;
    cursor: pointer; transition: color 0.12s; margin-bottom: -1px;
    font-family: inherit;
  }
  .tab-btn:hover { color: #1C1917; }
  .tab-btn.active { color: #4F46E5; border-bottom-color: #4F46E5; }

  /* ── MONO ── */
  .mono { font-family: 'IBM Plex Mono', monospace; font-size: 11px; }

  /* ── AVATAR ── */
  .avatar {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; flex-shrink: 0;
  }

  /* ── SECTION DIVIDER ── */
  .section-heading {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.07em; color: #A8A29E; margin-bottom: 8px;
  }

  /* ── EMPTY STATE ── */
  .empty-state {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 48px 24px; color: #A8A29E;
    text-align: center;
  }
  .empty-state svg { margin-bottom: 12px; opacity: 0.4; }
  .empty-state p { font-size: 13px; font-weight: 600; color: #78716C; margin: 0 0 4px; }
  .empty-state span { font-size: 12px; }

  /* ── MODAL ── */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 50;
    background: rgba(0,0,0,0.35); backdrop-filter: blur(2px);
    display: flex; align-items: center; justify-content: center; padding: 16px;
  }
  .modal-box {
    background: #FFFFFF; border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    width: 100%; max-width: 420px; overflow: hidden;
  }
  .modal-header {
    padding: 16px 20px; border-bottom: 1px solid #E7E5E4;
    display: flex; align-items: center; justify-content: space-between;
  }
  .modal-header h3 { font-size: 14px; font-weight: 700; color: #1C1917; margin: 0; }
  .modal-body { padding: 20px; }
  .form-label { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #78716C; margin-bottom: 5px; }
  .form-input {
    width: 100%; padding: 8px 12px;
    background: #FAFAF9; border: 1px solid #E7E5E4; border-radius: 7px;
    font-size: 13px; font-weight: 500; color: #1C1917; outline: none; font-family: inherit;
  }
  .form-input:focus { border-color: #4F46E5; background: #fff; }

  /* ── INSTALLMENT VISUALIZER ── */
  .inst-bar { height: 16px; border-radius: 8px; overflow: hidden; display: flex; background: #F0EFEB; }
  .inst-segment { display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.9); border-right: 2px solid rgba(255,255,255,0.3); transition: width 0.3s; }
  .inst-segment:last-child { border-right: none; }

  /* ── SUCCESS OVERLAY ── */
  .success-overlay {
    position: absolute; inset: 0; z-index: 50;
    background: rgba(255,255,255,0.9); backdrop-filter: blur(4px);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .success-circle {
    width: 64px; height: 64px; border-radius: 50%; background: #22C55E;
    display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
  }

  /* ── RECOVERY RING ── */
  .recovery-section { display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
`;

// ═══════════════════════════════════════════════════════════════════════════
// ─── SHARED MICRO-COMPONENTS ───────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const Avatar = ({ name = "", size = 32 }) => {
  const initials =
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        background: `hsl(${hue},45%,90%)`,
        color: `hsl(${hue},45%,30%)`,
      }}
    >
      {initials}
    </div>
  );
};

const Badge = ({ status }) => {
  const map = {
    paid: "badge-paid",
    pending: "badge-pending",
    unpaid: "badge-pending",
    partial: "badge-pending",
    overdue: "badge-overdue",
    void: "badge-void",
    cancelled: "badge-void",
    not_generated: "badge-void",
  };
  const label = { not_generated: "not generated" }[status] || status;
  return (
    <span className={`badge ${map[status] || "badge-info"}`}>{label}</span>
  );
};

const Spinner = ({ size = 18 }) => (
  <Loader2 size={size} className="animate-spin" style={{ color: "#4F46E5" }} />
);

const EmptyState = ({ icon: Icon, title, sub }) => (
  <div className="empty-state">
    <Icon size={36} />
    <p>{title}</p>
    {sub && <span>{sub}</span>}
  </div>
);

const FilterSidebar = ({ children, title = "Filters" }) => (
  <div className="filter-sidebar">
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        paddingBottom: 12,
        borderBottom: "1px solid #E7E5E4",
      }}
    >
      <SlidersHorizontal size={14} style={{ color: "#4F46E5" }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: "#1C1917" }}>
        {title}
      </span>
    </div>
    {children}
  </div>
);

const FilterGroup = ({ label, children }) => (
  <div>
    <span className="filter-label">{label}</span>
    {children}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// ─── DASHBOARD VIEW ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const DashboardView = () => {
  const { stats, chartData, currentMonthName, currentYear, loading } =
    useCOISDashboard();

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 400,
          flexDirection: "column",
          gap: 12,
        }}
      >
        <Spinner size={28} />
        <span style={{ fontSize: 13, color: "#78716C" }}>
          Loading financial overview…
        </span>
      </div>
    );

  const recovery =
    stats.totalGenerated > 0
      ? Math.round((stats.totalCollected / stats.totalGenerated) * 100)
      : 0;
  const pieData = [
    { name: "Collected", value: stats.totalCollected, color: "#22C55E" },
    { name: "Pending", value: stats.totalPending, color: "#EF4444" },
  ];

  return (
    <div>
      <div
        className="page-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1>Financial Overview</h1>
          <p>
            College Division · {currentMonthName} {currentYear}
          </p>
        </div>
        <div
          className="card"
          style={{ padding: "10px 16px", textAlign: "right" }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: "#A8A29E",
            }}
          >
            Total Expected
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#4F46E5" }}>
            Rs. {stats.totalGenerated.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="stat-grid">
        {[
          {
            label: "Total Collected",
            val: `Rs. ${stats.totalCollected.toLocaleString()}`,
            icon: TrendingUp,
            ic: "#22C55E",
            ibg: "#DCFCE7",
          },
          {
            label: "Pending Dues",
            val: `Rs. ${stats.totalPending.toLocaleString()}`,
            icon: AlertCircle,
            ic: "#EF4444",
            ibg: "#FEE2E2",
          },
          {
            label: "Paid Challans",
            val: stats.paidCount.toLocaleString(),
            icon: CheckCircle2,
            ic: "#4F46E5",
            ibg: "#EEF2FF",
          },
          {
            label: "Total Issued",
            val: stats.totalCount.toLocaleString(),
            icon: Receipt,
            ic: "#D97706",
            ibg: "#FEF3C7",
          },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon" style={{ background: s.ibg }}>
              <s.icon size={16} style={{ color: s.ic }} />
            </div>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.val}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}
      >
        <div className="card">
          <div className="card-header">
            <div>
              <div
                className="card-title"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <Wallet size={14} style={{ color: "#4F46E5" }} /> Revenue by
                Section
              </div>
              <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 2 }}>
                Collected vs. pending across active parts
              </div>
            </div>
          </div>
          <div style={{ padding: "16px 20px 20px" }}>
            {chartData.length === 0 ? (
              <EmptyState
                icon={BarChart}
                title="No section data yet"
                sub="Data will appear once challans are generated"
              />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={chartData}
                  barSize={24}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E7E5E4"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#78716C", fontWeight: 600 }}
                    dy={6}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#A8A29E" }}
                    tickFormatter={(v) => `${v / 1000}k`}
                  />
                  <Tooltip
                    cursor={{ fill: "#F5F4F1" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #E7E5E4",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      fontSize: 12,
                    }}
                    formatter={(v) => `Rs. ${v.toLocaleString()}`}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: 11,
                      fontWeight: 600,
                      paddingTop: 8,
                    }}
                  />
                  <Bar
                    dataKey="Collected"
                    fill="#22C55E"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar dataKey="Pending" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div
          className="card"
          style={{ display: "flex", flexDirection: "column" }}
        >
          <div className="card-header">
            <div className="card-title">Recovery Rate</div>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              gap: 16,
            }}
          >
            {stats.totalGenerated === 0 ? (
              <EmptyState
                icon={PieChart}
                title="No data"
                sub="Generate challans to see recovery"
              />
            ) : (
              <>
                <div style={{ position: "relative", width: 160, height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RPieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={56}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                    </RPieChart>
                  </ResponsiveContainer>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 26,
                        fontWeight: 700,
                        color: "#1C1917",
                      }}
                    >
                      {recovery}%
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "#A8A29E",
                      }}
                    >
                      collected
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {pieData.map((e, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: e.color,
                          }}
                        />
                        <span style={{ color: "#78716C", fontWeight: 500 }}>
                          {e.name}
                        </span>
                      </div>
                      <span style={{ fontWeight: 700, color: "#1C1917" }}>
                        Rs. {e.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const fmtPKR = (v) => `Rs. ${(v || 0).toLocaleString()}`;

// One semester's complete, self-contained report — Fee Setup, Tuition
// Outstanding (with previous-semester-due carry-forward), Challan
// Statistics, Installment & Payment record, and Monthly Fee Collected.
// Mirrors the University Student Profile's per-semester report, styled to
// match the College module's own card/stat-grid/data-table design.
const COISSemesterReport = ({ report }) => {
  const {
    configuredFees = {},
    challanStats = {},
    monthlyCollection = { tuition: [], hostelMonthly: [] },
    fullInstallmentPlan = [],
    isInstallmentConfigured = false,
    configuredInstallmentCount = 1,
    previousDue = 0,
    tuitionPaid = 0,
    tuitionOutstanding = 0,
  } = report || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: 20 }}>
      <div>
        <div className="section-heading">Fee Setup</div>
        <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 0 }}>
          {[
            { label: "Tuition", val: configuredFees.ACADEMIC },
            { label: "Admission", val: configuredFees.ADMISSION },
            { label: "Exam", val: configuredFees.EXAM },
            {
              label: "Misc / Other",
              val: (configuredFees.MISC || 0) + (configuredFees.READMISSION || 0),
            },
          ].map((s, i) => (
            <div className="stat-card" key={i} style={{ padding: "10px 12px" }}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: 16 }}>
                {fmtPKR(s.val)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {previousDue > 0 && (
        <div
          style={{
            background: "#FEF9C3",
            border: "1px solid #FDE68A",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 12,
            fontWeight: 600,
            color: "#854D0E",
          }}
        >
          Previous Semester Due carried forward: {fmtPKR(previousDue)} — added
          into Tuition Outstanding below.
        </div>
      )}

      <div>
        <div className="section-heading">Tuition Outstanding</div>
        <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 0 }}>
          <div className="stat-card" style={{ padding: "10px 12px" }}>
            <div className="stat-label">Tuition Setup</div>
            <div className="stat-value" style={{ fontSize: 16 }}>
              {fmtPKR(configuredFees.ACADEMIC)}
            </div>
          </div>
          <div className="stat-card" style={{ padding: "10px 12px" }}>
            <div className="stat-label">Tuition Paid</div>
            <div className="stat-value" style={{ fontSize: 16, color: "#22C55E" }}>
              {fmtPKR(tuitionPaid)}
            </div>
          </div>
          <div className="stat-card" style={{ padding: "10px 12px" }}>
            <div className="stat-label">Tuition Outstanding</div>
            <div className="stat-value" style={{ fontSize: 16, color: "#EF4444" }}>
              {fmtPKR(tuitionOutstanding)}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="section-heading">Challan Statistics</div>
        <div className="stat-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", marginBottom: 0 }}>
          {[
            {
              label: "Total Generated",
              val: challanStats.totalAmount,
              sub: `${challanStats.totalCount || 0} challans`,
            },
            {
              label: "Paid",
              val: challanStats.paidAmount,
              sub: `${challanStats.paidCount || 0} challans`,
              color: "#22C55E",
            },
            {
              label: "Unpaid",
              val: challanStats.unpaidAmount,
              sub: `${challanStats.unpaidCount || 0} challans`,
              color: "#D97706",
            },
            {
              label: "Overdue",
              val: challanStats.overdueAmount,
              sub: `${challanStats.overdueCount || 0} challans`,
              color: "#EF4444",
            },
            { label: "Fines Collected", val: challanStats.totalFines, color: "#D97706" },
          ].map((s, i) => (
            <div className="stat-card" key={i} style={{ padding: "10px 12px" }}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: 16, color: s.color }}>
                {fmtPKR(s.val)}
              </div>
              {s.sub && (
                <div style={{ fontSize: 10, color: "#A8A29E" }}>{s.sub}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Installment &amp; Payment Record</div>
          <span style={{ fontSize: 11, color: "#78716C" }}>
            {isInstallmentConfigured
              ? `${configuredInstallmentCount}-part plan`
              : "Standard single payment"}
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Inst #</th>
                <th>Month</th>
                <th style={{ textAlign: "right" }}>Expected</th>
                <th>Challan</th>
                <th>Payment</th>
                <th style={{ textAlign: "right" }}>Paid</th>
              </tr>
            </thead>
            <tbody>
              {fullInstallmentPlan.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={Receipt}
                      title="No tuition fee configured for this section yet"
                    />
                  </td>
                </tr>
              ) : (
                fullInstallmentPlan.map((p) => (
                  <tr key={p.number}>
                    <td>
                      No. {p.number}{" "}
                      <span className="mono" style={{ marginLeft: 4 }}>
                        {p.percentage?.toFixed(1)}%
                      </span>
                    </td>
                    <td>{p.month || "—"}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {fmtPKR(p.expectedAmount)}
                    </td>
                    <td>
                      <span
                        className={`badge ${p.generationStatus === "Generated" ? "badge-info" : "badge-void"}`}
                      >
                        {p.generationStatus}
                      </span>
                    </td>
                    <td>
                      <Badge status={p.paymentStatus} />
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: 700,
                        color: "#22C55E",
                      }}
                    >
                      {fmtPKR(p.paidAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Monthly Fee Collected</div>
        </div>
        <div style={{ padding: "14px 20px" }}>
          <div className="section-heading">Tuition</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: 8,
              marginBottom: 18,
            }}
          >
            {monthlyCollection.tuition.length === 0 ? (
              <span style={{ fontSize: 12, color: "#A8A29E" }}>
                No tuition fee configured for this section yet.
              </span>
            ) : (
              monthlyCollection.tuition.map((m) => (
                <div
                  key={m.installmentNumber}
                  style={{
                    background: "#FAFAF9",
                    border: "1px solid #E7E5E4",
                    borderRadius: 8,
                    padding: "8px 10px",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#44403C" }}>
                    {m.month}
                  </div>
                  <div className="mono" style={{ margin: "2px 0" }}>
                    {fmtPKR(m.amount)}
                  </div>
                  <Badge status={m.status} />
                </div>
              ))
            )}
          </div>
          <div className="section-heading">Hostel Monthly</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: 8,
            }}
          >
            {monthlyCollection.hostelMonthly.length === 0 ? (
              <span style={{ fontSize: 12, color: "#A8A29E" }}>
                No hostel monthly challans for this section.
              </span>
            ) : (
              monthlyCollection.hostelMonthly.map((m, i) => (
                <div
                  key={i}
                  style={{
                    background: "#FAFAF9",
                    border: "1px solid #E7E5E4",
                    borderRadius: 8,
                    padding: "8px 10px",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#44403C" }}>
                    {m.month}
                  </div>
                  <div className="mono" style={{ margin: "2px 0" }}>
                    {fmtPKR(m.amount)}
                  </div>
                  <Badge status={m.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// One semester's transaction table for the College Student Profile's
// Ledger tab — same shape/columns as the flat challans table this module
// already had, just now scoped to a single semester at a time.
const COISLedgerTable = ({ challans }) => (
  <div style={{ overflowX: "auto" }}>
    <table className="data-table">
      <thead>
        <tr>
          <th>Challan Ref</th>
          <th>Type</th>
          <th>Dates</th>
          <th>Base</th>
          <th>Disc/Fine</th>
          <th>Net</th>
          <th>Paid</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {challans.length === 0 ? (
          <tr>
            <td colSpan={8}>
              <EmptyState icon={Receipt} title="No financial records" />
            </td>
          </tr>
        ) : (
          challans.map((c, i) => (
            <tr key={c._id || i}>
              <td>
                <span className="mono">{c.challanNo}</span>
              </td>
              <td>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#44403C" }}>
                  {c.challanType?.replace(/_/g, " ") || "—"}
                </div>
                {c.isInstallment && (
                  <span className="badge badge-info" style={{ marginTop: 3 }}>
                    Installment
                  </span>
                )}
              </td>
              <td>
                <div style={{ fontSize: 11, color: "#78716C" }}>
                  Due:{" "}
                  <span style={{ fontWeight: 600, color: "#EF4444" }}>
                    {new Date(c.dueDate).toLocaleDateString("en-GB")}
                  </span>
                </div>
                {c.paidAt && (
                  <div style={{ fontSize: 11, color: "#22C55E", fontWeight: 600 }}>
                    {new Date(c.paidAt).toLocaleDateString("en-GB")}
                  </div>
                )}
              </td>
              <td style={{ fontWeight: 600 }}>
                {fmtPKR(c.originalTotal)}
              </td>
              <td>
                {c.scholarshipAmount > 0 && (
                  <div style={{ color: "#8B5CF6", fontSize: 11 }}>
                    −{fmtPKR(c.scholarshipAmount)}
                  </div>
                )}
                {c.fineAmount > 0 && (
                  <div style={{ color: "#D97706", fontSize: 11 }}>
                    +{fmtPKR(c.fineAmount)}
                  </div>
                )}
              </td>
              <td style={{ fontWeight: 700, color: "#1C1917" }}>
                {fmtPKR(c.netAmount)}
              </td>
              <td style={{ fontWeight: 700, color: "#22C55E" }}>
                {fmtPKR(c.paidAmount)}
              </td>
              <td>
                <Badge status={c.isDeleted ? "void" : c.status} />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// Full Personal / Family / Academic detail panel for the College Student
// Profile's Academics tab — replaces the old placeholder with the student's
// actual personal information, family information, academic standing, and
// admission/promotion remarks.
const COISProfileInfo = ({ student }) => {
  const personal = student?.personalInfo || {};
  const family = student?.familyInfo || {};
  const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("en-GB") : "N/A");
  const fmtAddress = (a) =>
    a && (a.address || a.district || a.province || a.country)
      ? [a.address, a.district, a.province, a.country].filter(Boolean).join(", ")
      : "N/A";

  const InfoRow = ({ label, val }) => (
    <div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: "#A8A29E",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#1C1917", marginTop: 2 }}>
        {val || "N/A"}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20 }}>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Personal Information</div>
        </div>
        <div
          style={{
            padding: "14px 20px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          <InfoRow label="Full Name" val={personal.fullName} />
          <InfoRow label="CNIC / B-Form" val={personal.cnic} />
          <InfoRow label="Date of Birth" val={fmtDate(personal.dob)} />
          <InfoRow
            label="Gender"
            val={
              personal.gender
                ? personal.gender[0].toUpperCase() + personal.gender.slice(1)
                : null
            }
          />
          <InfoRow label="Phone" val={personal.phone} />
          <InfoRow label="Email" val={personal.email} />
          <InfoRow
            label="Current Address"
            val={fmtAddress(personal.currentAddress)}
          />
          <InfoRow
            label="Permanent Address"
            val={fmtAddress(personal.permanentAddress)}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Family Information</div>
        </div>
        <div
          style={{
            padding: "14px 20px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          <InfoRow label="Father's Name" val={family.fatherName} />
          <InfoRow label="Father's CNIC" val={family.fatherCnic} />
          <InfoRow label="Father's Profession" val={family.fathersProfession} />
          <InfoRow label="Mother's Name" val={family.motherName} />
          <InfoRow label="Mother's CNIC" val={family.motherCnic} />
          <InfoRow
            label="Guardian Status"
            val={
              family.guardianStatus
                ? family.guardianStatus[0].toUpperCase() +
                  family.guardianStatus.slice(1)
                : null
            }
          />
          <InfoRow label="Guardian Phone" val={family.guardianPhone} />
          <InfoRow label="Guardian Designation" val={family.guardianDesignation} />
          <InfoRow label="Income Bracket" val={family.incomeBracket} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Academic Standing</div>
        </div>
        <div
          style={{
            padding: "14px 20px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          <InfoRow label="Program" val={student?.programId?.name} />
          <InfoRow label="Class" val={student?.departmentId?.name} />
          <InfoRow label="Session" val={student?.termId?.name} />
          <InfoRow
            label="Part"
            val={
              student?.semesterId?.name ||
              (student?.semesterId?.number
                ? `Part ${student.semesterId.number}`
                : null)
            }
          />
          <InfoRow
            label="Status"
            val={
              student?.status
                ? student.status[0].toUpperCase() + student.status.slice(1)
                : null
            }
          />
          <InfoRow
            label="Admission Review"
            val={
              student?.admissionReviewCompleted
                ? `Completed ${fmtDate(student.admissionReviewCompletedAt)}`
                : "Pending"
            }
          />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Remarks</div>
        </div>
        <div style={{ padding: "14px 20px" }}>
          <div style={{ fontSize: 12, color: "#44403C", marginBottom: 14 }}>
            {student?.remark || "No remarks on file for this student."}
          </div>
          {(student?.promotionRemarks || []).length > 0 && (
            <>
              <div className="section-heading">Promotion History</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {student.promotionRemarks.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#FAFAF9",
                      border: "1px solid #E7E5E4",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600, color: "#1C1917" }}>
                        {r.remark || "—"}
                      </span>
                      <span style={{ color: "#A8A29E", fontSize: 11 }}>
                        {fmtDate(r.date)}
                      </span>
                    </div>
                    {r.status && <Badge status={r.status} />}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ─── STUDENT DIRECTORY VIEW ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const Student360 = ({ studentId, onBack }) => {
  const {
    student,
    availableSemesters,
    activeSemesterId,
    setActiveSemesterId,
    activeSemesterReport,
    activeLedger,
    financialSummary,
    safeFullName,
    safeFatherName,
    safeRegNo,
    activeTab,
    setActiveTab,
    loading,
    handleExportPDF,
    handleExportWord,
  } = useCOISStudent360(studentId);

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: 400,
          gap: 12,
        }}
      >
        <Spinner size={28} />
        <span style={{ fontSize: 13, color: "#78716C" }}>
          Loading student profile…
        </span>
      </div>
    );

  const initials =
    safeFullName
      ?.split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("") || "ST";

  return (
    <div>
      {/* Header */}
      <div
        className="card"
        style={{
          marginBottom: 16,
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            className="btn btn-ghost"
            style={{ padding: "6px 10px" }}
            onClick={onBack}
          >
            <ArrowLeft size={15} />
          </button>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#EEF2FF",
              color: "#4F46E5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1C1917" }}>
              {safeFullName}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 4,
              }}
            >
              <span
                className="mono"
                style={{
                  background: "#F5F4F1",
                  padding: "2px 7px",
                  borderRadius: 4,
                  color: "#44403C",
                }}
              >
                {safeRegNo}
              </span>
              <span
                className={`badge ${student?.status === "active" ? "badge-paid" : "badge-overdue"}`}
              >
                {student?.status || "unknown"}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {availableSemesters.length > 0 && (
            <select
              className="filter-select"
              value={activeSemesterId || ""}
              onChange={(e) => setActiveSemesterId(e.target.value)}
            >
              {availableSemesters.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name || `Part ${s.number}`}
                </option>
              ))}
            </select>
          )}
          <button className="btn btn-ghost" onClick={handleExportWord}>
            <FileText size={13} /> Export Word
          </button>
          <button
            className="btn btn-ghost"
            style={{ color: "#B91C1C", borderColor: "#FECACA" }}
            onClick={handleExportPDF}
          >
            <FileDown size={13} /> Export PDF
          </button>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}
      >
        {/* Left sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Profile info */}
          {[
            { label: "Father's Name", val: safeFatherName, icon: Users },
            {
              label: "CNIC / B-Form",
              val: student?.personalInfo?.cnic || "N/A",
              icon: FileText,
              mono: true,
            },
            {
              label: "Phone",
              val: student?.personalInfo?.phone || "N/A",
              icon: Phone,
            },
            {
              label: "Email",
              val: student?.personalInfo?.email || "N/A",
              icon: Mail,
            },
          ].reduce((acc, item, i, arr) => {
            if (i === 0)
              acc.push(
                <div className="card" key="personal">
                  <div className="card-header" style={{ padding: "10px 14px" }}>
                    <div className="card-title" style={{ fontSize: 11 }}>
                      Personal Details
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "10px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {arr.map((it, j) => (
                      <div
                        key={j}
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "flex-start",
                        }}
                      >
                        <it.icon
                          size={13}
                          style={{
                            color: "#A8A29E",
                            marginTop: 3,
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.07em",
                              color: "#A8A29E",
                            }}
                          >
                            {it.label}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#1C1917",
                              fontFamily: it.mono
                                ? "IBM Plex Mono, monospace"
                                : "inherit",
                            }}
                          >
                            {it.val}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>,
              );
            return acc;
          }, [])}

          {/* Academic info */}
          <div className="card">
            <div className="card-header" style={{ padding: "10px 14px" }}>
              <div className="card-title" style={{ fontSize: 11 }}>
                Academic
              </div>
            </div>
            <div
              style={{
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {[
                { label: "Program", val: student?.programId?.name || "N/A" },
                {
                  label: "Class",
                  val: student?.departmentId?.name || "N/A",
                },
                {
                  label: "Session",
                  val: student?.termId?.name || "N/A",
                },
                {
                  label: "Part",
                  val:
                    student?.semesterId?.name ||
                    (student?.semesterId?.number
                      ? `Part ${student.semesterId.number}`
                      : "N/A"),
                },
              ].map((it, i) => (
                <div key={i}>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      color: "#A8A29E",
                    }}
                  >
                    {it.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#1C1917",
                      marginTop: 1,
                    }}
                  >
                    {it.val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial summary */}
          <div className="card">
            <div className="card-header" style={{ padding: "10px 14px" }}>
              <div className="card-title" style={{ fontSize: 11 }}>
                Financial Summary
              </div>
            </div>
            <div
              style={{
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {[
                {
                  label: "Total Invoiced",
                  val: financialSummary.totalGenerated,
                  color: "#4F46E5",
                },
                {
                  label: "Total Paid",
                  val: financialSummary.totalPaid,
                  color: "#22C55E",
                },
                {
                  label: "Outstanding",
                  val: financialSummary.totalPending,
                  color: "#EF4444",
                },
                {
                  label: "Late Fines",
                  val: financialSummary.totalFine,
                  color: "#D97706",
                },
                {
                  label: "Discounts",
                  val: financialSummary.totalScholarship,
                  color: "#8B5CF6",
                },
              ].map((it, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: "#78716C" }}>{it.label}</span>
                  <span style={{ fontWeight: 700, color: it.color }}>
                    Rs. {it.val.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right content */}
        <div>
          <div className="card">
            <div className="tab-bar">
              {[
                { id: "dashboard", label: "Dashboard" },
                { id: "ledger", label: "Ledger" },
                { id: "academics", label: "Profile & Remarks" },
              ].map((t) => (
                <button
                  key={t.id}
                  className={`tab-btn ${activeTab === t.id ? "active" : ""}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {activeTab === "dashboard" &&
              (activeSemesterReport ? (
                <COISSemesterReport report={activeSemesterReport} />
              ) : (
                <EmptyState
                  icon={Receipt}
                  title="No section data available for this student"
                />
              ))}

            {activeTab === "ledger" && (
              <COISLedgerTable challans={activeLedger} />
            )}

            {activeTab === "academics" && <COISProfileInfo student={student} />}
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentDirectoryView = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedProg, setSelectedProg] = useState("");
  const [selectedPart, setSelectedPart] = useState("");

  useEffect(() => {
    const h = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(h);
  }, [search]);

  const { data: termData } = useGetTermsQuery();
  const { data: deptData } = useGetDepartmentsQuery();

  // Auto-detect & lock this directory to the College/Intermediate Studies
  // department — this module only ever manages HSSC/College students.
  useEffect(() => {
    if (deptData?.data && !selectedDept) {
      const coisDept = deptData.data.find(
        (d) =>
          d.name?.toLowerCase().includes("college") ||
          d.name?.toLowerCase().includes("intermediate") ||
          d.departmentName?.toLowerCase().includes("college"),
      );
      if (coisDept) setSelectedDept(coisDept._id);
      else if (deptData.data.length > 0) setSelectedDept(deptData.data[0]._id);
    }
  }, [deptData, selectedDept]);

  // context: "college" scopes this to HSSC-level programs only (by
  // Program.level), regardless of department — the reliable way to keep
  // this directory college-only, since it doesn't depend on department name
  // matching or on `selectedDept` having resolved yet.
  const { data: progData } = useGetProgramsByDepartmentQuery({
    context: "college",
    limit: 200,
  });

  const termOptions =
    termData?.data?.map((t) => ({ label: t.name || t.termName, value: t._id })) ||
    [];
  const progOptions =
    progData?.data?.map((p) => ({ label: p.name || p.programName, value: p._id })) ||
    [];
  // HSSC programs always have exactly two parts — no need to look these up
  // per-program, and this lets the filter work before/without picking one.
  const PART_OPTIONS = [
    { label: "Part 1", value: "1" },
    { label: "Part 2", value: "2" },
  ];

  const { openAlert } = useGlobalAlert();
  const [fetchMasterReport, { isFetching: isMasterExporting }] =
    useLazyGetMasterFinancialReportQuery();

  // Master file download — same report design as the University portal
  // (styled Student Summary + Installment Schedule + All Challans sheets),
  // scoped to whatever Session/Program this directory is currently
  // filtered to, matching where the University's Student Profile page puts
  // this same control (a header button next to the student search/filters).
  const handleExportMasterExcel = async () => {
    try {
      openAlert({
        message: "Generating Master Report. This may take a moment...",
        severity: "info",
      });
      const res = await fetchMasterReport({
        departmentId: selectedDept,
        programId: selectedProg,
        termId: selectedTerm,
        scope: "college",
        feeTypes: "tuition,admission,exam,misc",
      }).unwrap();
      const { summaryRows = [], challanRows = [] } = res?.data || {};

      if (summaryRows.length === 0)
        return openAlert({
          message: "No data found for Master Report.",
          severity: "warning",
        });

      const blob = await buildMasterFinancialWorkbook(summaryRows, challanRows);
      downloadBlob(
        blob,
        `COIS_Master_Financial_Report_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      openAlert({
        message: "Master Report Downloaded Successfully!",
        severity: "success",
      });
    } catch {
      openAlert({
        message: "Failed to generate Master Report",
        severity: "error",
      });
    }
  };

  const { data: studentsRes, isLoading } = useGetStudentsQuery({
    search: debouncedSearch,
    departmentId: selectedDept,
    programId: selectedProg,
    semesterNumber: selectedPart,
    termId: selectedTerm,
    limit: 50,
  });
  let studentsList =
    studentsRes?.data?.data ||
    studentsRes?.data?.students ||
    (Array.isArray(studentsRes?.data) ? studentsRes.data : []);

  if (selectedStudentId)
    return (
      <Student360
        studentId={selectedStudentId}
        onBack={() => setSelectedStudentId(null)}
      />
    );

  return (
    <div>
      <div
        className="card"
        style={{
          display: "flex",
          overflow: "hidden",
          height: "calc(100vh - 140px)",
        }}
      >
        <FilterSidebar title="Filter Students">
          <FilterGroup label="Session">
            <select
              className="filter-select"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
            >
              <option value="">All Sessions</option>
              {termOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FilterGroup>
          <FilterGroup label="Program">
            <select
              className="filter-select"
              value={selectedProg}
              onChange={(e) => setSelectedProg(e.target.value)}
            >
              <option value="">All Programs</option>
              {progOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FilterGroup>
          <FilterGroup label="Part">
            <select
              className="filter-select"
              value={selectedPart}
              onChange={(e) => setSelectedPart(e.target.value)}
            >
              <option value="">All Parts</option>
              {PART_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FilterGroup>
        </FilterSidebar>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #E7E5E4",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div className="search-wrap" style={{ width: 320 }}>
              <Search size={14} />
              <input
                className="search-input"
                placeholder="Search by name, roll no, or CNIC…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleExportMasterExcel}
              disabled={isMasterExporting}
            >
              {isMasterExporting ? (
                <Spinner size={13} />
              ) : (
                <DownloadCloud size={13} />
              )}
              Master Data
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {isLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 300,
                }}
              >
                <Spinner size={24} />
              </div>
            ) : studentsList.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No students found"
                sub="Try adjusting your search or filters."
              />
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 10,
                }}
              >
                {studentsList.map((s) => {
                  const name = s.personalInfo?.fullName || "Unknown";
                  return (
                    <div
                      key={s._id}
                      className="card"
                      style={{
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        cursor: "pointer",
                        transition: "border-color 0.12s",
                      }}
                      onClick={() => setSelectedStudentId(s._id)}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.borderColor = "#4F46E5")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.borderColor = "#E7E5E4")
                      }
                    >
                      <Avatar name={name} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: "#1C1917",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {name}
                        </div>
                        <div
                          className="mono"
                          style={{ marginTop: 2, color: "#78716C" }}
                        >
                          {s.studentId}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#A8A29E",
                            marginTop: 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.programId?.name || "No program"}
                        </div>
                      </div>
                      <ChevronRight
                        size={14}
                        style={{ color: "#D6D3D1", flexShrink: 0 }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ─── FEE SETUP VIEW ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const FEE_TABS = [
  { label: "Tuition", icon: GraduationCap },
  { label: "Admission", icon: FileText },
  { label: "Re-Admission", icon: Receipt },
  { label: "Exam", icon: BookMarked },
  { label: "Misc", icon: Sparkles },
];

// Full-text popup for a truncated remark cell — clicking the eye icon
// opens this instead of relying on a browser hover tooltip, which doesn't
// work on touch and cuts long remarks off with no way to read the rest.
const RemarkViewModal = ({ isOpen, onClose, title, remark }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{title || "Remark"}</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#78716C",
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: "#44403C",
              whiteSpace: "pre-wrap",
              margin: 0,
            }}
          >
            {remark || "No remark on file."}
          </p>
        </div>
      </div>
    </div>
  );
};

const COISFeeModal = ({
  isOpen,
  onClose,
  onSubmit,
  watch,
  setValue,
  activeTab,
  generateBreakdown,
  isEditing,
}) => {
  const [isAutoMode, setIsAutoMode] = useState(true);
  const totalAmount = Number(watch("totalAmount") || 0);
  const securityFee = Number(watch("securityFee") || 0);
  const feeItems = watch("feeItems") || [];

  useEffect(() => {
    if (isAutoMode && isOpen && (totalAmount > 0 || securityFee > 0)) {
      setValue(
        "feeItems",
        generateBreakdown(totalAmount, activeTab, securityFee),
      );
    }
  }, [
    totalAmount,
    securityFee,
    isAutoMode,
    activeTab,
    isOpen,
    generateBreakdown,
    setValue,
  ]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h3>{isEditing ? "Update Fee Structure" : "Set Fee Structure"}</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#78716C",
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={onSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Total Amount (PKR)</label>
              <input
                type="number"
                className="form-input"
                style={{ fontSize: 18, fontWeight: 700 }}
                placeholder="e.g. 45000"
                onChange={(e) => setValue("totalAmount", e.target.value)}
              />
            </div>
            {activeTab === 1 && (
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Security Deposit (PKR)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 5000"
                  onChange={(e) => setValue("securityFee", e.target.value)}
                />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Remark</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Approved by admin, adjusted for scholarship…"
                value={watch("remarks") || ""}
                onChange={(e) => setValue("remarks", e.target.value)}
              />
            </div>

            <div
              style={{
                background: "#FAFAF9",
                border: "1px solid #E7E5E4",
                borderRadius: 8,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: "#A8A29E",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Zap size={12} style={{ color: "#D97706" }} /> Breakdown
                </span>
                <Switch
                  size="small"
                  checked={isAutoMode}
                  onChange={(e) => setIsAutoMode(e.target.checked)}
                />
              </div>
              {feeItems.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    padding: "4px 0",
                    borderBottom:
                      i < feeItems.length - 1 ? "1px solid #E7E5E4" : "none",
                  }}
                >
                  <span style={{ color: "#44403C" }}>{item.headName}</span>
                  <span style={{ fontWeight: 700, color: "#4F46E5" }}>
                    Rs. {item.amount.toLocaleString()}
                  </span>
                </div>
              ))}
              {feeItems.length === 0 && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#A8A29E",
                    textAlign: "center",
                    padding: "8px 0",
                  }}
                >
                  Enter an amount to preview breakdown
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "10px 14px",
              }}
            >
              <Save size={14} /> {isEditing ? "Update Structure" : "Save Structure"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const FeeSetupView = () => {
  const {
    showGeneratorPage,
    setShowGeneratorPage,
    proceedToGenerator,
    activeTab,
    setActiveTab,
    selectedStudents,
    toggleStudentSelect,
    selectAll,
    studentsList = [],
    loadMoreStudents,
    loadingStudents,
    termOptions = [],
    selectedTerm,
    setSelectedTerm,
    progOptions = [],
    selectedProg,
    handleProgChange,
    partOptions = [],
    selectedPart,
    setSelectedPart,
    studentSearch,
    setStudentSearch,
    tableData = [],
    previousPartTableData = [],
    currentPartNumber,
    handleAdd,
    handleEdit,
    handleDelete,
    editingId,
    modalState,
    closeModal,
    onSubmit,
    watch,
    setValue,
    generateBreakdown,
  } = useCOISFeeSetup();

  const [viewingRemark, setViewingRemark] = useState(null);

  const sentinelRef = useRef(null);
  const loaderCb = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && !loadingStudents) loadMoreStudents();
    },
    [loadingStudents, loadMoreStudents],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(loaderCb, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loaderCb]);

  if (showGeneratorPage) {
    const isBulk = selectedStudents.length > 1;
    return (
      <div>
        <div
          className="page-header"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <button
            className="btn btn-ghost"
            style={{ padding: "6px 10px" }}
            onClick={() => setShowGeneratorPage(false)}
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1>Assign Fee Structure</h1>
            <p>
              {selectedStudents.length} student
              {selectedStudents.length > 1 ? "s" : ""} selected
            </p>
          </div>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {/* Read-only — the Part a fee gets tagged with is always the
                selected student's own current Part, never a manual choice,
                so a Part 1 student can never be assigned a Part 2 fee. */}
            {currentPartNumber != null && (
              <span className="badge badge-info">
                Part {currentPartNumber}
              </span>
            )}
            <span className="badge badge-info">
              {selectedStudents.length} selected
            </span>
            <button className="btn btn-primary" onClick={handleAdd}>
              {isBulk ? "Assign Bulk Fee" : "Assign Fee"}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="tab-bar">
            {FEE_TABS.map((tab, idx) => (
              <button
                key={idx}
                className={`tab-btn ${activeTab === idx ? "active" : ""}`}
                onClick={() => setActiveTab(idx)}
              >
                <tab.icon size={13} /> {tab.label}
              </button>
            ))}
          </div>

          <div style={{ minHeight: 320 }}>
            {isBulk ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "60px 24px",
                  textAlign: "center",
                }}
              >
                <Layers
                  size={36}
                  style={{ color: "#E7E5E4", marginBottom: 12 }}
                />
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#1C1917",
                    marginBottom: 6,
                  }}
                >
                  Bulk Assignment Mode
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: "#78716C",
                    maxWidth: 340,
                    margin: 0,
                  }}
                >
                  You're assigning a fee structure to {selectedStudents.length}{" "}
                  students simultaneously. Click "Assign Bulk Fee" to continue.
                </p>
              </div>
            ) : (
              <>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fee Category</th>
                      <th>Total Amount</th>
                      <th>Remark</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.length === 0 ? (
                      <tr>
                        <td colSpan={4}>
                          <EmptyState
                            icon={FileText}
                            title="No fees assigned for this category"
                          />
                        </td>
                      </tr>
                    ) : (
                      tableData.map((fee, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{fee.category}</td>
                          <td style={{ fontWeight: 700, color: "#4F46E5" }}>
                            Rs. {fee.totalAmount?.toLocaleString()}
                          </td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <span
                                style={{
                                  color: "#78716C",
                                  maxWidth: 160,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {fee.remarks || "—"}
                              </span>
                              {fee.remarks && (
                                <button
                                  className="btn btn-ghost"
                                  style={{ padding: "2px 5px", flexShrink: 0 }}
                                  title="View full remark"
                                  onClick={() =>
                                    setViewingRemark({
                                      title: `Remark — ${fee.category}`,
                                      text: fee.remarks,
                                    })
                                  }
                                >
                                  <Eye size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 6,
                              }}
                            >
                              <button
                                className="btn btn-ghost"
                                style={{ padding: "4px 7px" }}
                                title="Update this fee"
                                onClick={() => handleEdit(fee)}
                              >
                                <Edit size={13} />
                              </button>
                              <button
                                className="btn btn-ghost"
                                style={{ padding: "4px 7px", color: "#EF4444" }}
                                title="Delete this fee"
                                onClick={() => handleDelete(fee)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {previousPartTableData.length > 0 && (
                  <div style={{ padding: "16px 20px", borderTop: "1px solid #E7E5E4" }}>
                    <div className="section-heading">
                      Previous Setup — Part {currentPartNumber - 1} (read-only)
                    </div>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Fee Category</th>
                          <th>Total Amount</th>
                          <th>Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previousPartTableData.map((fee, i) => (
                          <tr key={i} style={{ opacity: 0.75 }}>
                            <td style={{ fontWeight: 600 }}>{fee.category}</td>
                            <td style={{ fontWeight: 700, color: "#78716C" }}>
                              Rs. {fee.totalAmount?.toLocaleString()}
                            </td>
                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <span
                                  style={{
                                    color: "#78716C",
                                    maxWidth: 160,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {fee.remarks || "—"}
                                </span>
                                {fee.remarks && (
                                  <button
                                    className="btn btn-ghost"
                                    style={{ padding: "2px 5px", flexShrink: 0 }}
                                    title="View full remark"
                                    onClick={() =>
                                      setViewingRemark({
                                        title: `Remark — ${fee.category} (Part ${currentPartNumber - 1})`,
                                        text: fee.remarks,
                                      })
                                    }
                                  >
                                    <Eye size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <COISFeeModal
          isOpen={modalState?.isOpen && modalState?.name === "studentFeeModal"}
          onClose={closeModal}
          activeTab={activeTab}
          onSubmit={onSubmit}
          watch={watch}
          setValue={setValue}
          generateBreakdown={generateBreakdown}
          isEditing={!!editingId}
        />
        <RemarkViewModal
          isOpen={!!viewingRemark}
          onClose={() => setViewingRemark(null)}
          title={viewingRemark?.title}
          remark={viewingRemark?.text}
        />
      </div>
    );
  }

  return (
    <div>
      <div
        className="card"
        style={{
          display: "flex",
          overflow: "hidden",
          height: "calc(100vh - 140px)",
        }}
      >
        <FilterSidebar title="Filter Students">
          <FilterGroup label="Academic Session">
            <select
              className="filter-select"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
            >
              <option value="">All Sessions</option>
              {termOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FilterGroup>
          <FilterGroup label="Program">
            <select
              className="filter-select"
              value={selectedProg}
              onChange={(e) => handleProgChange(e.target.value)}
            >
              <option value="">All Programs</option>
              {progOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FilterGroup>
          {/* HSSC programs always have exactly two Parts — shown directly,
              no Program selection required first. */}
          <FilterGroup label="Part">
            <select
              className="filter-select"
              value={selectedPart}
              onChange={(e) => setSelectedPart(e.target.value)}
            >
              <option value="">All Parts</option>
              {partOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FilterGroup>
        </FilterSidebar>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #E7E5E4",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div className="search-wrap" style={{ width: 280 }}>
              <Search size={14} />
              <input
                className="search-input"
                placeholder="Search roll number or name…"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary"
              disabled={selectedStudents.length === 0}
              onClick={proceedToGenerator}
            >
              Proceed to Setup <ChevronRight size={13} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>
                    <Checkbox size="small" onChange={selectAll} />
                  </th>
                  <th>Reg ID</th>
                  <th>Student</th>
                  <th>Father Name</th>
                  <th>Program</th>
                  <th>Part</th>
                  <th>Session</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {studentsList.map((student) => {
                  const isSelected = selectedStudents.some(
                    (s) => s._id === student._id,
                  );
                  return (
                    <tr
                      key={student._id}
                      className={isSelected ? "row-selected" : ""}
                      onClick={() => toggleStudentSelect(student)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <Checkbox size="small" checked={isSelected} readOnly />
                      </td>
                      <td>
                        <span className="mono">{student.studentId}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {student.personalInfo?.fullName || "N/A"}
                      </td>
                      <td style={{ color: "#78716C" }}>
                        {student.familyInfo?.fatherName || "N/A"}
                      </td>
                      <td style={{ color: "#78716C" }}>
                        {student.programId?.name || "—"}
                      </td>
                      <td>
                        {student.semesterId?.number
                          ? `Part ${student.semesterId.number}`
                          : "—"}
                      </td>
                      <td style={{ color: "#78716C" }}>
                        {student.termId?.name || "—"}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              color: "#78716C",
                              maxWidth: 130,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {student.remark || "—"}
                          </span>
                          {student.remark && (
                            <button
                              className="btn btn-ghost"
                              style={{ padding: "2px 5px", flexShrink: 0 }}
                              title="View full remark"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingRemark({
                                  title: `Remark — ${student.personalInfo?.fullName || student.studentId}`,
                                  text: student.remark,
                                });
                              }}
                            >
                              <Eye size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div ref={sentinelRef} style={{ height: 8 }} />
            {loadingStudents && (
              <div
                style={{
                  padding: 16,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Spinner size={18} />
              </div>
            )}
          </div>
        </div>
      </div>
      <RemarkViewModal
        isOpen={!!viewingRemark}
        onClose={() => setViewingRemark(null)}
        title={viewingRemark?.title}
        remark={viewingRemark?.text}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ─── CHALLAN VIEW ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const ChallanView = () => {
  const {
    generationMode,
    setGenerationMode,
    selectedStudent,
    setSelectedStudent,
    selectedBulkStudents,
    setSelectedBulkStudents,
    terms,
    programs,
    miscFeesList,
    selectedTerm,
    setSelectedTerm,
    selectedProg,
    handleProgChange,
    selectedPart,
    setSelectedPart,
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
    isInstStudent,
    totalInst,
    nextAutoInstallment,
    installmentOptions,
    setSelectedInstallmentNumber,
    effectiveInstallmentNumber,
    effectiveInstallmentOption,
    savedSingleBillingMonth,
    anyBulkSelectedHasInstallmentPlan,
  } = useCOISChallan();

  const sentinelRef = useRef(null);
  const loaderCallback = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !isStudentsLoading)
        loadMoreStudents();
    },
    [hasMore, isStudentsLoading, loadMoreStudents],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(loaderCallback, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loaderCallback]);

  const allVisibleSelected =
    studentsList.length > 0 &&
    studentsList.every((s) =>
      selectedBulkStudents.some((sel) => sel._id === s._id),
    );

  // ── Mode toggle & config panel
  const [singleDueDate, setSingleDueDate] = useState("");
  // Only used when the student is NOT on a real installment plan (no
  // preference, or exactly 1 "installment" — which is really just a single
  // full payment, not a split plan). A student with a real multi-part plan
  // instead gets a locked, auto-derived Billing Month below — this one is
  // freely chosen and never marks the challan as an installment.
  const [singleBillingMonth, setSingleBillingMonth] = useState("");
  // Pre-fill from this student's own saved whole-fee Billing Month (if any)
  // whenever the selection changes — otherwise this always came up blank
  // showing every month as an undifferentiated option, with no indication
  // of which one actually applies to this student. Resets to blank for a
  // student with no saved month, so it never carries over a previous
  // student's stale value.
  useEffect(() => {
    setSingleBillingMonth(savedSingleBillingMonth || "");
  }, [selectedStudent?._id, savedSingleBillingMonth]);
  const [singleFeeTypes, setSingleFeeTypes] = useState({
    tuition: true,
    exam: false,
    admission: false,
    readmission: false,
  });
  // Global Miscellaneous Fees (Fee Setup's global catalog, applies to any
  // student) — independent of `feeTypes`, `generate()` folds these in by
  // ID regardless of what fee-type checkboxes are ticked, so this is its
  // own selection list, not another feeTypes key.
  const [singleMiscFees, setSingleMiscFees] = useState([]);
  // When on, Tuition/Exam/Admission/Readmission are excluded entirely so
  // the challan is built ONLY from the picked Misc Fee(s) — without this,
  // "Tuition" stays checked by default and its own fee structure (which
  // can have several fee-head line items, e.g. one literally named
  // "General") gets pulled in alongside the misc fee, quietly inflating
  // the total and burying the misc fee's real name under an unrelated
  // "General" line from the tuition structure.
  const [singleMiscOnly, setSingleMiscOnly] = useState(false);
  // Cleared on every student switch — otherwise a misc fee ticked for one
  // student stayed checked (and got billed) on the NEXT student selected,
  // since nothing else in this form resets it.
  useEffect(() => {
    setSingleMiscFees([]);
    setSingleMiscOnly(false);
  }, [selectedStudent?._id]);
  const [bulkDate, setBulkDate] = useState("");
  const [bulkBillingMonth, setBulkBillingMonth] = useState("");
  const [bulkFeeTypes, setBulkFeeTypes] = useState({
    tuition: true,
    exam: false,
    admission: false,
    readmission: false,
  });
  const [bulkMiscFees, setBulkMiscFees] = useState([]);
  const [bulkMiscOnly, setBulkMiscOnly] = useState(false);

  // ── Per-challan action modals (Mark Paid / Extend Date / Discount /
  // Split into Installments / View Detail). `tableActions` from the hook
  // already has the real mutations wired (deleteChallan, markPaid, etc.),
  // but under different key names than what <ChallanTable> actually calls
  // (onPay/onEditDate/onDiscount/onInstallment/onDelete/onPrint) — every
  // action button was silently doing nothing since none of those keys
  // existed on the object it was given. This bridges the two, mirroring
  // the University side's StudentDetailView wiring.
  const [payingId, setPayingId] = useState(null);
  const [instData, setInstData] = useState(null);
  const [editDateData, setEditDateData] = useState(null);
  const [discountData, setDiscountData] = useState(null);
  const [detailData, setDetailData] = useState(null);

  const handlePrintChallan = (id) => {
    const challan = studentChallans.find((c) => c._id === id);
    if (!challan) return;
    openPrintWindow(buildChallanPage(challan), `Fee Challan - ${challan.challanNo}`);
  };

  const handleTableActions = {
    onPay: (id) => setPayingId(id),
    onDelete: (id) => tableActions.deleteChallan(id),
    onPrint: (id) => handlePrintChallan(id),
    onInstallment: (id) => {
      const c = studentChallans.find((x) => x._id === id);
      if (c) setInstData({ id: c._id, total: c.netAmount });
    },
    onEditDate: (id) => {
      const c = studentChallans.find((x) => x._id === id);
      if (c) setEditDateData({ id: c._id, date: c.dueDate });
    },
    onDiscount: (id) => {
      const c = studentChallans.find((x) => x._id === id);
      if (c) setDiscountData(c);
    },
    onViewDetail: (challan) => setDetailData(challan),
  };

  return (
    <div>
      <div
        className="page-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1>Challan Generation</h1>
          <p>Generate fee challans for individual or bulk students</p>
        </div>
        <div
          style={{
            display: "flex",
            background: "#F5F4F1",
            borderRadius: 8,
            padding: 3,
            gap: 2,
          }}
        >
          {["single", "bulk"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setGenerationMode(m);
                setSelectedStudent(null);
                setSelectedBulkStudents([]);
              }}
              style={{
                padding: "6px 16px",
                borderRadius: 6,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: generationMode === m ? "#FFFFFF" : "transparent",
                color: generationMode === m ? "#1C1917" : "#78716C",
                boxShadow:
                  generationMode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.12s",
              }}
            >
              {m === "single" ? "Single" : "Bulk"}
            </button>
          ))}
        </div>
      </div>

      <div
        className="card"
        style={{
          display: "flex",
          overflow: "hidden",
          height: "calc(100vh - 220px)",
        }}
      >
        {/* Config sidebar */}
        <div
          style={{
            width: 224,
            flexShrink: 0,
            background: "#FAFAF9",
            borderRight: "1px solid #E7E5E4",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{ padding: "12px 14px", borderBottom: "1px solid #E7E5E4" }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1C1917" }}>
              {generationMode === "single"
                ? "Generation Options"
                : "Bulk Options"}
            </div>
          </div>
          <div
            style={{
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              flex: 1,
              overflowY: "auto",
            }}
          >
            {/* Filters — hidden once a specific student is already picked
                in Single mode, since they no longer apply: generation is
                now scoped to that one student, not a filtered list. */}
            {!(generationMode === "single" && selectedStudent) && (
              <>
                <FilterGroup label="Session">
                  <select
                    className="filter-select"
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                  >
                    <option value="">All Sessions</option>
                    {terms.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </FilterGroup>
                <FilterGroup label="Program">
                  <select
                    className="filter-select"
                    value={selectedProg}
                    onChange={(e) => handleProgChange(e.target.value)}
                  >
                    <option value="">All Programs</option>
                    {programs.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name || p.programName}
                      </option>
                    ))}
                  </select>
                </FilterGroup>
                {/* HSSC programs always have exactly two Parts — shown
                    directly, no Program selection required first. */}
                <FilterGroup label="Part">
                  <select
                    className="filter-select"
                    value={selectedPart}
                    onChange={(e) => setSelectedPart(e.target.value)}
                  >
                    <option value="">All Parts</option>
                    <option value="1">Part 1</option>
                    <option value="2">Part 2</option>
                  </select>
                </FilterGroup>
              </>
            )}

            {generationMode === "single" && selectedStudent ? (
              <>
                <div style={{ borderTop: "1px solid #E7E5E4", paddingTop: 14 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      color: "#A8A29E",
                      marginBottom: 6,
                    }}
                  >
                    Generating For
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Avatar
                      name={selectedStudent.personalInfo?.fullName || ""}
                      size={28}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#1C1917",
                        }}
                      >
                        {selectedStudent.personalInfo?.fullName}
                      </div>
                      <div className="mono" style={{ color: "#78716C" }}>
                        {selectedStudent.studentId}
                      </div>
                    </div>
                  </div>
                </div>
                <FilterGroup label="Due Date">
                  <input
                    type="date"
                    className="filter-select"
                    value={singleDueDate}
                    onChange={(e) => setSingleDueDate(e.target.value)}
                  />
                </FilterGroup>
                {isInstStudent ? (
                  <FilterGroup label="Installment">
                    <select
                      className="filter-select"
                      value={effectiveInstallmentNumber}
                      onChange={(e) =>
                        setSelectedInstallmentNumber(Number(e.target.value))
                      }
                      style={{
                        borderColor: effectiveInstallmentOption?.isGenerated
                          ? "#FCA5A5"
                          : undefined,
                        background: effectiveInstallmentOption?.isGenerated
                          ? "#FEF2F2"
                          : "#EEF2FF",
                        color: effectiveInstallmentOption?.isGenerated
                          ? "#B91C1C"
                          : "#4F46E5",
                        fontWeight: 700,
                      }}
                    >
                      {installmentOptions.map((opt) => (
                        <option key={opt.number} value={opt.number}>
                          Installment #{opt.number} of {totalInst} —{" "}
                          {opt.month || "Not scheduled"}
                          {opt.isGenerated
                            ? opt.isPaid
                              ? " (Already Paid)"
                              : " (Already Generated)"
                            : opt.number === nextAutoInstallment
                              ? " (Next Due)"
                              : ""}
                        </option>
                      ))}
                    </select>
                  </FilterGroup>
                ) : savedSingleBillingMonth ? (
                  // A whole-fee (non-installment) student can still have a
                  // saved Billing Month, configured the same way as an
                  // installment's — locked exactly like one, so a challan
                  // can't be generated for a different month than what was
                  // actually configured for this student.
                  <FilterGroup label="Billing Month">
                    <div
                      style={{
                        padding: "7px 10px",
                        borderRadius: 7,
                        border: "1px solid #E7E5E4",
                        background: "#EEF2FF",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#4F46E5",
                      }}
                    >
                      {savedSingleBillingMonth}
                    </div>
                  </FilterGroup>
                ) : (
                  // Nothing configured at all yet — the only case where the
                  // month is freely chosen rather than locked to a real
                  // configured value.
                  <FilterGroup label="Billing Month">
                    <select
                      className="filter-select"
                      value={singleBillingMonth}
                      onChange={(e) => setSingleBillingMonth(e.target.value)}
                    >
                      <option value="">Not applicable / not scheduled</option>
                      {INSTALLMENT_MONTHS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </FilterGroup>
                )}
                <FilterGroup label="Fee Types">
                  {["tuition", "exam", "admission", "readmission"].map((t) => (
                    <label
                      key={t}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        cursor: singleMiscOnly ? "not-allowed" : "pointer",
                        padding: "4px 0",
                        fontSize: 12,
                        fontWeight: 500,
                        color: singleMiscOnly ? "#A8A29E" : "#44403C",
                        textTransform: "capitalize",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={singleFeeTypes[t]}
                        disabled={singleMiscOnly}
                        onChange={() =>
                          setSingleFeeTypes((p) => ({ ...p, [t]: !p[t] }))
                        }
                        style={{ accentColor: "#4F46E5" }}
                      />
                      {t}
                    </label>
                  ))}
                </FilterGroup>
                {miscFeesList.length > 0 && (
                  <FilterGroup label="Miscellaneous Fees">
                    {miscFeesList.map((f) => (
                      <label
                        key={f._id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 7,
                          cursor: "pointer",
                          padding: "4px 0",
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#44403C",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <input
                            type="checkbox"
                            checked={singleMiscFees.includes(f._id)}
                            onChange={() =>
                              setSingleMiscFees((prev) =>
                                prev.includes(f._id)
                                  ? prev.filter((id) => id !== f._id)
                                  : [...prev, f._id],
                              )
                            }
                            style={{ accentColor: "#4F46E5" }}
                          />
                          {f.title || f.name}
                        </span>
                        <span style={{ color: "#78716C" }}>Rs. {f.amount}</span>
                      </label>
                    ))}
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        cursor: "pointer",
                        padding: "6px 0 2px",
                        marginTop: 4,
                        borderTop: "1px dashed #E7E5E4",
                        fontSize: 11,
                        fontWeight: 700,
                        color: singleMiscOnly ? "#B91C1C" : "#78716C",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={singleMiscOnly}
                        onChange={(e) => setSingleMiscOnly(e.target.checked)}
                        style={{ accentColor: "#B91C1C" }}
                      />
                      Bill ONLY these Misc Fees (skip Tuition/Exam/etc.)
                    </label>
                  </FilterGroup>
                )}
                <button
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  disabled={
                    isProcessing ||
                    (!singleMiscOnly &&
                      isInstStudent &&
                      effectiveInstallmentOption?.isGenerated) ||
                    (singleMiscOnly && singleMiscFees.length === 0)
                  }
                  onClick={() =>
                    handleGenerateSingle({
                      dueDate: singleDueDate,
                      feeTypes: singleMiscOnly
                        ? []
                        : Object.keys(singleFeeTypes).filter((k) => singleFeeTypes[k]),
                      miscFeeIds: singleMiscFees,
                      // Only for non-installment students — a real
                      // installment plan's Billing Month stays the locked,
                      // auto-derived one from the hook and must not be
                      // overridden here.
                      ...(!isInstStudent && !singleMiscOnly
                        ? { billingMonth: singleBillingMonth || null }
                        : {}),
                    })
                  }
                >
                  {isProcessing ? <Spinner size={13} /> : <Receipt size={13} />}{" "}
                  Generate Challan
                </button>
              </>
            ) : generationMode === "bulk" ? (
              <>
                <div style={{ borderTop: "1px solid #E7E5E4", paddingTop: 12 }}>
                  <div
                    style={{ fontSize: 11, color: "#78716C", fontWeight: 500 }}
                  >
                    {selectedBulkStudents.length} student
                    {selectedBulkStudents.length !== 1 ? "s" : ""} selected
                  </div>
                </div>
                <FilterGroup label="Due Date">
                  <input
                    type="date"
                    className="filter-select"
                    value={bulkDate}
                    onChange={(e) => setBulkDate(e.target.value)}
                  />
                </FilterGroup>
                {/* Always pickable, not just when an installment plan is
                    detected — a whole-fee student can also have their own
                    saved month, and the backend enforces per-student that
                    whatever's picked here matches each student's own
                    configured month (skipping — not blocking the whole
                    batch — any student it doesn't match). */}
                <FilterGroup
                  label={`Billing Month${anyBulkSelectedHasInstallmentPlan ? " *" : ""}`}
                >
                  <select
                    className="filter-select"
                    value={bulkBillingMonth}
                    onChange={(e) => setBulkBillingMonth(e.target.value)}
                  >
                    <option value="">Select month…</option>
                    {INSTALLMENT_MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </FilterGroup>
                <FilterGroup label="Fee Types">
                  {["tuition", "exam", "admission", "readmission"].map((t) => (
                    <label
                      key={t}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        cursor: bulkMiscOnly ? "not-allowed" : "pointer",
                        padding: "4px 0",
                        fontSize: 12,
                        fontWeight: 500,
                        color: bulkMiscOnly ? "#A8A29E" : "#44403C",
                        textTransform: "capitalize",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={bulkFeeTypes[t]}
                        disabled={bulkMiscOnly}
                        onChange={() =>
                          setBulkFeeTypes((p) => ({ ...p, [t]: !p[t] }))
                        }
                        style={{ accentColor: "#4F46E5" }}
                      />
                      {t}
                    </label>
                  ))}
                </FilterGroup>
                {miscFeesList.length > 0 && (
                  <FilterGroup label="Miscellaneous Fees">
                    {miscFeesList.map((f) => (
                      <label
                        key={f._id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 7,
                          cursor: "pointer",
                          padding: "4px 0",
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#44403C",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <input
                            type="checkbox"
                            checked={bulkMiscFees.includes(f._id)}
                            onChange={() =>
                              setBulkMiscFees((prev) =>
                                prev.includes(f._id)
                                  ? prev.filter((id) => id !== f._id)
                                  : [...prev, f._id],
                              )
                            }
                            style={{ accentColor: "#4F46E5" }}
                          />
                          {f.title || f.name}
                        </span>
                        <span style={{ color: "#78716C" }}>Rs. {f.amount}</span>
                      </label>
                    ))}
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        cursor: "pointer",
                        padding: "6px 0 2px",
                        marginTop: 4,
                        borderTop: "1px dashed #E7E5E4",
                        fontSize: 11,
                        fontWeight: 700,
                        color: bulkMiscOnly ? "#B91C1C" : "#78716C",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={bulkMiscOnly}
                        onChange={(e) => setBulkMiscOnly(e.target.checked)}
                        style={{ accentColor: "#B91C1C" }}
                      />
                      Bill ONLY these Misc Fees (skip Tuition/Exam/etc.)
                    </label>
                  </FilterGroup>
                )}
                <button
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  disabled={
                    isProcessing ||
                    selectedBulkStudents.length === 0 ||
                    (bulkMiscOnly && bulkMiscFees.length === 0) ||
                    (!bulkMiscOnly &&
                      anyBulkSelectedHasInstallmentPlan &&
                      !bulkBillingMonth)
                  }
                  onClick={() =>
                    handleGenerateBulk({
                      dueDate: bulkDate,
                      billingMonth: bulkMiscOnly ? null : bulkBillingMonth || null,
                      feeTypes: bulkMiscOnly
                        ? []
                        : Object.keys(bulkFeeTypes).filter((k) => bulkFeeTypes[k]),
                      miscFeeIds: bulkMiscFees,
                    })
                  }
                >
                  {isProcessing ? <Spinner size={13} /> : <Layers size={13} />}{" "}
                  Bulk Generate ({selectedBulkStudents.length})
                </button>
              </>
            ) : (
              <div
                style={{
                  fontSize: 12,
                  color: "#A8A29E",
                  textAlign: "center",
                  paddingTop: 12,
                }}
              >
                Select a student to configure generation options
              </div>
            )}
          </div>
        </div>

        {/* Students table */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #E7E5E4",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div className="search-wrap" style={{ flex: 1, maxWidth: 320 }}>
              <Search size={14} />
              <input
                className="search-input"
                placeholder="Search roll number or name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {selectedStudent && generationMode === "single" ? (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div
                style={{
                  padding: "12px 16px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  borderBottom: "1px solid #E7E5E4",
                }}
              >
                <button
                  className="btn btn-ghost"
                  style={{ padding: "4px 8px", fontSize: 11 }}
                  onClick={() => setSelectedStudent(null)}
                >
                  <ArrowLeft size={13} /> Back to list
                </button>
                <span style={{ fontSize: 12, color: "#78716C" }}>
                  Challans for{" "}
                  <strong>{selectedStudent.personalInfo?.fullName}</strong>
                </span>
              </div>
              {isChallanLoading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: 40,
                  }}
                >
                  <Spinner size={22} />
                </div>
              ) : (
                <ChallanTable
                  challans={studentChallans}
                  actions={handleTableActions}
                  onRowClick={handleTableActions.onViewDetail}
                />
              )}
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {generationMode === "bulk" && (
                      <th style={{ width: 44 }}>
                        <Checkbox
                          size="small"
                          checked={allVisibleSelected}
                          indeterminate={
                            selectedBulkStudents.length > 0 &&
                            !allVisibleSelected
                          }
                          onChange={(e) => {
                            if (e.target.checked)
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
                                    !studentsList.some(
                                      (ls) => ls._id === s._id,
                                    ),
                                ),
                              );
                          }}
                        />
                      </th>
                    )}
                    <th>Roll No</th>
                    <th>Student</th>
                    <th>Program</th>
                    {generationMode === "single" && (
                      <th style={{ textAlign: "right" }}>Action</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {studentsList.map((student) => {
                    const isSelected =
                      generationMode === "bulk" &&
                      selectedBulkStudents.some((s) => s._id === student._id);
                    return (
                      <tr
                        key={student._id}
                        className={isSelected ? "row-selected" : ""}
                        onClick={() => {
                          if (generationMode === "bulk")
                            setSelectedBulkStudents((p) =>
                              p.some((s) => s._id === student._id)
                                ? p.filter((s) => s._id !== student._id)
                                : [...p, student],
                            );
                          else setSelectedStudent(student);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {generationMode === "bulk" && (
                          <td>
                            <Checkbox
                              size="small"
                              checked={isSelected}
                              readOnly
                            />
                          </td>
                        )}
                        <td>
                          <span className="mono">{student.studentId}</span>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <Avatar
                              name={student.personalInfo?.fullName || ""}
                              size={28}
                            />
                            <div>
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: 13,
                                  color: "#1C1917",
                                }}
                              >
                                {student.personalInfo?.fullName || "N/A"}
                              </div>
                              <div style={{ fontSize: 11, color: "#A8A29E" }}>
                                {student.personalInfo?.phone || ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: "#78716C", fontSize: 12 }}>
                          {student.programId?.name || "—"}
                        </td>
                        {generationMode === "single" && (
                          <td style={{ textAlign: "right" }}>
                            <button
                              className="btn btn-ghost"
                              style={{ fontSize: 11 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudent(student);
                              }}
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
              <div ref={sentinelRef} style={{ height: 8 }} />
              {isStudentsLoading && (
                <div
                  style={{
                    padding: 16,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Spinner size={18} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <MarkPaidModal
        isOpen={!!payingId}
        onClose={() => setPayingId(null)}
        isLoading={isProcessing}
        onConfirm={(formData) =>
          tableActions
            .markPaid(payingId, formData)
            .then((ok) => ok && setPayingId(null))
        }
      />
      <InstallmentModal
        isOpen={!!instData}
        onClose={() => setInstData(null)}
        totalAmount={instData?.total}
        isLoading={isProcessing}
        onConvert={(rows) =>
          tableActions
            .createInstallments(instData.id, rows)
            .then((ok) => ok && setInstData(null))
        }
      />
      <EditDateModal
        isOpen={!!editDateData}
        onClose={() => setEditDateData(null)}
        currentDueDate={editDateData?.date}
        isLoading={isProcessing}
        onUpdate={(newDate) =>
          tableActions
            .updateDueDate(editDateData.id, newDate)
            .then((ok) => ok && setEditDateData(null))
        }
      />
      <DiscountModal
        isOpen={!!discountData}
        onClose={() => setDiscountData(null)}
        challanData={discountData}
        isLoading={isProcessing}
        onApply={(formData) =>
          tableActions
            .applyDiscount(discountData._id, formData)
            .then((ok) => ok && setDiscountData(null))
        }
        onRemove={(id) =>
          tableActions
            .removeDiscount(id)
            .then((ok) => ok && setDiscountData(null))
        }
      />
      <DetailModal
        isOpen={!!detailData}
        onClose={() => setDetailData(null)}
        data={detailData}
        student={selectedStudent}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ─── PRINT CHALLANS VIEW ───────────────────────────────────────────────────
// Browse already-generated challans and print them — single student (every
// generated challan of theirs, or one specific row) or bulk (every selected
// student's challans as one combined print job). Deliberately read-only —
// no edit/delete/pay actions here, those already live in the Challans tab.
// Both paths use the exact same buildChallanPage/openPrintWindow template
// as every other print button in this app, so the printed design is
// identical no matter where it's triggered from.
// ═══════════════════════════════════════════════════════════════════════════

const formatChallanType = (typeString) => {
  if (!typeString) return "Fee";
  return typeString
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" + ");
};

const PrintChallansView = () => {
  const {
    generationMode,
    setGenerationMode,
    selectedStudent,
    setSelectedStudent,
    selectedBulkStudents,
    setSelectedBulkStudents,
    terms,
    programs,
    selectedTerm,
    setSelectedTerm,
    selectedProg,
    handleProgChange,
    selectedPart,
    setSelectedPart,
    search,
    setSearch,
    studentsList,
    loadMoreStudents,
    hasMore,
    isStudentsLoading,
    studentChallans,
    isChallanLoading,
    handleBulkPrintChallans,
    isBulkPrinting,
  } = useCOISChallan();

  const sentinelRef = useRef(null);
  const loaderCallback = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !isStudentsLoading)
        loadMoreStudents();
    },
    [hasMore, isStudentsLoading, loadMoreStudents],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(loaderCallback, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loaderCallback]);

  const allVisibleSelected =
    studentsList.length > 0 &&
    studentsList.every((s) =>
      selectedBulkStudents.some((sel) => sel._id === s._id),
    );

  // Fee-type and status filters for WHAT gets printed — apply identically
  // in single mode (narrows the selected student's own challan list below)
  // and bulk mode (passed into handleBulkPrintChallans so a bulk job only
  // includes challans matching the same criteria, not every challan every
  // selected student has ever had).
  const [printType, setPrintType] = useState("all");
  const [printStatus, setPrintStatus] = useState("all");
  // Billing Month — a challan's own `billingMonth` (the month it was
  // actually generated/scheduled for), falling back to its Due Date's
  // month only for older challans that predate billingMonth being
  // tracked at all. Same fallback rule used by the Monthly Report/
  // Monthly Challan Report screens, for consistency.
  const [printMonth, setPrintMonth] = useState("all");

  const matchesPrintFilters = useCallback(
    (c) => {
      if (printType !== "all") {
        const t = (c.challanType || "").toUpperCase();
        const matches =
          printType === "tuition"
            ? t.includes("TUITION") || t.includes("INSTALLMENT") || t.includes("ACADEMIC")
            : printType === "exam"
              ? t.includes("EXAM")
              : printType === "readmission"
                ? t.includes("READMISSION")
                : printType === "admission"
                  ? t.includes("ADMISSION") && !t.includes("READMISSION")
                  : printType === "misc"
                    ? t.includes("MISC") || t.includes("GENERAL")
                    : true;
        if (!matches) return false;
      }
      if (printStatus !== "all") {
        if (printStatus === "unpaid") {
          if (!["issued", "partial", "overdue"].includes(c.status))
            return false;
        } else if (c.status !== printStatus) {
          return false;
        }
      }
      if (printMonth !== "all") {
        const month =
          c.billingMonth ||
          (c.dueDate
            ? new Date(c.dueDate).toLocaleString("en-US", { month: "long" })
            : null);
        if (!month || month.toLowerCase() !== printMonth.toLowerCase())
          return false;
      }
      return true;
    },
    [printType, printStatus, printMonth],
  );

  // Only real, currently-active challans are printable — matches every
  // other print/export path in this app (skip voided/merged records) —
  // plus whatever Type/Status filter is currently set.
  const printableChallans = (studentChallans || [])
    .filter(
      (c) => !c.isDeleted && c.status !== "cancelled" && c.status !== "merged",
    )
    .filter(matchesPrintFilters);

  const handlePrintOne = (id) => {
    const challan = printableChallans.find((c) => c._id === id);
    if (!challan) return;
    openPrintWindow(
      buildChallanPage(challan),
      `Fee Challan - ${challan.challanNo}`,
    );
  };

  const handlePrintAllForStudent = () => {
    if (printableChallans.length === 0) return;
    openPrintWindow(
      printableChallans.map(buildChallanPage).join(""),
      `Fee Challans - ${selectedStudent?.personalInfo?.fullName || ""}`,
    );
  };

  return (
    <div>
      <div
        className="page-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1>Print Challans</h1>
          <p>Print already-generated fee challans — single student or bulk</p>
        </div>
        <div
          style={{
            display: "flex",
            background: "#F5F4F1",
            borderRadius: 8,
            padding: 3,
            gap: 2,
          }}
        >
          {["single", "bulk"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setGenerationMode(m);
                setSelectedStudent(null);
                setSelectedBulkStudents([]);
              }}
              style={{
                padding: "6px 16px",
                borderRadius: 6,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: generationMode === m ? "#FFFFFF" : "transparent",
                color: generationMode === m ? "#1C1917" : "#78716C",
                boxShadow:
                  generationMode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.12s",
              }}
            >
              {m === "single" ? "Single" : "Bulk"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        {/* Filters sidebar */}
        <div
          style={{
            width: 240,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            padding: 16,
            background: "#fff",
            border: "1px solid #E7E5E4",
            borderRadius: 10,
            alignSelf: "flex-start",
          }}
        >
          <FilterGroup label="Session">
            <select
              className="filter-select"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
            >
              <option value="">All Sessions</option>
              {terms.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </FilterGroup>
          <FilterGroup label="Program">
            <select
              className="filter-select"
              value={selectedProg}
              onChange={(e) => handleProgChange(e.target.value)}
            >
              <option value="">All Programs</option>
              {programs.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </FilterGroup>
          <FilterGroup label="Part">
            <select
              className="filter-select"
              value={selectedPart}
              onChange={(e) => setSelectedPart(e.target.value)}
            >
              <option value="">Both Parts</option>
              <option value="1">Part 1</option>
              <option value="2">Part 2</option>
            </select>
          </FilterGroup>

          {/* Which challans get printed — applies in BOTH single mode
              (narrows the selected student's list below) and bulk mode
              (narrows what's included in the combined bulk print job). */}
          <div
            style={{
              borderTop: "1px solid #E7E5E4",
              paddingTop: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <FilterGroup label="Fee Type">
              <select
                className="filter-select"
                value={printType}
                onChange={(e) => setPrintType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="tuition">Tuition / Installment</option>
                <option value="exam">Exam</option>
                <option value="admission">Admission</option>
                <option value="readmission">Readmission</option>
                <option value="misc">Misc / General</option>
              </select>
            </FilterGroup>
            <FilterGroup label="Status">
              <select
                className="filter-select"
                value={printStatus}
                onChange={(e) => setPrintStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid (incl. overdue)</option>
                <option value="overdue">Overdue only</option>
              </select>
            </FilterGroup>
            <FilterGroup label="Billing Month">
              <select
                className="filter-select"
                value={printMonth}
                onChange={(e) => setPrintMonth(e.target.value)}
              >
                <option value="all">All Months</option>
                {INSTALLMENT_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </FilterGroup>
          </div>

          {generationMode === "bulk" && (
            <div
              style={{
                borderTop: "1px solid #E7E5E4",
                paddingTop: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 11, color: "#78716C", fontWeight: 500 }}>
                {selectedBulkStudents.length} student
                {selectedBulkStudents.length !== 1 ? "s" : ""} selected
              </div>
              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={isBulkPrinting || selectedBulkStudents.length === 0}
                onClick={() => handleBulkPrintChallans(matchesPrintFilters)}
              >
                {isBulkPrinting ? (
                  <Spinner size={13} />
                ) : (
                  <Printer size={13} />
                )}{" "}
                Print Selected ({selectedBulkStudents.length})
              </button>
            </div>
          )}
        </div>

        {/* Students / challans table */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "#fff",
            border: "1px solid #E7E5E4",
            borderRadius: 10,
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #E7E5E4",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div className="search-wrap" style={{ flex: 1, maxWidth: 320 }}>
              <Search size={14} />
              <input
                className="search-input"
                placeholder="Search roll number or name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {selectedStudent && generationMode === "single" ? (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div
                style={{
                  padding: "12px 16px 8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  borderBottom: "1px solid #E7E5E4",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: "4px 8px", fontSize: 11 }}
                    onClick={() => setSelectedStudent(null)}
                  >
                    <ArrowLeft size={13} /> Back to list
                  </button>
                  <span style={{ fontSize: 12, color: "#78716C" }}>
                    Challans for{" "}
                    <strong>{selectedStudent.personalInfo?.fullName}</strong>
                    {selectedStudent.familyInfo?.fatherName && (
                      <>
                        {" "}
                        S/o{" "}
                        <strong>{selectedStudent.familyInfo.fatherName}</strong>
                      </>
                    )}
                  </span>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ fontSize: 11 }}
                  disabled={printableChallans.length === 0}
                  onClick={handlePrintAllForStudent}
                >
                  <Printer size={13} /> Print All ({printableChallans.length})
                </button>
              </div>
              {isChallanLoading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: 40,
                  }}
                >
                  <Spinner size={22} />
                </div>
              ) : printableChallans.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "#A8A29E",
                    fontSize: 12,
                    padding: 40,
                  }}
                >
                  No generated challans for this student yet.
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Challan No</th>
                      <th>Type</th>
                      <th>Net Payable</th>
                      <th>Status</th>
                      <th>Due Date</th>
                      <th style={{ textAlign: "right" }}>Print</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printableChallans.map((c) => (
                      <tr key={c._id}>
                        <td>
                          <span className="mono">{c.challanNo}</span>
                        </td>
                        <td>
                          {c.isInstallment
                            ? `Installment ${c.installmentNumber}`
                            : formatChallanType(c.challanType)}
                        </td>
                        <td>{fmtPKR(c.netAmount)}</td>
                        <td>
                          <Badge status={c.status} />
                        </td>
                        <td>
                          {c.dueDate
                            ? new Date(c.dueDate).toLocaleDateString()
                            : "—"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: 11 }}
                            onClick={() => handlePrintOne(c._id)}
                          >
                            <Printer size={13} /> Print
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {generationMode === "bulk" && (
                      <th style={{ width: 44 }}>
                        <Checkbox
                          size="small"
                          checked={allVisibleSelected}
                          indeterminate={
                            selectedBulkStudents.length > 0 &&
                            !allVisibleSelected
                          }
                          onChange={(e) => {
                            if (e.target.checked)
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
                                    !studentsList.some(
                                      (ls) => ls._id === s._id,
                                    ),
                                ),
                              );
                          }}
                        />
                      </th>
                    )}
                    <th>Roll No</th>
                    <th>Student</th>
                    <th>Father Name</th>
                    <th>Program</th>
                    {generationMode === "single" && (
                      <th style={{ textAlign: "right" }}>Action</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {studentsList.map((student) => {
                    const isSelected =
                      generationMode === "bulk" &&
                      selectedBulkStudents.some((s) => s._id === student._id);
                    return (
                      <tr
                        key={student._id}
                        className={isSelected ? "row-selected" : ""}
                        onClick={() => {
                          if (generationMode === "bulk")
                            setSelectedBulkStudents((p) =>
                              p.some((s) => s._id === student._id)
                                ? p.filter((s) => s._id !== student._id)
                                : [...p, student],
                            );
                          else setSelectedStudent(student);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {generationMode === "bulk" && (
                          <td>
                            <Checkbox
                              size="small"
                              checked={isSelected}
                              readOnly
                            />
                          </td>
                        )}
                        <td>
                          <span className="mono">{student.studentId}</span>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <Avatar
                              name={student.personalInfo?.fullName || ""}
                              size={28}
                            />
                            <div>
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: 13,
                                  color: "#1C1917",
                                }}
                              >
                                {student.personalInfo?.fullName || "N/A"}
                              </div>
                              <div style={{ fontSize: 11, color: "#A8A29E" }}>
                                {student.personalInfo?.phone || ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: "#78716C", fontSize: 12 }}>
                          {student.familyInfo?.fatherName || "N/A"}
                        </td>
                        <td style={{ color: "#78716C", fontSize: 12 }}>
                          {student.programId?.name || "—"}
                        </td>
                        {generationMode === "single" && (
                          <td style={{ textAlign: "right" }}>
                            <button
                              className="btn btn-ghost"
                              style={{ fontSize: 11 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudent(student);
                              }}
                            >
                              View / Print
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div ref={sentinelRef} style={{ height: 8 }} />
              {isStudentsLoading && (
                <div
                  style={{
                    padding: 16,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Spinner size={18} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ─── INSTALLMENT VIEW ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const INST_COLORS = [
  "#4F46E5",
  "#7C3AED",
  "#0EA5E9",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
];

const INSTALLMENT_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const InstallmentView = () => {
  const {
    showSetupPage,
    setShowSetupPage,
    proceedToSetup,
    terms,
    programs,
    partOptions = [],
    selectedTerm,
    setSelectedTerm,
    selectedProg,
    handleProgChange,
    selectedPart,
    setSelectedPart,
    search,
    setSearch,
    studentsList,
    loadMoreStudents,
    hasMore,
    isStudentsLoading,
    selectedStudents,
    toggleStudentSelection,
    toggleSelectAll,
    removeStudent,
    installmentCount,
    handleCountChange,
    installmentMode,
    setInstallmentMode,
    customPercentages,
    handlePercentageUpdate,
    customAmounts,
    handleAmountUpdate,
    autoCorrectAmountRest,
    customMonths,
    handleMonthUpdate,
    activeSemesterId,
    currentPartNumber,
    previousPartPreference,
    fetchedTotalFee,
    loadingFees,
    hasTuitionFeeSetup,
    isSaving,
    saveSuccess,
    handleSaveConfiguration,
  } = useCOISInstallment();

  const allVisibleSelected =
    studentsList.length > 0 &&
    studentsList.every((s) =>
      selectedStudents.some((sel) => sel._id === s._id),
    );
  const sentinelRef = useRef(null);
  const loaderCallback = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !isStudentsLoading)
        loadMoreStudents();
    },
    [hasMore, isStudentsLoading, loadMoreStudents],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(loaderCallback, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loaderCallback]);

  const count = parseInt(installmentCount) || 1;
  const totalPct = customPercentages.reduce((a, b) => a + b, 0);
  const totalAmt = customAmounts.reduce((a, b) => Number(a) + Number(b), 0);
  const amountDiff = Math.round((fetchedTotalFee || 0) - totalAmt);

  if (showSetupPage)
    return (
      <div>
        <div
          className="page-header"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <button
            className="btn btn-ghost"
            style={{ padding: "6px 10px" }}
            onClick={() => setShowSetupPage(false)}
          >
            <ArrowLeft size={15} />
          </button>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {/* Read-only — the Part a plan gets bound to is always the
                selected student's own current Part, never a manual choice,
                so a Part 1 student can never end up with a Part 2 plan. */}
            {currentPartNumber != null && (
              <span className="badge badge-info">
                Part {currentPartNumber}
              </span>
            )}
            <span className="badge badge-info">
              {selectedStudents.length} selected
            </span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr",
            gap: 16,
            position: "relative",
          }}
        >
          {saveSuccess && (
            <div
              className="success-overlay"
              style={{ position: "fixed", inset: 0, zIndex: 999 }}
            >
              <div className="success-circle">
                <Check size={30} color="white" strokeWidth={3} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1C1917" }}>
                Configuration Saved!
              </div>
              <div style={{ fontSize: 13, color: "#78716C", marginTop: 4 }}>
                Saved for {selectedStudents.length} student(s)
              </div>
            </div>
          )}

          {/* Students panel */}
          <div
            className="card"
            style={{
              height: "fit-content",
              maxHeight: "calc(100vh - 200px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="card-header">
              <div className="card-title">Selected Students</div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {selectedStudents.map((s) => (
                <div
                  key={s._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 14px",
                    borderBottom: "1px solid #F5F4F1",
                  }}
                >
                  <Avatar name={s.personalInfo?.fullName || ""} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#1C1917",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.personalInfo?.fullName || "N/A"}
                    </div>
                    <div className="mono" style={{ color: "#78716C" }}>
                      {s.studentId}
                    </div>
                  </div>
                  <button
                    onClick={() => removeStudent(s._id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#D6D3D1",
                      padding: 2,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#EF4444")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#D6D3D1")
                    }
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Config panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Installments are a split of the student's own configured
                Tuition fee — shown up front so every percentage below has
                a real rupee figure behind it, matching the University
                Installment Configuration screen. */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Total Tuition Fee</div>
                {loadingFees && <Spinner size={13} />}
              </div>
              <div style={{ padding: "16px 20px" }}>
                {selectedStudents.length === 1 &&
                !loadingFees &&
                !hasTuitionFeeSetup ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#B91C1C",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <ShieldAlert size={15} />
                    No Tuition fee configured for this Part yet — set it up
                    in Fee Setup first.
                  </div>
                ) : (
                  <div
                    style={{ fontSize: 26, fontWeight: 700, color: "#1C1917" }}
                  >
                    Rs. {fetchedTotalFee.toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Installment Count</div>
              </div>
              <div
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <button
                  className="btn btn-ghost"
                  style={{ padding: "6px 10px" }}
                  onClick={() =>
                    handleCountChange(Math.max(1, count - 1), fetchedTotalFee)
                  }
                  disabled={count <= 1}
                >
                  <Minus size={14} />
                </button>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: "#1C1917",
                    minWidth: 48,
                    textAlign: "center",
                  }}
                >
                  {count}
                </div>
                <button
                  className="btn btn-ghost"
                  style={{ padding: "6px 10px" }}
                  onClick={() =>
                    handleCountChange(Math.min(12, count + 1), fetchedTotalFee)
                  }
                  disabled={count >= 12}
                >
                  <Plus size={14} />
                </button>
                <span style={{ fontSize: 13, color: "#78716C", marginLeft: 4 }}>
                  installment{count > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {count > 1 && (
              <div className="card">
                <div
                  className="card-header"
                  style={{ flexWrap: "wrap", gap: 10 }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <div className="card-title">Amount distribution</div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: 3,
                        background: "#FFFFFF",
                        border: "1px solid #E7E5E4",
                        borderRadius: 8,
                      }}
                    >
                      <button
                        onClick={() =>
                          setInstallmentMode("percentage", fetchedTotalFee)
                        }
                        style={{
                          padding: "5px 10px",
                          borderRadius: 6,
                          border: "none",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          background:
                            installmentMode !== "amount"
                              ? "#4F46E5"
                              : "transparent",
                          color:
                            installmentMode !== "amount"
                              ? "#FFFFFF"
                              : "#78716C",
                        }}
                      >
                        Percentage
                      </button>
                      <button
                        onClick={() =>
                          setInstallmentMode("amount", fetchedTotalFee)
                        }
                        style={{
                          padding: "5px 10px",
                          borderRadius: 6,
                          border: "none",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          background:
                            installmentMode === "amount"
                              ? "#4F46E5"
                              : "transparent",
                          color:
                            installmentMode === "amount"
                              ? "#FFFFFF"
                              : "#78716C",
                        }}
                      >
                        Fixed Amount
                      </button>
                    </div>
                  </div>
                  {installmentMode === "amount" ? (
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: amountDiff === 0 ? "#22C55E" : "#EF4444",
                      }}
                    >
                      Total: Rs {totalAmt.toLocaleString()}{" "}
                      {amountDiff === 0
                        ? "✓"
                        : amountDiff > 0
                          ? `(Rs ${amountDiff.toLocaleString()} missing)`
                          : `(Rs ${Math.abs(amountDiff).toLocaleString()} over)`}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: totalPct === 100 ? "#22C55E" : "#EF4444",
                      }}
                    >
                      {totalPct}%{" "}
                      {totalPct === 100 ? "✓" : `(need ${100 - totalPct}% more)`}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  <div
                    className="mono"
                    style={{ fontSize: 12, color: "#78716C" }}
                  >
                    {installmentMode === "amount"
                      ? `Rs. ${totalAmt.toLocaleString()} of Rs. ${fetchedTotalFee.toLocaleString()} distributed`
                      : `Rs. ${Math.round((totalPct / 100) * fetchedTotalFee).toLocaleString()} of Rs. ${fetchedTotalFee.toLocaleString()} distributed`}
                  </div>
                  <div className="inst-bar">
                    {Array.from({ length: count }).map((_, i) => {
                      const pct =
                        installmentMode === "amount"
                          ? fetchedTotalFee > 0
                            ? ((customAmounts[i] || 0) / fetchedTotalFee) * 100
                            : 0
                          : customPercentages[i] || 0;
                      return (
                        <div
                          key={i}
                          className="inst-segment"
                          style={{
                            width: `${pct}%`,
                            background: INST_COLORS[i % INST_COLORS.length],
                            minWidth: pct > 0 ? 4 : 0,
                          }}
                        >
                          {pct >= 12 && Math.round(pct) + "%"}
                        </div>
                      );
                    })}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(120px, 1fr))",
                      gap: 10,
                    }}
                  >
                    {Array.from({ length: count }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          background: "#FAFAF9",
                          border: "1px solid #E7E5E4",
                          borderRadius: 8,
                          padding: "10px 14px",
                          borderLeftWidth: 3,
                          borderLeftColor: INST_COLORS[i % INST_COLORS.length],
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.07em",
                            color: "#A8A29E",
                            marginBottom: 4,
                          }}
                        >
                          Installment {i + 1}
                        </div>
                        {installmentMode === "amount" ? (
                          <>
                            <div
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              <span
                                style={{
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: "#A8A29E",
                                  marginRight: 2,
                                }}
                              >
                                Rs
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={
                                  customAmounts[i] === 0 ? "" : customAmounts[i]
                                }
                                onChange={(e) =>
                                  handleAmountUpdate(
                                    i,
                                    e.target.value,
                                    fetchedTotalFee,
                                  )
                                }
                                style={{
                                  fontSize: 20,
                                  fontWeight: 700,
                                  color: "#1C1917",
                                  border: "none",
                                  background: "transparent",
                                  outline: "none",
                                  width: "100%",
                                  fontFamily: "DM Sans, system-ui, sans-serif",
                                }}
                              />
                            </div>
                            {/* Read-only reference — the percentage this
                                fixed amount happens to work out to, kept in
                                sync for display/history but never the
                                authoritative figure in amount mode. */}
                            <div
                              className="mono"
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#4F46E5",
                                marginTop: 2,
                              }}
                            >
                              ≈{" "}
                              {fetchedTotalFee > 0
                                ? (
                                    ((customAmounts[i] || 0) /
                                      fetchedTotalFee) *
                                    100
                                  ).toFixed(1)
                                : "0.0"}
                              %
                            </div>
                            <button
                              onClick={() =>
                                autoCorrectAmountRest(i, fetchedTotalFee)
                              }
                              style={{
                                marginTop: 6,
                                fontSize: 10,
                                fontWeight: 700,
                                color: "#4F46E5",
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                              }}
                            >
                              Balance others
                            </button>
                          </>
                        ) : (
                          <>
                            <div
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={
                                  customPercentages[i] === 0
                                    ? ""
                                    : customPercentages[i]
                                }
                                onChange={(e) =>
                                  handlePercentageUpdate(i, e.target.value)
                                }
                                style={{
                                  fontSize: 22,
                                  fontWeight: 700,
                                  color: "#1C1917",
                                  border: "none",
                                  background: "transparent",
                                  outline: "none",
                                  width: "100%",
                                  fontFamily: "DM Sans, system-ui, sans-serif",
                                }}
                              />
                              <span
                                style={{
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: "#A8A29E",
                                }}
                              >
                                %
                              </span>
                            </div>
                            {/* The actual rupee amount this percentage works
                                out to against the student's real Tuition fee —
                                not just a bare percentage. */}
                            <div
                              className="mono"
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#4F46E5",
                                marginTop: 2,
                              }}
                            >
                              Rs.{" "}
                              {Math.round(
                                ((customPercentages[i] || 0) / 100) *
                                  fetchedTotalFee,
                              ).toLocaleString()}
                            </div>
                          </>
                        )}
                        <select
                          className="filter-select"
                          style={{ marginTop: 8 }}
                          value={customMonths[i] || ""}
                          onChange={(e) => handleMonthUpdate(i, e.target.value)}
                        >
                          <option value="">Billing month…</option>
                          {INSTALLMENT_MONTHS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {count === 1 && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Billing Month</div>
                  <div
                    className="mono"
                    style={{ fontSize: 12, fontWeight: 600, color: "#4F46E5" }}
                  >
                    Full amount: Rs. {fetchedTotalFee.toLocaleString()}
                  </div>
                </div>
                <div style={{ padding: "16px 20px", maxWidth: 260 }}>
                  <select
                    className="filter-select"
                    value={customMonths[0] || ""}
                    onChange={(e) => handleMonthUpdate(0, e.target.value)}
                  >
                    <option value="">Select month…</option>
                    {INSTALLMENT_MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {previousPartPreference && (
              <div className="card" style={{ opacity: 0.85 }}>
                <div className="card-header">
                  <div className="card-title">
                    Previous Setup — Part {currentPartNumber - 1} (read-only)
                  </div>
                </div>
                <div
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#78716C" }}>
                    {previousPartPreference.defaultInstallments > 1
                      ? `${previousPartPreference.defaultInstallments} installments`
                      : "Full payment (no installments)"}
                  </div>
                  {previousPartPreference.defaultInstallments > 1 && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(100px, 1fr))",
                        gap: 8,
                      }}
                    >
                      {(previousPartPreference.customPercentages || []).map(
                        (pct, i) => (
                          <div
                            key={i}
                            style={{
                              background: "#FAFAF9",
                              border: "1px solid #E7E5E4",
                              borderRadius: 8,
                              padding: "8px 10px",
                              fontSize: 11,
                            }}
                          >
                            <div style={{ fontWeight: 700, color: "#1C1917" }}>
                              {pct}%
                            </div>
                            <div style={{ color: "#A8A29E" }}>
                              {previousPartPreference.customMonths?.[i] ||
                                "—"}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!activeSemesterId && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#B91C1C",
                }}
              >
                The selected student(s) have no Part/Section on record —
                installment plans must be bound to a specific section.
              </div>
            )}

            <div
              className="card"
              style={{
                background: "#1C1917",
                border: "none",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", gap: 32 }}>
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      color: "#78716C",
                      marginBottom: 4,
                    }}
                  >
                    Students
                  </div>
                  <div
                    style={{ fontSize: 28, fontWeight: 700, color: "#F5F4F1" }}
                  >
                    {selectedStudents.length}
                  </div>
                </div>
                <div style={{ width: 1, background: "#44403C" }} />
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      color: "#78716C",
                      marginBottom: 4,
                    }}
                  >
                    Installments
                  </div>
                  <div
                    style={{ fontSize: 28, fontWeight: 700, color: "#F5F4F1" }}
                  >
                    {count}
                  </div>
                </div>
              </div>
              <button
                className="btn btn-primary"
                style={{ padding: "10px 24px", fontSize: 13 }}
                onClick={() => handleSaveConfiguration(fetchedTotalFee)}
                disabled={
                  isSaving ||
                  !activeSemesterId ||
                  (installmentMode === "amount" && count > 1
                    ? amountDiff !== 0
                    : totalPct !== 100)
                }
              >
                {isSaving ? (
                  <>
                    <Spinner size={14} /> Saving…
                  </>
                ) : (
                  <>
                    <Save size={14} /> Save Configuration
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div>
      <div
        className="card"
        style={{
          display: "flex",
          overflow: "hidden",
          height: "calc(100vh - 140px)",
        }}
      >
        <FilterSidebar title="Filter Students">
          <FilterGroup label="Session">
            <select
              className="filter-select"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
            >
              <option value="">All Sessions</option>
              {terms.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </FilterGroup>
          <FilterGroup label="Program">
            <select
              className="filter-select"
              value={selectedProg}
              onChange={(e) => handleProgChange(e.target.value)}
            >
              <option value="">All Programs</option>
              {programs.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </FilterGroup>
          {/* HSSC programs always have exactly two Parts — shown directly,
              no Program selection required first. */}
          <FilterGroup label="Part">
            <select
              className="filter-select"
              value={selectedPart}
              onChange={(e) => setSelectedPart(e.target.value)}
            >
              <option value="">All Parts</option>
              {partOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FilterGroup>
        </FilterSidebar>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #E7E5E4",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div className="search-wrap" style={{ width: 280 }}>
              <Search size={14} />
              <input
                className="search-input"
                placeholder="Search roll number or name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary"
              disabled={selectedStudents.length === 0}
              onClick={proceedToSetup}
            >
              Configure Installments <ChevronRight size={13} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>
                    <Checkbox
                      size="small"
                      checked={allVisibleSelected}
                      indeterminate={
                        selectedStudents.length > 0 && !allVisibleSelected
                      }
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th>Reg ID</th>
                  <th>Student</th>
                  <th>Father Name</th>
                  <th>CNIC</th>
                  <th>Phone</th>
                  <th>Program</th>
                  <th>Part</th>
                  <th>Session</th>
                  <th>Current Plan</th>
                </tr>
              </thead>
              <tbody>
                {studentsList.map((student) => {
                  const isSelected = selectedStudents.some(
                    (s) => s._id === student._id,
                  );
                  return (
                    <tr
                      key={student._id}
                      className={isSelected ? "row-selected" : ""}
                      onClick={() => toggleStudentSelection(student)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <Checkbox size="small" checked={isSelected} readOnly />
                      </td>
                      <td>
                        <span className="mono">{student.studentId}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {student.personalInfo?.fullName || "N/A"}
                      </td>
                      <td style={{ color: "#78716C" }}>
                        {student.familyInfo?.fatherName || "N/A"}
                      </td>
                      <td className="mono" style={{ color: "#78716C" }}>
                        {student.personalInfo?.cnic || "N/A"}
                      </td>
                      <td style={{ color: "#78716C" }}>
                        {student.personalInfo?.phone || "N/A"}
                      </td>
                      <td style={{ color: "#78716C" }}>
                        {student.programId?.name || "—"}
                      </td>
                      <td>
                        {student.semesterId?.number
                          ? `Part ${student.semesterId.number}`
                          : "—"}
                      </td>
                      <td style={{ color: "#78716C" }}>
                        {student.termId?.name || "—"}
                      </td>
                      <td>
                        {(() => {
                          const pref = Array.isArray(student.feePreference)
                            ? student.feePreference[0]
                            : student.feePreference;
                          const n = pref?.defaultInstallments;
                          return n > 1 ? (
                            <span className="badge badge-info">
                              {n} installments
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: "#A8A29E" }}>
                              Full payment
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div ref={sentinelRef} style={{ height: 8 }} />
            {isStudentsLoading && (
              <div
                style={{
                  padding: 16,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Spinner size={18} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ─── REPORTS VIEW ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const EditOverdueModal = ({
  isOpen,
  onClose,
  challan,
  onUpdate,
  isLoading,
}) => {
  const [fine, setFine] = useState(0);
  const [date, setDate] = useState("");

  useEffect(() => {
    if (isOpen && challan) {
      setFine(challan.fineAmount || 0);
      setDate(new Date(challan.dueDate).toISOString().split("T")[0]);
    }
  }, [isOpen, challan]);

  if (!isOpen || !challan) return null;

  const studentName =
    challan.studentId?.personalInfo?.fullName || challan.studentName || "N/A";
  const fatherName =
    challan.studentId?.familyInfo?.fatherName || challan.fatherName || "N/A";

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h3>Update Overdue Challan</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#78716C",
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
            }}
          >
            <div className="mono" style={{ color: "#B91C1C", marginBottom: 4 }}>
              {challan.challanNo}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B" }}>
              {studentName}
            </div>
            <div style={{ fontSize: 11, color: "#EF4444", marginTop: 2 }}>
              S/o: {fatherName}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="form-label">Extend Due Date</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Override Late Fine (PKR)</label>
              <input
                type="number"
                className="form-input"
                value={fine}
                onChange={(e) => setFine(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "10px 14px",
              }}
              disabled={isLoading}
              onClick={async () => {
                const ok = await onUpdate(challan._id, fine, date);
                if (ok) onClose();
              }}
            >
              {isLoading ? <Spinner size={14} /> : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportsView = () => {
  const {
    activeTab,
    setActiveTab,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    selectedType,
    setSelectedType,
    typeOptions,
    selectedSession,
    setSelectedSession,
    sessionOptions,
    selectedProgram,
    setSelectedProgram,
    programOptions,
    yearOptions,
    monthOptions,
    summary,
    details,
    overdueList,
    overdueTotal,
    periodName,
    isLoading,
    isUpdatingFine,
    isProcessingFines,
    isMasterExporting,
    handleUpdateOverdue,
    handleProcessFines,
    handleExportExcel,
    handleExportPDF,
    handleExportMasterExcel,
  } = useCOISReports();

  const [editingOverdue, setEditingOverdue] = useState(null);

  const recovery =
    summary.totalGeneratedAmount > 0
      ? Math.round(
          (summary.totalCollectedAmount / summary.totalGeneratedAmount) * 100,
        )
      : 0;

  return (
    <div>
      <div
        className="page-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1>Financial Reports</h1>
          <p>Monthly summaries, overdue challans, and data exports</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={handleExportExcel}>
            <FileText size={13} /> Export Excel
          </button>
          <button className="btn btn-ghost" onClick={handleExportPDF}>
            <FileDown size={13} /> Export PDF
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExportMasterExcel}
            disabled={isMasterExporting || isLoading}
          >
            {isMasterExporting ? (
              <Spinner size={13} />
            ) : (
              <DownloadCloud size={13} />
            )}{" "}
            Master Audit
          </button>
        </div>
      </div>

      {/* Controls */}
      <div
        className="card"
        style={{
          padding: "12px 16px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 2,
            background: "#F5F4F1",
            borderRadius: 7,
            padding: 3,
          }}
        >
          {["monthly", "overdue"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: "5px 14px",
                borderRadius: 5,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: activeTab === t ? "#fff" : "transparent",
                color: activeTab === t ? "#1C1917" : "#78716C",
                boxShadow:
                  activeTab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                textTransform: "capitalize",
                fontFamily: "inherit",
                transition: "all 0.12s",
              }}
            >
              {t === "monthly" ? "Monthly Report" : "Overdue Challans"}
            </button>
          ))}
        </div>

        {activeTab === "monthly" && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginLeft: 8,
            }}
          >
            <select
              className="filter-select"
              style={{ width: 130 }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              className="filter-select"
              style={{ width: 90 }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              className="filter-select"
              style={{ width: 140 }}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Fee Types</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <select
              className="filter-select"
              style={{ width: 150 }}
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
            >
              <option value="all">All Sessions</option>
              {sessionOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="filter-select"
              style={{ width: 170 }}
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
            >
              <option value="all">All Programs</option>
              {programOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {(selectedType !== "all" ||
              selectedSession !== "all" ||
              selectedProgram !== "all") && (
              <button
                className="btn btn-ghost"
                style={{ fontSize: 11 }}
                onClick={() => {
                  setSelectedType("all");
                  setSelectedSession("all");
                  setSelectedProgram("all");
                }}
              >
                <X size={12} /> Clear Filters
              </button>
            )}
          </div>
        )}

        {activeTab === "overdue" && (
          <button
            className="btn btn-danger"
            style={{ marginLeft: 8 }}
            onClick={handleProcessFines}
            disabled={isProcessingFines}
          >
            {isProcessingFines ? <Spinner size={13} /> : <Zap size={13} />}{" "}
            Process Fines
          </button>
        )}
      </div>

      {isLoading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 300,
          }}
        >
          <Spinner size={24} />
        </div>
      ) : (
        <>
          {activeTab === "monthly" && (
            <>
              <div
                className="stat-grid"
                style={{
                  gridTemplateColumns: "repeat(5, 1fr)",
                  marginBottom: 16,
                }}
              >
                {[
                  {
                    label: "Generated",
                    val: `Rs. ${summary.totalGeneratedAmount.toLocaleString()}`,
                    color: "#4F46E5",
                    bg: "#EEF2FF",
                  },
                  {
                    label: "Collected",
                    val: `Rs. ${summary.totalCollectedAmount.toLocaleString()}`,
                    color: "#22C55E",
                    bg: "#DCFCE7",
                  },
                  {
                    label: "Pending",
                    val: `Rs. ${summary.totalPendingAmount.toLocaleString()}`,
                    color: "#EF4444",
                    bg: "#FEE2E2",
                  },
                  {
                    label: "Paid Count",
                    val: summary.paidCount?.toLocaleString() || "0",
                    color: "#4F46E5",
                    bg: "#EEF2FF",
                  },
                  {
                    label: "Recovery Rate",
                    val: `${recovery}%`,
                    color: "#D97706",
                    bg: "#FEF3C7",
                  },
                ].map((s, i) => (
                  <div
                    className="card"
                    key={i}
                    style={{ padding: "12px 14px" }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        color: "#A8A29E",
                        marginBottom: 4,
                      }}
                    >
                      {s.label}
                    </div>
                    <div
                      style={{ fontSize: 18, fontWeight: 700, color: s.color }}
                    >
                      {s.val}
                    </div>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">{periodName} Challans</div>
                    <div
                      style={{ fontSize: 11, color: "#A8A29E", marginTop: 2 }}
                    >
                      {details.length} record{details.length !== 1 ? "s" : ""}
                      {(selectedType !== "all" ||
                        selectedSession !== "all" ||
                        selectedProgram !== "all") && (
                        <>
                          {" "}
                          —{" "}
                          {
                            [
                              selectedType !== "all" &&
                                selectedType.replace(/_/g, " "),
                              selectedSession !== "all" && selectedSession,
                              selectedProgram !== "all" && selectedProgram,
                            ]
                              .filter(Boolean)
                              .join(", ")
                          }
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    overflowX: "auto",
                    maxHeight: 500,
                    overflowY: "auto",
                  }}
                >
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Challan Ref</th>
                        <th>Student</th>
                        <th>Fee Type</th>
                        <th style={{ textAlign: "right" }}>Net Amount</th>
                        <th style={{ textAlign: "right" }}>Collected</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.length === 0 ? (
                        <tr>
                          <td colSpan={6}>
                            <EmptyState
                              icon={FileText}
                              title="No records for this period"
                            />
                          </td>
                        </tr>
                      ) : (
                        details.map((row, idx) => (
                          <tr key={idx}>
                            <td>
                              <span className="mono">{row.challanNo}</span>
                            </td>
                            <td>
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: 13,
                                  color: "#1C1917",
                                }}
                              >
                                {row.studentName || "N/A"}
                              </div>
                              <div style={{ fontSize: 11, color: "#78716C" }}>
                                S/o: {row.fatherName || "N/A"}
                              </div>
                              <div
                                className="mono"
                                style={{ marginTop: 2, color: "#A8A29E" }}
                              >
                                {row.studentRegNo}
                              </div>
                            </td>
                            <td
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                textTransform: "uppercase",
                                color: "#78716C",
                              }}
                            >
                              {row.type?.replace(/_/g, " ")}
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 700 }}>
                              Rs. {row.netAmount?.toLocaleString()}
                            </td>
                            <td
                              style={{
                                textAlign: "right",
                                fontWeight: 700,
                                color: "#22C55E",
                              }}
                            >
                              Rs. {row.paidAmount?.toLocaleString()}
                            </td>
                            <td>
                              <Badge status={row.status} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === "overdue" && (
            <div className="card" style={{ border: "1px solid #FECACA" }}>
              <div className="card-header" style={{ background: "#FEF2F2" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ShieldAlert size={15} style={{ color: "#EF4444" }} />
                  <div>
                    <div className="card-title" style={{ color: "#991B1B" }}>
                      Overdue Challans
                    </div>
                    <div style={{ fontSize: 11, color: "#EF4444" }}>
                      Students who missed their due dates
                    </div>
                  </div>
                </div>
                <span className="badge badge-overdue">
                  {overdueTotal} defaulter{overdueTotal !== 1 ? "s" : ""}
                  {overdueList.length < overdueTotal &&
                    ` (showing ${overdueList.length})`}
                </span>
              </div>
              <div
                style={{ overflowX: "auto", maxHeight: 500, overflowY: "auto" }}
              >
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Challan Ref</th>
                      <th>Student</th>
                      <th>Due Date</th>
                      <th style={{ textAlign: "right" }}>Base Amount</th>
                      <th style={{ textAlign: "right" }}>Late Fine</th>
                      <th style={{ textAlign: "right" }}>Total Payable</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueList.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <EmptyState
                            icon={CheckCircle2}
                            title="No overdue challans"
                            sub="All students are up to date — great!"
                          />
                        </td>
                      </tr>
                    ) : (
                      overdueList.map((row, idx) => (
                        <tr key={idx}>
                          <td>
                            <span className="mono">{row.challanNo}</span>
                          </td>
                          <td>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: 13,
                                color: "#1C1917",
                              }}
                            >
                              {row.studentId?.personalInfo?.fullName ||
                                row.studentName ||
                                "N/A"}
                            </div>
                            <div style={{ fontSize: 11, color: "#78716C" }}>
                              S/o:{" "}
                              {row.studentId?.familyInfo?.fatherName ||
                                row.fatherName ||
                                "N/A"}
                            </div>
                            <div
                              className="mono"
                              style={{ color: "#A8A29E", marginTop: 2 }}
                            >
                              {row.studentId?.studentId || row.studentRegNo}
                            </div>
                          </td>
                          <td
                            style={{
                              color: "#EF4444",
                              fontWeight: 600,
                              fontSize: 12,
                            }}
                          >
                            {new Date(row.dueDate).toLocaleDateString("en-GB")}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 600 }}>
                            Rs.{" "}
                            {(
                              row.netAmount - (row.fineAmount || 0)
                            ).toLocaleString()}
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              fontWeight: 700,
                              color: "#D97706",
                            }}
                          >
                            Rs. {(row.fineAmount || 0).toLocaleString()}
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              fontWeight: 700,
                              color: "#EF4444",
                              fontSize: 14,
                            }}
                          >
                            Rs. {row.netAmount?.toLocaleString()}
                          </td>
                          <td>
                            <button
                              className="btn btn-ghost"
                              style={{ padding: "5px 8px" }}
                              onClick={() => setEditingOverdue(row)}
                            >
                              <Edit size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <EditOverdueModal
        isOpen={!!editingOverdue}
        onClose={() => setEditingOverdue(null)}
        challan={editingOverdue}
        isLoading={isUpdatingFine}
        onUpdate={handleUpdateOverdue}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ─── ROOT CONTAINER ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "directory", label: "Student Profiles", icon: Users },
  { id: "setup", label: "Fee Setup", icon: FileText },
  { id: "challans", label: "Challans", icon: Receipt },
  { id: "daily-invoice", label: "Daily Invoice", icon: Calendar },
  { id: "print", label: "Print Challans", icon: Printer },
  { id: "installments", label: "Installments", icon: CreditCard },
  { id: "withdraw", label: "Withdraw", icon: UserX },
  { id: "reports", label: "Reports", icon: PieChart },
];

const COISFeeContainer = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderView = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView />;
      case "directory":
        return <StudentDirectoryView />;
      case "setup":
        return <FeeSetupView />;
      case "challans":
        return <ChallanView />;
      case "daily-invoice":
        return <DailyInvoiceView />;
      case "print":
        return <PrintChallansView />;
      case "installments":
        return <InstallmentView />;
      case "withdraw":
        return <COISWithdrawView />;
      case "reports":
        return <ReportsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="cois-root" style={{ display: "flex" }}>
        {/* Sidebar */}
        <nav className="cois-nav">
          <div className="cois-nav-brand">
            <div className="cois-nav-brand-tag">College of Intermidiate Studies</div>
            <div className="cois-nav-brand-title">Fee Management</div>
          </div>
          <div className="cois-nav-links">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`cois-nav-item ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon
                  size={15}
                  style={{ opacity: activeTab === tab.id ? 1 : 0.7 }}
                />
                {tab.label}
              </button>
            ))}
          </div>
          <div style={{ padding: "16px 20px", borderTop: "1px solid #E7E5E4" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#A8A29E" }}>
              College of Intermediate Sciences
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#78716C",
                marginTop: 2,
              }}
            >
              Financial Module v2
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="cois-main">{renderView()}</main>
      </div>
    </>
  );
};

export default COISFeeContainer;
