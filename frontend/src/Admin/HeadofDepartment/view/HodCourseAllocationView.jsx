import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Divider,
  Fade,
  Checkbox,
  Tooltip,
  alpha,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  Plus,
  Trash2,
  Download,
  Printer,
  FileSpreadsheet,
  BookOpen,
  GraduationCap,
  LayoutGrid,
  ChevronDown,
  CalendarDays,
  UserX,
  X,
  Users,
  Search,
  Save,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import * as XLSX from "xlsx";

// ─── Utility ──────────────────────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export const getInstructorName = (instructor) => {
  if (!instructor) return null;
  return (
    instructor.personalInfo?.name ||
    instructor.name ||
    (instructor.firstName
      ? `${instructor.firstName} ${instructor.lastName}`
      : "Unknown Teacher")
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <Paper
    elevation={0}
    sx={{
      flex: 1,
      minWidth: 130,
      border: "0.5px solid #e2e8f0",
      borderRadius: 2.5,
      p: 2,
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      bgcolor: "#fff",
    }}
  >
    <Box sx={{ bgcolor: bg, borderRadius: 2, p: 1, display: "flex" }}>
      {React.createElement(Icon, { size: 18, color })}
    </Box>
    <Box>
      <Typography
        fontSize={20}
        fontWeight={800}
        color="#0f172a"
        lineHeight={1}
        fontFamily="'Aleo', serif"
      >
        {value}
      </Typography>
      <Typography
        fontSize={11}
        color="#94a3b8"
        fontWeight={600}
        mt={0.25}
        fontFamily="'Montserrat', sans-serif"
      >
        {label}
      </Typography>
    </Box>
  </Paper>
);

