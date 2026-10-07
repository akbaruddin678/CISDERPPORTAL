import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Divider,
  Button,
  Grid,
  Tooltip,
  Skeleton,
  LinearProgress,
  Select,
  MenuItem,
  Menu,
} from "@mui/material";
import {
  Search,
  ExpandMore,
  School,
  AccountTree,
  History as HistoryIcon,
  Groups,
  Phone,
  Email,
  Badge as BadgeIcon,
  Home,
  Payments,
  Description,
  Image as ImageIcon,
  PictureAsPdf,
  CheckCircle,
  WarningAmber,
  ErrorOutline,
  HourglassEmpty,
  Block,
  EmojiEvents,
  FamilyRestroom,
  Cake,
  Wc,
  OpenInNew,
  ReceiptLong,
  Close,
  FilterAlt,
  RestartAlt,
  CalendarMonth,
  AccountBalance,
  Layers,
  FileDownload,
  GridOn,
  KeyboardArrowDown,
} from "@mui/icons-material";

// Import API Hooks
import { useGetCompleteCatalogQuery } from "../api/examApi";
import {
  exportStudentProfilePDF,
  exportStudentProfileExcel,
  exportBatchListPDF,
  exportBatchListExcel,
} from "../utils/academicHistoryExport";
import {
  useGetStudentsForRegistrationQuery,
  useLazyGetStudentCourseHistoryQuery,
} from "../api/coursestudentAssignment";
import {
  useLazyGetAllStudentsQuery,
  useGetStudentDetailsQuery,
} from "../../Registrar/api/registrarStudentApi";
import { useGetChallansByStudentIdQuery } from "../../accountant/api/studentChallanApi";

// Safety array extractor
const normalizeArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data?.data && Array.isArray(res.data.data)) return res.data.data;
  // /api/student (getAllStudents) nests the list one level deeper:
  // { success, data: { students: [...], pagination } }
  if (res.data?.students && Array.isArray(res.data.students)) return res.data.students;
  return [];
};

