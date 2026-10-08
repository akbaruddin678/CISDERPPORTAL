import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  CloudUpload,
  Search,
  AssignmentTurnedIn,
  Edit,
  Save as SaveIcon,
  Close,
  PersonOff,
  Groups,
  CheckCircleOutline,
  HourglassEmpty,
} from "@mui/icons-material";

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "TBD";

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

const MarkUploadView = ({
  filters,
  handleFilterChange,
  terms,
  departments,
  availablePrograms,
  availableSemesters,
  courses,

  exams,
  isFetchingExams,
  examId,
  setExamId,
  selectedExam,

  marksGrid,
  handleMarkUpdate,
  toggleAbsent,
  isFetchingStudents,
  handleSaveMarks,
  isSaving,
  isReadyToFetch,
  isReadyToFetchCourse,
  toggleEditMode,
  handleSingleSave,
}) => {
  const maxMarks = selectedExam?.totalMarks ?? 0;

  const stats = useMemo(() => {
    const total = marksGrid.length;
    const absent = marksGrid.filter((r) => r.isAbsent).length;
    const marked = marksGrid.filter((r) => !r.isAbsent && r.obtainedMarks !== null && r.obtainedMarks !== "").length;
    const pending = total - absent - marked;
    return { total, absent, marked, pending };
  }, [marksGrid]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f8fafc", fontFamily: "'Montserrat', sans-serif" }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight={800} color="#0f172a" fontFamily="'Aleo', serif">
          Marks Upload
        </Typography>
        <Typography variant="body2" color="#64748b" mt={0.25} fontFamily="'Montserrat', sans-serif">
          Admin/Exam-Cell entry — marks entered here are saved as already verified, one course and one exam at a time.
        </Typography>
      </Box>

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: "0.5px solid #e2e8f0", borderRadius: 2, bgcolor: "#fff" }}>
        <Typography fontSize={12} fontWeight={800} color="#94a3b8" textTransform="uppercase" letterSpacing="0.05em" mb={2} fontFamily="'Montserrat', sans-serif">
          1. Select Batch &amp; Course
        </Typography>
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", md: "repeat(5, 1fr)" }} gap={2}>
          <TextField
            select fullWidth size="small" label="Session"
            value={filters.termId}
            onChange={(e) => handleFilterChange("termId", e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
          >
            {terms.map((t) => (<MenuItem key={t._id} value={t._id} sx={{ fontSize: 13 }}>{t.name}</MenuItem>))}
          </TextField>
          <TextField
            select fullWidth size="small" label="Class"
            value={filters.departmentId}
            onChange={(e) => handleFilterChange("departmentId", e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
          >
            {departments.map((d) => (<MenuItem key={d._id} value={d._id} sx={{ fontSize: 13 }}>{d.name}</MenuItem>))}
          </TextField>
          <TextField
            select fullWidth size="small" label="Program"
            disabled={!filters.departmentId}
            value={filters.programId}
            onChange={(e) => handleFilterChange("programId", e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
          >
            {availablePrograms.map((p) => (<MenuItem key={p._id} value={p._id} sx={{ fontSize: 13 }}>{p.name}</MenuItem>))}
          </TextField>
          <TextField
            select fullWidth size="small" label="Section"
            disabled={!filters.programId}
            value={filters.semesterId}
            onChange={(e) => handleFilterChange("semesterId", e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
          >
            {availableSemesters.map((s) => (<MenuItem key={s._id} value={s._id} sx={{ fontSize: 13 }}>{s.name || `Section ${s.number}`}</MenuItem>))}
          </TextField>
          <TextField
            select fullWidth size="small" label="Course / Subject"
            disabled={!filters.semesterId}
            value={filters.courseId}
            onChange={(e) => handleFilterChange("courseId", e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
          >
            {courses.map((c) => (<MenuItem key={c._id} value={c._id} sx={{ fontSize: 13 }}>{c.title} ({c.code})</MenuItem>))}
          </TextField>
        </Box>
      </Paper>

      {/* Select Exam */}
      {isReadyToFetchCourse && (
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: "0.5px solid #e2e8f0", borderRadius: 2, bgcolor: "#fff" }}>
          <Typography fontSize={12} fontWeight={800} color="#94a3b8" textTransform="uppercase" letterSpacing="0.05em" mb={2} fontFamily="'Montserrat', sans-serif">
            2. Select Exam
          </Typography>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              select size="small" label="Exam" sx={{ minWidth: 280, "& .MuiOutlinedInput-root": { fontSize: 13 } }}
              value={examId}
              disabled={isFetchingExams || exams.length === 0}
              onChange={(e) => setExamId(e.target.value)}
            >
              {exams.length === 0 && (
                <MenuItem value="" disabled sx={{ fontSize: 13 }}>
                  <em>No conducted exams yet — exams appear here once their scheduled date/time has passed</em>
                </MenuItem>
              )}
              {exams.map((ex) => (
                <MenuItem key={ex._id} value={ex._id} sx={{ fontSize: 13 }}>
                  {ex.type} — {formatDate(ex.date)} ({ex.totalMarks} marks)
                </MenuItem>
              ))}
            </TextField>
            {selectedExam && (
              <Chip
                label={`${selectedExam.type} · ${selectedExam.totalMarks} marks · ${selectedExam.weightage}% weightage`}
                sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 700, fontSize: 12 }}
              />
            )}
          </Box>
        </Paper>
      )}

      {/* Stat row, once a roster is loaded */}
      {isReadyToFetch && marksGrid.length > 0 && (
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <StatCard icon={Groups} label="Total Students" value={stats.total} color="#1d4ed8" bg="#eff6ff" />
          <StatCard icon={CheckCircleOutline} label="Marks Entered" value={stats.marked} color="#15803d" bg="#f0fdf4" />
          <StatCard icon={HourglassEmpty} label="Not Yet Entered" value={stats.pending} color="#b45309" bg="#fffbeb" />
          <StatCard icon={PersonOff} label="Absent" value={stats.absent} color="#b91c1c" bg="#fef2f2" />
        </Box>
      )}

      {/* Marks grid */}
      <Paper elevation={0} sx={{ borderRadius: 2.5, border: "0.5px solid #e2e8f0", overflow: "hidden", bgcolor: "#fff" }}>
        {!isReadyToFetch ? (
          <Box p={10} textAlign="center">
            <Search sx={{ fontSize: 48, opacity: 0.15, mb: 1.5 }} />
            <Typography fontSize={15} fontWeight={700} color="#64748b" fontFamily="'Aleo', serif">
              Awaiting Selection
            </Typography>
            <Typography fontSize={13} color="#94a3b8" mt={0.5}>
              Select a course and an exam above to load its roster.
            </Typography>
          </Box>
        ) : isFetchingStudents ? (
          <Box p={10} textAlign="center">
            <CircularProgress sx={{ color: "#2563eb" }} />
            <Typography fontSize={13} color="#94a3b8" mt={1.5}>Loading roster...</Typography>
          </Box>
        ) : marksGrid.length === 0 ? (
          <Box p={10} textAlign="center">
            <AssignmentTurnedIn sx={{ fontSize: 48, opacity: 0.2, mb: 1.5 }} />
            <Typography fontSize={15} fontWeight={700} color="#64748b" fontFamily="'Aleo', serif">No Students Found</Typography>
            <Typography fontSize={13} color="#94a3b8" mt={0.5}>
              No students are registered for this specific course in this batch.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Student</TableCell>
                  <TableCell sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Marks (of {maxMarks})</TableCell>
                  <TableCell sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Absent</TableCell>
                  <TableCell align="center" sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {marksGrid.map((row, index) => {
                  const canEdit = row.isEditing && !row.isAbsent;

                  return (
                    <TableRow key={row.studentId} hover sx={{ opacity: row.isAbsent ? 0.6 : 1 }}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar
                            sx={{
                              width: 30, height: 30, fontSize: 13, fontWeight: 700,
                              bgcolor: row.isAbsent ? "#fef2f2" : "#eff6ff",
                              color: row.isAbsent ? "#b91c1c" : "#1d4ed8",
                            }}
                          >
                            {row.name?.charAt(0) || "S"}
                          </Avatar>
                          <Box>
                            <Typography fontSize={13} fontWeight={700} color="#1e293b">{row.name || "Unknown Student"}</Typography>
                            <Typography fontSize={11} color="#94a3b8">{row.rollNo || "N/A"}</Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        {canEdit ? (
                          <TextField
                            type="number" size="small" sx={{ width: 100, "& .MuiOutlinedInput-root": { fontSize: 13 } }}
                            inputProps={{ min: 0, max: maxMarks }}
                            value={row.obtainedMarks ?? ""}
                            placeholder={`/${maxMarks}`}
                            onChange={(e) => handleMarkUpdate(index, e.target.value, maxMarks)}
                            error={Number(row.obtainedMarks) > maxMarks}
                          />
                        ) : (
                          <Typography fontSize={13} fontWeight={row.isAbsent ? 700 : 500} color={row.isAbsent ? "#b91c1c" : "#1e293b"}>
                            {row.isAbsent ? "ABS" : (row.obtainedMarks ?? "—")}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Tooltip title={row.isAbsent ? "Marked absent" : "Mark absent"}>
                          <IconButton size="small" onClick={() => toggleAbsent(index)} sx={{ color: row.isAbsent ? "#dc2626" : "#94a3b8" }}>
                            <PersonOff fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>

                      <TableCell align="center">
                        {canEdit ? (
                          <Box display="flex" gap={0.5} justifyContent="center">
                            <Tooltip title="Save this student">
                              <IconButton size="small" onClick={() => handleSingleSave(row, index)} sx={{ color: "#15803d" }}>
                                <SaveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel">
                              <IconButton size="small" onClick={() => toggleEditMode(index)} sx={{ color: "#dc2626" }}>
                                <Close fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : !row.isAbsent ? (
                          <Tooltip title="Edit marks">
                            <IconButton size="small" onClick={() => toggleEditMode(index)} sx={{ color: "#2563eb" }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <Box p={2.5} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5} sx={{ bgcolor: "#f8fafc", borderTop: "0.5px solid #e2e8f0" }}>
              <Typography fontSize={12} color="#64748b" fontFamily="'Montserrat', sans-serif">
                Submitting saves every currently-entered mark for this exam — verified immediately, no further review step.
              </Typography>
              <Button
                variant="contained"
                startIcon={<CloudUpload sx={{ fontSize: 18 }} />}
                onClick={handleSaveMarks}
                disabled={isSaving}
                sx={{ bgcolor: "#2563eb", fontWeight: 700, textTransform: "none", boxShadow: "none", fontFamily: "'Montserrat', sans-serif", fontSize: 13, px: 3 }}
              >
                {isSaving ? "Saving..." : "Submit All Marks"}
              </Button>
            </Box>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default MarkUploadView;
