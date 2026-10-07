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
  AlertTriangle,
  Search,
  Gavel,
  Clock3,
  CheckCircle2,
  X,
  CalendarDays,
} from "lucide-react";

const STATUS_META = {
  Reported: { label: "Reported", bg: "#fff1f2", text: "#9f1239" },
  "Under Review": { label: "Under Review", bg: "#fef3c7", text: "#92400e" },
  Resolved: { label: "Resolved", bg: "#d1fae5", text: "#065f46" },
};

const StatusPill = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, bg: "#f1f5f9", text: "#475569" };
  return (
    <Chip size="small" label={meta.label} sx={{ bgcolor: meta.bg, color: meta.text, fontWeight: 800, fontSize: 11 }} />
  );
};

const StatCard = (props) => {
  const Icon = props.icon;
  return (
    <Paper elevation={0} sx={{ flex: 1, minWidth: 140, border: "0.5px solid #e2e8f0", borderRadius: 2.5, p: 2, display: "flex", alignItems: "center", gap: 1.5, bgcolor: "#fff" }}>
      <Box sx={{ bgcolor: props.bg, borderRadius: 2, p: 1, display: "flex" }}>
        <Icon size={18} color={props.color} />
      </Box>
      <Box>
        <Typography fontSize={22} fontWeight={800} color="#0f172a" lineHeight={1} fontFamily="'Aleo', serif">{props.value}</Typography>
        <Typography fontSize={11} color="#94a3b8" fontWeight={600} mt={0.25}>{props.label}</Typography>
      </Box>
    </Paper>
  );
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "N/A";

const ApproveUFMView = ({
  reports = [],
  totalReports = 0,
  isFetching = false,
  statistics = { total: 0, reported: 0, underReview: 0, resolved: 0 },

  selectedStatus,
  setSelectedStatus,
  searchTerm,
  setSearchTerm,

  selectedReport,
  isDecisionOpen,
  openDecisionModal,
  closeDecisionModal,
  decisionText,
  setDecisionText,
  decisionStatus,
  setDecisionStatus,
  handleConfirmDecision,
  isReviewing,
}) => {
  return (
    <Fade in timeout={300}>
      <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f8fafc", fontFamily: "'Montserrat', sans-serif" }}>
        <Box mb={3}>
          <Typography variant="h5" fontWeight={800} color="#0f172a" fontFamily="'Aleo', serif">
            Approve UFM Cases
          </Typography>
          <Typography variant="body2" color="#64748b" mt={0.25}>
            Review Unfair Means reports for your department and record the committee's decision.
          </Typography>
        </Box>

        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <StatCard icon={AlertTriangle} label="Total Cases" value={statistics.total} color="#1d4ed8" bg="#eff6ff" />
          <StatCard icon={Clock3} label="Reported" value={statistics.reported} color="#e11d48" bg="#fff1f2" />
          <StatCard icon={Gavel} label="Under Review" value={statistics.underReview} color="#b45309" bg="#fffbeb" />
          <StatCard icon={CheckCircle2} label="Resolved" value={statistics.resolved} color="#059669" bg="#ecfdf5" />
        </Box>

        <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: "0.5px solid #e2e8f0", borderRadius: 2, bgcolor: "#fff" }}>
          <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={2}>
            <TextField
              fullWidth size="small" placeholder="Search by student, course, or violation..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: (<InputAdornment position="start"><Search size={16} /></InputAdornment>) }}
              sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
            />
            <TextField select size="small" label="Status" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} sx={{ minWidth: 180, "& .MuiOutlinedInput-root": { fontSize: 13 } }}>
              <MenuItem value="all" sx={{ fontSize: 13 }}>All Statuses</MenuItem>
              <MenuItem value="Reported" sx={{ fontSize: 13 }}>Reported</MenuItem>
              <MenuItem value="Under Review" sx={{ fontSize: 13 }}>Under Review</MenuItem>
              <MenuItem value="Resolved" sx={{ fontSize: 13 }}>Resolved</MenuItem>
            </TextField>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ border: "0.5px solid #e2e8f0", borderRadius: 2, overflow: "hidden", bgcolor: "#fff" }}>
          {isFetching ? (
            <Box py={10} textAlign="center"><CircularProgress size={30} sx={{ color: "#2563eb" }} /></Box>
          ) : reports.length === 0 ? (
            <Box py={9} textAlign="center" color="#94a3b8">
              <AlertTriangle size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
              <Typography fontSize={14} fontWeight={700}>
                {totalReports === 0 ? "No UFM cases reported for your department." : "No cases match the current filters."}
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8fafc" }}>
                    {["Student", "Course", "Violation", "Reported On", "Status", "Actions"].map((h) => (
                      <TableCell key={h} align={h === "Actions" ? "right" : "left"} sx={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748b", py: 1.75 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r._id} hover>
                      <TableCell>
                        <Typography fontWeight={800} fontSize={13} color="#0f172a">{r.studentId?.personalInfo?.fullName || "Unknown"}</Typography>
                        <Typography fontSize={11} color="#94a3b8">{r.studentId?.studentId || "N/A"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={13} fontWeight={700} color="#334155">{r.examId?.courseId?.title || "N/A"}</Typography>
                        <Typography fontSize={11} color="#059669" fontWeight={700}>{r.examId?.courseId?.code}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={r.violationType} sx={{ bgcolor: "#f5f3ff", color: "#6d28d9", fontWeight: 800, fontSize: 11 }} />
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={12} color="#475569">{formatDate(r.createdAt)}</Typography>
                      </TableCell>
                      <TableCell><StatusPill status={r.status} /></TableCell>
                      <TableCell align="right">
                        <Tooltip title={r.status === "Resolved" ? "View decision" : "Record decision"} arrow>
                          <IconButton size="small" onClick={() => openDecisionModal(r)} sx={{ color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 1.5 }}>
                            <Gavel size={15} />
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

        <Dialog open={isDecisionOpen} onClose={closeDecisionModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          {selectedReport && (
            <>
              <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 2.5 }}>
                <Box>
                  <Typography fontWeight={800} fontFamily="'Aleo', serif">Committee Decision</Typography>
                  <Typography fontSize={12} color="#64748b">
                    {selectedReport.studentId?.personalInfo?.fullName} · {selectedReport.examId?.courseId?.title}
                  </Typography>
                </Box>
                <IconButton onClick={closeDecisionModal}><X size={18} /></IconButton>
              </DialogTitle>
              <Divider />
              <DialogContent sx={{ py: 3 }}>
                <Box sx={{ display: "flex", gap: 1.5, p: 2, mb: 3, bgcolor: "#f8fafc", border: "0.5px solid #e2e8f0", borderRadius: 2 }}>
                  <CalendarDays size={16} color="#64748b" style={{ flexShrink: 0, marginTop: 2 }} />
                  <Box>
                    <Typography fontSize={12} fontWeight={800} color="#1e293b">{selectedReport.violationType}</Typography>
                    <Typography fontSize={13} color="#475569">{selectedReport.statement || "No statement recorded."}</Typography>
                  </Box>
                </Box>
                <TextField
                  select fullWidth size="small" label="Status" value={decisionStatus}
                  onChange={(e) => setDecisionStatus(e.target.value)}
                  sx={{ mb: 2, "& .MuiOutlinedInput-root": { fontSize: 13 } }}
                >
                  <MenuItem value="Under Review" sx={{ fontSize: 13 }}>Under Review</MenuItem>
                  <MenuItem value="Resolved" sx={{ fontSize: 13 }}>Resolved</MenuItem>
                </TextField>
                <TextField
                  fullWidth multiline rows={4} label="Committee Decision"
                  placeholder="Record the committee's findings and decision..."
                  value={decisionText} onChange={(e) => setDecisionText(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
                />
              </DialogContent>
              <Divider />
              <DialogActions sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
                <Button onClick={closeDecisionModal} sx={{ fontWeight: 700, color: "#64748b", textTransform: "none" }}>Cancel</Button>
                <Button
                  variant="contained" onClick={handleConfirmDecision} disabled={isReviewing}
                  startIcon={isReviewing ? <CircularProgress size={14} color="inherit" /> : <CheckCircle2 size={15} />}
                  sx={{ bgcolor: "#2563eb", fontWeight: 700, boxShadow: "none", textTransform: "none" }}
                >
                  Save Decision
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Fade>
  );
};

export default ApproveUFMView;
