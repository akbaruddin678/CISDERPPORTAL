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
  TextField,
  MenuItem,
  InputAdornment,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress,
  Tooltip,
  Fade,
} from "@mui/material";
import {
  UserCheck,
  Search,
  Eye,
  CheckCircle2,
  Undo2,
  X,
  Clock3,
  AlertTriangle,
  ClipboardList,
  CalendarDays,
  Users,
} from "lucide-react";

const STATUS_META = {
  PENDING_HOD: { label: "Pending HOD", bg: "#e0e7ff", text: "#3730a3" },
  APPROVED: { label: "Approved", bg: "#d1fae5", text: "#065f46" },
  RETURNED: { label: "Returned", bg: "#ffe4e6", text: "#9f1239" },
};

const ATTENDANCE_STATUS_META = {
  Present: { bg: "#d1fae5", text: "#065f46" },
  Late: { bg: "#fef3c7", text: "#92400e" },
  Absent: { bg: "#fff1f2", text: "#e11d48" },
  Pending: { bg: "#f1f5f9", text: "#64748b" },
};

const ACTIONABLE_STATUS = "PENDING_HOD";

const StatusPill = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, bg: "#f1f5f9", text: "#475569" };
  return (
    <Chip
      size="small"
      label={meta.label}
      sx={{ bgcolor: meta.bg, color: meta.text, fontWeight: 800, fontSize: 11, fontFamily: "'Montserrat', sans-serif" }}
    />
  );
};

const StatCard = (props) => {
  const Icon = props.icon;
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        minWidth: 140,
        border: "0.5px solid #e2e8f0",
        borderRadius: 2.5,
        p: 2,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        bgcolor: "#fff",
      }}
    >
      <Box sx={{ bgcolor: props.bg, borderRadius: 2, p: 1, display: "flex" }}>
        <Icon size={18} color={props.color} />
      </Box>
      <Box>
        <Typography fontSize={22} fontWeight={800} color="#0f172a" lineHeight={1} fontFamily="'Aleo', serif">
          {props.value}
        </Typography>
        <Typography fontSize={11} color="#94a3b8" fontWeight={600} mt={0.25} fontFamily="'Montserrat', sans-serif">
          {props.label}
        </Typography>
      </Box>
    </Paper>
  );
};

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "TBD";

