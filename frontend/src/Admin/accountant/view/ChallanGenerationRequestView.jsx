import React from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Typography,
  Switch,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Save, FilterList, Refresh } from "@mui/icons-material";

const ChallanGenerationRequestView = ({
  students,
  loading,
  savingId,
  filters,
  terms,
  departments,
  programs,
  semesters,
  handleFilterChange,
  handleToggleExemption,
  handleRemarkChange,
  handleSaveRemark,
  feedback,
  closeFeedback,
  refresh,
}) => {
  return (
    <Box p={3}>
      {/* HEADER & FILTERS */}
      <Box mb={4}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography
            variant="h5"
            fontWeight="bold"
            display="flex"
            alignItems="center"
            gap={1}
          >
            <FilterList /> Defaulter Management
          </Typography>
          <Button onClick={refresh} variant="outlined" startIcon={<Refresh />}>
            Refresh List
          </Button>
        </Box>

        <Paper
          sx={{
            p: 3,
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* 1. SESSION */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Session</InputLabel>
            <Select
              value={filters.termId}
              label="Session"
              onChange={(e) => handleFilterChange("termId", e.target.value)}
            >
              {terms.map((t) => (
                <MenuItem key={t._id} value={t._id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 2. DEPARTMENT */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Class</InputLabel>
            <Select
              value={filters.departmentId}
              label="Class"
              onChange={(e) =>
                handleFilterChange("departmentId", e.target.value)
              }
            >
              {departments.map((d) => (
                <MenuItem key={d._id} value={d._id}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 3. PROGRAM (Filtered by Dept) */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Program</InputLabel>
            <Select
              value={filters.programId}
              label="Program"
              onChange={(e) => handleFilterChange("programId", e.target.value)}
              disabled={!filters.departmentId}
            >
              {programs.length === 0 ? (
                <MenuItem disabled value="">
                  {filters.departmentId
                    ? "No Programs Found"
                    : "Select Department First"}
                </MenuItem>
              ) : (
                programs.map((p) => (
                  <MenuItem key={p._id} value={p._id}>
                    {p.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {/* 4. SEMESTER (Filtered by Program & Sorted) */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Section</InputLabel>
            <Select
              value={filters.semesterId}
              label="Section"
              onChange={(e) => handleFilterChange("semesterId", e.target.value)}
              disabled={!filters.programId}
            >
              {semesters.length === 0 ? (
                <MenuItem disabled value="">
                  {filters.programId
                    ? "No Semesters Found"
                    : "Select Program First"}
                </MenuItem>
              ) : (
                semesters.map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.name || `Semester ${s.number}`}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Paper>

        {!filters.semesterId && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block", ml: 1 }}
          >
            * Please select all filters to load the defaulter list.
          </Typography>
        )}
      </Box>

      {/* TABLE */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead sx={{ bgcolor: "#f8f9fa" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Reg No</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Student Name</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>
                Outstanding Dues
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Challan Status</TableCell>
              <TableCell sx={{ fontWeight: "bold" }} align="center">
                Allow Promotion
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>
                Accountant Remark
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                  <Typography mt={1}>Fetching defaulters...</Typography>
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Typography color="textSecondary">
                    {filters.semesterId
                      ? "No defaulters found for this selection."
                      : "No data."}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              students.map((student, index) => (
                <TableRow key={student.studentId} hover>
                  <TableCell>{student.regNo}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{student.name}</TableCell>
                  <TableCell sx={{ color: "error.main", fontWeight: "bold" }}>
                    Rs. {student.amount?.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={student.status}
                      color="error"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {savingId === student.studentId ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Switch
                          checked={student.isAllowed || false}
                          onChange={() => handleToggleExemption(index)}
                          color="success"
                        />
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          minWidth: 50,
                          color: student.isAllowed
                            ? "success.main"
                            : "text.disabled",
                        }}
                      >
                        {student.isAllowed ? "Allowed" : "Blocked"}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ minWidth: 250 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder={
                        student.isAllowed ? "Add remarks..." : "Blocked"
                      }
                      value={student.remark || ""}
                      onChange={(e) =>
                        handleRemarkChange(index, e.target.value)
                      }
                      onBlur={() => handleSaveRemark(index)}
                      disabled={!student.isAllowed}
                      InputProps={{
                        endAdornment: student.isAllowed && (
                          <Save
                            fontSize="small"
                            color="action"
                            sx={{
                              cursor: "pointer",
                              opacity: 0.7,
                              "&:hover": { opacity: 1 },
                            }}
                            onClick={() => handleSaveRemark(index)}
                          />
                        ),
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={closeFeedback}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={feedback.severity} variant="filled" elevation={6}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChallanGenerationRequestView;
