import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  useGetStudentsQuery,
  useGetChallanStatusBatchQuery,
  useReAdmitStudentMutation,
} from "../api/accountantstudentApi";
import { useLazyGetChallansByStudentIdQuery } from "../api/studentChallanApi";
import { buildChallanPage, openPrintWindow } from "../common/ChallanPrintTemplate";
import {
  exportAdmissionsPDF,
  exportAdmissionsExcel,
} from "../common/StudentAdmissionExport";
import {
  useGetDepartmentsQuery,
  useGetProgramsQuery,
} from "../api/depsemtermpro";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";

const StudentAdmissionController = ({ children }) => {
  const { openAlert } = useGlobalAlert();

  // Same state-based separation as the Admission module's own pipeline
  // (Accepted / Challan Generated / Fee Paid / Fee Overdue) — every
  // student here is already an accepted admission, so "state" is purely
  // about where their fee challan stands. Mutually exclusive, just like
  // the Admission Process tabs: a student appears under exactly one.
  const [stateFilter, setStateFilter] = useState("all");

  const [filters, setFilters] = useState({
    search: "",
    startDate: "",
    endDate: "",
    departmentId: "",
    programId: "",
    page: 1,
    limit: 1000,
  });

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 400);
    return () => clearTimeout(handler);
  }, [filters.search]);

  // Fetch Core Students — restricted to students who actually came through
  // the Admission Process portal (an accepted Admission application), same
  // convention as the Admission module's own "New Admissions" screen.
  // Without this, the table used to include every other active student
  // too, producing a total far larger than the real number of admissions.
  const { data, isLoading, isFetching } = useGetStudentsQuery({
    ...filters,
    search: debouncedSearch,
    onlyAcceptedAdmission: true,
  });

  // Fetch Dropdown Data
  const { data: departmentsRes } = useGetDepartmentsQuery();
  const { data: programsRes } = useGetProgramsQuery();

  const allDepartments = useMemo(() => departmentsRes?.data || [], [departmentsRes]);
  const allPrograms = useMemo(() => programsRes?.data || [], [programsRes]);

  const rawStudentsList = useMemo(() => data?.data || [], [data]);

  // =========================================================================
  // ✅ SMART FILTERING: University-only (College was removed from this
  // screen), restricted to Semester 1 — i.e. genuinely new admissions.
  // =========================================================================
  const filteredStudents = useMemo(() => {
    return rawStudentsList.filter((student) => {
      const isCollege = student.programId?.level === "HSSC";
      if (isCollege) return false;

      const semNumber = student.semesterId?.number || student.semester?.number;
      return semNumber === 1;
    });
  }, [rawStudentsList]);

  // Challan/Payment status (Not Generated/Pending/Paid/Overdue) — computed
  // on the backend from StudentChallan records, fetched in a batch for the
  // currently-visible students and merged in below. This is the same data
  // shown on the Admission module's own "New Admissions" screen.
  const visibleStudentIds = useMemo(
    () => filteredStudents.map((s) => s._id),
    [filteredStudents],
  );
  const { data: challanStatusRes } = useGetChallanStatusBatchQuery(
    visibleStudentIds,
    { skip: visibleStudentIds.length === 0 },
  );
  const challanStatusMap = useMemo(() => challanStatusRes?.data || {}, [challanStatusRes]);

  const studentsWithChallanStatus = useMemo(
    () =>
      filteredStudents.map((s) => ({
        ...s,
        challanStatus: challanStatusMap[s._id]?.challanStatus || "not_generated",
        challanPendingAmount: challanStatusMap[s._id]?.pendingAmount || 0,
        challanLatestDueDate: challanStatusMap[s._id]?.latestDueDate || null,
      })),
    [filteredStudents, challanStatusMap],
  );

  // Counts per state — feeds the state-tab badges, computed before
  // state-filtering so every badge stays accurate no matter which state
  // tab is currently selected.
  const stateCounts = useMemo(() => {
    let notGenerated = 0;
    let pending = 0;
    let paid = 0;
    let overdue = 0;
    studentsWithChallanStatus.forEach((s) => {
      if (s.challanStatus === "not_generated") notGenerated += 1;
      else if (s.challanStatus === "paid") paid += 1;
      else if (s.challanStatus === "overdue") overdue += 1;
      else pending += 1; // generated, not yet paid or overdue
    });
    return {
      all: studentsWithChallanStatus.length,
      not_generated: notGenerated,
      pending,
      paid,
      overdue,
    };
  }, [studentsWithChallanStatus]);

  // Applies the state tab on top of the search+filter results — every
  // student here already belongs to exactly one state, so this is a
  // straightforward partition, same as the Admission module's buckets.
  // This is also the full (unpaginated) dataset used for PDF/Excel export,
  // so exports always cover the whole section, not just the current page.
  const stateFilteredStudents = useMemo(() => {
    if (stateFilter === "all") return studentsWithChallanStatus;
    return studentsWithChallanStatus.filter((s) => s.challanStatus === stateFilter);
  }, [studentsWithChallanStatus, stateFilter]);

  const [reAdmitStudentMutation, { isLoading: isReAdmitting }] =
    useReAdmitStudentMutation();

  const reAdmitStudent = useCallback(
    async (studentId) => {
      try {
        await reAdmitStudentMutation(studentId).unwrap();
      } catch (error) {
        openAlert({
          message:
            error.data?.error ||
            error.data?.message ||
            "Failed to re-admit the student.",
          severity: "error",
        });
      }
    },
    [reAdmitStudentMutation, openAlert],
  );

  // --- PRINT CHALLAN --- same buildChallanPage/openPrintWindow template
  // used everywhere else in this app (Challan Management, COIS Print
  // Challans, University Bulk Print, the Admission module's New
  // Admissions screen, etc.).
  const [triggerGetChallansByStudent] = useLazyGetChallansByStudentIdQuery();
  const [isPrinting, setIsPrinting] = useState(false);

  const printChallan = useCallback(
    async (student) => {
      const printWin = window.open("", "_blank");
      setIsPrinting(true);
      try {
        const result = await triggerGetChallansByStudent(student._id).unwrap();
        const printableChallans = (result?.data?.challans || []).filter(
          (c) => !c.isDeleted && c.status !== "cancelled" && c.status !== "merged",
        );

        if (printableChallans.length === 0) {
          printWin?.close();
          openAlert({
            message: "No generated challans found for this student.",
            severity: "warning",
          });
          return;
        }

        openPrintWindow(
          printableChallans.map(buildChallanPage).join(""),
          `Fee Challans - ${student.personalInfo?.fullName || student.studentId}`,
          printWin,
        );
      } catch (error) {
        printWin?.close();
        openAlert({
          message:
            error.data?.error ||
            error.data?.message ||
            "Failed to fetch challans for printing.",
          severity: "error",
        });
      } finally {
        setIsPrinting(false);
      }
    },
    [triggerGetChallansByStudent, openAlert],
  );

  // --- EXPORT (per section/state tab) --- always exports the full
  // state-filtered dataset, not just the current page.
  const [isExporting, setIsExporting] = useState(false);

  const exportSectionPDF = useCallback(
    async (sectionLabel) => {
      if (stateFilteredStudents.length === 0) {
        openAlert({ message: "No students to export in this section.", severity: "warning" });
        return;
      }
      setIsExporting(true);
      try {
        await exportAdmissionsPDF(stateFilteredStudents, { sectionLabel });
      } catch {
        openAlert({ message: "Failed to generate PDF export.", severity: "error" });
      } finally {
        setIsExporting(false);
      }
    },
    [stateFilteredStudents, openAlert],
  );

  const exportSectionExcel = useCallback(
    async (sectionLabel) => {
      if (stateFilteredStudents.length === 0) {
        openAlert({ message: "No students to export in this section.", severity: "warning" });
        return;
      }
      setIsExporting(true);
      try {
        await exportAdmissionsExcel(stateFilteredStudents, { sectionLabel });
      } catch {
        openAlert({ message: "Failed to generate Excel export.", severity: "error" });
      } finally {
        setIsExporting(false);
      }
    },
    [stateFilteredStudents, openAlert],
  );

  // ✅ LOCAL PAGINATION (Since we filtered the backend list locally)
  const itemsPerPage = 50;
  const totalPages = Math.max(
    1,
    Math.ceil(stateFilteredStudents.length / itemsPerPage),
  );
  const paginatedStudentsList = stateFilteredStudents.slice(
    (filters.page - 1) * itemsPerPage,
    filters.page * itemsPerPage,
  );

  const pagination = {
    current: filters.page,
    pages: totalPages,
    total: stateFilteredStudents.length,
  };

  // ✅ DYNAMIC DROPDOWNS: University-only (College removed from this screen)
  const displayPrograms = useMemo(() => {
    let progs = allPrograms.filter((p) => p.level !== "HSSC");
    if (filters.departmentId) {
      progs = progs.filter(
        (p) => (p.departmentId?._id || p.departmentId) === filters.departmentId,
      );
    }
    return progs;
  }, [allPrograms, filters.departmentId]);

  const displayDepartments = useMemo(
    () => allDepartments.filter((d) => !d.name.toLowerCase().includes("college")),
    [allDepartments],
  );

  // =========================================================================

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value, page: 1 };
      if (key === "departmentId") next.programId = ""; // Reset program if dept changes
      return next;
    });
  };

  const handleStateFilterChange = (state) => {
    setStateFilter(state);
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  const openStudentDetails = (student) => {
    setSelectedStudent(student);
  };

  const closeStudentDetails = () => {
    setSelectedStudent(null);
  };

  return children({
    stateFilter,
    handleStateFilterChange,
    stateCounts,
    filters,
    handleFilterChange,
    departments: displayDepartments,
    programs: displayPrograms,
    studentsList: paginatedStudentsList,
    pagination,
    handlePageChange,
    isLoading: isLoading || isFetching,
    selectedStudent,
    openStudentDetails,
    closeStudentDetails,
    reAdmitStudent,
    isReAdmitting,
    printChallan,
    isPrinting,
    exportSectionPDF,
    exportSectionExcel,
    isExporting,
  });
};

export default StudentAdmissionController;
