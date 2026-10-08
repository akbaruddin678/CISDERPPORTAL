import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Avatar,
  Divider,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  School,
  People,
  Assignment,
  CheckCircle,
  Drafts,
  MoreVert,
  EventNote,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "@mui/icons-material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  addDays,
  isToday,
} from "date-fns";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

const COLORS = ["#6366f1", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e"];

// ── Minimal custom tooltip for recharts ──
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: 12,
        padding: "10px 16px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
      }}
    >
      <p
        style={{
          color: "#94a3b8",
          fontSize: 11,
          fontWeight: 700,
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </p>
      {payload.map((p, i) => (
        <p
          key={i}
          style={{
            color: p.color,
            fontSize: 13,
            fontWeight: 700,
            margin: "2px 0",
          }}
        >
          {p.name}: <span style={{ color: "white" }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ==========================================
// STAT CARD
// ==========================================
const StatCard = ({ title, value, icon: Icon, accent, loading, delta }) => (
  <div
    style={{
      background: "white",
      border: "1px solid #f1f5f9",
      borderRadius: 20,
      padding: "22px 24px",
      position: "relative",
      overflow: "hidden",
      transition: "box-shadow 0.2s, transform 0.2s",
      cursor: "default",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.09)";
      e.currentTarget.style.transform = "translateY(-2px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
      e.currentTarget.style.transform = "none";
    }}
  >
    {/* Accent top bar */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: accent,
        borderRadius: "20px 20px 0 0",
      }}
    />

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <div>
        <p
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#94a3b8",
            marginBottom: 10,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {title}
        </p>
        {loading ? (
          <CircularProgress size={22} thickness={5} sx={{ color: accent }} />
        ) : (
          <p
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: "#0f172a",
              lineHeight: 1,
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "-1px",
            }}
          >
            {value?.toLocaleString()}
          </p>
        )}
      </div>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `${accent}18`,
        }}
      >
        <Icon style={{ color: accent, fontSize: 20 }} />
      </div>
    </div>
  </div>
);

