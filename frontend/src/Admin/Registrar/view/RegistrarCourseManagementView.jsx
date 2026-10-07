import React, { useState, useEffect, useRef } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  Fade,
  Divider,
  alpha,
  Checkbox,
  Snackbar,
  Alert,
  Tooltip,
  IconButton,
  Stack,
} from "@mui/material";
import {
  Search,
  CheckCircle,
  FileText,
  Clock,
  LibraryBig,
  Hash,
  Download,
  Printer,
  FileSpreadsheet,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  X,
  Building2,
  GraduationCap,
  FilterX,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  DRAFT: { label: "Needs Code", bg: "#fffbeb", text: "#b45309" },
  ACTIVE: { label: "Active in Catalog", bg: "#f0fdf4", text: "#15803d" },
  RETIRED: { label: "Retired", bg: "#f1f5f9", text: "#475569" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || {
    bg: "#f1f5f9",
    text: "#475569",
    label: status,
  };
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
        fontWeight: 700,
        bgcolor: cfg.bg,
        color: cfg.text,
        border: `0.5px solid ${alpha(cfg.text, 0.22)}`,
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      {cfg.label}
    </Box>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <Paper
    elevation={0}
    sx={{
      flex: 1,
      minWidth: 140,
      border: "0.5px solid #e2e8f0",
      borderRadius: 2.5,
      p: 2,
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      bgcolor: "#fff",
    }}
  >
    <Box sx={{ bgcolor: bg, borderRadius: 2, p: 1, display: "flex" }}>
      <Icon size={18} color={color} />
    </Box>
    <Box>
      <Typography
        fontSize={20}
        fontWeight={800}
        color="#0f172a"
        lineHeight={1}
        fontFamily="'Aleo', serif"
      >
        {value}
      </Typography>
      <Typography
        fontSize={11}
        color="#94a3b8"
        fontWeight={600}
        mt={0.25}
        fontFamily="'Montserrat', sans-serif"
      >
        {label}
      </Typography>
    </Box>
  </Paper>
);

// ─── PDF helpers ──────────────────────────────────────────────────────────────
const buildPdfDoc = (courses, title) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, W, 24, "F");
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 22, W, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 15);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, W - 14, 15, {
    align: "right",
  });

  const rows = courses.map((c, i) => [
    i + 1,
    c.title || "—",
    c.code || "Pending",
    c.owningDepartmentId?.name || "N/A",
    c.level || "UG",
    `${c.creditHours?.theory ?? 0}Th + ${c.creditHours?.lab ?? 0}Lab`,
    STATUS_CONFIG[c.status]?.label || c.status,
    (c.courseContent || "").slice(0, 100) +
      (c.courseContent?.length > 100 ? "…" : ""),
  ]);

  autoTable(doc, {
    startY: 32,
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
    styles: {
      fontSize: 8,
      font: "helvetica",
      cellPadding: 3,
      valign: "middle",
    },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 52 },
      2: { cellWidth: 22 },
      3: { cellWidth: 38 },
      4: { cellWidth: 14 },
      5: { cellWidth: 28 },
      6: { cellWidth: 30 },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const pages = doc.internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        `Page ${data.pageNumber} of ${pages}`,
        W / 2,
        doc.internal.pageSize.getHeight() - 6,
        { align: "center" },
      );
    },
  });
  return doc;
};

const exportSinglePDF = (course) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, W, 30, "F");
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 28, W, 2.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text(course.title || "Course", 14, 20);

  let y = 42;
  const meta = [
    ["Code", course.code || "Pending"],
    ["Department", course.owningDepartmentId?.name || "N/A"],
    ["Level", course.level || "UG"],
    [
      "Credits",
      `${course.creditHours?.theory ?? 0} Theory + ${course.creditHours?.lab ?? 0} Lab`,
    ],
    ["Status", STATUS_CONFIG[course.status]?.label || course.status],
  ];
  meta.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(`${k}:`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(v, 48, y);
    y += 8;
  });

  y += 3;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, W - 14, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text("Course Content / Syllabus", 14, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const lines = doc.splitTextToSize(
    course.courseContent || "No content provided.",
    W - 28,
  );
  doc.text(lines, 14, y);

  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    W / 2,
    doc.internal.pageSize.getHeight() - 8,
    { align: "center" },
  );
  doc.save(
    `course_${(course.title || "course").replace(/\s+/g, "_").toLowerCase()}_${Date.now()}.pdf`,
  );
};

