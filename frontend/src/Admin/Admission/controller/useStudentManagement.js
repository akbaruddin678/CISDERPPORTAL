import { useState, useCallback, useMemo, useEffect } from "react";
import {
  useGetAllStudentsQuery,
  useGetStudentStatsQuery,
  useGetDepartmentsQuery,
  useGetProgramsQuery,
  useGetSemestersQuery,
  useGetSessionsQuery,
  useExportStudentsMutation,
} from "../services/studentApi";
import {
  useTrashStudentMutation,
  useBulkTrashStudentsMutation,
} from "../services/studentTrashApi";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import * as XLSX from "xlsx";

export const useStudentManagement = () => {
  const { openAlert } = useGlobalAlert();

  // "active" (the normal directory, withdrawn students excluded) or
  // "withdrawn" (its own dedicated, separate list) — mirrors how Trash
  // got its own tab before moving to the Admin side.
  const [activeView, setActiveView] = useState("active");

  // 1. Load initial state from sessionStorage, or use defaults
  const loadInitialFilters = () => {
    const savedFilters = sessionStorage.getItem("studentManagementFilters");
    if (savedFilters) {
      try {
        return JSON.parse(savedFilters);
      } catch (e) {
        console.error("Failed to parse filters", e);
      }
    }
    return {
      search: "",
      departmentId: "",
      programId: "",
      semesterId: "",
      sessionId: "",
      status: "",
      // Opt-in — when true, restricts the roster to students whose
      // originating admission application was actually "accepted" (see
      // getAllStudents' onlyAcceptedAdmission handling), i.e. this
      // semester's confirmed new intake rather than every continuing
      // student. Off by default so existing screens are unaffected.
      newAdmissionsOnly: false,
      page: 1,
      limit: 10,
    };
  };

  const [filters, setFilters] = useState(loadInitialFilters);

  // 2. Save to sessionStorage automatically whenever filters change
  useEffect(() => {
    sessionStorage.setItem("studentManagementFilters", JSON.stringify(filters));
  }, [filters]);

  // 3. Apply the "Unlimited" logic dynamically
  const isFiltering = Boolean(
    filters.departmentId ||
    filters.programId ||
    filters.semesterId ||
    filters.sessionId ||
    filters.status,
  );

  const queryParams = {
    ...filters,
    limit: isFiltering ? 0 : 10, // Override limit to 0 (all) if filters are active
    // College students are managed separately — this directory is
    // University-only. Deleted college students still show up in the
    // Admin-side Student Trash page (that endpoint isn't level-filtered).
    // Withdrawn students get their own dedicated tab below instead of
    // being mixed into the main directory.
    excludeWithdrawn: true,
    // Maps the "New Admissions Only" toggle onto getAllStudents' own
    // onlyAcceptedAdmission flag — when off, omit the key entirely so the
    // endpoint's default (feeActivated-gated) behavior is unchanged.
    onlyAcceptedAdmission: filters.newAdmissionsOnly ? true : undefined,
  };

  const {
    data: studentsData,
    isLoading: studentsLoading,
    error: studentsError,
    refetch: refetchStudents,
  } = useGetAllStudentsQuery(queryParams, {
    refetchOnMountOrArgChange: true,
    skip: activeView !== "active",
  });

  // --- WITHDRAWN STUDENTS (separate tab, own small search+pagination) ---
  const [withdrawnFilters, setWithdrawnFilters] = useState({ search: "", page: 1 });
  const {
    data: withdrawnData,
    isFetching: withdrawnLoading,
    refetch: refetchWithdrawn,
  } = useGetAllStudentsQuery(
    { ...withdrawnFilters, limit: 10, status: "withdrawn" },
    { refetchOnMountOrArgChange: true, skip: activeView !== "withdrawn" },
  );
  const withdrawnStudents = useMemo(() => withdrawnData?.data?.students || [], [withdrawnData]);
  const withdrawnPagination = withdrawnData?.data?.pagination || { page: 1, limit: 10, total: 0, pages: 1 };
  const searchWithdrawn = useCallback((term) => {
    setWithdrawnFilters({ search: term, page: 1 });
  }, []);
  const setWithdrawnPage = useCallback((page) => {
    setWithdrawnFilters((prev) => ({ ...prev, page }));
  }, []);

  const { data: statsData } = useGetStudentStatsQuery();
  const { data: departmentsData } = useGetDepartmentsQuery();
  const { data: programsData } = useGetProgramsQuery();
  const { data: semestersData } = useGetSemestersQuery();
  const { data: sessionsData } = useGetSessionsQuery();

  const [exportStudents, { isLoading: isExporting }] =
    useExportStudentsMutation();

  const students = useMemo(() => studentsData?.data?.students || [], [studentsData]);
  const rawPagination = studentsData?.data?.pagination || {
    page: 1,
    limit: isFiltering ? "All" : 10,
    total: 0,
    pages: 1,
  };
  // Backend reports limit as the string "All" when every matching record
  // was fetched at once (limit=0) — normalized here to a real number
  // (the total itself) so "Showing X – Y of Z" arithmetic downstream
  // never has to special-case it (and never divides/multiplies by a
  // string, which is what produced "Showing NaN – NaN of 41 students").
  const pagination = {
    ...rawPagination,
    limit: rawPagination.limit === "All" || !rawPagination.limit ? rawPagination.total || 0 : rawPagination.limit,
  };
  const stats = statsData?.data || {
    total: 0,
    active: 0,
    graduated: 0,
    byDepartment: [],
  };

  const rawCatalogData = {
    departments: departmentsData?.data || [],
    programs: programsData?.data || [],
    semesters: semestersData?.data || [],
    sessions: sessionsData?.data || [],
  };

  // Every class, program, section and session is available — this school /
  // college directory is no longer split into University-only and College.
  const nonCollegeDepartments = rawCatalogData.departments;
  const nonCollegePrograms = rawCatalogData.programs;
  const nonCollegeSemesters = rawCatalogData.semesters;

  const filteredPrograms = useMemo(() => {
    if (!filters.departmentId) return nonCollegePrograms;
    return nonCollegePrograms.filter(
      (p) => (p.departmentId?._id || p.departmentId) === filters.departmentId,
    );
  }, [filters.departmentId, nonCollegePrograms]);

  // Sections follow the chosen program; with only a class chosen they are
  // every section of that class's programs.
  const filteredSemesters = useMemo(() => {
    let list = nonCollegeSemesters;
    if (filters.programId) {
      list = list.filter((s) => String(s.programId?._id || s.programId) === String(filters.programId));
    } else if (filters.departmentId) {
      const programIds = new Set(
        nonCollegePrograms
          .filter((p) => String(p.departmentId?._id || p.departmentId) === String(filters.departmentId))
          .map((p) => String(p._id)),
      );
      list = list.filter((s) => programIds.has(String(s.programId?._id || s.programId)));
    }
    return [...list].sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [filters.programId, filters.departmentId, nonCollegeSemesters, nonCollegePrograms]);

  const catalogData = useMemo(
    () => ({
      departments: nonCollegeDepartments,
      programs: filteredPrograms,
      semesters: filteredSemesters,
      sessions: rawCatalogData.sessions,
    }),
    [nonCollegeDepartments, filteredPrograms, filteredSemesters, rawCatalogData.sessions],
  );

  // Every class / program / section / session, NOT narrowed by the current
  // source filters — the promotion screen needs these for its "Move to"
  // pickers, which can point at a different class than the one being viewed.
  const fullCatalog = useMemo(
    () => ({
      departments: nonCollegeDepartments,
      programs: nonCollegePrograms,
      semesters: nonCollegeSemesters,
      sessions: rawCatalogData.sessions,
    }),
    [nonCollegeDepartments, nonCollegePrograms, nonCollegeSemesters, rawCatalogData.sessions],
  );

  const searchStudents = useCallback((searchTerm) => {
    setFilters((prev) => ({ ...prev, search: searchTerm, page: 1 }));
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => {
      const updated = { ...prev, ...newFilters };
      if (
        updated.search !== prev.search ||
        updated.departmentId !== prev.departmentId ||
        updated.programId !== prev.programId ||
        updated.status !== prev.status ||
        updated.newAdmissionsOnly !== prev.newAdmissionsOnly
      )
        updated.page = 1;

      if (updated.departmentId !== prev.departmentId) {
        updated.programId = "";
        updated.semesterId = "";
      }
      if (updated.programId !== prev.programId) {
        updated.semesterId = "";
      }
      return updated;
    });
  }, []);

  // --- SELECTION (for bulk delete) ---
  const [selectedIds, setSelectedIds] = useState(new Set());

  // A different page/filter means a different set of visible rows — stale
  // checkbox state pointing at rows no longer on screen would be confusing.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filters.page, filters.search, filters.departmentId, filters.programId, filters.semesterId, filters.sessionId, filters.status, filters.newAdmissionsOnly]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allVisibleSelected = students.length > 0 && students.every((s) => selectedIds.has(s._id));

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const currentlyAll = students.length > 0 && students.every((s) => prev.has(s._id));
      return currentlyAll ? new Set() : new Set(students.map((s) => s._id));
    });
  }, [students]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // --- DELETE (single + bulk) — requires a remark AND the acting staff
  // member's own account password before the request is even sent. ---
  const [deleteTarget, setDeleteTarget] = useState(null); // { mode: "single", student } | { mode: "bulk", count }
  const [deleteRemark, setDeleteRemark] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  const [trashStudentMutation, { isLoading: isTrashingSingle }] = useTrashStudentMutation();
  const [bulkTrashStudentsMutation, { isLoading: isTrashingBulk }] = useBulkTrashStudentsMutation();
  const isDeleting = isTrashingSingle || isTrashingBulk;

  const openDeleteModal = useCallback((student) => {
    setDeleteTarget({ mode: "single", student });
    setDeleteRemark("");
    setDeletePassword("");
  }, []);

  const openBulkDeleteModal = useCallback(() => {
    if (selectedIds.size === 0) return;
    setDeleteTarget({ mode: "bulk", count: selectedIds.size });
    setDeleteRemark("");
    setDeletePassword("");
  }, [selectedIds]);

  const closeDeleteModal = useCallback(() => {
    setDeleteTarget(null);
    setDeleteRemark("");
    setDeletePassword("");
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteRemark.trim()) {
      openAlert({ message: "Please provide a remark before deleting.", severity: "warning" });
      return;
    }
    if (!deletePassword) {
      openAlert({ message: "Please enter your password to confirm this deletion.", severity: "warning" });
      return;
    }
    try {
      if (deleteTarget.mode === "single") {
        await trashStudentMutation({
          studentId: deleteTarget.student._id,
          remark: deleteRemark.trim(),
          password: deletePassword,
        }).unwrap();
        openAlert({ message: "Student moved to trash.", severity: "success" });
      } else {
        await bulkTrashStudentsMutation({
          studentIds: Array.from(selectedIds),
          remark: deleteRemark.trim(),
          password: deletePassword,
        }).unwrap();
        openAlert({ message: `${selectedIds.size} student(s) moved to trash.`, severity: "success" });
        clearSelection();
      }
      closeDeleteModal();
      refetchStudents();
      refetchWithdrawn();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to delete — please try again.",
        severity: "error",
      });
    }
  }, [
    deleteTarget,
    deleteRemark,
    deletePassword,
    selectedIds,
    trashStudentMutation,
    bulkTrashStudentsMutation,
    clearSelection,
    closeDeleteModal,
    refetchStudents,
    refetchWithdrawn,
    openAlert,
  ]);

  // --- EXPORT LOGIC ---
  const handleExport = useCallback(async () => {
    try {
      const response = await exportStudents(filters).unwrap();
      const dataToExport = Array.isArray(response.data) ? response.data : [];

      if (dataToExport.length === 0) {
        alert("No students found to export.");
        return;
      }

      // Three focused sheets instead of one sprawling, ragged-column sheet
      // (the old version added 9 more columns per student for every extra
      // education entry, so two students with different numbers of
      // qualifications produced a jagged, hard-to-read table). Education
      // history is now normalized — one row per qualification — and
      // Family/Address moved to their own sheet, both keyed by Student ID
      // so they can still be cross-referenced against the main sheet.
      const dateOptions = { day: "numeric", month: "long", year: "numeric" };
      const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", dateOptions) : "-");

      const studentRows = [];
      const familyRows = [];
      const educationRows = [];

      dataToExport.forEach((record) => {
        const profile = record.profile || {};
        const pInfo = record.personalInfo || {};
        const fInfo = record.familyInfo || {};
        const docs = record.documents || {};
        const eduList = record.educationHistory || [];
        const currAddr = pInfo.currentAddress || {};
        const permAddr = pInfo.permanentAddress || {};
        const regNo = profile.studentId || "-";
        const fullName = pInfo.fullName || "-";

        studentRows.push({
          "Student ID": regNo,
          "Full Name": fullName,
          Status: profile.status || "-",
          Class: profile.departmentId?.name || "-",
          Program: profile.programId?.name || "-",
          Section: profile.semesterId?.name || (profile.semesterId?.number ? `Section ${profile.semesterId.number}` : "-"),
          Session: profile.termId?.name || "-",
          Gender: pInfo.gender || "-",
          DOB: fmtDate(pInfo.dob),
          CNIC: pInfo.cnic || "-",
          Email: pInfo.email || "-",
          Phone: pInfo.phone || "-",
          "Docs Submitted": [
            docs.profilePhoto && "Photo",
            docs.cnicFront && "CNIC Front",
            docs.cnicBack && "CNIC Back",
            docs.matricCertificate && "Matric",
            docs.fscCertificate && "FSc",
            docs.domicileDoc && "Domicile",
          ].filter(Boolean).join(", ") || "None",
        });

        familyRows.push({
          "Student ID": regNo,
          "Full Name": fullName,
          "Current Address": typeof currAddr === "string" ? currAddr : currAddr.address || "-",
          "Current District": currAddr.district || "-",
          "Current Province": currAddr.province || "-",
          "Current Country": currAddr.country || "-",
          "Permanent Address": typeof permAddr === "string" ? permAddr : permAddr.address || "-",
          "Permanent District": permAddr.district || "-",
          "Permanent Province": permAddr.province || "-",
          "Permanent Country": permAddr.country || "-",
          "Father Name": fInfo.fatherName || "-",
          "Father CNIC": fInfo.fatherCnic || "-",
          "Father Profession": fInfo.fathersProfession || "-",
          "Mother Name": fInfo.motherName || "-",
          "Mother CNIC": fInfo.motherCnic || "-",
          "Guardian Status": fInfo.guardianStatus || "-",
          "Guardian Phone": fInfo.guardianPhone || "-",
          "Guardian Designation": fInfo.guardianDesignation || "-",
          "Family Income": fInfo.incomeBracket || "-",
        });

        if (eduList.length === 0) {
          educationRows.push({
            "Student ID": regNo,
            "Full Name": fullName,
            Degree: "-",
            Institute: "-",
            Board: "-",
            "Start Date": "-",
            "End Date": "-",
            Obtained: "-",
            Total: "-",
            Percentage: "-",
            Grade: "-",
          });
        } else {
          eduList.forEach((edu) => {
            educationRows.push({
              "Student ID": regNo,
              "Full Name": fullName,
              Degree: edu.educationProgram || "-",
              Institute: edu.institution || "-",
              Board: edu.board || "-",
              "Start Date": fmtDate(edu.startDate),
              "End Date": fmtDate(edu.endDateOrResultAwaited),
              Obtained: edu.obtainedMarks || 0,
              Total: edu.totalMarks || 0,
              Percentage: edu.percentage ? `${edu.percentage}%` : "-",
              Grade: edu.grade || "-",
            });
          });
        }
      });

      const sheetWithWidths = (rows, widths) => {
        const ws = XLSX.utils.json_to_sheet(rows);
        ws["!cols"] = widths.map((wch) => ({ wch }));
        return ws;
      };

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        sheetWithWidths(studentRows, [14, 22, 12, 20, 24, 16, 10, 10, 14, 16, 26, 14, 34]),
        "Students",
      );
      XLSX.utils.book_append_sheet(
        workbook,
        sheetWithWidths(familyRows, [14, 22, 26, 14, 14, 14, 26, 14, 14, 14, 20, 16, 18, 20, 16, 14, 16, 20, 14]),
        "Family & Address",
      );
      XLSX.utils.book_append_sheet(
        workbook,
        sheetWithWidths(educationRows, [14, 22, 20, 24, 16, 14, 14, 10, 10, 12, 10]),
        "Education History",
      );

      XLSX.writeFile(
        workbook,
        `Student_Records_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data.");
    }
  }, [exportStudents, filters]);

  return {
    students,
    loading: studentsLoading,
    error: studentsError,
    filters,
    pagination,
    catalogData,
    fullCatalog,
    stats,
    setFilters: updateFilters,
    searchStudents,
    fetchStudents: refetchStudents,
    handleExport,
    isExporting,

    activeView,
    setActiveView,
    withdrawnStudents,
    isWithdrawnLoading: withdrawnLoading,
    withdrawnFilters,
    withdrawnPagination,
    searchWithdrawn,
    setWithdrawnPage,

    selectedIds,
    toggleSelect,
    toggleSelectAll,
    allVisibleSelected,
    clearSelection,

    deleteTarget,
    deleteRemark,
    setDeleteRemark,
    deletePassword,
    setDeletePassword,
    openDeleteModal,
    openBulkDeleteModal,
    closeDeleteModal,
    confirmDelete,
    isDeleting,
  };
};
