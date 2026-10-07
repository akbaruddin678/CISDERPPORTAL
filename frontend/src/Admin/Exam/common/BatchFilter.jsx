import React from "react";
import { Paper, Box, TextField, MenuItem, Typography } from "@mui/material";

const inputStyles = {
  "& .MuiOutlinedInput-root": { fontSize: 13, borderRadius: 1.5 },
};

const BatchFilter = ({
  filters,
  terms = [],
  departments = [],
  programs = [],
  semesters = [],
  onFilterChange,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: "0.5px solid #e2e8f0",
        bgcolor: "#fff",
        height: "100%",
      }}
    >
      <Typography
        fontSize={12}
        fontWeight={800}
        color="#94a3b8"
        textTransform="uppercase"
        letterSpacing="0.05em"
        mb={2}
        fontFamily="'Montserrat', sans-serif"
      >
        Batch Selection
      </Typography>

      <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" }} gap={2}>
        <TextField
          select
          fullWidth
          size="small"
          label="Academic Term"
          value={filters.termId || ""}
          onChange={(e) => onFilterChange("termId", e.target.value)}
          sx={inputStyles}
        >
          {terms.map((t) => (
            <MenuItem key={t._id} value={t._id} sx={{ fontSize: 13 }}>
              {t.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          fullWidth
          size="small"
          label="Department"
          disabled={!filters.termId}
          value={filters.departmentId || ""}
          onChange={(e) => onFilterChange("departmentId", e.target.value)}
          sx={inputStyles}
        >
          <MenuItem value="" sx={{ fontSize: 13 }}>
            <em>All Departments</em>
          </MenuItem>
          {departments.map((d) => (
            <MenuItem key={d._id} value={d._id} sx={{ fontSize: 13 }}>
              {d.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          fullWidth
          size="small"
          label="Program"
          disabled={!filters.departmentId}
          value={filters.programId || ""}
          onChange={(e) => onFilterChange("programId", e.target.value)}
          sx={inputStyles}
        >
          <MenuItem value="" disabled sx={{ fontSize: 13 }}>
            <em>Select Program</em>
          </MenuItem>
          {programs.map((p) => (
            <MenuItem key={p._id} value={p._id} sx={{ fontSize: 13 }}>
              {p.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          fullWidth
          size="small"
          label="Semester"
          disabled={!filters.programId}
          value={filters.semesterId || ""}
          onChange={(e) => onFilterChange("semesterId", e.target.value)}
          sx={inputStyles}
        >
          <MenuItem value="" disabled sx={{ fontSize: 13 }}>
            <em>Select Semester</em>
          </MenuItem>
          {semesters.map((s) => (
            <MenuItem key={s._id} value={s._id} sx={{ fontSize: 13 }}>
              {s.name || `Semester ${s.number}`}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </Paper>
  );
};

export default BatchFilter;
