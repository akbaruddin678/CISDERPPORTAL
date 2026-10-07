import { useEffect, useState } from "react";
import {
  useGetLeftStudentsStatsQuery,
  useGetLeftStudentsListQuery,
} from "../api/leftCasesApi";
import { useGetStudentsQuery } from "../api/accountantstudentApi";
import {
  useGetDepartmentsQuery,
  useGetProgramsByDepartmentQuery,
  useGetTermsQuery,
} from "../api/depsemtermpro";

const extractArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
};

// College/COIS counterpart to LeftCasesContainer.jsx — same withdrawal
// flow and API endpoints, scoped to the College department instead of
// left unscoped, so this tab never shows/affects University students.
export const useCOISWithdraw = () => {
  const [activeTab, setActiveTab] = useState("history");

  // --- Auto-detect and lock the College/Intermediate department, exactly
  // like useCOISChallan.js already does for every other COIS screen. ---
  const [coisDeptId, setCoisDeptId] = useState("");
  const { data: deptRes } = useGetDepartmentsQuery();
  useEffect(() => {
    if (deptRes?.data && !coisDeptId) {
      const coisDept = deptRes.data.find(
        (d) =>
          d.name?.toLowerCase().includes("college") ||
          d.name?.toLowerCase().includes("intermediate") ||
          d.departmentName?.toLowerCase().includes("college"),
      );
      if (coisDept) setCoisDeptId(coisDept._id);
      else if (deptRes.data.length > 0) setCoisDeptId(deptRes.data[0]._id);
    }
  }, [deptRes, coisDeptId]);

  // --- History Tab ---
  const [historySearch, setHistorySearch] = useState("");
  const [debouncedHistorySearch, setDebouncedHistorySearch] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedHistorySearch(historySearch), 500);
    return () => clearTimeout(handler);
  }, [historySearch]);

  const { data: statsResponse, isLoading: statsLoading } = useGetLeftStudentsStatsQuery(
    { departmentId: coisDeptId },
    { skip: !coisDeptId },
  );
  const {
    data: historyResponse,
    isLoading: historyLoading,
    isFetching: historyFetching,
  } = useGetLeftStudentsListQuery(
    { departmentId: coisDeptId, search: debouncedHistorySearch, limit: 50 },
    { skip: !coisDeptId },
  );

  // --- Process Tab ---
  const [activeSearch, setActiveSearch] = useState("");
  const [debouncedActiveSearch, setDebouncedActiveSearch] = useState("");
  const [selectedProg, setSelectedProg] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedActiveSearch(activeSearch), 500);
    return () => clearTimeout(handler);
  }, [activeSearch]);

  // Programs scoped the same way every other COIS screen scopes them —
  // "context: college" restricts to HSSC-level programs regardless of
  // which department they're actually attached to.
  const { data: progRes } = useGetProgramsByDepartmentQuery({
    context: "college",
    limit: 200,
  });
  const { data: termRes } = useGetTermsQuery();

  const {
    data: activeResponse,
    isLoading: activeLoading,
    isFetching: activeFetching,
  } = useGetStudentsQuery(
    {
      search: debouncedActiveSearch,
      departmentId: coisDeptId,
      programId: selectedProg,
      termId: selectedTerm,
      status: "active",
      limit: 100,
    },
    { skip: activeTab !== "process" || !coisDeptId },
  );

  const stats = statsResponse?.data || statsResponse || null;
  const historyStudents = extractArray(historyResponse);
  const activeStudents = extractArray(activeResponse);
  const programs = extractArray(progRes);
  const terms = extractArray(termRes);

  return {
    activeTab,
    setActiveTab,

    stats,
    statsLoading,
    historyStudents,
    historyLoading: historyLoading || historyFetching,
    historySearch,
    setHistorySearch,

    activeStudents,
    activeLoading: activeLoading || activeFetching,
    activeSearch,
    setActiveSearch,
    selectedProg,
    setSelectedProg,
    selectedTerm,
    setSelectedTerm,
    programs,
    terms,
  };
};