const exportAllPDF = (courses, title) =>
  buildPdfDoc(courses, title).save(`registrar_courses_${Date.now()}.pdf`);

const exportSelectedPDF = (courses) =>
  buildPdfDoc(courses, "Selected Courses — Registrar").save(
    `registrar_selected_${Date.now()}.pdf`,
  );

// ─── Excel helpers ────────────────────────────────────────────────────────────
const toExcelRows = (courses) =>
  courses.map((c) => ({
    "Course Title": c.title,
    Code: c.code || "Pending",
    Department: c.owningDepartmentId?.name || "N/A",
    Level: c.level || "UG",
    "Theory Hrs": c.creditHours?.theory ?? 0,
    "Lab Hrs": c.creditHours?.lab ?? 0,
    Status: STATUS_CONFIG[c.status]?.label || c.status,
    "Course Content": c.courseContent || "",
  }));

const exportAllExcel = (courses, sheetName) => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(toExcelRows(courses)),
    sheetName.slice(0, 31),
  );
  XLSX.writeFile(wb, `registrar_courses_${Date.now()}.xlsx`);
};

const exportSelectedExcel = (courses) => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(toExcelRows(courses)),
    "Selected",
  );
  XLSX.writeFile(wb, `registrar_selected_${Date.now()}.xlsx`);
};

