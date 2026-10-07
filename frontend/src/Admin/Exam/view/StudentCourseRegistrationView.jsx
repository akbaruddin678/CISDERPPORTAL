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
  Avatar,
  Chip,
  Drawer,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  Switch,
  ListItemSecondaryAction,
  Checkbox,
  TextField,
  Tabs,
  Tab,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import {
  Close,
  Groups,
  LibraryBooks,
  Save,
  VerifiedUser,
  LibraryAdd,
  CheckCircleOutline,
  Search,
  SortByAlpha,
  AccountTree,
  Visibility,
  Edit,
  AssignmentInd,
  PersonAdd,
  BlockOutlined,
} from "@mui/icons-material";
import BatchFilter from "../common/BatchFilter";
import CourseAvailabilityChips from "./components/CourseAvailabilityChips";

const StudentCourseRegistrationView = ({
  filters = {},
  terms = [],
  departments = [],
  programs = [],
  semesters = [],
  handleFilterChange,
  activeTab = 0,
  handleTabChange,
  isReady,

  // Semester Courses
  assignedCourses = [],
  isFetchingAssigned,
  isAssignCourseDrawerOpen,
  setIsAssignCourseDrawerOpen,
  assignCourseForm,
  setAssignCourseForm,
  handleAssignCourseSubmit,
  isAssigningCourse,
  filteredCatalog = [],
  courseSearch,
  setCourseSearch,
  courseSort,
  setCourseSort,
  selectedCatalogCourseIds = [],
  handleToggleCatalogCourse,
  handleSelectAllCatalogCourses,

  // Students & Management
  students = [],
  isFetchingStudents,
  selectedRows = [],
  handleSelectRow,
  handleSelectAllRows,
  isDrawerOpen,
  isBulkMode,
  selectedStudent,
  drawerCurriculum = [],
  isFetchingCourses,
  selectedCourseIds = [],
  isSaving,
  handleOpenSingleStudent,
  handleOpenBulkDrawer,
  handleCloseDrawer,
  handleToggleCourse,
  handleSelectAllCourses,
  handleSave,

  // Credit limit
  totalSelectedCredits = 0,
  creditLimit = {},
  isOverMax,
  isUnderMin,
  isHod,
  isOverrideFormOpen,
  overrideForm = { maxCredits: "", reason: "" },
  setOverrideForm,
  openOverrideForm,
  closeOverrideForm,
  submitOverride,
  isGrantingOverride,

  // View Modal
  isViewModalOpen,
  setIsViewModalOpen,
  viewingStudent,
  viewCoursesList = [],
  isFetchingViewCourses,
  handleOpenViewCourses,

  // Tab 3: Course Roster
  unassignedCourses = [],
  isRosterDrawerOpen,
  rosterCourse,
  rosterSelectedIds = [],
  rosterSearch,
  setRosterSearch,
  filteredRosterStudents = [],
  isFetchingRoster,
  isSavingRoster,
  handleOpenRoster,
  handleCloseRoster,
  handleToggleRosterStudent,
  handleSelectAllRosterStudents,
  handleSaveRoster,
  handleQuickAssignCourse,
}) => {
  const getStudentName = (s) =>
    s?.personalInfo?.fullName || s?.name || s?.fullName || "Unknown Student";
  const getRegNo = (s) =>
    s?.registrationNo || s?.studentId || s?.rollNo || "N/A";
  const getEmail = (s) =>
    s?.personalInfo?.email ||
    s?.contactInfo?.email ||
    s?.email ||
    "No Email Provided";

  const allSelected =
    students.length > 0 && selectedRows.length === students.length;
  const someSelected =
    selectedRows.length > 0 && selectedRows.length < students.length;

  const registeredCourses = drawerCurriculum.filter((c) =>
    selectedCourseIds.includes(c.courseId || c._id),
  );
  const unregisteredCourses = drawerCurriculum.filter(
    (c) => !selectedCourseIds.includes(c.courseId || c._id),
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f6f8fb", fontFamily: "'Montserrat', sans-serif" }}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight="800" color="#0f172a" fontFamily="'Aleo', serif">
          Course Assignment
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Set up section courses and manage the students enrolled in each course.
        </Typography>
      </Box>

      <BatchFilter
        filters={filters}
        terms={terms}
        departments={departments}
        programs={programs}
        semesters={semesters}
        onFilterChange={handleFilterChange}
      />

      {isReady ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            bgcolor: "white",
          }}
        >
          <Box
            sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "#f8fafc" }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              px={2}
            >
              <Tab
                icon={<LibraryBooks sx={{ mr: 1 }} />}
                iconPosition="start"
                label={`Semester courses (${assignedCourses.length})`}
                sx={{ fontWeight: "bold" }}
              />
              <Tab
                icon={<Groups sx={{ mr: 1 }} />}
                iconPosition="start"
                label={`Enrolled students (${students.length})`}
                sx={{ fontWeight: "bold" }}
              />
              <Tab
                icon={<AssignmentInd sx={{ mr: 1 }} />}
                iconPosition="start"
                label={`Course roster (${unassignedCourses.length} unassigned)`}
                sx={{ fontWeight: "bold" }}
              />
            </Tabs>
          </Box>

          {/* ======================================================= */}
          {/* TAB 1: SEMESTER COURSES */}
          {/* ======================================================= */}
          {activeTab === 0 && (
            <Box>
              <Box
                sx={{
                  p: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  Courses assigned to this Section
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<LibraryAdd />}
                  onClick={() => setIsAssignCourseDrawerOpen(true)}
                >
                  Add Course(s)
                </Button>
              </Box>

              {isFetchingAssigned ? (
                <Box py={10} textAlign="center">
                  <CircularProgress />
                </Box>
              ) : assignedCourses.length === 0 ? (
                <Box py={10} textAlign="center" color="text.secondary">
                  <LibraryBooks sx={{ fontSize: 50, opacity: 0.2, mb: 1 }} />
                  <Typography>
                    No courses have been added to this section yet.
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                      <TableRow>
                        <TableCell>
                          <strong>Course Code & Title</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Credits</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Prerequisites</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Section</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Capacity</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assignedCourses.map((row) => {
                        // CRITICAL FIX: Aggressively fallback to row.title if courseId is missing/unpopulated
                        const title =
                          row.courseId?.title ||
                          row.title ||
                          row.courseName ||
                          "Unknown Course";
                        const code =
                          row.courseId?.code ||
                          row.code ||
                          row.courseCode ||
                          "N/A";

                        const theory =
                          row.courseId?.creditHours?.theory ??
                          row.theoryCredits ??
                          row.creditHours?.theory ??
                          0;
                        const lab =
                          row.courseId?.creditHours?.lab ??
                          row.labCredits ??
                          row.creditHours?.lab ??
                          0;

                        const rawPrereqs =
                          row.courseId?.prerequisites ||
                          row.prerequisites ||
                          [];
                        const prereqs = Array.isArray(rawPrereqs)
                          ? rawPrereqs
                          : [];

                        return (
                          <TableRow key={row._id || Math.random()} hover>
                            <TableCell>
                              <Typography
                                fontWeight="bold"
                                color="primary.main"
                              >
                                {title}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {code}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={`${theory}Th + ${lab}Lab`}
                              />
                            </TableCell>
                            <TableCell>
                              {prereqs.length === 0 ? (
                                <Typography
                                  variant="caption"
                                  color="text.disabled"
                                >
                                  None
                                </Typography>
                              ) : (
                                <Box display="flex" flexWrap="wrap" gap={0.5}>
                                  {prereqs.map((p, i) => (
                                    <Tooltip
                                      key={i}
                                      title={p.title || "Prerequisite"}
                                      arrow
                                    >
                                      <Chip
                                        size="small"
                                        variant="outlined"
                                        color="warning"
                                        icon={<AccountTree fontSize="small" />}
                                        label={p.code || p}
                                      />
                                    </Tooltip>
                                  ))}
                                </Box>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`Sec ${row.section || "A"}`}
                              />
                            </TableCell>
                            <TableCell>{row.capacity || 50}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* ======================================================= */}
          {/* TAB 2: STUDENTS & ENROLLMENT */}
          {/* ======================================================= */}
          {activeTab === 1 && (
            <Box>
              <Box
                sx={{
                  bgcolor: selectedRows.length > 0 ? "primary.light" : "white",
                  p: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                {selectedRows.length > 0 ? (
                  <>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      color="primary.dark"
                    >
                      {selectedRows.length} Students Selected
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      disableElevation
                      onClick={handleOpenBulkDrawer}
                      startIcon={<VerifiedUser />}
                    >
                      Bulk Enroll Selected
                    </Button>
                  </>
                ) : (
                  <Typography variant="h6" fontWeight="bold">
                    Students in Batch
                  </Typography>
                )}
              </Box>

              {isFetchingStudents ? (
                <Box py={10} textAlign="center">
                  <CircularProgress />
                </Box>
              ) : students.length === 0 ? (
                <Box py={10} textAlign="center" color="text.secondary">
                  <Groups sx={{ fontSize: 50, opacity: 0.2, mb: 1 }} />
                  <Typography>
                    No active students found in this batch.
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            indeterminate={someSelected}
                            checked={allSelected}
                            onChange={handleSelectAllRows}
                          />
                        </TableCell>
                        <TableCell>
                          <strong>Student Profile</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Registration No.</strong>
                        </TableCell>
                        <TableCell align="center">
                          <strong>Status</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>Action</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.map((student) => {
                        const isChecked = selectedRows.includes(student._id);
                        const name = getStudentName(student);

                        return (
                          <TableRow
                            key={student._id || Math.random()}
                            hover
                            selected={isChecked}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                color="primary"
                                checked={isChecked}
                                onChange={() => handleSelectRow(student._id)}
                              />
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar
                                  sx={{
                                    bgcolor: "primary.main",
                                    width: 40,
                                    height: 40,
                                    fontWeight: "bold",
                                  }}
                                >
                                  {name.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography fontWeight="600" color="#0f172a">
                                    {name}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {getEmail(student)}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getRegNo(student)}
                                size="small"
                                sx={{
                                  fontWeight: "bold",
                                  bgcolor: "#f1f5f9",
                                  color: "#475569",
                                }}
                              />
                            </TableCell>

                            <TableCell align="center">
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 0.5,
                                }}
                              >
                                <LibraryBooks fontSize="small" /> Open to View
                              </Typography>
                            </TableCell>

                            <TableCell align="right">
                              <Box
                                display="flex"
                                gap={1}
                                justifyContent="flex-end"
                              >
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="info"
                                  startIcon={<Visibility />}
                                  onClick={() => handleOpenViewCourses(student)}
                                >
                                  View
                                </Button>
                                <Button
                                  variant="contained"
                                  size="small"
                                  disableElevation
                                  startIcon={<Edit />}
                                  onClick={() =>
                                    handleOpenSingleStudent(student)
                                  }
                                >
                                  Manage
                                </Button>
                              </Box>
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

          {/* ======================================================= */}
          {/* TAB 3: COURSE ROSTER — ASSIGNED vs UNASSIGNED */}
          {/* ======================================================= */}
          {activeTab === 2 && (
            <Box sx={{ p: 3 }}>
              <Box mb={1}>
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  color="success.main"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <CheckCircleOutline fontSize="small" /> ASSIGNED TO THIS
                  SEMESTER ({assignedCourses.length})
                </Typography>
              </Box>

              {isFetchingAssigned ? (
                <Box py={6} textAlign="center">
                  <CircularProgress size={28} />
                </Box>
              ) : assignedCourses.length === 0 ? (
                <Box
                  py={5}
                  textAlign="center"
                  color="text.secondary"
                  sx={{
                    border: "1px dashed #cbd5e1",
                    borderRadius: 2,
                    mb: 4,
                  }}
                >
                  <Typography variant="body2">
                    No courses assigned to this section yet.
                  </Typography>
                </Box>
              ) : (
                <Box
                  display="grid"
                  gridTemplateColumns={{
                    xs: "1fr",
                    sm: "1fr 1fr",
                    md: "1fr 1fr 1fr",
                  }}
                  gap={2}
                  mb={4}
                >
                  {assignedCourses.map((row) => {
                    const title =
                      row.courseId?.title || row.title || "Unknown Course";
                    const code = row.courseId?.code || row.code || "N/A";
                    return (
                      <Paper
                        key={row._id}
                        elevation={0}
                        sx={{
                          p: 2,
                          border: "1px solid #86efac",
                          bgcolor: "#f0fdf4",
                          borderRadius: 2.5,
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <Box>
                          <Typography fontWeight="bold" color="success.dark">
                            {title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {code}
                          </Typography>
                        </Box>
                        <Box display="flex" gap={0.75} flexWrap="wrap">
                          <Chip
                            size="small"
                            label={`Sec ${row.section || "A"}`}
                          />
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`Cap ${row.capacity || 50}`}
                          />
                        </Box>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          disableElevation
                          startIcon={<PersonAdd fontSize="small" />}
                          onClick={() => handleOpenRoster(row)}
                          sx={{ mt: "auto", textTransform: "none" }}
                        >
                          Manage Students
                        </Button>
                      </Paper>
                    );
                  })}
                </Box>
              )}

              <Divider sx={{ mb: 3 }} />

              <Box mb={1}>
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  color="text.secondary"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <BlockOutlined fontSize="small" /> NOT YET ASSIGNED (
                  {unassignedCourses.length})
                </Typography>
              </Box>

              {unassignedCourses.length === 0 ? (
                <Box
                  py={5}
                  textAlign="center"
                  color="text.secondary"
                  sx={{ border: "1px dashed #cbd5e1", borderRadius: 2 }}
                >
                  <Typography variant="body2">
                    Every catalog course for this class is already
                    assigned to this section.
                  </Typography>
                </Box>
              ) : (
                <Box
                  display="grid"
                  gridTemplateColumns={{
                    xs: "1fr",
                    sm: "1fr 1fr",
                    md: "1fr 1fr 1fr",
                  }}
                  gap={2}
                >
                  {unassignedCourses.map((course) => (
                    <Paper
                      key={course._id}
                      elevation={0}
                      sx={{
                        p: 2,
                        border: "1px solid #e2e8f0",
                        borderRadius: 2.5,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                      }}
                    >
                      <Box>
                        <Typography fontWeight="bold" color="#1e293b">
                          {course.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {course.code}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<LibraryAdd fontSize="small" />}
                        onClick={() => handleQuickAssignCourse(course)}
                        sx={{ mt: "auto", textTransform: "none" }}
                      >
                        Assign to Section
                      </Button>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Paper>
      ) : (
        <Box py={10} textAlign="center" color="text.secondary">
          <Typography>
            Please select a Term, Program, and Section to proceed.
          </Typography>
        </Box>
      )}

      {/* ============================================================== */}
      {/* DRAWER: BULK ASSIGN COURSES TO SEMESTER */}
      {/* ============================================================== */}
      <Drawer
        anchor="right"
        open={isAssignCourseDrawerOpen}
        onClose={() => setIsAssignCourseDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", md: 480 }, p: 0 } }}
      >
        <Box
          sx={{
            p: 3,
            bgcolor: "secondary.main",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Add Courses to Section
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Assign multiple catalog courses at once.
            </Typography>
          </Box>
          <IconButton
            color="inherit"
            onClick={() => setIsAssignCourseDrawerOpen(false)}
          >
            <Close />
          </IconButton>
        </Box>

        <Box sx={{ p: 3, flexGrow: 1, overflowY: "auto", bgcolor: "#f8fafc" }}>
          <Paper
            elevation={0}
            sx={{ p: 2, mb: 3, border: "1px solid #e2e8f0", borderRadius: 2 }}
          >
            <Typography variant="subtitle2" fontWeight="bold" mb={2}>
              Default Settings for Selected Courses
            </Typography>
            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                size="small"
                label="Section (e.g., A, B)"
                value={assignCourseForm.section}
                onChange={(e) =>
                  setAssignCourseForm({
                    ...assignCourseForm,
                    section: e.target.value.toUpperCase(),
                  })
                }
              />
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Seat Capacity"
                value={assignCourseForm.capacity}
                onChange={(e) =>
                  setAssignCourseForm({
                    ...assignCourseForm,
                    capacity: e.target.value,
                  })
                }
              />
            </Box>
          </Paper>

          <Typography
            variant="subtitle2"
            color="text.secondary"
            fontWeight="bold"
            mb={1}
          >
            SELECT FROM CATALOG
          </Typography>
          <Box display="flex" gap={1} mb={2}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search Title or Code..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              color="inherit"
              onClick={() =>
                setCourseSort(courseSort === "asc" ? "desc" : "asc")
              }
            >
              <SortByAlpha fontSize="small" />
            </Button>
          </Box>

          {filteredCatalog.length === 0 ? (
            <Typography align="center" color="text.secondary" py={4}>
              No courses match your search or class filter.
            </Typography>
          ) : (
            <>
              <Box display="flex" justifyContent="flex-end" mb={1}>
                <Button size="small" onClick={handleSelectAllCatalogCourses}>
                  {selectedCatalogCourseIds.length === filteredCatalog.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </Box>
              <List sx={{ p: 0 }}>
                {filteredCatalog.map((course) => (
                  <Paper
                    key={course._id}
                    elevation={0}
                    sx={{ mb: 1, border: "1px solid #e2e8f0", borderRadius: 2 }}
                  >
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography fontWeight="bold" color="#1e293b">
                            {course.title}
                          </Typography>
                        }
                        secondary={`${course.code} • ${course.creditHours?.theory || 0}Th + ${course.creditHours?.lab || 0}Lab`}
                      />
                      <ListItemSecondaryAction>
                        <Checkbox
                          color="primary"
                          checked={selectedCatalogCourseIds.includes(
                            course._id,
                          )}
                          onChange={() => handleToggleCatalogCourse(course._id)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </Paper>
                ))}
              </List>
            </>
          )}
        </Box>

        <Divider />
        <Box
          sx={{
            p: 3,
            bgcolor: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            <strong>{selectedCatalogCourseIds.length}</strong> courses selected
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            startIcon={
              isAssigningCourse ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <LibraryAdd />
              )
            }
            onClick={handleAssignCourseSubmit}
            disabled={
              isAssigningCourse || selectedCatalogCourseIds.length === 0
            }
          >
            {isAssigningCourse ? "Adding..." : "Add to Semester"}
          </Button>
        </Box>
      </Drawer>

      {/* ============================================================== */}
      {/* DRAWER: MANAGE STUDENT ENROLLMENTS VISUALLY */}
      {/* ============================================================== */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{ sx: { width: { xs: "100%", md: 480 }, p: 0 } }}
      >
        <Box
          sx={{
            p: 3,
            bgcolor: "primary.main",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {isBulkMode ? "Bulk Enroll Courses" : "Student Enrollment"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {isBulkMode
                ? `Applying to ${selectedRows.length} selected students`
                : `${getStudentName(selectedStudent)} (${getRegNo(selectedStudent)})`}
            </Typography>
          </Box>
          <IconButton color="inherit" onClick={handleCloseDrawer}>
            <Close />
          </IconButton>
        </Box>

        <Box sx={{ p: 3, flexGrow: 1, overflowY: "auto", bgcolor: "#f8fafc" }}>
          {isFetchingCourses ? (
            <Box py={10} textAlign="center">
              <CircularProgress />
            </Box>
          ) : drawerCurriculum.length === 0 ? (
            <Box py={10} textAlign="center" color="text.secondary">
              <LibraryBooks sx={{ fontSize: 60, opacity: 0.2, mb: 1 }} />
              <Typography>
                No courses have been added to this section yet.
              </Typography>
              <Button
                sx={{ mt: 2 }}
                variant="outlined"
                onClick={() => {
                  handleCloseDrawer();
                  handleTabChange(null, 0);
                  setIsAssignCourseDrawerOpen(true);
                }}
              >
                Add a Course First
              </Button>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 1.5,
                  mb: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: isOverMax
                    ? "error.main"
                    : isUnderMin
                      ? "warning.main"
                      : "#e2e8f0",
                  bgcolor: isOverMax
                    ? "#fef2f2"
                    : isUnderMin
                      ? "#fffbeb"
                      : "#f8fafc",
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color={
                    isOverMax
                      ? "error.main"
                      : isUnderMin
                        ? "warning.dark"
                        : "text.primary"
                  }
                >
                  Total: {totalSelectedCredits}
                  {typeof creditLimit.maxCredits === "number"
                    ? ` / ${creditLimit.maxCredits}`
                    : ""}{" "}
                  credits
                </Typography>
                {creditLimit.overrideActive && (
                  <Chip size="small" color="info" label="Override active" />
                )}
              </Box>

              {isOverMax && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Credit limit exceeded ({totalSelectedCredits} of max{" "}
                  {creditLimit.maxCredits}). Drop a course
                  {isHod ? ", or grant an override below." : " to save."}
                </Alert>
              )}
              {!isOverMax && isUnderMin && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Under-enrolled: {totalSelectedCredits} of minimum{" "}
                  {creditLimit.minCredits} credits.
                </Alert>
              )}
              {isHod && isOverMax && (
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={openOverrideForm}
                  sx={{ mb: 2 }}
                >
                  Grant Credit Override
                </Button>
              )}

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  fontWeight="bold"
                >
                  SECTION CURRICULUM
                </Typography>
                <Button size="small" onClick={handleSelectAllCourses}>
                  {selectedCourseIds.length === drawerCurriculum.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </Box>

              {registeredCourses.length > 0 && (
                <Box mb={4}>
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    color="success.main"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mb: 1,
                    }}
                  >
                    <CheckCircleOutline fontSize="small" /> CURRENTLY ENROLLED (
                    {registeredCourses.length})
                  </Typography>
                  <List sx={{ p: 0 }}>
                    {registeredCourses.map((course) => {
                      const title =
                        course.title ||
                        course.courseId?.title ||
                        "Unknown Course";
                      const code =
                        course.code || course.courseId?.code || "N/A";
                      const credits =
                        course.credits ||
                        (course.courseId?.creditHours
                          ? course.courseId.creditHours.theory +
                            course.courseId.creditHours.lab
                          : 3);
                      return (
                        <Paper
                          key={course.courseId || course._id}
                          elevation={0}
                          sx={{
                            mb: 1.5,
                            border: "1px solid #86efac",
                            bgcolor: "#f0fdf4",
                            borderRadius: 2,
                          }}
                        >
                          <ListItem>
                            <ListItemText
                              secondaryTypographyProps={{ component: "div" }}
                              primary={
                                <Typography
                                  fontWeight="bold"
                                  color="success.dark"
                                >
                                  {title}
                                </Typography>
                              }
                              secondary={
                                <>
                                  {`${code} • ${credits} Credits`}
                                  <CourseAvailabilityChips course={course} />
                                </>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Switch
                                edge="end"
                                color="success"
                                checked={true}
                                onChange={() =>
                                  handleToggleCourse(
                                    course.courseId || course._id,
                                  )
                                }
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                        </Paper>
                      );
                    })}
                  </List>
                </Box>
              )}

              {unregisteredCourses.length > 0 && (
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    color="text.secondary"
                    sx={{ display: "block", mb: 1 }}
                  >
                    AVAILABLE TO ENROLL ({unregisteredCourses.length})
                  </Typography>
                  <List sx={{ p: 0 }}>
                    {unregisteredCourses.map((course) => {
                      const title =
                        course.title ||
                        course.courseId?.title ||
                        "Unknown Course";
                      const code =
                        course.code || course.courseId?.code || "N/A";
                      const credits =
                        course.credits ||
                        (course.courseId?.creditHours
                          ? course.courseId.creditHours.theory +
                            course.courseId.creditHours.lab
                          : 3);
                      return (
                        <Paper
                          key={course.courseId || course._id}
                          elevation={0}
                          sx={{
                            mb: 1.5,
                            border: "1px solid #e2e8f0",
                            borderRadius: 2,
                          }}
                        >
                          <ListItem>
                            <ListItemText
                              secondaryTypographyProps={{ component: "div" }}
                              primary={
                                <Typography fontWeight="bold" color="#1e293b">
                                  {title}
                                </Typography>
                              }
                              secondary={
                                <>
                                  {`${code} • ${credits} Credits`}
                                  <CourseAvailabilityChips course={course} />
                                </>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Switch
                                edge="end"
                                color="primary"
                                checked={false}
                                onChange={() =>
                                  handleToggleCourse(
                                    course.courseId || course._id,
                                  )
                                }
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                        </Paper>
                      );
                    })}
                  </List>
                </Box>
              )}
            </>
          )}
        </Box>

        <Divider />
        <Box
          sx={{
            p: 3,
            bgcolor: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            <strong>{selectedCourseIds.length}</strong> courses selected
          </Typography>
          <Button
            variant="contained"
            startIcon={
              isSaving ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Save />
              )
            }
            onClick={handleSave}
            disabled={
              isSaving ||
              isFetchingCourses ||
              drawerCurriculum.length === 0 ||
              isOverMax
            }
          >
            {isSaving
              ? "Saving..."
              : isOverMax
                ? "Over Credit Limit"
                : isBulkMode
                  ? "Confirm Bulk Enrollment"
                  : "Save Enrollments"}
          </Button>
        </Box>
      </Drawer>

      {/* ============================================================== */}
      {/* MODAL: HOD — GRANT CREDIT OVERRIDE */}
      {/* ============================================================== */}
      <Dialog
        open={isOverrideFormOpen}
        onClose={closeOverrideForm}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle fontWeight="bold">Grant Credit Override</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Raises this student's credit limit for the current section only.
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="New Max Credits"
            value={overrideForm.maxCredits}
            onChange={(e) =>
              setOverrideForm({ ...overrideForm, maxCredits: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            size="small"
            multiline
            minRows={2}
            label="Reason"
            value={overrideForm.reason}
            onChange={(e) =>
              setOverrideForm({ ...overrideForm, reason: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeOverrideForm}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={submitOverride}
            disabled={isGrantingOverride}
          >
            {isGrantingOverride ? "Granting..." : "Grant Override"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL: VIEW STUDENT COURSES (READ-ONLY) */}
      {/* ============================================================== */}
      <Dialog
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight="bold">
          Enrolled Courses
          <Typography variant="body2" color="text.secondary">
            {getStudentName(viewingStudent)} ({getRegNo(viewingStudent)})
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "#f8fafc", p: 3 }}>
          {isFetchingViewCourses ? (
            <Box py={5} textAlign="center">
              <CircularProgress />
            </Box>
          ) : viewCoursesList.length === 0 ? (
            <Typography textAlign="center" color="text.secondary" py={5}>
              This student is not enrolled in any courses.
            </Typography>
          ) : (
            <List disablePadding>
              {viewCoursesList.map((course) => {
                const title =
                  course.title || course.courseId?.title || "Unknown Course";
                const code = course.code || course.courseId?.code || "N/A";
                const credits =
                  course.credits ||
                  (course.courseId?.creditHours
                    ? course.courseId.creditHours.theory +
                      course.courseId.creditHours.lab
                    : 3);
                return (
                  <Paper
                    key={course.courseId || course._id}
                    elevation={0}
                    sx={{
                      mb: 1.5,
                      border: "1px solid #e2e8f0",
                      borderRadius: 2,
                    }}
                  >
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography fontWeight="bold" color="#1e293b">
                            {title}
                          </Typography>
                        }
                        secondary={`${code} • ${credits} Credits`}
                      />
                      <ListItemSecondaryAction>
                        <CheckCircleOutline color="success" />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </Paper>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" onClick={() => setIsViewModalOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================== */}
      {/* DRAWER: MANAGE COURSE ROSTER (assign students to ONE course) */}
      {/* ============================================================== */}
      <Drawer
        anchor="right"
        open={isRosterDrawerOpen}
        onClose={handleCloseRoster}
        PaperProps={{ sx: { width: { xs: "100%", md: 480 }, p: 0 } }}
      >
        <Box
          sx={{
            p: 3,
            bgcolor: "#059669",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Manage Course Roster
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              {rosterCourse?.courseId?.title || rosterCourse?.title || ""}
              {rosterCourse?.courseId?.code || rosterCourse?.code
                ? ` (${rosterCourse.courseId?.code || rosterCourse.code})`
                : ""}
            </Typography>
          </Box>
          <IconButton color="inherit" onClick={handleCloseRoster}>
            <Close />
          </IconButton>
        </Box>

        <Box sx={{ p: 3, pb: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search student by name or reg. no..."
            value={rosterSearch}
            onChange={(e) => setRosterSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box sx={{ px: 3, flexGrow: 1, overflowY: "auto", bgcolor: "#f8fafc" }}>
          {isFetchingRoster ? (
            <Box py={10} textAlign="center">
              <CircularProgress />
            </Box>
          ) : filteredRosterStudents.length === 0 ? (
            <Box py={10} textAlign="center" color="text.secondary">
              <Groups sx={{ fontSize: 50, opacity: 0.2, mb: 1 }} />
              <Typography>No eligible students found.</Typography>
            </Box>
          ) : (
            <>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight="bold"
                >
                  {rosterSelectedIds.length} ENROLLED
                </Typography>
                <Button size="small" onClick={handleSelectAllRosterStudents}>
                  Select / Deselect All
                </Button>
              </Box>
              <List sx={{ p: 0, pb: 2 }}>
                {filteredRosterStudents.map((student) => {
                  const isEnrolled = rosterSelectedIds.includes(student._id);
                  return (
                    <Paper
                      key={student._id}
                      elevation={0}
                      sx={{
                        mb: 1.5,
                        border: isEnrolled
                          ? "1px solid #86efac"
                          : "1px solid #e2e8f0",
                        bgcolor: isEnrolled ? "#f0fdf4" : "white",
                        borderRadius: 2,
                      }}
                    >
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography
                              fontWeight="bold"
                              color={isEnrolled ? "success.dark" : "#1e293b"}
                            >
                              {student.name}
                            </Typography>
                          }
                          secondary={student.studentId}
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            edge="end"
                            color="success"
                            checked={isEnrolled}
                            onChange={() =>
                              handleToggleRosterStudent(student._id)
                            }
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </Paper>
                  );
                })}
              </List>
            </>
          )}
        </Box>

        <Divider />
        <Box
          sx={{
            p: 3,
            bgcolor: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            <strong>{rosterSelectedIds.length}</strong> student
            {rosterSelectedIds.length === 1 ? "" : "s"} selected
          </Typography>
          <Button
            variant="contained"
            color="success"
            startIcon={
              isSavingRoster ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Save />
              )
            }
            onClick={handleSaveRoster}
            disabled={isSavingRoster || isFetchingRoster}
          >
            {isSavingRoster ? "Saving..." : "Save Roster"}
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
};

export default StudentCourseRegistrationView;