const fmtMoney = (n) =>
  `Rs ${Number(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// --- Student academic-standing badge config ---
const STUDENT_STATUS_MAP = {
  active: { label: "Active", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", icon: CheckCircle },
  approved: { label: "Approved", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: CheckCircle },
  deferred: { label: "Deferred", color: "#b45309", bg: "#fffbeb", border: "#fde68a", icon: HourglassEmpty },
  suspended: { label: "Suspended", color: "#be123c", bg: "#fff1f2", border: "#fecdd3", icon: Block },
  withdrawn: { label: "Withdrawn", color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0", icon: Block },
  graduated: { label: "Graduated", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", icon: EmojiEvents },
};

// --- Fee-status badge config (current semester) ---
const FEE_STATUS_MAP = {
  paid: { label: "Fully Paid", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", icon: CheckCircle },
  partial: { label: "Partially Paid", color: "#b45309", bg: "#fffbeb", border: "#fde68a", icon: WarningAmber },
  unpaid: { label: "Unpaid", color: "#c2410c", bg: "#fff7ed", border: "#fed7aa", icon: ErrorOutline },
  overdue: { label: "Overdue", color: "#be123c", bg: "#fff1f2", border: "#fecdd3", icon: ErrorOutline },
  not_generated: { label: "No Challan Generated", color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0", icon: HourglassEmpty },
};

// Independent from academic `status` — tracks the post-promotion
// admission/payment lifecycle (see StudentProfile.admissionLifecycleStatus).
// Only worth surfacing when it's NOT the default "active" state.
const LIFECYCLE_STATUS_MAP = {
  cancelled_non_payment: { label: "Admission Cancelled — Non-Payment", color: "#be123c", bg: "#fff1f2", border: "#fecdd3", icon: ErrorOutline },
  re_admitted: { label: "Re-Admitted", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: CheckCircle },
};

const CHALLAN_STATUS_COLORS = {
  paid: "success",
  partial: "warning",
  issued: "info",
  overdue: "error",
  draft: "default",
  cancelled: "default",
  merged: "default",
};

const DOC_FIELDS = [
  { id: "profilePhoto", label: "Profile Photo", kind: "image" },
  { id: "cnicFront", label: "CNIC Front", kind: "image" },
  { id: "cnicBack", label: "CNIC Back", kind: "image" },
  { id: "matricCertificate", label: "Matric Certificate", kind: "file" },
  { id: "fscCertificate", label: "FSc / Intermediate", kind: "file" },
  { id: "domicileDoc", label: "Domicile Certificate", kind: "file" },
];

const StatusPill = ({ config, size = "medium" }) => {
  if (!config) return null;
  const Icon = config.icon;
  const dims = size === "small" ? { px: 1.25, py: 0.5, fs: 12, iconFs: 14 } : { px: 1.75, py: 0.75, fs: 13, iconFs: 17 };
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: dims.px,
        py: dims.py,
        borderRadius: 999,
        bgcolor: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
        fontWeight: 800,
        fontSize: dims.fs,
        fontFamily: "'Montserrat', sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      <Icon sx={{ fontSize: dims.iconFs }} />
      {config.label}
    </Box>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <Box display="flex" alignItems="flex-start" gap={1.25} py={0.75}>
    <Icon sx={{ fontSize: 17, color: "#94a3b8", mt: "1px" }} />
    <Box minWidth={0}>
      <Typography fontSize={10.5} fontWeight={800} color="#94a3b8" textTransform="uppercase" letterSpacing="0.04em">
        {label}
      </Typography>
      <Typography fontSize={13} fontWeight={700} color="#1e293b" sx={{ wordBreak: "break-word" }}>
        {value || "—"}
      </Typography>
    </Box>
  </Box>
);

const SectionCard = ({ title, icon: Icon, accent = "#2563eb", children, action, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: 2.5,
      border: "0.5px solid #e2e8f0",
      bgcolor: "#fff",
      overflow: "hidden",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      ...sx,
    }}
  >
    <Box
      sx={{
        px: 2.25,
        py: 1.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "0.5px solid #e2e8f0",
        bgcolor: "#f8fafc",
      }}
    >
      <Box display="flex" alignItems="center" gap={1}>
        {Icon && <Icon sx={{ fontSize: 18, color: accent }} />}
        <Typography fontSize={12.5} fontWeight={800} color="#0f172a" textTransform="uppercase" letterSpacing="0.04em" fontFamily="'Montserrat', sans-serif">
          {title}
        </Typography>
      </Box>
      {action}
    </Box>
    <Box sx={{ p: 2.25, flex: 1 }}>{children}</Box>
  </Paper>
);

// One filter "field" rendered as a self-contained card: icon + label on
// top, the control underneath — used for both the quick-search box and
// every batch-selection dropdown so the whole toolbar reads as one
// consistent grid instead of a mix of plain MUI TextFields.
const FieldCard = ({ icon: Icon, label, accent = "#2563eb", disabled, children }) => (
  <Box
    sx={{
      border: "1px solid #e2e8f0",
      borderRadius: 2,
      p: 1.5,
      bgcolor: disabled ? "#f8fafc" : "#fff",
      opacity: disabled ? 0.55 : 1,
      transition: "all 0.15s",
      minWidth: 0,
      "&:hover": disabled ? {} : { borderColor: "#cbd5e1" },
    }}
  >
    <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
      <Box
        sx={{
          width: 20,
          height: 20,
          borderRadius: 1,
          bgcolor: `${accent}1a`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 12.5, color: accent }} />
      </Box>
      <Typography fontSize={10} fontWeight={800} color="#94a3b8" textTransform="uppercase" letterSpacing="0.05em" noWrap>
        {label}
      </Typography>
    </Box>
    {children}
  </Box>
);

const fieldSelectSx = {
  fontSize: 13.5,
  fontWeight: 700,
  color: "#1e293b",
  ".MuiSelect-select": { py: 0.25 },
};

// Shared PDF/Excel export split-button — a single "Export" trigger that
// opens a 2-item menu, used both for the active student's full profile and
// for whichever batch list is on screen.
const ExportMenuButton = ({ onPdf, onExcel, disabled, label = "Export", variant = "outlined", sx = {} }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  return (
    <>
      <Button
        variant={variant}
        size="small"
        disabled={disabled}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        startIcon={<FileDownload sx={{ fontSize: 16 }} />}
        endIcon={<KeyboardArrowDown sx={{ fontSize: 16 }} />}
        sx={{ textTransform: "none", fontWeight: 700, fontSize: 12.5, ...sx }}
      >
        {label}
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onPdf();
          }}
          sx={{ fontSize: 13, gap: 1 }}
        >
          <PictureAsPdf sx={{ fontSize: 17, color: "#dc2626" }} /> Export as PDF
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onExcel();
          }}
          sx={{ fontSize: 13, gap: 1 }}
        >
          <GridOn sx={{ fontSize: 17, color: "#059669" }} /> Export as Excel
        </MenuItem>
      </Menu>
    </>
  );
};

const StudentAcademicHistoryView = () => {
  // --- States ---
  const [filters, setFilters] = useState({
    termId: "",
    departmentId: "",
    programId: "",
    semesterId: "",
  });
  const [searchRegNo, setSearchRegNo] = useState("");
  const [searchError, setSearchError] = useState("");
  const [activeStudent, setActiveStudent] = useState(null);

  // --- API Hooks: one pre-scoped catalog snapshot (university-only —
  // college/HSSC departments, programs and annual sessions are excluded so
  // the Department dropdown can never cascade into an empty Program list) ---
  const { data: catalogRes, isFetching: isFetchingCatalog } =
    useGetCompleteCatalogQuery({ excludeLevel: "HSSC" });
  const catalog = catalogRes?.data || {};
  const terms = catalog.terms || [];
  const departments = catalog.departments || [];

  const isBatchReady = Boolean(
    filters.termId && filters.programId && filters.semesterId,
  );

  const programs = useMemo(() => {
    if (!filters.departmentId) return [];
    return (catalog.programs || []).filter(
      (p) => (p.departmentId?._id || p.departmentId) === filters.departmentId,
    );
  }, [catalog.programs, filters.departmentId]);

  const semesters = useMemo(() => {
    if (!filters.programId) return [];
    return (catalog.semesters || [])
      .filter((s) => (s.programId?._id || s.programId) === filters.programId)
      .sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [catalog.semesters, filters.programId]);

  const { data: studentsRes, isFetching: isFetchingStudents } =
    useGetStudentsForRegistrationQuery(
      { programId: filters.programId, semesterId: filters.semesterId },
      { skip: !isBatchReady },
    );

  // --- API Hook (Course History) ---
  const [
    fetchHistory,
    { data: historyRes, isFetching: isFetchingHistory, isError },
  ] = useLazyGetStudentCourseHistoryQuery();

  // --- API Hook (Quick Search by reg no / name) ---
  const [findStudents, { isFetching: isSearching }] = useLazyGetAllStudentsQuery();

  // --- API Hooks (Full profile + fee status once a real student is picked) ---
  const activeStudentId = activeStudent?._id;
  const { data: studentDetailsRes, isFetching: isFetchingProfile } =
    useGetStudentDetailsQuery(activeStudentId, { skip: !activeStudentId });
  const studentDetails = studentDetailsRes?.data?.student || null;

  const { data: challansRes, isFetching: isFetchingChallans } =
    useGetChallansByStudentIdQuery(activeStudentId, { skip: !activeStudentId });
  const challans = challansRes?.data?.challans || [];

  // --- Data Extraction ---
  const students = normalizeArray(studentsRes);
  const degreeHistory = historyRes?.data || {};
  const semesterKeys = Object.keys(degreeHistory);

  // --- Handlers ---
  useEffect(() => {
    if (terms.length > 0 && !filters.termId) {
      const activeTerm = terms.find((t) => t.status) || terms[0];
      if (activeTerm) setFilters((p) => ({ ...p, termId: activeTerm._id }));
    }
  }, [terms]);

  const handleFilterChange = (field, value) => {
    if (field === "termId") {
      setFilters((p) => ({
        ...p,
        termId: value,
        departmentId: "",
        programId: "",
        semesterId: "",
      }));
    } else if (field === "departmentId") {
      setFilters((p) => ({
        ...p,
        departmentId: value,
        programId: "",
        semesterId: "",
      }));
    } else if (field === "programId") {
      setFilters((p) => ({ ...p, programId: value, semesterId: "" }));
    } else {
      setFilters((prev) => ({ ...prev, [field]: value }));
    }
    setActiveStudent(null); // Reset detail view when batch changes
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const term = searchRegNo.trim();
    if (!term) return;
    setSearchError("");
    try {
      const res = await findStudents({ search: term, limit: 5, includeAll: true }).unwrap();
      const match = normalizeArray(res)[0];
      if (!match) {
        setSearchError("No student found with that registration number or name.");
        return;
      }
      setActiveStudent(match);
      fetchHistory(match._id);
      setTimeout(
        () => window.scrollTo({ top: 380, behavior: "smooth" }),
        150,
      );
    } catch {
      setSearchError("Search failed. Please try again.");
    }
  };

  const handleViewHistory = (student) => {
    setActiveStudent(student);
    setSearchError("");
    fetchHistory(student._id);
    setTimeout(
      () => window.scrollTo({ top: 380, behavior: "smooth" }),
      100,
    );
  };

  const getStudentName = (s) =>
    s?.personalInfo?.fullName || s?.name || s?.fullName || "Unknown Student";
  const getRegNo = (s) =>
    s?.registrationNo || s?.studentId || s?.rollNo || "N/A";

  // --- Fee status for the student's CURRENT semester ---
  const feeSummary = useMemo(() => {
    if (!studentDetails) return null;
    const currentSemId = studentDetails.semester?._id;
    if (!currentSemId) return { status: "not_generated", net: 0, paid: 0, remaining: 0, list: [] };

    const live = challans.filter(
      (c) =>
        !c.isDeleted &&
        !["cancelled", "merged"].includes(c.status) &&
        (c.semesterId?._id || c.semesterId) === currentSemId,
    );

    const net = live.reduce((s, c) => s + (c.netAmount || 0), 0);
    const paid = live.reduce((s, c) => s + (c.paidAmount || 0), 0);
    const remaining = live.reduce((s, c) => s + (c.remainingAmount || 0), 0);

    let status = "not_generated";
    if (live.length) {
      if (live.some((c) => c.status === "overdue")) status = "overdue";
      else if (live.every((c) => c.status === "paid")) status = "paid";
      else if (paid > 0 && remaining > 0) status = "partial";
      else status = "unpaid";
    }

    return { status, net, paid, remaining, list: live };
  }, [studentDetails, challans]);

  const statusCfg = STUDENT_STATUS_MAP[studentDetails?.status] || null;
  const lifecycleCfg = LIFECYCLE_STATUS_MAP[studentDetails?.admissionLifecycleStatus] || null;
  const feeCfg = feeSummary ? FEE_STATUS_MAP[feeSummary.status] : null;
  const paidPct = feeSummary && feeSummary.net > 0
    ? Math.min(100, Math.round((feeSummary.paid / feeSummary.net) * 100))
    : 0;

  const docs = studentDetails?.documents || {};
  const otherDocs = Array.isArray(docs.otherDocuments) ? docs.otherDocuments : [];
  const uploadedDocCount = DOC_FIELDS.filter((d) => docs[d.id]).length;

  const selectedTerm = terms.find((t) => t._id === filters.termId);
  const selectedDept = departments.find((d) => d._id === filters.departmentId);
  const selectedProgram = programs.find((p) => p._id === filters.programId);
  const selectedSemester = semesters.find((s) => s._id === filters.semesterId);
  const batchLabel = [selectedDept?.name, selectedProgram?.name, selectedSemester ? `Sem ${selectedSemester.number}` : null]
    .filter(Boolean)
    .join(" · ") || "Selected Batch";
  const hasActiveFilters = Boolean(filters.departmentId || filters.programId || filters.semesterId);
  const resetFilters = () => {
    setFilters((p) => ({ ...p, departmentId: "", programId: "", semesterId: "" }));
    setActiveStudent(null);
  };

  const handleExportProfilePdf = () =>
    exportStudentProfilePDF({ studentDetails, activeStudent, feeSummary, degreeHistory });
  const handleExportProfileExcel = () =>
    exportStudentProfileExcel({ studentDetails, activeStudent, feeSummary, degreeHistory });
  const handleExportBatchPdf = () =>
    exportBatchListPDF(students, { getName: getStudentName, getRegNo, batchLabel });
  const handleExportBatchExcel = () =>
    exportBatchListExcel(students, { getName: getStudentName, getRegNo, batchLabel });

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f8fafc", fontFamily: "'Montserrat', sans-serif" }}>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={800} color="#0f172a" fontFamily="'Aleo', serif">
          Student Academic History
        </Typography>
        <Typography variant="body2" color="#64748b" mt={0.25} fontFamily="'Montserrat', sans-serif">
          Filter by batch or search by Registration Number to view a student's complete profile and degree progress.
        </Typography>
      </Box>

      {/* FIND A STUDENT — unified quick-search + batch-filter toolbar */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: "0.5px solid #e2e8f0",
          bgcolor: "#fff",
          overflow: "hidden",
          mb: 3,
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 1.75,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "0.5px solid #e2e8f0",
            bgcolor: "#f8fafc",
          }}
        >
          <Box display="flex" alignItems="center" gap={1.25}>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: 1.5,
                bgcolor: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FilterAlt sx={{ fontSize: 16, color: "#2563eb" }} />
            </Box>
            <Box>
              <Typography fontSize={13} fontWeight={800} color="#0f172a" fontFamily="'Montserrat', sans-serif">
                Find a Student
              </Typography>
              <Typography fontSize={11} color="#94a3b8">
                Search directly, or narrow down by session, department, program &amp; semester
              </Typography>
            </Box>
          </Box>
          {hasActiveFilters && (
            <Button
              size="small"
              onClick={resetFilters}
              startIcon={<RestartAlt sx={{ fontSize: 15 }} />}
              sx={{ textTransform: "none", fontWeight: 700, fontSize: 12, color: "#64748b" }}
            >
              Reset Filters
            </Button>
          )}
        </Box>

        {isFetchingCatalog && <LinearProgress sx={{ height: 2 }} />}

        <Box
          sx={{
            p: 2.25,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1.4fr 1fr 1fr 1fr 1fr" },
            gap: 1.5,
          }}
        >
          <FieldCard icon={Search} label="Quick Search" accent="#2563eb">
            <form onSubmit={handleSearch} style={{ display: "flex", gap: 6 }}>
              <input
                placeholder="Reg No or Student Name..."
                value={searchRegNo}
                onChange={(e) => { setSearchRegNo(e.target.value); setSearchError(""); }}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "none",
                  outline: "none",
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: "#1e293b",
                  fontFamily: "'Montserrat', sans-serif",
                  background: "transparent",
                }}
              />
              <Button
                type="submit"
                size="small"
                variant="contained"
                disableElevation
                disabled={isSearching}
                sx={{ bgcolor: "#2563eb", fontWeight: 700, textTransform: "none", fontSize: 12, minWidth: 0, px: 1.5 }}
              >
                {isSearching ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : "Find"}
              </Button>
            </form>
          </FieldCard>

          <FieldCard icon={CalendarMonth} label="Academic Term" accent="#0891b2">
            <Select
              fullWidth
              variant="standard"
              disableUnderline
              displayEmpty
              value={filters.termId || ""}
              onChange={(e) => handleFilterChange("termId", e.target.value)}
              sx={fieldSelectSx}
            >
              {terms.map((t) => (
                <MenuItem key={t._id} value={t._id} sx={{ fontSize: 13 }}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FieldCard>

          <FieldCard icon={AccountBalance} label="Department" accent="#7c3aed" disabled={!filters.termId}>
            <Select
              fullWidth
              variant="standard"
              disableUnderline
              displayEmpty
              disabled={!filters.termId}
              value={filters.departmentId || ""}
              onChange={(e) => handleFilterChange("departmentId", e.target.value)}
              sx={fieldSelectSx}
              renderValue={(v) => (v ? departments.find((d) => d._id === v)?.name : <em style={{ color: "#94a3b8", fontStyle: "normal" }}>All Departments</em>)}
            >
              <MenuItem value="" sx={{ fontSize: 13 }}>
                <em>All Departments</em>
              </MenuItem>
              {departments.map((d) => (
                <MenuItem key={d._id} value={d._id} sx={{ fontSize: 13 }}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FieldCard>

          <FieldCard icon={School} label="Program" accent="#059669" disabled={!filters.departmentId}>
            <Select
              fullWidth
              variant="standard"
              disableUnderline
              displayEmpty
              disabled={!filters.departmentId}
              value={filters.programId || ""}
              onChange={(e) => handleFilterChange("programId", e.target.value)}
              sx={fieldSelectSx}
              renderValue={(v) => (v ? programs.find((p) => p._id === v)?.name : <em style={{ color: "#94a3b8", fontStyle: "normal" }}>Select Program</em>)}
            >
              {programs.map((p) => (
                <MenuItem key={p._id} value={p._id} sx={{ fontSize: 13 }}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FieldCard>

          <FieldCard icon={Layers} label="Semester" accent="#c2410c" disabled={!filters.programId}>
            <Select
              fullWidth
              variant="standard"
              disableUnderline
              displayEmpty
              disabled={!filters.programId}
              value={filters.semesterId || ""}
              onChange={(e) => handleFilterChange("semesterId", e.target.value)}
              sx={fieldSelectSx}
              renderValue={(v) => (v ? (semesters.find((s) => s._id === v)?.name || `Semester ${semesters.find((s) => s._id === v)?.number}`) : <em style={{ color: "#94a3b8", fontStyle: "normal" }}>Select Semester</em>)}
            >
              {semesters.map((s) => (
                <MenuItem key={s._id} value={s._id} sx={{ fontSize: 13 }}>
                  {s.name || `Semester ${s.number}`}
                </MenuItem>
              ))}
            </Select>
          </FieldCard>
        </Box>

        {searchError && (
          <Typography fontSize={12} fontWeight={700} color="#e11d48" sx={{ px: 2.25, pb: 2 }}>
            {searchError}
          </Typography>
        )}
      </Paper>

      {/* STUDENTS LIST (Shows if a batch is selected) */}
      {isBatchReady && !activeStudent && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: "0.5px solid #e2e8f0",
            overflow: "hidden",
            bgcolor: "#fff",
            mb: 3,
          }}
        >
          <Box
            sx={{
              p: 2,
              bgcolor: "#f8fafc",
              borderBottom: "0.5px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Groups sx={{ color: "#2563eb", fontSize: 20 }} />
              <Typography fontSize={13} fontWeight={800} color="#0f172a" fontFamily="'Montserrat', sans-serif">
                Students in Selected Batch
              </Typography>
              {!isFetchingStudents && (
                <Chip
                  label={students.length}
                  size="small"
                  sx={{ height: 20, fontSize: 11, fontWeight: 800, bgcolor: "#eff6ff", color: "#1d4ed8" }}
                />
              )}
            </Box>
            {students.length > 0 && (
              <ExportMenuButton onPdf={handleExportBatchPdf} onExcel={handleExportBatchExcel} label="Export List" />
            )}
          </Box>

          {isFetchingStudents ? (
            <Box py={5} textAlign="center">
              <CircularProgress size={30} sx={{ color: "#2563eb" }} />
            </Box>
          ) : students.length === 0 ? (
            <Box py={5} textAlign="center" color="#94a3b8" fontSize={13}>
              No students found in this batch.
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", bgcolor: "#f8fafc" }}>Student Name</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", bgcolor: "#f8fafc" }}>Registration No.</TableCell>
                    <TableCell align="right" sx={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", bgcolor: "#f8fafc" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student._id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar
                            sx={{
                              width: 30,
                              height: 30,
                              bgcolor: "#eff6ff",
                              color: "#1d4ed8",
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            {getStudentName(student).charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography fontSize={13} fontWeight={700} color="#1e293b">
                            {getStudentName(student)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getRegNo(student)}
                          size="small"
                          sx={{ bgcolor: "#f1f5f9", fontSize: 11, fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<HistoryIcon sx={{ fontSize: 16 }} />}
                          onClick={() => handleViewHistory(student)}
                          sx={{ fontWeight: 700, textTransform: "none", fontSize: 12, borderColor: "#2563eb", color: "#2563eb" }}
                        >
                          View Full Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* STUDENT DETAIL DASHBOARD */}
      {activeStudent && (
        <Box>
          {/* --- Profile Hero --- */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2.5,
              border: "0.5px solid #e2e8f0",
              overflow: "hidden",
              mb: 2.5,
              background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
            }}
          >
            <Box sx={{ p: { xs: 2.5, md: 3 }, display: "flex", flexWrap: "wrap", gap: 2.5, alignItems: "center" }}>
              <Avatar
                src={docs.profilePhoto || undefined}
                sx={{
                  width: 68,
                  height: 68,
                  bgcolor: "rgba(255,255,255,0.15)",
                  color: "#fff",
                  fontSize: 26,
                  fontWeight: 800,
                  border: "2px solid rgba(255,255,255,0.35)",
                }}
              >
                {getStudentName(studentDetails || activeStudent).charAt(0).toUpperCase()}
              </Avatar>

              <Box flex={1} minWidth={220}>
                <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                  <Typography variant="h6" fontWeight={800} color="#fff" fontFamily="'Aleo', serif">
                    {getStudentName(studentDetails || activeStudent)}
                  </Typography>
                  {isFetchingProfile ? (
                    <Skeleton variant="rounded" width={90} height={26} sx={{ bgcolor: "rgba(255,255,255,0.15)" }} />
                  ) : (
                    <>
                      {statusCfg && <StatusPill config={statusCfg} />}
                      {lifecycleCfg && <StatusPill config={lifecycleCfg} />}
                    </>
                  )}
                </Box>
                <Typography fontSize={13} color="rgba(255,255,255,0.75)" fontWeight={600} mt={0.5}>
                  Reg No: {getRegNo(studentDetails || activeStudent)}
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1} mt={1.5}>
                  {[
                    studentDetails?.department?.name,
                    studentDetails?.program?.name,
                    studentDetails?.semester?.number ? `Semester ${studentDetails.semester.number}` : null,
                    studentDetails?.session?.name,
                  ]
                    .filter(Boolean)
                    .map((label, i) => (
                      <Chip
                        key={i}
                        label={label}
                        size="small"
                        sx={{
                          bgcolor: "rgba(255,255,255,0.12)",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 11.5,
                          border: "1px solid rgba(255,255,255,0.2)",
                        }}
                      />
                    ))}
                </Box>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                <ExportMenuButton
                  onPdf={handleExportProfilePdf}
                  onExcel={handleExportProfileExcel}
                  disabled={!studentDetails}
                  label="Export Profile"
                  sx={{
                    color: "#fff",
                    borderColor: "rgba(255,255,255,0.35)",
                    "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.08)" },
                  }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Close sx={{ fontSize: 16 }} />}
                  onClick={() => setActiveStudent(null)}
                  sx={{
                    color: "#fff",
                    borderColor: "rgba(255,255,255,0.35)",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: 12.5,
                    "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.08)" },
                  }}
                >
                  Close Profile
                </Button>
              </Box>
            </Box>
          </Paper>

          {isFetchingProfile && !studentDetails ? (
            <Grid container spacing={2.5} mb={2.5}>
              {[0, 1, 2].map((i) => (
                <Grid item xs={12} md={4} key={i}>
                  <Skeleton variant="rounded" height={220} sx={{ borderRadius: 2.5 }} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Grid container spacing={2.5} mb={2.5} alignItems="stretch">
              {/* --- Fee Status (current semester) --- */}
              <Grid item xs={12} md={4}>
                <SectionCard title="Fee Status — Current Semester" icon={Payments} accent="#059669">
                  {isFetchingChallans ? (
                    <Skeleton variant="rounded" height={140} />
                  ) : (
                    <>
                      <Box mb={2}>{feeCfg && <StatusPill config={feeCfg} />}</Box>

                      {feeSummary?.net > 0 && (
                        <Box mb={2}>
                          <LinearProgress
                            variant="determinate"
                            value={paidPct}
                            sx={{
                              height: 8,
                              borderRadius: 999,
                              bgcolor: "#f1f5f9",
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 999,
                                bgcolor: feeCfg?.color || "#059669",
                              },
                            }}
                          />
                          <Typography fontSize={11} fontWeight={700} color="#94a3b8" mt={0.5}>
                            {paidPct}% paid
                          </Typography>
                        </Box>
                      )}

                      <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={1} mb={2}>
                        <Box>
                          <Typography fontSize={10} fontWeight={800} color="#94a3b8" textTransform="uppercase">Net</Typography>
                          <Typography fontSize={13} fontWeight={800} color="#0f172a">{fmtMoney(feeSummary?.net)}</Typography>
                        </Box>
                        <Box>
                          <Typography fontSize={10} fontWeight={800} color="#94a3b8" textTransform="uppercase">Paid</Typography>
                          <Typography fontSize={13} fontWeight={800} color="#059669">{fmtMoney(feeSummary?.paid)}</Typography>
                        </Box>
                        <Box>
                          <Typography fontSize={10} fontWeight={800} color="#94a3b8" textTransform="uppercase">Due</Typography>
                          <Typography fontSize={13} fontWeight={800} color="#dc2626">{fmtMoney(feeSummary?.remaining)}</Typography>
                        </Box>
                      </Box>

                      {feeSummary?.list?.length > 0 && (
                        <Box>
                          <Divider sx={{ mb: 1 }} />
                          <Box display="flex" flexDirection="column" gap={0.75} sx={{ maxHeight: 150, overflowY: "auto" }}>
                            {feeSummary.list.map((c) => (
                              <Box key={c._id} display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                                <Box display="flex" alignItems="center" gap={0.75} minWidth={0}>
                                  <ReceiptLong sx={{ fontSize: 14, color: "#94a3b8", flexShrink: 0 }} />
                                  <Typography fontSize={11.5} fontWeight={700} color="#334155" noWrap>
                                    {c.challanType} · {fmtDate(c.dueDate)}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={c.status}
                                  size="small"
                                  color={CHALLAN_STATUS_COLORS[c.status] || "default"}
                                  sx={{ fontSize: 10, height: 18, fontWeight: 700, textTransform: "capitalize" }}
                                />
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </>
                  )}
                </SectionCard>
              </Grid>

              {/* --- Personal & Family Details --- */}
              <Grid item xs={12} md={4}>
                <SectionCard title="Personal & Family Details" icon={FamilyRestroom} accent="#7c3aed">
                  {!studentDetails ? (
                    <Skeleton variant="rounded" height={140} />
                  ) : (
                    <Box>
                      <InfoRow icon={Phone} label="Phone" value={studentDetails.personalInfo?.phone} />
                      <InfoRow icon={Email} label="Email" value={studentDetails.personalInfo?.email} />
                      <InfoRow icon={BadgeIcon} label="CNIC" value={studentDetails.personalInfo?.cnic} />
                      <Box display="flex" gap={2}>
                        <Box flex={1}><InfoRow icon={Cake} label="DOB" value={fmtDate(studentDetails.personalInfo?.dob)} /></Box>
                        <Box flex={1}><InfoRow icon={Wc} label="Gender" value={studentDetails.personalInfo?.gender} /></Box>
                      </Box>
                      <InfoRow
                        icon={Home}
                        label="Address"
                        value={
                          studentDetails.personalInfo?.currentAddress?.address
                            ? `${studentDetails.personalInfo.currentAddress.address}, ${studentDetails.personalInfo.currentAddress.district || ""}`
                            : null
                        }
                      />
                      <Divider sx={{ my: 1 }} />
                      <InfoRow icon={FamilyRestroom} label="Father's Name" value={studentDetails.familyInfo?.fatherName} />
                      <InfoRow icon={Phone} label="Guardian Phone" value={studentDetails.familyInfo?.guardianPhone} />
                    </Box>
                  )}
                </SectionCard>
              </Grid>

              {/* --- Documents --- */}
              <Grid item xs={12} md={4}>
                <SectionCard
                  title="Documents"
                  icon={Description}
                  accent="#0891b2"
                  action={
                    <Chip
                      label={`${uploadedDocCount}/${DOC_FIELDS.length} uploaded`}
                      size="small"
                      sx={{ fontSize: 10.5, height: 20, fontWeight: 800, bgcolor: "#f1f5f9" }}
                    />
                  }
                >
                  {!studentDetails ? (
                    <Skeleton variant="rounded" height={140} />
                  ) : (
                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
                      {DOC_FIELDS.map((d) => {
                        const url = docs[d.id];
                        const Icon = d.kind === "image" ? ImageIcon : PictureAsPdf;
                        return (
                          <Tooltip key={d.id} title={url ? "Click to view" : "Not uploaded"}>
                            <Box
                              component={url ? "a" : "div"}
                              href={url || undefined}
                              target={url ? "_blank" : undefined}
                              rel="noreferrer"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                                p: 1,
                                borderRadius: 1.5,
                                border: `1px solid ${url ? "#a7f3d0" : "#e2e8f0"}`,
                                bgcolor: url ? "#f0fdf4" : "#f8fafc",
                                textDecoration: "none",
                                cursor: url ? "pointer" : "default",
                                transition: "all 0.15s",
                                "&:hover": url ? { borderColor: "#059669" } : {},
                              }}
                            >
                              <Icon sx={{ fontSize: 15, color: url ? "#059669" : "#cbd5e1", flexShrink: 0 }} />
                              <Typography fontSize={10.5} fontWeight={700} color={url ? "#065f46" : "#94a3b8"} noWrap flex={1}>
                                {d.label}
                              </Typography>
                              {url && <OpenInNew sx={{ fontSize: 12, color: "#059669", flexShrink: 0 }} />}
                            </Box>
                          </Tooltip>
                        );
                      })}
                      {otherDocs.map((url, i) => (
                        <Box
                          key={i}
                          component="a"
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.75,
                            p: 1,
                            borderRadius: 1.5,
                            border: "1px solid #a7f3d0",
                            bgcolor: "#f0fdf4",
                            textDecoration: "none",
                          }}
                        >
                          <Description sx={{ fontSize: 15, color: "#059669" }} />
                          <Typography fontSize={10.5} fontWeight={700} color="#065f46" noWrap flex={1}>
                            Other Doc {i + 1}
                          </Typography>
                          <OpenInNew sx={{ fontSize: 12, color: "#059669" }} />
                        </Box>
                      ))}
                    </Box>
                  )}
                </SectionCard>
              </Grid>
            </Grid>
          )}

          {/* --- ACADEMIC HISTORY --- */}
          <Box>
            <Typography fontSize={13} fontWeight={800} color="#0f172a" textTransform="uppercase" letterSpacing="0.04em" mb={1.5} display="flex" alignItems="center" gap={1}>
              <School sx={{ fontSize: 18, color: "#2563eb" }} />
              Academic History — Semester Wise
            </Typography>

            {isFetchingHistory ? (
              <Box py={10} textAlign="center">
                <CircularProgress />
              </Box>
            ) : isError ? (
              <Paper
                sx={{
                  py: 6,
                  textAlign: "center",
                  border: "1px solid #fecaca",
                  bgcolor: "#fef2f2",
                  borderRadius: 3,
                }}
              >
                <Typography color="error.main" fontWeight="bold">
                  Failed to load history. Verify the student ID.
                </Typography>
              </Paper>
            ) : semesterKeys.length === 0 && historyRes ? (
              <Paper
                sx={{
                  py: 6,
                  textAlign: "center",
                  border: "1px dashed #cbd5e1",
                  borderRadius: 3,
                  bgcolor: "white",
                }}
              >
                <Typography color="text.secondary">
                  This student does not have any enrolled courses in their history
                  yet.
                </Typography>
              </Paper>
            ) : (
              <Box>
                {semesterKeys.map((semesterName, index) => {
                  const termName = degreeHistory[semesterName].term;
                  const courses = degreeHistory[semesterName].courses;
                  const sgpa = degreeHistory[semesterName].sgpa;

                  return (
                    <Accordion
                      key={index}
                      defaultExpanded={index === semesterKeys.length - 1}
                      elevation={0}
                      sx={{
                        mb: 1.5,
                        border: "0.5px solid #e2e8f0",
                        borderRadius: "12px !important",
                        overflow: "hidden",
                        "&:before": { display: "none" },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMore sx={{ color: "#64748b" }} />}
                        sx={{
                          bgcolor: "#f8fafc",
                          "&.Mui-expanded": { minHeight: 48 },
                        }}
                      >
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          width="100%"
                          alignItems="center"
                          flexWrap="wrap"
                          gap={1}
                          pr={2}
                        >
                          <Typography
                            fontSize={14}
                            fontWeight={800}
                            color="#0f172a"
                            fontFamily="'Montserrat', sans-serif"
                          >
                            {semesterName}
                          </Typography>
                          <Box display="flex" gap={1} flexWrap="wrap">
                            {termName && (
                              <Chip
                                label={termName}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: 11, fontWeight: 700 }}
                              />
                            )}
                            {sgpa !== null && sgpa !== undefined && (
                              <Chip
                                label={`SGPA: ${sgpa.toFixed(2)}`}
                                size="small"
                                sx={{ fontSize: 11, fontWeight: 800, bgcolor: "#eff6ff", color: "#1d4ed8" }}
                              />
                            )}
                            <Chip
                              label={`${courses.length} Courses`}
                              size="small"
                              sx={{ fontSize: 11, fontWeight: 700, bgcolor: "#f1f5f9", color: "#475569" }}
                            />
                          </Box>
                        </Box>
                      </AccordionSummary>

                      <AccordionDetails sx={{ p: 0 }}>
                        <TableContainer sx={{ overflowX: "auto" }}>
                          <Table size="small" sx={{ minWidth: 720 }}>
                            <TableHead sx={{ bgcolor: "#ffffff" }}>
                              <TableRow>
                                <TableCell sx={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Course Title</TableCell>
                                <TableCell sx={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Code</TableCell>
                                <TableCell sx={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Credits</TableCell>
                                <TableCell sx={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Prerequisites</TableCell>
                                <TableCell sx={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Marks</TableCell>
                                <TableCell sx={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Grade</TableCell>
                                <TableCell sx={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {courses.map((course, cIdx) => (
                                <TableRow key={cIdx} hover>
                                  <TableCell>
                                    <Typography fontSize={13} fontWeight={700} color="#334155">
                                      {course.title}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={course.code}
                                      size="small"
                                      sx={{
                                        bgcolor: "#f1f5f9",
                                        fontWeight: 700,
                                        fontSize: 11,
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell sx={{ fontSize: 12.5 }}>
                                    {course.creditHours
                                      ? `${course.creditHours.theory}Th + ${course.creditHours.lab}Lab`
                                      : "3"}
                                  </TableCell>
                                  <TableCell>
                                    {course.prerequisites?.length > 0 ? (
                                      course.prerequisites.map((p, i) => (
                                        <Chip
                                          key={i}
                                          size="small"
                                          variant="outlined"
                                          color="warning"
                                          icon={<AccountTree fontSize="small" />}
                                          label={p.code || p}
                                          sx={{ mr: 0.5, fontSize: 11 }}
                                        />
                                      ))
                                    ) : (
                                      <Typography variant="caption" color="text.disabled">
                                        None
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {course.obtainedMarks !== null && course.obtainedMarks !== undefined ? (
                                      <Typography variant="body2" fontSize={12.5}>
                                        {course.obtainedMarks} / {course.totalMarks}
                                        {course.percentage !== null && (
                                          <Typography component="span" variant="caption" color="text.secondary" ml={0.5}>
                                            ({course.percentage}%)
                                          </Typography>
                                        )}
                                      </Typography>
                                    ) : (
                                      <Typography variant="caption" color="text.disabled">—</Typography>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {course.grade ? (
                                      <Chip
                                        label={course.grade}
                                        size="small"
                                        color={course.grade === "F" ? "error" : "success"}
                                        sx={{ fontWeight: 800, fontSize: 11 }}
                                      />
                                    ) : (
                                      <Typography variant="caption" color="text.disabled">—</Typography>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={course.registrationStatus || "Registered"}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: 11, fontWeight: 700 }}
                                      color={
                                        course.registrationStatus === "Failed"
                                          ? "error"
                                          : course.registrationStatus === "Passed"
                                            ? "success"
                                            : course.registrationStatus === "Dropped"
                                              ? "default"
                                              : "info"
                                      }
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default StudentAcademicHistoryView;
