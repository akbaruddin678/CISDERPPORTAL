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
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import {
  Print,
  Search,
  AssignmentTurnedIn,
  Visibility,
  Close,
  Groups,
  CheckCircleOutline,
  HighlightOff,
  HourglassEmpty,
} from "@mui/icons-material";

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <Paper
    elevation={0}
    sx={{
      flex: 1,
      minWidth: 150,
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

const ExamResultView = ({
  filters,
  handleFilterChange,
  terms,
  departments,
  availablePrograms,
  availableSemesters,
  results,
  isFetching,
  isReadyToFetch,
  downloadPrintList,
  downloadSingleResult,
  selectedStudent,
  isDetailsOpen,
  handleOpenDetails,
  handleCloseDetails,
}) => {
  const stats = useMemo(() => {
    const total = results.length;
    const passed = results.filter((r) => r.status === "Pass").length;
    const provisional = results.filter((r) =>
      r.courses.some((c) => !c.isFullyDeclared),
    ).length;
    return { total, passed, failed: total - passed, provisional };
  }, [results]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f8fafc", fontFamily: "'Montserrat', sans-serif" }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#0f172a" fontFamily="'Aleo', serif">
            Results &amp; Grading
          </Typography>
          <Typography variant="body2" color="#64748b" mt={0.25} fontFamily="'Montserrat', sans-serif">
            View computed grades, GPA, and course-wise results per student.
          </Typography>
        </Box>
        {results.length > 0 && (
          <Button
            variant="contained"
            startIcon={<Print sx={{ fontSize: 18 }} />}
            onClick={downloadPrintList}
            sx={{ bgcolor: "#0f172a", fontWeight: 700, textTransform: "none", boxShadow: "none", fontFamily: "'Montserrat', sans-serif", fontSize: 13, px: 2.5, "&:hover": { bgcolor: "#1e293b" } }}
          >
            Print All Transcripts
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: "0.5px solid #e2e8f0", borderRadius: 2, bgcolor: "#fff" }}>
        <Typography fontSize={12} fontWeight={800} color="#94a3b8" textTransform="uppercase" letterSpacing="0.05em" mb={2} fontFamily="'Montserrat', sans-serif">
          Batch Configuration
        </Typography>
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" }} gap={2}>
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
            <MenuItem value="all" sx={{ fontSize: 13 }}>All Programs</MenuItem>
            {availablePrograms.map((p) => (<MenuItem key={p._id} value={p._id} sx={{ fontSize: 13 }}>{p.name}</MenuItem>))}
          </TextField>
          <TextField
            select fullWidth size="small" label="Section"
            disabled={!filters.departmentId}
            value={filters.semesterId}
            onChange={(e) => handleFilterChange("semesterId", e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
          >
            <MenuItem value="all" sx={{ fontSize: 13 }}>All Sections</MenuItem>
            {availableSemesters.map((s) => (<MenuItem key={s._id} value={s._id} sx={{ fontSize: 13 }}>{s.name || `Section ${s.number}`}</MenuItem>))}
          </TextField>
        </Box>
      </Paper>

      {isReadyToFetch && results.length > 0 && (
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <StatCard icon={Groups} label="Total Students" value={stats.total} color="#1d4ed8" bg="#eff6ff" />
          <StatCard icon={CheckCircleOutline} label="Passed" value={stats.passed} color="#15803d" bg="#f0fdf4" />
          <StatCard icon={HighlightOff} label="Failed" value={stats.failed} color="#b91c1c" bg="#fef2f2" />
          <StatCard icon={HourglassEmpty} label="Provisional (Pending Approval)" value={stats.provisional} color="#b45309" bg="#fffbeb" />
        </Box>
      )}

      <Paper elevation={0} sx={{ borderRadius: 2.5, border: "0.5px solid #e2e8f0", overflow: "hidden", bgcolor: "#fff" }}>
        {!isReadyToFetch ? (
          <Box p={10} textAlign="center">
            <Search sx={{ fontSize: 48, opacity: 0.15, mb: 1.5 }} />
            <Typography fontSize={15} fontWeight={700} color="#64748b" fontFamily="'Aleo', serif">Awaiting Selection</Typography>
            <Typography fontSize={13} color="#94a3b8" mt={0.5}>Select a Session and Class to load compiled results.</Typography>
          </Box>
        ) : isFetching ? (
          <Box p={10} textAlign="center">
            <CircularProgress sx={{ color: "#2563eb" }} />
            <Typography fontSize={13} color="#94a3b8" mt={1.5}>Compiling academic records...</Typography>
          </Box>
        ) : results.length === 0 ? (
          <Box p={10} textAlign="center">
            <AssignmentTurnedIn sx={{ fontSize: 48, opacity: 0.2, mb: 1.5 }} />
            <Typography fontSize={15} fontWeight={700} color="#64748b" fontFamily="'Aleo', serif">No Results Found</Typography>
            <Typography fontSize={13} color="#94a3b8" mt={0.5}>No students in this batch have uploaded marks yet.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Student</TableCell>
                  <TableCell sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Courses Cleared</TableCell>
                  <TableCell sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>SGPA</TableCell>
                  <TableCell sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Status</TableCell>
                  <TableCell align="center" sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((row) => (
                  <TableRow key={row.studentId} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ width: 30, height: 30, fontSize: 13, fontWeight: 700, bgcolor: "#eff6ff", color: "#1d4ed8" }}>
                          {row.name?.charAt(0) || "U"}
                        </Avatar>
                        <Box>
                          <Typography fontSize={13} fontWeight={700} color="#1e293b">{row.name || "Unknown Student"}</Typography>
                          <Typography fontSize={11} color="#94a3b8">{row.rollNo || "N/A"}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={13} color="#334155">
                        {row.courses.filter((c) => c.grade !== "F").length} / {row.courses.length}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={13} fontWeight={800} color="#1d4ed8" fontFamily="'Aleo', serif">{row.sgpa}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.status}
                        sx={{
                          fontWeight: 700, fontSize: 11,
                          bgcolor: row.status === "Pass" ? "#f0fdf4" : "#fef2f2",
                          color: row.status === "Pass" ? "#15803d" : "#b91c1c",
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Academic Details">
                        <IconButton size="small" onClick={() => handleOpenDetails(row)} sx={{ color: "#0891b2", mr: 0.5 }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Print Individual Transcript">
                        <IconButton size="small" onClick={() => downloadSingleResult(row)} sx={{ color: "#2563eb" }}>
                          <Print fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Student Details Modal */}
      <Dialog open={isDetailsOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: "#f8fafc", pb: 2, borderBottom: "0.5px solid #e2e8f0" }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography fontWeight={800} fontFamily="'Aleo', serif" color="#0f172a">Student Academic Profile</Typography>
            <IconButton onClick={handleCloseDetails} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 4 }}>
          {selectedStudent && (
            <Box>
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mb={4}>
                <Box>
                  <Typography fontSize={11} color="#94a3b8" fontWeight={600}>Full Name</Typography>
                  <Typography fontSize={14} fontWeight={700} color="#1e293b">{selectedStudent.name}</Typography>
                </Box>
                <Box>
                  <Typography fontSize={11} color="#94a3b8" fontWeight={600}>Registration / Roll No</Typography>
                  <Typography fontSize={14} fontWeight={700} color="#1e293b">{selectedStudent.rollNo}</Typography>
                </Box>
              </Box>

              <Typography fontSize={13} fontWeight={800} color="#1d4ed8" mb={2} fontFamily="'Montserrat', sans-serif">Course Breakdown</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Course Title</TableCell>
                      <TableCell sx={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Code</TableCell>
                      <TableCell align="center" sx={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Cr.Hrs</TableCell>
                      <TableCell align="center" sx={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Marks</TableCell>
                      <TableCell align="center" sx={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Grade</TableCell>
                      <TableCell align="center" sx={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>GP</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedStudent.courses.map((course, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontSize: 13 }}>{course.courseTitle}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{course.courseCode}</TableCell>
                        <TableCell align="center" sx={{ fontSize: 13 }}>{course.credits}</TableCell>
                        <TableCell align="center" sx={{ fontSize: 13 }}>
                          {course.totalMarks}/{course.maxMarks}
                          {!course.isFullyDeclared && (
                            <Chip size="small" label="Provisional" sx={{ ml: 1, height: 18, fontSize: "0.65rem", bgcolor: "#fef3c7", color: "#92400e", fontWeight: 700 }} />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Typography fontSize={13} fontWeight={800} color={course.grade === "F" ? "#b91c1c" : "#15803d"}>{course.grade}</Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: 13 }}>{parseFloat(course.gp).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ mb: 3 }} />

              <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: "center", bgcolor: "#f8fafc", borderRadius: 2 }}>
                  <Typography fontSize={11} color="#94a3b8" fontWeight={600}>Total Credits</Typography>
                  <Typography fontSize={20} fontWeight={800} fontFamily="'Aleo', serif">{selectedStudent.totalCredits}</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, textAlign: "center", bgcolor: "#f8fafc", borderRadius: 2 }}>
                  <Typography fontSize={11} color="#94a3b8" fontWeight={600}>SGPA</Typography>
                  <Typography fontSize={20} fontWeight={800} color="#1d4ed8" fontFamily="'Aleo', serif">{selectedStudent.sgpa}</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, textAlign: "center", bgcolor: "#f8fafc", borderRadius: 2 }}>
                  <Typography fontSize={11} color="#94a3b8" fontWeight={600}>Est. CGPA</Typography>
                  <Typography fontSize={20} fontWeight={800} color="#7c3aed" fontFamily="'Aleo', serif">{selectedStudent.sgpa}*</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, textAlign: "center", borderRadius: 2, bgcolor: selectedStudent.status === "Pass" ? "#f0fdf4" : "#fef2f2" }}>
                  <Typography fontSize={11} color="#94a3b8" fontWeight={600}>Academic Status</Typography>
                  <Typography fontSize={20} fontWeight={800} color={selectedStudent.status === "Pass" ? "#15803d" : "#b91c1c"} fontFamily="'Aleo', serif">
                    {selectedStudent.status}
                  </Typography>
                </Paper>
              </Box>
              <Typography fontSize={11} color="#94a3b8" mt={1.5}>
                * CGPA displayed currently reflects current section data until complete historical term aggregation is processed.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
          <Button onClick={handleCloseDetails} sx={{ textTransform: "none", fontWeight: 700, color: "#64748b" }}>Close</Button>
          <Button
            variant="contained"
            startIcon={<Print sx={{ fontSize: 18 }} />}
            onClick={() => { handleCloseDetails(); downloadSingleResult(selectedStudent); }}
            sx={{ bgcolor: "#2563eb", fontWeight: 700, textTransform: "none", boxShadow: "none" }}
          >
            Print Transcript
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExamResultView;
