import React, { useState, useMemo, useEffect } from "react";
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
  InputAdornment,
  Tooltip,
  Divider,
  Alert,
  Snackbar,
  Checkbox,
  alpha,
  Fade,
  Stack,
} from "@mui/material";
import {
  Plus,
  Trash2,
  Search,
  FileText,
  Inbox,
  Edit,
  Download,
  FileSpreadsheet,
  ChevronDown,
  X,
  CheckSquare,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ─── Status config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  DRAFT: { label: "Needs Code", bg: "#fffbeb", text: "#b45309" },
  ACTIVE: { label: "Active", bg: "#f0fdf4", text: "#15803d" },
  RETIRED: { label: "Retired", bg: "#f1f5f9", text: "#475569" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1.25,
        py: 0.4,
        borderRadius: "100px",
        fontSize: 11,
        fontWeight: 600,
        bgcolor: cfg.bg,
        color: cfg.text,
        border: `0.5px solid ${alpha(cfg.text, 0.25)}`,
      }}
    >
      {cfg.label}
    </Box>
  );
};

// ─── PDF helpers ────────────────────────────────────────────────────────────────
const buildPdfDoc = (courses, title = "Course Catalog") => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 14);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - 14, 14, {
    align: "right",
  });

  const rows = courses.map((c, i) => [
    i + 1,
    c.title || "—",
    c.code || "Unassigned",
    c.owningDepartmentId?.name || "N/A",
    c.level || "—",
    `${c.creditHours?.theory ?? 0}Th + ${c.creditHours?.lab ?? 0}Lab`,
    STATUS_CONFIG[c.status]?.label || c.status,
    (c.courseContent || "").slice(0, 120) +
      (c.courseContent?.length > 120 ? "…" : ""),
  ]);

  autoTable(doc, {
    startY: 28,
    head: [
      [
        "#",
        "Course Title",
        "Code",
        "Department",
        "Level",
        "Credits",
        "Status",
        "Content Preview",
      ],
    ],
    body: rows,
    styles: { fontSize: 8, font: "helvetica", cellPadding: 3, valign: "middle" },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 50 },
      2: { cellWidth: 25 },
      3: { cellWidth: 35 },
      4: { cellWidth: 18 },
      5: { cellWidth: 28 },
      6: { cellWidth: 25 },
      7: { cellWidth: "auto" },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 6,
        { align: "center" },
      );
    },
  });

  return doc;
};

const exportAllPDF = (courses, tabLabel) => {
  const doc = buildPdfDoc(courses, `${tabLabel} — All Courses`);
  doc.save(
    `courses_${tabLabel.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}.pdf`,
  );
};

const exportSinglePDF = (course) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(course.title || "Course", 14, 18);

  let y = 40;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  const meta = [
    ["Code", course.code || "Unassigned"],
    ["Level", course.level || "—"],
    ["Department", course.owningDepartmentId?.name || "N/A"],
    [
      "Credits",
      `${course.creditHours?.theory ?? 0} Theory + ${course.creditHours?.lab ?? 0} Lab`,
    ],
    ["Status", STATUS_CONFIG[course.status]?.label || course.status],
  ];
  meta.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`${k}:`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(v, 45, y);
    y += 8;
  });

  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, pageW - 14, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text("Course Content / Syllabus", 14, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const lines = doc.splitTextToSize(
    course.courseContent || "No content provided.",
    pageW - 28,
  );
  doc.text(lines, 14, y);

  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    pageW / 2,
    doc.internal.pageSize.getHeight() - 8,
    { align: "center" },
  );

  doc.save(
    `course_${(course.title || "course").replace(/\s+/g, "_").toLowerCase()}_${Date.now()}.pdf`,
  );
};

const exportSelectedPDF = (courses) => {
  const doc = buildPdfDoc(courses, "Selected Courses Export");
  doc.save(`courses_selected_${Date.now()}.pdf`);
};

