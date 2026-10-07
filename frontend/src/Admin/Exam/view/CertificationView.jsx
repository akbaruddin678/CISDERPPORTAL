import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
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
} from "@mui/material";
import {
  Search,
  AssignmentTurnedIn,
  Print,
  WorkspacePremium,
  Groups,
  CheckCircleOutline,
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

const CertificationView = ({
  filters,
  handleFilterChange,
  terms,
  departments,
  availablePrograms,
  availableSemesters,
  results,
  isFetching,
  isReadyToFetch,
  printTranscript,
  printDegree,
}) => {
  const stats = useMemo(() => {
    const total = results.length;
    const eligibleForDegree = results.filter(
      (r) => r.status === "Pass" && r.courses.every((c) => c.isFullyDeclared),
    ).length;
    const provisional = results.filter((r) =>
      r.courses.some((c) => !c.isFullyDeclared),
    ).length;
    return { total, eligibleForDegree, provisional };
  }, [results]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f8fafc", fontFamily: "'Montserrat', sans-serif" }}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={800} color="#0f172a" fontFamily="'Aleo', serif">
          Transcript &amp; Degree
        </Typography>
        <Typography variant="body2" color="#64748b" mt={0.25} fontFamily="'Montserrat', sans-serif">
          Generate and print official academic transcripts and provisional degree certificates.
        </Typography>
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
            {availableSemesters.map((s) => (<MenuItem key={s._id} value={s._id} sx={{ fontSize: 13 }}>{s.name || `Semester ${s.number}`}</MenuItem>))}
          </TextField>
        </Box>
      </Paper>

      {isReadyToFetch && results.length > 0 && (
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <StatCard icon={Groups} label="Total Candidates" value={stats.total} color="#1d4ed8" bg="#eff6ff" />
          <StatCard icon={WorkspacePremium} label="Eligible for Degree" value={stats.eligibleForDegree} color="#b45309" bg="#fffbeb" />
          <StatCard icon={HourglassEmpty} label="Provisional (Pending Approval)" value={stats.provisional} color="#64748b" bg="#f1f5f9" />
        </Box>
      )}

      <Paper elevation={0} sx={{ borderRadius: 2.5, border: "0.5px solid #e2e8f0", overflow: "hidden", bgcolor: "#fff" }}>
        {!isReadyToFetch ? (
          <Box p={10} textAlign="center">
            <Search sx={{ fontSize: 48, opacity: 0.15, mb: 1.5 }} />
            <Typography fontSize={15} fontWeight={700} color="#64748b" fontFamily="'Aleo', serif">Awaiting Selection</Typography>
            <Typography fontSize={13} color="#94a3b8" mt={0.5}>Select a Session and Class to load eligible candidates.</Typography>
          </Box>
        ) : isFetching ? (
          <Box p={10} textAlign="center">
            <CircularProgress sx={{ color: "#2563eb" }} />
            <Typography fontSize={13} color="#94a3b8" mt={1.5}>Fetching academic records...</Typography>
          </Box>
        ) : results.length === 0 ? (
          <Box p={10} textAlign="center">
            <AssignmentTurnedIn sx={{ fontSize: 48, opacity: 0.2, mb: 1.5 }} />
            <Typography fontSize={15} fontWeight={700} color="#64748b" fontFamily="'Aleo', serif">No Results Found</Typography>
            <Typography fontSize={13} color="#94a3b8" mt={0.5}>No graded students found for this batch.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Student</TableCell>
                  <TableCell sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Credits Cleared</TableCell>
                  <TableCell sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>CGPA</TableCell>
                  <TableCell sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Academic Status</TableCell>
                  <TableCell align="center" sx={{ bgcolor: "#f8fafc", fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Print Documents</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((row) => {
                  const isDeclared = row.courses.every((c) => c.isFullyDeclared);
                  const canIssueDegree = row.status === "Pass" && isDeclared;
                  return (
                    <TableRow key={row.studentId} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 700, bgcolor: "#eff6ff", color: "#1d4ed8" }}>
                            {row.name?.charAt(0) || "U"}
                          </Avatar>
                          <Box>
                            <Typography fontSize={13} fontWeight={700} color="#1e293b">{row.name || "Unknown Student"}</Typography>
                            <Typography fontSize={11} color="#94a3b8">{row.rollNo || "N/A"}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={13} color="#334155">{row.totalCredits} Cr. Hrs</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontSize={13} fontWeight={800} color="#1d4ed8" fontFamily="'Aleo', serif">{row.sgpa}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={0.75}>
                          <Chip
                            size="small"
                            label={row.status}
                            sx={{
                              fontWeight: 700, fontSize: 11,
                              bgcolor: row.status === "Pass" ? "#f0fdf4" : "#fef2f2",
                              color: row.status === "Pass" ? "#15803d" : "#b91c1c",
                            }}
                          />
                          {!isDeclared && (
                            <Chip size="small" label="Provisional" sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700, bgcolor: "#fef3c7", color: "#92400e" }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={isDeclared ? "Print Official Transcript" : "Not yet officially declared"}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={!isDeclared}
                              onClick={() => printTranscript(row)}
                              sx={{ mr: 1, bgcolor: isDeclared ? "#eff6ff" : "transparent", color: "#2563eb" }}
                            >
                              <Print fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={canIssueDegree ? "Issue Provisional Degree" : "Student must fully clear and be officially declared to receive degree"}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={!canIssueDegree}
                              onClick={() => printDegree(row)}
                              sx={{ bgcolor: canIssueDegree ? "#fffbeb" : "transparent", color: "#b45309" }}
                            >
                              <WorkspacePremium fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
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
  );
};

export default CertificationView;
