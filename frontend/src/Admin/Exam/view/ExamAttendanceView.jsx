import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Button,
  ButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  CloudUpload,
  Search,
  AssignmentTurnedIn,
  Send,
  Groups,
  CheckCircleOutline,
  Cancel,
  HourglassEmpty,
} from "@mui/icons-material";

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "TBD";

const STATUS_META = {
  Present: { bg: "#f0fdf4", color: "#15803d" },
  Late: { bg: "#fffbeb", color: "#b45309" },
  Absent: { bg: "#fef2f2", color: "#b91c1c" },
  Pending: { bg: "#f1f5f9", color: "#64748b" },
};

const SUBMISSION_META = {
  DRAFT: { label: "Draft", bg: "#f1f5f9", color: "#64748b" },
  PENDING_HOD: { label: "Pending HOD Review", bg: "#e0e7ff", color: "#3730a3" },
  APPROVED: { label: "Approved", bg: "#d1fae5", color: "#065f46" },
  RETURNED: { label: "Returned — needs correction", bg: "#ffe4e6", color: "#9f1239" },
};

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <Paper
    elevation={0}
    sx={{ flex: 1, minWidth: 130, border: "0.5px solid #e2e8f0", borderRadius: 2.5, p: 2, display: "flex", alignItems: "center", gap: 1.5, bgcolor: "#fff" }}
  >
    <Box sx={{ bgcolor: bg, borderRadius: 2, p: 1, display: "flex" }}>
      <Icon sx={{ fontSize: 18, color }} />
    </Box>
    <Box>
      <Typography fontSize={20} fontWeight={800} color="#0f172a" lineHeight={1} fontFamily="'Aleo', serif">{value}</Typography>
      <Typography fontSize={11} color="#94a3b8" fontWeight={600} mt={0.25} fontFamily="'Montserrat', sans-serif">{label}</Typography>
    </Box>
  </Paper>
);

