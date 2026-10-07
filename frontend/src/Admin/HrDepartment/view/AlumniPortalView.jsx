import React from "react";
import {
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  Button,
  Chip,
  Avatar,
  Skeleton,
  Tooltip,
} from "@mui/material";
import {
  Search,
  FilterAlt,
  RestartAlt,
  Business,
  Badge as BadgeIcon,
  ExitToApp,
  School as GraduationCap,
  PersonOff as UserX,
  PersonRemove as UserMinus,
  Groups as Users,
  Mail,
  Phone,
  EventBusy,
  Schedule,
} from "@mui/icons-material";

const EXIT_TYPE_MAP = {
  Resignation: { label: "Resigned", color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  Resigned: { label: "Resigned", color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  Termination: { label: "Terminated", color: "#be123c", bg: "#fff1f2", border: "#fecdd3" },
  Terminated: { label: "Terminated", color: "#be123c", bg: "#fff1f2", border: "#fecdd3" },
  Retirement: { label: "Retired", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  "Contract Expiry": { label: "Contract Ended", color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0" },
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#7c3aed,#a78bfa)",
  "linear-gradient(135deg,#2563eb,#60a5fa)",
  "linear-gradient(135deg,#059669,#34d399)",
  "linear-gradient(135deg,#c2410c,#fb923c)",
  "linear-gradient(135deg,#be123c,#fb7185)",
  "linear-gradient(135deg,#0891b2,#67e8f9)",
];
const gradientFor = (seed) => AVATAR_GRADIENTS[(seed || 0) % AVATAR_GRADIENTS.length];

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 1.75, sm: 2.5 },
      minWidth: 0,
      borderRadius: 2.5,
      border: "1px solid #e2e8f0",
      bgcolor: "#fff",
      display: "flex",
      alignItems: "center",
      gap: { xs: 1.25, sm: 2 },
    }}
  >
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: 2,
        bgcolor: bg,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon sx={{ fontSize: 22 }} />
    </Box>
    <Box minWidth={0}>
      <Typography fontSize={24} fontWeight={800} color="#0f172a" lineHeight={1} fontFamily="'Aleo', serif">
        {value}
      </Typography>
      <Typography fontSize={12} fontWeight={700} color="#64748b" mt={0.5} noWrap>
        {label}
      </Typography>
    </Box>
  </Paper>
);

const FieldCard = ({ icon: Icon, label, accent = "#7c3aed", children }) => (
  <Box
    sx={{
      border: "1px solid #e2e8f0",
      borderRadius: 2,
      p: 1.5,
      bgcolor: "#fff",
      minWidth: 0,
      transition: "all 0.15s",
      "&:hover": { borderColor: "#cbd5e1" },
    }}
  >
    <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
      <Box
        sx={{
          width: 20,
          height: 20,
          borderRadius: 1,
          bgcolor: `${accent}1a`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 12.5, color: accent }} />
      </Box>
      <Typography fontSize={10} fontWeight={800} color="#94a3b8" textTransform="uppercase" letterSpacing="0.05em" noWrap>
        {label}
      </Typography>
    </Box>
    {children}
  </Box>
);

const fieldSelectSx = {
  fontSize: 13.5,
  fontWeight: 700,
  color: "#1e293b",
  ".MuiSelect-select": { py: 0.25 },
};

