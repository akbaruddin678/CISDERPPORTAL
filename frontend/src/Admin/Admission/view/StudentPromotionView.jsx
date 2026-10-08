import React, { useState } from "react";
import {
  Box,
  Paper,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Divider,
  Container,
  Stack,
  Tooltip,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  School,
  WarningAmber,
  MoneyOff,
  Send,
  Close,
  Person,
  VerifiedUser,
} from "@mui/icons-material";

// ---- Shared style tokens (keep in sync with other pages) ----
const CARD_SX = {
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 2,
  bgcolor: "background.paper",
};

const STATUS_DOT = {
  active: "#22c55e",
  inactive: "#ef4444",
  default: "#94a3b8",
};

const StatusDot = ({ label }) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={0.75}
    justifyContent="center"
  >
    <Box
      sx={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        bgcolor: STATUS_DOT[label] || STATUS_DOT.default,
        flexShrink: 0,
      }}
    />
    <Typography
      variant="caption"
      fontWeight={600}
      sx={{ textTransform: "capitalize" }}
    >
      {label}
    </Typography>
  </Stack>
);

const StudentPromotionView = ({
  students,
  loadingStudents,
  catalogData,
  filters,
  setFilters,
  selectedStudentIds,
  fullCatalog,
  targetDepartmentId,
  targetProgramId,
  targetSemesterId,
  targetSessionId,
  availableTargetPrograms,
  availableTargetSemesters,
  isProcessing,
  feedback,
  defaulterModal,
  setTargetSemesterId,
  setTargetSessionId,
  handleTargetDepartmentChange,
  handleTargetProgramChange,
  handleSelectAll,
  handleSelectOne,
  handleBulkAction,
  handleRequestOverride,
  closeFeedback,
  closeDefaulterModal,
}) => {
  const isAllSelected =
    students.length > 0 && selectedStudentIds.length === students.length;
  const [overrideRemarks, setOverrideRemarks] = useState("");

  const currentSessionName = catalogData.sessions.find(
    (s) => s._id === filters.sessionId,
  )?.name;

  return (
    <Box sx={{ bgcolor: "#f8fafc", minHeight: "100vh", pb: 6 }}>
      {/* --- Slim page header --- */}
      <Box
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 2.5 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Student Promotions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Move students between sections and manage fee overrides
              </Typography>
            </Box>
            {students.length > 0 && (
              <Chip
                size="small"
                label={`${selectedStudentIds.length} of ${students.length} selected`}
                sx={{ fontWeight: 600, bgcolor: "#f1f5f9" }}
              />
            )}
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ pt: 3 }}>
        <Grid container spacing={2.5}>
          {/* --- Filters --- */}
          <Grid item xs={12} md={7}>
            <Paper elevation={0} sx={{ ...CARD_SX, p: 2.5, height: "100%" }}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ mb: 0.25 }}
              >
                Source cohort
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Choose the students you want to promote or demote
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Class</InputLabel>
                    <Select
                      value={filters.departmentId}
                      label="Class"
                      onChange={(e) =>
                        setFilters({ ...filters, departmentId: e.target.value })
                      }
                    >
                      <MenuItem value="">
                        <em>All classes</em>
                      </MenuItem>
                      {catalogData.departments.map((d) => (
                        <MenuItem key={d._id} value={d._id}>
                          {d.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl
                    fullWidth
                    size="small"
                    disabled={!filters.departmentId}
                  >
                    <InputLabel>Program</InputLabel>
                    <Select
                      value={filters.programId}
                      label="Program"
                      onChange={(e) =>
                        setFilters({ ...filters, programId: e.target.value })
                      }
                    >
                      <MenuItem value="">
                        <em>All programs</em>
                      </MenuItem>
                      {catalogData.programs.map((p) => (
                        <MenuItem key={p._id} value={p._id}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl
                    fullWidth
                    size="small"
                    disabled={!filters.programId}
                  >
                    <InputLabel>Current section</InputLabel>
                    <Select
                      value={filters.semesterId}
                      label="Current section"
                      onChange={(e) =>
                        setFilters({ ...filters, semesterId: e.target.value })
                      }
                    >
                      <MenuItem value="">
                        <em>Choose section</em>
                      </MenuItem>
                      {catalogData.semesters.map((s) => (
                        <MenuItem key={s._id} value={s._id}>
                          {s.name || `Section ${s.number}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Current session</InputLabel>
                    <Select
                      value={filters.sessionId}
                      label="Current session"
                      onChange={(e) =>
                        setFilters({ ...filters, sessionId: e.target.value })
                      }
                    >
                      <MenuItem value="">
                        <em>Choose session</em>
                      </MenuItem>
                      {catalogData.sessions.map((s) => (
                        <MenuItem key={s._id} value={s._id}>
                          {s.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box
                sx={{
                  mt: 2,
                  p: 1.25,
                  borderRadius: 1.5,
                  border: "1px dashed",
                  borderColor: filters.newAdmissionsOnly ? "#0891b2" : "divider",
                  bgcolor: filters.newAdmissionsOnly ? "#ecfeff" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <VerifiedUser
                    sx={{ fontSize: 18, color: filters.newAdmissionsOnly ? "#0891b2" : "text.disabled" }}
                  />
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      New Admissions Only
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Show only students from a confirmed (accepted) admission
                    </Typography>
                  </Box>
                </Stack>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={Boolean(filters.newAdmissionsOnly)}
                      onChange={(e) =>
                        setFilters({ ...filters, newAdmissionsOnly: e.target.checked })
                      }
                    />
                  }
                  label=""
                  sx={{ m: 0 }}
                />
              </Box>

              {students.length > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 2, display: "block" }}
                >
                  {students.length} student(s) match this filter
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* --- Target action panel --- */}
          <Grid item xs={12} md={5}>
            <Paper elevation={0} sx={{ ...CARD_SX, p: 2.5, height: "100%" }}>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ mb: 0.25 }}
              >
                Move to
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Where selected students will go
              </Typography>

              <Stack spacing={2} sx={{ mt: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Target class</InputLabel>
                  <Select
                    value={targetDepartmentId}
                    label="Target class"
                    onChange={(e) => handleTargetDepartmentChange(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select target class</em>
                    </MenuItem>
                    {fullCatalog.departments.map((d) => (
                      <MenuItem key={d._id} value={d._id}>
                        {d.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Target program</InputLabel>
                  <Select
                    value={targetProgramId}
                    label="Target program"
                    onChange={(e) => handleTargetProgramChange(e.target.value)}
                    disabled={!targetDepartmentId}
                  >
                    <MenuItem value="">
                      <em>Select target program</em>
                    </MenuItem>
                    {availableTargetPrograms.map((p) => (
                      <MenuItem key={p._id} value={p._id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Target section</InputLabel>
                  <Select
                    value={targetSemesterId}
                    label="Target section"
                    onChange={(e) => setTargetSemesterId(e.target.value)}
                    disabled={!targetProgramId}
                  >
                    <MenuItem value="">
                      <em>Select target section</em>
                    </MenuItem>
                    {availableTargetSemesters.map((s) => (
                      <MenuItem key={s._id} value={s._id}>
                        {s.name || `Section ${s.number}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Target session</InputLabel>
                  <Select
                    value={targetSessionId}
                    label="Target session"
                    onChange={(e) => setTargetSessionId(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select target session</em>
                    </MenuItem>
                    {fullCatalog.sessions.map((s) => (
                      <MenuItem key={s._id} value={s._id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {currentSessionName && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                      Current session: {currentSessionName}
                    </Typography>
                  )}
                </FormControl>

                <Stack direction="row" spacing={1.5}>
                  <Tooltip
                    title={
                      selectedStudentIds.length === 0
                        ? "Select students first"
                        : "Move to a lower semester"
                    }
                  >
                    <span style={{ flex: 1 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        startIcon={<TrendingDown fontSize="small" />}
                        disabled={
                          selectedStudentIds.length === 0 || isProcessing
                        }
                        onClick={() => handleBulkAction("demote")}
                        sx={{ fontWeight: 600, textTransform: "none" }}
                      >
                        Demote
                      </Button>
                    </span>
                  </Tooltip>

                  <Tooltip
                    title={
                      selectedStudentIds.length === 0
                        ? "Select students first"
                        : "Move to a higher semester"
                    }
                  >
                    <span style={{ flex: 1 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        disableElevation
                        startIcon={
                          isProcessing ? (
                            <CircularProgress
                              size={16}
                              sx={{ color: "white" }}
                            />
                          ) : (
                            <TrendingUp fontSize="small" />
                          )
                        }
                        disabled={
                          selectedStudentIds.length === 0 || isProcessing
                        }
                        onClick={() => handleBulkAction("promote")}
                        sx={{ fontWeight: 600, textTransform: "none" }}
                      >
                        Promote
                      </Button>
                    </span>
                  </Tooltip>
                </Stack>
              </Stack>
            </Paper>
          </Grid>

          {/* --- Student roster --- */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ ...CARD_SX, overflow: "hidden" }}>
              <Box
                sx={{
                  px: 2.5,
                  py: 1.75,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="subtitle1" fontWeight={700}>
                  Student roster
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {students.length} student(s)
                </Typography>
              </Box>

              <TableContainer sx={{ maxHeight: 620, overflowX: "auto" }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{ bgcolor: "#f8fafc" }}>
                        <Checkbox
                          checked={isAllSelected}
                          indeterminate={
                            selectedStudentIds.length > 0 &&
                            selectedStudentIds.length < students.length
                          }
                          onChange={handleSelectAll}
                          disabled={students.length === 0}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ bgcolor: "#f8fafc", fontWeight: 700 }}>
                        ID
                      </TableCell>
                      <TableCell sx={{ bgcolor: "#f8fafc", fontWeight: 700 }}>
                        Name
                      </TableCell>
                      <TableCell sx={{ bgcolor: "#f8fafc", fontWeight: 700 }}>
                        Current
                      </TableCell>
                      <TableCell
                        sx={{
                          bgcolor: "#f8fafc",
                          fontWeight: 700,
                          textAlign: "center",
                        }}
                      >
                        CGPA
                      </TableCell>
                      <TableCell
                        sx={{
                          bgcolor: "#f8fafc",
                          fontWeight: 700,
                          textAlign: "center",
                        }}
                      >
                        Status
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {loadingStudents ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          align="center"
                          sx={{ py: 6, border: 0 }}
                        >
                          <Stack alignItems="center" spacing={1.5}>
                            <CircularProgress size={28} />
                            <Typography variant="body2" color="text.secondary">
                              Loading students…
                            </Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ) : students.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          align="center"
                          sx={{ py: 7, border: 0 }}
                        >
                          <Stack alignItems="center" spacing={1}>
                            <School
                              sx={{ fontSize: 40, color: "text.disabled" }}
                            />
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="text.secondary"
                            >
                              No students found
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Complete the filters above to view a cohort
                            </Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map((student) => {
                        const isSelected =
                          selectedStudentIds.indexOf(student._id) !== -1;
                        return (
                          <TableRow
                            key={student._id}
                            hover
                            selected={isSelected}
                            onClick={() =>
                              handleSelectOne(
                                { target: { checked: !isSelected } },
                                student._id,
                              )
                            }
                            sx={{
                              cursor: "pointer",
                              "&.Mui-selected": {
                                bgcolor: "#eff6ff !important",
                              },
                            }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={isSelected}
                                onChange={(e) =>
                                  handleSelectOne(e, student._id)
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell
                              sx={{
                                fontFamily: "monospace",
                                fontSize: "0.8rem",
                              }}
                            >
                              {student.studentId}
                            </TableCell>
                            <TableCell>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1.25}
                              >
                                <Avatar
                                  src={student.profilePhoto}
                                  sx={{
                                    width: 30,
                                    height: 30,
                                    fontSize: 13,
                                    bgcolor: "#e2e8f0",
                                    color: "#475569",
                                  }}
                                >
                                  {student.personalInfo?.fullName?.charAt(0) ||
                                    "S"}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>
                                    {student.personalInfo?.fullName}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {student.program?.code}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  student.semester?.name ||
                                  `Section ${student.semester?.number}`
                                }
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 600, borderRadius: 1 }}
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: "center" }}>
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                sx={{
                                  color:
                                    student.academicInfo?.cgpa >= 3.0
                                      ? "#16a34a"
                                      : "#dc2626",
                                }}
                              >
                                {student.academicInfo?.cgpa?.toFixed(2) || "—"}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ textAlign: "center" }}>
                              <StatusDot label={student.status} />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* --- Defaulter modal --- */}
      <Dialog
        open={defaulterModal.open}
        onClose={closeDefaulterModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontWeight: 700,
            fontSize: "1.05rem",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <WarningAmber sx={{ fontSize: 22, color: "#f59e0b" }} />
          Fee issue detected
          <IconButton
            onClick={closeDefaulterModal}
            size="small"
            sx={{ ml: "auto" }}
          >
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box
            sx={{ p: 2.5, borderBottom: "1px solid", borderColor: "divider" }}
          >
            <Typography variant="body2" color="text.secondary">
              <strong>{defaulterModal.list.length} student(s)</strong> have
              unpaid fees for the current section. Promotion can't proceed
              until this is resolved or overridden.
            </Typography>
          </Box>

          <List sx={{ maxHeight: 260, overflow: "auto", py: 0 }}>
            {defaulterModal.list.map((defaulter, idx) => (
              <React.Fragment key={defaulter.id}>
                <ListItem sx={{ px: 2.5, py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: "#fef2f2",
                        color: "#dc2626",
                        width: 34,
                        height: 34,
                      }}
                    >
                      <MoneyOff fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={600}>
                        {defaulter.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="error.main">
                        {defaulter.reason}
                      </Typography>
                    }
                  />
                </ListItem>
                {idx < defaulterModal.list.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>

          <Box sx={{ p: 2.5, borderTop: "1px solid", borderColor: "divider" }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{ mb: 0.5 }}
            >
              <Person fontSize="small" color="action" />
              <Typography variant="subtitle2" fontWeight={700}>
                Request accountant override
              </Typography>
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1.5 }}
            >
              Add payment proof, bank reference, or context for Accounts to
              review.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              placeholder="E.g. Challan paid via bank transfer on [date], awaiting clearance…"
              value={overrideRemarks}
              onChange={(e) => setOverrideRemarks(e.target.value)}
            />
          </Box>
        </DialogContent>

        <DialogActions
          sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}
        >
          <Button
            onClick={closeDefaulterModal}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleRequestOverride(overrideRemarks)}
            variant="contained"
            disableElevation
            endIcon={<Send fontSize="small" />}
            disabled={!overrideRemarks.trim()}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Send request
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- Feedback --- */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={5000}
        onClose={closeFeedback}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={closeFeedback}
          severity={feedback.severity}
          variant="filled"
          sx={{ width: "100%", fontWeight: 600 }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentPromotionView;
