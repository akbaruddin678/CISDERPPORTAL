import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Button,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  Fade,
} from "@mui/material";
import {
  PictureAsPdf,
  GridOn,
  Print,
  School,
  Business,
  Layers,
  AccessTime,
  CheckCircleOutline,
  EventNote,
  CalendarMonthOutlined,
  KeyboardArrowDown,
} from "@mui/icons-material";

// A small dropdown next to an export button — lets each format offer "All
// Types" plus separate one-click downloads for just Mid Term or just Final
// Exam, instead of only ever exporting everything together.
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
        startIcon={<Icon sx={{ fontSize: 16 }} />}
        endIcon={<KeyboardArrowDown sx={{ fontSize: 16 }} />}
        onClick={() => setOpen((p) => !p)}
        sx={{
          bgcolor: "#fff",
          color,
          borderColor: color,
          fontWeight: 700,
          textTransform: "none",
          fontFamily: "'Montserrat', sans-serif",
          fontSize: 13,
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
            minWidth: 190,
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
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                color: "#334155",
                fontFamily: "'Montserrat', sans-serif",
                "&:hover": { bgcolor: "#f1f5f9" },
              }}
            >
              {item.label}
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
};

// Same accent convention used across the teacher/HOD/Academia/VC exam-marks
// views this session — one color per exam type, kept consistent app-wide.
const TYPE_STYLES = {
  Sessional: { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
  "Mid Term": { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  "Final Exam": { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
  Quiz: { bg: "#f0fdfa", color: "#0f766e", border: "#99f6e4" },
  Assignment: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  Practical: { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
};
const fallbackTypeStyle = { bg: "#f1f5f9", color: "#334155", border: "#e2e8f0" };

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
      <Icon sx={{ fontSize: 18, color }} />
    </Box>
    <Box>
      <Typography fontSize={20} fontWeight={800} color="#0f172a" lineHeight={1} fontFamily="'Aleo', serif">
        {value}
      </Typography>
      <Typography fontSize={11} color="#94a3b8" fontWeight={600} mt={0.25} fontFamily="'Montserrat', sans-serif">
        {label}
      </Typography>
    </Box>
  </Paper>
);

const TypeSection = ({ type, exams }) => {
  const style = TYPE_STYLES[type] || fallbackTypeStyle;
  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1,
          bgcolor: style.bg,
          border: `0.5px solid ${style.border}`,
          borderBottom: "none",
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
      >
        <Chip
          size="small"
          label={type}
          sx={{ bgcolor: style.color, color: "white", fontWeight: 800, fontSize: 11, fontFamily: "'Montserrat', sans-serif" }}
        />
        <Typography variant="caption" fontWeight={700} color={style.color} fontFamily="'Montserrat', sans-serif">
          {exams.length} exam{exams.length === 1 ? "" : "s"}
        </Typography>
      </Box>
      <TableContainer sx={{ border: `0.5px solid ${style.border}`, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              <TableCell sx={{ width: 50, textAlign: "center", fontSize: 11, fontWeight: 800, color: "#94a3b8", fontFamily: "'Montserrat', sans-serif" }}>
                #
              </TableCell>
              <TableCell sx={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", fontFamily: "'Montserrat', sans-serif" }}>
                Course &amp; Code
              </TableCell>
              <TableCell sx={{ width: 130, fontSize: 11, fontWeight: 800, color: "#94a3b8", fontFamily: "'Montserrat', sans-serif" }}>
                Date
              </TableCell>
              <TableCell sx={{ width: 180, fontSize: 11, fontWeight: 800, color: "#94a3b8", fontFamily: "'Montserrat', sans-serif" }}>
                Time
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {exams.map((exam, i) => {
              const d = new Date(exam.date);
              return (
                <TableRow key={exam._id} hover>
                  <TableCell align="center" sx={{ color: "#94a3b8", fontSize: 12 }}>
                    {i + 1}
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={800} fontSize={13} color="#1e293b" fontFamily="'Montserrat', sans-serif">
                      {exam.courseId?.title || exam.title}
                    </Typography>
                    <Typography fontSize={11} color="#94a3b8" fontFamily="'Montserrat', sans-serif">
                      Code: {exam.courseId?.code || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={13} fontWeight={600} fontFamily="'Montserrat', sans-serif">
                      {d.toLocaleDateString("en-GB")}
                    </Typography>
                    <Typography fontSize={11} color="#94a3b8" fontFamily="'Montserrat', sans-serif">
                      {d.toLocaleDateString("en-US", { weekday: "short" })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={0.75}>
                      <AccessTime sx={{ fontSize: 14 }} color="disabled" />
                      <Typography fontSize={12} fontWeight={700} color="#0f172a" fontFamily="'Montserrat', sans-serif">
                        {exam.startTime}{" "}
                        <span style={{ fontWeight: 400, color: "#64748b" }}>to</span>{" "}
                        {exam.endTime}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const DateSheetView = ({
  filters,
  terms,
  departments,
  availablePrograms,
  availableSemesters,
  handleFilterChange,
  groupedExams,
  orderedTypes,
  rawExams,
  isFetching,
  downloadPDF,
  downloadExcel,
  handlePrintAll,
  handlePrintDepartment,
}) => {
  const hasExams = rawExams.length > 0;
  const activeTermName = terms.find((t) => t._id === filters.termId)?.name || "Current Session";

  const deptNames = Object.keys(groupedExams);
  const stats = useMemo(() => {
    let programCount = 0;
    deptNames.forEach((dept) => {
      programCount += Object.keys(groupedExams[dept]).length;
    });
    return {
      departments: deptNames.length,
      programs: programCount,
      exams: rawExams.length,
    };
  }, [groupedExams, deptNames, rawExams]);

  return (
    <Fade in timeout={400}>
      <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f8fafc", fontFamily: "'Montserrat', sans-serif" }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={800} color="#0f172a" fontFamily="'Aleo', serif">
              Master Date Sheet
            </Typography>
            <Typography variant="body2" color="#64748b" mt={0.25} fontFamily="'Montserrat', sans-serif">
              Official, published exam schedules — organized by class, program, section and exam type.
            </Typography>
          </Box>
          <Box display="flex" gap={1.5} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<Print sx={{ fontSize: 16 }} />}
              onClick={handlePrintAll}
              disabled={!hasExams || isFetching}
              sx={{ bgcolor: "#fff", fontWeight: 700, textTransform: "none", fontFamily: "'Montserrat', sans-serif", fontSize: 13 }}
            >
              Print All
            </Button>
            {(!hasExams || isFetching) ? (
              <>
                <Button
                  variant="outlined" color="success" disabled
                  startIcon={<GridOn sx={{ fontSize: 16 }} />}
                  sx={{ bgcolor: "#fff", fontWeight: 700, textTransform: "none", fontFamily: "'Montserrat', sans-serif", fontSize: 13 }}
                >
                  Export Excel
                </Button>
                <Button
                  variant="contained" color="error" disabled
                  startIcon={<PictureAsPdf sx={{ fontSize: 16 }} />}
                  sx={{ boxShadow: "none", fontWeight: 700, textTransform: "none", fontFamily: "'Montserrat', sans-serif", fontSize: 13 }}
                >
                  Download PDF
                </Button>
              </>
            ) : (
              <>
                <ExportMenu
                  label="Export Excel"
                  icon={GridOn}
                  color="#059669"
                  items={[
                    { label: "All Types", action: () => downloadExcel() },
                    { label: "Mid Term Only", action: () => downloadExcel("Mid Term") },
                    { label: "Final Exam Only", action: () => downloadExcel("Final Exam") },
                  ]}
                />
                <ExportMenu
                  label="Download PDF"
                  icon={PictureAsPdf}
                  color="#dc2626"
                  items={[
                    { label: "All Types", action: () => downloadPDF() },
                    { label: "Mid Term Only", action: () => downloadPDF("Mid Term") },
                    { label: "Final Exam Only", action: () => downloadPDF("Final Exam") },
                  ]}
                />
              </>
            )}
          </Box>
        </Box>

        {/* Stat cards */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <StatCard icon={Business} label="Classes" value={stats.departments} color="#1d4ed8" bg="#eff6ff" />
          <StatCard icon={School} label="Programs" value={stats.programs} color="#7c3aed" bg="#f5f3ff" />
          <StatCard icon={EventNote} label="Published Exams" value={stats.exams} color="#0891b2" bg="#ecfeff" />
          <StatCard icon={CalendarMonthOutlined} label="Session" value={activeTermName} color="#15803d" bg="#f0fdf4" />
        </Box>

        {/* Filters */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: "0.5px solid #e2e8f0", borderRadius: 2, bgcolor: "#fff" }}>
          <Typography fontSize={12} fontWeight={800} color="#94a3b8" textTransform="uppercase" letterSpacing="0.05em" mb={2} fontFamily="'Montserrat', sans-serif">
            Filter Date Sheet
          </Typography>
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" }} gap={2}>
            <TextField
              select fullWidth size="small" label="Session / Term"
              value={filters.termId}
              onChange={(e) => handleFilterChange("termId", e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
            >
              <MenuItem value="all" sx={{ fontStyle: "italic", fontSize: 13 }}>All Sessions</MenuItem>
              {terms.map((t) => (<MenuItem key={t._id} value={t._id} sx={{ fontSize: 13 }}>{t.name}</MenuItem>))}
            </TextField>
            <TextField
              select fullWidth size="small" label="Class"
              value={filters.departmentId}
              onChange={(e) => handleFilterChange("departmentId", e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
            >
              <MenuItem value="all" sx={{ fontStyle: "italic", fontSize: 13 }}>All Classes</MenuItem>
              {departments.map((d) => (<MenuItem key={d._id} value={d._id} sx={{ fontSize: 13 }}>{d.name}</MenuItem>))}
            </TextField>
            <TextField
              select fullWidth size="small" label="Program"
              disabled={filters.departmentId === "all"}
              value={filters.programId}
              onChange={(e) => handleFilterChange("programId", e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
            >
              <MenuItem value="all" sx={{ fontStyle: "italic", fontSize: 13 }}>All Programs</MenuItem>
              {availablePrograms.map((p) => (<MenuItem key={p._id} value={p._id} sx={{ fontSize: 13 }}>{p.name}</MenuItem>))}
            </TextField>
            <TextField
              select fullWidth size="small" label="Section"
              disabled={filters.programId === "all"}
              value={filters.semesterId}
              onChange={(e) => handleFilterChange("semesterId", e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
            >
              <MenuItem value="all" sx={{ fontStyle: "italic", fontSize: 13 }}>All Sections</MenuItem>
              {availableSemesters.map((s) => (<MenuItem key={s._id} value={s._id} sx={{ fontSize: 13 }}>{s.name || `Section ${s.number}`}</MenuItem>))}
            </TextField>
          </Box>
        </Paper>

        {/* MAIN CONTENT */}
        {isFetching ? (
          <Box py={12} textAlign="center">
            <CircularProgress sx={{ color: "#2563eb" }} />
          </Box>
        ) : !hasExams ? (
          <Paper elevation={0} sx={{ py: 10, textAlign: "center", border: "1.5px dashed #cbd5e1", borderRadius: 3, bgcolor: "#fff" }}>
            <CheckCircleOutline sx={{ fontSize: 52, color: "#cbd5e1", mb: 1.5 }} />
            <Typography fontSize={15} color="#64748b" fontWeight={700} fontFamily="'Aleo', serif">
              No Exams Published
            </Typography>
            <Typography fontSize={13} color="#94a3b8" fontFamily="'Montserrat', sans-serif" mt={0.5}>
              There are no officially published exams for the selected criteria yet.
            </Typography>
          </Paper>
        ) : (
          <Box>
            {deptNames.map((deptName) => {
              const deptExamCount = Object.values(groupedExams[deptName]).reduce(
                (progSum, progObj) =>
                  progSum +
                  Object.values(progObj).reduce(
                    (semSum, semObj) =>
                      semSum + Object.values(semObj).reduce((typeSum, arr) => typeSum + arr.length, 0),
                    0,
                  ),
                0,
              );

              return (
                <Paper
                  key={deptName}
                  elevation={0}
                  sx={{ mb: 3, p: 2.5, border: "0.5px solid #e2e8f0", borderRadius: 2.5, bgcolor: "#fff" }}
                >
                  {/* Department Header */}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2.5}
                    pb={1.5}
                    sx={{ borderBottom: "1.5px solid #e2e8f0" }}
                  >
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box sx={{ bgcolor: "#0f172a", borderRadius: 2, p: 1, display: "flex" }}>
                        <Business sx={{ fontSize: 18, color: "#fff" }} />
                      </Box>
                      <Box>
                        <Typography fontWeight={800} fontSize={17} color="#0f172a" fontFamily="'Aleo', serif">
                          {deptName}
                        </Typography>
                        <Typography fontSize={11} color="#94a3b8" fontFamily="'Montserrat', sans-serif" fontWeight={600}>
                          {deptExamCount} exam{deptExamCount === 1 ? "" : "s"} scheduled
                        </Typography>
                      </Box>
                    </Box>
                    <Tooltip title={`Print ${deptName}'s date sheet`} arrow>
                      <IconButton
                        onClick={() => handlePrintDepartment(deptName)}
                        sx={{ color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 1.5 }}
                      >
                        <Print sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {Object.keys(groupedExams[deptName]).map((progName) => (
                    <Box key={progName} mb={3} pl={{ xs: 0, md: 2 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                        <School sx={{ fontSize: 16, color: "#7c3aed" }} />
                        <Typography fontWeight={700} fontSize={14} color="#6d28d9" fontFamily="'Montserrat', sans-serif">
                          {progName}
                        </Typography>
                      </Box>

                      {Object.keys(groupedExams[deptName][progName]).map((semName) => {
                        const typesForSemester = groupedExams[deptName][progName][semName];
                        return (
                          <Paper
                            key={semName}
                            elevation={0}
                            sx={{ mb: 2, border: "0.5px solid #e2e8f0", borderRadius: 2, p: 2, bgcolor: "#f8fafc" }}
                          >
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Layers sx={{ fontSize: 15, color: "#64748b" }} />
                                <Typography fontWeight={700} fontSize={13} color="#334155" fontFamily="'Montserrat', sans-serif">
                                  {semName}
                                </Typography>
                              </Box>
                              <Typography fontSize={11} fontWeight={700} color="#94a3b8" fontFamily="'Montserrat', sans-serif">
                                {activeTermName}
                              </Typography>
                            </Box>

                            {orderedTypes(typesForSemester).map((type) => (
                              <TypeSection key={type} type={type} exams={typesForSemester[type]} />
                            ))}
                          </Paper>
                        );
                      })}
                    </Box>
                  ))}
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>
    </Fade>
  );
};

export default DateSheetView;
