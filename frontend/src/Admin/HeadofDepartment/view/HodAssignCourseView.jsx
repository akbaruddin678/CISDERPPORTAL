import React from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Autocomplete,
  Button,
  CircularProgress,
} from "@mui/material";
import { ArrowLeft, Search, BookOpen, Info, Users } from "lucide-react";
import { getInstructorName } from "./HodCourseAllocationView";

const HodAssignCourseView = ({
  termName,
  semesterNumber,
  search,
  setSearch,
  filteredCourses,
  totalAvailable,
  crossSemesterCount,
  selectedCreditHoursTotal,
  isFetchingCourses,
  selectedCourseIds,
  toggleCourse,
  allFilteredSelected,
  toggleAllFiltered,
  instructorByCourse,
  setInstructor,
  bulkSetInstructor,
  faculty,
  handleBack,
  handleSubmit,
  isAllocating,
  sectionsInput,
  setSectionsInput,
  sectionCapacity,
  setSectionCapacity,
  courseType,
  setCourseType,
}) => {
  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        maxWidth: 1100,
        mx: "auto",
        pb: 12,
      }}
    >
      <Box display="flex" alignItems="center" gap={1.5} mb={2}>
        <IconButton
          onClick={handleBack}
          size="small"
          sx={{ bgcolor: "#f1f5f9", "&:hover": { bgcolor: "#e2e8f0" } }}
        >
          <ArrowLeft size={18} />
        </IconButton>
        <Typography
          fontSize={19}
          fontWeight={800}
          color="#0f172a"
          fontFamily="'Aleo', serif"
        >
          Assign Courses — Section {semesterNumber ?? "?"}
        </Typography>
      </Box>

      <Box display="flex" gap={1.5} mb={2} flexWrap="wrap">
        {[
          {
            label: "Session",
            value: termName,
            color: "#1d4ed8",
            bg: "#eff6ff",
          },
          {
            label: "Available",
            value: totalAvailable,
            color: "#15803d",
            bg: "#f0fdf4",
          },
          {
            label: "Selected",
            value: selectedCourseIds.size,
            color: "#b45309",
            bg: "#fffbeb",
          },
        ].map((stat) => (
          <Paper
            key={stat.label}
            elevation={0}
            sx={{
              px: 2,
              py: 1.25,
              border: "0.5px solid #e2e8f0",
              borderRadius: 2.5,
              bgcolor: "#fff",
              minWidth: 110,
            }}
          >
            <Typography
              fontSize={10.5}
              fontWeight={800}
              color="#94a3b8"
              textTransform="uppercase"
              letterSpacing="0.04em"
              fontFamily="'Montserrat', sans-serif"
            >
              {stat.label}
            </Typography>
            <Typography
              fontSize={15}
              fontWeight={800}
              color={stat.color}
              fontFamily="'Montserrat', sans-serif"
              sx={{ mt: 0.25 }}
            >
              {stat.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Paper elevation={0} sx={{ p: 2, mb: 2, border: "0.5px solid #e2e8f0", borderRadius: 2.5, bgcolor: "#fff" }}>
        <Typography fontSize={12} fontWeight={800} color="#334155" mb={1.5}>Section setup for selected courses</Typography>
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 160px 180px" }} gap={1.5}>
          <TextField size="small" label="Sections" value={sectionsInput} onChange={(event) => setSectionsInput(event.target.value)} helperText="Comma-separated, e.g. A, B" />
          <TextField size="small" type="number" label="Seats per section" value={sectionCapacity} onChange={(event) => setSectionCapacity(event.target.value)} inputProps={{ min: 1 }} />
          <TextField select size="small" label="Course type" value={courseType} onChange={(event) => setCourseType(event.target.value)} SelectProps={{ native: true }}>
            <option value="MANDATORY">Mandatory</option>
            <option value="ELECTIVE">Elective</option>
          </TextField>
        </Box>
        <Typography mt={1.25} fontSize={11.5} color="#64748b">Students are assigned to the first section with an available seat. Full sections are never offered.</Typography>
      </Paper>

      {crossSemesterCount > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 2,
            px: 1.75,
            py: 1,
            borderRadius: 2,
            bgcolor: "#fffbeb",
            border: "0.5px solid #fde68a",
          }}
        >
          <Info size={14} color="#b45309" style={{ flexShrink: 0 }} />
          <Typography
            fontSize={11.5}
            fontWeight={600}
            color="#92400e"
            fontFamily="'Montserrat', sans-serif"
          >
            {crossSemesterCount} course{crossSemesterCount === 1 ? "" : "s"}{" "}
            hidden — already assigned to a different semester in this same
            session ({termName}). A course can only belong to one semester
            per session.
          </Typography>
        </Box>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          border: "0.5px solid #e2e8f0",
          borderRadius: 2.5,
          bgcolor: "#fff",
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <TextField
          size="small"
          placeholder="Search by course code or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            flex: 1,
            minWidth: 260,
            "& .MuiOutlinedInput-root": {
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 13,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} color="#94a3b8" />
              </InputAdornment>
            ),
          }}
        />
        <Button
          size="small"
          onClick={toggleAllFiltered}
          disabled={filteredCourses.length === 0}
          sx={{
            fontWeight: 700,
            textTransform: "none",
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 12.5,
            color: "#2563eb",
            whiteSpace: "nowrap",
          }}
        >
          {allFilteredSelected ? "Deselect All Visible" : "Select All Visible"}
        </Button>

        {selectedCourseIds.size > 1 && (
          <Autocomplete
            size="small"
            options={faculty}
            getOptionLabel={(f) => getInstructorName(f) || ""}
            getOptionKey={(f) => f._id}
            isOptionEqualToValue={(a, b) => a._id === b._id}
            onChange={(e, val) => val && bulkSetInstructor(val._id)}
            value={null}
            sx={{ width: 230 }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder="Bulk-assign instructor..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <Users size={14} color="#94a3b8" style={{ marginLeft: 4 }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 12.5,
                  },
                }}
              />
            )}
          />
        )}
      </Paper>

      <Paper
        elevation={0}
        sx={{
          border: "0.5px solid #e2e8f0",
          borderRadius: 2.5,
          overflow: "hidden",
          bgcolor: "#fff",
        }}
      >
        {isFetchingCourses ? (
          <Box py={10} textAlign="center">
            <CircularProgress size={30} sx={{ color: "#2563eb" }} />
          </Box>
        ) : filteredCourses.length === 0 ? (
          <Box py={8} textAlign="center" color="#94a3b8">
            <BookOpen size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
            <Typography
              fontSize={13.5}
              fontWeight={700}
              color="#64748b"
              fontFamily="'Montserrat', sans-serif"
            >
              {totalAvailable === 0
                ? crossSemesterCount > 0
                  ? "Every active course in this department is already assigned somewhere in this session (this semester or another) — nothing left to offer here."
                  : "Every active course in this department is already assigned to this semester in this session."
                : "No courses match your search."}
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: "calc(100vh - 340px)" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ bgcolor: "#f8fafc" }}>
                    <Checkbox
                      size="small"
                      checked={allFilteredSelected}
                      indeterminate={
                        !allFilteredSelected &&
                        filteredCourses.some((c) =>
                          selectedCourseIds.has(c._id),
                        )
                      }
                      onChange={toggleAllFiltered}
                    />
                  </TableCell>
                  {["Code", "Title", "Credit Hrs", "Instructor"].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        bgcolor: "#f8fafc",
                        fontWeight: 800,
                        fontSize: 11,
                        color: "#64748b",
                        textTransform: "uppercase",
                        fontFamily: "'Montserrat', sans-serif",
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCourses.map((c, idx) => {
                  const checked = selectedCourseIds.has(c._id);
                  return (
                    <TableRow
                      key={c._id}
                      hover
                      selected={checked}
                      sx={{
                        "&:last-child td": { borderBottom: 0 },
                        bgcolor: !checked && idx % 2 === 1 ? "#fafbfc" : undefined,
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={checked}
                          onChange={() => toggleCourse(c._id)}
                        />
                      </TableCell>
                      <TableCell
                        onClick={() => toggleCourse(c._id)}
                        sx={{
                          cursor: "pointer",
                          fontWeight: 800,
                          fontSize: 12.5,
                          color: "#1e293b",
                          fontFamily: "'Montserrat', sans-serif",
                        }}
                      >
                        {c.code}
                      </TableCell>
                      <TableCell
                        onClick={() => toggleCourse(c._id)}
                        sx={{
                          cursor: "pointer",
                          fontSize: 12.5,
                          color: "#475569",
                          fontFamily: "'Montserrat', sans-serif",
                        }}
                      >
                        {c.title}
                      </TableCell>
                      <TableCell
                        onClick={() => toggleCourse(c._id)}
                        sx={{
                          cursor: "pointer",
                          fontSize: 12.5,
                          color: "#475569",
                          fontFamily: "'Montserrat', sans-serif",
                        }}
                      >
                        {typeof c.creditHours === "number"
                          ? c.creditHours
                          : (c.creditHours?.theory || 0) +
                            (c.creditHours?.lab || 0)}
                      </TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Autocomplete
                          size="small"
                          disabled={!checked}
                          options={faculty}
                          getOptionLabel={(f) => getInstructorName(f) || ""}
                          getOptionKey={(f) => f._id}
                          isOptionEqualToValue={(a, b) => a._id === b._id}
                          value={
                            faculty.find(
                              (f) => f._id === instructorByCourse[c._id],
                            ) || null
                          }
                          onChange={(e, val) =>
                            setInstructor(c._id, val?._id || null)
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Assign Later"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  fontFamily: "'Montserrat', sans-serif",
                                  fontSize: 12.5,
                                },
                              }}
                            />
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: "#fff",
          borderTop: "0.5px solid #e2e8f0",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.04)",
          px: { xs: 2, md: 4 },
          py: 1.75,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 1.5,
          zIndex: 10,
        }}
      >
        <Typography
          fontSize={12.5}
          fontWeight={700}
          color="#64748b"
          fontFamily="'Montserrat', sans-serif"
          sx={{ mr: "auto" }}
        >
          {selectedCourseIds.size} course{selectedCourseIds.size === 1 ? "" : "s"}{" "}
          selected
          {selectedCourseIds.size > 0 &&
            ` · ${selectedCreditHoursTotal} credit hour${selectedCreditHoursTotal === 1 ? "" : "s"}`}
        </Typography>
        <Button
          onClick={handleBack}
          sx={{
            fontWeight: 700,
            color: "#64748b",
            textTransform: "none",
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isAllocating || selectedCourseIds.size === 0}
          sx={{
            bgcolor: "#2563eb",
            fontWeight: 700,
            borderRadius: 2,
            boxShadow: "none",
            px: 3.5,
            textTransform: "none",
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          {isAllocating ? "Assigning..." : "Assign Selected Courses"}
        </Button>
      </Box>
    </Box>
  );
};

export default HodAssignCourseView;
