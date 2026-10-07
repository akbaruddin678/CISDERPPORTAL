import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetTermsQuery,
  useGetDepartmentsQuery,
  useLazyGetProgramsQuery,
  useGetSemestersQuery,
  useGetExamsForCourseQuery,
  useGetAttendanceRosterQuery,
  useSaveAttendanceMutation,
  useSubmitAttendanceForReviewMutation,
} from "../api/examApi";
import { useGetAssignedCoursesQuery } from "../api/courseAssignmentApi";

const normalizeArray = (res) => res?.data || res || [];
const EDITABLE_STATUSES = ["DRAFT", "RETURNED"];

// Exam-Cell staff (manager/admin) record attendance per course section —
// not the course's own teacher. Recording flows into the same
// ExamAttendance collection Marks Upload already reads from, gated behind
// an ExamAttendanceSubmission that must be explicitly submitted for HOD
// department-level review before it counts as final.
const useExamAttendanceController = () => {
  const { openAlert } = useGlobalAlert();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    termId: searchParams.get("termId") || "",
    departmentId: searchParams.get("departmentId") || "",
    programId: searchParams.get("programId") || "",
    semesterId: searchParams.get("semesterId") || "",
  });

  const [assignmentId, setAssignmentId] = useState("");
  const [examId, setExamId] = useState("");
  const [attendanceGrid, setAttendanceGrid] = useState({});

  const { data: termsRes } = useGetTermsQuery();
  const { data: deptsRes } = useGetDepartmentsQuery();
  const { data: semestersRes } = useGetSemestersQuery();
  const [fetchPrograms, { data: programsRes }] = useLazyGetProgramsQuery();

  const isReadyToFetchAssignments = Boolean(
    filters.termId && filters.programId && filters.semesterId,
  );
  const { data: assignmentsRes, isFetching: isFetchingAssignments } =
    useGetAssignedCoursesQuery(
      { termId: filters.termId, programId: filters.programId, semesterId: filters.semesterId },
      { skip: !isReadyToFetchAssignments },
    );
  const assignments = normalizeArray(assignmentsRes);

  const selectedAssignment = useMemo(
    () => assignments.find((a) => a._id === assignmentId) || null,
    [assignments, assignmentId],
  );

  const isReadyToFetchExams = Boolean(selectedAssignment);
  const { data: examsRes, isFetching: isFetchingExams } = useGetExamsForCourseQuery(
    {
      termId: filters.termId,
      courseId: selectedAssignment?.courseId?._id,
      semesterId: filters.semesterId,
    },
    { skip: !isReadyToFetchExams },
  );
  const exams = normalizeArray(examsRes);

  const isReadyToFetch = isReadyToFetchExams && Boolean(examId);
  const {
    data: rosterRes,
    isFetching: isFetchingStudents,
    refetch: refetchRoster,
  } = useGetAttendanceRosterQuery(
    { courseAssignmentId: assignmentId, examId },
    { skip: !isReadyToFetch, refetchOnMountOrArgChange: true },
  );
  const selectedExam = rosterRes?.data?.exam || exams.find((e) => e._id === examId) || null;
  const submission = rosterRes?.data?.submission || null;
  const isEditable = submission ? EDITABLE_STATUSES.includes(submission.status) : false;

  const [saveAttendance, { isLoading: isSaving }] = useSaveAttendanceMutation();
  const [submitForReview, { isLoading: isSubmitting }] =
    useSubmitAttendanceForReviewMutation();

  const terms = normalizeArray(termsRes);
  const departments = normalizeArray(deptsRes);
  const programs = normalizeArray(programsRes);
  const semestersList = normalizeArray(semestersRes);

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

  useEffect(() => {
    setExamId("");
  }, [assignmentId]);

  useEffect(() => {
    const students = rosterRes?.data?.students;
    if (students) {
      const grid = {};
      students.forEach((s) => {
        grid[s.studentId] = s.status;
      });
      setAttendanceGrid(grid);
    } else {
      setAttendanceGrid({});
    }
  }, [rosterRes]);

  const rosterStudents = useMemo(() => {
    const students = rosterRes?.data?.students || [];
    return students.map((s) => ({
      ...s,
      status: attendanceGrid[s.studentId] ?? s.status,
    }));
  }, [rosterRes, attendanceGrid]);

  const availablePrograms = programs.filter(
    (p) =>
      String(p.departmentId?._id || p.departmentId) === String(filters.departmentId),
  );
  const availableSemesters = useMemo(() => {
    let sems = semestersList;
    if (filters.programId) {
      sems = semestersList.filter(
        (s) => String(s.programId?._id || s.programId) === String(filters.programId),
      );
    }
    return [...sems].sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [semestersList, filters.programId]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      const nf = { ...prev, [field]: value };
      if (field === "departmentId") {
        nf.programId = "";
        nf.semesterId = "";
      }
      if (field === "programId") nf.semesterId = "";
      setSearchParams(nf);
      return nf;
    });
    setAssignmentId("");
  };

  const handleAssignmentChange = (value) => setAssignmentId(value);

  const handleStatusChange = (studentId, status) => {
    setAttendanceGrid((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSaveDraft = async () => {
    const records = Object.entries(attendanceGrid).map(([studentId, status]) => ({
      studentId,
      status,
    }));
    if (records.length === 0) {
      return openAlert({ message: "Nothing to save.", severity: "warning" });
    }
    try {
      await saveAttendance({ courseAssignmentId: assignmentId, examId, records }).unwrap();
      openAlert({ message: "Attendance saved.", severity: "success" });
      refetchRoster();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to save attendance.",
        severity: "error",
      });
    }
  };

  const handleSubmitForReview = async () => {
    try {
      await submitForReview({ courseAssignmentId: assignmentId, examId }).unwrap();
      openAlert({ message: "Attendance submitted to HOD for review.", severity: "success" });
      refetchRoster();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to submit attendance.",
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

    assignments,
    isFetchingAssignments,
    assignmentId,
    handleAssignmentChange,
    isReadyToFetchAssignments,

    exams,
    isFetchingExams,
    examId,
    setExamId,
    selectedExam,
    isReadyToFetchExams,

    submission,
    isEditable,
    rosterStudents,
    isFetchingStudents,
    handleStatusChange,
    handleSaveDraft,
    isSaving,
    handleSubmitForReview,
    isSubmitting,
    isReadyToFetch,
  };
};

export default useExamAttendanceController;
