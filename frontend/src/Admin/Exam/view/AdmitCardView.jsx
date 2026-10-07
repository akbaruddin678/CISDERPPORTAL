import React from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import {
  ConfirmationNumber,
  ViewModule,
  Groups,
  CheckCircleOutline,
  Print,
  Cancel,
  WarningAmberRounded,
  PlaylistAddCheck,
} from "@mui/icons-material";

const STATUS_STYLES = {
  Active: { bg: "#dcfce7", fg: "#166534" },
  Expired: { bg: "#f1f5f9", fg: "#475569" },
  Revoked: { bg: "#fee2e2", fg: "#991b1b" },
};

const FEE_STATUS_META = {
  paid: { label: "Fee Paid", bg: "#f0fdf4", fg: "#15803d" },
  pending: { label: "Fee Pending", bg: "#fffbeb", fg: "#b45309" },
  overdue: { label: "Fee Overdue", bg: "#fef2f2", fg: "#b91c1c" },
  not_generated: { label: "Fee Not Generated", bg: "#f1f5f9", fg: "#64748b" },
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

const AdmitCardView = ({
  activeTab,
  handleTabChange,
  filters,
  handleFilterChange,
  terms,
  departments,
  availablePrograms,
  availableSemesters,
  availableExamTypes,
  isReady,
  isScoped,

  eligibleStudents,
  isFetchingEligible,
  handleGenerateSingle,
  handleGenerateBulk,
  isGenerating,

  confirmDialog,
  closeConfirmDialog,

  admitCards,
  isFetching,
  downloadPrintList,
  downloadSingleAdmitCard,
  handleRevokeCard,
  isRevoking,
  semestersList,
}) => {
  const notYetGenerated = eligibleStudents.filter((s) => !s.alreadyHasCard).length;
  const feeCounts = eligibleStudents.reduce(
    (acc, s) => {
      acc[s.feeStatus] = (acc[s.feeStatus] || 0) + 1;
      return acc;
    },
    { paid: 0, pending: 0, overdue: 0, not_generated: 0 },
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f8fafc", fontFamily: "'Montserrat', sans-serif" }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight={800} color="#0f172a" fontFamily="'Aleo', serif">
          Admit Cards
        </Typography>
        <Typography variant="body2" color="#64748b" mt={0.25} fontFamily="'Montserrat', sans-serif">
          Generate and print official exam admit cards — a student's current-semester fee is checked before issuing.
        </Typography>
      </Box>

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: "0.5px solid #e2e8f0", borderRadius: 2, bgcolor: "#fff" }}>
        <Typography fontSize={12} fontWeight={800} color="#94a3b8" textTransform="uppercase" letterSpacing="0.05em" mb={2} fontFamily="'Montserrat', sans-serif">
          Batch Configuration
        </Typography>
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", md: "repeat(5, 1fr)" }} gap={2}>
          <TextField
            select fullWidth size="small" label="1. Session"
            value={filters.termId}
            onChange={(e) => handleFilterChange("termId", e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
          >
            {terms.map((t) => (<MenuItem key={t._id} value={t._id} sx={{ fontSize: 13 }}>{t.name}</MenuItem>))}
          </TextField>
          <TextField
            select fullWidth size="small" label="2. Department"
            value={filters.departmentId}
            onChange={(e) => handleFilterChange("departmentId", e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
          >
            {departments.map((d) => (<MenuItem key={d._id} value={d._id} sx={{ fontSize: 13 }}>{d.name}</MenuItem>))}
          </TextField>
          <TextField
            select fullWidth size="small" label="3. Program"
            disabled={!filters.departmentId}
            value={filters.programId}
            onChange={(e) => handleFilterChange("programId", e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
          >
            {availablePrograms.map((p) => (<MenuItem key={p._id} value={p._id} sx={{ fontSize: 13 }}>{p.name}</MenuItem>))}
          </TextField>
          <TextField
            select fullWidth size="small" label="4. Semester"
            disabled={!filters.programId}
            value={filters.semesterId}
            onChange={(e) => handleFilterChange("semesterId", e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
          >
            {availableSemesters.map((s) => (<MenuItem key={s._id} value={s._id} sx={{ fontSize: 13 }}>{s.name || `Semester ${s.number}`}</MenuItem>))}
          </TextField>
          <TextField
            select fullWidth size="small" label="5. Exam Round"
            disabled={!isScoped}
            value={filters.examType}
            onChange={(e) => handleFilterChange("examType", e.target.value)}
            helperText={isScoped && availableExamTypes.length === 0 ? "No published exams in this scope." : ""}
            sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
          >
            {availableExamTypes.map((t) => (<MenuItem key={t} value={t} sx={{ fontSize: 13 }}>{t}</MenuItem>))}
          </TextField>
        </Box>
      </Paper>

      {!isReady ? (
        <Paper elevation={0} sx={{ py: 10, textAlign: "center", border: "1.5px dashed #cbd5e1", borderRadius: 3, bgcolor: "#fff" }}>
          <ConfirmationNumber sx={{ fontSize: 48, color: "#cbd5e1", mb: 1.5 }} />
          <Typography fontSize={15} fontWeight={700} color="#64748b" fontFamily="'Aleo', serif">
            Complete the batch configuration above
          </Typography>
          <Typography fontSize={13} color="#94a3b8" mt={0.5}>
            Session, Department, Program, Semester, and Exam Round are all required.
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 3, border: "0.5px solid #e2e8f0", overflow: "hidden", bgcolor: "#fff" }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "#f8fafc" }}>
            <Tabs value={activeTab} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
              <Tab
                icon={<Groups sx={{ mr: 1, fontSize: 18 }} />}
                iconPosition="start"
                label={`Eligible Students (${eligibleStudents.length})`}
                sx={{ fontWeight: 700, fontFamily: "'Montserrat', sans-serif", textTransform: "none" }}
              />
              <Tab
                icon={<ViewModule sx={{ mr: 1, fontSize: 18 }} />}
                iconPosition="start"
                label={`Issued Cards (${admitCards.length})`}
                sx={{ fontWeight: 700, fontFamily: "'Montserrat', sans-serif", textTransform: "none" }}
              />
            </Tabs>
          </Box>

          {/* TAB 0: ELIGIBLE STUDENTS — single + bulk generation */}
          {activeTab === 0 && (
            <Box p={3}>
              <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                <StatCard icon={Groups} label="Eligible Students" value={eligibleStudents.length} color="#1d4ed8" bg="#eff6ff" />
                <StatCard icon={CheckCircleOutline} label="Fee Paid" value={feeCounts.paid} color="#15803d" bg="#f0fdf4" />
                <StatCard icon={WarningAmberRounded} label="Fee Pending/Overdue" value={feeCounts.pending + feeCounts.overdue} color="#b45309" bg="#fffbeb" />
                <StatCard icon={Cancel} label="Fee Not Generated" value={feeCounts.not_generated} color="#64748b" bg="#f1f5f9" />
              </Box>

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1.5}>
                <Typography fontSize={13} color="#64748b" fontFamily="'Montserrat', sans-serif">
                  {notYetGenerated} of {eligibleStudents.length} student(s) still need a card.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PlaylistAddCheck sx={{ fontSize: 18 }} />}
                  onClick={handleGenerateBulk}
                  disabled={isGenerating || notYetGenerated === 0}
                  sx={{ bgcolor: "#2563eb", fontWeight: 700, textTransform: "none", boxShadow: "none", fontFamily: "'Montserrat', sans-serif", fontSize: 13 }}
                >
                  {isGenerating ? "Generating..." : `Generate All (${notYetGenerated})`}
                </Button>
              </Box>

              {isFetchingEligible ? (
                <Box py={10} textAlign="center"><CircularProgress sx={{ color: "#2563eb" }} /></Box>
              ) : eligibleStudents.length === 0 ? (
                <Box py={10} textAlign="center" color="#94a3b8">
                  <Groups sx={{ fontSize: 44, opacity: 0.25, mb: 1.5 }} />
                  <Typography fontSize={14} fontWeight={700} color="#64748b">
                    No students are registered for a published {filters.examType || "exam"} in this scope yet.
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ border: "0.5px solid #e2e8f0", borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8fafc" }}>
                        <TableCell sx={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Student</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Fee Status</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Exams</TableCell>
                        <TableCell align="right" sx={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {eligibleStudents.map((s) => {
                        const feeMeta = FEE_STATUS_META[s.feeStatus] || FEE_STATUS_META.not_generated;
                        return (
                          <TableRow key={s.studentId} hover>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1.5}>
                                <Avatar sx={{ width: 30, height: 30, bgcolor: "#eff6ff", color: "#1d4ed8", fontSize: 13, fontWeight: 700 }}>
                                  {s.name?.charAt(0) || "S"}
                                </Avatar>
                                <Box>
                                  <Typography fontSize={13} fontWeight={700} color="#1e293b">{s.name}</Typography>
                                  <Typography fontSize={11} color="#94a3b8">ID: {s.regNo}</Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip size="small" label={feeMeta.label} sx={{ bgcolor: feeMeta.bg, color: feeMeta.fg, fontWeight: 700, fontSize: 11 }} />
                            </TableCell>
                            <TableCell>
                              <Chip size="small" variant="outlined" label={`${s.examCount} exam${s.examCount === 1 ? "" : "s"}`} sx={{ fontSize: 11, fontWeight: 700 }} />
                            </TableCell>
                            <TableCell align="right">
                              {s.alreadyHasCard ? (
                                <Chip size="small" icon={<CheckCircleOutline sx={{ fontSize: 14 }} />} label="Generated" sx={{ bgcolor: "#f0fdf4", color: "#15803d", fontWeight: 700, fontSize: 11 }} />
                              ) : (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  disabled={isGenerating}
                                  onClick={() => handleGenerateSingle(s.studentId)}
                                  sx={{ fontWeight: 700, textTransform: "none", fontSize: 12, borderColor: "#2563eb", color: "#2563eb" }}
                                >
                                  Generate
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* TAB 1: ISSUED CARDS — view / print / revoke */}
          {activeTab === 1 && (
            <Box p={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography fontSize={15} fontWeight={800} color="#0f172a" fontFamily="'Aleo', serif">
                  Issued Admit Cards
                </Typography>
                {admitCards.length > 0 && (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Print sx={{ fontSize: 16 }} />}
                    onClick={downloadPrintList}
                    sx={{ fontWeight: 700, textTransform: "none", boxShadow: "none", fontFamily: "'Montserrat', sans-serif", fontSize: 13 }}
                  >
                    Print Batch (PDF)
                  </Button>
                )}
              </Box>

              {isFetching ? (
                <Box py={10} textAlign="center"><CircularProgress sx={{ color: "#2563eb" }} /></Box>
              ) : admitCards.length === 0 ? (
                <Box py={10} textAlign="center" color="#94a3b8">
                  <CheckCircleOutline sx={{ fontSize: 44, opacity: 0.25, mb: 1.5 }} />
                  <Typography fontSize={14} fontWeight={700} color="#64748b">No admit cards generated for this scope yet.</Typography>
                </Box>
              ) : (
                <TableContainer sx={{ border: "0.5px solid #e2e8f0", borderRadius: 2 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Student</TableCell>
                        <TableCell sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Program &amp; Sem</TableCell>
                        <TableCell sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Round</TableCell>
                        <TableCell sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Exams</TableCell>
                        <TableCell sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Status</TableCell>
                        <TableCell align="center" sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {admitCards.map((card) => (
                        <TableRow key={card._id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Avatar sx={{ width: 30, height: 30, bgcolor: "#eff6ff", color: "#1d4ed8", fontSize: 13, fontWeight: 700 }}>
                                {card.studentId?.personalInfo?.fullName?.charAt(0) || "S"}
                              </Avatar>
                              <Box>
                                <Typography fontSize={13} fontWeight={700}>{card.studentId?.personalInfo?.fullName || "N/A"}</Typography>
                                <Typography fontSize={11} color="#94a3b8">ID: {card.studentId?.studentId || "N/A"}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography fontSize={13}>{availablePrograms.find((p) => String(p._id) === String(card.programId))?.name || "Program"}</Typography>
                            <Typography fontSize={11} color="#2563eb" fontWeight={700}>
                              Semester {semestersList.find((s) => String(s._id) === String(card.semesterId))?.number || "?"}
                            </Typography>
                          </TableCell>
                          <TableCell><Chip label={card.examType || "N/A"} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: 11 }} /></TableCell>
                          <TableCell><Chip label={`${card.exams?.length || 0} Subjects`} size="small" variant="outlined" sx={{ fontSize: 11 }} /></TableCell>
                          <TableCell>
                            <Box display="flex" gap={0.75} flexWrap="wrap">
                              <Chip
                                label={card.effectiveStatus || "Active"}
                                size="small"
                                sx={{
                                  bgcolor: STATUS_STYLES[card.effectiveStatus]?.bg || STATUS_STYLES.Active.bg,
                                  color: STATUS_STYLES[card.effectiveStatus]?.fg || STATUS_STYLES.Active.fg,
                                  fontWeight: 700, fontSize: 11,
                                }}
                              />
                              {card.feeWarning && (
                                <Tooltip title="Issued on exception — this student's fee was unpaid at the time this card was generated">
                                  <Chip
                                    icon={<WarningAmberRounded sx={{ fontSize: 14 }} />}
                                    label="Fee Not Paid"
                                    size="small"
                                    sx={{ bgcolor: "#fffbeb", color: "#b45309", fontWeight: 700, fontSize: 11 }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" gap={1} justifyContent="center">
                              <Tooltip title="Print this card">
                                <IconButton color="primary" size="small" onClick={() => downloadSingleAdmitCard(card)}>
                                  <Print fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={card.effectiveStatus === "Revoked" ? "Already revoked" : "Revoke card"}>
                                <span>
                                  <IconButton
                                    color="error" size="small"
                                    disabled={isRevoking || card.effectiveStatus === "Revoked"}
                                    onClick={() => {
                                      if (window.confirm(`Revoke the admit card for ${card.studentId?.personalInfo?.fullName || "this student"}? This cannot be undone.`)) {
                                        handleRevokeCard(card);
                                      }
                                    }}
                                  >
                                    <Cancel fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </Paper>
      )}

      {/* Fee-not-paid / fee-not-generated confirmation dialog — single or bulk */}
      <Dialog open={!!confirmDialog} onClose={closeConfirmDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {confirmDialog && (() => {
          const allSkipped = [
            ...(confirmDialog.skippedNoFee || []).map((s) => ({ ...s, feeStatus: "not_generated" })),
            ...(confirmDialog.skippedUnpaid || []),
          ];
          return (
          <>
            <DialogTitle sx={{ fontWeight: 800, fontFamily: "'Aleo', serif", display: "flex", alignItems: "center", gap: 1 }}>
              <WarningAmberRounded sx={{ color: "#b45309" }} />
              Fee Not Cleared — Are You Sure?
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ py: 2.5 }}>
              <Typography fontSize={13} color="#334155" mb={1.5}>
                The fee for the current semester has <strong>not been paid</strong> (or not yet generated) for{" "}
                {allSkipped.length === 1 ? "this student" : `these ${allSkipped.length} students`}. Generate the admit card anyway? A warning will be printed on the card.
              </Typography>
              <Box sx={{ maxHeight: 220, overflowY: "auto", border: "0.5px solid #e2e8f0", borderRadius: 2 }}>
                {allSkipped.map((s) => {
                  const meta = FEE_STATUS_META[s.feeStatus] || FEE_STATUS_META.pending;
                  return (
                    <Box key={s.studentId} display="flex" justifyContent="space-between" alignItems="center" px={1.5} py={1} sx={{ borderBottom: "0.5px solid #f1f5f9", "&:last-child": { borderBottom: "none" } }}>
                      <Box>
                        <Typography fontSize={13} fontWeight={700}>{s.name}</Typography>
                        <Typography fontSize={11} color="#94a3b8">{s.regNo}</Typography>
                      </Box>
                      <Chip size="small" label={meta.label} sx={{ bgcolor: meta.bg, color: meta.fg, fontWeight: 700, fontSize: 11 }} />
                    </Box>
                  );
                })}
              </Box>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
              <Button onClick={closeConfirmDialog} sx={{ fontWeight: 700, color: "#64748b", textTransform: "none" }}>
                Cancel
              </Button>
              <Button
                variant="contained" color="warning"
                onClick={confirmDialog.onConfirm}
                sx={{ fontWeight: 700, textTransform: "none", boxShadow: "none" }}
              >
                Generate Anyway
              </Button>
            </DialogActions>
          </>
          );
        })()}
      </Dialog>
    </Box>
  );
};

export default AdmitCardView;
