import { useState, useMemo, useCallback } from "react";
import {
  useGetChallansPaginatedQuery,
  useLazyGetChallansPaginatedQuery,
} from "../api/studentChallanApi";
import {
  useGetTermsQuery,
  useGetDepartmentsQuery,
  useGetProgramsQuery,
  useGetSemestersQuery,
} from "../api/depsemtermpro";

// ✅ ADDED: month, type
const INITIAL_FILTERS = {
  search: "",
  searchType: "all",
  termId: "",
  status: "",
  departmentId: "",
  programId: "",
  semesterId: "",
  month: "",
  type: "",
};

const PAGE_SIZE = 10;

const ChallanGenerationController = ({ children }) => {
  const [draftFilters, setDraftFilters] = useState(INITIAL_FILTERS);
  const [activeSearch, setActiveSearch] = useState("");
  const [committedFilters, setCommittedFilters] = useState({
    termId: "",
    status: "",
    departmentId: "",
    programId: "",
    semesterId: "",
    month: "", // ✅ ADDED: month
    type: "", // ✅ ADDED: type
  });

  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE });
  const [selectedChallan, setSelectedChallan] = useState(null);

  const { data: termsRes } = useGetTermsQuery();
  const { data: deptRes } = useGetDepartmentsQuery();
  const { data: progRes } = useGetProgramsQuery();
  const { data: semRes } = useGetSemestersQuery();

  const { data: challansRes, isFetching } = useGetChallansPaginatedQuery(
    {
      page: pagination.page,
      limit: pagination.limit,
      search: activeSearch,
      excludeType: "hostel", // Drops hostel fees at the DB level
      ...committedFilters,
    },
    { refetchOnMountOrArgChange: true },
  );

  const [fetchPrintChallansOriginal, { isFetching: isPrinting }] =
    useLazyGetChallansPaginatedQuery();

  const fetchPrintChallans = useCallback(
    (params) => {
      return fetchPrintChallansOriginal({ ...params, excludeType: "hostel" });
    },
    [fetchPrintChallansOriginal],
  );

  const challans = challansRes?.data?.challans || [];
  const totalPages = challansRes?.data?.totalPages || 1;
  const terms = termsRes?.data || [];
  const departments = deptRes?.data || [];
  const allPrograms = progRes?.data || [];
  const allSemesters = semRes?.data || [];

  const programs = useMemo(() => {
    if (!draftFilters.departmentId) return allPrograms;
    return allPrograms.filter(
      (p) =>
        (p.departmentId?._id || p.departmentId) === draftFilters.departmentId,
    );
  }, [allPrograms, draftFilters.departmentId]);

  const semesters = useMemo(() => {
    if (!draftFilters.programId) return allSemesters;
    return [...allSemesters]
      .filter(
        (s) => (s.programId?._id || s.programId) === draftFilters.programId,
      )
      .sort((a, b) => a.number - b.number);
  }, [allSemesters, draftFilters.programId]);

  const handleFilterChange = useCallback((key, value) => {
    setDraftFilters((prev) => {
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

    if (key !== "search" && key !== "searchType") {
      setCommittedFilters((prev) => {
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
      setPagination((p) => ({ ...p, page: 1 }));
    }
  }, []);

  const handleSearchClick = useCallback(() => {
    setActiveSearch(draftFilters.search.trim());
    setPagination((p) => ({ ...p, page: 1 }));
  }, [draftFilters.search]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") handleSearchClick();
    },
    [handleSearchClick],
  );

  const handleClearSearch = useCallback(() => {
    setDraftFilters(INITIAL_FILTERS);
    setCommittedFilters({
      termId: "",
      status: "",
      departmentId: "",
      programId: "",
      semesterId: "",
      month: "", // ✅ Reset month
      type: "", // ✅ Reset type
    });
    setActiveSearch("");
    setPagination({ page: 1, limit: PAGE_SIZE });
  }, []);

  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage >= 1 && newPage <= totalPages)
        setPagination((p) => ({ ...p, page: newPage }));
    },
    [totalPages],
  );

  const viewFilters = {
    ...committedFilters,
    search: draftFilters.search,
    searchType: draftFilters.searchType,
    month: draftFilters.month, // ✅ Expose to view
    type: draftFilters.type, // ✅ Expose to view
  };

  return children({
    challans,
    terms,
    departments,
    programs,
    semesters,
    totalPages,
    filters: viewFilters,
    isLoading: isFetching,
    isPrinting,
    pagination,
    selectedChallan,
    setSelectedChallan,
    handleFilterChange,
    handlePageChange,
    handleSearchClick,
    handleClearSearch,
    handleKeyDown,
    fetchPrintChallans,
  });
};

export default ChallanGenerationController;
