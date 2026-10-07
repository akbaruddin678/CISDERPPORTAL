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
  CircularProgress,
} from "@mui/material";
import {
  Users,
  Search,
  BookX,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const MARKS_STATUS_META = {
  "Not Started": { bg: "#f1f5f9", text: "#64748b" },
  "Needs Attention": { bg: "#fff1f2", text: "#e11d48" },
  "Pending Review": { bg: "#fef3c7", text: "#92400e" },
  "In Progress": { bg: "#e0e7ff", text: "#3730a3" },
  Approved: { bg: "#d1fae5", text: "#065f46" },
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

const MonitorFacultyView = ({
  filters,
  handleFilterChange,
  terms,
  programs,
  isFetchingPrograms,
  semesters,
  isFetchingSemesters,
  isReady,

  rows = [],
  totalRows = 0,
  isFetching = false,
  statistics = { total: 0, noExamsPublished: 0, needsAttention: 0, approved: 0 },

  searchTerm,
  setSearchTerm,
}) => {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f8fafc", fontFamily: "'Montserrat', sans-serif" }}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={800} color="#0f172a" fontFamily="'Aleo', serif">
          Monitor Faculty &amp; Courses
        </Typography>
        <Typography variant="body2" color="#64748b" mt={0.25}>
          Track exam publishing and marks-submission progress per faculty section in your class.
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: "0.5px solid #e2e8f0", borderRadius: 2, bgcolor: "#fff" }}>
        <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={2} flexWrap="wrap">
          <TextField select size="small" label="Session" value={filters.termId} onChange={(e) => handleFilterChange("termId", e.target.value)} sx={{ minWidth: 160, "& .MuiOutlinedInput-root": { fontSize: 13 } }}>
            <MenuItem value="" sx={{ fontSize: 13 }}>All Sessions</MenuItem>
            {terms.map((t) => (<MenuItem key={t._id} value={t._id} sx={{ fontSize: 13 }}>{t.name}</MenuItem>))}
          </TextField>
          <TextField select size="small" label="Program" disabled={isFetchingPrograms} value={filters.programId} onChange={(e) => handleFilterChange("programId", e.target.value)} sx={{ minWidth: 200, "& .MuiOutlinedInput-root": { fontSize: 13 } }}>
            {programs.map((p) => (<MenuItem key={p._id} value={p._id} sx={{ fontSize: 13 }}>{p.name}</MenuItem>))}
          </TextField>
          <TextField select size="small" label="Section" disabled={!filters.programId || isFetchingSemesters} value={filters.semesterId} onChange={(e) => handleFilterChange("semesterId", e.target.value)} sx={{ minWidth: 160, "& .MuiOutlinedInput-root": { fontSize: 13 } }}>
            <MenuItem value="" sx={{ fontSize: 13 }}>All Sections</MenuItem>
            {semesters.map((s) => (<MenuItem key={s._id} value={s._id} sx={{ fontSize: 13 }}>{s.name || `Semester ${s.number}`}</MenuItem>))}
          </TextField>
          <TextField
            size="small" placeholder="Search course or instructor..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><Search size={16} /></InputAdornment>) }}
            sx={{ flex: 1, minWidth: 200, "& .MuiOutlinedInput-root": { fontSize: 13 } }}
          />
        </Box>
      </Paper>

      {isReady && rows.length > 0 && (
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <StatCard icon={Users} label="Total Sections" value={statistics.total} color="#1d4ed8" bg="#eff6ff" />
          <StatCard icon={BookX} label="No Exams Published" value={statistics.noExamsPublished} color="#b45309" bg="#fffbeb" />
          <StatCard icon={AlertTriangle} label="Needs Attention" value={statistics.needsAttention} color="#e11d48" bg="#fff1f2" />
          <StatCard icon={CheckCircle2} label="Marks Approved" value={statistics.approved} color="#059669" bg="#ecfdf5" />
        </Box>
      )}

      <Paper elevation={0} sx={{ border: "0.5px solid #e2e8f0", borderRadius: 2, overflow: "hidden", bgcolor: "#fff" }}>
        {!isReady ? (
          <Box py={10} textAlign="center" color="#94a3b8">
            <Search size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
            <Typography fontSize={14} fontWeight={700}>Select a Program to load faculty sections.</Typography>
          </Box>
        ) : isFetching ? (
          <Box py={10} textAlign="center"><CircularProgress size={30} sx={{ color: "#2563eb" }} /></Box>
        ) : rows.length === 0 ? (
          <Box py={9} textAlign="center" color="#94a3b8">
            <Users size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
            <Typography fontSize={14} fontWeight={700}>
              {totalRows === 0 ? "No course sections offered for this selection." : "No sections match the current search."}
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  {["Course", "Section", "Instructor", "Semester", "Exams Published", "Marks Status"].map((h) => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#64748b", py: 1.75 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => {
                  const meta = MARKS_STATUS_META[r.marksSubmissionStatus] || MARKS_STATUS_META["Not Started"];
                  return (
                    <TableRow key={r.assignmentId} hover>
                      <TableCell>
                        <Typography fontWeight={800} fontSize={13} color="#0f172a">{r.courseTitle}</Typography>
                        <Typography fontSize={11} fontWeight={700} color="#059669">{r.courseCode}</Typography>
                      </TableCell>
                      <TableCell><Typography fontSize={13} color="#334155">{r.section}</Typography></TableCell>
                      <TableCell><Typography fontSize={13} fontWeight={700} color="#334155">{r.instructorName}</Typography></TableCell>
                      <TableCell><Typography fontSize={13} color="#475569">Semester {r.semesterNumber ?? "?"}</Typography></TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={r.publishedExamCount}
                          sx={{
                            fontWeight: 800, fontSize: 11,
                            bgcolor: r.publishedExamCount === 0 ? "#fef2f2" : "#f0fdf4",
                            color: r.publishedExamCount === 0 ? "#b91c1c" : "#15803d",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={r.marksSubmissionStatus} sx={{ bgcolor: meta.bg, color: meta.text, fontWeight: 800, fontSize: 11 }} />
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

export default MonitorFacultyView;