const AlumnusCard = ({ a, index }) => {
  const exitCfg = EXIT_TYPE_MAP[a.exitType] || EXIT_TYPE_MAP[a.status] || {
    label: a.status,
    color: "#64748b",
    bg: "#f1f5f9",
    border: "#e2e8f0",
  };
  const name = a.personalInfo?.name || "Unknown";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2.5,
        border: "1px solid #e2e8f0",
        bgcolor: "#fff",
        overflow: "hidden",
        transition: "all 0.18s",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        "&:hover": { boxShadow: "0 8px 24px -8px rgba(15,23,42,0.15)", borderColor: "#c4b5fd" },
      }}
    >
      <Box sx={{ p: 2.25, pb: 1.5, display: "flex", gap: 1.5, alignItems: "flex-start" }}>
        <Avatar
          src={a.personalInfo?.profilePhotoUrl || undefined}
          sx={{
            width: 46,
            height: 46,
            background: gradientFor(index),
            color: "#fff",
            fontWeight: 800,
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          {initials}
        </Avatar>
        <Box minWidth={0} flex={1}>
          <Typography fontSize={14.5} fontWeight={800} color="#0f172a" noWrap>
            {name}
          </Typography>
          <Typography fontSize={11.5} color="#94a3b8" fontWeight={700} noWrap>
            {a.employeeId}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2.25, display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
        <Chip
          label={a.designation || "Staff"}
          size="small"
          sx={{ fontSize: 11, fontWeight: 700, height: 22, bgcolor: "#f5f3ff", color: "#6d28d9" }}
        />
        <Chip
          label={exitCfg.label}
          size="small"
          sx={{
            fontSize: 11,
            fontWeight: 800,
            height: 22,
            bgcolor: exitCfg.bg,
            color: exitCfg.color,
            border: `1px solid ${exitCfg.border}`,
          }}
        />
      </Box>

      <Box sx={{ px: 2.25, pb: 1, display: "flex", alignItems: "center", gap: 0.75 }}>
        <Business sx={{ fontSize: 14, color: "#94a3b8" }} />
        <Typography fontSize={12.5} color="#475569" fontWeight={600} noWrap>
          {a.departmentId?.name || "Administrative / Non-Dept"}
        </Typography>
      </Box>

      <Box sx={{ px: 2.25, pb: 1, display: "flex", alignItems: "center", gap: 0.75 }}>
        <EventBusy sx={{ fontSize: 14, color: "#94a3b8" }} />
        <Typography fontSize={12.5} color="#475569" fontWeight={600} noWrap>
          Left {fmtDate(a.lastWorkingDay)}
        </Typography>
      </Box>

      {a.service && (
        <Box sx={{ px: 2.25, pb: 1.5, display: "flex", alignItems: "center", gap: 0.75 }}>
          <Schedule sx={{ fontSize: 14, color: "#94a3b8" }} />
          <Typography fontSize={12.5} color="#475569" fontWeight={600} noWrap>
            {a.service} of service
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: "auto", px: 2.25, py: 1.5, borderTop: "1px solid #f1f5f9", display: "flex", gap: 1 }}>
        {a.officialEmail && (
          <Tooltip title={a.officialEmail}>
            <Box
              component="a"
              href={`mailto:${a.officialEmail}`}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                borderRadius: 1.5,
                bgcolor: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#475569",
                "&:hover": { bgcolor: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" },
              }}
            >
              <Mail sx={{ fontSize: 15 }} />
            </Box>
          </Tooltip>
        )}
        {a.phone && (
          <Tooltip title={a.phone}>
            <Box
              component="a"
              href={`tel:${a.phone}`}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                borderRadius: 1.5,
                bgcolor: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#475569",
                "&:hover": { bgcolor: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0" },
              }}
            >
              <Phone sx={{ fontSize: 15 }} />
            </Box>
          </Tooltip>
        )}
      </Box>
    </Paper>
  );
};

