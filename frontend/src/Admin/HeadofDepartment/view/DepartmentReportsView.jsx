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
  CircularProgress,
} from "@mui/material";
import {
  Users,
  TrendingUp,
  Award,
  Download,
  FileSpreadsheet,
  BarChart4,
} from "lucide-react";

const StatCard = (props) => {
  const Icon = props.icon;
  return (
    <Paper elevation={0} sx={{ flex: 1, minWidth: 160, border: "0.5px solid #e2e8f0", borderRadius: 2.5, p: 2.5, display: "flex", alignItems: "center", gap: 1.5, bgcolor: "#fff" }}>
      <Box sx={{ bgcolor: props.bg, borderRadius: 2, p: 1.25, display: "flex" }}>
        <Icon size={20} color={props.color} />
      </Box>
      <Box>
        <Typography fontSize={24} fontWeight={800} color="#0f172a" lineHeight={1} fontFamily="'Aleo', serif">{props.value}</Typography>
        <Typography fontSize={12} color="#94a3b8" fontWeight={600} mt={0.25}>{props.label}</Typography>
      </Box>
    </Paper>
  );
};

const DepartmentReportsView = ({
  terms,
  termId,
  setTermId,
  overview,
  breakdown,
  isFetching,
  exportPdf,
  exportExcel,
}) => {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f8fafc", fontFamily: "'Montserrat', sans-serif" }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#0f172a" fontFamily="'Aleo', serif">
            Department Reports
          </Typography>
          <Typography variant="body2" color="#64748b" mt={0.25}>
            Analytics on student performance, pass rates, and GPA across your department.
          </Typography>
        </Box>
        {overview && (
          <Box display="flex" gap={1}>
            <Button variant="outlined" startIcon={<Download size={16} />} onClick={exportPdf} sx={{ textTransform: "none", fontWeight: 700, fontSize: 13 }}>
              PDF
            </Button>
            <Button variant="outlined" startIcon={<FileSpreadsheet size={16} />} onClick={exportExcel} sx={{ textTransform: "none", fontWeight: 700, fontSize: 13 }}>
              Excel
            </Button>
          </Box>
        )}
      </Box>

      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: "0.5px solid #e2e8f0", borderRadius: 2, bgcolor: "#fff" }}>
        <TextField
          select size="small" label="Session" value={termId}
          onChange={(e) => setTermId(e.target.value)}
          sx={{ minWidth: 220, "& .MuiOutlinedInput-root": { fontSize: 13 } }}
        >
          {terms.map((t) => (<MenuItem key={t._id} value={t._id} sx={{ fontSize: 13 }}>{t.name}</MenuItem>))}
        </TextField>
      </Paper>

      {isFetching ? (
        <Box py={10} textAlign="center"><CircularProgress size={30} sx={{ color: "#2563eb" }} /></Box>
      ) : !overview ? (
        <Box py={10} textAlign="center" color="#94a3b8">
          <BarChart4 size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
          <Typography fontSize={14} fontWeight={700}>Select a session to load department results.</Typography>
        </Box>
      ) : (
        <>
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            <StatCard icon={Users} label="Total Students" value={overview.totalStudents} color="#1d4ed8" bg="#eff6ff" />
            <StatCard icon={TrendingUp} label="Pass Rate" value={`${overview.passRate}%`} color="#059669" bg="#ecfdf5" />
            <StatCard icon={Award} label="Avg SGPA" value={overview.avgSgpa} color="#7c3aed" bg="#f5f3ff" />
            <StatCard icon={BarChart4} label="Officially Declared" value={overview.declaredCount} color="#b45309" bg="#fffbeb" />
          </Box>

          <Paper elevation={0} sx={{ border: "0.5px solid #e2e8f0", borderRadius: 2, overflow: "hidden", bgcolor: "#fff" }}>
            {breakdown.length === 0 ? (
              <Box py={9} textAlign="center" color="#94a3b8">
                <Typography fontSize={14} fontWeight={700}>No results available for this session yet.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f8fafc" }}>
                      {["Program", "Total Students", "Pass Rate", "Avg SGPA"].map((h) => (
                        <TableCell key={h} sx={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748b", py: 1.75 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {breakdown.map((b) => (
                      <TableRow key={b.programName} hover>
                        <TableCell><Typography fontWeight={800} fontSize={13} color="#0f172a">{b.programName}</Typography></TableCell>
                        <TableCell><Typography fontSize={13} color="#334155">{b.totalStudents}</Typography></TableCell>
                        <TableCell><Typography fontSize={13} fontWeight={700} color="#059669">{b.passRate}%</Typography></TableCell>
                        <TableCell><Typography fontSize={13} fontWeight={800} color="#7c3aed" fontFamily="'Aleo', serif">{b.avgSgpa}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default DepartmentReportsView;
