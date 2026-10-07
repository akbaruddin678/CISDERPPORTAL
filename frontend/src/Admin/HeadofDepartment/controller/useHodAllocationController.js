import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { skipToken } from "@reduxjs/toolkit/query/react";

import {
  useGetTermsQuery,
  useGetDepartmentsQuery,
  useGetProgramsByDepartmentQuery,
  useGetSemestersByProgramQuery,
} from "../../../components/catalog/api/catalogApi";

import {
  useGetSemestersWithActiveStudentsQuery,
  useGetSemesterAllocationsQuery,
  useDeleteAllocationMutation,
  useBulkDeleteAllocationsMutation,
  useBulkUnassignInstructorMutation,
  useLazyGetAllocationRosterQuery,
  useUpdateAllocationRosterMutation,
} from "../api/hodCourseAllocationApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

// Drill-down: Department/Program -> pick a Semester -> pick a Session (that
// already has courses, or start a new one) -> see/assign that session's
// Courses -> open a Course to see/manage its full Student roster (a real
// page, not a drawer or modal).
const useHodAllocationController = ({ userDepartmentId, userRole }) => {
  const { openAlert } = useGlobalAlert();
  const navigate = useNavigate();

  // A semester's drill-down (Sessions -> Courses -> Students) is a real,
  // separate, URL-addressable page — /hod/course/allocation/:departmentId/
  // :programId/:semesterId — not a client-state re-render on the picker
  // page. Survives a refresh and works with browser back/forward.
  const {
    departmentId: routeDepartmentId,
    programId: routeProgramId,
    semesterId: routeSemesterId,
  } = useParams();
  const isDrilledPage = Boolean(routeSemesterId);

  // Returning from the dedicated Assign Course page (its own top-level
  // route, so this page fully remounts on the way back) — these query
  // params let it jump straight back to the Courses table for the exact
  // Program/Semester/Session the HOD was just on, instead of dropping them
  // back at the picker having to re-drill from scratch.
  const [searchParams] = useSearchParams();

  const safeDeptId =
    typeof userDepartmentId === "object" && userDepartmentId !== null
      ? userDepartmentId._id
      : userDepartmentId;

  const qProgramId = searchParams.get("programId");
  const qSemesterId = searchParams.get("semesterId");
  const qTermId = searchParams.get("termId");

  // --- 1. Filters ---
  const [filters, setFilters] = useState({
    departmentId: routeDepartmentId || safeDeptId || "",
    programId: routeProgramId || qProgramId || "",
    semesterId: routeSemesterId || qSemesterId || "",
    termId: qTermId || "",
  });

  // Resync when the route params change — browser back/forward between two
  // drilled semester pages, or a direct URL edit. No route currently
  // supplies :departmentId/:programId/:semesterId to this page (that's a
  // separate, not-yet-wired-up piece of work — see HodCourseAllocationView),
  // so these are always undefined in practice; bail out rather than
  // clobbering the initial state below (which may have been seeded from
  // ?programId=&semesterId=&termId= when returning from Assign Course).
  useEffect(() => {
    if (!routeDepartmentId && !routeProgramId && !routeSemesterId) return;
    setFilters((prev) => ({
      ...prev,
      departmentId: routeDepartmentId || safeDeptId || prev.departmentId,
      programId: routeProgramId || (routeSemesterId ? prev.programId : ""),
      semesterId: routeSemesterId || "",
      termId: "",
    }));
    setDrillLevel("sessions");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeDepartmentId, routeProgramId, routeSemesterId]);

  const isReady = Boolean(filters.departmentId && filters.programId);

  // --- 1b. Drill level: "sessions" | "courses" | "students" ---
  const [drillLevel, setDrillLevel] = useState(
    qSemesterId && qTermId ? "courses" : "sessions",
  );
  const [addSessionOpen, setAddSessionOpen] = useState(false);

  // --- 2b. Row Selection (for bulk actions, at the Courses level) ---
  const [selectedIds, setSelectedIds] = useState(new Set());

  // --- 2c. Student Roster (full page, not a drawer/modal) ---
  const [rosterCourse, setRosterCourse] = useState(null);
  const [rosterSelectedIds, setRosterSelectedIds] = useState([]);
  const [rosterSearch, setRosterSearch] = useState("");

  // --- 4. Queries ---
  const { data: deptsRes, isFetching: isFetchingDepartments } =
    useGetDepartmentsQuery();
  // University-only — this whole module has no HSSC/college concept.
  const { data: termsRes } = useGetTermsQuery({ excludeLevel: "HSSC" });
  const { data: programsRes, isFetching: isFetchingPrograms } =
    useGetProgramsByDepartmentQuery(filters.departmentId || skipToken, {
      skip: !filters.departmentId,
    });
  const { data: semestersRes, isFetching: isFetchingSemesters } =
    useGetSemestersByProgramQuery(filters.programId || skipToken, {
      skip: !filters.programId,
    });
  // Semesters with zero currently-active students are shown but disabled —
  // there's no one to assign a course to in a semester nobody is in.
  const { data: activeSemestersRes, isFetching: isFetchingActiveSemesters } =
    useGetSemestersWithActiveStudentsQuery(filters.programId || skipToken, {
      skip: !filters.programId,
    });

  // While at the "sessions" level (no termId chosen yet), this fetches
  // EVERY allocation across ALL sessions for the selected semester — used
  // to work out which sessions already have courses. Once a session is
  // picked, termId narrows it down to just that session's courses.
  const allocationQueryArgs =
    isReady && filters.semesterId
      ? {
          programId: filters.programId,
          semesterId: filters.semesterId,
          ...(filters.termId && { termId: filters.termId }),
        }
      : skipToken;

  const {
    data: allocationsRes,
    isFetching: isFetchingAllocations,
    refetch,
  } = useGetSemesterAllocationsQuery(allocationQueryArgs, {
    skip: !isReady || !filters.semesterId,
  });

  // Mutations
  const [deleteAllocation] = useDeleteAllocationMutation();
  const [bulkDeleteAllocations, { isLoading: isBulkDeleting }] =
    useBulkDeleteAllocationsMutation();
  const [bulkUnassignInstructor, { isLoading: isBulkUnassigning }] =
    useBulkUnassignInstructorMutation();
  const [fetchRoster, { data: rosterRes, isFetching: isFetchingRoster }] =
    useLazyGetAllocationRosterQuery();
  const [updateRoster, { isLoading: isSavingRoster }] =
    useUpdateAllocationRosterMutation();

  // --- 5. Extractions ---
  const departments = extractArray(deptsRes);
  const terms = extractArray(termsRes);
  const programs = extractArray(programsRes);
  const rawSemesters = extractArray(semestersRes);
  const allAllocationsForSemester = extractArray(allocationsRes);

  const activeStudentCountBySemester = useMemo(() => {
    const map = new Map();
    extractArray(activeSemestersRes).forEach((row) => {
      map.set(row.semesterId, row.activeStudentCount);
    });
    return map;
  }, [activeSemestersRes]);
  const semesters = useMemo(
    () =>
      [...rawSemesters]
        .sort((a, b) => (a.number || 0) - (b.number || 0))
        .map((s) => ({
          ...s,
          activeStudentCount: activeStudentCountBySemester.get(s._id) || 0,
        })),
    [rawSemesters, activeStudentCountBySemester],
  );
  // At the "sessions" level, allAllocationsForSemester spans every session
  // — group it into one card per session (term) that already has courses.
  const sessionsWithCourses = useMemo(() => {
    const map = new Map();
    for (const a of allAllocationsForSemester) {
      const termId = a.termId;
      if (!map.has(termId)) {
        map.set(termId, {
          termId,
          termName: terms.find((t) => t._id === termId)?.name || "Unknown Session",
          courseIds: new Set(),
          rows: [],
        });
      }
      const entry = map.get(termId);
      entry.courseIds.add(a.courseId?._id || a.courseId);
      entry.rows.push(a);
    }
    return [...map.values()]
      .map((entry) => ({
        termId: entry.termId,
        termName: entry.termName,
        courseCount: entry.courseIds.size,
        registeredCount: [
          ...new Map(
            entry.rows.map((a) => [
              a.courseId?._id || a.courseId,
              a.registeredCount || 0,
            ]),
          ).values(),
        ].reduce((sum, n) => sum + n, 0),
      }))
      .sort((a, b) => a.termName.localeCompare(b.termName));
  }, [allAllocationsForSemester, terms]);

  const sessionsWithoutCourses = useMemo(
    () =>
      terms.filter(
        (t) => !sessionsWithCourses.some((s) => s.termId === t._id),
      ),
    [terms, sessionsWithCourses],
  );

  // Once a session is picked, allAllocationsForSemester is already scoped
  // to just that session (termId is included in allocationQueryArgs).
  const allocations =
    drillLevel === "courses" || drillLevel === "students"
      ? allAllocationsForSemester
      : [];

  const rosterStudents = extractArray(rosterRes);
  const filteredRosterStudents = useMemo(() => {
    if (!rosterSearch) return rosterStudents;
    const lower = rosterSearch.toLowerCase();
    return rosterStudents.filter(
      (s) =>
        (s.name?.toLowerCase() || "").includes(lower) ||
        (s.studentId?.toLowerCase() || "").includes(lower),
    );
  }, [rosterStudents, rosterSearch]);

  // --- 6. Handlers ---
  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [field]: value };
      if (field === "departmentId") {
        newFilters.programId = "";
        newFilters.semesterId = "";
        newFilters.termId = "";
      }
      if (field === "programId") {
        newFilters.semesterId = "";
        newFilters.termId = "";
      }
      if (field === "semesterId") {
        newFilters.termId = "";
      }
      return newFilters;
    });
    setSelectedIds(new Set());
    setDrillLevel("sessions");
  };

  // --- 6a. Drill-down navigation ---
  const handleSelectSession = (termId) => {
    setFilters((prev) => ({ ...prev, termId }));
    setDrillLevel("courses");
    setSelectedIds(new Set());
  };

  const handleAddNewSession = (termId) => {
    setAddSessionOpen(false);
    handleSelectSession(termId);
  };

  const handleBackToSessions = () => {
    setFilters((prev) => ({ ...prev, termId: "" }));
    setDrillLevel("sessions");
    setSelectedIds(new Set());
  };

  const handleBackToCourses = () => {
    setDrillLevel("courses");
    setRosterCourse(null);
    setRosterSelectedIds([]);
    setRosterSearch("");
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to remove this course offering?")
    )
      return;
    try {
      await deleteAllocation(id).unwrap();
      openAlert({ message: "Offering removed.", severity: "success" });
      refetch();
    } catch {
      openAlert({ message: "Failed to remove offering.", severity: "error" });
    }
  };

  // --- 6b. Student Roster Handlers (full page, opened from a Course card) ---
  const handleOpenRoster = async (course) => {
    setRosterCourse(course);
    setRosterSearch("");
    setDrillLevel("students");
    try {
      const res = await fetchRoster(course._id).unwrap();
      const arrayData = extractArray(res);
      setRosterSelectedIds(
        arrayData.filter((s) => s.isEnrolled).map((s) => s._id),
      );
    } catch {
      openAlert({
        message: "Failed to load the student roster for this course.",
        severity: "error",
      });
    }
  };

  const handleToggleRosterStudent = (studentId) =>
    setRosterSelectedIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );

  const handleSelectAllRosterStudents = () => {
    const visibleIds = filteredRosterStudents.map((s) => s._id);
    const allVisibleSelected = visibleIds.every((id) =>
      rosterSelectedIds.includes(id),
    );
    setRosterSelectedIds((prev) =>
      allVisibleSelected
        ? prev.filter((id) => !visibleIds.includes(id))
        : [...new Set([...prev, ...visibleIds])],
    );
  };

  const handleSaveRoster = async () => {
    if (!rosterCourse) return;
    try {
      const result = await updateRoster({
        assignmentId: rosterCourse._id,
        studentIds: rosterSelectedIds,
      }).unwrap();
      openAlert({
        message: result?.message || "Course roster updated successfully!",
        severity: "success",
      });
      refetch();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to update course roster.",
        severity: "error",
      });
    }
  };

  const handlePrintRoster = () => {
    window.print();
  };

  // --- 7. Selection Handlers (Courses level) ---
  const toggleSelectRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAllRows = () => {
    setSelectedIds((prev) =>
      prev.size === allocations.length
        ? new Set()
        : new Set(allocations.map((a) => a._id)),
    );
  };

  const clearSelection = () => setSelectedIds(new Set());

  // --- 8. Bulk Action Handlers ---
  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to remove ${ids.length} selected course offering(s)? This cannot be undone.`,
      )
    )
      return;

    try {
      const result = await bulkDeleteAllocations(ids).unwrap();
      openAlert({
        message: result?.message || "Selected offerings removed.",
        severity: "success",
      });
      clearSelection();
      refetch();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to remove selected offerings.",
        severity: "error",
      });
    }
  };

  const handleBulkUnassign = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (
      !window.confirm(
        `Unassign the instructor from ${ids.length} selected course offering(s)?`,
      )
    )
      return;

    try {
      const result = await bulkUnassignInstructor(ids).unwrap();
      openAlert({
        message: result?.message || "Selected offerings unassigned.",
        severity: "success",
      });
      clearSelection();
      refetch();
    } catch (error) {
      openAlert({
        message:
          error.data?.message || "Failed to unassign selected offerings.",
        severity: "error",
      });
    }
  };

  // If the user changes department/program away from what a drilled-into
  // session/course belonged to, fall back to the sessions level rather
  // than showing stale course/student data.
  useEffect(() => {
    if (!filters.semesterId) setDrillLevel("sessions");
  }, [filters.semesterId]);

  return {
    filters,
    handleFilterChange,
    terms,
    departments,
    programs,
    semesters,
    isFetchingDepartments,
    isFetchingPrograms,
    isFetchingSemesters,
    isReady,
    allocations,
    isFetchingAllocations,
    handleDelete,
    isAdmin: userRole === "admin",
    // Selection & bulk actions (Courses level)
    selectedIds,
    toggleSelectRow,
    toggleSelectAllRows,
    clearSelection,
    handleBulkDelete,
    handleBulkUnassign,
    isBulkDeleting,
    isBulkUnassigning,
    // Drill-down navigation
    drillLevel,
    sessionsWithCourses,
    sessionsWithoutCourses,
    addSessionOpen,
    setAddSessionOpen,
    handleSelectSession,
    handleAddNewSession,
    handleBackToSessions,
    handleBackToCourses,
    // Student Roster (full page)
    rosterCourse,
    rosterSelectedIds,
    rosterSearch,
    setRosterSearch,
    filteredRosterStudents,
    isFetchingRoster,
    isSavingRoster,
    handleOpenRoster,
    handleToggleRosterStudent,
    handleSelectAllRosterStudents,
    handleSaveRoster,
    handlePrintRoster,
  };
};

export default useHodAllocationController;
