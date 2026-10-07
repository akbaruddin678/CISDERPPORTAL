import { useCallback, useEffect, useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { useGetHodStudentProgramsQuery, useGetHodStudentsByProgramQuery, useGetHodStudentProfileQuery } from "../api/hodStudentApi";

const VIEW_KEY = "hodStudentsViewMode";
const errorMessage = (error) => error?.data?.message || (error ? "Something went wrong. Please try again." : "");
const readSavedView = () => {
  try { return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid"; }
  catch { return "grid"; }
};

const useHodStudentsController = () => {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("all");
  const [pickedProgramId, setPickedProgramId] = useState("");
  const [semesterKey, setSemesterKey] = useState("all");
  const [searchQuery, setSearchQueryState] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(20);
  const [viewMode, setViewModeState] = useState(readSavedView);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const { data: programsRes, isLoading: isLoadingPrograms, error: programsError } = useGetHodStudentProgramsQuery();
  const allPrograms = useMemo(() => programsRes?.data || [], [programsRes]);
  const departments = useMemo(() => {
    const map = new Map();
    allPrograms.forEach((program) => {
      const id = String(program.departmentId || program.departmentName || "");
      if (id && !map.has(id)) map.set(id, { _id: id, name: program.departmentName });
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [allPrograms]);
  const programs = useMemo(() => selectedDepartmentId === "all"
    ? allPrograms
    : allPrograms.filter((program) => String(program.departmentId) === selectedDepartmentId),
  [allPrograms, selectedDepartmentId]);
  const selectedProgramId = useMemo(() => {
    if (pickedProgramId && programs.some((program) => program._id === pickedProgramId)) return pickedProgramId;
    return programs.reduce((best, program) => (!best || program.studentCount > best.studentCount ? program : best), null)?._id || "";
  }, [programs, pickedProgramId]);
  const selectedProgram = allPrograms.find((program) => program._id === selectedProgramId) || null;

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedSearch(searchQuery.trim()); setPage(1); }, 350);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const studentQuery = selectedProgramId ? {
    programId: selectedProgramId,
    semesterId: semesterKey,
    search: debouncedSearch,
    page,
    limit: pageSize,
  } : skipToken;
  const { data: studentsRes, isFetching: isLoadingStudents, error: studentsError } = useGetHodStudentsByProgramQuery(studentQuery);
  const students = useMemo(() => studentsRes?.data || [], [studentsRes]);
  const pagination = studentsRes?.pagination || { page, limit: pageSize, total: 0, totalPages: 1 };
  const semesterOptions = studentsRes?.semesterOptions || [];
  const semesterGroups = useMemo(() => {
    const map = new Map();
    students.forEach((student) => {
      const number = student.semester?.number ?? null;
      const key = number === null ? "none" : String(number);
      if (!map.has(key)) map.set(key, { key, semesterNumber: number, label: number === null ? "No semester" : `Semester ${number}`, students: [] });
      map.get(key).students.push(student);
    });
    return [...map.values()].sort((a, b) => (a.semesterNumber ?? Number.MAX_SAFE_INTEGER) - (b.semesterNumber ?? Number.MAX_SAFE_INTEGER));
  }, [students]);
  const departmentTotal = programs.reduce((sum, program) => sum + (program.studentCount || 0), 0);
  const departmentName = selectedDepartmentId === "all"
    ? departments.length > 1 ? "All departments" : departments[0]?.name || ""
    : departments.find((department) => department._id === selectedDepartmentId)?.name || "";
  const maxProgramCount = programs.reduce((max, program) => Math.max(max, program.studentCount || 0), 0);

  const { currentData: profileData, isFetching: isLoadingProfile, error: profileError } = useGetHodStudentProfileQuery(selectedStudentId || skipToken);
  const selectedIndex = students.findIndex((student) => student._id === selectedStudentId);
  const goPrev = useCallback(() => { if (selectedIndex > 0) setSelectedStudentId(students[selectedIndex - 1]._id); }, [selectedIndex, students]);
  const goNext = useCallback(() => { if (selectedIndex >= 0 && selectedIndex < students.length - 1) setSelectedStudentId(students[selectedIndex + 1]._id); }, [selectedIndex, students]);
  const setViewMode = (mode) => {
    setViewModeState(mode);
    try { localStorage.setItem(VIEW_KEY, mode); } catch { /* Preference only. */ }
  };

  return {
    programs, departments, selectedDepartmentId,
    selectDepartment: (id) => { setSelectedDepartmentId(id); setPickedProgramId(""); setSemesterKey("all"); setPage(1); },
    isLoadingPrograms, programsErrorMessage: errorMessage(programsError), selectedProgramId, selectedProgram,
    selectProgram: (id) => { setPickedProgramId(id); setSemesterKey("all"); setPage(1); },
    departmentName, departmentTotal, maxProgramCount,
    searchQuery, setSearchQuery: setSearchQueryState,
    totalStudents: studentsRes?.stats?.total || 0,
    activeStudentCount: studentsRes?.stats?.active || 0,
    visibleStudentCount: students.length,
    semesterGroups, semesterOptions, visibleGroups: semesterGroups,
    activeSemesterKey: semesterKey,
    selectSemester: (id) => { setSemesterKey(id); setPage(1); },
    viewMode, setViewMode, isLoadingStudents, studentsErrorMessage: errorMessage(studentsError),
    pagination, page, setPage,
    pageSize, setPageSize: (size) => { setPageSizeState(Number(size)); setPage(1); },
    selectedStudentId, openStudent: setSelectedStudentId, closeStudent: () => setSelectedStudentId(null),
    profile: profileData?.data?.student || null, isLoadingProfile, profileErrorMessage: errorMessage(profileError),
    profilePosition: selectedIndex + 1, profileTotal: students.length,
    goPrev: selectedIndex > 0 ? goPrev : null,
    goNext: selectedIndex >= 0 && selectedIndex < students.length - 1 ? goNext : null,
  };
};

export default useHodStudentsController;
