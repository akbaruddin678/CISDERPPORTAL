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
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  CalendarDays,
  Printer,
  BookOpen,
  Layers,
  Clock3,
} from "lucide-react";

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "TBD";

const StatCard = (props) => {
  const Icon = props.icon;
  return (
    <Paper elevation={0} sx={{ flex: 1, minWidth: 150, border: "0.5px solid #e2e8f0", borderRadius: 2.5, p: 2, display: "flex", alignItems: "center", gap: 1.5, bgcolor: "#fff" }}>
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

const TYPE_META = {
  "Mid Term": { bg: "#eff6ff", color: "#1d4ed8" },
  "Final Exam": { bg: "#fef2f2", color: "#b91c1c" },
  Sessional: { bg: "#f0fdf4", color: "#15803d" },
  Quiz: { bg: "#fef3c7", color: "#92400e" },
  Assignment: { bg: "#f5f3ff", color: "#6d28d9" },
  Practical: { bg: "#ecfeff", color: "#0e7490" },
};

const ExamCoordinationView = ({
  terms,
  termId,
  setTermId,
  isFetching,
  stats,
  groupedByProgram,
  totalExams,
  handlePrint,
}) => {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f8fafc", fontFamily: "'Montserrat', sans-serif" }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#0f172a" fontFamily="'Aleo', serif">
            Exam Coordination
          </Typography>
          <Typography variant="body2" color="#64748b" mt={0.25}>
            Published exam schedule for your class — read-only visibility into what Exam-Cell has scheduled.
          </Typography>
        </Box>
        {totalExams > 0 && (
          <Button variant="outlined" startIcon={<Printer size={16} />} onClick={handlePrint} sx={{ textTransform: "none", fontWeight: 700, fontSize: 13 }}>
            Print Schedule
          </Button>
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

      {totalExams > 0 && (
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <StatCard icon={CalendarDays} label="Total Published Exams" value={stats.total} color="#1d4ed8" bg="#eff6ff" />
          <StatCard icon={Clock3} label="Next 7 Days" value={stats.thisWeek} color="#b45309" bg="#fffbeb" />
          <StatCard icon={Layers} label="Programs Covered" value={stats.programs} color="#7c3aed" bg="#f5f3ff" />
        </Box>
      )}

      {isFetching ? (
        <Box py={10} textAlign="center"><CircularProgress size={30} sx={{ color: "#2563eb" }} /></Box>
      ) : groupedByProgram.length === 0 ? (
        <Paper elevation={0} sx={{ border: "0.5px solid #e2e8f0", borderRadius: 2, bgcolor: "#fff" }}>
          <Box py={10} textAlign="center" color="#94a3b8">
            <BookOpen size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
            <Typography fontSize={14} fontWeight={700}>No published exams for this session yet.</Typography>
          </Box>
        </Paper>
      ) : (
        <Box display="flex" flexDirection="column" gap={2.5}>
          {groupedByProgram.map((group) => (
            <Paper key={group.programName} elevation={0} sx={{ border: "0.5px solid #e2e8f0", borderRadius: 2, overflow: "hidden", bgcolor: "#fff" }}>
              <Box sx={{ px: 2.5, py: 1.5, bgcolor: "#f8fafc", borderBottom: "0.5px solid #e2e8f0" }}>
                <Typography fontWeight={800} fontSize={14} color="#0f172a" fontFamily="'Aleo', serif">{group.programName}</Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {["Course", "Semester", "Type", "Date", "Time"].map((h) => (
                        <TableCell key={h} sx={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#94a3b8" }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.exams.map((e) => {
                      const meta = TYPE_META[e.type] || { bg: "#f1f5f9", color: "#64748b" };
                      return (
                        <TableRow key={e._id} hover>
                          <TableCell>
                            <Typography fontWeight={700} fontSize={13} color="#0f172a">{e.courseId?.title}</Typography>
                            <Typography fontSize={11} color="#059669" fontWeight={700}>{e.courseId?.code}</Typography>
                          </TableCell>
                          <TableCell><Typography fontSize={13} color="#475569">Semester {e.semesterId?.number ?? "?"}</Typography></TableCell>
                          <TableCell><Chip size="small" label={e.type} sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 800, fontSize: 11 }} /></TableCell>
                          <TableCell><Typography fontSize={13} color="#334155">{formatDate(e.date)}</Typography></TableCell>
                          <TableCell><Typography fontSize={13} color="#334155">{e.startTime || "TBD"}</Typography></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ExamCoordinationView;
