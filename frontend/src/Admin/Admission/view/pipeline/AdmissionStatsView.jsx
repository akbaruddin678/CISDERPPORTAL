import React from "react";
import { Box, Typography, Grid, Paper, LinearProgress, Stack } from "@mui/material";
import {
  Drafts,
  AssignmentTurnedIn,
  CheckCircleOutline,
  ReceiptLong,
  Paid,
  ErrorOutline,
  PersonOff,
  TrendingUp,
} from "@mui/icons-material";
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
} from "recharts";

const cardSx = {
  borderRadius: 4,
  border: "1px solid",
  borderColor: "divider",
  boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
};

const STAT_META = [
  { key: "draft", label: "Incomplete", color: "#64748b", bg: "#f1f5f9", icon: Drafts },
  { key: "submitted", label: "Complete", color: "#2563eb", bg: "#eff6ff", icon: AssignmentTurnedIn },
  { key: "accepted", label: "Accepted", color: "#7c3aed", bg: "#f5f3ff", icon: CheckCircleOutline },
  { key: "challanGenerated", label: "Challan Generated", color: "#d97706", bg: "#fffbeb", icon: ReceiptLong },
  { key: "feePaid", label: "Fee Paid", color: "#059669", bg: "#ecfdf5", icon: Paid },
  { key: "feeOverdue", label: "Fee Overdue", color: "#dc2626", bg: "#fef2f2", icon: ErrorOutline },
  { key: "cancelledNonPayment", label: "Cancelled — Non-Payment", color: "#78716c", bg: "#f5f5f4", icon: PersonOff },
];

