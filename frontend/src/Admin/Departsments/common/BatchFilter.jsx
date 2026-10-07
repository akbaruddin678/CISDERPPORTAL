import React from "react";
import {
  Paper,
  Grid,
  TextField,
  MenuItem,
  Box,
  Typography,
  InputAdornment,
} from "@mui/material";
import {
  FilterAltOutlined,
  CalendarTodayOutlined,
  BusinessOutlined,
  SchoolOutlined,
  LayersOutlined,
} from "@mui/icons-material";

const BatchFilter = ({
  filters,
  terms = [],
  departments = [],
  programs = [],
  semesters = [],
  onFilterChange,
}) => {
  // Common styling for a modern, clean input look
  const inputStyles = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      backgroundColor: "#f8fafc", // Soft gray-blue background
      transition: "all 0.2s ease-in-out",
      "&:hover fieldset": {
        borderColor: "#94a3b8", // Darker border on hover
      },
      "&.Mui-focused fieldset": {
        borderColor: "primary.main",
        borderWidth: "2px",
      },
      "&.Mui-disabled": {
        backgroundColor: "#f1f5f9", // Even softer background when disabled
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "#e2e8f0",
        },
      },
    },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        mb: 4,
        borderRadius: 3,
        border: "1px solid #e2e8f0",
        boxShadow:
          "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)", // Soft modern shadow
        backgroundColor: "#ffffff",
      }}
    >
      {/* HEADER SECTION */}
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <Box
          sx={{
            bgcolor: "primary.50",
            p: 1,
            borderRadius: 1.5,
            display: "flex",
            color: "primary.main",
          }}
        >
          <FilterAltOutlined fontSize="small" />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" color="#1e293b">
            Target Batch Selection
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Filter sequentially from left to right to load data.
          </Typography>
        </Box>
      </Box>

      {/* FILTER GRID */}
      <Grid container spacing={3}>
        {/* 1. TERM FILTER */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            size="small"
            label="Academic Term"
            value={filters.termId || ""}
            onChange={(e) => onFilterChange("termId", e.target.value)}
            sx={inputStyles}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarTodayOutlined
                    fontSize="small"
                    sx={{ color: "text.secondary" }}
                  />
                </InputAdornment>
              ),
            }}
          >
            {terms.map((t) => (
              <MenuItem key={t._id} value={t._id}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* 2. DEPARTMENT FILTER */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            size="small"
            label="Department"
            disabled={!filters.termId}
            value={filters.departmentId || ""}
            onChange={(e) => onFilterChange("departmentId", e.target.value)}
            sx={inputStyles}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BusinessOutlined
                    fontSize="small"
                    sx={{
                      color: filters.termId
                        ? "text.secondary"
                        : "text.disabled",
                    }}
                  />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="">
              <em>All Departments</em>
            </MenuItem>
            {departments.map((d) => (
              <MenuItem key={d._id} value={d._id}>
                {d.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* 3. PROGRAM FILTER */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            size="small"
            label="Program"
            disabled={!filters.departmentId}
            value={filters.programId || ""}
            onChange={(e) => onFilterChange("programId", e.target.value)}
            sx={inputStyles}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SchoolOutlined
                    fontSize="small"
                    sx={{
                      color: filters.departmentId
                        ? "text.secondary"
                        : "text.disabled",
                    }}
                  />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="" disabled>
              <em>Select Program</em>
            </MenuItem>
            {programs.map((p) => (
              <MenuItem key={p._id} value={p._id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* 4. SEMESTER FILTER */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            select
            fullWidth
            size="small"
            label="Semester"
            disabled={!filters.programId}
            value={filters.semesterId || ""}
            onChange={(e) => onFilterChange("semesterId", e.target.value)}
            sx={inputStyles}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LayersOutlined
                    fontSize="small"
                    sx={{
                      color: filters.programId
                        ? "text.secondary"
                        : "text.disabled",
                    }}
                  />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="" disabled>
              <em>Select Semester</em>
            </MenuItem>
            {semesters.map((s) => (
              <MenuItem key={s._id} value={s._id}>
                {s.name || `Semester ${s.number}`}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default BatchFilter;
