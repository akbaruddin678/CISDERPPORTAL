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
  FactCheck,
  Edit,
  Search,
  AssignmentTurnedIn,
  AddAlert,
  Delete,
} from "@mui/icons-material";

const ReEvaluationView = ({
  currentTab,
  handleTabChange,
  appeals,
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
  reviewData,
  setReviewData,
  handleSaveReview,
  isUpdating,
  isAddingNew,
  handleDelete,
}) => {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f6f8fb", fontFamily: "'Montserrat', sans-serif" }}>
      {/* HEADER */}
      <Box mb={3} display="flex" alignItems="center" gap={1.5}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "#eff6ff", color: "#1d4ed8", display: "grid", placeItems: "center" }}><FactCheck fontSize="small" /></Box>
        <Box>
          <Typography variant="h5" fontWeight="800" color="#0f172a" fontFamily="'Aleo', serif">
            Re-Evaluation Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Log, review, and resolve student requests for paper re-checking.
          </Typography>
        </Box>
      </Box>

      {/* TABS NAVIGATION */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 4 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab
            label="Log request"
            sx={{ fontWeight: "bold" }}
          />
          <Tab label="Request history" sx={{ fontWeight: "bold" }} />
        </Tabs>
      </Box>

      {/* ==========================================
          TAB 0: FIND STUDENT (ROSTER)
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
              SEARCH EXAM ROSTER
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
                  label="Class"
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
                  label="Section"
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
                    color: "primary.main",
                    mb: 2,
                  }}
                />
                <Typography variant="h6" color="text.secondary">
                  Awaiting Selection
                </Typography>
                <Typography color="text.secondary">
                  Select a course to view students and their current marks.
                </Typography>
              </Box>
            ) : isFetchingStudents ? (
              <Box p={10} textAlign="center">
                <CircularProgress color="primary" />
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
                      <TableCell align="center">
                        <strong>Current Total Marks</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Action</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student) => {
                      const totalMarks =
                        (Number(student.midMarks) || 0) +
                        (Number(student.finalMarks) || 0) +
                        (Number(student.sessionalMarks) || 0);
                      return (
                        <TableRow key={student.studentId} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  bgcolor: "primary.light",
                                  fontSize: 14,
                                }}
                              >
                                {student.name?.charAt(0) || "S"}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {student.name || "Unknown"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {student.rollNo || "N/A"}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              fontWeight="bold"
                              color={totalMarks < 50 ? "error" : "success.main"}
                            >
                              {totalMarks}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              startIcon={<AddAlert />}
                              onClick={() => handleOpenAdd(student)}
                            >
                              Log Appeal
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      )}

      {/* ==========================================
          TAB 1: APPEALS HISTORY
          ========================================== */}
      {currentTab === 1 &&
        (isFetchingReports ? (
          <Box p={10} textAlign="center">
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ border: "1px solid #e2e8f0" }}
          >
            <Table>
              <TableHead sx={{ bgcolor: "#f8fafc" }}>
                <TableRow>
                  <TableCell>
                    <strong>Student</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Course Exam</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Old Marks</strong>
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
                {appeals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      No Re-Evaluation appeals found.
                    </TableCell>
                  </TableRow>
                ) : (
                  appeals.map((row) => {
                    // ✅ PERFECTLY SAFE STUDENT NAME FALLBACKS
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
                          {row.resultId?.examId?.courseId?.title || "N/A"}
                        </TableCell>
                        <TableCell align="center">
                          <Typography fontWeight="bold" color="error">
                            {row.oldMarks}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={row.status}
                            color={
                              row.status === "Applied"
                                ? "warning"
                                : row.status === "Changed"
                                  ? "success"
                                  : "default"
                            }
                            sx={{ fontWeight: "bold" }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Process Appeal">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenReview(row)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Record">
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
          REVIEW / ADD MODAL
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
            {isAddingNew
              ? "Log Re-Evaluation Request"
              : "Process Re-Evaluation"}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Target Student Preview */}
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
                    Appealing Student
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {targetStudent.name} ({targetStudent.rollNo})
                  </Typography>
                </Box>
                <Chip label="Selected" size="small" color="primary" />
              </Box>
            )}

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Original Marks
                </Typography>
                <Typography variant="h6" color="error" fontWeight="bold">
                  {reviewData.oldMarks}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="number"
                  label="Revised Marks"
                  size="small"
                  fullWidth
                  disabled={isAddingNew}
                  value={reviewData.newMarks}
                  onChange={(e) =>
                    setReviewData({ ...reviewData, newMarks: e.target.value })
                  }
                />
              </Grid>
            </Grid>

            {isAddingNew && (
              <TextField
                label="Fee Challan / Payment ID"
                size="small"
                required
                value={reviewData.feePaymentId}
                onChange={(e) =>
                  setReviewData({ ...reviewData, feePaymentId: e.target.value })
                }
                fullWidth
                helperText="Required to verify the student paid the appeal fee."
              />
            )}

            <TextField
              select
              label="Application Status"
              value={reviewData.status}
              onChange={(e) =>
                setReviewData({ ...reviewData, status: e.target.value })
              }
              fullWidth
            >
              <MenuItem value="Applied">Applied (Pending Review)</MenuItem>
              <MenuItem value="Under Review">Under Review</MenuItem>
              <MenuItem value="Changed" disabled={isAddingNew}>
                Changed (Marks Updated)
              </MenuItem>
              <MenuItem value="Unchanged" disabled={isAddingNew}>
                Unchanged (Appeal Rejected)
              </MenuItem>
            </TextField>

            <TextField
              label="Reviewer Notes / Justification"
              multiline
              rows={3}
              placeholder="Provide details on what was checked..."
              value={reviewData.decisionNote}
              onChange={(e) =>
                setReviewData({ ...reviewData, decisionNote: e.target.value })
              }
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: "#f8fafc" }}>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveReview}
            disabled={isUpdating}
            startIcon={<FactCheck />}
          >
            {isAddingNew ? "Log Appeal Request" : "Lock in Revision"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default ReEvaluationView;
