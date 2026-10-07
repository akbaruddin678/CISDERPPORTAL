import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getSemesterDefaulters,
  toggleStudentExemption,
} from "../api/requestService";
import {
  useGetDepartmentsQuery,
  useGetProgramsQuery,
  useGetSemestersQuery,
  useGetTermsQuery,
} from "../api/depsemtermpro";

const useChallanRequestController = () => {
  // --- STATE ---
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);

  // Filters State
  const [filters, setFilters] = useState({
    termId: "",
    departmentId: "",
    programId: "",
    semesterId: "",
  });

  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // --- 1. DATA FETCHING ---
  const { data: termsRes } = useGetTermsQuery();
  const { data: deptsRes } = useGetDepartmentsQuery();
  // Fetch ALL programs/semesters (or filtered by API if supported)
  // We will apply client-side filtering below to be 100% safe
  const { data: programsRes } = useGetProgramsQuery();
  const { data: semestersRes } = useGetSemestersQuery();

  // --- 2. FILTERING & SORTING LOGIC ---

  const terms = termsRes?.data || [];
  const departments = deptsRes?.data || [];

  // Filter Programs based on selected Department
  const programs = useMemo(() => {
    const allPrograms = programsRes?.data || [];
    if (!filters.departmentId) return [];

    return allPrograms.filter(
      (p) =>
        p.departmentId?._id === filters.departmentId ||
        p.departmentId === filters.departmentId
    );
  }, [programsRes, filters.departmentId]);

  // Filter & Sort Semesters based on selected Program
  const semesters = useMemo(() => {
    const allSemesters = semestersRes?.data || [];
    if (!filters.programId) return [];

    return allSemesters
      .filter(
        (s) =>
          s.programId?._id === filters.programId ||
          s.programId === filters.programId
      )
      .sort((a, b) => {
        // Sort by 'number' if available, otherwise by name
        const numA = a.number || parseInt(a.name?.match(/\d+/)?.[0]) || 0;
        const numB = b.number || parseInt(b.name?.match(/\d+/)?.[0]) || 0;
        return numA - numB;
      });
  }, [semestersRes, filters.programId]);

  // --- 3. FETCH DEFAULTERS LIST ---
  const fetchDefaulters = useCallback(async () => {
    // Only fetch if ALL filters are selected
    if (
      !filters.termId ||
      !filters.departmentId ||
      !filters.programId ||
      !filters.semesterId
    ) {
      setStudents([]);
      return;
    }

    setLoading(true);
    try {
      const data = await getSemesterDefaulters(
        filters.programId,
        filters.semesterId,
        filters.termId
      );
      setStudents(data);
    } catch (error) {
      console.error(error);
      setFeedback({
        open: true,
        message: "Failed to load students",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Trigger fetch when filters change (and are complete)
  useEffect(() => {
    fetchDefaulters();
  }, [fetchDefaulters]);

  // --- HANDLERS ---

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };

      // Cascading Resets:
      if (key === "departmentId") {
        newFilters.programId = ""; // Clear Program if Dept changes
        newFilters.semesterId = ""; // Clear Semester if Dept changes
      }
      if (key === "programId") {
        newFilters.semesterId = ""; // Clear Semester if Program changes
      }

      return newFilters;
    });
  };

  const handleToggleExemption = async (index) => {
    const student = students[index];
    const newStatus = !student.isAllowed;

    // Optimistic UI Update
    const updatedList = [...students];
    updatedList[index].isAllowed = newStatus;
    setStudents(updatedList);
    setSavingId(student.studentId);

    try {
      await toggleStudentExemption({
        studentId: student.studentId,
        semesterId: filters.semesterId,
        isAllowed: newStatus,
        remark: student.remark,
        studentName: student.name,
      });
    } catch (error) {
      // Revert on error
      updatedList[index].isAllowed = !newStatus;
      setStudents(updatedList);
      setFeedback({ open: true, message: "Update Failed", severity: "error" });
    } finally {
      setSavingId(null);
    }
  };

  const handleRemarkChange = (index, value) => {
    const updatedList = [...students];
    updatedList[index].remark = value;
    setStudents(updatedList);
  };

  const handleSaveRemark = async (index) => {
    const student = students[index];
    setSavingId(student.studentId);
    try {
      await toggleStudentExemption({
        studentId: student.studentId,
        semesterId: filters.semesterId,
        isAllowed: student.isAllowed,
        remark: student.remark,
        studentName: student.name,
      });
      setFeedback({ open: true, message: "Remark Saved", severity: "success" });
    } catch (error) {
      setFeedback({
        open: true,
        message: "Failed to save remark",
        severity: "error",
      });
    } finally {
      setSavingId(null);
    }
  };

  return {
    students,
    loading,
    savingId,
    filters,
    terms,
    departments,
    programs,
    semesters,
    handleFilterChange,
    handleToggleExemption,
    handleRemarkChange,
    handleSaveRemark,
    feedback,
    closeFeedback: () => setFeedback({ ...feedback, open: false }),
    refresh: fetchDefaulters,
  };
};

export default useChallanRequestController;