// ==========================================
// MAIN DASHBOARD
// ==========================================
const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAdmissions: 0,
    submitted: 0,
    drafts: 0,
    accepted: 0,
  });
  const [recentAdmissions, setRecentAdmissions] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [completedAdmissions, setCompletedAdmissions] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const studentRes = await fetch(`${baseUrl}/api/student/stats`, {
          headers,
        });
        let studentData = { data: { total: 0, active: 0, byDepartment: [] } };
        if (studentRes.ok) studentData = await studentRes.json();

        const admRes = await fetch(
          `${baseUrl}/api/admissions/admission-list?page=1&limit=5000`,
          { headers },
        );
        let admData = { data: { admissions: [], pagination: { total: 0 } } };
        if (admRes.ok) admData = await admRes.json();

        const allAdmissions = Array.isArray(admData?.data)
          ? admData.data
          : admData?.data?.admissions || admData?.data?.data || [];
        let submittedCount = 0,
          draftCount = 0,
          acceptedCount = 0;
        allAdmissions.forEach((adm) => {
          const s = (
            adm.status ||
            adm.application?.status ||
            "draft"
          ).toLowerCase();
          if (s === "accepted" || s === "approved") acceptedCount++;
          else if (s === "submitted" || s === "under review" || s === "review")
            submittedCount++;
          else draftCount++;
        });

        setStats({
          totalStudents: studentData?.data?.total || 0,
          totalAdmissions:
            admData?.data?.pagination?.total || allAdmissions.length || 0,
          submitted: submittedCount,
          drafts: draftCount,
          accepted: acceptedCount,
        });
        setRecentAdmissions(allAdmissions.slice(0, 5));

        if (studentData?.data?.byDepartment?.length > 0) {
          setDepartmentStats(
            studentData.data.byDepartment.map((d, i) => ({
              name: d.departmentName || "Unknown",
              value: d.count || 0,
              color: COLORS[i % COLORS.length],
            })),
          );
        }

        setTrendData([
          { name: "Jan", applications: 40, accepted: 24 },
          { name: "Feb", applications: 60, accepted: 35 },
          { name: "Mar", applications: 85, accepted: 50 },
          { name: "Apr", applications: 120, accepted: 80 },
          { name: "May", applications: 150, accepted: 100 },
          { name: "Jun", applications: 200, accepted: 140 },
        ]);

        // Students confirmed "Complete" (fee paid, admission application
        // cleared) this session — see admissionTrashController.js's
        // completeAdmission. Full details live in each record's snapshot.
        const completedRes = await fetch(
          `${baseUrl}/api/admissions/trash/completed?currentSession=true`,
          { headers },
        );
        if (completedRes.ok) {
          const completedData = await completedRes.json();
          setCompletedAdmissions(completedData?.data || []);
        }
      } catch (err) {
        setError(
          "Failed to load dashboard data. Please check your connection.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Calendar logic
  const renderCalendarCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const fd = format(day, "d");
        const inMonth = isSameMonth(day, monthStart);
        const today = isToday(day);
        const hasEvent = inMonth && parseInt(fd) % 7 === 0;

        days.push(
          <div
            key={day}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 38,
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: today ? 800 : 600,
              fontFamily: "'DM Sans', sans-serif",
              color: !inMonth ? "#e2e8f0" : today ? "white" : "#475569",
              background: today
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : "transparent",
              boxShadow: today ? "0 4px 12px rgba(99,102,241,0.35)" : "none",
              transition: "all 0.15s",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              if (!today && inMonth)
                e.currentTarget.style.background = "#f1f5f9";
            }}
            onMouseLeave={(e) => {
              if (!today) e.currentTarget.style.background = "transparent";
            }}
          >
            {fd}
            {hasEvent && !today && (
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "#6366f1",
                  marginTop: 2,
                }}
              />
            )}
          </div>,
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div
          key={day}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,1fr)",
            gap: 2,
          }}
        >
          {days}
        </div>,
      );
      days = [];
    }
    return rows;
  };

  const getStatusConfig = (status) => {
    const s = status?.toLowerCase();
    if (s === "accepted" || s === "approved")
      return { bg: "#ecfdf5", text: "#065f46", dot: "#10b981" };
    if (s === "submitted" || s === "under review")
      return { bg: "#eef2ff", text: "#3730a3", dot: "#6366f1" };
    if (s === "rejected")
      return { bg: "#fff1f2", text: "#9f1239", dot: "#f43f5e" };
    return { bg: "#f8fafc", text: "#475569", dot: "#94a3b8" };
  };

  const font = "'DM Sans', sans-serif";

  const cardStyle = {
    background: "white",
    borderRadius: 20,
    border: "1px solid #f1f5f9",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    padding: "28px",
    height: "100%",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "28px 32px",
        fontFamily: font,
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&display=swap');`}</style>

      {/* ── Page Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 32,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#6366f1",
              marginBottom: 6,
            }}
          >
            Academic Registry
          </p>
          <h1
            style={{
              fontSize: 30,
              fontWeight: 900,
              color: "#0f172a",
              letterSpacing: "-0.75px",
              lineHeight: 1,
              margin: 0,
            }}
          >
            Admission Dashboard
          </h1>
          <p
            style={{
              color: "#94a3b8",
              fontSize: 14,
              fontWeight: 500,
              marginTop: 8,
            }}
          >
            Real-time overview · student metrics · application pipeline
          </p>
        </div>
       
      </div>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 4, borderRadius: 3, fontFamily: font }}
        >
          {error}
        </Alert>
      )}

      {/* ── Stat Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 16,
          marginBottom: 28,
        }}
        className="stats-grid"
      >
        <style>{`.stats-grid { @media (max-width:1200px) { grid-template-columns: repeat(3,1fr)!important; } @media (max-width:700px) { grid-template-columns: repeat(2,1fr)!important; } }`}</style>
        {[
          {
            title: "Total Students",
            value: stats.totalStudents,
            icon: People,
            accent: "#6366f1",
          },
          {
            title: "Total Admissions",
            value: stats.totalAdmissions,
            icon: Assignment,
            accent: "#06b6d4",
          },
          {
            title: "Submitted",
            value: stats.submitted,
            icon: TrendingUp,
            accent: "#f59e0b",
          },
          {
            title: "Drafts",
            value: stats.drafts,
            icon: Drafts,
            accent: "#94a3b8",
          },
          {
            title: "Accepted",
            value: stats.accepted,
            icon: CheckCircle,
            accent: "#10b981",
          },
        ].map((s) => (
          <StatCard key={s.title} loading={loading} {...s} />
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: 20,
          marginBottom: 20,
        }}
        className="charts-grid"
      >
        <style>{`.charts-grid { @media (max-width:1100px) { grid-template-columns: 1fr!important; } }`}</style>

        {/* Area Chart */}
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 28,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                  letterSpacing: "-0.3px",
                }}
              >
                Admission Trends
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: "#94a3b8",
                  fontWeight: 500,
                  marginTop: 4,
                }}
              >
                Applications vs acceptances over time
              </p>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {[
                { color: "#6366f1", label: "Applications" },
                { color: "#06b6d4", label: "Accepted" },
              ].map((l) => (
                <div
                  key={l.label}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: l.color,
                    }}
                  />
                  <span
                    style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}
                  >
                    {l.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 300,
              }}
            >
              <CircularProgress sx={{ color: "#6366f1" }} />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={trendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#94a3b8",
                    fontSize: 11,
                    fontFamily: font,
                    fontWeight: 700,
                  }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: font }}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="applications"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#gApps)"
                  name="Applications"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: "#6366f1",
                    strokeWidth: 2,
                    stroke: "white",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="accepted"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#gAcc)"
                  name="Accepted"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: "#06b6d4",
                    strokeWidth: 2,
                    stroke: "white",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Donut Chart */}
        <div style={cardStyle}>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "#0f172a",
              margin: 0,
              letterSpacing: "-0.3px",
            }}
          >
            By Class
          </h2>
          <p
            style={{
              fontSize: 12,
              color: "#94a3b8",
              fontWeight: 500,
              marginTop: 4,
              marginBottom: 20,
            }}
          >
            Active students per faculty
          </p>
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 220,
              }}
            >
              <CircularProgress sx={{ color: "#6366f1" }} />
            </div>
          ) : departmentStats.length === 0 ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 220,
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              No data available
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={departmentStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={6}
                  >
                    {departmentStats.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  maxHeight: 140,
                  overflowY: "auto",
                }}
              >
                {departmentStats.map((d, i) => {
                  const total = departmentStats.reduce(
                    (s, x) => s + x.value,
                    0,
                  );
                  const pct =
                    total > 0 ? Math.round((d.value / total) * 100) : 0;
                  return (
                    <div
                      key={i}
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: d.color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#475569",
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {d.name}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#0f172a",
                        }}
                      >
                        {d.value}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: d.color,
                          background: `${d.color}15`,
                          padding: "2px 6px",
                          borderRadius: 6,
                        }}
                      >
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom Row: Calendar + Table ── */}
      <div
        style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20 }}
        className="bottom-grid"
      >
        <style>{`.bottom-grid { @media (max-width:1000px) { grid-template-columns: 1fr!important; } }`}</style>

        {/* Calendar */}
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
              }}
            >
              Schedule
            </h2>
            <div style={{ display: "flex", gap: 4 }}>
              {[
                [
                  "prev",
                  <ChevronLeft fontSize="small" />,
                  () => setCurrentDate(subMonths(currentDate, 1)),
                ],
                [
                  "next",
                  <ChevronRight fontSize="small" />,
                  () => setCurrentDate(addMonths(currentDate, 1)),
                ],
              ].map(([k, icon, fn]) => (
                <button
                  key={k}
                  onClick={fn}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    background: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <p
            style={{
              textAlign: "center",
              fontWeight: 800,
              fontSize: 14,
              color: "#0f172a",
              marginBottom: 16,
            }}
          >
            {format(currentDate, "MMMM yyyy")}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7,1fr)",
              gap: 2,
              marginBottom: 10,
            }}
          >
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div
                key={d}
                style={{
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#cbd5e1",
                  padding: "4px 0",
                  letterSpacing: "0.05em",
                }}
              >
                {d}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {renderCalendarCells()}
          </div>

          <div
            style={{
              marginTop: 22,
              paddingTop: 20,
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#94a3b8",
                marginBottom: 12,
              }}
            >
              Upcoming Deadlines
            </p>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                padding: "12px 14px",
                borderRadius: 12,
                background: "#fff7ed",
                border: "1px solid #fed7aa",
              }}
            >
              <div
                style={{
                  width: 3,
                  height: 36,
                  background: "#f97316",
                  borderRadius: 4,
                  flexShrink: 0,
                }}
              />
              <div>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#9a3412",
                    margin: 0,
                  }}
                >
                  Fall Applications Close
                </p>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#c2410c",
                    margin: "3px 0 0",
                  }}
                >
                  In 3 days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Admissions Table */}
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 24,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Recent Admissions
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: "#94a3b8",
                  fontWeight: 500,
                  marginTop: 4,
                }}
              >
                Latest applications received
              </p>
            </div>
            <button
              style={{
                padding: "7px 14px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: "white",
                fontSize: 12,
                fontWeight: 700,
                color: "#475569",
                cursor: "pointer",
                fontFamily: font,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.color = "#0f172a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.color = "#475569";
              }}
            >
              View all →
            </button>
          </div>

          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 200,
              }}
            >
              <CircularProgress sx={{ color: "#6366f1" }} />
            </div>
          ) : recentAdmissions.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: 200,
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Assignment style={{ color: "#cbd5e1", fontSize: 22 }} />
              </div>
              <p style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>
                No recent admissions found.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontFamily: font,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    {["Applicant", "Program", "Date Applied", "Status"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            paddingBottom: 12,
                            textAlign: "left",
                            fontSize: 10,
                            fontWeight: 800,
                            color: "#cbd5e1",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {recentAdmissions.map((row, idx) => {
                    const sc = getStatusConfig(
                      row.status || row.application?.status,
                    );
                    const name = row.fullName || row.name || "Unknown";
                    const initial = name.charAt(0).toUpperCase();
                    const avatarColors = [
                      "#6366f1",
                      "#06b6d4",
                      "#10b981",
                      "#f59e0b",
                      "#f43f5e",
                    ];
                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: "1px solid #f8fafc",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#fafafa")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td style={{ padding: "14px 0" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 10,
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background:
                                  avatarColors[idx % avatarColors.length],
                                fontSize: 13,
                                fontWeight: 800,
                                color: "white",
                              }}
                            >
                              {initial}
                            </div>
                            <div>
                              <p
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: "#0f172a",
                                  margin: 0,
                                  lineHeight: 1.3,
                                }}
                              >
                                {name}
                              </p>
                              <p
                                style={{
                                  fontSize: 11,
                                  color: "#94a3b8",
                                  fontWeight: 500,
                                  margin: "2px 0 0",
                                }}
                              >
                                {row.cnic || row.email || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "14px 12px" }}>
                          <p
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#475569",
                              margin: 0,
                            }}
                          >
                            {row.academic?.program?.name ||
                              row.program ||
                              "N/A"}
                          </p>
                        </td>
                        <td style={{ padding: "14px 12px" }}>
                          <p
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#94a3b8",
                              margin: 0,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.createdAt
                              ? format(new Date(row.createdAt), "dd MMM yyyy")
                              : "N/A"}
                          </p>
                        </td>
                        <td style={{ padding: "14px 0" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "4px 10px",
                              borderRadius: 8,
                              fontSize: 10,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              background: sc.bg,
                              color: sc.text,
                            }}
                          >
                            <span
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                background: sc.dot,
                              }}
                            />
                            {row.status || row.application?.status || "Unknown"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Completed Admissions This Session ── */}
      <div style={{ ...cardStyle, marginTop: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
              }}
            >
              Completed Admissions — This Session
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "#94a3b8",
                fontWeight: 500,
                marginTop: 4,
              }}
            >
              Fee paid, application confirmed complete and cleared
            </p>
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#065f46",
              background: "#ecfdf5",
              padding: "5px 12px",
              borderRadius: 10,
            }}
          >
            {completedAdmissions.length} student{completedAdmissions.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 160,
            }}
          >
            <CircularProgress sx={{ color: "#6366f1" }} />
          </div>
        ) : completedAdmissions.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: 160,
              gap: 12,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: "#f8fafc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle style={{ color: "#cbd5e1", fontSize: 22 }} />
            </div>
            <p style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>
              No admissions confirmed complete yet this session.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: font }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {["Student", "Program / Department", "Session · Semester", "Contact", "Completed On", "Confirmed By"].map((h) => (
                    <th
                      key={h}
                      style={{
                        paddingBottom: 12,
                        textAlign: "left",
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#cbd5e1",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {completedAdmissions.map((rec, idx) => {
                  const sp = rec.snapshot?.studentProfile || {};
                  const pInfo = rec.snapshot?.personalInfo || {};
                  const name = pInfo.fullName || "Unknown";
                  const avatarColors = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e"];
                  return (
                    <tr key={rec._id || idx} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "14px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: avatarColors[idx % avatarColors.length],
                              fontSize: 13,
                              fontWeight: 800,
                              color: "white",
                            }}
                          >
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>
                              {name}
                            </p>
                            <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, margin: "2px 0 0" }}>
                              {sp.studentId || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 12px" }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", margin: 0 }}>
                          {sp.programId?.name || "N/A"}
                        </p>
                        <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, margin: "2px 0 0" }}>
                          {sp.departmentId?.name || "N/A"}
                        </p>
                      </td>
                      <td style={{ padding: "14px 12px" }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", margin: 0 }}>
                          {sp.termId?.name || "N/A"}
                        </p>
                        <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, margin: "2px 0 0" }}>
                          {sp.semesterId?.number ? `Section ${sp.semesterId.number}` : "N/A"}
                        </p>
                      </td>
                      <td style={{ padding: "14px 12px" }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", margin: 0 }}>
                          {pInfo.phone || "N/A"}
                        </p>
                        <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, margin: "2px 0 0" }}>
                          {pInfo.email || pInfo.cnic || "N/A"}
                        </p>
                      </td>
                      <td style={{ padding: "14px 12px" }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", margin: 0, whiteSpace: "nowrap" }}>
                          {rec.completedAt ? format(new Date(rec.completedAt), "dd MMM yyyy") : "N/A"}
                        </p>
                      </td>
                      <td style={{ padding: "14px 12px" }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", margin: 0 }}>
                          {rec.completedBy?.email || "N/A"}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