const ApproveAttendanceView = ({
  submissions = [],
  totalSubmissions = 0,
  isFetching = false,
  statistics = { total: 0, pending: 0, approved: 0 },
  availableSemesters = [],

  selectedStatus,
  setSelectedStatus,
  selectedSemester,
  setSelectedSemester,
  searchTerm,
  setSearchTerm,

  selectedSubmission,
  rosterStudents = [],
  isFetchingRoster = false,
  isDetailsOpen,
  openDetails,
  closeDetails,
  isReturnOpen,
  openReturnModal,
  closeReturnModal,
  returnRemarks,
  setReturnRemarks,

  handleApprove,
  handleConfirmReturn,
  isReviewing,
}) => {
  return (
    <Fade in timeout={300}>
      <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f8fafc", fontFamily: "'Montserrat', sans-serif" }}>
        <Box mb={3}>
          <Typography variant="h5" fontWeight={800} color="#0f172a" fontFamily="'Aleo', serif">
            Approve Attendance
          </Typography>
          <Typography variant="body2" color="#64748b" mt={0.25}>
            Review exam attendance rosters recorded by Exam-Cell for your department, then approve or return them.
          </Typography>
        </Box>

        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <StatCard icon={ClipboardList} label="Total Submissions" value={statistics.total} color="#1d4ed8" bg="#eff6ff" />
          <StatCard icon={Clock3} label="Pending Review" value={statistics.pending} color="#b45309" bg="#fffbeb" />
          <StatCard icon={CheckCircle2} label="Approved" value={statistics.approved} color="#059669" bg="#ecfdf5" />
        </Box>

        <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: "0.5px solid #e2e8f0", borderRadius: 2, bgcolor: "#fff" }}>
          <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={2}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by course or exam type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
            />
            <TextField
              select
              size="small"
              label="Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              sx={{ minWidth: 180, "& .MuiOutlinedInput-root": { fontSize: 13 } }}
            >
              <MenuItem value="all" sx={{ fontSize: 13 }}>All Statuses</MenuItem>
              <MenuItem value="PENDING_HOD" sx={{ fontSize: 13 }}>Pending HOD</MenuItem>
              <MenuItem value="APPROVED" sx={{ fontSize: 13 }}>Approved</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              label="Section"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              sx={{ minWidth: 160, "& .MuiOutlinedInput-root": { fontSize: 13 } }}
            >
              <MenuItem value="all" sx={{ fontSize: 13 }}>All Sections</MenuItem>
              {availableSemesters.map((n) => (
                <MenuItem key={n} value={n} sx={{ fontSize: 13 }}>
                  Section {n}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ border: "0.5px solid #e2e8f0", borderRadius: 2, overflow: "hidden", bgcolor: "#fff" }}>
          {isFetching ? (
            <Box py={10} textAlign="center">
              <CircularProgress size={30} sx={{ color: "#2563eb" }} />
            </Box>
          ) : submissions.length === 0 ? (
            <Box py={9} textAlign="center" color="#94a3b8">
              <UserCheck size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
              <Typography fontSize={14} fontWeight={700}>
                {totalSubmissions === 0
                  ? "No attendance submissions yet."
                  : "No submissions match the current filters."}
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8fafc" }}>
                    {["Course", "Session / Semester", "Exam", "Status", "Actions"].map((h) => (
                      <TableCell
                        key={h}
                        align={h === "Actions" ? "right" : "left"}
                        sx={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748b", py: 1.75 }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissions.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ minWidth: 180 }}>
                        <Typography fontWeight={800} fontSize={13} color="#0f172a">
                          {s.courseTitle}
                        </Typography>
                        <Typography fontSize={11} fontWeight={700} color="#059669">
                          {s.courseCode}
                          {s.section ? ` · Sec ${s.section}` : ""}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={12} fontWeight={700} color="#475569">
                          {s.termName}
                        </Typography>
                        <Typography fontSize={11} color="#94a3b8">
                          Section {s.semesterNumber ?? "?"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={s.exam?.type || "Exam"} sx={{ bgcolor: "#f5f3ff", color: "#6d28d9", fontWeight: 800, fontSize: 11 }} />
                        <Typography fontSize={11} color="#94a3b8" mt={0.5}>
                          {formatDate(s.exam?.date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusPill status={s.status} />
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" gap={1} justifyContent="flex-end">
                          <Tooltip title="View roster" arrow>
                            <IconButton size="small" onClick={() => openDetails(s)} sx={{ color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 1.5 }}>
                              <Eye size={15} />
                            </IconButton>
                          </Tooltip>
                          {s.status === ACTIONABLE_STATUS && (
                            <>
                              <Tooltip title="Approve" arrow>
                                <IconButton size="small" onClick={() => handleApprove(s)} sx={{ color: "#059669", border: "1px solid #a7f3d0", borderRadius: 1.5 }}>
                                  <CheckCircle2 size={15} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Return with feedback" arrow>
                                <IconButton size="small" onClick={() => openReturnModal(s)} sx={{ color: "#e11d48", border: "1px solid #fecdd3", borderRadius: 1.5 }}>
                                  <Undo2 size={15} />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* ── DETAILS DIALOG: roster ── */}
        <Dialog open={isDetailsOpen} onClose={closeDetails} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          {selectedSubmission && (
            <>
              <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 2.5 }}>
                <Box>
                  <Typography fontWeight={800} fontFamily="'Aleo', serif">
                    {selectedSubmission.courseTitle} — {selectedSubmission.exam?.type}
                  </Typography>
                  <Typography fontSize={12} color="#64748b">
                    {selectedSubmission.courseCode} · {selectedSubmission.termName}, Section {selectedSubmission.semesterNumber}
                  </Typography>
                </Box>
                <IconButton onClick={closeDetails}><X size={18} /></IconButton>
              </DialogTitle>
              <Divider />
              <DialogContent sx={{ py: 3 }}>
                <Box display="grid" gridTemplateColumns={{ xs: "1fr 1fr", sm: "repeat(3, 1fr)" }} gap={2} mb={3}
                  sx={{ p: 2, border: "0.5px solid #e2e8f0", borderRadius: 2, bgcolor: "#f8fafc" }}>
                  {[
                    { label: "Exam Date", value: formatDate(selectedSubmission.exam?.date), icon: CalendarDays },
                    { label: "Exam Type", value: selectedSubmission.exam?.type, icon: ClipboardList },
                    { label: "Students", value: rosterStudents.length, icon: Users },
                  ].map((item) => (
                    <Box key={item.label}>
                      <Typography fontSize={10} fontWeight={800} color="#94a3b8" textTransform="uppercase">{item.label}</Typography>
                      <Typography fontSize={13} fontWeight={700} color="#1e293b">{item.value}</Typography>
                    </Box>
                  ))}
                </Box>

                {selectedSubmission.status === "RETURNED" && selectedSubmission.hodRemarks && (
                  <Box sx={{ display: "flex", gap: 1.5, p: 2, mb: 3, bgcolor: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 2 }}>
                    <AlertTriangle size={16} color="#e11d48" style={{ flexShrink: 0, marginTop: 2 }} />
                    <Box>
                      <Typography fontSize={12} fontWeight={800} color="#9f1239">Your previous remarks</Typography>
                      <Typography fontSize={13} color="#be123c">{selectedSubmission.hodRemarks}</Typography>
                    </Box>
                  </Box>
                )}

                {isFetchingRoster ? (
                  <Box py={6} textAlign="center">
                    <CircularProgress size={26} sx={{ color: "#2563eb" }} />
                  </Box>
                ) : rosterStudents.length === 0 ? (
                  <Box py={6} textAlign="center" color="#94a3b8">
                    <Typography fontSize={13} fontWeight={700}>No students found for this course.</Typography>
                  </Box>
                ) : (
                  <TableContainer sx={{ border: "0.5px solid #e2e8f0", borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "#f8fafc" }}>
                          <TableCell sx={{ fontSize: 11, fontWeight: 800, color: "#64748b" }}>Roll No.</TableCell>
                          <TableCell sx={{ fontSize: 11, fontWeight: 800, color: "#64748b" }}>Student</TableCell>
                          <TableCell align="center" sx={{ fontSize: 11, fontWeight: 800, color: "#64748b" }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rosterStudents.map((st) => {
                          const meta = ATTENDANCE_STATUS_META[st.status] || ATTENDANCE_STATUS_META.Pending;
                          return (
                            <TableRow key={st.studentId}>
                              <TableCell sx={{ fontSize: 12.5, fontWeight: 600, color: "#475569" }}>{st.rollNo}</TableCell>
                              <TableCell sx={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>{st.name}</TableCell>
                              <TableCell align="center">
                                <Chip size="small" label={st.status} sx={{ bgcolor: meta.bg, color: meta.text, fontWeight: 800, fontSize: 11 }} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </DialogContent>
              <Divider />
              <DialogActions sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
                <Button onClick={closeDetails} sx={{ fontWeight: 700, color: "#64748b", textTransform: "none" }}>
                  Close
                </Button>
                {selectedSubmission.status === ACTIONABLE_STATUS && (
                  <>
                    <Button
                      variant="outlined"
                      onClick={() => openReturnModal(selectedSubmission)}
                      startIcon={<Undo2 size={15} />}
                      sx={{ borderColor: "#fecdd3", color: "#e11d48", fontWeight: 700, textTransform: "none" }}
                    >
                      Return
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => handleApprove(selectedSubmission)}
                      disabled={isReviewing}
                      startIcon={isReviewing ? <CircularProgress size={14} color="inherit" /> : <CheckCircle2 size={15} />}
                      sx={{ bgcolor: "#059669", fontWeight: 700, boxShadow: "none", textTransform: "none" }}
                    >
                      Approve
                    </Button>
                  </>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* ── RETURN MODAL ── */}
        <Dialog open={isReturnOpen} onClose={closeReturnModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 800, fontFamily: "'Aleo', serif" }}>Return Attendance to Exam-Cell</DialogTitle>
          <Divider />
          <DialogContent sx={{ py: 3 }}>
            <Typography fontSize={13} color="#64748b" mb={2}>
              Explain what needs to change — Exam-Cell staff will see this and can revise & re-submit.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              autoFocus
              placeholder="e.g. Please recheck roll no. 21-CS-045's status..."
              value={returnRemarks}
              onChange={(e) => setReturnRemarks(e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
            />
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
            <Button onClick={closeReturnModal} sx={{ fontWeight: 700, color: "#64748b", textTransform: "none" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmReturn}
              disabled={isReviewing || !returnRemarks.trim()}
              startIcon={isReviewing ? <CircularProgress size={14} color="inherit" /> : <Undo2 size={15} />}
              sx={{ bgcolor: "#e11d48", fontWeight: 700, boxShadow: "none", textTransform: "none" }}
            >
              Confirm Return
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default ApproveAttendanceView;