const StatCard = ({ label, value, color, bg, icon: Icon }) => (
  <Paper
    variant="outlined"
    sx={{
      ...cardSx,
      p: 2.25,
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      height: "100%",
    }}
  >
    <Box
      sx={{
        width: 42,
        height: 42,
        borderRadius: "12px",
        bgcolor: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon sx={{ color, fontSize: 22 }} />
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography fontSize={12} color="text.secondary" fontWeight={600} noWrap>
        {label}
      </Typography>
      <Typography fontSize={22} fontWeight={800} sx={{ color: "text.primary", lineHeight: 1.2 }}>
        {value}
      </Typography>
    </Box>
  </Paper>
);

// One row of the funnel: a label, the count, and (except for the very top
// row) what percentage that is of the parent stage right above it.
const FunnelRow = ({ label, value, ofValue, color, indent = 0 }) => {
  const pct = ofValue ? Math.round((value / ofValue) * 100) : null;
  return (
    <Box sx={{ pl: indent * 2.5, py: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.6 }}>
        <Typography fontSize={13.5} fontWeight={indent === 0 ? 700 : 500} color={indent === 0 ? "text.primary" : "text.secondary"}>
          {label}
        </Typography>
        <Typography fontSize={13.5} fontWeight={700} sx={{ color }}>
          {value}
          {pct !== null && (
            <Typography component="span" fontSize={12} color="text.secondary" fontWeight={500}>
              {" "}({pct}%)
            </Typography>
          )}
        </Typography>
      </Box>
      {ofValue ? (
        <LinearProgress
          variant="determinate"
          value={pct || 0}
          sx={{ height: 6, borderRadius: 3, bgcolor: "grey.100", "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 } }}
        />
      ) : null}
    </Box>
  );
};

const AdmissionStatsView = ({ stats, chartData }) => {
  const totalActive = stats.totalSubmittedEver + stats.draft;

  return (
    <Box>
      {/* Hero banner */}
      <Paper
        sx={{
          ...cardSx,
          p: 3,
          mb: 3,
          background: "linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
            <TrendingUp fontSize="small" />
            <Typography fontSize={13} fontWeight={600} sx={{ opacity: 0.85 }}>
              Admission Process Overview
            </Typography>
          </Stack>
          <Typography fontSize={28} fontWeight={800}>
            {totalActive} Total Applications
          </Typography>
          <Typography fontSize={12.5} sx={{ opacity: 0.8, mt: 0.5 }}>
            Real-time counts across every stage — same numbers shown on each tab.
          </Typography>
        </Box>
        <Stack direction="row" gap={3}>
          <Box textAlign="right">
            <Typography fontSize={12} sx={{ opacity: 0.8 }}>In Trash</Typography>
            <Typography fontSize={20} fontWeight={800}>{stats.trashCount}</Typography>
          </Box>
        </Stack>
      </Paper>

      <Grid container spacing={2} mb={3}>
        {STAT_META.map((meta) => (
          <Grid item xs={6} sm={4} md={2} key={meta.key}>
            <StatCard label={meta.label} value={stats[meta.key]} color={meta.color} bg={meta.bg} icon={meta.icon} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ ...cardSx, p: 3, height: "100%" }}>
            <Typography variant="subtitle2" fontWeight={700} mb={0.25}>Admission Funnel</Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
              Every percentage is out of the stage directly above it.
            </Typography>

            <FunnelRow label="Total Submitted Applications" value={stats.totalSubmittedEver} color="#2563eb" />
            <FunnelRow label="Still Awaiting Accept/Reject" value={stats.submitted} ofValue={stats.totalSubmittedEver} color="#60a5fa" indent={1} />
            <FunnelRow label="Accepted" value={stats.acceptedTotal} ofValue={stats.totalSubmittedEver} color="#7c3aed" indent={1} />

            <Box sx={{ borderTop: "1px dashed", borderColor: "divider", my: 1.5 }} />

            <FunnelRow label="Challan Not Generated" value={stats.accepted} ofValue={stats.acceptedTotal} color="#94a3b8" indent={2} />
            <FunnelRow label="Challan Generated" value={stats.challanGeneratedTotal} ofValue={stats.acceptedTotal} color="#d97706" indent={2} />

            <Box sx={{ borderTop: "1px dashed", borderColor: "divider", my: 1.5 }} />

            <FunnelRow label="Fee Paid" value={stats.feePaid} ofValue={stats.challanGeneratedTotal} color="#059669" indent={3} />
            <FunnelRow label="Fee Overdue" value={stats.feeOverdue} ofValue={stats.challanGeneratedTotal} color="#dc2626" indent={3} />
            <FunnelRow label="Cancelled — Non-Payment" value={stats.cancelledNonPayment} ofValue={stats.challanGeneratedTotal} color="#78716c" indent={3} />
            <FunnelRow label="Fee Pending (not yet due)" value={stats.challanGenerated} ofValue={stats.challanGeneratedTotal} color="#f59e0b" indent={3} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ ...cardSx, p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Stage Distribution</Typography>

            {/* The donut sits in its own fixed-height box with nothing else
                inside it, so the center overlay can sit at a true 50/50 —
                recharts' own <Legend/> used to live inside this same
                container and pull the pie's visual center upward, which is
                why the total looked off-center. The legend is now a plain
                row built from the same chartData, laid out below in normal
                flow instead. */}
            <Box sx={{ position: "relative", height: 220 }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={64} outerRadius={92} paddingAngle={2} cornerRadius={4}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                  pointerEvents: "none",
                }}
              >
                <Typography fontSize={24} fontWeight={800} lineHeight={1.2}>
                  {stats.acceptedTotal + stats.draft + stats.submitted}
                </Typography>
                <Typography fontSize={11} color="text.secondary">Total</Typography>
              </Box>
            </Box>

            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: "1px solid",
                borderColor: "divider",
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                rowGap: 1,
                columnGap: 1.5,
              }}
            >
              {chartData.map((entry) => (
                <Box key={entry.name} sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: entry.color, flexShrink: 0 }} />
                  <Typography fontSize={12.5} color="text.secondary" noWrap sx={{ flex: 1 }}>
                    {entry.name}
                  </Typography>
                  <Typography fontSize={12.5} fontWeight={700}>
                    {entry.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ ...cardSx, p: 3 }}>
        <Typography variant="subtitle2" fontWeight={700} mb={2}>Pipeline Breakdown</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
            <YAxis allowDecimals={false} width={30} axisLine={false} tickLine={false} />
            <RechartsTooltip cursor={{ fill: "rgba(148,163,184,0.08)" }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={64}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
};

export default AdmissionStatsView;