// ─── Export Helpers ────────────────────────────────────────────────────────────
const exportAllocationsExcel = (rows, sheetName, terms) => {
  const mapped = rows.map((r) => ({
    Session: terms.find((t) => t._id === r.termId)?.name || "Unknown",
    Semester: `Section ${r.semesterId?.number || "?"}`,
    Course: r.courseId?.title,
    Code: r.courseId?.code,
    Section: r.section,
    Instructor: getInstructorName(r.instructorId) || "Not Assigned",
    "Registered Students": r.registeredCount ?? 0,
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(mapped),
    sheetName.slice(0, 31),
  );
  XLSX.writeFile(wb, `allocations_${Date.now()}.xlsx`);
};

const ExportMenu = ({ label, icon: Icon, color, items }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <Box ref={ref} sx={{ position: "relative" }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={React.createElement(Icon, { size: 13 })}
        endIcon={<ChevronDown size={11} />}
        onClick={() => setOpen((p) => !p)}
        sx={{
          borderColor: color,
          color,
          fontWeight: 700,
          fontFamily: "'Montserrat', sans-serif",
          fontSize: 12,
          textTransform: "none",
          px: 1.5,
        }}
      >
        {label}
      </Button>
      {open && (
        <Paper
          elevation={6}
          sx={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 1400,
            minWidth: 215,
            borderRadius: 2,
            overflow: "hidden",
            border: "0.5px solid #e2e8f0",
          }}
        >
          {items.map((item) => (
            <Box
              key={item.label}
              onClick={() => {
                item.action();
                setOpen(false);
              }}
              sx={{
                px: 2,
                py: 1.25,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                color: "#334155",
                fontFamily: "'Montserrat', sans-serif",
                "&:hover": { bgcolor: "#f1f5f9" },
              }}
            >
              <item.icon size={14} color={color} /> {item.label}
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
};

// ─── Breadcrumb ────────────────────────────────────────────────────────────────
const Crumb = ({ label, onClick, active }) => (
  <Box
    onClick={onClick}
    sx={{
      fontSize: 13,
      fontWeight: active ? 800 : 700,
      color: active ? "#0f172a" : "#2563eb",
      fontFamily: "'Montserrat', sans-serif",
      cursor: onClick ? "pointer" : "default",
      "&:hover": onClick ? { textDecoration: "underline" } : {},
    }}
  >
    {label}
  </Box>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const HodCourseAllocationView = ({
  filters,
  handleFilterChange,
  terms,
  departments,
  programs,
  semesters,
  isFetchingDepartments,
  isFetchingPrograms,
  isFetchingSemesters,
  isReady,
  allocations,
  isFetchingAllocations,
  handleDelete,
  isAdmin,
  selectedIds,
  toggleSelectRow,
  toggleSelectAllRows,
  clearSelection,
  handleBulkDelete,
  handleBulkUnassign,
  isBulkDeleting,
  isBulkUnassigning,
  drillLevel,
  sessionsWithCourses = [],
  sessionsWithoutCourses = [],
  addSessionOpen,
  setAddSessionOpen,
  handleSelectSession,
  handleAddNewSession,
  handleBackToSessions,
  handleBackToCourses,
  rosterCourse,
  rosterSelectedIds = [],
  rosterSearch,
  setRosterSearch,
  filteredRosterStudents = [],
  isFetchingRoster,
  isSavingRoster,
  handleOpenRoster,
  handleToggleRosterStudent,
  handleSelectAllRosterStudents,
  handleSaveRoster,
  handlePrintRoster,
}) => {
  const navigate = useNavigate();
  const getTermName = (id) =>
    terms.find((t) => t._id === id)?.name || "Unknown Session";
  const currentSemesterNumber = semesters.find(
    (s) => s._id === filters.semesterId,
  )?.number;

  const uniqueInstructors = useMemo(
    () =>
      new Set(
        allocations
          .filter((a) => a.instructorId)
          .map((a) => a.instructorId._id || a.instructorId),
      ).size,
    [allocations],
  );
  const distinctCourseCount = useMemo(
    () => new Set(allocations.map((a) => a.courseId?._id || a.courseId)).size,
    [allocations],
  );
  const totalRegisteredStudents = useMemo(() => {
    const seen = new Map();
    for (const a of allocations) {
      const key = `${a.termId}_${a.courseId?._id || a.courseId}_${a.semesterId?._id || a.semesterId}`;
      if (!seen.has(key)) seen.set(key, a.registeredCount || 0);
    }
    return [...seen.values()].reduce((sum, n) => sum + n, 0);
  }, [allocations]);

  return (
    <Fade in timeout={400}>
      <Box
        sx={{
          p: { xs: 2, md: 3 },
          minHeight: "100vh",
          bgcolor: "#f8fafc",
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        {/* ── Header ── */}
        <Box mb={3}>
          <Typography
            variant="h5"
            fontWeight={800}
            color="#0f172a"
            fontFamily="'Aleo', serif"
          >
            Academic Planning & History
          </Typography>
          <Typography
            variant="body2"
            color="#64748b"
            mt={0.25}
            fontFamily="'Montserrat', sans-serif"
          >
            Pick a Section, then a Session, then a Course to manage its
            student roster.
          </Typography>
        </Box>

        {/* ── Filter Context ── */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            border: "0.5px solid #e2e8f0",
            borderRadius: 2,
            bgcolor: "#fff",
          }}
        >
          <Typography
            fontSize={12}
            fontWeight={800}
            color="#94a3b8"
            textTransform="uppercase"
            fontFamily="'Montserrat', sans-serif"
            mb={2}
            letterSpacing="0.05em"
          >
            Filter Context
          </Typography>
          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}
            gap={2}
          >
            <TextField
              select
              size="small"
              label="1. Class"
              value={filters.departmentId}
              onChange={(e) =>
                handleFilterChange("departmentId", e.target.value)
              }
              disabled={!isAdmin || isFetchingDepartments}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: 13,
                },
              }}
            >
              {departments.map((d) => (
                <MenuItem key={d._id} value={d._id} sx={{ fontSize: 13 }}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="2. Program"
              value={filters.programId}
              onChange={(e) => handleFilterChange("programId", e.target.value)}
              disabled={!filters.departmentId || isFetchingPrograms}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: 13,
                },
              }}
            >
              {programs.map((p) => (
                <MenuItem key={p._id} value={p._id} sx={{ fontSize: 13 }}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Semester — a visible listbox (not a collapsed dropdown), always
              in numeric order. Selecting one drops you into the Sessions
              level for that semester. */}
          <Box mt={2.5}>
            <Typography
              fontSize={12}
              fontWeight={800}
              color="#94a3b8"
              textTransform="uppercase"
              fontFamily="'Montserrat', sans-serif"
              letterSpacing="0.05em"
              mb={1}
            >
              3. Section
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {semesters.map((s) => (
                <Chip
                  key={s._id}
                  label={`Section ${s.number}`}
                  size="small"
                  onClick={() => handleFilterChange("semesterId", s._id)}
                  disabled={!filters.programId || isFetchingSemesters}
                  sx={{
                    fontWeight: 700,
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 12,
                    bgcolor:
                      filters.semesterId === s._id ? "#2563eb" : "#f1f5f9",
                    color: filters.semesterId === s._id ? "#fff" : "#475569",
                    "&:hover": {
                      bgcolor:
                        filters.semesterId === s._id ? "#2563eb" : "#e2e8f0",
                    },
                  }}
                />
              ))}
              {filters.programId &&
                !isFetchingSemesters &&
                semesters.length === 0 && (
                  <Typography
                    fontSize={12}
                    color="#94a3b8"
                    fontFamily="'Montserrat', sans-serif"
                    fontStyle="italic"
                    sx={{ alignSelf: "center" }}
                  >
                    No sections found for this program.
                  </Typography>
                )}
            </Box>
          </Box>
        </Paper>

        {!isReady ? (
          <Box py={8} textAlign="center" color="#94a3b8">
            <LayoutGrid size={44} style={{ marginBottom: 12, opacity: 0.25 }} />
            <Typography
              fontSize={14}
              fontWeight={700}
              color="#64748b"
              fontFamily="'Montserrat', sans-serif"
            >
              Select a Class and Program to view academic history.
            </Typography>
          </Box>
        ) : !filters.semesterId ? (
          <Box py={8} textAlign="center" color="#94a3b8">
            <LayoutGrid size={44} style={{ marginBottom: 12, opacity: 0.25 }} />
            <Typography
              fontSize={14}
              fontWeight={700}
              color="#64748b"
              fontFamily="'Montserrat', sans-serif"
            >
              Select a Section above to see its sessions.
            </Typography>
          </Box>
        ) : (
          <>
            {/* ── Breadcrumb ── */}
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Crumb
                label={`Section ${currentSemesterNumber ?? "?"}`}
                onClick={
                  drillLevel !== "sessions" ? handleBackToSessions : undefined
                }
                active={drillLevel === "sessions"}
              />
              {drillLevel !== "sessions" && (
                <>
                  <ChevronRight size={14} color="#94a3b8" />
                  <Crumb
                    label={getTermName(filters.termId)}
                    onClick={
                      drillLevel === "students" ? handleBackToCourses : undefined
                    }
                    active={drillLevel === "courses"}
                  />
                </>
              )}
              {drillLevel === "students" && (
                <>
                  <ChevronRight size={14} color="#94a3b8" />
                  <Crumb
                    label={rosterCourse?.courseId?.title || "Course"}
                    active
                  />
                </>
              )}
            </Box>

            {/* ══════════════ LEVEL: SESSIONS ══════════════ */}
            {drillLevel === "sessions" && (
              <>
                <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                  <StatCard
                    icon={CalendarDays}
                    label="Sessions With Courses"
                    value={sessionsWithCourses.length}
                    color="#1d4ed8"
                    bg="#eff6ff"
                  />
                  <StatCard
                    icon={BookOpen}
                    label="Total Courses (All Sessions)"
                    value={sessionsWithCourses.reduce(
                      (sum, s) => sum + s.courseCount,
                      0,
                    )}
                    color="#7c3aed"
                    bg="#f5f3ff"
                  />
                  <StatCard
                    icon={Users}
                    label="Total Registered Students"
                    value={sessionsWithCourses.reduce(
                      (sum, s) => sum + s.registeredCount,
                      0,
                    )}
                    color="#0891b2"
                    bg="#ecfeff"
                  />
                </Box>

                {isFetchingAllocations ? (
                  <Box py={10} textAlign="center">
                    <CircularProgress size={30} sx={{ color: "#2563eb" }} />
                  </Box>
                ) : (
                  <Box
                    display="grid"
                    gridTemplateColumns={{
                      xs: "1fr",
                      sm: "1fr 1fr",
                      md: "repeat(3, 1fr)",
                    }}
                    gap={2}
                  >
                    {sessionsWithCourses.map((s) => (
                      <Paper
                        key={s.termId}
                        elevation={0}
                        onClick={() => handleSelectSession(s.termId)}
                        sx={{
                          p: 2.5,
                          border: "0.5px solid #e2e8f0",
                          borderRadius: 2.5,
                          bgcolor: "#fff",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          "&:hover": {
                            borderColor: "#93c5fd",
                            boxShadow: "0 2px 10px rgba(37,99,235,0.08)",
                          },
                        }}
                      >
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          mb={1.5}
                        >
                          <Typography
                            fontWeight={800}
                            fontSize={15}
                            color="#0f172a"
                            fontFamily="'Aleo', serif"
                          >
                            {s.termName}
                          </Typography>
                          <ChevronRight size={18} color="#94a3b8" />
                        </Box>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          <Chip
                            size="small"
                            icon={<BookOpen size={12} />}
                            label={`${s.courseCount} course${s.courseCount === 1 ? "" : "s"}`}
                            sx={{
                              bgcolor: "#eff6ff",
                              color: "#1d4ed8",
                              fontWeight: 700,
                              fontSize: 11,
                              fontFamily: "'Montserrat', sans-serif",
                            }}
                          />
                          <Chip
                            size="small"
                            icon={<Users size={12} />}
                            label={`${s.registeredCount} registered`}
                            sx={{
                              bgcolor: "#ecfeff",
                              color: "#0e7490",
                              fontWeight: 700,
                              fontSize: 11,
                              fontFamily: "'Montserrat', sans-serif",
                            }}
                          />
                        </Box>
                      </Paper>
                    ))}

                    {/* + Start a new session */}
                    <Paper
                      elevation={0}
                      onClick={() =>
                        sessionsWithoutCourses.length > 0 &&
                        setAddSessionOpen(true)
                      }
                      sx={{
                        p: 2.5,
                        border: "1.5px dashed #cbd5e1",
                        borderRadius: 2.5,
                        bgcolor: "transparent",
                        cursor:
                          sessionsWithoutCourses.length > 0
                            ? "pointer"
                            : "not-allowed",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                        minHeight: 96,
                        opacity: sessionsWithoutCourses.length > 0 ? 1 : 0.5,
                        "&:hover":
                          sessionsWithoutCourses.length > 0
                            ? { borderColor: "#2563eb", bgcolor: "#eff6ff" }
                            : {},
                      }}
                    >
                      <Plus size={20} color="#2563eb" />
                      <Typography
                        fontSize={13}
                        fontWeight={700}
                        color="#2563eb"
                        fontFamily="'Montserrat', sans-serif"
                      >
                        Start a New Session
                      </Typography>
                    </Paper>
                  </Box>
                )}

                {sessionsWithCourses.length === 0 && !isFetchingAllocations && (
                  <Box py={5} textAlign="center" color="#94a3b8">
                    <Typography fontSize={13} fontWeight={700}>
                      No sessions have courses in this section yet — start one
                      above.
                    </Typography>
                  </Box>
                )}
              </>
            )}

            {/* ══════════════ LEVEL: COURSES ══════════════ */}
            {drillLevel === "courses" && (
              <>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Button
                    size="small"
                    startIcon={<ArrowLeft size={14} />}
                    onClick={handleBackToSessions}
                    sx={{
                      color: "#64748b",
                      fontWeight: 700,
                      textTransform: "none",
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: 12,
                    }}
                  >
                    Back to Sessions
                  </Button>
                </Box>

                <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                  <StatCard
                    icon={BookOpen}
                    label="Number of Courses"
                    value={distinctCourseCount}
                    color="#1d4ed8"
                    bg="#eff6ff"
                  />
                  <StatCard
                    icon={Users}
                    label="Registered Students"
                    value={totalRegisteredStudents}
                    color="#0891b2"
                    bg="#ecfeff"
                  />
                  <StatCard
                    icon={GraduationCap}
                    label="Assigned Faculty"
                    value={uniqueInstructors}
                    color="#15803d"
                    bg="#f0fdf4"
                  />
                </Box>

                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    mb: 2,
                    border: "0.5px solid #e2e8f0",
                    borderRadius: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1.5,
                    bgcolor: "#fff",
                  }}
                >
                  <Typography
                    fontSize={14}
                    fontWeight={800}
                    color="#1e293b"
                    fontFamily="'Aleo', serif"
                  >
                    {getTermName(filters.termId)} — Semester{" "}
                    {currentSemesterNumber ?? "?"}
                  </Typography>
                  <Box display="flex" gap={1.5}>
                    <ExportMenu
                      label="Excel"
                      icon={FileSpreadsheet}
                      color="#059669"
                      items={[
                        {
                          label: "Export All",
                          icon: FileSpreadsheet,
                          action: () =>
                            exportAllocationsExcel(
                              allocations,
                              "Allocations",
                              terms,
                            ),
                        },
                      ]}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Plus size={14} />}
                      onClick={() =>
                        navigate(
                          `/hod/course/allocation/assign/${filters.departmentId}/${filters.programId}/${filters.semesterId}/${filters.termId}`,
                        )
                      }
                      sx={{
                        bgcolor: "#2563eb",
                        fontWeight: 700,
                        boxShadow: "none",
                        textTransform: "none",
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: 13,
                        px: 2,
                      }}
                    >
                      Assign Course
                    </Button>
                  </Box>
                </Paper>

                {selectedIds.size > 0 && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      mb: 2,
                      border: "0.5px solid #bfdbfe",
                      borderRadius: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      bgcolor: "#eff6ff",
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <IconButton
                        size="small"
                        onClick={clearSelection}
                        sx={{ color: "#1d4ed8" }}
                      >
                        <X size={15} />
                      </IconButton>
                      <Typography
                        fontSize={13}
                        fontWeight={800}
                        color="#1d4ed8"
                        fontFamily="'Montserrat', sans-serif"
                      >
                        {selectedIds.size} offering
                        {selectedIds.size > 1 ? "s" : ""} selected
                      </Typography>
                    </Box>
                    <Box display="flex" gap={1.5}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<UserX size={14} />}
                        onClick={handleBulkUnassign}
                        disabled={isBulkUnassigning || isBulkDeleting}
                        sx={{
                          borderColor: "#f59e0b",
                          color: "#b45309",
                          fontWeight: 700,
                          textTransform: "none",
                          fontFamily: "'Montserrat', sans-serif",
                          fontSize: 12,
                        }}
                      >
                        {isBulkUnassigning
                          ? "Unassigning..."
                          : "Unassign Instructor"}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Trash2 size={14} />}
                        onClick={handleBulkDelete}
                        disabled={isBulkDeleting || isBulkUnassigning}
                        sx={{
                          borderColor: "#dc2626",
                          color: "#dc2626",
                          fontWeight: 700,
                          textTransform: "none",
                          fontFamily: "'Montserrat', sans-serif",
                          fontSize: 12,
                        }}
                      >
                        {isBulkDeleting ? "Deleting..." : "Delete Selected"}
                      </Button>
                    </Box>
                  </Paper>
                )}

                <Paper
                  elevation={0}
                  sx={{
                    border: "0.5px solid #e2e8f0",
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: "#fff",
                  }}
                >
                  {isFetchingAllocations ? (
                    <Box py={10} textAlign="center">
                      <CircularProgress size={30} sx={{ color: "#2563eb" }} />
                    </Box>
                  ) : allocations.length === 0 ? (
                    <Box py={9} textAlign="center" color="#94a3b8">
                      <Typography fontSize={14} fontWeight={700}>
                        No courses assigned to this session yet.
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "#f8fafc" }}>
                            <TableCell
                              padding="checkbox"
                              sx={{ pl: 2, borderBottom: "0.5px solid #e2e8f0" }}
                            >
                              <Checkbox
                                size="small"
                                checked={
                                  allocations.length > 0 &&
                                  selectedIds.size === allocations.length
                                }
                                indeterminate={
                                  selectedIds.size > 0 &&
                                  selectedIds.size < allocations.length
                                }
                                onChange={toggleSelectAllRows}
                              />
                            </TableCell>
                            {[
                              "Course Details",
                              "Section",
                              "Registered Students",
                              "Assigned Faculty",
                              "Actions",
                            ].map((h) => (
                              <TableCell
                                key={h}
                                align={h === "Actions" ? "right" : "left"}
                                sx={{
                                  fontSize: 11,
                                  fontWeight: 800,
                                  textTransform: "uppercase",
                                  color: "#64748b",
                                  py: 1.75,
                                  fontFamily: "'Montserrat', sans-serif",
                                }}
                              >
                                {h}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {allocations.map((row) => {
                            const isSelected = selectedIds.has(row._id);
                            const instructorName = getInstructorName(
                              row.instructorId,
                            );

                            return (
                              <TableRow
                                key={row._id}
                                hover
                                sx={{
                                  bgcolor: isSelected
                                    ? alpha("#2563eb", 0.04)
                                    : "transparent",
                                }}
                              >
                                <TableCell padding="checkbox" sx={{ pl: 2 }}>
                                  <Checkbox
                                    size="small"
                                    checked={isSelected}
                                    onChange={() => toggleSelectRow(row._id)}
                                  />
                                </TableCell>

                                <TableCell
                                  sx={{
                                    minWidth: 200,
                                    cursor: "pointer",
                                    "&:hover .course-details-title": {
                                      textDecoration: "underline",
                                    },
                                  }}
                                  onClick={() => handleOpenRoster(row)}
                                >
                                  <Typography
                                    className="course-details-title"
                                    fontWeight={800}
                                    fontSize={14}
                                    color="#1d4ed8"
                                    fontFamily="'Montserrat', sans-serif"
                                  >
                                    {row.courseId?.title}
                                  </Typography>
                                  <Typography
                                    fontSize={11}
                                    fontWeight={700}
                                    color="#059669"
                                    mt={0.3}
                                    fontFamily="'Montserrat', sans-serif"
                                  >
                                    {row.courseId?.code}
                                  </Typography>
                                </TableCell>

                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={`Sec ${row.section}`}
                                    sx={{
                                      bgcolor: "#f1f5f9",
                                      color: "#475569",
                                      fontWeight: 800,
                                      fontSize: 11,
                                      fontFamily: "'Montserrat', sans-serif",
                                    }}
                                  />
                                </TableCell>

                                <TableCell
                                  sx={{ cursor: "pointer" }}
                                  onClick={() => handleOpenRoster(row)}
                                >
                                  <Tooltip title="Open student roster" arrow>
                                    <Chip
                                      size="small"
                                      icon={<Users size={13} />}
                                      label={`${row.registeredCount ?? 0}/${row.capacity ?? "—"} seats`}
                                      sx={{
                                        bgcolor:
                                          (row.registeredCount ?? 0) > 0
                                            ? "#ecfeff"
                                            : "#f8fafc",
                                        color:
                                          (row.registeredCount ?? 0) > 0
                                            ? "#0e7490"
                                            : "#94a3b8",
                                        fontWeight: 800,
                                        fontSize: 11,
                                        fontFamily: "'Montserrat', sans-serif",
                                        "& .MuiChip-icon": { color: "inherit" },
                                      }}
                                    />
                                  </Tooltip>
                                </TableCell>

                                <TableCell>
                                  {instructorName ? (
                                    <Typography
                                      fontSize={13}
                                      fontWeight={700}
                                      color="#334155"
                                      fontFamily="'Montserrat', sans-serif"
                                    >
                                      {instructorName}
                                    </Typography>
                                  ) : (
                                    <Typography
                                      fontSize={12}
                                      fontWeight={700}
                                      color="#dc2626"
                                      fontFamily="'Montserrat', sans-serif"
                                    >
                                      Not Assigned
                                    </Typography>
                                  )}
                                </TableCell>

                                <TableCell align="right">
                                  <Box
                                    display="flex"
                                    gap={1}
                                    justifyContent="flex-end"
                                  >
                                    <Tooltip title="Open student roster" arrow>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleOpenRoster(row)}
                                        sx={{
                                          color: "#2563eb",
                                          border: "1px solid #bfdbfe",
                                          borderRadius: 1.5,
                                        }}
                                      >
                                        <Users size={15} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Remove offering" arrow>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDelete(row._id)}
                                        sx={{
                                          color: "#dc2626",
                                          border: "1px solid #fca5a5",
                                          borderRadius: 1.5,
                                        }}
                                      >
                                        <Trash2 size={15} />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Paper>
              </>
            )}

            {/* ══════════════ LEVEL: STUDENTS (full page, not a drawer/modal) ══════════════ */}
            {drillLevel === "students" && (
              <Box id="hod-course-roster-print">
                <style>{`
                  @media print {
                    body * { visibility: hidden !important; }
                    #hod-course-roster-print, #hod-course-roster-print * {
                      visibility: visible !important;
                    }
                    #hod-course-roster-print {
                      position: absolute !important;
                      left: 0; top: 0; width: 100%;
                    }
                  }
                `}</style>

                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Button
                    size="small"
                    startIcon={<ArrowLeft size={14} />}
                    onClick={handleBackToCourses}
                    sx={{
                      color: "#64748b",
                      fontWeight: 700,
                      textTransform: "none",
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: 12,
                    }}
                  >
                    Back to Courses
                  </Button>
                </Box>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    mb: 2.5,
                    border: "0.5px solid #e2e8f0",
                    borderRadius: 2,
                    bgcolor: "#fff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h6"
                      fontWeight={800}
                      fontFamily="'Aleo', serif"
                      color="#0f172a"
                    >
                      {rosterCourse?.courseId?.title || "Course"}
                    </Typography>
                    <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                      <Chip
                        size="small"
                        label={rosterCourse?.courseId?.code || "—"}
                        sx={{
                          bgcolor: "#f0fdf4",
                          color: "#15803d",
                          fontWeight: 700,
                          fontSize: 11,
                        }}
                      />
                      <Chip
                        size="small"
                        label={`Sec ${rosterCourse?.section || "?"}`}
                        sx={{
                          bgcolor: "#f1f5f9",
                          color: "#475569",
                          fontWeight: 700,
                          fontSize: 11,
                        }}
                      />
                      <Chip
                        size="small"
                        label={getTermName(filters.termId)}
                        sx={{
                          bgcolor: "#eff6ff",
                          color: "#1d4ed8",
                          fontWeight: 700,
                          fontSize: 11,
                        }}
                      />
                      <Chip
                        size="small"
                        label={`Section ${currentSemesterNumber ?? "?"}`}
                        sx={{
                          bgcolor: "#f5f3ff",
                          color: "#6d28d9",
                          fontWeight: 700,
                          fontSize: 11,
                        }}
                      />
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Printer size={14} />}
                    onClick={handlePrintRoster}
                    sx={{
                      borderColor: "#7c3aed",
                      color: "#7c3aed",
                      fontWeight: 700,
                      textTransform: "none",
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: 12,
                    }}
                  >
                    Print Roster
                  </Button>
                </Paper>

                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search student by name or reg. no..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={15} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 2.5,
                    "& .MuiOutlinedInput-root": {
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: 13,
                      bgcolor: "#fff",
                    },
                  }}
                />

                {isFetchingRoster ? (
                  <Box py={10} textAlign="center">
                    <CircularProgress size={28} sx={{ color: "#2563eb" }} />
                  </Box>
                ) : filteredRosterStudents.length === 0 ? (
                  <Box py={10} textAlign="center" color="#94a3b8">
                    <Users size={40} style={{ opacity: 0.25, marginBottom: 8 }} />
                    <Typography fontSize={13} fontWeight={700}>
                      No eligible students found.
                    </Typography>
                  </Box>
                ) : (
                  (() => {
                    const assignedStudents = filteredRosterStudents.filter((s) =>
                      rosterSelectedIds.includes(s._id),
                    );
                    const availableStudents = filteredRosterStudents.filter(
                      (s) => !rosterSelectedIds.includes(s._id),
                    );
                    const renderRow = (student, isEnrolled) => (
                      <Paper
                        key={student._id}
                        elevation={0}
                        sx={{
                          mb: 1.5,
                          border: isEnrolled
                            ? "1px solid #93c5fd"
                            : "1px solid #e2e8f0",
                          bgcolor: isEnrolled ? "#eff6ff" : "white",
                          borderRadius: 2,
                        }}
                      >
                        <ListItem>
                          <ListItemText
                            primary={
                              <Typography
                                fontWeight={700}
                                fontSize={13}
                                color={isEnrolled ? "#1d4ed8" : "#1e293b"}
                                fontFamily="'Montserrat', sans-serif"
                              >
                                {student.name}
                              </Typography>
                            }
                            secondary={
                              <Typography
                                fontSize={11}
                                color="#94a3b8"
                                fontFamily="'Montserrat', sans-serif"
                              >
                                {student.studentId}
                              </Typography>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              edge="end"
                              checked={isEnrolled}
                              onChange={() =>
                                handleToggleRosterStudent(student._id)
                              }
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      </Paper>
                    );

                    return (
                      <Box
                        display="grid"
                        gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
                        gap={3}
                      >
                        <Box>
                          <Typography
                            fontSize={12}
                            fontWeight={800}
                            color="#1d4ed8"
                            fontFamily="'Montserrat', sans-serif"
                            mb={1}
                          >
                            ASSIGNED TO THIS COURSE ({assignedStudents.length})
                          </Typography>
                          {assignedStudents.length === 0 ? (
                            <Typography
                              fontSize={12}
                              color="#94a3b8"
                              fontFamily="'Montserrat', sans-serif"
                            >
                              No students assigned yet — flip a switch on the
                              right.
                            </Typography>
                          ) : (
                            <List sx={{ p: 0 }}>
                              {assignedStudents.map((s) => renderRow(s, true))}
                            </List>
                          )}
                        </Box>

                        <Box>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={1}
                          >
                            <Typography
                              fontSize={12}
                              fontWeight={800}
                              color="#64748b"
                              fontFamily="'Montserrat', sans-serif"
                            >
                              AVAILABLE STUDENTS ({availableStudents.length})
                            </Typography>
                            <Button
                              size="small"
                              onClick={handleSelectAllRosterStudents}
                              sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                fontFamily: "'Montserrat', sans-serif",
                                fontSize: 12,
                              }}
                            >
                              Assign / Unassign All
                            </Button>
                          </Box>
                          <List sx={{ p: 0 }}>
                            {availableStudents.map((s) => renderRow(s, false))}
                          </List>
                        </Box>
                      </Box>
                    );
                  })()
                )}

                <Paper
                  elevation={0}
                  sx={{
                    mt: 3,
                    p: 2.5,
                    border: "0.5px solid #e2e8f0",
                    borderRadius: 2,
                    bgcolor: "#fff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    position: "sticky",
                    bottom: 16,
                  }}
                >
                  <Typography
                    variant="body2"
                    color="#64748b"
                    fontFamily="'Montserrat', sans-serif"
                  >
                    <strong>{rosterSelectedIds.length}</strong>/{rosterCourse?.capacity ?? "—"} seats selected
                    {rosterSelectedIds.length > (rosterCourse?.capacity ?? Infinity) && (
                      <span style={{ color: "#dc2626", marginLeft: 8 }}>Capacity exceeded</span>
                    )}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleSaveRoster}
                    disabled={isSavingRoster || isFetchingRoster || rosterSelectedIds.length > (rosterCourse?.capacity ?? Infinity)}
                    startIcon={
                      isSavingRoster ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <Save size={15} />
                      )
                    }
                    sx={{
                      bgcolor: "#2563eb",
                      fontWeight: 700,
                      borderRadius: 2,
                      boxShadow: "none",
                      px: 3,
                      textTransform: "none",
                      fontFamily: "'Montserrat', sans-serif",
                    }}
                  >
                    {isSavingRoster ? "Saving..." : "Save Roster"}
                  </Button>
                </Paper>
              </Box>
            )}
          </>
        )}

        {/* ── Dialog: Pick a Session to start (only ones with no courses yet) ── */}
        <Dialog
          open={addSessionOpen}
          onClose={() => setAddSessionOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, fontFamily: "'Aleo', serif" }}>
            Start a New Session
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ py: 2 }}>
            <List sx={{ p: 0 }}>
              {sessionsWithoutCourses.map((t) => (
                <Paper
                  key={t._id}
                  elevation={0}
                  onClick={() => handleAddNewSession(t._id)}
                  sx={{
                    mb: 1,
                    p: 1.5,
                    border: "0.5px solid #e2e8f0",
                    borderRadius: 2,
                    cursor: "pointer",
                    "&:hover": { borderColor: "#93c5fd", bgcolor: "#eff6ff" },
                  }}
                >
                  <Typography
                    fontSize={13}
                    fontWeight={700}
                    color="#1e293b"
                    fontFamily="'Montserrat', sans-serif"
                  >
                    {t.name}
                  </Typography>
                </Paper>
              ))}
            </List>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2, bgcolor: "#f8fafc" }}>
            <Button
              onClick={() => setAddSessionOpen(false)}
              sx={{
                fontWeight: 700,
                color: "#64748b",
                textTransform: "none",
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {/* Assign Course now opens as its own routed page (see
            handleOpenAllocateModal's old onClick, replaced above) — a large
            department's course list is much easier to search/scroll there
            than in a Dialog. */}
      </Box>
    </Fade>
  );
};

export default HodCourseAllocationView;
