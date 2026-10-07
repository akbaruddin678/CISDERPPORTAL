import { useState, useEffect, useCallback, useMemo } from "react";

import {
  useGetStudentsQuery,
  useLazyGetStudentsQuery,
  useLazyGetScholarshipStatusBatchQuery,
} from "../api/accountantstudentApi";
import {
  useLazyGetMasterFinancialReportQuery,
  useGetStudentFinancialDossierQuery,
} from "../api/studentChallanApi";
// ✅ Only need the Complete Catalog hook now
import { useGetCompleteCatalogQuery } from "../api/depsemtermpro";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { buildMasterFinancialWorkbook } from "../common/masterFinancialWorkbook";
import {
  exportStudentDirectoryExcel,
  exportStudentDirectoryPDF,
} from "../common/studentDirectoryExport";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const fmtRs = (v) => `Rs. ${Number(v || 0).toLocaleString()}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "N/A");

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

const challanTableColumns = [
  "Challan No",
  "Type",
  "Inst. #",
  "Generated",
  "Due Date",
  "Base",
  "Fine",
  "Net",
  "Paid",
  "Status",
];
const challanTableColumnStyles = {
  5: { halign: "right" },
  6: { halign: "right" },
  7: { halign: "right", fontStyle: "bold" },
  8: { halign: "right", fontStyle: "bold", textColor: [21, 128, 61] },
};
const challanTableRows = (challans) =>
  (challans || []).map((c) => [
    c.challanNo || "—",
    (c.challanType || "").replace(/_/g, " "),
    c.isInstallment ? c.installmentNumber : "—",
    fmtDate(c.createdAt),
    fmtDate(c.dueDate),
    fmtRs(c.originalTotal),
    fmtRs(c.fineAmount),
    fmtRs(c.netAmount),
    fmtRs(c.paidAmount),
    (c.isImplied ? "Assumed Paid" : c.status || "—").toUpperCase(),
  ]);

// Builds a single-student PDF covering all three of the profile page's
// tabs — Profile, Dashboard, and Ledger — but organized per-semester (each
// semester gets its own Fee Setup/Paid/Dues summary AND its own challan
// list right underneath, instead of one combined all-time ledger at the
// end) — entirely client-side from data the dossier query has already
// loaded. There is no backend "/api/reports" route (it 404s/500s — it was
// never implemented), so this replaces that broken server round-trip the
// same way the Excel export already does.
// Builds a single-student PDF covering all three of the profile page's
// tabs — Profile, Dashboard, and Ledger — but organized per-semester (each
// semester gets its own Fee Setup/Paid/Dues summary AND its own challan
// list right underneath, instead of one combined all-time ledger at the
// end) — entirely client-side from data the dossier query has already
// loaded. There is no backend "/api/reports" route (it 404s/500s — it was
// never implemented), so this replaces that broken server round-trip the
// same way the Excel export already does.
async function buildStudentFinancialPDF({
  safeFullName,
  safeRegNo,
  safeFatherName,
  studentDetails,
  overallReport,
  semesterReports,
  availableSemesters,
}) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  let logoImg = null;
  let accountsImg = null; // ✅ Setup variable for stamp

  try {
    logoImg = await loadImage(`${window.location.origin}/cisd-logo.png`);
  } catch {
    // Logo is a nice-to-have — the report still generates fine without it.
  }

  try {
    // ✅ Load the accounts stamp/signature from the public folder
    accountsImg = await loadImage(`${window.location.origin}/accounts.png`);
  } catch {
    // Ignore if missing — report generates without it
  }

  // Drawn on every page (first page and each new one added below) so the
  // institute header stays consistent throughout the whole report.
  const drawHeader = () => {
    if (logoImg) {
      try {
        doc.addImage(logoImg, "PNG", 14, 8, 18, 18);
      } catch {
        // Ignore — a malformed/undecodable image shouldn't block the report.
      }
    }
    doc.setFontSize(15);
    doc.setTextColor(30, 58, 138);
    doc.setFont(undefined, "bold");
    doc.text("CISD", pageWidth / 2, 15, {
      align: "center",
    });
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont(undefined, "normal");
    doc.text("Account Reports", pageWidth / 2, 21, { align: "center" });
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.line(14, 28, pageWidth - 14, 28);
  };

  drawHeader();
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-GB")}`,
    pageWidth - 14,
    13,
    { align: "right" },
  );

  // ── Section 1: Profile — two label/value pairs per row ──
  autoTable(doc, {
    startY: 31,
    head: [["Profile", "", "", ""]],
    body: [
      [
        "Reg No",
        safeRegNo,
        "Program",
        studentDetails?.programId?.name || "N/A",
      ],
      [
        "Full Name",
        safeFullName,
        "Department",
        studentDetails?.departmentId?.name || "N/A",
      ],
      [
        "Father Name",
        safeFatherName,
        "Session",
        studentDetails?.termId?.name || "N/A",
      ],
      [
        "Current Semester",
        studentDetails?.semesterId?.number
          ? `Semester ${studentDetails.semesterId.number}`
          : "N/A",
        "",
        "",
      ],
    ],
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 1.8 },
    headStyles: { fillColor: [79, 70, 229], fontStyle: "bold" },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 42 },
      2: { fontStyle: "bold", cellWidth: 42 },
    },
  });

  // ── Section 2: Dashboard — Overall (all semesters combined) ──
  const overallFs = overallReport?.financialSummary || {};
  let y = doc.lastAutoTable.finalY + 4;
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.setFont(undefined, "bold");
  doc.text("Financial Dashboard — Overall (All Semesters)", 14, y);
  doc.setFont(undefined, "normal");

  autoTable(doc, {
    startY: y + 2,
    head: [["Total Billed", "Total Paid", "Outstanding", "Scholarships"]],
    body: [
      [
        fmtRs(overallFs.netGenerated),
        fmtRs(overallFs.totalPaid),
        fmtRs(overallFs.totalPending),
        fmtRs(overallFs.scholarships),
      ],
    ],
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 1.8, halign: "center" },
    headStyles: { fillColor: [79, 70, 229], fontStyle: "bold" },
  });

  // ── Section 3: per-semester blocks ──
  const semesterNumberMap = new Map(
    (availableSemesters || []).map((s) => [String(s._id), s.number]),
  );
  const sortedSemesterReports = [...(semesterReports || [])].sort(
    (a, b) =>
      (semesterNumberMap.get(String(a.semesterId)) ?? 0) -
      (semesterNumberMap.get(String(b.semesterId)) ?? 0),
  );

  y = doc.lastAutoTable.finalY + 4;
  const currentSemesterNumber = studentDetails?.semesterId?.number ?? null;

  sortedSemesterReports.forEach((r) => {
    const semNum = semesterNumberMap.get(String(r.semesterId)) ?? "—";
    const stats = r.challanStats || {};
    const fs = r.financialSummary || {};
    const tuitionPaid = r.tuitionPaid ?? fs.breakdown?.ACADEMIC?.paid ?? 0;
    const tuitionOutstanding = r.tuitionOutstanding ?? 0;
    const isCurrentSemester =
      currentSemesterNumber == null || semNum === currentSemesterNumber;

    if (y > pageHeight - 40) {
      doc.addPage();
      drawHeader();
      y = 32;
    }

    if (!isCurrentSemester) {
      const outstanding = tuitionOutstanding || fs.totalPending || 0;
      const paddedSemNum =
        typeof semNum === "number" ? String(semNum).padStart(2, "0") : semNum;
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.setFont(undefined, "bold");
      doc.text(
        outstanding > 0
          ? `Semester ${paddedSemNum} : ${fmtRs(outstanding)} Outstanding`
          : `Semester ${paddedSemNum} : All Dues Cleared`,
        14,
        y + 3,
      );
      doc.setFont(undefined, "normal");
      y += 10;
      return;
    }

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.setFont(undefined, "bold");
    doc.text(`Semester ${semNum}`, 14, y + 3);
    doc.setFont(undefined, "normal");

    autoTable(doc, {
      startY: y + 5,
      head: [
        [
          "Total Fee Setup",
          "Total Paid",
          "Outstanding / Dues",
          "Scholarships",
          "Fines",
        ],
      ],
      body: [
        [
          fmtRs(r.configuredFees?.ACADEMIC ?? fs.netGenerated),
          fmtRs(tuitionPaid || fs.totalPaid),
          fmtRs(tuitionOutstanding || fs.totalPending),
          fmtRs(fs.scholarships),
          fmtRs(stats.totalFines),
        ],
      ],
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 1.8, halign: "center" },
      headStyles: { fillColor: [79, 70, 229], fontStyle: "bold" },
      margin: { top: 28 },
      didDrawPage: drawHeader,
    });

    const semChallans = r.ledger || [];
    if (semChallans.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 2,
        head: [challanTableColumns],
        body: challanTableRows(semChallans),
        theme: "striped",
        styles: { fontSize: 7, cellPadding: 1.3 },
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          fontStyle: "bold",
        },
        columnStyles: challanTableColumnStyles,
        margin: { top: 28 },
        didDrawPage: drawHeader,
      });
      y = doc.lastAutoTable.finalY + 6;
    } else {
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        "No challans generated for this semester.",
        14,
        doc.lastAutoTable.finalY + 6,
      );
      y = doc.lastAutoTable.finalY + 10;
    }
  });

  // ✅ ── Section 4: Authorized Stamp & Signature ──
  let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : y + 20;

  // If the signature block (needs ~35 units) runs off the page, break to a new page
  if (finalY + 35 > pageHeight) {
    doc.addPage();
    drawHeader();
    finalY = 40;
  }

  // Draw the image on the right side if it successfully loaded
  if (accountsImg) {
    try {
      // You may need to tweak width (40) and height (20) to perfectly match your accounts.png aspect ratio
      doc.addImage(accountsImg, "PNG", pageWidth - 55, finalY, 40, 20);
    } catch {
      // Ignore malformed image
    }
  }

  // Draw the signature line and text label underneath
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 60, finalY + 22, pageWidth - 14, finalY + 22);

  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFont(undefined, "bold");
  doc.text("Accounts Officer", pageWidth - 37, finalY + 28, { align: "center" });

  return doc.output("blob");
}

