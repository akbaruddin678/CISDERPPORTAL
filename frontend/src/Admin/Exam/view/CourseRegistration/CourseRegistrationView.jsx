import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Divider,
  InputAdornment,
} from "@mui/material";
import {
  Plus,
  UploadCloud,
  Trash2,
  DownloadCloud,
  FileSpreadsheet,
  Search,
} from "lucide-react";

const CourseRegistrationView = ({
  departments,
  filteredCourses,
  isFetchingCourses,
  searchQuery,
  setSearchQuery,
  selectedDept,
  setSelectedDept,
  isSingleModalOpen,
  setIsSingleModalOpen,
  singleForm,
  setSingleForm,
  handleCreateSingle,
  isCreating,
  handleDelete,
  isBulkModalOpen,
  setIsBulkModalOpen,
  bulkFile,
  setBulkFile,
  handleBulkSubmit,
  isBulkCreating,
  downloadTemplate,
}) => {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f6f8fb", fontFamily: "'Montserrat', sans-serif" }}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight="800" color="#0f172a" fontFamily="'Aleo', serif">
          Course Catalog
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Search and maintain the university's official course records.
        </Typography>
      </Box>

      {/* Modern Filter & Action Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 4,
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box display="flex" gap={2} flexGrow={1} maxWidth={600}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search by Course Title or Code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            fullWidth
            label="Filter by Class"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <MenuItem value="">All Classes</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d._id} value={d._id}>
                {d.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<UploadCloud size={18} />}
            onClick={() => setIsBulkModalOpen(true)}
          >
            Bulk Upload
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => setIsSingleModalOpen(true)}
          >
            Register Course
          </Button>
        </Box>
      </Paper>

      {/* Course Data Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {isFetchingCourses ? (
          <Box py={10} textAlign="center">
            <CircularProgress />
          </Box>
        ) : filteredCourses.length === 0 ? (
          <Box py={10} textAlign="center" color="text.secondary">
            <Typography>No courses found in the master catalog.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                <TableRow>
                  <TableCell>
                    <strong>Course Title & Code</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Class</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Level</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Credits (Th + Lab)</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCourses.map((row) => (
                  <TableRow key={row._id} hover>
                    <TableCell>
                      <Typography fontWeight="bold" color="primary.main">
                        {row.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {row.owningDepartmentId?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={row.level || "UG"}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color="primary"
                        sx={{
                          bgcolor: "primary.light",
                          color: "primary.dark",
                          fontWeight: "bold",
                        }}
                        label={`${row.creditHours?.theory || 0} + ${row.creditHours?.lab || 0}`}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDelete(row._id)}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ============================================================== */}
      {/* MODAL 1: SINGLE COURSE REGISTRATION */}
      {/* ============================================================== */}
      <Dialog
        open={isSingleModalOpen}
        onClose={() => setIsSingleModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight="bold">Register New Course</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={3} py={1}>
            <TextField
              label="Course Title"
              fullWidth
              value={singleForm.title}
              onChange={(e) =>
                setSingleForm({ ...singleForm, title: e.target.value })
              }
            />
            <Box display="flex" gap={2}>
              <TextField
                label="Course Code"
                fullWidth
                placeholder="e.g. CS101"
                value={singleForm.code}
                onChange={(e) =>
                  setSingleForm({ ...singleForm, code: e.target.value })
                }
              />
              <TextField
                select
                fullWidth
                label="Level"
                value={singleForm.level}
                onChange={(e) =>
                  setSingleForm({ ...singleForm, level: e.target.value })
                }
              >
                <MenuItem value="UG">Undergraduate (UG)</MenuItem>
                <MenuItem value="MS">Masters (MS)</MenuItem>
                <MenuItem value="PHD">PhD</MenuItem>
              </TextField>
            </Box>
            <TextField
              select
              fullWidth
              label="Owning Class"
              value={singleForm.owningDepartmentId}
              onChange={(e) =>
                setSingleForm({
                  ...singleForm,
                  owningDepartmentId: e.target.value,
                })
              }
            >
              {departments.map((d) => (
                <MenuItem key={d._id} value={d._id}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>
            <Box display="flex" gap={2}>
              <TextField
                type="number"
                fullWidth
                label="Theory Credit Hours"
                value={singleForm.theory}
                onChange={(e) =>
                  setSingleForm({ ...singleForm, theory: e.target.value })
                }
              />
              <TextField
                type="number"
                fullWidth
                label="Lab Credit Hours"
                value={singleForm.lab}
                onChange={(e) =>
                  setSingleForm({ ...singleForm, lab: e.target.value })
                }
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsSingleModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateSingle}
            disabled={isCreating}
          >
            {isCreating ? "Saving..." : "Save Course"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL 2: BULK UPLOAD WITH TEMPLATE */}
      {/* ============================================================== */}
      <Dialog
        open={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight="bold">Bulk Register Courses</DialogTitle>
        <DialogContent dividers>
          <Box
            display="flex"
            flexDirection="column"
            gap={3}
            py={1}
            alignItems="center"
          >
            <Box
              textAlign="center"
              p={3}
              bgcolor="#f8fafc"
              borderRadius={2}
              width="100%"
              border="1px dashed #cbd5e1"
            >
              <Typography variant="body2" color="text.secondary" mb={2}>
                Step 1: Download the standardized CSV template.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<DownloadCloud size={18} />}
                onClick={downloadTemplate}
              >
                Download Template
              </Button>
            </Box>
            <Divider flexItem>THEN</Divider>
            <Box textAlign="center" width="100%">
              <Typography variant="body2" color="text.secondary" mb={2}>
                Step 2: Upload the filled template.
              </Typography>
              <Button
                variant="contained"
                component="label"
                color="primary"
                startIcon={<FileSpreadsheet size={18} />}
                fullWidth
                sx={{ py: 1.5 }}
              >
                {bulkFile ? bulkFile.name : "Select CSV / Excel File"}
                <input
                  type="file"
                  hidden
                  accept=".csv, .xlsx"
                  onChange={(e) => setBulkFile(e.target.files[0])}
                />
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsBulkModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleBulkSubmit}
            disabled={!bulkFile || isBulkCreating}
          >
            {isBulkCreating ? "Uploading..." : "Upload Courses"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseRegistrationView;
