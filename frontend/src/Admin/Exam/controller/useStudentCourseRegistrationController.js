import { useState, useEffect, useMemo } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { skipToken } from "@reduxjs/toolkit/query/react";
// 1. Exam API (Dropdowns)
import {
  useGetTermsQuery,
  useGetDepartmentsQuery,
  useLazyGetProgramsQuery,
  useGetSemestersQuery,
} from "../api/examApi";

// 2. Student Registration API
import {
  useGetStudentsForRegistrationQuery,
  useLazyGetStudentCourseDetailsQuery,
  useSaveStudentRegistrationsMutation,
  useGetCreditLimitQuery,
  useGrantCreditOverrideMutation,
} from "../api/coursestudentAssignment";
import { getUserRoles } from "../services/getAuthToken";

// 3. Course Registration API (Master Catalog)
import { useGetAllCoursesQuery } from "../api/courseRegistrationApi";

// 4. Course Assignment API (Assigning to Semester)
import {
  useAssignSingleCourseMutation,
  useGetAssignedCoursesQuery,
  useLazyGetCourseRosterQuery,
  useUpdateCourseRosterMutation,
} from "../api/courseAssignmentApi";

// ==========================================
// CRITICAL FIX: AGGRESSIVE ARRAY EXTRACTOR
// ==========================================
const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  if (obj.data?.data && Array.isArray(obj.data.data)) return obj.data.data;

  if (obj.courses && Array.isArray(obj.courses)) return obj.courses;
  if (obj.data?.courses && Array.isArray(obj.data.courses))
    return obj.data.courses;
  if (obj.assignments && Array.isArray(obj.assignments)) return obj.assignments;
  if (obj.data?.assignments && Array.isArray(obj.data.assignments))
    return obj.data.assignments;
  if (obj.students && Array.isArray(obj.students)) return obj.students;
  if (obj.data?.students && Array.isArray(obj.data.students))
    return obj.data.students;

  for (const key in obj) {
    if (Array.isArray(obj[key])) return obj[key];
    if (typeof obj[key] === "object" && obj[key] !== null) {
      for (const subKey in obj[key]) {
        if (Array.isArray(obj[key][subKey])) return obj[key][subKey];
      }
    }
  }
  return [];
};