// ─── Print helpers ────────────────────────────────────────────────────────────
const printCourses = (courses, title) => {
  const rows = courses
    .map(
      (c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>
        <strong>${c.title || "—"}</strong><br/>
        <span style="color:#059669;font-size:11px">${c.code || "Pending"}</span>
      </td>
      <td>${c.owningDepartmentId?.name || "N/A"}</td>
      <td>${c.level || "UG"}</td>
      <td>${c.creditHours?.theory ?? 0}Th + ${c.creditHours?.lab ?? 0}Lab</td>
      <td>${STATUS_CONFIG[c.status]?.label || c.status}</td>
      <td style="font-size:11px;color:#475569">${(c.courseContent || "—").slice(0, 140)}${c.courseContent?.length > 140 ? "…" : ""}</td>
    </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><title>${title}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; font-size:12px; color:#1e293b; }
    .header { background:#1e293b; color:#fff; padding:18px 24px 14px; }
    .header h1 { font-size:18px; font-weight:800; margin-bottom:2px; }
    .header p { font-size:11px; color:#94a3b8; }
    .accent { height:3px; background:#2563eb; }
    table { width:100%; border-collapse:collapse; margin-top:12px; }
    th { background:#f1f5f9; font-size:10px; font-weight:800; text-transform:uppercase;
         color:#64748b; padding:8px 10px; border-bottom:1px solid #e2e8f0; text-align:left; }
    td { padding:9px 10px; border-bottom:0.5px solid #f1f5f9; vertical-align:top; }
    tr:nth-child(even) td { background:#f8fafc; }
    .footer { margin-top:16px; font-size:10px; color:#94a3b8; text-align:center; }
    @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  </style></head><body>
  <div class="header"><h1>${title}</h1><p>Printed: ${new Date().toLocaleString()}</p></div>
  <div class="accent"></div>
  <table>
    <thead><tr><th>#</th><th>Course</th><th>Class</th><th>Level</th><th>Credits</th><th>Status</th><th>Content Preview</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">ZABTEC EMS — University Course Catalog</div>
  </body></html>`;

  const win = window.open("", "_blank", "width=1000,height=700");
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
  };
};

const printSingleCourse = (course) => {
  const html = `<!DOCTYPE html><html><head><title>${course.title}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; font-size:13px; color:#1e293b; padding:32px; }
    .header { background:#1e293b; color:#fff; padding:20px 24px; border-radius:8px; margin-bottom:24px; }
    .header h1 { font-size:20px; font-weight:800; }
    .header .code { font-size:12px; color:#60a5fa; margin-top:4px; font-weight:700; }
    .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:24px; }
    .meta-item { background:#f8fafc; border:0.5px solid #e2e8f0; border-radius:6px; padding:10px 14px; }
    .meta-label { font-size:10px; font-weight:800; text-transform:uppercase; color:#94a3b8; margin-bottom:3px; }
    .meta-value { font-size:13px; font-weight:700; color:#0f172a; }
    .section-title { font-size:11px; font-weight:800; text-transform:uppercase; color:#64748b;
                     letter-spacing:.05em; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid #e2e8f0; }
    .content-body { font-size:13px; color:#334155; line-height:1.8; white-space:pre-wrap; }
    .footer { margin-top:32px; font-size:10px; color:#94a3b8; text-align:center;
              border-top:0.5px solid #e2e8f0; padding-top:12px; }
    @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  </style></head><body>
  <div class="header">
    <h1>${course.title || "Course"}</h1>
    <div class="code">${course.code || "Code Not Yet Assigned"}</div>
  </div>
  <div class="meta-grid">
    <div class="meta-item"><div class="meta-label">Class</div><div class="meta-value">${course.owningDepartmentId?.name || "N/A"}</div></div>
    <div class="meta-item"><div class="meta-label">Level</div><div class="meta-value">${course.level || "UG"}</div></div>
    <div class="meta-item"><div class="meta-label">Credits</div><div class="meta-value">${course.creditHours?.theory ?? 0} Theory + ${course.creditHours?.lab ?? 0} Lab</div></div>
    <div class="meta-item"><div class="meta-label">Status</div><div class="meta-value">${STATUS_CONFIG[course.status]?.label || course.status}</div></div>
  </div>
  <div class="section-title">Course Content / Syllabus</div>
  <div class="content-body">${course.courseContent || "No content provided."}</div>
  <div class="footer">ZABTEC EMS — Printed ${new Date().toLocaleString()}</div>
  </body></html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
  };
};

// ─── Export dropdown ──────────────────────────────────────────────────────────
const ExportMenu = ({ label, icon: Icon, color, items, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <Box ref={ref} sx={{ position: "relative" }}>
      <Button
        variant="outlined"
        size="small"
        disabled={disabled}
        startIcon={<Icon size={13} />}
        endIcon={<ChevronDown size={11} />}
        onClick={() => setOpen((p) => !p)}
        sx={{
          borderColor: color,
          color,
          fontWeight: 700,
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
          elevation={6}
          sx={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 1400,
            minWidth: 210,
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

// ─── Bulk floating bar ────────────────────────────────────────────────────────
const BulkBar = ({ count, onClear, onPDF, onExcel, onPrint }) => (
  <Fade in={count > 0}>
    <Paper
      elevation={6}
      sx={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1500,
        borderRadius: 3,
        px: 3,
        py: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 2,
        bgcolor: "#0f172a",
        minWidth: 420,
        border: "0.5px solid #1e293b",
      }}
    >
      <CheckSquare size={17} color="#60a5fa" />
      <Typography
        fontFamily="'Montserrat', sans-serif"
        fontSize={13}
        fontWeight={700}
        color="#f1f5f9"
        flex={1}
      >
        {count} course{count > 1 ? "s" : ""} selected
      </Typography>
      <Divider orientation="vertical" flexItem sx={{ bgcolor: "#334155" }} />
      <Button
        size="small"
        startIcon={<Download size={12} />}
        onClick={onPDF}
        sx={{
          color: "#fca5a5",
          fontWeight: 700,
          fontSize: 12,
          textTransform: "none",
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        PDF
      </Button>
      <Button
        size="small"
        startIcon={<FileSpreadsheet size={12} />}
        onClick={onExcel}
        sx={{
          color: "#6ee7b7",
          fontWeight: 700,
          fontSize: 12,
          textTransform: "none",
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        Excel
      </Button>
      <Button
        size="small"
        startIcon={<Printer size={12} />}
        onClick={onPrint}
        sx={{
          color: "#c4b5fd",
          fontWeight: 700,
          fontSize: 12,
          textTransform: "none",
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        Print
      </Button>
      <IconButton size="small" onClick={onClear} sx={{ color: "#64748b" }}>
        <X size={15} />
      </IconButton>
    </Paper>
  </Fade>
);

// ─── View Content Dialog ──────────────────────────────────────────────────────
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
          alignItems: "flex-start",
          justifyContent: "space-between",
          px: 3,
          pt: 3,
          pb: 1.5,
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
          <Stack
            direction="row"
            spacing={0.75}
            mt={1}
            flexWrap="wrap"
            useFlexGap
          >
            {course.code && (
              <Chip
                size="small"
                label={course.code}
                sx={{
                  bgcolor: "#f0fdf4",
                  color: "#15803d",
                  fontWeight: 700,
                  fontSize: 11,
                }}
              />
            )}
            <Chip
              size="small"
              label={course.level || "UG"}
              sx={{
                bgcolor: "#eff6ff",
                color: "#1d4ed8",
                fontWeight: 700,
                fontSize: 11,
              }}
            />
            <Chip
              size="small"
              label={`${course.creditHours?.theory ?? 0}Th + ${course.creditHours?.lab ?? 0}Lab`}
              sx={{
                bgcolor: "#f1f5f9",
                color: "#475569",
                fontWeight: 700,
                fontSize: 11,
              }}
            />
            <StatusBadge status={course.status} />
          </Stack>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: "#94a3b8", mt: 0.5 }}
        >
          <X size={17} />
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
          <Box py={5} textAlign="center" color="#94a3b8">
            <FileText size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
            <Typography
              fontSize={13}
              fontFamily="'Montserrat', sans-serif"
              fontWeight={600}
            >
              No syllabus content available.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2, bgcolor: "#f8fafc", gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Download size={13} />}
          onClick={() => exportSinglePDF(course)}
          sx={{
            fontWeight: 700,
            color: "#dc2626",
            borderColor: "#fca5a5",
            textTransform: "none",
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          Download PDF
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Printer size={13} />}
          onClick={() => printSingleCourse(course)}
          sx={{
            fontWeight: 700,
            color: "#7c3aed",
            borderColor: "#c4b5fd",
            textTransform: "none",
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          Print
        </Button>
        <Box flex={1} />
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

// ─── Main Component ───────────────────────────────────────────────────────────
const RegistrarCourseManagementView = ({
  courses = [],
  isFetchingCourses = false,
  pagination = { page: 1, limit: 10, total: 0, totalPages: 1 },
  page = 1,
  setPage = () => {},

  activeTab = 0,
  setActiveTab = () => {},
  draftCount = 0,
  activeCount = 0,
  totalCount = 0,

  departments = [],
  programs = [],
  departmentId = "",
  setDepartmentId = () => {},
  programId = "",
  setProgramId = () => {},
  searchQuery = "",
  setSearchQuery = () => {},
  clearFilters = () => {},

  fetchAllForExport = async () => [],

  activationModalOpen = false,
  setActivationModalOpen = () => {},
  selectedCourse = null,
  courseCode = "",
  setCourseCode = () => {},
  handleOpenActivationModal = () => {},
  handleActivateCourse = () => {},
  isUpdating = false,
}) => {
  const [toast, setToast] = useState({
    open: false,
    msg: "",
    severity: "success",
  });
  const [viewCourse, setViewCourse] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (msg, severity = "success") =>
    setToast({ open: true, msg, severity });

  const displayedCourses = courses;
  const tabLabel = activeTab === 0 ? "Pending Activation" : "Active Catalog";
  const hasActiveFilters = Boolean(departmentId || programId || searchQuery);

  // Clear selection on tab/page switch
  useEffect(() => setSelectedIds(new Set()), [activeTab, page]);

  const runExportAll = async (fn) => {
    setIsExporting(true);
    try {
      const all = await fetchAllForExport();
      if (all.length === 0) {
        showToast("Nothing to export in this tab.", "warning");
        return;
      }
      fn(all);
    } catch {
      showToast("Failed to fetch courses for export.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const toggleSelect = (id) =>
    setSelectedIds((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleSelectAll = () =>
    setSelectedIds(
      selectedIds.size === displayedCourses.length
        ? new Set()
        : new Set(displayedCourses.map((c) => c._id)),
    );
  const clearSelection = () => setSelectedIds(new Set());

  const selectedCourses = displayedCourses.filter((c) =>
    selectedIds.has(c._id),
  );

  const guardSelected = (fn) => () => {
    if (!selectedIds.size) {
      showToast("Select at least one course first.", "warning");
      return;
    }
    fn();
  };

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
        <Box mb={3}>
          <Typography
            variant="h5"
            fontWeight={800}
            color="#0f172a"
            fontFamily="'Aleo', serif"
          >
            University Course Catalog
          </Typography>
          <Typography
            variant="body2"
            color="#64748b"
            mt={0.25}
            fontFamily="'Montserrat', sans-serif"
          >
            Assign official course codes to approved curricula and manage the
            active university catalog.
          </Typography>
        </Box>

        {/* ── Stat cards ── */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <StatCard
            icon={Clock}
            label="Pending Activation"
            value={draftCount}
            color="#b45309"
            bg="#fffbeb"
          />
          <StatCard
            icon={CheckCircle}
            label="Active in Catalog"
            value={activeCount}
            color="#15803d"
            bg="#f0fdf4"
          />
          <StatCard
            icon={LibraryBig}
            label="Total Courses"
            value={totalCount}
            color="#1d4ed8"
            bg="#eff6ff"
          />
        </Box>

        {/* ── Filters ── */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            mb: 2,
            border: "0.5px solid #e2e8f0",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1.25,
            bgcolor: "#fff",
          }}
        >
          <Box display="flex" alignItems="center" gap={0.75} sx={{ color: "#94a3b8", pl: 0.5 }}>
            <Building2 size={14} />
            <Typography fontSize={11} fontWeight={800} fontFamily="'Montserrat', sans-serif" textTransform="uppercase">
              Filters
            </Typography>
          </Box>

          <Select
            size="small"
            displayEmpty
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            sx={{
              minWidth: 200,
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <MenuItem value="" sx={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13 }}>
              All Classes
            </MenuItem>
            {departments.map((d) => (
              <MenuItem key={d._id} value={d._id} sx={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13 }}>
                {d.name}
              </MenuItem>
            ))}
          </Select>

          <Select
            size="small"
            displayEmpty
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            sx={{
              minWidth: 200,
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 13,
              fontWeight: 600,
            }}
            startAdornment={
              <InputAdornment position="start">
                <GraduationCap size={14} color="#94a3b8" />
              </InputAdornment>
            }
          >
            <MenuItem value="" sx={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13 }}>
              All Programs
            </MenuItem>
            {programs.map((p) => (
              <MenuItem key={p._id} value={p._id} sx={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13 }}>
                {p.name}
              </MenuItem>
            ))}
          </Select>

          {hasActiveFilters && (
            <Button
              size="small"
              startIcon={<FilterX size={13} />}
              onClick={clearFilters}
              sx={{
                color: "#64748b",
                fontWeight: 700,
                fontSize: 12,
                textTransform: "none",
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              Clear Filters
            </Button>
          )}
        </Paper>

        {/* ── Toolbar ── */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            mb: 2.5,
            border: "0.5px solid #e2e8f0",
            borderRadius: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1.5,
            bgcolor: "#fff",
          }}
        >
          {/* Tab pills */}
          <Box
            sx={{
              bgcolor: "#f1f5f9",
              borderRadius: 1.5,
              p: 0.4,
              display: "inline-flex",
            }}
          >
            {["Pending Activation", "Active Catalog"].map((label, idx) => (
              <Box
                key={label}
                onClick={() => setActiveTab(idx)}
                sx={{
                  px: 2.5,
                  py: 0.9,
                  borderRadius: 1.5,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  bgcolor: activeTab === idx ? "#fff" : "transparent",
                  color: activeTab === idx ? "#0f172a" : "#64748b",
                  border:
                    activeTab === idx
                      ? "0.5px solid #e2e8f0"
                      : "0.5px solid transparent",
                  fontFamily: "'Montserrat', sans-serif",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                }}
              >
                {label}
                <Box
                  component="span"
                  sx={{
                    px: 0.9,
                    py: 0.1,
                    borderRadius: "100px",
                    fontSize: 10,
                    fontWeight: 800,
                    bgcolor: activeTab === idx ? "#eff6ff" : "#e2e8f0",
                    color: activeTab === idx ? "#1d4ed8" : "#475569",
                  }}
                >
                  {idx === 0 ? draftCount : activeCount}
                </Box>
              </Box>
            ))}
          </Box>

          {/* Right controls */}
          <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
            <ExportMenu
              label="PDF"
              icon={Download}
              color="#dc2626"
              disabled={isExporting}
              items={[
                {
                  label: "Export All (This Tab)",
                  icon: Download,
                  action: () =>
                    runExportAll((all) => {
                      exportAllPDF(all, tabLabel);
                      showToast("PDF exported.");
                    }),
                },
                {
                  label: "Export Selected",
                  icon: CheckSquare,
                  action: guardSelected(() => {
                    exportSelectedPDF(selectedCourses);
                    showToast("Selected PDF exported.");
                  }),
                },
              ]}
            />
            <ExportMenu
              label="Excel"
              icon={FileSpreadsheet}
              color="#059669"
              disabled={isExporting}
              items={[
                {
                  label: "Export All (This Tab)",
                  icon: FileSpreadsheet,
                  action: () =>
                    runExportAll((all) => {
                      exportAllExcel(all, tabLabel);
                      showToast("Excel exported.");
                    }),
                },
                {
                  label: "Export Selected",
                  icon: CheckSquare,
                  action: guardSelected(() => {
                    exportSelectedExcel(selectedCourses);
                    showToast("Selected Excel exported.");
                  }),
                },
              ]}
            />
            <ExportMenu
              label="Print"
              icon={Printer}
              color="#7c3aed"
              disabled={isExporting}
              items={[
                {
                  label: "Print All (This Tab)",
                  icon: Printer,
                  action: () =>
                    runExportAll((all) => printCourses(all, tabLabel)),
                },
                {
                  label: "Print Selected",
                  icon: CheckSquare,
                  action: guardSelected(() =>
                    printCourses(selectedCourses, "Selected Courses — Print"),
                  ),
                },
              ]}
            />

            <TextField
              size="small"
              placeholder="Search title or code…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                maxWidth: 240,
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
          </Box>
        </Paper>

        {/* ── Selection info bar ── */}
        {selectedIds.size > 0 && (
          <Box
            mb={1.5}
            px={2}
            py={0.9}
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
              Clear
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
            <Box py={10} textAlign="center">
              <CircularProgress size={30} sx={{ color: "#2563eb" }} />
            </Box>
          ) : displayedCourses.length === 0 ? (
            <Box
              py={9}
              textAlign="center"
              display="flex"
              flexDirection="column"
              alignItems="center"
              color="#94a3b8"
            >
              {activeTab === 0 ? (
                <Clock size={44} style={{ opacity: 0.25, marginBottom: 12 }} />
              ) : (
                <LibraryBig
                  size={44}
                  style={{ opacity: 0.25, marginBottom: 12 }}
                />
              )}
              <Typography
                fontSize={14}
                fontWeight={700}
                color="#64748b"
                fontFamily="'Montserrat', sans-serif"
              >
                {activeTab === 0
                  ? "No courses are waiting for activation."
                  : "The catalog is currently empty."}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8fafc" }}>
                    <TableCell
                      padding="checkbox"
                      sx={{ pl: 2, borderBottom: "0.5px solid #e2e8f0" }}
                    >
                      <Checkbox
                        size="small"
                        checked={
                          selectedIds.size === displayedCourses.length &&
                          displayedCourses.length > 0
                        }
                        indeterminate={
                          selectedIds.size > 0 &&
                          selectedIds.size < displayedCourses.length
                        }
                        onChange={toggleSelectAll}
                        sx={{
                          color: "#94a3b8",
                          "&.Mui-checked": { color: "#2563eb" },
                        }}
                      />
                    </TableCell>
                    {[
                      "Course Details",
                      "Department",
                      "Credits",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <TableCell
                        key={h}
                        align={h === "Actions" ? "right" : "left"}
                        sx={{
                          fontSize: 11,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          color: "#94a3b8",
                          py: 1.75,
                          borderBottom: "0.5px solid #e2e8f0",
                          fontFamily: "'Montserrat', sans-serif",
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedCourses.map((row) => {
                    const isSelected = selectedIds.has(row._id);
                    return (
                      <TableRow
                        key={row._id}
                        hover
                        sx={{
                          "&:last-child td": { border: 0 },
                          "& td": {
                            borderBottom: "0.5px solid #f1f5f9",
                            py: 1.5,
                          },
                          bgcolor: isSelected
                            ? alpha("#2563eb", 0.04)
                            : "transparent",
                          transition: "background 0.12s",
                        }}
                      >
                        <TableCell padding="checkbox" sx={{ pl: 2 }}>
                          <Checkbox
                            size="small"
                            checked={isSelected}
                            onChange={() => toggleSelect(row._id)}
                            sx={{
                              color: "#94a3b8",
                              "&.Mui-checked": { color: "#2563eb" },
                            }}
                          />
                        </TableCell>

                        <TableCell sx={{ minWidth: 200 }}>
                          <Typography
                            fontWeight={800}
                            fontSize={14}
                            color={row.code ? "#059669" : "#0f172a"}
                            fontFamily="'Montserrat', sans-serif"
                          >
                            {row.code
                              ? `${row.code} — ${row.title}`
                              : row.title}
                          </Typography>
                          <Typography
                            fontSize={11}
                            color="#94a3b8"
                            mt={0.4}
                            fontFamily="'Montserrat', sans-serif"
                          >
                            Level: {row.level || "UG"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography
                            fontSize={13}
                            fontWeight={700}
                            color="#334155"
                            fontFamily="'Montserrat', sans-serif"
                          >
                            {row.owningDepartmentId?.name || "N/A"}
                          </Typography>
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
                          <Box
                            display="flex"
                            justifyContent="flex-end"
                            gap={1}
                            flexWrap="wrap"
                          >
                            {/* View syllabus */}
                            <Tooltip title="View syllabus" arrow>
                              <IconButton
                                size="small"
                                onClick={() => setViewCourse(row)}
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

                            {/* Single PDF */}
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

                            {/* Single print */}
                            <Tooltip title="Print this course" arrow>
                              <IconButton
                                size="small"
                                onClick={() => printSingleCourse(row)}
                                sx={{
                                  color: "#7c3aed",
                                  border: "1px solid #c4b5fd",
                                  borderRadius: 1.5,
                                  "&:hover": { bgcolor: "#faf5ff" },
                                }}
                              >
                                <Printer size={15} />
                              </IconButton>
                            </Tooltip>

                            {/* Assign code */}
                            {row.status === "DRAFT" && (
                              <Tooltip title="Assign code & activate" arrow>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  startIcon={<Hash size={13} />}
                                  onClick={() => handleOpenActivationModal(row)}
                                  disabled={isUpdating}
                                  sx={{
                                    boxShadow: "none",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    borderRadius: 1.5,
                                    textTransform: "none",
                                    fontFamily: "'Montserrat', sans-serif",
                                    bgcolor: "#2563eb",
                                    py: 0.5,
                                  }}
                                >
                                  Assign Code
                                </Button>
                              </Tooltip>
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

        {/* ── Pagination ── */}
        {!isFetchingCourses && pagination.total > 0 && (
          <Box
            mt={1.5}
            px={0.5}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1.5}
          >
            <Typography
              fontSize={12}
              fontWeight={600}
              color="#64748b"
              fontFamily="'Montserrat', sans-serif"
            >
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} in {tabLabel}
            </Typography>

            <Box display="flex" alignItems="center" gap={1}>
              <IconButton
                size="small"
                aria-label="Previous page"
                disabled={pagination.page <= 1}
                onClick={() => setPage(pagination.page - 1)}
                sx={{
                  color: "#475569",
                  border: "0.5px solid #e2e8f0",
                  borderRadius: 1.5,
                  "&.Mui-disabled": { opacity: 0.4 },
                }}
              >
                <ChevronLeft size={16} />
              </IconButton>

              <Box
                px={1.5}
                py={0.5}
                borderRadius={1.5}
                bgcolor="#f1f5f9"
                fontSize={12}
                fontWeight={700}
                color="#0f172a"
                fontFamily="'Montserrat', sans-serif"
              >
                Page {pagination.page} of {pagination.totalPages}
              </Box>

              <IconButton
                size="small"
                aria-label="Next page"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(pagination.page + 1)}
                sx={{
                  color: "#475569",
                  border: "0.5px solid #e2e8f0",
                  borderRadius: 1.5,
                  "&.Mui-disabled": { opacity: 0.4 },
                }}
              >
                <ChevronRight size={16} />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* ── Dialogs ── */}

        {/* View content */}
        <ViewContentDialog
          open={!!viewCourse}
          onClose={() => setViewCourse(null)}
          course={viewCourse}
        />

        {/* Activation modal */}
        <Dialog
          open={activationModalOpen}
          onClose={() => setActivationModalOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle
            sx={{
              fontWeight: 800,
              fontFamily: "'Aleo', serif",
              color: "#0f172a",
              py: 2.5,
            }}
          >
            Assign Official Course Code
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ py: 3 }}>
            {selectedCourse && (
              <Box
                mb={3}
                p={2}
                bgcolor="#f8fafc"
                borderRadius={2}
                border="0.5px solid #e2e8f0"
              >
                <Typography
                  fontSize={11}
                  fontWeight={800}
                  color="#94a3b8"
                  textTransform="uppercase"
                  fontFamily="'Montserrat', sans-serif"
                  mb={0.5}
                >
                  Curriculum Details
                </Typography>
                <Typography
                  fontSize={15}
                  fontWeight={800}
                  color="#0f172a"
                  fontFamily="'Aleo', serif"
                >
                  {selectedCourse.title}
                </Typography>
                <Typography
                  fontSize={12}
                  color="#64748b"
                  fontFamily="'Montserrat', sans-serif"
                  mt={0.25}
                >
                  {selectedCourse.owningDepartmentId?.name} ·{" "}
                  {selectedCourse.level || "UG"}
                </Typography>
              </Box>
            )}
            <Typography
              variant="body2"
              color="text.secondary"
              mb={1.5}
              sx={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13 }}
            >
              Enter the unique alphanumeric code (e.g., CS-101, MGT-405). This
              cannot be changed after activation.
            </Typography>
            <TextField
              fullWidth
              size="medium"
              placeholder="e.g. CS-101"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  fontWeight: 800,
                  fontSize: 20,
                  fontFamily: "'Montserrat', sans-serif",
                  letterSpacing: "0.05em",
                },
              }}
              inputProps={{ style: { textTransform: "uppercase" } }}
            />
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
            <Button
              onClick={() => setActivationModalOpen(false)}
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
              color="success"
              onClick={handleActivateCourse}
              disabled={isUpdating || !courseCode.trim()}
              sx={{
                fontWeight: 700,
                boxShadow: "none",
                borderRadius: 2,
                fontFamily: "'Montserrat', sans-serif",
                textTransform: "none",
                px: 4,
              }}
            >
              {isUpdating ? "Activating…" : "Activate Course"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk floating bar */}
        <BulkBar
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
          onPrint={() =>
            printCourses(selectedCourses, "Selected Courses — Print")
          }
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

export default RegistrarCourseManagementView;
