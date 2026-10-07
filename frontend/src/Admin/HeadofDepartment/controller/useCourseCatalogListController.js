import { useEffect, useState, useMemo } from "react";
import { useGetAllCoursesQuery } from "../../Exam/api/courseRegistrationApi";
import {
  useGetDepartmentsQuery,
  useGetProgramsQuery,
} from "../../../components/catalog/api/catalogApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

// Read-only course catalog list shared by HOD, Head of Academia, and VC —
// there's no more approval chain to drive per-role screens, just a scoped
// view of the same catalog. `scope: "own"` (HOD) locks to the caller's own
// department with no filters shown; `scope: "all"` (Academia/VC) shows
// every course with Department + Program filters (Program narrows down to
// courses actually offered in that program via Course Assignment, resolved
// server-side).
const useCourseCatalogListController = ({ scope = "own", departmentId } = {}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(20);

  const isAllScope = scope === "all";
  const effectiveDepartmentId = isAllScope ? deptFilter : departmentId;

  const queryParams = {};
  if (effectiveDepartmentId) queryParams.owningDepartmentId = effectiveDepartmentId;
  if (isAllScope && programFilter) queryParams.programId = programFilter;
  if (statusFilter) queryParams.status = statusFilter;
  if (debouncedSearch) queryParams.search = debouncedSearch;
  queryParams.page = page;
  queryParams.limit = pageSize;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const { data: coursesRes, isLoading: isFetchingCourses } = useGetAllCoursesQuery(
    queryParams,
    { skip: !isAllScope && !departmentId },
  );

  const { data: deptsRes } = useGetDepartmentsQuery(undefined, { skip: !isAllScope });
  const { data: progsRes } = useGetProgramsQuery(undefined, { skip: !isAllScope });

  const allCourses = extractArray(coursesRes);
  const departments = extractArray(deptsRes);
  const allPrograms = extractArray(progsRes);

  const programs = useMemo(() => {
    if (!deptFilter) return allPrograms;
    return allPrograms.filter(
      (p) => (p.departmentId?._id || p.departmentId) === deptFilter,
    );
  }, [allPrograms, deptFilter]);

  const handleDeptFilterChange = (id) => {
    setDeptFilter(id);
    setProgramFilter("");
    setPage(1);
  };

  return {
    filteredCourses: allCourses,
    isFetchingCourses,
    stats: coursesRes?.stats || { total: 0, active: 0, draft: 0, retired: 0 },
    pagination: coursesRes?.pagination || { page, total: 0, totalPages: 1 },
    page,
    setPage,
    pageSize,
    setPageSize: (size) => { setPageSizeState(Number(size)); setPage(1); },
    searchQuery,
    setSearchQuery,

    showScopeFilters: isAllScope,
    departments,
    programs,
    deptFilter,
    setDeptFilter: handleDeptFilterChange,
    programFilter,
    setProgramFilter: (id) => { setProgramFilter(id); setPage(1); },
    statusFilter,
    setStatusFilter: (status) => { setStatusFilter(status); setPage(1); },
  };
};

export default useCourseCatalogListController;