const AlumniPortalView = ({
  isLoading,
  alumni,
  totalCount,
  stats,
  departments,
  designations,
  exitTypes,
  search,
  setSearch,
  departmentFilter,
  setDepartmentFilter,
  designationFilter,
  setDesignationFilter,
  exitTypeFilter,
  setExitTypeFilter,
  hasActiveFilters,
  resetFilters,
}) => {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f8fafc", fontFamily: "'Montserrat', sans-serif" }}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={800} color="#0f172a" fontFamily="'Aleo', serif">
          Alumni Portal
        </Typography>
        <Typography variant="body2" color="#64748b" mt={0.25}>
          Former teachers and staff who have completed their journey with the institute.
        </Typography>
      </Box>

      {/* Stats */}
      <Box display="grid" gridTemplateColumns={{ xs: "1fr 1fr", sm: "repeat(4, 1fr)" }} gap={2} mb={3}>
        <StatCard icon={GraduationCap} label="Total Alumni" value={stats.total} color="#7c3aed" bg="#f5f3ff" />
        <StatCard icon={UserMinus} label="Resigned" value={stats.resigned} color="#b45309" bg="#fffbeb" />
        <StatCard icon={UserX} label="Terminated" value={stats.terminated} color="#be123c" bg="#fff1f2" />
        <StatCard icon={Users} label="Teaching Faculty" value={stats.teaching} color="#2563eb" bg="#eff6ff" />
      </Box>

      {/* Filter toolbar */}
      <Paper elevation={0} sx={{ borderRadius: 2.5, border: "1px solid #e2e8f0", bgcolor: "#fff", overflow: "hidden", mb: 3 }}>
        <Box
          sx={{
            px: 2.5,
            py: 1.75,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "0.5px solid #e2e8f0",
            bgcolor: "#f8fafc",
          }}
        >
          <Box display="flex" alignItems="center" gap={1.25}>
            <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FilterAlt sx={{ fontSize: 16, color: "#7c3aed" }} />
            </Box>
            <Box>
              <Typography fontSize={13} fontWeight={800} color="#0f172a">
                Find an Alumnus
              </Typography>
              <Typography fontSize={11} color="#94a3b8">
                {totalCount} former staff member{totalCount === 1 ? "" : "s"} on record
              </Typography>
            </Box>
          </Box>
          {hasActiveFilters && (
            <Button
              size="small"
              onClick={resetFilters}
              startIcon={<RestartAlt sx={{ fontSize: 15 }} />}
              sx={{ textTransform: "none", fontWeight: 700, fontSize: 12, color: "#64748b" }}
            >
              Reset Filters
            </Button>
          )}
        </Box>

        <Box
          sx={{
            p: 2.25,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1.4fr 1fr 1fr 1fr" },
            gap: 1.5,
          }}
        >
          <FieldCard icon={Search} label="Search" accent="#7c3aed">
            <input
              placeholder="Name, employee ID, designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                fontSize: 13.5,
                fontWeight: 700,
                color: "#1e293b",
                fontFamily: "'Montserrat', sans-serif",
                background: "transparent",
              }}
            />
          </FieldCard>

          <FieldCard icon={Business} label="Department" accent="#2563eb">
            <Select
              fullWidth
              variant="standard"
              disableUnderline
              displayEmpty
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              sx={fieldSelectSx}
              renderValue={(v) => (v ? departments.find((d) => d.id === v)?.name : <em style={{ color: "#94a3b8", fontStyle: "normal" }}>All Departments</em>)}
            >
              <MenuItem value="" sx={{ fontSize: 13 }}>
                <em>All Departments</em>
              </MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id} sx={{ fontSize: 13 }}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FieldCard>

          <FieldCard icon={BadgeIcon} label="Designation" accent="#059669">
            <Select
              fullWidth
              variant="standard"
              disableUnderline
              displayEmpty
              value={designationFilter}
              onChange={(e) => setDesignationFilter(e.target.value)}
              sx={fieldSelectSx}
              renderValue={(v) => v || <em style={{ color: "#94a3b8", fontStyle: "normal" }}>All Designations</em>}
            >
              <MenuItem value="" sx={{ fontSize: 13 }}>
                <em>All Designations</em>
              </MenuItem>
              {designations.map((d) => (
                <MenuItem key={d} value={d} sx={{ fontSize: 13 }}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FieldCard>

          <FieldCard icon={ExitToApp} label="Exit Type" accent="#c2410c">
            <Select
              fullWidth
              variant="standard"
              disableUnderline
              displayEmpty
              value={exitTypeFilter}
              onChange={(e) => setExitTypeFilter(e.target.value)}
              sx={fieldSelectSx}
              renderValue={(v) => (v ? EXIT_TYPE_MAP[v]?.label || v : <em style={{ color: "#94a3b8", fontStyle: "normal" }}>All Types</em>)}
            >
              <MenuItem value="" sx={{ fontSize: 13 }}>
                <em>All Types</em>
              </MenuItem>
              {exitTypes.map((t) => (
                <MenuItem key={t} value={t} sx={{ fontSize: 13 }}>
                  {EXIT_TYPE_MAP[t]?.label || t}
                </MenuItem>
              ))}
            </Select>
          </FieldCard>
        </Box>
      </Paper>

      {/* Alumni grid */}
      {isLoading ? (
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", lg: "repeat(3,1fr)", xl: "repeat(4,1fr)" }} gap={2.5}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={230} sx={{ borderRadius: 2.5 }} />
          ))}
        </Box>
      ) : alumni.length === 0 ? (
        <Paper
          elevation={0}
          sx={{ borderRadius: 2.5, border: "1px dashed #cbd5e1", bgcolor: "#fff", py: 8, textAlign: "center" }}
        >
          <GraduationCap sx={{ fontSize: 44, color: "#cbd5e1" }} />
          <Typography fontSize={14} fontWeight={700} color="#64748b" mt={1.5}>
            No alumni records match these filters.
          </Typography>
          <Typography fontSize={12.5} color="#94a3b8" mt={0.5}>
            Alumni appear here automatically once a staff exit is fully cleared.
          </Typography>
        </Paper>
      ) : (
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", lg: "repeat(3,1fr)", xl: "repeat(4,1fr)" }} gap={2.5}>
          {alumni.map((a, i) => (
            <AlumnusCard key={a._id} a={a} index={i} />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AlumniPortalView;