const useStudentCourseRegistrationController = () => {
  const { openAlert } = useGlobalAlert();
  const isHod = getUserRoles().includes("hod") || getUserRoles().includes("admin");

  // --- Main States ---
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({
    termId: "",
    departmentId: "",
    programId: "",
    semesterId: "",
  });

  // --- Student Drawer State ---
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [isSavingBulk, setIsSavingBulk] = useState(false);

  // --- View Courses Modal State ---
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [viewCoursesList, setViewCoursesList] = useState([]);
  const [isFetchingViewCourses, setIsFetchingViewCourses] = useState(false);

  // --- Assign Course Drawer State ---
  const [isAssignCourseDrawerOpen, setIsAssignCourseDrawerOpen] =
    useState(false);
  const [assignCourseForm, setAssignCourseForm] = useState({
    section: "A",
    capacity: 50,
  });
  const [selectedCatalogCourseIds, setSelectedCatalogCourseIds] = useState([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [courseSort, setCourseSort] = useState("asc");

  // --- Course Roster Drawer State (Tab 3: assign students to ONE course) ---
  const [isRosterDrawerOpen, setIsRosterDrawerOpen] = useState(false);
  const [rosterCourse, setRosterCourse] = useState(null);
  const [rosterSelectedIds, setRosterSelectedIds] = useState([]);
  const [rosterSearch, setRosterSearch] = useState("");

  // ==========================================
  // API HOOKS & DATA FETCHING
  // ==========================================
  const { data: termsRes } = useGetTermsQuery();
  const { data: deptsRes } = useGetDepartmentsQuery();
  const { data: semestersRes } = useGetSemestersQuery();
  const [fetchPrograms, { data: programsRes }] = useLazyGetProgramsQuery();
  const { data: catalogRes } = useGetAllCoursesQuery();

  const isReady = Boolean(
    filters.termId && filters.programId && filters.semesterId,
  );

  // ---------------------------------------------------------
  // CRITICAL BUG FIX FOR TAB 1 (SEMESTER COURSES)
  // Only send the semesterId to fetch assignments. If you send termId or programId
  // and they don't exactly match the database document, it returns empty!
  // ---------------------------------------------------------
  const assignmentQueryArgs = filters.semesterId
    ? { semesterId: filters.semesterId }
    : skipToken;
  const {
    data: assignedCoursesRes,
    isFetching: isFetchingAssigned,
    refetch: refetchAssigned,
  } = useGetAssignedCoursesQuery(
    filters.semesterId ? { semesterId: filters.semesterId } : skipToken,
    { skip: !filters.semesterId },
  );

  const {
    data: studentsRes,
    isFetching: isFetchingStudents,
    refetch: refetchStudents,
  } = useGetStudentsForRegistrationQuery(
    { programId: filters.programId, semesterId: filters.semesterId },
    { skip: !isReady },
  );

  const [assignCourseToSemester, { isLoading: isAssigningCourse }] =
    useAssignSingleCourseMutation();
  const [
    fetchCourseDetails,
    { data: courseDetailsRes, isFetching: isFetchingCourses },
  ] = useLazyGetStudentCourseDetailsQuery();
  const [saveRegistrations, { isLoading: isSavingSingle }] =
    useSaveStudentRegistrationsMutation();
  const [
    fetchCourseRoster,
    { data: courseRosterRes, isFetching: isFetchingRoster },
  ] = useLazyGetCourseRosterQuery();
  const [updateCourseRoster, { isLoading: isSavingRoster }] =
    useUpdateCourseRosterMutation();

  const assignedCourses = extractArray(assignedCoursesRes);
  const students = extractArray(studentsRes);
  let studentCourses = extractArray(courseDetailsRes);
  const courseCatalog = extractArray(catalogRes);

  const drawerCurriculum =
    studentCourses.length > 0
      ? studentCourses
      : assignedCourses.map((ac) => ({
          courseId: ac.courseId?._id || ac.courseId || ac._id,
          title: ac.courseId?.title || ac.title,
          code: ac.courseId?.code || ac.code,
          credits: ac.courseId?.creditHours
            ? ac.courseId.creditHours.theory + ac.courseId.creditHours.lab
            : 3,
          isRegistered: false,
        }));

  // ==========================================
  // CREDIT LIMIT — live total for the drawer, and the effective cap for
  // whichever student the drawer is open for (single mode: that student;
  // bulk mode: the first selected row, same "representative student"
  // convention handleOpenBulkDrawer already uses for fetching curriculum).
  // ==========================================
  const totalSelectedCredits = useMemo(
    () =>
      selectedCourseIds.reduce((sum, id) => {
        const course = drawerCurriculum.find((c) => (c.courseId || c._id) === id);
        return sum + (course?.credits || 0);
      }, 0),
    [selectedCourseIds, drawerCurriculum],
  );
  const limitStudentId = isBulkMode ? selectedRows[0] : selectedStudent?._id;
  const { data: creditLimitRes } = useGetCreditLimitQuery(
    isDrawerOpen && limitStudentId && filters.semesterId
      ? { studentId: limitStudentId, programId: filters.programId, semesterId: filters.semesterId, termId: filters.termId }
      : skipToken,
  );
  const creditLimit = creditLimitRes?.data || { maxCredits: null, minCredits: null, overrideActive: false };
  const isOverMax = typeof creditLimit.maxCredits === "number" && totalSelectedCredits > creditLimit.maxCredits;
  const isUnderMin = typeof creditLimit.minCredits === "number" && totalSelectedCredits > 0 && totalSelectedCredits < creditLimit.minCredits;

  const [isOverrideFormOpen, setIsOverrideFormOpen] = useState(false);
  const [overrideForm, setOverrideForm] = useState({ maxCredits: "", reason: "" });
  const [grantCreditOverride, { isLoading: isGrantingOverride }] = useGrantCreditOverrideMutation();

  const openOverrideForm = () => {
    setOverrideForm({ maxCredits: String(totalSelectedCredits), reason: "" });
    setIsOverrideFormOpen(true);
  };
  const closeOverrideForm = () => setIsOverrideFormOpen(false);

  const submitOverride = async () => {
    const maxCredits = Number(overrideForm.maxCredits);
    if (!Number.isFinite(maxCredits) || maxCredits < 0) {
      return openAlert({ message: "Enter a valid credit limit.", severity: "warning" });
    }
    if (!overrideForm.reason.trim()) {
      return openAlert({ message: "A reason is required.", severity: "warning" });
    }
    try {
      await grantCreditOverride({
        studentId: limitStudentId,
        semesterId: filters.semesterId,
        termId: filters.termId,
        maxCredits,
        reason: overrideForm.reason.trim(),
      }).unwrap();
      openAlert({ message: "Credit override granted.", severity: "success" });
      setIsOverrideFormOpen(false);
    } catch (error) {
      openAlert({ message: error?.data?.message || "Failed to grant override.", severity: "error" });
    }
  };

  // ==========================================
  // DYNAMIC CATALOG FILTERING
  // ==========================================
  const filteredCatalog = useMemo(() => {
    let list = [...courseCatalog];
    if (filters.departmentId) {
      list = list.filter(
        (c) =>
          (c.owningDepartmentId?._id || c.owningDepartmentId) ===
          filters.departmentId,
      );
    }
    if (courseSearch) {
      const lower = courseSearch.toLowerCase();
      list = list.filter(
        (c) =>
          (c.title?.toLowerCase() || "").includes(lower) ||
          (c.code?.toLowerCase() || "").includes(lower),
      );
    }
    list.sort((a, b) => {
      const val = (a.title || "").localeCompare(b.title || "");
      return courseSort === "asc" ? val : -val;
    });
    return list;
  }, [courseCatalog, filters.departmentId, courseSearch, courseSort]);

  // ==========================================
  // TAB 3: COURSE ROSTER — ASSIGNED vs UNASSIGNED
  // ==========================================
  const assignedCourseIds = useMemo(
    () =>
      new Set(
        assignedCourses.map((ac) => String(ac.courseId?._id || ac.courseId)),
      ),
    [assignedCourses],
  );

  const unassignedCourses = useMemo(
    () => filteredCatalog.filter((c) => !assignedCourseIds.has(String(c._id))),
    [filteredCatalog, assignedCourseIds],
  );

  const rosterStudents = extractArray(courseRosterRes);
  const filteredRosterStudents = useMemo(() => {
    if (!rosterSearch) return rosterStudents;
    const lower = rosterSearch.toLowerCase();
    return rosterStudents.filter(
      (s) =>
        (s.name?.toLowerCase() || "").includes(lower) ||
        (s.studentId?.toLowerCase() || "").includes(lower),
    );
  }, [rosterStudents, rosterSearch]);

  // ==========================================
  // USE EFFECTS & FILTER HANDLERS
  // ==========================================
  useEffect(() => {
    if (termsRes?.data?.length > 0 && !filters.termId) {
      const activeTerm =
        termsRes.data.find((t) => t.status) || termsRes.data[0];
      if (activeTerm) setFilters((p) => ({ ...p, termId: activeTerm._id }));
    }
  }, [termsRes]);

  const semesters = useMemo(() => {
    if (!filters.programId) return [];
    return extractArray(semestersRes)
      .filter((s) => (s.programId?._id || s.programId) === filters.programId)
      .sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [semestersRes, filters.programId]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    if (field === "termId")
      setFilters((p) => ({
        ...p,
        departmentId: "",
        programId: "",
        semesterId: "",
      }));
    if (field === "departmentId") {
      if (value) fetchPrograms(value);
      setFilters((p) => ({
        ...p,
        departmentId: value,
        programId: "",
        semesterId: "",
      }));
    }
    if (field === "programId")
      setFilters((p) => ({ ...p, programId: value, semesterId: "" }));
    setSelectedRows([]);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSelectedRows([]);
  };

  // ==========================================
  // TAB 3: COURSE ROSTER (assign students to ONE course)
  // ==========================================
  const handleOpenRoster = async (course) => {
    setRosterCourse(course);
    setRosterSearch("");
    setIsRosterDrawerOpen(true);
    try {
      const res = await fetchCourseRoster(course._id).unwrap();
      const arrayData = extractArray(res);
      setRosterSelectedIds(
        arrayData.filter((s) => s.isEnrolled).map((s) => s._id),
      );
    } catch (error) {
      openAlert({
        message: "Failed to load the student roster for this course.",
        severity: "error",
      });
    }
  };

  const handleCloseRoster = () => {
    setIsRosterDrawerOpen(false);
    setTimeout(() => {
      setRosterCourse(null);
      setRosterSelectedIds([]);
      setRosterSearch("");
    }, 300);
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
      const result = await updateCourseRoster({
        assignmentId: rosterCourse._id,
        studentIds: rosterSelectedIds,
      }).unwrap();
      openAlert({
        message: result?.message || "Course roster updated successfully!",
        severity: "success",
      });
      handleCloseRoster();
      refetchStudents();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to update course roster.",
        severity: "error",
      });
    }
  };

  const handleQuickAssignCourse = (course) => {
    setSelectedCatalogCourseIds([course._id]);
    setIsAssignCourseDrawerOpen(true);
  };

  // ==========================================
  // TAB 1: ASSIGN COURSES TO SEMESTER
  // ==========================================
  const handleToggleCatalogCourse = (courseId) =>
    setSelectedCatalogCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    );
  const handleSelectAllCatalogCourses = () =>
    selectedCatalogCourseIds.length === filteredCatalog.length
      ? setSelectedCatalogCourseIds([])
      : setSelectedCatalogCourseIds(filteredCatalog.map((c) => c._id));

  const handleAssignCourseSubmit = async () => {
    if (selectedCatalogCourseIds.length === 0)
      return openAlert({
        message: "Please select at least one course.",
        severity: "warning",
      });
    if (!assignCourseForm.section)
      return openAlert({
        message: "Section is required.",
        severity: "warning",
      });

    try {
      await Promise.all(
        selectedCatalogCourseIds.map((courseId) =>
          assignCourseToSemester({
            termId: filters.termId,
            programId: filters.programId,
            semesterId: filters.semesterId,
            courseId,
            section: assignCourseForm.section,
            capacity: assignCourseForm.capacity,
          }).unwrap(),
        ),
      );
      openAlert({
        message: "Courses added to section successfully!",
        severity: "success",
      });
      setIsAssignCourseDrawerOpen(false);
      setSelectedCatalogCourseIds([]);
      setAssignCourseForm({ section: "A", capacity: 50 });
      setCourseSearch("");
      refetchAssigned();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to add courses.",
        severity: "error",
      });
    }
  };

  // ==========================================
  // TAB 2: STUDENT ENROLLMENT (MANAGE)
  // ==========================================
  const handleSelectRow = (id) =>
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  const handleSelectAllRows = (e) =>
    e.target.checked
      ? setSelectedRows(students.map((s) => s._id))
      : setSelectedRows([]);

  const handleOpenSingleStudent = async (student) => {
    setIsBulkMode(false);
    setSelectedStudent(student);
    setIsDrawerOpen(true);
    try {
      const res = await fetchCourseDetails({
        studentId: student._id,
        termId: filters.termId,
        programId: filters.programId,
        semesterId: filters.semesterId,
      }).unwrap();
      const arrayData = extractArray(res);
      setSelectedCourseIds(
        arrayData.filter((c) => c.isRegistered).map((c) => c.courseId || c._id),
      );
    } catch (error) {
      console.error("Details API fallback initialized.");
    }
  };

  const handleOpenBulkDrawer = async () => {
    if (selectedRows.length === 0) return;
    setIsBulkMode(true);
    setIsDrawerOpen(true);
    setSelectedCourseIds([]);
    try {
      const res = await fetchCourseDetails({
        studentId: selectedRows[0],
        termId: filters.termId,
        programId: filters.programId,
        semesterId: filters.semesterId,
      }).unwrap();
      const arrayData = extractArray(res);
      setSelectedCourseIds(
        arrayData.filter((c) => c.isRegistered).map((c) => c.courseId || c._id),
      );
    } catch (error) {
      console.error("Details API fallback initialized.");
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedStudent(null);
      setSelectedCourseIds([]);
      setIsBulkMode(false);
    }, 300);
  };

  const handleToggleCourse = (courseId) =>
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    );
  const handleSelectAllCourses = () =>
    selectedCourseIds.length === drawerCurriculum.length
      ? setSelectedCourseIds([])
      : setSelectedCourseIds(drawerCurriculum.map((c) => c.courseId || c._id));

  const handleSave = async () => {
    if (selectedCourseIds.length === 0)
      return openAlert({
        message: "Please select at least one course.",
        severity: "warning",
      });
    if (isOverMax) {
      return openAlert({
        message: `Credit limit exceeded (${totalSelectedCredits} of max ${creditLimit.maxCredits}). Drop a course, or ask your HOD for an override.`,
        severity: "error",
      });
    }
    try {
      if (isBulkMode) {
        setIsSavingBulk(true);
        await Promise.all(
          selectedRows.map((studentId) =>
            saveRegistrations({
              studentId,
              termId: filters.termId,
              programId: filters.programId,
              semesterId: filters.semesterId,
              courseIds: selectedCourseIds,
            }).unwrap(),
          ),
        );
        openAlert({
          message: `Successfully enrolled ${selectedRows.length} students!`,
          severity: "success",
        });
        setSelectedRows([]);
      } else {
        await saveRegistrations({
          studentId: selectedStudent._id,
          termId: filters.termId,
          programId: filters.programId,
          semesterId: filters.semesterId,
          courseIds: selectedCourseIds,
        }).unwrap();
        openAlert({
          message: "Student courses updated successfully!",
          severity: "success",
        });
      }
      handleCloseDrawer();
      refetchStudents();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to update courses",
        severity: "error",
      });
    } finally {
      setIsSavingBulk(false);
    }
  };

  // ==========================================
  // TAB 2: VIEW STUDENT COURSES (READ-ONLY)
  // ==========================================
  const handleOpenViewCourses = async (student) => {
    setViewingStudent(student);
    setIsViewModalOpen(true);
    setIsFetchingViewCourses(true);
    setViewCoursesList([]);
    try {
      const res = await fetchCourseDetails({
        studentId: student._id,
        termId: filters.termId,
        programId: filters.programId,
        semesterId: filters.semesterId,
      }).unwrap();
      const arrayData = extractArray(res);
      setViewCoursesList(arrayData.filter((c) => c.isRegistered));
    } catch (error) {
      openAlert({
        message: "Failed to load registered courses for this student.",
        severity: "error",
      });
    } finally {
      setIsFetchingViewCourses(false);
    }
  };

  return {
    filters,
    terms: extractArray(termsRes),
    departments: extractArray(deptsRes),
    programs: extractArray(programsRes),
    semesters,
    handleFilterChange,
    activeTab,
    handleTabChange,
    isReady,

    // Semester Courses State
    assignedCourses,
    isFetchingAssigned,
    isAssignCourseDrawerOpen,
    setIsAssignCourseDrawerOpen,
    assignCourseForm,
    setAssignCourseForm,
    handleAssignCourseSubmit,
    isAssigningCourse,
    filteredCatalog,
    courseSearch,
    setCourseSearch,
    courseSort,
    setCourseSort,
    selectedCatalogCourseIds,
    handleToggleCatalogCourse,
    handleSelectAllCatalogCourses,

    // Student Enrollment State
    students,
    isFetchingStudents,
    selectedRows,
    handleSelectRow,
    handleSelectAllRows,
    isDrawerOpen,
    isBulkMode,
    selectedStudent,
    drawerCurriculum,
    isFetchingCourses,
    selectedCourseIds,
    isSaving: isSavingSingle || isSavingBulk,
    handleOpenSingleStudent,
    handleOpenBulkDrawer,
    handleCloseDrawer,
    handleToggleCourse,
    handleSelectAllCourses,
    handleSave,

    // Credit limit
    totalSelectedCredits,
    creditLimit,
    isOverMax,
    isUnderMin,
    isHod,
    isOverrideFormOpen,
    overrideForm,
    setOverrideForm,
    openOverrideForm,
    closeOverrideForm,
    submitOverride,
    isGrantingOverride,

    // View Courses Modal State
    isViewModalOpen,
    setIsViewModalOpen,
    viewingStudent,
    viewCoursesList,
    isFetchingViewCourses,
    handleOpenViewCourses,

    // Tab 3: Course Roster (assigned / unassigned + per-course enrollment)
    unassignedCourses,
    isRosterDrawerOpen,
    rosterCourse,
    rosterSelectedIds,
    rosterSearch,
    setRosterSearch,
    filteredRosterStudents,
    isFetchingRoster,
    isSavingRoster,
    handleOpenRoster,
    handleCloseRoster,
    handleToggleRosterStudent,
    handleSelectAllRosterStudents,
    handleSaveRoster,
    handleQuickAssignCourse,
  };
};

export default useStudentCourseRegistrationController;
