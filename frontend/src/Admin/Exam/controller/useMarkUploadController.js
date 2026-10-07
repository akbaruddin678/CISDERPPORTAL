import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetTermsQuery,
  useGetDepartmentsQuery,
  useLazyGetProgramsQuery,
  useGetSemestersQuery,
  useGetCoursesBySemesterQuery,
  useGetExamsForCourseQuery,
  useGetCourseExamRosterQuery,
  useManualUploadExamMarksMutation,
} from "../api/examApi";

const normalizeArray = (res) => res?.data || res || [];

// This is the Admin/Exam-Cell manual override tool: marks entered here are
// saved straight to ExamResult as already-approved, skipping the teacher
// draft/publish/HOD-review pipeline entirely.
const useMarkUploadController = () => {
  const { openAlert } = useGlobalAlert();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    termId: searchParams.get("termId") || "",
    departmentId: searchParams.get("departmentId") || "",
    programId: searchParams.get("programId") || "",
    semesterId: searchParams.get("semesterId") || "",
    courseId: searchParams.get("courseId") || "",
  });

  const [examId, setExamId] = useState("");
  const [marksGrid, setMarksGrid] = useState([]);

  // --- API HOOKS ---
  const { data: termsRes } = useGetTermsQuery();
  const { data: deptsRes } = useGetDepartmentsQuery();
  const { data: semestersRes } = useGetSemestersQuery();
  const [fetchPrograms, { data: programsRes }] = useLazyGetProgramsQuery();

  const { data: coursesRes } = useGetCoursesBySemesterQuery(
    {
      termId: filters.termId,
      programId: filters.programId,
      semesterId: filters.semesterId,
    },
    { skip: !filters.semesterId || !filters.programId || !filters.termId },
  );

  const isReadyToFetchCourse = Boolean(
    filters.termId &&
    filters.departmentId &&
    filters.programId &&
    filters.semesterId &&
    filters.courseId,
  );

  const { data: examsRes, isFetching: isFetchingExams } = useGetExamsForCourseQuery(
    { termId: filters.termId, courseId: filters.courseId, semesterId: filters.semesterId },
    { skip: !isReadyToFetchCourse },
  );
  const exams = normalizeArray(examsRes);

  const isReadyToFetch = isReadyToFetchCourse && Boolean(examId);

  const {
    data: rosterRes,
    isFetching: isFetchingStudents,
    refetch: refetchStudents,
  } = useGetCourseExamRosterQuery(
    { termId: filters.termId, courseId: filters.courseId, semesterId: filters.semesterId, examId },
    { skip: !isReadyToFetch, refetchOnMountOrArgChange: true },
  );
  const selectedExam =
    rosterRes?.data?.exam || exams.find((e) => e._id === examId) || null;

  const [manualUpload, { isLoading: isSaving }] = useManualUploadExamMarksMutation();

  const terms = normalizeArray(termsRes);
  const departments = normalizeArray(deptsRes);
  const programs = normalizeArray(programsRes);
  const semestersList = normalizeArray(semestersRes);
  const courses = normalizeArray(coursesRes);

  useEffect(() => {
    if (filters.departmentId) fetchPrograms(filters.departmentId);
  }, [filters.departmentId, fetchPrograms]);

  useEffect(() => {
    if (terms.length > 0 && !filters.termId) {
      const active = terms.find((t) => t.status) || terms[0];
      if (active) {
        setFilters((p) => ({ ...p, termId: active._id }));
        setSearchParams({ termId: active._id });
      }
    }
  }, [terms, filters.termId, setSearchParams]);

  // Picking a different course invalidates whatever exam was selected.
  useEffect(() => {
    setExamId("");
  }, [filters.courseId]);

  useEffect(() => {
    if (rosterRes?.data?.students) {
      setMarksGrid(
        rosterRes.data.students.map((student) => ({
          ...student,
          isEditing: student.obtainedMarks === null && !student.isAbsent,
        })),
      );
    } else {
      setMarksGrid([]);
    }
  }, [rosterRes]);

  const availablePrograms = programs.filter(
    (p) =>
      String(p.departmentId?._id || p.departmentId) ===
      String(filters.departmentId),
  );
  const availableSemesters = useMemo(() => {
    let sems = semestersList;
    if (filters.programId)
      sems = semestersList.filter(
        (s) =>
          String(s.programId?._id || s.programId) === String(filters.programId),
      );
    return [...sems].sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [semestersList, filters.programId]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      const nf = { ...prev, [field]: value };
      if (field === "departmentId") {
        nf.programId = "";
        nf.semesterId = "";
        nf.courseId = "";
      }
      if (field === "programId") {
        nf.semesterId = "";
        nf.courseId = "";
      }
      if (field === "semesterId") {
        nf.courseId = "";
      }
      setSearchParams(nf);
      return nf;
    });
  };

  const handleMarkUpdate = (index, value, maxAllowed) => {
    let num = Number(value);
    if (num > maxAllowed) num = maxAllowed;
    if (num < 0) num = 0;
    const updatedGrid = [...marksGrid];
    updatedGrid[index] = { ...updatedGrid[index], obtainedMarks: num };
    setMarksGrid(updatedGrid);
  };

  const toggleAbsent = (index) => {
    const updatedGrid = [...marksGrid];
    updatedGrid[index] = {
      ...updatedGrid[index],
      isAbsent: !updatedGrid[index].isAbsent,
    };
    setMarksGrid(updatedGrid);
  };

  const toggleEditMode = (index) => {
    const updatedGrid = [...marksGrid];
    updatedGrid[index].isEditing = !updatedGrid[index].isEditing;
    setMarksGrid(updatedGrid);
  };

  const buildPayload = (rows) => ({
    termId: filters.termId,
    courseId: filters.courseId,
    semesterId: filters.semesterId,
    examId,
    records: rows.map((r) => ({
      studentId: r.studentId,
      obtainedMarks: r.obtainedMarks ?? 0,
      isAbsent: Boolean(r.isAbsent),
    })),
  });

  const handleSingleSave = async (row) => {
    try {
      await manualUpload(buildPayload([row])).unwrap();
      openAlert({
        message: `${row.name}'s marks saved!`,
        severity: "success",
      });
      refetchStudents();
    } catch (err) {
      openAlert({
        message: err.data?.message || "Failed to save marks",
        severity: "error",
      });
    }
  };

  const handleSaveMarks = async () => {
    try {
      await manualUpload(buildPayload(marksGrid)).unwrap();
      openAlert({
        message: "All marks saved successfully!",
        severity: "success",
      });
      refetchStudents();
    } catch (err) {
      openAlert({
        message: err.data?.message || "Failed to save bulk marks",
        severity: "error",
      });
    }
  };

  return {
    filters,
    handleFilterChange,
    terms,
    departments,
    availablePrograms,
    availableSemesters,
    courses,

    exams,
    isFetchingExams,
    examId,
    setExamId,
    selectedExam,

    marksGrid,
    handleMarkUpdate,
    toggleAbsent,
    isFetchingStudents,
    handleSaveMarks,
    isSaving,
    isReadyToFetch,
    isReadyToFetchCourse,
    toggleEditMode,
    handleSingleSave,
  };
};

export default useMarkUploadController;