const ExamAttendanceView = ({
  filters,
  handleFilterChange,
  terms,
  departments,
  availablePrograms,
  availableSemesters,

  assignments,
  isFetchingAssignments,
  assignmentId,
  handleAssignmentChange,
  isReadyToFetchAssignments,

  exams,
  isFetchingExams,
  examId,
  setExamId,
  isReadyToFetchExams,

  submission,
  isEditable,
  rosterStudents,
  isFetchingStudents,
  handleStatusChange,
  handleSaveDraft,
  isSaving,
  handleSubmitForReview,
  isSubmitting,
  isReadyToFetch,
}) => {
  const stats = useMemo(() => {
    const total = rosterStudents.length;
    const present = rosterStudents.filter((r) => r.status === "Present").length;
    const late = rosterStudents.filter((r) => r.status === "Late").length;
    const absent = rosterStudents.filter((r) => r.status === "Absent").length;
    return { total, present, late, absent };
  }, [rosterStudents]);

  const submissionMeta = submission ? SUBMISSION_META[submission.status] : null;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f8fafc", fontFamily: "'Montserrat', sans-serif" }}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={800} color="#0f172a" fontFamily="'Aleo', serif">
          Exam Attendance
        </Typography>
        <Typography variant="body2" color="#64748b" mt={0.25}>
          Record attendance for one exam sitting, then submit to your HOD for class sign-off.
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: "0.5px solid #e2e8f0", borderRadius: 2, bgcolor: "#fff" }}>
        <Typography fontSize={12} fontWeight={800} color="#94a3b8" textTransform="uppercase" letterSpacing="0.05em" mb={2}>
          1. Select Batch &amp; Section
        </Typography>
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", md: "repeat(5, 1fr)" }} gap={2}>
          <TextField select fullWidth size="small" label="Session" value={filters.termId} onChange={(e) => handleFilterChange("termId", e.target.value)} sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}>
            {terms.map((t) => (<MenuItem key={t._id} value={t._id} sx={{ fontSize: 13 }}>{t.name}</MenuItem>))}
          </TextField>
          <TextField select fullWidth size="small" label="Class" value={filters.departmentId} onChange={(e) => handleFilterChange("departmentId", e.target.value)} sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}>
            {departments.map((d) => (<MenuItem key={d._id} value={d._id} sx={{ fontSize: 13 }}>{d.name}</MenuItem>))}
          </TextField>
          <TextField select fullWidth size="small" label="Program" disabled={!filters.departmentId} value={filters.programId} onChange={(e) => handleFilterChange("programId", e.target.value)} sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}>
            {availablePrograms.map((p) => (<MenuItem key={p._id} value={p._id} sx={{ fontSize: 13 }}>{p.name}</MenuItem>))}
          </TextField>
          <TextField select fullWidth size="small" label="Section" disabled={!filters.programId} value={filters.semesterId} onChange={(e) => handleFilterChange("semesterId", e.target.value)} sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}>
            {availableSemesters.map((s) => (<MenuItem key={s._id} value={s._id} sx={{ fontSize: 13 }}>{s.name || `Section ${s.number}`}</MenuItem>))}
          </TextField>
          <TextField
            select fullWidth size="small" label="Course Section"
            disabled={!isReadyToFetchAssignments || isFetchingAssignments}
            value={assignmentId}
            onChange={(e) => handleAssignmentChange(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
          >
            {assignments.length === 0 && (
              <MenuItem value="" disabled sx={{ fontSize: 13 }}><em>No sections offered</em></MenuItem>
            )}
            {assignments.map((a) => (
              <MenuItem key={a._id} value={a._id} sx={{ fontSize: 13 }}>
                {a.courseId?.title} ({a.courseId?.code}) · Sec {a.section}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      {isReadyToFetchExams && (
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: "0.5px solid #e2e8f0", borderRadius: 2, bgcolor: "#fff" }}>
          <Typography fontSize={12} fontWeight={800} color="#94a3b8" textTransform="uppercase" letterSpacing="0.05em" mb={2}>
            2. Select Exam
          </Typography>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              select size="small" label="Exam" sx={{ minWidth: 280, "& .MuiOutlinedInput-root": { fontSize: 13 } }}
              value={examId} disabled={isFetchingExams || exams.length === 0}
              onChange={(e) => setExamId(e.target.value)}
            >
              {exams.length === 0 && (
                <MenuItem value="" disabled sx={{ fontSize: 13 }}><em>No exams scheduled for this course</em></MenuItem>
              )}
              {exams.map((ex) => (
                <MenuItem key={ex._id} value={ex._id} sx={{ fontSize: 13 }}>
                  {ex.type} — {formatDate(ex.date)}
                </MenuItem>
              ))}
            </TextField>
            {submissionMeta && (
              <Chip label={submissionMeta.label} sx={{ bgcolor: submissionMeta.bg, color: submissionMeta.color, fontWeight: 700, fontSize: 12 }} />
            )}
          </Box>
        </Paper>
      )}

      {submission?.status === "RETURNED" && submission.hodRemarks && (
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: "1px solid #fecdd3", borderRadius: 2, bgcolor: "#fff1f2" }}>
          <Typography fontSize={12} fontWeight={800} color="#9f1239">HOD's remarks</Typography>
          <Typography fontSize={13} color="#be123c">{submission.hodRemarks}</Typography>
        </Paper>
      )}

      {isReadyToFetch && rosterStudents.length > 0 && (
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <StatCard icon={Groups} label="Total Students" value={stats.total} color="#1d4ed8" bg="#eff6ff" />
          <StatCard icon={CheckCircleOutline} label="Present" value={stats.present} color="#15803d" bg="#f0fdf4" />
          <StatCard icon={HourglassEmpty} label="Late" value={stats.late} color="#b45309" bg="#fffbeb" />
          <StatCard icon={Cancel} label="Absent" value={stats.absent} color="#b91c1c" bg="#fef2f2" />
        </Box>
      )}

      <Paper elevation={0} sx={{ borderRadius: 2.5, border: "0.5px solid #e2e8f0", overflow: "hidden", bgcolor: "#fff" }}>
        {!isReadyToFetch ? (
          <Box p={10} textAlign="center">
            <Search sx={{ fontSize: 48, opacity: 0.15, mb: 1.5 }} />
            <Typography fontSize={15} fontWeight={700} color="#64748b" fontFamily="'Aleo', serif">Awaiting Selection</Typography>
            <Typography fontSize={13} color="#94a3b8" mt={0.5}>Select a section and an exam above to load its roster.</Typography>
          </Box>
        ) : isFetchingStudents ? (
          <Box p={10} textAlign="center">
            <CircularProgress sx={{ color: "#2563eb" }} />
          </Box>
        ) : rosterStudents.length === 0 ? (
          <Box p={10} textAlign="center">
            <AssignmentTurnedIn sx={{ fontSize: 48, opacity: 0.2, mb: 1.5 }} />
            <Typography fontSize={15} fontWeight={700} color="#64748b" fontFamily="'Aleo', serif">No Students Found</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Student</TableCell>
                  <TableCell sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rosterStudents.map((row) => {
                  const meta = STATUS_META[row.status] || STATUS_META.Pending;
                  return (
                    <TableRow key={row.studentId} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ width: 30, height: 30, fontSize: 13, fontWeight: 700, bgcolor: meta.bg, color: meta.color }}>
                            {row.name?.charAt(0) || "S"}
                          </Avatar>
                          <Box>
                            <Typography fontSize={13} fontWeight={700} color="#1e293b">{row.name || "Unknown Student"}</Typography>
                            <Typography fontSize={11} color="#94a3b8">{row.rollNo || "N/A"}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <ButtonGroup size="small" disabled={!isEditable}>
                          {["Present", "Late", "Absent"].map((opt) => (
                            <Button
                              key={opt}
                              variant={row.status === opt ? "contained" : "outlined"}
                              onClick={() => handleStatusChange(row.studentId, opt)}
                              sx={{
                                textTransform: "none", fontSize: 12, fontWeight: 700,
                                bgcolor: row.status === opt ? STATUS_META[opt].color : "transparent",
                                borderColor: STATUS_META[opt].color,
                                color: row.status === opt ? "#fff" : STATUS_META[opt].color,
                                "&:hover": { bgcolor: row.status === opt ? STATUS_META[opt].color : STATUS_META[opt].bg },
                              }}
                            >
                              {opt}
                            </Button>
                          ))}
                        </ButtonGroup>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <Box p={2.5} display="flex" justifyContent="flex-end" alignItems="center" gap={1.5} sx={{ bgcolor: "#f8fafc", borderTop: "0.5px solid #e2e8f0" }}>
              {!isEditable && (
                <Typography fontSize={12} color="#94a3b8" mr="auto">
                  This submission is locked — {submission?.status === "PENDING_HOD" ? "awaiting HOD review." : "already approved."}
                </Typography>
              )}
              <Button
                variant="outlined"
                startIcon={<CloudUpload sx={{ fontSize: 18 }} />}
                onClick={handleSaveDraft}
                disabled={!isEditable || isSaving}
                sx={{ fontWeight: 700, textTransform: "none", fontSize: 13 }}
              >
                {isSaving ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                variant="contained"
                startIcon={<Send sx={{ fontSize: 18 }} />}
                onClick={handleSubmitForReview}
                disabled={!isEditable || isSubmitting}
                sx={{ bgcolor: "#2563eb", fontWeight: 700, textTransform: "none", boxShadow: "none", fontSize: 13, px: 3 }}
              >
                {isSubmitting ? "Submitting..." : "Submit for HOD Review"}
              </Button>
            </Box>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default ExamAttendanceView;
