import { useState, useEffect, useMemo } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetTermsQuery,
  useGetDepartmentsQuery,
  useLazyGetProgramsQuery,
  useGetSemestersQuery,
  useGetExamsQuery,
} from "../api/examApi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { drawBrandedHeader, getInstituteLogo } from "../utils/transcriptDocuments";

const normalizeArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data)) return res.data;
  return [];
};

// Canonical display order — Sessional/Mid Term/Final Exam are the three a
// course is normally set up with; Quiz/Assignment/Practical are ad-hoc extras.
export const EXAM_TYPE_ORDER = [
  "Sessional",
  "Mid Term",
  "Final Exam",
  "Quiz",
  "Assignment",
  "Practical",
];

const useDateSheetController = () => {
  const { openAlert } = useGlobalAlert();

  // --- States: Start everything as "all" ---
  const [filters, setFilters] = useState({
    termId: "all",
    departmentId: "all",
    programId: "all",
    semesterId: "all",
  });

  // --- API Fetching ---
  const { data: termsRes } = useGetTermsQuery();
  const { data: deptsRes } = useGetDepartmentsQuery();
  const { data: semestersRes } = useGetSemestersQuery();

  const [fetchPrograms, { data: programsRes }] = useLazyGetProgramsQuery();
  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  // Only officially published exams belong on the official date sheet —
  // drafts/scheduled-but-not-yet-published stay invisible here too. We
  // still filter strictly locally below to guarantee it works.
  const { data: examsRes, isFetching } = useGetExamsQuery({
    publishStatus: "PUBLISHED",
  });

  const terms = normalizeArray(termsRes);
  const departments = normalizeArray(deptsRes);
  const programs = normalizeArray(programsRes);
  const semestersList = normalizeArray(semestersRes);
  const rawExams = normalizeArray(examsRes);

  // Derived Dropdown lists
  const availablePrograms = useMemo(() => {
    if (filters.departmentId !== "all")
      return programs.filter(
        (p) =>
          String(p.departmentId?._id || p.departmentId) ===
          filters.departmentId,
      );
    return programs;
  }, [programs, filters.departmentId]);

  // Sorted Semesters
  const availableSemesters = useMemo(() => {
    let sems = semestersList;
    if (filters.programId !== "all") {
      sems = semestersList.filter(
        (s) => String(s.programId?._id || s.programId) === filters.programId,
      );
    }
    return [...sems].sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [semestersList, filters.programId]);

  // --- Handlers ---
  useEffect(() => {
    if (terms.length > 0 && filters.termId === "all") {
      const activeTerm = terms.find((t) => t.status) || terms[0];
      if (activeTerm) setFilters((p) => ({ ...p, termId: activeTerm._id }));
    }
  }, [terms]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [field]: value };
      if (field === "departmentId") {
        newFilters.programId = "all";
        newFilters.semesterId = "all";
      }
      if (field === "programId") {
        newFilters.semesterId = "all";
      }
      return newFilters;
    });
  };

  // ==========================================
  // ✅ FIX: BULLETPROOF LOCAL FILTER
  // This guarantees the filter works even if the backend ignores queries
  // ==========================================
  const filteredExams = useMemo(() => {
    return rawExams.filter((exam) => {
      if (exam.publishStatus && exam.publishStatus !== "PUBLISHED") return false;
      // Sessional has no fixed date/time — it's a running mark the teacher
      // enters off ongoing class performance, not a dated event, so it
      // doesn't belong on a date sheet.
      if (exam.type === "Sessional") return false;

      const examTermId = String(exam.termId?._id || exam.termId || "");
      const examDeptId = String(
        exam.departmentId?._id || exam.departmentId || "",
      );
      const examProgId = String(exam.programId?._id || exam.programId || "");
      const examSemId = String(exam.semesterId?._id || exam.semesterId || "");

      const matchTerm =
        filters.termId === "all" || examTermId === filters.termId;
      const matchDept =
        filters.departmentId === "all" || examDeptId === filters.departmentId;
      const matchProg =
        filters.programId === "all" || examProgId === filters.programId;
      const matchSem =
        filters.semesterId === "all" || examSemId === filters.semesterId;

      return matchTerm && matchDept && matchProg && matchSem;
    });
  }, [rawExams, filters]);

  // ==========================================
  // DATA GROUPING ENGINE
  // ==========================================
  // Department -> Program -> Semester -> Exam Type -> exams[]. The extra
  // type level is what lets the view render Sessional/Mid Term/Final Exam
  // (and any Quiz/Assignment/Practical) as clearly separated sections
  // instead of one mixed list.
  const groupedExams = useMemo(() => {
    const grouped = {};

    filteredExams.forEach((exam) => {
      const deptName =
        departments.find(
          (d) =>
            String(d._id) ===
            String(exam.departmentId?._id || exam.departmentId),
        )?.name || "Unknown Department";
      const progName =
        programs.find(
          (p) =>
            String(p._id) === String(exam.programId?._id || exam.programId),
        )?.name || "Unknown Program";

      const semObj = semestersList.find(
        (s) =>
          String(s._id) === String(exam.semesterId?._id || exam.semesterId),
      );
      const semName = `Section ${semObj?.number || exam.semesterNumber || "?"}`;
      const typeName = exam.type || "Other";

      if (!grouped[deptName]) grouped[deptName] = {};
      if (!grouped[deptName][progName]) grouped[deptName][progName] = {};
      if (!grouped[deptName][progName][semName])
        grouped[deptName][progName][semName] = {};
      if (!grouped[deptName][progName][semName][typeName])
        grouped[deptName][progName][semName][typeName] = [];

      grouped[deptName][progName][semName][typeName].push(exam);
    });

    Object.keys(grouped).forEach((dept) => {
      Object.keys(grouped[dept]).forEach((prog) => {
        Object.keys(grouped[dept][prog]).forEach((sem) => {
          Object.keys(grouped[dept][prog][sem]).forEach((type) => {
            grouped[dept][prog][sem][type].sort((a, b) => {
              if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
              return (a.startTime || "").localeCompare(b.startTime || "");
            });
          });
        });
      });
    });

    return grouped;
  }, [filteredExams, departments, programs, semestersList]);

  // Small helper the view uses to walk a semester's types in a stable,
  // sensible order (Sessional/Mid Term/Final Exam first, extras after).
  const orderedTypes = (typesObj) =>
    Object.keys(typesObj).sort((a, b) => {
      const ai = EXAM_TYPE_ORDER.indexOf(a);
      const bi = EXAM_TYPE_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

  // Walks groupedExams and hands back only the (dept, prog, sem, type,
  // exams) branches matching an optional type filter — used by both
  // downloads below so "Mid Term only" / "Final Exam only" exports share
  // the exact same scoping logic as everything else instead of a second,
  // divergent filter implementation.
  //
  // Hands back ONE flat, chronologically-sorted row list per (dept, prog,
  // sem) — merging every exam type into a single table with a Type column,
  // instead of a separate mini-table per type. A real university date
  // sheet is one table per semester read top-to-bottom in date order; the
  // old per-type-per-semester tables (times programs*semesters*types) were
  // exactly why print/export ballooned into a "bulk of pages".
  const walkGroupedExams = (typeFilter, visit, sourceGrouped = groupedExams) => {
    Object.keys(sourceGrouped).forEach((dept) => {
      Object.keys(sourceGrouped[dept]).forEach((prog) => {
        Object.keys(sourceGrouped[dept][prog]).forEach((sem) => {
          const types = orderedTypes(sourceGrouped[dept][prog][sem]).filter(
            (type) => !typeFilter || type === typeFilter,
          );
          if (types.length === 0) return;
          const rows = types
            .flatMap((type) =>
              sourceGrouped[dept][prog][sem][type].map((exam) => ({ ...exam, type })),
            )
            .sort((a, b) => {
              if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
              return (a.startTime || "").localeCompare(b.startTime || "");
            });
          visit(dept, prog, sem, rows);
        });
      });
    });
  };

  const hasExamsOfType = (typeFilter) =>
    !typeFilter || filteredExams.some((e) => e.type === typeFilter);

  // ==========================================
  // ✅ FIX: PREMIUM STYLED EXCEL DOWNLOAD — optional typeFilter (e.g. "Mid
  // Term" or "Final Exam") restricts the export to just that exam round;
  // omitted, it exports everything currently in scope.
  // ==========================================
  const downloadExcel = (typeFilter) => {
    if (!hasExamsOfType(typeFilter))
      return openAlert({ message: "No data to export", severity: "warning" });

    const activeTermName =
      terms.find((t) => t._id === filters.termId)?.name || "Current Session";
    const titleSuffix = typeFilter ? ` — ${typeFilter.toUpperCase()}` : "";
    const logoUrl = `${window.location.origin}/cisd-logo.png`;

    // Embed strict CSS inside the HTML payload so MS Excel renders it beautifully
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; font-family: 'Segoe UI', Arial, sans-serif; width: 100%; }
          .letterhead { text-align: center; height: 60px; }
          .inst-name { font-size: 20px; font-weight: bold; color: #0f172a; }
          .inst-address { font-size: 11px; color: #64748b; }
          .main-title { font-size: 18px; font-weight: bold; text-align: center; color: #0f172a; height: 40px; vertical-align: middle; }
          .sub-title { font-size: 13px; text-align: center; color: #475569; height: 26px; vertical-align: top; }
          .dept-header { background-color: #dbeafe; color: #1e3a8a; font-weight: bold; font-size: 16px; text-align: left; height: 40px; border: 1px solid #94a3b8; }
          .prog-header { background-color: #f1f5f9; color: #334155; font-weight: bold; font-size: 14px; text-align: left; height: 35px; border: 1px solid #cbd5e1; }
          th { background-color: #0f172a; color: #ffffff; font-weight: bold; border: 1px solid #94a3b8; padding: 10px; text-align: center; height: 35px; }
          td { border: 1px solid #cbd5e1; padding: 8px; vertical-align: middle; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .code { color: #475569; font-weight: bold; text-align: center; }
          .type-mid-term { color: #1d4ed8; font-weight: bold; }
          .type-final-exam { color: #6d28d9; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="6" class="letterhead"><img src="${logoUrl}" height="50" /></td></tr>
          <tr><td colspan="6" class="inst-name">CISD</td></tr>
          <tr><td colspan="6" class="inst-address">Faisal Sea Square, Main G.T Road, Gate-1 B-17 Islamabad</td></tr>
          <tr><td colspan="6"></td></tr>
          <tr><td colspan="6" class="main-title">OFFICIAL EXAMINATION DATE SHEET${titleSuffix}</td></tr>
          <tr><td colspan="6" class="sub-title">Session: ${activeTermName} | Generated on: ${new Date().toLocaleDateString("en-GB")}</td></tr>
          <tr><td colspan="6"></td></tr>
    `;

    walkGroupedExams(typeFilter, (dept, prog, sem, rows) => {
      html += `<tr><td colspan="6" class="dept-header"> DEPARTMENT: ${dept.toUpperCase()}</td></tr>`;
      html += `<tr><td colspan="6" class="prog-header"> Program: ${prog} | ${sem}</td></tr>`;
      html += `<tr>
        <th style="width: 60px;">Sr No.</th>
        <th style="width: 320px;">Course Title</th>
        <th style="width: 120px;">Course Code</th>
        <th style="width: 130px;">Type</th>
        <th style="width: 150px;">Date</th>
        <th style="width: 200px;">Time</th>
      </tr>`;

      rows.forEach((exam, index) => {
        const d = new Date(exam.date);
        const day = d.toLocaleDateString("en-US", { weekday: "short" });
        const typeClass =
          exam.type === "Mid Term"
            ? "type-mid-term"
            : exam.type === "Final Exam"
              ? "type-final-exam"
              : "";
        html += `<tr>
          <td class="center">${index + 1}</td>
          <td class="bold">${exam.courseId?.title || exam.title || "N/A"}</td>
          <td class="code">${exam.courseId?.code || "N/A"}</td>
          <td class="center ${typeClass}">${exam.type}</td>
          <td class="center">${d.toLocaleDateString("en-GB")} (${day})</td>
          <td class="center">${exam.startTime} to ${exam.endTime}</td>
        </tr>`;
      });

      html += `<tr><td colspan="6"></td></tr>`; // Spacer between semesters
    });

    html += `</table></body></html>`;

    // Generate File
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const fileSuffix = typeFilter ? `_${typeFilter.replace(/\s+/g, "")}` : "";
    link.download = `DateSheet_${activeTermName.replace(/\s+/g, "_")}${fileSuffix}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    openAlert({
      message: `${typeFilter ? `${typeFilter} ` : ""}Excel Date Sheet downloaded!`,
      severity: "success",
    });
  };

  // ==========================================
  // PDF DOWNLOAD (autoTable) — same optional typeFilter as downloadExcel.
  // Reuses the same branded letterhead (logo + institution name/address)
  // already established for Transcripts/Degree Certificates in
  // transcriptDocuments.js, and consolidates every exam type for a
  // Department/Program/Semester into ONE table (a Type column instead of
  // a separate mini-table per type) so this no longer balloons into a
  // "bulk of pages".
  // ==========================================
  const downloadPDF = async (typeFilter) => {
    if (!hasExamsOfType(typeFilter))
      return openAlert({ message: "No data to export", severity: "warning" });

    const logoImg = await getInstituteLogo();
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const activeTermName =
      terms.find((t) => t._id === filters.termId)?.name || "Current Session";
    const subtitle = `Session: ${activeTermName}${typeFilter ? ` — ${typeFilter}` : ""} | Generated: ${new Date().toLocaleDateString("en-GB")}`;

    const drawHeader = () =>
      drawBrandedHeader(doc, {
        title: "OFFICIAL EXAMINATION DATE SHEET",
        subtitle,
        logoImg,
      });

    drawHeader();
    let startY = 55;

    walkGroupedExams(typeFilter, (dept, prog, sem, rows) => {
      if (startY > 250) {
        doc.addPage();
        drawHeader();
        startY = 55;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${dept} — ${prog} — ${sem}`, 14, startY);
      doc.setFont("helvetica", "normal");
      startY += 6;

      const tableBody = rows.map((exam, index) => {
        const d = new Date(exam.date);
        const day = d.toLocaleDateString("en-US", { weekday: "short" });
        return [
          index + 1,
          `${exam.courseId?.title || exam.title}\n(${exam.courseId?.code || "N/A"})`,
          exam.type,
          `${d.toLocaleDateString("en-GB")} (${day})`,
          `${exam.startTime} to ${exam.endTime}`,
        ];
      });

      autoTable(doc, {
        startY,
        head: [["Sr No.", "Course & Code", "Type", "Date", "Time"]],
        body: tableBody,
        theme: "grid",
        headStyles: { fillColor: [15, 23, 42], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        styles: { cellPadding: 3 },
        margin: { top: 55, left: 14, right: 14 },
        // Reruns for every continuation page autoTable itself creates, so
        // the letterhead/border stays consistent even on a long table.
        didDrawPage: drawHeader,
      });

      startY = doc.lastAutoTable.finalY + 10;
    });

    const fileSuffix = typeFilter ? `_${typeFilter.replace(/\s+/g, "")}` : "";
    doc.save(`DateSheet_${activeTermName.replace(/\s+/g, "_")}${fileSuffix}.pdf`);
    openAlert({
      message: `${typeFilter ? `${typeFilter} ` : ""}PDF downloaded successfully!`,
      severity: "success",
    });
  };

  const getSemesterName = (semesterId) => {
    const semObj = semestersList.find(
      (s) => String(s._id) === String(semesterId),
    );
    return semObj?.number || "?";
  };

  // ==========================================
  // PRINT — a dedicated, standalone print window (same pattern used across
  // this app for challans/rosters) instead of relying on @media print CSS
  // to hide/show the live page. Works two ways: the whole currently-
  // filtered date sheet in one job, or exactly one department at a time —
  // so a multi-department view doesn't force one giant merged printout.
  // ==========================================
  const activeTermName =
    terms.find((t) => t._id === filters.termId)?.name || "Current Session";

  const buildPrintHtml = (deptNames) => {
    const scopedGrouped = deptNames
      ? Object.fromEntries(
          Object.entries(groupedExams).filter(([dept]) =>
            deptNames.includes(dept),
          ),
        )
      : groupedExams;

    // One table per Department/Program/Semester covering every exam type
    // (a Type column instead of a separate mini-table per type) — a real
    // university date sheet is a compact grid read in date order, not a
    // stack of tiny single-purpose tables that each force their own page
    // break, which is what turned this into a "bulk of pages" before.
    let body = "";
    let currentDept = null;
    walkGroupedExams(
      null,
      (dept, prog, sem, rows) => {
        if (dept !== currentDept) {
          if (currentDept !== null) body += `</div>`;
          body += `<div class="dept-block"><div class="dept-title">${dept}</div>`;
          currentDept = dept;
        }
        body += `<div class="sem-block">`;
        body += `<div class="sem-title">${prog} &middot; ${sem} <span class="count">(${rows.length} exam${rows.length === 1 ? "" : "s"})</span></div>`;
        body += `<table><thead><tr>
          <th style="width:36px;">#</th>
          <th>Course &amp; Code</th>
          <th style="width:90px;">Type</th>
          <th style="width:110px;">Date</th>
          <th style="width:60px;">Day</th>
          <th style="width:120px;">Time</th>
        </tr></thead><tbody>`;
        rows.forEach((exam, i) => {
          const d = new Date(exam.date);
          body += `<tr>
            <td class="center">${i + 1}</td>
            <td><strong>${exam.courseId?.title || exam.title || "N/A"}</strong><br/><span class="code">${exam.courseId?.code || "N/A"}</span></td>
            <td class="center type-${exam.type.replace(/\s+/g, "-").toLowerCase()}">${exam.type}</td>
            <td class="center">${d.toLocaleDateString("en-GB")}</td>
            <td class="center">${d.toLocaleDateString("en-US", { weekday: "short" })}</td>
            <td class="center">${exam.startTime} to ${exam.endTime}</td>
          </tr>`;
        });
        body += `</tbody></table></div>`;
      },
      scopedGrouped,
    );
    if (currentDept !== null) body += `</div>`;

    const logoUrl = `${window.location.origin}/cisd-logo.png`;

    return `<!DOCTYPE html><html><head><title>Date Sheet</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 24px; }
        .letterhead { display: flex; align-items: center; justify-content: center; gap: 14px;
          border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 6px; }
        .letterhead img { height: 56px; width: 56px; object-fit: contain; }
        .letterhead .inst-name { font-size: 20px; font-weight: 800; color: #0f172a; }
        .letterhead .inst-address { font-size: 11px; color: #64748b; margin-top: 2px; }
        .header { text-align: center; margin: 12px 0 20px; }
        .header h1 { font-size: 16px; font-weight: 800; letter-spacing: 0.03em; }
        .header p { font-size: 11.5px; color: #64748b; margin-top: 4px; }
        .dept-block { margin-bottom: 24px; }
        .dept-title { font-size: 15px; font-weight: 800; color: #0f172a; background: #dbeafe;
          padding: 7px 12px; border-radius: 6px; margin-bottom: 10px; }
        .sem-block { margin-bottom: 14px; page-break-inside: avoid; }
        .sem-title { font-size: 12.5px; font-weight: 700; color: #334155; background: #f1f5f9;
          padding: 6px 10px; border-radius: 4px; margin-bottom: 6px; }
        .count { font-weight: 500; color: #64748b; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
        thead { display: table-header-group; } /* repeats the header row if a table spans a page break */
        th { background: #0f172a; color: #fff; font-size: 10.5px; padding: 6px 8px; text-align: left; }
        td { border: 1px solid #e2e8f0; padding: 5px 8px; font-size: 11.5px; vertical-align: top; }
        .center { text-align: center; }
        .code { color: #475569; font-size: 10.5px; }
        .type-mid-term { color: #1d4ed8; font-weight: 700; }
        .type-final-exam { color: #6d28d9; font-weight: 700; }
        @media print {
          body { padding: 0 12px; }
          @page { size: A4; margin: 12mm; }
        }
      </style></head><body>
      <div class="letterhead">
        <img src="${logoUrl}" onerror="this.style.display='none'" />
        <div>
          <div class="inst-name">CISD</div>
          <div class="inst-address">Faisal Sea Square, Main G.T Road, Gate-1 B-17 Islamabad</div>
        </div>
      </div>
      <div class="header">
        <h1>OFFICIAL EXAMINATION DATE SHEET${deptNames && deptNames.length === 1 ? ` — ${deptNames[0]}` : ""}</h1>
        <p>Session: ${activeTermName} | Generated: ${new Date().toLocaleDateString("en-GB")}</p>
      </div>
      ${body}
      </body></html>`;
  };

  const openPrintWindow = (html) => {
    const win = window.open("", "_blank", "width=1000,height=700");
    if (!win) {
      return openAlert({
        message: "Pop-up blocked — allow pop-ups to print.",
        severity: "warning",
      });
    }
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.focus();
      win.print();
    };
  };

  const handlePrintAll = () => {
    if (filteredExams.length === 0) {
      return openAlert({ message: "No data to print", severity: "warning" });
    }
    openPrintWindow(buildPrintHtml());
  };

  const handlePrintDepartment = (deptName) => {
    openPrintWindow(buildPrintHtml([deptName]));
  };

  return {
    filters,
    terms,
    departments,
    availablePrograms,
    availableSemesters,
    handleFilterChange,
    groupedExams,
    orderedTypes,
    rawExams: filteredExams,
    isFetching,
    downloadPDF,
    downloadExcel,
    handlePrintAll,
    handlePrintDepartment,
    getSemesterName,
  };
};

export default useDateSheetController;
