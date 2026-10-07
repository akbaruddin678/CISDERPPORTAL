import { useState, useMemo } from "react";
import { skipToken } from "@reduxjs/toolkit/query/react";
import {
  useGetTermsQuery,
  useGetProgramsByDepartmentQuery,
  useGetSemestersByProgramQuery,
} from "../../../components/catalog/api/catalogApi";
import { useGetFacultyMonitoringQuery } from "../api/monitorFacultyApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

// HOD's own department is locked in via userDepartmentId (backend also
// enforces it server-side via resolveHodDepartment) — Program/Semester are
// the only real choices the HOD makes here.
const useMonitorFacultyController = ({ userDepartmentId }) => {
  const safeDeptId =
    typeof userDepartmentId === "object" && userDepartmentId !== null
      ? userDepartmentId._id
      : userDepartmentId;

  const [filters, setFilters] = useState({ programId: "", semesterId: "", termId: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const { data: termsRes } = useGetTermsQuery();
  const { data: programsRes, isFetching: isFetchingPrograms } =
    useGetProgramsByDepartmentQuery(safeDeptId || skipToken, { skip: !safeDeptId });
  const { data: semestersRes, isFetching: isFetchingSemesters } =
    useGetSemestersByProgramQuery(filters.programId || skipToken, {
      skip: !filters.programId,
    });

  const terms = extractArray(termsRes);
  const programs = extractArray(programsRes);
  const semesters = useMemo(
    () => [...extractArray(semestersRes)].sort((a, b) => (a.number || 0) - (b.number || 0)),
    [semestersRes],
  );

  const isReady = Boolean(filters.programId);
  const { data: overviewRes, isFetching } = useGetFacultyMonitoringQuery(
    { termId: filters.termId, programId: filters.programId, semesterId: filters.semesterId },
    { skip: !isReady, refetchOnMountOrArgChange: true },
  );
  const rows = useMemo(() => extractArray(overviewRes), [overviewRes]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      const nf = { ...prev, [field]: value };
      if (field === "programId") nf.semesterId = "";
      return nf;
    });
  };

  const filteredRows = useMemo(
    () =>
      rows.filter((r) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          r.courseTitle?.toLowerCase().includes(term) ||
          r.courseCode?.toLowerCase().includes(term) ||
          r.instructorName?.toLowerCase().includes(term)
        );
      }),
    [rows, searchTerm],
  );

  const statistics = useMemo(
    () => ({
      total: rows.length,
      noExamsPublished: rows.filter((r) => r.publishedExamCount === 0).length,
      needsAttention: rows.filter((r) => r.marksSubmissionStatus === "Needs Attention").length,
      approved: rows.filter((r) => r.marksSubmissionStatus === "Approved").length,
    }),
    [rows],
  );

  return {
    filters,
    handleFilterChange,
    terms,
    programs,
    isFetchingPrograms,
    semesters,
    isFetchingSemesters,
    isReady,

    rows: filteredRows,
    totalRows: rows.length,
    isFetching,
    statistics,

    searchTerm,
    setSearchTerm,
  };
};

export default useMonitorFacultyController;
