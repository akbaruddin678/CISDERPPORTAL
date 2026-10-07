import React from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { UserMinus, Users } from "lucide-react";

const CourseWithdrawalsView = ({
  programs = [],
  isFetchingPrograms,
  programId,
  setProgramId,

  registrations = [],
  isFetching,

  selectedRegistration,
  isModalOpen,
  openWithdrawModal,
  closeModal,
  withdrawalType,
  setWithdrawalType,
  reason,
  setReason,
  handleConfirmWithdraw,
  isSubmitting,
}) => {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f8fafc", fontFamily: "'Montserrat', sans-serif" }}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={800} color="#0f172a" fontFamily="'Aleo', serif">
          Course Withdrawals
        </Typography>
        <Typography variant="body2" color="#64748b" mt={0.25}>
          Withdraw a student from a course in your department — this is final, no separate approval step.
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: "0.5px solid #e2e8f0", borderRadius: 2, bgcolor: "#fff" }}>
        <TextField
          select size="small" label="Program" disabled={isFetchingPrograms}
          value={programId} onChange={(e) => setProgramId(e.target.value)}
          sx={{ minWidth: 260, "& .MuiOutlinedInput-root": { fontSize: 13 } }}
        >
          {programs.map((p) => (<MenuItem key={p._id} value={p._id} sx={{ fontSize: 13 }}>{p.name}</MenuItem>))}
        </TextField>
      </Paper>

      <Paper elevation={0} sx={{ border: "0.5px solid #e2e8f0", borderRadius: 2, overflow: "hidden", bgcolor: "#fff" }}>
        {!programId ? (
          <Box py={10} textAlign="center" color="#94a3b8">
            <Typography fontSize={14} fontWeight={700}>Select a program to load active registrations.</Typography>
          </Box>
        ) : isFetching ? (
          <Box py={10} textAlign="center"><CircularProgress size={30} sx={{ color: "#2563eb" }} /></Box>
        ) : registrations.length === 0 ? (
          <Box py={9} textAlign="center" color="#94a3b8">
            <Users size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
            <Typography fontSize={14} fontWeight={700}>No active registrations found.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  {["Student", "Course", "Semester", "Session", "Actions"].map((h) => (
                    <TableCell key={h} align={h === "Actions" ? "right" : "left"} sx={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#94a3b8" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {registrations.map((r) => (
                  <TableRow key={r._id} hover>
                    <TableCell>
                      <Typography fontWeight={700} fontSize={13} color="#0f172a">{r.studentId?.personalInfo?.fullName || "Unknown"}</Typography>
                      <Typography fontSize={11} color="#94a3b8">{r.studentId?.studentId}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={13} fontWeight={700} color="#334155">{r.courseId?.title}</Typography>
                      <Typography fontSize={11} color="#059669" fontWeight={700}>{r.courseId?.code}</Typography>
                    </TableCell>
                    <TableCell><Typography fontSize={13} color="#475569">Semester {r.semesterId?.number ?? "?"}</Typography></TableCell>
                    <TableCell><Typography fontSize={13} color="#475569">{r.termId?.name}</Typography></TableCell>
                    <TableCell align="right">
                      <Button
                        size="small" startIcon={<UserMinus size={14} />}
                        onClick={() => openWithdrawModal(r)}
                        sx={{ color: "#e11d48", fontWeight: 700, textTransform: "none", fontSize: 12 }}
                      >
                        Withdraw
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={isModalOpen} onClose={closeModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: "'Aleo', serif" }}>Withdraw Student</DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          {selectedRegistration && (
            <Typography fontSize={13} color="#64748b" mb={2}>
              {selectedRegistration.studentId?.personalInfo?.fullName} — {selectedRegistration.courseId?.title}
            </Typography>
          )}
          <TextField
            select fullWidth size="small" label="Type" value={withdrawalType}
            onChange={(e) => setWithdrawalType(e.target.value)}
            sx={{ mb: 2, "& .MuiOutlinedInput-root": { fontSize: 13 } }}
          >
            <MenuItem value="Drop" sx={{ fontSize: 13 }}>Drop</MenuItem>
            <MenuItem value="Withdrawal" sx={{ fontSize: 13 }}>Withdrawal</MenuItem>
          </TextField>
          <TextField
            fullWidth multiline rows={3} label="Reason"
            value={reason} onChange={(e) => setReason(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
          <Button onClick={closeModal} sx={{ fontWeight: 700, color: "#64748b", textTransform: "none" }}>Cancel</Button>
          <Button
            variant="contained" onClick={handleConfirmWithdraw} disabled={isSubmitting}
            sx={{ bgcolor: "#e11d48", fontWeight: 700, boxShadow: "none", textTransform: "none" }}
          >
            {isSubmitting ? "Processing..." : "Confirm Withdrawal"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseWithdrawalsView;
