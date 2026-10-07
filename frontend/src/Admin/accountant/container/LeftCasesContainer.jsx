import React, { useState, useEffect } from "react";
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
import LeftCasesView from "../view/LeftCasesView";

const LeftCasesContainer = () => {
  const [activeTab, setActiveTab] = useState("history");

  // --- History Tab States ---
  const [historySearch, setHistorySearch] = useState("");
  const [debouncedHistorySearch, setDebouncedHistorySearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(
      () => setDebouncedHistorySearch(historySearch),
      500,
    );
    return () => clearTimeout(handler);
  }, [historySearch]);

  const { data: statsResponse, isLoading: statsLoading } =
    useGetLeftStudentsStatsQuery();
  const {
    data: historyResponse,
    isLoading: historyLoading,
    isFetching: historyFetching,
  } = useGetLeftStudentsListQuery({
    search: debouncedHistorySearch,
    limit: 50,
  });

  // --- Process Tab States & Filters ---
  const [activeSearch, setActiveSearch] = useState("");
  const [debouncedActiveSearch, setDebouncedActiveSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedProg, setSelectedProg] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");

  useEffect(() => {
    const handler = setTimeout(
      () => setDebouncedActiveSearch(activeSearch),
      500,
    );
    return () => clearTimeout(handler);
  }, [activeSearch]);

  // Reset program if department changes
  useEffect(() => {
    setSelectedProg("");
  }, [selectedDept]);

  // Fetch Dropdown Data
  const { data: deptRes } = useGetDepartmentsQuery();
  const { data: progRes } = useGetProgramsByDepartmentQuery(selectedDept, {
    skip: !selectedDept,
  });
  const { data: termRes } = useGetTermsQuery();

  // Fetch Active Students based on Filters
  // ✅ FIX: The ERP system uses "active" for enrolled students, not "approved"
  const {
    data: activeResponse,
    isLoading: activeLoading,
    isFetching: activeFetching,
  } = useGetStudentsQuery(
    {
      search: debouncedActiveSearch,
      departmentId: selectedDept,
      programId: selectedProg,
      termId: selectedTerm,
      status: "active", // ✅ Fixed Status
      limit: 100,
    },
    { skip: activeTab !== "process" },
  );

  // ✅ ROBUST DATA EXTRACTION: Handles all types of backend pagination wrappers
  const extractArray = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  };

  const stats = statsResponse?.data || statsResponse || null;
  const historyStudents = extractArray(historyResponse);
  const activeStudents = extractArray(activeResponse);
  const departments = extractArray(deptRes);
  const programs = extractArray(progRes);
  const terms = extractArray(termRes);

  return (
    <LeftCasesView
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      // Stats & History
      stats={stats}
      statsLoading={statsLoading}
      historyStudents={historyStudents}
      historyLoading={historyLoading || historyFetching}
      historySearch={historySearch}
      setHistorySearch={setHistorySearch}
      // Process & Filters
      activeStudents={activeStudents}
      activeLoading={activeLoading || activeFetching}
      activeSearch={activeSearch}
      setActiveSearch={setActiveSearch}
      selectedDept={selectedDept}
      setSelectedDept={setSelectedDept}
      selectedProg={selectedProg}
      setSelectedProg={setSelectedProg}
      selectedTerm={selectedTerm}
      setSelectedTerm={setSelectedTerm}
      departments={departments}
      programs={programs}
      terms={terms}
    />
  );
};

export default LeftCasesContainer;
