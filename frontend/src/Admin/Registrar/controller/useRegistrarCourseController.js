import { useMemo, useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetAllCoursesQuery,
  useLazyGetAllCoursesQuery,
  useAssignCourseCodeMutation,
} from "../../Exam/api/courseRegistrationApi";
import {
  useGetDepartmentsQuery,
  useGetProgramsQuery,
} from "../../../components/catalog/api/catalogApi";

const PAGE_SIZE = 10;

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

const useRegistrarCourseController = () => {
  const { openAlert } = useGlobalAlert();

  // --- Tab (course status) ---
  const [activeTab, setActiveTabRaw] = useState(0); // 0 = DRAFT (Pending Activation), 1 = ACTIVE (Catalog)
  const status = activeTab === 0 ? "DRAFT" : "ACTIVE";

  // --- Filters ---
  const [departmentId, setDepartmentIdRaw] = useState("");
  const [programId, setProgramIdRaw] = useState("");
  const [searchQuery, setSearchQueryRaw] = useState("");
  const [page, setPageRaw] = useState(1);

  const baseFilters = useMemo(
    () => ({
      ...(departmentId ? { owningDepartmentId: departmentId } : {}),
      ...(programId ? { programId } : {}),
      ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
    }),
    [departmentId, programId, searchQuery],
  );

  const setActiveTab = (tab) => {
    setActiveTabRaw(tab);
    setPageRaw(1);
  };
  const setDepartmentId = (id) => {
    setDepartmentIdRaw(id);
    setProgramIdRaw(""); // program list is scoped to department — reset on change
    setPageRaw(1);
  };
  const setProgramId = (id) => {
    setProgramIdRaw(id);
    setPageRaw(1);
  };
  const setSearchQuery = (q) => {
    setSearchQueryRaw(q);
    setPageRaw(1);
  };
  const setPage = (p) => setPageRaw(p);
  const clearFilters = () => {
    setDepartmentIdRaw("");
    setProgramIdRaw("");
    setSearchQueryRaw("");
    setPageRaw(1);
  };

  // --- Main paginated list for the active tab ---
  const {
    data: coursesRes,
    isFetching: isFetchingCourses,
    refetch,
  } = useGetAllCoursesQuery({
    ...baseFilters,
    status,
    page,
    limit: PAGE_SIZE,
  });
  const courses = extractArray(coursesRes);
  const pagination = coursesRes?.pagination || {
    page: 1,
    limit: PAGE_SIZE,
    total: courses.length,
    totalPages: 1,
  };

  // --- Lightweight counts (same filters, ignoring the active tab's status)
  // to drive the tab badges and stat cards without loading full lists.
  const { data: draftCountRes } = useGetAllCoursesQuery({
    ...baseFilters,
    status: "DRAFT",
    page: 1,
    limit: 1,
  });
  const { data: activeCountRes } = useGetAllCoursesQuery({
    ...baseFilters,
    status: "ACTIVE",
    page: 1,
    limit: 1,
  });
  const { data: totalCountRes } = useGetAllCoursesQuery({
    ...baseFilters,
    page: 1,
    limit: 1,
  });
  const draftCount = draftCountRes?.pagination?.total ?? 0;
  const activeCount = activeCountRes?.pagination?.total ?? 0;
  const totalCount = totalCountRes?.pagination?.total ?? 0;

  // --- Filter dropdown data sources ---
  const { data: deptRes } = useGetDepartmentsQuery();
  const departments = extractArray(deptRes);

  // Programs are scoped to university-level curricula (not HSSC/college
  // programs) since official course codes are a university academic-affairs
  // concern, and narrowed further to the selected department if any.
  const { data: progRes } = useGetProgramsQuery({
    context: "university",
    limit: 200,
    ...(departmentId ? { departmentId } : {}),
  });
  const programs = extractArray(progRes);

  // --- "Export All (This Tab)" needs the FULL filtered set, not just the
  // current page — fetched on demand only when an export is requested.
  const [triggerFetchAll] = useLazyGetAllCoursesQuery();
  const fetchAllForExport = async () => {
    const result = await triggerFetchAll({ ...baseFilters, status }).unwrap();
    return extractArray(result);
  };

  const [assignCourseCode, { isLoading: isUpdating }] =
    useAssignCourseCodeMutation();

  const [activationModalOpen, setActivationModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseCode, setCourseCode] = useState("");

  const handleOpenActivationModal = (course) => {
    setSelectedCourse(course);
    setCourseCode(course.code || "");
    setActivationModalOpen(true);
  };

  const handleActivateCourse = async () => {
    if (!courseCode.trim()) {
      return openAlert({
        message: "An official Course Code is required.",
        severity: "warning",
      });
    }

    try {
      await assignCourseCode({
        id: selectedCourse._id,
        code: courseCode.trim().toUpperCase(),
      }).unwrap();

      openAlert({
        message: `Course activated as ${courseCode.toUpperCase()}`,
        severity: "success",
      });
      setActivationModalOpen(false);
      refetch();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to activate course.",
        severity: "error",
      });
    }
  };

  return {
    courses,
    isFetchingCourses,
    pagination,
    page,
    setPage,

    activeTab,
    setActiveTab,
    draftCount,
    activeCount,
    totalCount,

    departments,
    programs,
    departmentId,
    setDepartmentId,
    programId,
    setProgramId,
    searchQuery,
    setSearchQuery,
    clearFilters,

    fetchAllForExport,

    activationModalOpen,
    setActivationModalOpen,
    selectedCourse,
    courseCode,
    setCourseCode,
    handleOpenActivationModal,
    handleActivateCourse,
    isUpdating,
  };
};

export default useRegistrarCourseController;
