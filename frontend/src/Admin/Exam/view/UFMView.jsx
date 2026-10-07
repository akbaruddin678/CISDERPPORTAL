import React from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tooltip,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  Avatar,
} from "@mui/material";
import {
  Gavel,
  Visibility,
  AddAlert,
  Delete,
  Search,
  AssignmentTurnedIn,
} from "@mui/icons-material";

const UFMView = ({
  currentTab,
  handleTabChange,
  reports,
  isFetchingReports,
  filters,
  handleFilterChange,
  terms,
  departments,
  availablePrograms,
  availableSemesters,
  courses,
  students,
  isFetchingStudents,
  isReadyForStudents,
  targetStudent,
  isModalOpen,
  handleOpenReview,
  handleOpenAdd,
  handleCloseModal,
  decisionData,
  setDecisionData,
  handleSaveDecision,
  isUpdating,
  isCreating,
  isAddingNew,
  handleDelete,
}) => {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f6f8fb", fontFamily: "'Montserrat', sans-serif" }}>
      <Box mb={3} display="flex" alignItems="center" gap={1.5}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "#fff1f2", color: "#be123c", display: "grid", placeItems: "center" }}><Gavel fontSize="small" /></Box>
        <Box>
          <Typography variant="h5" fontWeight="800" color="#0f172a" fontFamily="'Aleo', serif">
            Disciplinary / UFM Cases
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Log evidence, review cases, and record committee decisions.
          </Typography>
        </Box>
      </Box>

      {/* TABS HEADER */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          textColor="error"
          indicatorColor="error"
        >
          <Tab
            label="Log new case"
            sx={{ fontWeight: "bold" }}
          />
          <Tab label="Case history" sx={{ fontWeight: "bold" }} />
        </Tabs>
      </Box>

      {/* ==========================================
          TAB 0: SEARCH ROSTER & LOG NEW CASE
          ========================================== */}
      {currentTab === 0 && (
        <Box>
          <Paper
            elevation={0}
            sx={{ p: 3, mb: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}
          >
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              mb={2}
              color="text.secondary"
            >
              1. SELECT EXAM BATCH
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={2.4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Session"
                  value={filters.termId || ""}
                  onChange={(e) => handleFilterChange("termId", e.target.value)}
                >
                  <MenuItem value="" disabled>
                    <em>Select...</em>
                  </MenuItem>
                  {terms.map((t) => (
                    <MenuItem key={t._id} value={t._id}>
                      {t.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Department"
                  value={filters.departmentId || ""}
                  onChange={(e) =>
                    handleFilterChange("departmentId", e.target.value)
                  }
                >
                  <MenuItem value="" disabled>
                    <em>Select...</em>
                  </MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d._id} value={d._id}>
                      {d.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Program"
                  disabled={!filters.departmentId}
                  value={filters.programId || ""}
                  onChange={(e) =>
                    handleFilterChange("programId", e.target.value)
                  }
                >
                  <MenuItem value="" disabled>
                    <em>Select...</em>
                  </MenuItem>
                  {availablePrograms.map((p) => (
                    <MenuItem key={p._id} value={p._id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Semester"
                  disabled={!filters.programId}
                  value={filters.semesterId || ""}
                  onChange={(e) =>
                    handleFilterChange("semesterId", e.target.value)
                  }
                >
                  <MenuItem value="" disabled>
                    <em>Select...</em>
                  </MenuItem>
                  {availableSemesters.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {s.name || `Semester ${s.number}`}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Course"
                  disabled={!filters.semesterId}
                  value={filters.courseId || ""}
                  onChange={(e) =>
                    handleFilterChange("courseId", e.target.value)
                  }
                >
                  <MenuItem value="" disabled>
                    <em>Select...</em>
                  </MenuItem>
                  {courses.map((c) => (
                    <MenuItem key={c._id} value={c._id}>
                      {c.title}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              border: "1px solid #e2e8f0",
              borderRadius: 3,
              overflow: "hidden",
              bgcolor: "white",
            }}
          >
            {!isReadyForStudents ? (
              <Box p={10} textAlign="center">
                <Search
                  sx={{
                    fontSize: 60,
                    opacity: 0.2,
                    color: "error.main",
                    mb: 2,
                  }}
                />
                <Typography variant="h6" color="text.secondary">
                  Awaiting Selection
                </Typography>
                <Typography color="text.secondary">
                  Select an exam to load the student roster.
                </Typography>
              </Box>
            ) : isFetchingStudents ? (
              <Box p={10} textAlign="center">
                <CircularProgress color="error" />
              </Box>
            ) : students.length === 0 ? (
              <Box p={10} textAlign="center">
                <AssignmentTurnedIn
                  sx={{ fontSize: 60, opacity: 0.2, mb: 2 }}
                />
                <Typography variant="h6">No Students Found</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                    <TableRow>
                      <TableCell>
                        <strong>Student</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Roll No</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Action</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.studentId} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: "error.light",
                                fontSize: 14,
                              }}
                            >
                              {student.name?.charAt(0) || "S"}
                            </Avatar>
                            <Typography variant="body2" fontWeight="bold">
                              {student.name || "Unknown"}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{student.rollNo || "N/A"}</TableCell>
                        <TableCell align="right">
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<AddAlert />}
                            onClick={() => handleOpenAdd(student)}
                          >
                            Log Case
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      )}

      {/* ==========================================
          TAB 1: UFM RECORDS HISTORY
          ========================================== */}
      {currentTab === 1 &&
        (isFetchingReports ? (
          <Box p={10} textAlign="center">
            <CircularProgress color="error" />
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ border: "1px solid #e2e8f0", borderRadius: 3 }}
          >
            <Table>
              <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                <TableRow>
                  <TableCell>
                    <strong>Student</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Course Exam</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Violation</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      No UFM cases reported yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((row) => {
                    // ✅ Safe fallback for populated nested fields
                    const studentName =
                      row.studentId?.personalInfo?.fullName ||
                      row.studentId?.name ||
                      "Unknown Student";
                    const rollNo =
                      row.studentId?.studentId ||
                      row.studentId?.rollNo ||
                      "N/A";

                    return (
                      <TableRow key={row._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {studentName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rollNo}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {row.examId?.courseId?.title || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.violationType}
                            color="error"
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: "bold" }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={row.status}
                            color={
                              row.status === "Resolved"
                                ? "success"
                                : row.status === "Reported"
                                  ? "error"
                                  : "warning"
                            }
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Review / Update Case">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenReview(row)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Case">
                            <IconButton
                              color="error"
                              onClick={() => handleDelete(row._id)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ))}

      {/* ==========================================
          MODAL (ADD NEW OR REVIEW EXISTING)
          ========================================== */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ bgcolor: "#f8fafc", pb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            {isAddingNew ? "Log New UFM Case" : "Review Disciplinary Case"}
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Show Target Student Info when adding */}
            {isAddingNew && targetStudent && (
              <Box
                p={2}
                bgcolor="#f1f5f9"
                borderRadius={2}
                border="1px solid #e2e8f0"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Student Offender
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {targetStudent.name} ({targetStudent.rollNo})
                  </Typography>
                </Box>
                <Chip label="Selected" size="small" color="primary" />
              </Box>
            )}

            {isAddingNew ? (
              <TextField
                select
                label="Violation Type"
                value={decisionData.violationType}
                onChange={(e) =>
                  setDecisionData({
                    ...decisionData,
                    violationType: e.target.value,
                  })
                }
                fullWidth
              >
                <MenuItem value="Cheating (Notes)">
                  Cheating (Notes / Chit)
                </MenuItem>
                <MenuItem value="Electronic Device">
                  Unauthorized Electronic Device
                </MenuItem>
                <MenuItem value="Impersonation">Impersonation (Proxy)</MenuItem>
                <MenuItem value="Misconduct">Misconduct / Argument</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            ) : (
              <TextField
                label="Violation Type"
                value={decisionData.violationType}
                InputProps={{ readOnly: true }}
                fullWidth
              />
            )}

            <Box
              p={2}
              bgcolor="#fff1f2"
              borderRadius={2}
              border="1px solid #fecdd3"
            >
              <Typography
                variant="subtitle2"
                color="error"
                fontWeight="bold"
                mb={1}
              >
                Statement of Report
              </Typography>
              {isAddingNew ? (
                <TextField
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Describe the incident in detail..."
                  value={decisionData.statement}
                  onChange={(e) =>
                    setDecisionData({
                      ...decisionData,
                      statement: e.target.value,
                    })
                  }
                />
              ) : (
                <Typography variant="body2">
                  {decisionData.statement}
                </Typography>
              )}
            </Box>

            <TextField
              select
              label="Case Status"
              value={decisionData.status}
              onChange={(e) =>
                setDecisionData({ ...decisionData, status: e.target.value })
              }
              fullWidth
            >
              <MenuItem value="Reported">Reported</MenuItem>
              <MenuItem value="Under Review">
                Under Review by Committee
              </MenuItem>
              <MenuItem value="Resolved">Resolved / Closed</MenuItem>
            </TextField>

            <TextField
              label="Committee Decision & Actions Taken"
              multiline
              rows={4}
              placeholder="e.g. Exam cancelled, fined 5000 Rs..."
              value={decisionData.committeeDecision}
              onChange={(e) =>
                setDecisionData({
                  ...decisionData,
                  committeeDecision: e.target.value,
                })
              }
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: "#f8fafc" }}>
          <Button variant="outlined" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleSaveDecision}
            disabled={isUpdating || isCreating}
            startIcon={<Gavel />}
          >
            {isUpdating || isCreating ? "Saving..." : "Lock Decision"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UFMView;