// Builds a financial workbook (profile summary sheet + full challan ledger
// sheet) entirely client-side from data the app has already fetched — used
// both for a single student (student profile view) and for many students at
// once (Master Data export). There is no backend "/api/reports" endpoint;
// this generates the .xlsx directly in the browser via the `xlsx` package.
async function buildStudentFinancialWorkbook(studentsArray) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  const summaryRows = studentsArray.map((s) => {
    const fs = s.financialSummary || {};
    const sch = s.activeScholarship;
    return {
      "Reg No": s.studentId || "—",
      "Student Name": s.personalInfo?.fullName || s.fullName || "—",
      Program: s.programId?.name || "—",
      Department: s.departmentId?.name || "—",
      Semester: s.semesterId?.number ? `Semester ${s.semesterId.number}` : "—",
      Session: s.termId?.name || "—",
      "Net Billed": fs.netGenerated || 0,
      "Total Paid": fs.totalPaid || 0,
      Outstanding: fs.totalPending || 0,
      Scholarships: fs.scholarships || 0,
      Discounts: fs.discounts || 0,
      "Fines Paid": fs.finesPaid || 0,
      "% Paid": fs.netGenerated
        ? `${Math.round((fs.totalPaid / fs.netGenerated) * 100)}%`
        : "0%",
      "Scholarship Plan": sch?.hasScholarship ? sch.plan?.title || "—" : "—",
      "Scholarship Rate": sch?.hasScholarship
        ? sch.plan?.type === "fixed"
          ? `Rs. ${(sch.plan?.maxAmount || 0).toLocaleString()} flat`
          : `${sch.plan?.maxPercentage || 0}%`
        : "—",
      "Current Semester Tuition": sch?.hasScholarship ? sch.tuitionPortion || 0 : "—",
      "Scholarship Deduction (Current Sem)": sch?.hasScholarship
        ? sch.scholarshipAmount || 0
        : "—",
      "Net Payable Tuition (Current Sem)": sch?.hasScholarship
        ? sch.netTuition || 0
        : "—",
    };
  });

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet["!cols"] = [
    { wch: 16 },
    { wch: 28 },
    { wch: 30 },
    { wch: 24 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 8 },
    { wch: 22 },
    { wch: 18 },
    { wch: 20 },
    { wch: 26 },
    { wch: 26 },
  ];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Student Summary");

  const challanRows = [];
  for (const s of studentsArray) {
    const name = s.personalInfo?.fullName || s.fullName || "—";
    const regNo = s.studentId || "—";
    for (const c of s.ledger || []) {
      challanRows.push({
        "Reg No": regNo,
        "Student Name": name,
        "Challan No": c.challanNo,
        Type: (c.challanType || "").replace(/_/g, " "),
        "Installment #": c.isInstallment ? c.installmentNumber : "—",
        "Generated On": c.createdAt
          ? new Date(c.createdAt).toLocaleDateString("en-GB")
          : "—",
        "Due Date": c.dueDate
          ? new Date(c.dueDate).toLocaleDateString("en-GB")
          : "—",
        "Base Amount": c.originalTotal || 0,
        Fine: c.fineAmount || 0,
        "Net Amount": c.netAmount || 0,
        "Paid Amount": c.paidAmount || 0,
        Status: c.isImplied ? "Assumed Paid" : c.status,
      });
    }
  }
  if (challanRows.length > 0) {
    const challanSheet = XLSX.utils.json_to_sheet(challanRows);
    challanSheet["!cols"] = [
      { wch: 16 },
      { wch: 28 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 10 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, challanSheet, "All Challans");
  }

  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

const LIMIT = 30;

const StudentReportController = ({ children }) => {
  const { openAlert } = useGlobalAlert();

  const [filters, setFilters] = useState({
    termId: "",
    departmentId: "",
    programId: "",
    semesterId: "",
    search: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [studentsList, setStudentsList] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [isStudentExcelExporting, setIsStudentExcelExporting] = useState(false);
  const [isMasterExporting, setIsMasterExporting] = useState(false);
  const [isDirectoryExcelExporting, setIsDirectoryExcelExporting] = useState(false);
  const [isDirectoryPdfExporting, setIsDirectoryPdfExporting] = useState(false);

  useEffect(() => {
    const h = setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => clearTimeout(h);
  }, [filters.search]);

  useEffect(() => {
    setPage(1);
    setStudentsList([]);
    setHasMore(true);
  }, [
    filters.termId,
    filters.departmentId,
    filters.programId,
    filters.semesterId,
    debouncedSearch,
  ]);

  // ✅ Fetch the unified, strictly filtered backend catalog
  const { data: catalogRes } = useGetCompleteCatalogQuery({
    excludeLevel: "HSSC",
  });
  const catalog = catalogRes?.data || {
    departments: [],
    programs: [],
    terms: [],
    semesters: [],
  };

  const departments = catalog.departments || [];
  const terms = catalog.terms || [];

  // Filter programs based purely on the selected department
  const strictFilteredPrograms = useMemo(() => {
    if (!filters.departmentId) return [];
    return catalog.programs.filter((p) => {
      const id =
        typeof p.departmentId === "object"
          ? p.departmentId?._id
          : p.departmentId;
      return String(id) === String(filters.departmentId);
    });
  }, [catalog.programs, filters.departmentId]);

  // Filter semesters based purely on the selected program
  const strictFilteredSemesters = useMemo(() => {
    if (!filters.programId) return [];
    return catalog.semesters
      .filter((s) => {
        const id =
          typeof s.programId === "object" ? s.programId?._id : s.programId;
        return String(id) === String(filters.programId);
      })
      .sort(
        (a, b) => (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0),
      );
  }, [catalog.semesters, filters.programId]);

  // Fetch the students, ensuring we only ask for University students
  const { data: studentsRes, isFetching: isSearching } = useGetStudentsQuery({
    search: debouncedSearch,
    termId: filters.termId,
    departmentId: filters.departmentId,
    programId: filters.programId,
    semesterId: filters.semesterId,
    excludeLevel: "HSSC",
    page,
    limit: LIMIT,
  });

  // Separate, on-demand fetch for the Directory export — `studentsList`
  // above is only whatever's been paginated into the sidebar so far (30 at
  // a time), so exporting it directly silently cuts the roster off at
  // however far the accountant happened to scroll. This instead asks the
  // backend for EVERY student matching the current filters in one shot
  // (a very high limit, same endpoint/filters as the sidebar) right before
  // building the file, so the export always reflects the full filtered
  // set regardless of what's been scrolled into view on screen.
  const [fetchAllStudents] = useLazyGetStudentsQuery();
  const fetchAllMatchingStudents = async () => {
    const res = await fetchAllStudents({
      search: debouncedSearch,
      termId: filters.termId,
      departmentId: filters.departmentId,
      programId: filters.programId,
      semesterId: filters.semesterId,
      excludeLevel: "HSSC",
      page: 1,
      limit: 100000,
    }).unwrap();
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.data?.students)) return res.data.students;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.students)) return res.students;
    return [];
  };

  // Stamps hasScholarship/scholarshipName onto each student, batching the
  // lookup in chunks (a query string with 1000+ ids in one go risks
  // hitting URL length limits) rather than one request per student.
  const [fetchScholarshipStatus] = useLazyGetScholarshipStatusBatchQuery();
  const enrichWithScholarshipStatus = async (students) => {
    const CHUNK = 300;
    const statusMap = {};
    for (let i = 0; i < students.length; i += CHUNK) {
      const chunkIds = students.slice(i, i + CHUNK).map((s) => s._id);
      if (!chunkIds.length) continue;
      const res = await fetchScholarshipStatus(chunkIds).unwrap();
      Object.assign(statusMap, res?.data || {});
    }
    return students.map((s) => ({
      ...s,
      hasScholarship: statusMap[s._id]?.hasScholarship || false,
      scholarshipName: statusMap[s._id]?.scholarshipName || null,
    }));
  };

  useEffect(() => {
    if (!studentsRes) return;
    let fetched = [];
    if (Array.isArray(studentsRes?.data?.data)) fetched = studentsRes.data.data;
    else if (Array.isArray(studentsRes?.data?.students))
      fetched = studentsRes.data.students;
    else if (Array.isArray(studentsRes?.data)) fetched = studentsRes.data;
    else if (Array.isArray(studentsRes?.students))
      fetched = studentsRes.students;

    const meta =
      studentsRes?.data?.pagination ||
      studentsRes?.data?.meta ||
      studentsRes?.pagination ||
      {};
    const totalPages = meta?.totalPages || meta?.pages || 1;
    const curPage = meta?.currentPage || meta?.page || page;
    setHasMore(curPage < totalPages || fetched.length === LIMIT);

    setStudentsList((prev) => {
      if (page === 1) return fetched;
      const ids = new Set(prev.map((s) => s._id));
      return [...prev, ...fetched.filter((s) => !ids.has(s._id))];
    });
  }, [studentsRes]);

  const loadMoreStudents = useCallback(() => {
    if (isSearching || !hasMore) return;
    setPage((p) => p + 1);
  }, [isSearching, hasMore]);

  // ONE request returns everything: the student, the all-time "Overall"
  // report, and a COMPLETE, independent report for every semester the
  // student has data in (Fee Setup, Ledger, Installment Plan, Monthly
  // Collection, Challan Stats each computed separately per semester on
  // the backend) — so nothing gets blended together client-side.
  const { data: dossierRes, isFetching: isLoadingDetails } =
    useGetStudentFinancialDossierQuery(
      { id: selectedStudentId, termId: filters.termId },
      { skip: !selectedStudentId },
    );

  const dossier = dossierRes?.data || {};
  const studentDetails = dossier.student || null;
  const availableSemesters = dossier.availableSemesters || [];
  const overallReport = dossier.overallReport || {};
  const semesterReports = dossier.semesterReports || [];
  const activeScholarship = dossier.activeScholarship || null;

  // The full-student exports (Excel/PDF) are based on the Overall report —
  // the complete, all-semester picture — regardless of which semester
  // section the user happens to be looking at on screen.
  const studentChallans = overallReport.ledger || [];
  const financialSummary = overallReport.financialSummary || { breakdown: {} };

  const safeFullName =
    studentDetails?.personalInfo?.fullName ||
    studentDetails?.fullName ||
    "Unknown Student";
  const safeFatherName =
    studentDetails?.familyInfo?.fatherName ||
    studentDetails?.personalInfo?.fatherName ||
    studentDetails?.fatherName ||
    "N/A";
  const safeRegNo = studentDetails?.studentId || "N/A";
  const safeCnic =
    studentDetails?.personalInfo?.cnic || studentDetails?.cnic || "N/A";
  const safePhone =
    studentDetails?.personalInfo?.phone ||
    studentDetails?.phone ||
    studentDetails?.contactNumber ||
    "N/A";
  const safeEmail =
    studentDetails?.personalInfo?.email || studentDetails?.email || "N/A";
  const safeDob =
    studentDetails?.personalInfo?.dob || studentDetails?.dob || null;
  const safeAddress =
    studentDetails?.personalInfo?.currentAddress ||
    studentDetails?.currentAddress ||
    studentDetails?.address ||
    null;

  // fullInstallmentPlan / financialSummary / isInstallmentConfigured /
  // configuredInstallmentCount now come straight from the dossier (see
  // above) — the backend builds them from the real StudentFeePreference
  // and the semester-scoped ledger, so there's nothing left to reconstruct
  // client-side.
  const safeFinancialSummary = financialSummary;

  const handleExportStudentPDF = async () => {
    if (!selectedStudentId || !studentDetails) return;
    setIsPdfExporting(true);
    try {
      const blob = await buildStudentFinancialPDF({
        safeFullName,
        safeRegNo,
        safeFatherName,
        studentDetails,
        overallReport,
        semesterReports,
        availableSemesters,
      });
      downloadBlob(
        blob,
        `${safeRegNo}_${safeFullName.replace(/\s+/g, "_")}_Financial_Report.pdf`,
      );
    } catch (err) {
      openAlert?.({
        type: "error",
        message: "Failed to export PDF. Please try again.",
      });
    } finally {
      setIsPdfExporting(false);
    }
  };

  // There is no backend endpoint for this — the student's profile,
  // financial summary and full challan ledger are already loaded (dossier
  // query above), so the workbook is built directly from that data instead
  // of round-tripping to a server route that doesn't exist.
  const handleExportStudentExcel = async () => {
    if (!selectedStudentId || !studentDetails) return;
    setIsStudentExcelExporting(true);
    try {
      const blob = await buildStudentFinancialWorkbook([
        {
          studentId: safeRegNo,
          personalInfo: { fullName: safeFullName },
          programId: studentDetails.programId,
          departmentId: studentDetails.departmentId,
          semesterId: studentDetails.semesterId,
          termId: studentDetails.termId,
          financialSummary: safeFinancialSummary,
          ledger: studentChallans,
          activeScholarship,
        },
      ]);
      downloadBlob(
        blob,
        `${safeRegNo}_${safeFullName.replace(/\s+/g, "_")}_Financial_Report.xlsx`,
      );
    } catch {
      openAlert?.({
        type: "error",
        message: "Failed to export Excel. Please try again.",
      });
    } finally {
      setIsStudentExcelExporting(false);
    }
  };

  const [fetchMasterReport, { isFetching: isMasterFetching }] =
    useLazyGetMasterFinancialReportQuery();

  // Master Data — every student matching the current filters, as a
  // workbook built client-side from the same real financial-report data
  // source used elsewhere in this module (no dead "/api/reports" route).
  // `feeTypes` (array of "tuition"/"admission"/"exam"/"misc") scopes which
  // challans count toward the fee totals — defaults to Tuition only.
  const handleExportMasterExcel = async (feeTypes = ["tuition"]) => {
    setIsMasterExporting(true);
    try {
      const res = await fetchMasterReport({
        termId: filters.termId,
        departmentId: filters.departmentId,
        programId: filters.programId,
        semesterId: filters.semesterId,
        feeTypes: feeTypes.join(","),
      }).unwrap();
      const { summaryRows = [], challanRows = [] } = res?.data || {};
      const blob = await buildMasterFinancialWorkbook(summaryRows, challanRows);
      downloadBlob(
        blob,
        `Master_Financial_Report_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch {
      openAlert?.({ type: "error", message: "Failed to export master data." });
    } finally {
      setIsMasterExporting(false);
    }
  };

  // Student Directory roster export — the identity/academic fields (Reg
  // No, Name, Father Name, CNIC, Status, Department, Program, Semester)
  // for EVERY student matching the current filters, independent of the
  // Master Data export above (which is financial/ledger-focused). Fetches
  // the complete set fresh via fetchAllMatchingStudents rather than using
  // studentsList (which is only whatever's scrolled into the sidebar).
  const directoryScopeLabel = (() => {
    const parts = [];
    const dept = departments.find((d) => d._id === filters.departmentId);
    const prog = strictFilteredPrograms.find((p) => p._id === filters.programId);
    const sem = strictFilteredSemesters.find((s) => s._id === filters.semesterId);
    if (dept) parts.push(dept.name);
    if (prog) parts.push(prog.name);
    if (sem) parts.push(sem.name || `Semester ${sem.number}`);
    return parts.length > 0 ? parts.join(" — ") : "All Students";
  })();

  // Resolves the export's final row set: every matching student, enriched
  // with scholarship status, optionally narrowed to scholarship holders
  // only — shared by both the Excel and PDF handlers below.
  const resolveDirectoryExportRows = async (scholarshipOnly) => {
    const allStudents = await fetchAllMatchingStudents();
    if (!allStudents.length) return { rows: [], label: directoryScopeLabel };
    const enriched = await enrichWithScholarshipStatus(allStudents);
    const rows = scholarshipOnly
      ? enriched.filter((s) => s.hasScholarship)
      : enriched;
    const label = scholarshipOnly
      ? `${directoryScopeLabel} — Scholarship Students`
      : directoryScopeLabel;
    return { rows, label };
  };

  const handleExportDirectoryExcel = async (scholarshipOnly = false) => {
    if (isDirectoryExcelExporting) return;
    setIsDirectoryExcelExporting(true);
    try {
      const { rows, label } = await resolveDirectoryExportRows(scholarshipOnly);
      if (!rows.length) {
        openAlert?.({
          type: "info",
          message: scholarshipOnly
            ? "No students with an active scholarship match the current filters."
            : "No students match the current filters.",
        });
        return;
      }
      await exportStudentDirectoryExcel(rows, { scopeLabel: label });
    } catch {
      openAlert?.({ type: "error", message: "Failed to export student directory." });
    } finally {
      setIsDirectoryExcelExporting(false);
    }
  };

  const handleExportDirectoryPDF = async (scholarshipOnly = false) => {
    if (isDirectoryPdfExporting) return;
    setIsDirectoryPdfExporting(true);
    try {
      const { rows, label } = await resolveDirectoryExportRows(scholarshipOnly);
      if (!rows.length) {
        openAlert?.({
          type: "info",
          message: scholarshipOnly
            ? "No students with an active scholarship match the current filters."
            : "No students match the current filters.",
        });
        return;
      }
      await exportStudentDirectoryPDF(rows, { scopeLabel: label });
    } catch {
      openAlert?.({ type: "error", message: "Failed to export student directory." });
    } finally {
      setIsDirectoryPdfExporting(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "departmentId") {
        next.programId = "";
        next.semesterId = "";
      }
      if (key === "programId") {
        next.semesterId = "";
      }
      return next;
    });
  };

  return children({
    filters,
    handleFilterChange,
    terms,
    departments,
    programs: strictFilteredPrograms,
    semesters: strictFilteredSemesters,
    studentsList, // Already strictly fetched from the DB
    loadMoreStudents,
    hasMore,
    isSearching,
    selectedStudentId,
    handleSelectStudent: (id) => {
      setSelectedStudentId(id);
      setActiveTab("overview");
    },
    studentDetails,
    studentChallans,
    financialSummary: safeFinancialSummary,
    availableSemesters,
    overallReport,
    semesterReports,
    activeScholarship,
    safeFullName,
    safeFatherName,
    safeRegNo,
    safeCnic,
    safePhone,
    safeEmail,
    safeDob,
    safeAddress,
    isLoadingDetails,
    activeTab,
    setActiveTab,
    isPdfExporting,
    isStudentExcelExporting,
    isMasterExporting: isMasterExporting || isMasterFetching,
    handleExportStudentPDF,
    handleExportStudentExcel,
    handleExportMasterExcel,
    isDirectoryExcelExporting,
    isDirectoryPdfExporting,
    handleExportDirectoryExcel,
    handleExportDirectoryPDF,
  });
};

export default StudentReportController;
