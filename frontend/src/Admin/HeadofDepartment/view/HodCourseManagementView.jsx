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
  MenuItem,
  InputAdornment,
  Fade,
  Divider,
  alpha,
  Tooltip,
  IconButton,
  Stack,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Search,
  FileText,
  BookOpenCheck,
  Download,
  Printer,
  FileSpreadsheet,
  ChevronDown,
  X,
  CheckCircle,
  Ban,
  Layers,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  DRAFT: { label: "Needs Code", bg: "#fffbeb", text: "#b45309" },
  ACTIVE: { label: "Active", bg: "#dcfce7", text: "#047857" },
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

// ─── Stat card ───────────────────────────────────────────────────────────────
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
      {React.createElement(Icon, { size: 18, color })}
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

// ─── Export helpers ──────────────────────────────────────────────────────────
const buildPdfDoc = (courses, title) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, W, 24, "F");
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 22, W, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  doc.text(title, 14, 15);
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, W - 14, 15, {
    align: "right",
  });

  const rows = courses.map((c, i) => [
    i + 1,
    c.title || "—",
    c.code || "Pending",
    c.owningDepartmentId?.name || "N/A",
    `${c.creditHours?.theory ?? 0}Th + ${c.creditHours?.lab ?? 0}Lab`,
    STATUS_CONFIG[c.status]?.label || c.status,
    (c.courseContent || "").slice(0, 100) +
      (c.courseContent?.length > 100 ? "…" : ""),
  ]);

  autoTable(doc, {
    startY: 32,
    head: [
      ["#", "Course Title", "Code", "Department", "Credits", "Status", "Content Preview"],
    ],
    body: rows,
    styles: { fontSize: 8, font: "helvetica", cellPadding: 3, valign: "middle" },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 55 },
      2: { cellWidth: 25 },
      3: { cellWidth: 38 },
      4: { cellWidth: 28 },
      5: { cellWidth: 28 },
      7: { cellWidth: "auto" },
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
  doc.setFont(undefined, "bold");
  doc.text(course.title || "Course", 14, 20);

  let y = 42;
  const meta = [
    ["Code", course.code || "Pending"],
    ["Department", course.owningDepartmentId?.name || "N/A"],
    [
      "Credits",
      `${course.creditHours?.theory ?? 0} Theory + ${course.creditHours?.lab ?? 0} Lab`,
    ],
    ["Status", STATUS_CONFIG[course.status]?.label || course.status],
  ];
  meta.forEach(([k, v]) => {
    doc.setFont(undefined, "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(`${k}:`, 14, y);
    doc.setFont(undefined, "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(v, 50, y);
    y += 8;
  });

  y += 3;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, W - 14, y);
  y += 8;

  doc.setFont(undefined, "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text("Course Content / Syllabus", 14, y);
  y += 7;
  doc.setFont(undefined, "normal");
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

const exportAllPDF = (courses, title) => {
  buildPdfDoc(courses, title).save(`courses_${Date.now()}.pdf`);
};

const exportAllExcel = (courses, sheetName) => {
  const rows = courses.map((c) => ({
    "Course Title": c.title,
    Code: c.code || "Pending",
    Department: c.owningDepartmentId?.name || "N/A",
    "Theory Hrs": c.creditHours?.theory ?? 0,
    "Lab Hrs": c.creditHours?.lab ?? 0,
    Status: STATUS_CONFIG[c.status]?.label || c.status,
    "Course Content": c.courseContent || "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `courses_${Date.now()}.xlsx`);
};

// ─── Print helper ─────────────────────────────────────────────────────────────
const printCourses = (courses, title) => {
  const rows = courses
    .map(
      (c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${c.title || "—"}</strong><br/><span style="color:#059669;font-size:11px">${c.code || "Pending"}</span></td>
      <td>${c.owningDepartmentId?.name || "N/A"}</td>
      <td>${c.creditHours?.theory ?? 0}Th + ${c.creditHours?.lab ?? 0}Lab</td>
      <td>${STATUS_CONFIG[c.status]?.label || c.status}</td>
      <td style="font-size:11px;color:#475569">${(c.courseContent || "—").slice(0, 150)}${c.courseContent?.length > 150 ? "…" : ""}</td>
    </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; }
    .header { background: #1e293b; color: #fff; padding: 18px 24px 14px; }
    .header h1 { font-size: 18px; font-weight: 800; margin-bottom: 2px; }
    .header p { font-size: 11px; color: #94a3b8; }
    .accent { height: 3px; background: #2563eb; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #f1f5f9; font-size: 10px; font-weight: 800; text-transform: uppercase;
         color: #64748b; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    td { padding: 9px 10px; border-bottom: 0.5px solid #f1f5f9; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 16px; font-size: 10px; color: #94a3b8; text-align: center; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style></head><body>
  <div class="header"><h1>${title}</h1><p>Printed: ${new Date().toLocaleString()}</p></div>
  <div class="accent"></div>
  <table>
    <thead><tr><th>#</th><th>Course</th><th>Department</th><th>Credits</th><th>Status</th><th>Content Preview</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">ZABTEC EMS — Confidential Academic Document</div>
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
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1e293b; padding: 32px; }
    .header { background: #1e293b; color: #fff; padding: 20px 24px; border-radius: 8px; margin-bottom: 24px; }
    .header h1 { font-size: 20px; font-weight: 800; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .meta-item { background: #f8fafc; border: 0.5px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; }
    .meta-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 3px; }
    .meta-value { font-size: 13px; font-weight: 700; color: #0f172a; }
    .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #64748b;
                     letter-spacing: 0.05em; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
    .content-body { font-size: 13px; color: #334155; line-height: 1.8; white-space: pre-wrap; }
    .footer { margin-top: 32px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 0.5px solid #e2e8f0; padding-top: 12px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style></head><body>
  <div class="header"><h1>${course.title || "Course"}</h1></div>
  <div class="meta-grid">
    <div class="meta-item"><div class="meta-label">Course Code</div><div class="meta-value">${course.code || "Pending"}</div></div>
    <div class="meta-item"><div class="meta-label">Department</div><div class="meta-value">${course.owningDepartmentId?.name || "N/A"}</div></div>
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
const ExportMenu = ({ label, icon: Icon, color, items }) => {
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
        startIcon={React.createElement(Icon, { size: 13 })}
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

// ─── View / Print Content Dialog ──────────────────────────────────────────────
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
          <Typography fontWeight={800} fontSize={17} fontFamily="'Aleo', serif" color="#0f172a">
            {course.title}
          </Typography>
          <Stack direction="row" spacing={0.75} mt={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={course.code || "No Code"}
              sx={{ bgcolor: "#f0fdf4", color: "#15803d", fontWeight: 700, fontSize: 11 }}
            />
            <Chip
              size="small"
              label={`${course.creditHours?.theory ?? 0}Th + ${course.creditHours?.lab ?? 0}Lab`}
              sx={{ bgcolor: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: 11 }}
            />
            <StatusBadge status={course.status} />
          </Stack>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "#94a3b8", mt: 0.5 }}>
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
            <Typography fontSize={13} fontFamily="'Montserrat', sans-serif" fontWeight={600}>
              No content added yet.
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
const HodCourseManagementView = ({
  filteredCourses = [],
  isFetchingCourses = false,
  searchQuery = "",
  setSearchQuery = () => {},

  showScopeFilters = false,
  departments = [],
  programs = [],
  deptFilter = "",
  setDeptFilter = () => {},
  programFilter = "",
  setProgramFilter = () => {},
  statusFilter = "",
  setStatusFilter = () => {},
  stats = { total: 0, active: 0, draft: 0 },
  pagination = { page: 1, total: 0, totalPages: 1 },
  page = 1,
  setPage = () => {},
  pageSize = 20,
  setPageSize = () => {},

  roleTitle = "Course Catalog",
}) => {
  const [toast, setToast] = useState({ open: false, msg: "", severity: "success" });
  const [viewCourse, setViewCourse] = useState(null);

  const showToast = (msg, severity = "success") =>
    setToast({ open: true, msg, severity });

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
          <Typography variant="h5" fontWeight={800} color="#0f172a" fontFamily="'Aleo', serif">
            {roleTitle}
          </Typography>
          <Typography variant="body2" color="#64748b" mt={0.25} fontFamily="'Montserrat', sans-serif">
            Browse the course catalog{showScopeFilters ? " by department and program." : " for your department."}
          </Typography>
        </Box>

        {/* ── Stat cards ── */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <StatCard
            icon={Layers}
            label="Total Courses"
            value={stats.total}
            color="#1d4ed8"
            bg="#eff6ff"
          />
          <StatCard
            icon={CheckCircle}
            label="Active"
            value={stats.active}
            color="#15803d"
            bg="#f0fdf4"
          />
          <StatCard
            icon={Ban}
            label="Needs Code"
            value={stats.draft}
            color="#b45309"
            bg="#fffbeb"
          />
        </Box>

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
          <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
            {showScopeFilters && (
              <>
                <TextField
                  select
                  size="small"
                  label="Department"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  sx={{
                    minWidth: 170,
                    "& .MuiOutlinedInput-root": { fontFamily: "'Montserrat', sans-serif", fontSize: 13 },
                  }}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d._id} value={d._id}>
                      {d.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Program"
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                  sx={{
                    minWidth: 170,
                    "& .MuiOutlinedInput-root": { fontFamily: "'Montserrat', sans-serif", fontSize: 13 },
                  }}
                >
                  <MenuItem value="">All Programs</MenuItem>
                  {programs.map((p) => (
                    <MenuItem key={p._id} value={p._id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </TextField>
              </>
            )}
            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 140, "& .MuiOutlinedInput-root": { fontFamily: "'Montserrat', sans-serif", fontSize: 13 } }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="DRAFT">Needs Code</MenuItem>
              <MenuItem value="RETIRED">Retired</MenuItem>
            </TextField>
            <TextField
              size="small"
              placeholder="Search courses…"
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

          {/* Right controls */}
          <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
            <ExportMenu
              label="PDF"
              icon={Download}
              color="#dc2626"
              items={[
                {
                  label: "Export Current Page",
                  icon: Download,
                  action: () => {
                    exportAllPDF(filteredCourses, roleTitle);
                    showToast("PDF exported.");
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
                  label: "Export Current Page",
                  icon: FileSpreadsheet,
                  action: () => {
                    exportAllExcel(filteredCourses, roleTitle);
                    showToast("Excel exported.");
                  },
                },
              ]}
            />
            <ExportMenu
              label="Print"
              icon={Printer}
              color="#7c3aed"
              items={[
                {
                  label: "Print Current Page",
                  icon: Printer,
                  action: () => printCourses(filteredCourses, roleTitle),
                },
              ]}
            />
          </Box>
        </Paper>

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
          ) : filteredCourses.length === 0 ? (
            <Box
              py={9}
              textAlign="center"
              display="flex"
              flexDirection="column"
              alignItems="center"
              color="#94a3b8"
            >
              <BookOpenCheck size={46} style={{ opacity: 0.25, marginBottom: 12 }} />
              <Typography fontSize={14} fontWeight={700} color="#64748b" fontFamily="'Montserrat', sans-serif">
                No courses found.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8fafc" }}>
                    {["Course Details", "Department", "Credits", "Status", "Actions"].map((h) => (
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
                  {filteredCourses.map((row) => (
                    <TableRow
                      key={row._id}
                      hover
                      sx={{
                        "&:last-child td": { border: 0 },
                        "& td": { borderBottom: "0.5px solid #f1f5f9", py: 1.5 },
                      }}
                    >
                      <TableCell sx={{ minWidth: 180 }}>
                        <Typography
                          fontWeight={800}
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
                          mt={0.4}
                          fontFamily="'Montserrat', sans-serif"
                        >
                          {row.code || "Code Pending"}
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
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {pagination.total > 0 && (
          <Paper elevation={0} sx={{ mt: 2, px: 2, py: 1.5, border: "0.5px solid #e2e8f0", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
            <Typography fontSize={12} fontWeight={600} color="#64748b" fontFamily="'Montserrat', sans-serif">
              Showing {(pagination.page - 1) * pageSize + 1}–{Math.min(pagination.page * pageSize, pagination.total)} of {pagination.total} courses
            </Typography>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <TextField select size="small" value={pageSize} onChange={(e) => setPageSize(e.target.value)} aria-label="Courses per page" sx={{ width: 120, "& .MuiOutlinedInput-root": { fontSize: 12 } }}>
                {[10, 20, 50].map((size) => <MenuItem key={size} value={size}>{size} per page</MenuItem>)}
              </TextField>
              <Button size="small" variant="outlined" disabled={page <= 1} onClick={() => setPage(page - 1)} sx={{ textTransform: "none", borderColor: "#cbd5e1", color: "#334155" }}>Previous</Button>
              <Typography fontSize={12} fontWeight={700} color="#475569">Page {pagination.page} of {pagination.totalPages}</Typography>
              <Button size="small" variant="outlined" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} sx={{ textTransform: "none", borderColor: "#cbd5e1", color: "#334155" }}>Next</Button>
              <TextField size="small" type="number" label="Go to" defaultValue={page} key={page} inputProps={{ min: 1, max: pagination.totalPages }} onKeyDown={(event) => {
                if (event.key === "Enter") {
                  const target = Math.min(Math.max(Number(event.currentTarget.value) || 1, 1), pagination.totalPages);
                  setPage(target);
                }
              }} sx={{ width: 82, "& .MuiOutlinedInput-root": { fontSize: 12 } }} />
            </Box>
          </Paper>
        )}

        {/* ── Dialogs ── */}
        <ViewContentDialog
          open={!!viewCourse}
          onClose={() => setViewCourse(null)}
          course={viewCourse}
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

export default HodCourseManagementView;
