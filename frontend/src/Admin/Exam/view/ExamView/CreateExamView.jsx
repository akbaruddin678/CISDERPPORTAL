import React from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip,
  Fade,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  AddCircleOutline,
  EditOutlined,
  DeleteOutline,
  SchoolOutlined,
  LayersOutlined,
  MenuBookOutlined,
  EventRepeatOutlined,
  AutoAwesomeOutlined,
} from "@mui/icons-material";

const STATUS_META = {
  DRAFT: { label: "Draft", bg: "#f1f5f9", text: "#475569" },
  SCHEDULED: { label: "Scheduled", bg: "#eff6ff", text: "#1d4ed8" },
  PUBLISHED: { label: "Published", bg: "#f0fdf4", text: "#15803d" },
};

const ExamSlot = ({ type, exam, onCreate, onEdit, onDelete }) => {
  if (!exam) {
    return (
      <Button
        onClick={onCreate}
        startIcon={<AddCircleOutline sx={{ fontSize: 16 }} />}
        sx={{
          flex: 1,
          minWidth: 140,
          border: "1.5px dashed #cbd5e1",
          borderRadius: 2,
          py: 1,
          color: "#2563eb",
          fontWeight: 700,
          fontSize: 12,
          textTransform: "none",
          fontFamily: "'Montserrat', sans-serif",
          "&:hover": { borderColor: "#2563eb", bgcolor: "#eff6ff" },
        }}
      >
        Create {type}
      </Button>
    );
  }

  const meta = STATUS_META[exam.publishStatus] || STATUS_META.DRAFT;
  const canModify = exam.publishStatus !== "PUBLISHED";

  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        minWidth: 140,
        border: "0.5px solid #e2e8f0",
        borderRadius: 2,
        p: 1.25,
        bgcolor: "#fff",
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={0.5}>
        <Box>
          <Typography
            fontSize={11}
            fontWeight={800}
            color="#64748b"
            fontFamily="'Montserrat', sans-serif"
            textTransform="uppercase"
          >
            {type}
          </Typography>
          <Typography
            fontSize={16}
            fontWeight={800}
            color="#0f172a"
            fontFamily="'Aleo', serif"
            lineHeight={1.3}
          >
            {exam.totalMarks} marks
          </Typography>
        </Box>
        <Box display="flex" gap={0.25}>
          {canModify && (
            <Tooltip title="Edit" arrow>
              <IconButton size="small" onClick={onEdit} sx={{ color: "#2563eb" }}>
                <EditOutlined sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          )}
          {canModify && (
            <Tooltip title="Delete" arrow>
              <IconButton size="small" onClick={onDelete} sx={{ color: "#dc2626" }}>
                <DeleteOutline sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      <Chip
        size="small"
        label={meta.label}
        sx={{
          mt: 0.5,
          bgcolor: meta.bg,
          color: meta.text,
          fontWeight: 700,
          fontSize: 10,
          fontFamily: "'Montserrat', sans-serif",
        }}
      />
      {exam.date && (
        <Typography
          fontSize={11}
          color="#64748b"
          mt={0.5}
          fontFamily="'Montserrat', sans-serif"
        >
          {new Date(exam.date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
          {exam.startTime ? ` · ${exam.startTime}` : ""}
        </Typography>
      )}
    </Paper>
  );
};

const SubjectCard = ({ subject, examTypes, onCreate, onEdit, onDelete }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      mb: 2,
      border: "0.5px solid #e2e8f0",
      borderRadius: 2.5,
      bgcolor: "#fff",
    }}
  >
    <Box display="flex" alignItems="center" gap={1} mb={1.5}>
      <MenuBookOutlined sx={{ fontSize: 18, color: "#7c3aed" }} />
      <Typography fontWeight={800} fontSize={15} color="#0f172a" fontFamily="'Aleo', serif">
        {subject.title}
      </Typography>
      <Chip
        size="small"
        label={subject.code}
        sx={{
          bgcolor: "#f5f3ff",
          color: "#6d28d9",
          fontWeight: 700,
          fontSize: 11,
          fontFamily: "'Montserrat', sans-serif",
        }}
      />
    </Box>
    <Box display="flex" gap={1.5} flexWrap="wrap">
      {examTypes.map((type) => (
        <ExamSlot
          key={type}
          type={type}
          exam={subject.examsByType[type]}
          onCreate={() => onCreate(subject, type)}
          onEdit={() => onEdit(subject, type)}
          onDelete={() => onDelete(subject.examsByType[type])}
        />
      ))}
    </Box>
  </Paper>
);

const CreateExamView = ({
  filters,
  handleFilterChange,
  departments,
  programs,
  terms,
  semesters,
  isFetchingDepartments,
  isFetchingPrograms,
  isFetchingSemesters,
  isReady,

  subjects = [],
  isFetchingSubjects,

  examTypes,
  isDateless,

  examModal,
  handleOpenExamModal,
  handleCloseExamModal,
  handleExamModalChange,
  handleSaveExam,
  handleDeleteExam,
  isSavingExam,

  bulkDialog,
  handleOpenBulkCreate,
  handleCloseBulkDialog,
  handleBulkDialogChange,
  handleGenerateBulkSchedule,
  handleUpdateBulkRow,
  handleRemoveBulkRow,
  handleSubmitBulkCreate,
  isFetchingBulkCandidates,
  isSubmittingBulk,
}) => {
  return (
    <Fade in timeout={400}>
      <Box
        sx={{
          p: { xs: 2, md: 3 },
          minHeight: "100vh",
          bgcolor: "#f8fafc",
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h5" fontWeight={800} color="#0f172a" fontFamily="'Aleo', serif">
            Create Exam
          </Typography>
          <Typography variant="body2" color="#64748b" mt={0.25} fontFamily="'Montserrat', sans-serif">
            Pick a Department, Program, Session, and Semester — then create each
            subject's Mid Term, Final Exam, or Sessional in one click.
          </Typography>
        </Box>

        {/* Filters */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            border: "0.5px solid #e2e8f0",
            borderRadius: 2,
            bgcolor: "#fff",
          }}
        >
          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }}
            gap={2}
            mb={2.5}
          >
            <TextField
              select
              size="small"
              label="1. Department"
              value={filters.departmentId}
              onChange={(e) => handleFilterChange("departmentId", e.target.value)}
              disabled={isFetchingDepartments}
              fullWidth
              sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
            >
              {departments.map((d) => (
                <MenuItem key={d._id} value={d._id} sx={{ fontSize: 13 }}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="2. Program"
              value={filters.programId}
              onChange={(e) => handleFilterChange("programId", e.target.value)}
              disabled={!filters.departmentId || isFetchingPrograms}
              fullWidth
              sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
            >
              {programs.map((p) => (
                <MenuItem key={p._id} value={p._id} sx={{ fontSize: 13 }}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="3. Session"
              value={filters.termId}
              onChange={(e) => handleFilterChange("termId", e.target.value)}
              disabled={!filters.programId}
              fullWidth
              sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
            >
              {terms.map((t) => (
                <MenuItem key={t._id} value={t._id} sx={{ fontSize: 13 }}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Semester — a visible listbox, always in numeric order */}
          <Typography
            fontSize={12}
            fontWeight={800}
            color="#94a3b8"
            textTransform="uppercase"
            fontFamily="'Montserrat', sans-serif"
            letterSpacing="0.05em"
            mb={1}
          >
            4. Semester
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
            {semesters.map((s) => {
              const isEmpty = s.activeStudentCount === 0;
              const chip = (
                <Chip
                  key={s._id}
                  label={`Semester ${s.number}`}
                  size="small"
                  onClick={() => handleFilterChange("semesterId", s._id)}
                  disabled={!filters.programId || isFetchingSemesters || isEmpty}
                  sx={{
                    fontWeight: 700,
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 12,
                    bgcolor: filters.semesterId === s._id ? "#2563eb" : "#f1f5f9",
                    color: filters.semesterId === s._id ? "#fff" : "#475569",
                    "&:hover": {
                      bgcolor: filters.semesterId === s._id ? "#2563eb" : "#e2e8f0",
                    },
                  }}
                />
              );
              // A disabled MUI component swallows pointer events, which
              // also blocks its own Tooltip from showing — wrapping in a
              // plain span keeps the "why" visible on hover.
              return isEmpty ? (
                <Tooltip key={s._id} title="No active students in this semester">
                  <span>{chip}</span>
                </Tooltip>
              ) : (
                chip
              );
            })}
            {filters.programId && !isFetchingSemesters && semesters.length === 0 && (
              <Typography
                fontSize={12}
                color="#94a3b8"
                fontFamily="'Montserrat', sans-serif"
                fontStyle="italic"
                sx={{ alignSelf: "center" }}
              >
                No semesters found for this program.
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />
          <Box display="flex" gap={1.5} flexWrap="wrap">
            <Button
              size="small"
              startIcon={<EventRepeatOutlined sx={{ fontSize: 16 }} />}
              onClick={() => handleOpenBulkCreate("semester")}
              disabled={!filters.semesterId}
              sx={{
                fontWeight: 700,
                fontSize: 12.5,
                textTransform: "none",
                fontFamily: "'Montserrat', sans-serif",
                border: "1px solid #cbd5e1",
                borderRadius: 2,
                color: "#334155",
                px: 2,
              }}
            >
              Bulk Create — This Semester
            </Button>
            <Button
              size="small"
              startIcon={<EventRepeatOutlined sx={{ fontSize: 16 }} />}
              onClick={() => handleOpenBulkCreate("program")}
              disabled={!filters.programId || !filters.termId}
              sx={{
                fontWeight: 700,
                fontSize: 12.5,
                textTransform: "none",
                fontFamily: "'Montserrat', sans-serif",
                border: "1px solid #cbd5e1",
                borderRadius: 2,
                color: "#334155",
                px: 2,
              }}
            >
              Bulk Create — Whole Program
            </Button>
          </Box>
        </Paper>

        {/* Subjects */}
        {!isReady ? (
          <Box py={8} textAlign="center" color="#94a3b8">
            <LayersOutlined sx={{ fontSize: 44, opacity: 0.25, mb: 1.5 }} />
            <Typography fontSize={14} fontWeight={700} color="#64748b">
              Select Department, Program, Session, and Semester above to see
              subjects.
            </Typography>
          </Box>
        ) : isFetchingSubjects ? (
          <Box py={10} textAlign="center">
            <CircularProgress size={30} sx={{ color: "#2563eb" }} />
          </Box>
        ) : subjects.length === 0 ? (
          <Box py={8} textAlign="center" color="#94a3b8">
            <SchoolOutlined sx={{ fontSize: 44, opacity: 0.25, mb: 1.5 }} />
            <Typography fontSize={14} fontWeight={700} color="#64748b">
              No subjects are offered in this session for this semester yet.
            </Typography>
          </Box>
        ) : (
          subjects.map((subject) => (
            <SubjectCard
              key={subject.courseId}
              subject={subject}
              examTypes={examTypes}
              onCreate={handleOpenExamModal}
              onEdit={handleOpenExamModal}
              onDelete={handleDeleteExam}
            />
          ))
        )}

        {/* Create / Edit Exam Modal */}
        <Dialog
          open={!!examModal}
          onClose={handleCloseExamModal}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          {examModal && (
            <>
              <DialogTitle sx={{ fontWeight: 800, fontFamily: "'Aleo', serif", py: 2.5 }}>
                {examModal.examId ? "Edit" : "Create"} {examModal.type}
                <Typography fontSize={12} color="#64748b" fontWeight={600} mt={0.5}>
                  {examModal.subject.code} — {examModal.subject.title}
                </Typography>
              </DialogTitle>
              <Divider />
              <DialogContent
                sx={{ py: 3, display: "flex", flexDirection: "column", gap: 2.5 }}
              >
                <TextField
                  label="Total Marks"
                  type="number"
                  size="small"
                  fullWidth
                  autoFocus
                  value={examModal.totalMarks}
                  onChange={(e) => handleExamModalChange("totalMarks", e.target.value)}
                />

                {isDateless(examModal.type) ? (
                  <Typography
                    fontSize={12}
                    color="#94a3b8"
                    fontStyle="italic"
                    fontFamily="'Montserrat', sans-serif"
                  >
                    Sessional has no fixed date — it's a running mark entered
                    from ongoing class performance.
                  </Typography>
                ) : (
                  <>
                    <TextField
                      label="Date"
                      type="date"
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={examModal.date}
                      onChange={(e) => handleExamModalChange("date", e.target.value)}
                    />
                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                      <TextField
                        label="Start Time"
                        type="time"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={examModal.startTime}
                        onChange={(e) => handleExamModalChange("startTime", e.target.value)}
                      />
                      <TextField
                        label="Duration (mins)"
                        type="number"
                        size="small"
                        fullWidth
                        value={examModal.duration}
                        onChange={(e) => handleExamModalChange("duration", e.target.value)}
                      />
                    </Box>
                  </>
                )}
              </DialogContent>
              <Divider />
              <DialogActions sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
                <Button
                  onClick={handleCloseExamModal}
                  sx={{ fontWeight: 700, color: "#64748b", textTransform: "none" }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveExam}
                  disabled={isSavingExam}
                  sx={{
                    bgcolor: "#2563eb",
                    fontWeight: 700,
                    borderRadius: 2,
                    boxShadow: "none",
                    px: 4,
                    textTransform: "none",
                  }}
                >
                  {isSavingExam
                    ? "Saving..."
                    : examModal.examId
                      ? "Save Changes"
                      : "Create Exam"}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Bulk Create Dialog — whole Semester or whole Program at once */}
        <Dialog
          open={!!bulkDialog}
          onClose={handleCloseBulkDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          {bulkDialog && (
            <>
              <DialogTitle sx={{ fontWeight: 800, fontFamily: "'Aleo', serif", py: 2.5 }}>
                Bulk Create —{" "}
                {bulkDialog.scope === "program" ? "Whole Program" : "This Semester"}
              </DialogTitle>
              <Divider />
              <DialogContent
                sx={{ py: 3, display: "flex", flexDirection: "column", gap: 2.5 }}
              >
                <Box
                  display="grid"
                  gridTemplateColumns={{
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: isDateless(bulkDialog.type) ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
                  }}
                  gap={2}
                >
                  <TextField
                    select
                    label="Exam Type"
                    size="small"
                    fullWidth
                    value={bulkDialog.type}
                    onChange={(e) => handleBulkDialogChange("type", e.target.value)}
                  >
                    {examTypes.map((t) => (
                      <MenuItem key={t} value={t} sx={{ fontSize: 13 }}>
                        {t}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Total Marks"
                    type="number"
                    size="small"
                    fullWidth
                    value={bulkDialog.totalMarks}
                    onChange={(e) => handleBulkDialogChange("totalMarks", e.target.value)}
                  />
                  {!isDateless(bulkDialog.type) && (
                    <>
                      <TextField
                        label="Start Date"
                        type="date"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={bulkDialog.startDate}
                        onChange={(e) => handleBulkDialogChange("startDate", e.target.value)}
                      />
                      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                        <TextField
                          label="Start Time"
                          type="time"
                          size="small"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          value={bulkDialog.startTime}
                          onChange={(e) =>
                            handleBulkDialogChange("startTime", e.target.value)
                          }
                        />
                        <TextField
                          label="Duration (mins)"
                          type="number"
                          size="small"
                          fullWidth
                          value={bulkDialog.duration}
                          onChange={(e) =>
                            handleBulkDialogChange("duration", e.target.value)
                          }
                        />
                      </Box>
                    </>
                  )}
                </Box>

                <Typography
                  fontSize={11.5}
                  color="#94a3b8"
                  fontFamily="'Montserrat', sans-serif"
                  fontStyle="italic"
                >
                  {isDateless(bulkDialog.type)
                    ? "Sessional has no fixed date — every eligible course just gets the same total marks."
                    : "One exam per course per day, skipping weekends, starting from the date above — edit any row below before creating."}
                </Typography>

                <Button
                  variant="outlined"
                  startIcon={<AutoAwesomeOutlined sx={{ fontSize: 16 }} />}
                  onClick={handleGenerateBulkSchedule}
                  disabled={isFetchingBulkCandidates}
                  sx={{
                    alignSelf: "flex-start",
                    textTransform: "none",
                    fontWeight: 700,
                    fontFamily: "'Montserrat', sans-serif",
                    borderRadius: 2,
                  }}
                >
                  {isFetchingBulkCandidates ? "Loading courses..." : "Generate Schedule"}
                </Button>

                {bulkDialog.rows.length > 0 && (
                  <>
                    <Typography
                      fontSize={12.5}
                      fontWeight={700}
                      color="#475569"
                      fontFamily="'Montserrat', sans-serif"
                    >
                      {bulkDialog.rows.length} exam
                      {bulkDialog.rows.length === 1 ? "" : "s"} will be created
                      {bulkDialog.scope === "program" &&
                        ` across ${new Set(bulkDialog.rows.map((r) => r.semesterNumber)).size} semester(s)`}
                      .
                    </Typography>
                    <TableContainer
                      sx={{ maxHeight: 340, border: "0.5px solid #e2e8f0", borderRadius: 2 }}
                    >
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 800, fontSize: 11, bgcolor: "#f8fafc" }}>
                              Course
                            </TableCell>
                            {bulkDialog.scope === "program" && (
                              <TableCell sx={{ fontWeight: 800, fontSize: 11, bgcolor: "#f8fafc" }}>
                                Sem
                              </TableCell>
                            )}
                            {!isDateless(bulkDialog.type) && (
                              <>
                                <TableCell sx={{ fontWeight: 800, fontSize: 11, bgcolor: "#f8fafc" }}>
                                  Date
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: 11, bgcolor: "#f8fafc" }}>
                                  Start Time
                                </TableCell>
                              </>
                            )}
                            <TableCell sx={{ fontWeight: 800, fontSize: 11, bgcolor: "#f8fafc" }}>
                              Marks
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, fontSize: 11, bgcolor: "#f8fafc" }} />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {bulkDialog.rows.map((row, idx) => (
                            <TableRow key={`${row.courseId}-${row.semesterId}`}>
                              <TableCell sx={{ fontSize: 12.5 }}>
                                <strong>{row.code}</strong> — {row.title}
                              </TableCell>
                              {bulkDialog.scope === "program" && (
                                <TableCell sx={{ fontSize: 12.5 }}>
                                  {row.semesterNumber ?? "—"}
                                </TableCell>
                              )}
                              {!isDateless(bulkDialog.type) && (
                                <>
                                  <TableCell>
                                    <TextField
                                      type="date"
                                      size="small"
                                      value={row.date}
                                      onChange={(e) =>
                                        handleUpdateBulkRow(idx, "date", e.target.value)
                                      }
                                      sx={{
                                        width: 150,
                                        "& .MuiOutlinedInput-input": { fontSize: 12.5, py: 0.75 },
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <TextField
                                      type="time"
                                      size="small"
                                      value={row.startTime}
                                      onChange={(e) =>
                                        handleUpdateBulkRow(idx, "startTime", e.target.value)
                                      }
                                      sx={{
                                        width: 120,
                                        "& .MuiOutlinedInput-input": { fontSize: 12.5, py: 0.75 },
                                      }}
                                    />
                                  </TableCell>
                                </>
                              )}
                              <TableCell>
                                <TextField
                                  type="number"
                                  size="small"
                                  value={row.totalMarks}
                                  onChange={(e) =>
                                    handleUpdateBulkRow(idx, "totalMarks", e.target.value)
                                  }
                                  sx={{
                                    width: 80,
                                    "& .MuiOutlinedInput-input": { fontSize: 12.5, py: 0.75 },
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveBulkRow(idx)}
                                  sx={{ color: "#dc2626" }}
                                >
                                  <DeleteOutline sx={{ fontSize: 16 }} />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </DialogContent>
              <Divider />
              <DialogActions sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
                <Button
                  onClick={handleCloseBulkDialog}
                  sx={{ fontWeight: 700, color: "#64748b", textTransform: "none" }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmitBulkCreate}
                  disabled={isSubmittingBulk || bulkDialog.rows.length === 0}
                  sx={{
                    bgcolor: "#2563eb",
                    fontWeight: 700,
                    borderRadius: 2,
                    boxShadow: "none",
                    px: 4,
                    textTransform: "none",
                  }}
                >
                  {isSubmittingBulk
                    ? "Creating..."
                    : `Create & Publish ${bulkDialog.rows.length} Exam${bulkDialog.rows.length === 1 ? "" : "s"}`}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Fade>
  );
};

export default CreateExamView;