// ─── Excel helpers ───────────────────────────────────────────────────────────────
const exportAllExcel = (courses, tabLabel) => {
  const rows = courses.map((c) => ({
    "Course Title": c.title,
    Code: c.code || "Unassigned",
    Department: c.owningDepartmentId?.name || "N/A",
    Level: c.level || "—",
    "Theory Hrs": c.creditHours?.theory ?? 0,
    "Lab Hrs": c.creditHours?.lab ?? 0,
    Status: STATUS_CONFIG[c.status]?.label || c.status,
    "Course Content": c.courseContent || "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, tabLabel.slice(0, 31));
  XLSX.writeFile(
    wb,
    `courses_${tabLabel.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}.xlsx`,
  );
};

const exportSelectedExcel = (courses) => {
  const rows = courses.map((c) => ({
    "Course Title": c.title,
    Code: c.code || "Unassigned",
    Department: c.owningDepartmentId?.name || "N/A",
    Level: c.level || "—",
    "Theory Hrs": c.creditHours?.theory ?? 0,
    "Lab Hrs": c.creditHours?.lab ?? 0,
    Status: STATUS_CONFIG[c.status]?.label || c.status,
    "Course Content": c.courseContent || "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Selected");
  XLSX.writeFile(wb, `courses_selected_${Date.now()}.xlsx`);
};

// ─── Export Dropdown Component ────────────────────────────────────────────────────
const ExportMenu = ({ label, icon: Icon, color, items }) => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <Box ref={ref} sx={{ position: "relative" }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<Icon size={14} />}
        endIcon={<ChevronDown size={12} />}
        onClick={() => setOpen((p) => !p)}
        sx={{
          borderColor: color,
          color,
          fontWeight: 600,
          fontFamily: "'Montserrat', sans-serif",
          fontSize: 12,
          textTransform: "none",
          px: 1.5,
        }}
      >
        {label}
      </Button>
      {open && (
        <Paper
          elevation={4}
          sx={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 1300,
            minWidth: 200,
            borderRadius: 2,
            overflow: "hidden",
            border: "0.5px solid #e2e8f0",
          }}
        >
          {items.map((item) => (
            <Box
              key={item.label}
              onClick={() => {
                item.action();
                setOpen(false);
              }}
              sx={{
                px: 2,
                py: 1.25,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                color: "#334155",
                fontFamily: "'Montserrat', sans-serif",
                "&:hover": { bgcolor: "#f1f5f9" },
              }}
            >
              <item.icon size={14} color={color} />
              {item.label}
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
};

// ─── Create / Edit Modal ─────────────────────────────────────────────────────────
const CourseFormModal = ({
  open,
  onClose,
  departments,
  isSaving,
  onSubmit,
  initialData,
}) => {
  const [localForm, setLocalForm] = useState(initialData);
  useEffect(() => {
    if (open) setLocalForm(initialData);
  }, [initialData, open]);

  const f = (field, val) => setLocalForm((p) => ({ ...p, [field]: val }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 800, fontFamily: "'Aleo', serif", py: 2.5 }}>
        {localForm._id ? "Edit Course" : "Create New Course"}
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ py: 3 }}>
        <Box display="flex" flexDirection="column" gap={2.5}>
          <TextField
            label="Course Title"
            fullWidth
            size="small"
            value={localForm.title || ""}
            onChange={(e) => f("title", e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": { fontFamily: "'Montserrat', sans-serif" },
            }}
          />
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Level"
              value={localForm.level || ""}
              onChange={(e) => f("level", e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": { fontFamily: "'Montserrat', sans-serif" },
              }}
            >
              <MenuItem value="UG">Undergraduate (UG)</MenuItem>
              <MenuItem value="MS">Masters (MS)</MenuItem>
              <MenuItem value="PHD">PhD</MenuItem>
              <MenuItem value="CIS">Intermediate (CIS)</MenuItem>
            </TextField>
            <TextField
              select
              fullWidth
              size="small"
              label="Department"
              value={localForm.owningDepartmentId || ""}
              onChange={(e) => f("owningDepartmentId", e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": { fontFamily: "'Montserrat', sans-serif" },
              }}
            >
              {departments.map((d) => (
                <MenuItem key={d._id} value={d._id}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <TextField
              type="number"
              fullWidth
              size="small"
              label="Theory Credit Hours"
              value={localForm.theory || ""}
              onChange={(e) => f("theory", e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": { fontFamily: "'Montserrat', sans-serif" },
              }}
            />
            <TextField
              type="number"
              fullWidth
              size="small"
              label="Lab Credit Hours"
              value={localForm.lab || ""}
              onChange={(e) => f("lab", e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": { fontFamily: "'Montserrat', sans-serif" },
              }}
            />
          </Box>
          <TextField
            label="Course Content / Syllabus Details"
            fullWidth
            multiline
            rows={6}
            placeholder="Enter course topics, grading criteria, objectives, and weekly breakdown…"
            value={localForm.courseContent || ""}
            onChange={(e) => f("courseContent", e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 14,
              },
            }}
          />
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
        <Button
          onClick={onClose}
          sx={{
            color: "#64748b",
            fontWeight: 700,
            fontFamily: "'Montserrat', sans-serif",
            textTransform: "none",
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => onSubmit(localForm)}
          disabled={isSaving}
          sx={{
            bgcolor: "#2563eb",
            fontWeight: 700,
            boxShadow: "none",
            fontFamily: "'Montserrat', sans-serif",
            textTransform: "none",
            px: 3,
          }}
        >
          {isSaving ? "Saving…" : "Save Course"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── View Content Dialog ─────────────────────────────────────────────────────────
const ViewContentDialog = ({ open, onClose, course }) => {
  if (!course) return null;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          pt: 3,
          pb: 1,
        }}
      >
        <Box>
          <Typography
            fontWeight={800}
            fontSize={17}
            fontFamily="'Aleo', serif"
            color="#0f172a"
          >
            {course.title}
          </Typography>
          <Stack direction="row" spacing={1} mt={0.75} flexWrap="wrap">
            <Chip
              size="small"
              label={course.code || "No Code"}
              sx={{ bgcolor: "#f0fdf4", color: "#15803d", fontWeight: 700, fontSize: 11 }}
            />
            <Chip
              size="small"
              label={course.level || "—"}
              sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 700, fontSize: 11 }}
            />
            <Chip
              size="small"
              label={`${course.creditHours?.theory ?? 0}Th + ${course.creditHours?.lab ?? 0}Lab`}
              sx={{ bgcolor: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: 11 }}
            />
            <StatusBadge status={course.status} />
          </Stack>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#94a3b8" }}>
          <X size={18} />
        </IconButton>
      </Box>
      <Divider sx={{ mt: 2 }} />
      <DialogContent sx={{ py: 3 }}>
        {course.courseContent ? (
          <Typography
            sx={{
              fontFamily: "'Montserrat', sans-serif",
              whiteSpace: "pre-wrap",
              fontSize: 14,
              color: "#334155",
              lineHeight: 1.85,
            }}
          >
            {course.courseContent}
          </Typography>
        ) : (
          <Box py={4} textAlign="center" color="#94a3b8">
            <FileText size={32} style={{ marginBottom: 8 }} />
            <Typography fontSize={13} fontFamily="'Montserrat', sans-serif">
              No syllabus content added yet.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2, bgcolor: "#f8fafc", gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Download size={14} />}
          onClick={() => exportSinglePDF(course)}
          sx={{
            fontWeight: 700,
            color: "#dc2626",
            borderColor: "#fca5a5",
            fontFamily: "'Montserrat', sans-serif",
            textTransform: "none",
          }}
        >
          Download PDF
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: "#1e293b",
            fontWeight: 700,
            boxShadow: "none",
            borderRadius: 2,
            fontFamily: "'Montserrat', sans-serif",
            textTransform: "none",
            px: 3,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Bulk Action Bar ─────────────────────────────────────────────────────────────
const BulkActionBar = ({ count, onClear, onPDF, onExcel }) => (
  <Fade in={count > 0}>
    <Paper
      elevation={3}
      sx={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1400,
        borderRadius: 3,
        px: 3,
        py: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 2,
        bgcolor: "#1e293b",
        color: "#fff",
        minWidth: 380,
        border: "0.5px solid #334155",
      }}
    >
      <CheckSquare size={18} color="#60a5fa" />
      <Typography
        fontFamily="'Montserrat', sans-serif"
        fontSize={13}
        fontWeight={700}
        color="#f1f5f9"
        flex={1}
      >
        {count} course{count > 1 ? "s" : ""} selected
      </Typography>
      <Button
        size="small"
        startIcon={<Download size={13} />}
        onClick={onPDF}
        sx={{
          color: "#fca5a5",
          fontWeight: 700,
          fontSize: 12,
          fontFamily: "'Montserrat', sans-serif",
          textTransform: "none",
        }}
      >
        PDF
      </Button>
      <Button
        size="small"
        startIcon={<FileSpreadsheet size={13} />}
        onClick={onExcel}
        sx={{
          color: "#6ee7b7",
          fontWeight: 700,
          fontSize: 12,
          fontFamily: "'Montserrat', sans-serif",
          textTransform: "none",
        }}
      >
        Excel
      </Button>
      <IconButton size="small" onClick={onClear} sx={{ color: "#94a3b8" }}>
        <X size={16} />
      </IconButton>
    </Paper>
  </Fade>
);

// ─── Main View ───────────────────────────────────────────────────────────────────
const CourseCatalogView = ({
  departments = [],
  filteredCourses = [],
  isFetchingCourses = false,
  searchQuery = "",
  setSearchQuery = () => {},
  isModalOpen = false,
  setIsModalOpen = () => {},
  handleSaveDraft = () => {},
  handleOpenCreateModal = () => {},
  handleEditClick = () => {},
  isSaving = false,
  handleDelete = () => {},
  form = {},
  viewContentOpen = false,
  setViewContentOpen = () => {},
  contentToView = "",
  handleViewContent = () => {},
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [toast, setToast] = useState({ open: false, msg: "", severity: "success" });
  const [selectedIds, setSelectedIds] = useState(new Set());

  const showToast = (msg, severity = "success") =>
    setToast({ open: true, msg, severity });

  const needsCode = useMemo(
    () => filteredCourses.filter((c) => c.status === "DRAFT"),
    [filteredCourses],
  );
  const activeAndRetired = useMemo(
    () => filteredCourses.filter((c) => c.status !== "DRAFT"),
    [filteredCourses],
  );
  const displayedCourses = activeTab === 0 ? needsCode : activeAndRetired;
  const tabLabel = activeTab === 0 ? "Needs Code" : "Active / Retired";

  const toggleSelect = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleSelectAll = () => {
    if (selectedIds.size === displayedCourses.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(displayedCourses.map((c) => c._id)));
  };
  const clearSelection = () => setSelectedIds(new Set());

  const selectedCourses = displayedCourses.filter((c) => selectedIds.has(c._id));

  useEffect(() => setSelectedIds(new Set()), [activeTab]);

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
        {/* ── Header ── */}
        <Box
          mb={3}
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          flexWrap="wrap"
          gap={2}
        >
          <Box>
            <Typography
              variant="h5"
              fontWeight={800}
              color="#0f172a"
              sx={{ fontFamily: "'Aleo', serif" }}
            >
              Course Catalog
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontFamily: "'Montserrat', sans-serif", mt: 0.25 }}
            >
              Create new courses for any department. Registrar assigns the
              official code, which activates the course.
            </Typography>
          </Box>

          <Box display="flex" gap={1.5} alignItems="center">
            <ExportMenu
              label="PDF"
              icon={Download}
              color="#dc2626"
              items={[
                {
                  label: "Export All (This Tab)",
                  icon: Download,
                  action: () => {
                    exportAllPDF(displayedCourses, tabLabel);
                    showToast("PDF exported successfully.");
                  },
                },
                {
                  label: "Export Selected",
                  icon: CheckSquare,
                  action: () => {
                    if (!selectedIds.size) {
                      showToast("Select at least one course.", "warning");
                      return;
                    }
                    exportSelectedPDF(selectedCourses);
                    showToast("Selected PDF exported.");
                  },
                },
              ]}
            />
            <ExportMenu
              label="Excel"
              icon={FileSpreadsheet}
              color="#059669"
              items={[
                {
                  label: "Export All (This Tab)",
                  icon: FileSpreadsheet,
                  action: () => {
                    exportAllExcel(displayedCourses, tabLabel);
                    showToast("Excel exported successfully.");
                  },
                },
                {
                  label: "Export Selected",
                  icon: CheckSquare,
                  action: () => {
                    if (!selectedIds.size) {
                      showToast("Select at least one course.", "warning");
                      return;
                    }
                    exportSelectedExcel(selectedCourses);
                    showToast("Selected Excel exported.");
                  },
                },
              ]}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<Plus size={15} />}
              onClick={handleOpenCreateModal}
              sx={{
                bgcolor: "#2563eb",
                fontWeight: 700,
                boxShadow: "none",
                fontFamily: "'Montserrat', sans-serif",
                textTransform: "none",
                px: 2,
              }}
            >
              New Course
            </Button>
          </Box>
        </Box>

        {/* ── Tabs + Search ── */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            mb: 2.5,
            border: "0.5px solid #e2e8f0",
            borderRadius: 2,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              bgcolor: "#f1f5f9",
              borderRadius: 1.5,
              p: 0.4,
              display: "inline-flex",
            }}
          >
            {["Needs Code", "Active / Retired"].map((label, idx) => (
              <Box
                key={label}
                onClick={() => setActiveTab(idx)}
                sx={{
                  px: 2.5,
                  py: 1,
                  borderRadius: 1.5,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  bgcolor: activeTab === idx ? "#fff" : "transparent",
                  color: activeTab === idx ? "#1e293b" : "#64748b",
                  border:
                    activeTab === idx
                      ? "0.5px solid #e2e8f0"
                      : "0.5px solid transparent",
                  fontFamily: "'Montserrat', sans-serif",
                  transition: "all 0.15s",
                }}
              >
                {label} ({idx === 0 ? needsCode.length : activeAndRetired.length})
              </Box>
            ))}
          </Box>

          <TextField
            size="small"
            placeholder="Search courses…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              maxWidth: 280,
              "& .MuiOutlinedInput-root": {
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 13,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={14} color="#94a3b8" />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* ── Selection Info Bar ── */}
        {selectedIds.size > 0 && (
          <Box
            mb={1.5}
            px={2}
            py={1}
            borderRadius={2}
            bgcolor="#eff6ff"
            border="0.5px solid #bfdbfe"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography
              fontSize={13}
              fontWeight={700}
              color="#1d4ed8"
              fontFamily="'Montserrat', sans-serif"
            >
              {selectedIds.size} of {displayedCourses.length} courses selected
            </Typography>
            <Button
              size="small"
              onClick={clearSelection}
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: "#64748b",
                textTransform: "none",
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              Clear Selection
            </Button>
          </Box>
        )}

        {/* ── Table ── */}
        <Paper
          elevation={0}
          sx={{
            border: "0.5px solid #e2e8f0",
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: "#fff",
          }}
        >
          {isFetchingCourses ? (
            <Box py={8} textAlign="center">
              <CircularProgress size={28} sx={{ color: "#2563eb" }} />
            </Box>
          ) : displayedCourses.length === 0 ? (
            <Box py={8} textAlign="center" color="#94a3b8">
              <Inbox size={38} style={{ marginBottom: 10, opacity: 0.5 }} />
              <Typography fontSize={13} fontFamily="'Montserrat', sans-serif" fontWeight={600}>
                No courses found.
              </Typography>
              <Typography fontSize={12} fontFamily="'Montserrat', sans-serif" mt={0.5}>
                {searchQuery
                  ? "Try a different search term."
                  : activeTab === 0
                    ? "Create your first course to get started."
                    : "No active courses yet."}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8fafc" }}>
                    <TableCell padding="checkbox" sx={{ pl: 2, borderBottom: "0.5px solid #e2e8f0" }}>
                      <Checkbox
                        size="small"
                        checked={
                          selectedIds.size === displayedCourses.length &&
                          displayedCourses.length > 0
                        }
                        indeterminate={
                          selectedIds.size > 0 && selectedIds.size < displayedCourses.length
                        }
                        onChange={toggleSelectAll}
                        sx={{ color: "#94a3b8", "&.Mui-checked": { color: "#2563eb" } }}
                      />
                    </TableCell>
                    {["Course Details", "Department", "Credits", "Status", "Actions"].map(
                      (h) => (
                        <TableCell
                          key={h}
                          align={h === "Actions" ? "right" : "left"}
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            color: "#94a3b8",
                            py: 1.75,
                            borderBottom: "0.5px solid #e2e8f0",
                            fontFamily: "'Montserrat', sans-serif",
                          }}
                        >
                          {h}
                        </TableCell>
                      ),
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedCourses.map((row) => {
                    const isSelected = selectedIds.has(row._id);
                    return (
                      <TableRow
                        key={row._id}
                        hover
                        selected={isSelected}
                        sx={{
                          "&:last-child td": { border: 0 },
                          "& td": { borderBottom: "0.5px solid #f1f5f9", py: 1.5 },
                          bgcolor: isSelected ? alpha("#2563eb", 0.04) : "transparent",
                          transition: "background 0.12s",
                        }}
                      >
                        <TableCell padding="checkbox" sx={{ pl: 2 }}>
                          <Checkbox
                            size="small"
                            checked={isSelected}
                            onChange={() => toggleSelect(row._id)}
                            sx={{ color: "#94a3b8", "&.Mui-checked": { color: "#2563eb" } }}
                          />
                        </TableCell>

                        <TableCell sx={{ minWidth: 180 }}>
                          <Typography
                            fontWeight={700}
                            fontSize={14}
                            color="#0f172a"
                            fontFamily="'Montserrat', sans-serif"
                          >
                            {row.title}
                          </Typography>
                          <Typography
                            fontSize={11}
                            fontWeight={700}
                            color={row.code ? "#059669" : "#cbd5e1"}
                            mt={0.5}
                            fontFamily="'Montserrat', sans-serif"
                          >
                            {row.code || "Unassigned Code"}
                          </Typography>
                        </TableCell>

                        <TableCell
                          sx={{ fontSize: 13, color: "#64748b", fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {row.owningDepartmentId?.name || "N/A"}
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={`${row.creditHours?.theory ?? 0}Th + ${row.creditHours?.lab ?? 0}Lab`}
                            sx={{
                              bgcolor: "#f1f5f9",
                              color: "#475569",
                              fontWeight: 700,
                              fontSize: 11,
                              fontFamily: "'Montserrat', sans-serif",
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <StatusBadge status={row.status} />
                        </TableCell>

                        <TableCell align="right">
                          <Box display="flex" justifyContent="flex-end" gap={1} flexWrap="wrap">
                            <Tooltip title="View course syllabus" arrow>
                              <IconButton
                                size="small"
                                onClick={() => handleViewContent(row.courseContent)}
                                sx={{
                                  color: "#64748b",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: 1.5,
                                  "&:hover": { bgcolor: "#f1f5f9" },
                                }}
                              >
                                <FileText size={15} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Download PDF" arrow>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  exportSinglePDF(row);
                                  showToast("PDF downloaded.");
                                }}
                                sx={{
                                  color: "#dc2626",
                                  border: "1px solid #fca5a5",
                                  borderRadius: 1.5,
                                  "&:hover": { bgcolor: "#fef2f2" },
                                }}
                              >
                                <Download size={15} />
                              </IconButton>
                            </Tooltip>

                            {row.status !== "ACTIVE" && (
                              <>
                                <Tooltip title="Edit course" arrow>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleEditClick(row)}
                                    startIcon={<Edit size={13} />}
                                    sx={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: "#64748b",
                                      borderColor: "#cbd5e1",
                                      borderRadius: 1.5,
                                      fontFamily: "'Montserrat', sans-serif",
                                      textTransform: "none",
                                      py: 0.5,
                                    }}
                                  >
                                    Edit
                                  </Button>
                                </Tooltip>
                                <Tooltip title="Delete course" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDelete(row._id, row.status)}
                                    sx={{
                                      color: "#dc2626",
                                      border: "1px solid #fca5a5",
                                      borderRadius: 1.5,
                                      "&:hover": { bgcolor: "#fef2f2" },
                                    }}
                                  >
                                    <Trash2 size={15} />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* ── Modals ── */}
        <CourseFormModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          departments={departments}
          isSaving={isSaving}
          onSubmit={handleSaveDraft}
          initialData={form}
        />

        <Dialog
          open={viewContentOpen}
          onClose={() => setViewContentOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, fontFamily: "'Aleo', serif" }}>
            Course Content
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ py: 3 }}>
            <Typography
              sx={{
                fontFamily: "'Montserrat', sans-serif",
                whiteSpace: "pre-wrap",
                fontSize: 14,
                color: "#334155",
                lineHeight: 1.85,
              }}
            >
              {contentToView}
            </Typography>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2, bgcolor: "#f8fafc" }}>
            <Button
              onClick={() => setViewContentOpen(false)}
              variant="contained"
              sx={{
                bgcolor: "#1e293b",
                fontWeight: 700,
                boxShadow: "none",
                borderRadius: 2,
                fontFamily: "'Montserrat', sans-serif",
                textTransform: "none",
                px: 3,
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Action Floating Bar */}
        <BulkActionBar
          count={selectedIds.size}
          onClear={clearSelection}
          onPDF={() => {
            exportSelectedPDF(selectedCourses);
            showToast(`${selectedIds.size} course(s) exported as PDF.`);
          }}
          onExcel={() => {
            exportSelectedExcel(selectedCourses);
            showToast(`${selectedIds.size} course(s) exported as Excel.`);
          }}
        />

        {/* Toast */}
        <Snackbar
          open={toast.open}
          autoHideDuration={3000}
          onClose={() => setToast((p) => ({ ...p, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity={toast.severity}
            variant="filled"
            sx={{ fontSize: 13, fontFamily: "'Montserrat', sans-serif" }}
          >
            {toast.msg}
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
};

export default CourseCatalogView;
