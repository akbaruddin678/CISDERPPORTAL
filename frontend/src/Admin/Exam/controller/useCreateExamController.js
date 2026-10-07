import { useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";

import {
  useGetDepartmentsQuery,
  useGetProgramsByDepartmentQuery,
  useGetSemestersByProgramQuery,
  useGetTermsQuery,
} from "../../../components/catalog/api/catalogApi";
import {
  useGetExamsQuery,
  useSaveExamPlanMutation,
  usePublishExamsMutation,
  useDeleteExamMutation,
  useGetSemestersWithActiveStudentsQuery,
} from "../api/examApi";
import { useGetAssignedCoursesQuery } from "../api/courseAssignmentApi";

const normalizeArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data?.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
};

const EXAM_TYPES = ["Mid Term", "Final Exam", "Sessional"];
// Sessional has no fixed date/time — it's a running mark the teacher enters
// off ongoing class performance, not a scheduled event.
const isDateless = (type) => type === "Sessional";

const calculateEndTime = (startTime, durationInMinutes) => {
  if (!startTime || !durationInMinutes) return "";
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + Number(durationInMinutes);
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMins = totalMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;
};

// Department -> Program -> Session -> Semester -> Subject (course), each
// subject showing 3 exam slots (Mid Term / Final Exam / Sessional). Creating
// an exam is one small form, one button — it's created AND published in the
// same action (no separate Draft/Schedule/Publish steps to click through).
// Sessional never asks for a date.
const useCreateExamController = () => {
  const { openAlert } = useGlobalAlert();

  const [filters, setFilters] = useState({
    departmentId: "",
    programId: "",
    termId: "",
    semesterId: "",
  });

  // --- Bulk Create (whole Semester or whole Program at once) ---
  const [bulkDialog, setBulkDialog] = useState(null);

  const { data: deptsRes, isFetching: isFetchingDepartments } =
    useGetDepartmentsQuery();
  const { data: termsRes } = useGetTermsQuery();
  const { data: programsRes, isFetching: isFetchingPrograms } =
    useGetProgramsByDepartmentQuery(filters.departmentId || skipToken, {
      skip: !filters.departmentId,
    });
  const { data: semestersRes, isFetching: isFetchingSemesters } =
    useGetSemestersByProgramQuery(filters.programId || skipToken, {
      skip: !filters.programId,
    });
  // Semesters with zero currently-active students are shown but disabled —
  // an exam created for a semester nobody is enrolled in would never have
  // anyone to sit it.
  const { data: activeSemestersRes, isFetching: isFetchingActiveSemesters } =
    useGetSemestersWithActiveStudentsQuery(filters.programId || skipToken, {
      skip: !filters.programId,
    });

  const departments = normalizeArray(deptsRes);
  const terms = normalizeArray(termsRes);
  const programs = normalizeArray(programsRes);
  const rawSemesters = normalizeArray(semestersRes);
  const activeStudentCountBySemester = useMemo(() => {
    const map = new Map();
    normalizeArray(activeSemestersRes).forEach((row) => {
      map.set(row.semesterId, row.activeStudentCount);
    });
    return map;
  }, [activeSemestersRes]);
  const semesters = useMemo(
    () =>
      [...rawSemesters]
        .sort((a, b) => (a.number || 0) - (b.number || 0))
        .map((s) => ({
          ...s,
          activeStudentCount: activeStudentCountBySemester.get(s._id) || 0,
        })),
    [rawSemesters, activeStudentCountBySemester],
  );

  const isReady = Boolean(
    filters.departmentId &&
      filters.programId &&
      filters.termId &&
      filters.semesterId,
  );

  const courseQueryArgs = isReady
    ? {
        termId: filters.termId,
        programId: filters.programId,
        semesterId: filters.semesterId,
      }
    : skipToken;
  const { data: assignedCoursesRes, isFetching: isFetchingCourses } =
    useGetAssignedCoursesQuery(courseQueryArgs, { skip: !isReady });

  const examsQueryArgs = isReady
    ? {
        termId: filters.termId,
        programId: filters.programId,
        semesterId: filters.semesterId,
        departmentId: filters.departmentId,
      }
    : skipToken;
  const {
    data: examsRes,
    isFetching: isFetchingExams,
    refetch: refetchExams,
  } = useGetExamsQuery(examsQueryArgs, { skip: !isReady });

  // Whole-program candidates for Bulk Create — only fetched while that
  // dialog is actually open in "program" scope. No semesterId means every
  // semester's assignments/exams come back (same optional-semesterId
  // pattern already used for HOD Course Allocation's whole-session views).
  const bulkScopeIsProgram = bulkDialog?.scope === "program";
  const programCourseQueryArgs =
    bulkScopeIsProgram && filters.termId && filters.programId
      ? { termId: filters.termId, programId: filters.programId }
      : skipToken;
  const { data: programCoursesRes, isFetching: isFetchingProgramCourses } =
    useGetAssignedCoursesQuery(programCourseQueryArgs, {
      skip: !bulkScopeIsProgram,
    });
  const programExamsQueryArgs =
    bulkScopeIsProgram && filters.termId && filters.programId && filters.departmentId
      ? {
          termId: filters.termId,
          programId: filters.programId,
          departmentId: filters.departmentId,
        }
      : skipToken;
  const { data: programExamsRes, isFetching: isFetchingProgramExams } =
    useGetExamsQuery(programExamsQueryArgs, { skip: !bulkScopeIsProgram });

  const [saveExamPlanMutation, { isLoading: isSaving }] =
    useSaveExamPlanMutation();
  const [publishExamsMutation, { isLoading: isPublishing }] =
    usePublishExamsMutation();
  const [deleteExamMutation, { isLoading: isDeleting }] =
    useDeleteExamMutation();

  const rawAssignedCourses = normalizeArray(assignedCoursesRes);
  const existingExams = normalizeArray(examsRes);

  // One card per distinct course actually offered in this exact
  // Department/Program/Session/Semester, each carrying its 3 exam slots.
  const subjects = useMemo(() => {
    const byId = new Map();
    rawAssignedCourses.forEach((ac) => {
      const courseId = String(ac.courseId?._id || ac.courseId);
      if (byId.has(courseId)) return;
      byId.set(courseId, {
        courseId,
        code: ac.courseId?.code || "N/A",
        title: ac.courseId?.title || "Unknown Course",
        examsByType: Object.fromEntries(EXAM_TYPES.map((t) => [t, null])),
      });
    });
    existingExams.forEach((exam) => {
      const courseId = String(exam.courseId?._id || exam.courseId);
      const subject = byId.get(courseId);
      if (subject && EXAM_TYPES.includes(exam.type)) {
        subject.examsByType[exam.type] = exam;
      }
    });
    return [...byId.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [rawAssignedCourses, existingExams]);

  // Whole-program candidates for Bulk Create — one row per (course,
  // semester) pair, since the same course can be offered in more than one
  // semester of a program. Semesters with zero active students are dropped
  // here so a whole-program batch can never trip the backend's per-
  // semester "no active students" hard guard.
  const programCandidates = useMemo(() => {
    const bySemesterCourse = new Map();
    normalizeArray(programCoursesRes).forEach((ac) => {
      const courseId = String(ac.courseId?._id || ac.courseId);
      const semesterId = String(ac.semesterId?._id || ac.semesterId);
      const key = `${courseId}_${semesterId}`;
      if (bySemesterCourse.has(key)) return;
      const semester = semesters.find((s) => s._id === semesterId);
      if (!semester || semester.activeStudentCount === 0) return;
      bySemesterCourse.set(key, {
        courseId,
        semesterId,
        semesterNumber: semester.number,
        code: ac.courseId?.code || "N/A",
        title: ac.courseId?.title || "Unknown Course",
        examsByType: Object.fromEntries(EXAM_TYPES.map((t) => [t, null])),
      });
    });
    normalizeArray(programExamsRes).forEach((exam) => {
      const courseId = String(exam.courseId?._id || exam.courseId);
      const semesterId = String(exam.semesterId?._id || exam.semesterId);
      const row = bySemesterCourse.get(`${courseId}_${semesterId}`);
      if (row && EXAM_TYPES.includes(exam.type)) {
        row.examsByType[exam.type] = exam;
      }
    });
    return [...bySemesterCourse.values()].sort(
      (a, b) =>
        (a.semesterNumber || 0) - (b.semesterNumber || 0) ||
        a.title.localeCompare(b.title),
    );
  }, [programCoursesRes, programExamsRes, semesters]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "departmentId") {
        next.programId = "";
        next.semesterId = "";
      }
      if (field === "programId") next.semesterId = "";
      return next;
    });
  };

  // --- Create / Edit exam modal (one exam at a time) ---
  const [examModal, setExamModal] = useState(null);

  const handleOpenExamModal = (subject, type) => {
    const existing = subject.examsByType[type];
    setExamModal({
      subject,
      type,
      examId: existing?._id || null,
      totalMarks: existing?.totalMarks ?? "",
      date: existing?.date ? new Date(existing.date).toISOString().slice(0, 10) : "",
      startTime: existing?.startTime || "09:00",
      duration: existing?.duration || 60,
    });
  };

  const handleCloseExamModal = () => setExamModal(null);

  const handleExamModalChange = (field, value) => {
    setExamModal((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSaveExam = async () => {
    if (!examModal) return;
    const { subject, type, totalMarks, date, startTime, duration } = examModal;

    // Hard rule, not just a disabled chip in the UI — even if the semester
    // filter was somehow set to one with no active students (stale state,
    // a direct call, etc.), refuse to actually create the exam.
    const selectedSemester = semesters.find((s) => s._id === filters.semesterId);
    if (!selectedSemester || selectedSemester.activeStudentCount === 0) {
      return openAlert({
        message: "This semester has no active students — an exam can't be created for it.",
        severity: "warning",
      });
    }

    if (!totalMarks || Number(totalMarks) <= 0) {
      return openAlert({ message: "Enter the total marks.", severity: "warning" });
    }
    if (!isDateless(type) && !date) {
      return openAlert({ message: "Pick a date for this exam.", severity: "warning" });
    }

    const durationNum = isDateless(type) ? 0 : Number(duration) || 60;
    const entry = {
      courseId: subject.courseId,
      termId: filters.termId,
      programId: filters.programId,
      semesterId: filters.semesterId,
      departmentId: filters.departmentId,
      type,
      title: `${subject.title} - ${type}`,
      totalMarks: Number(totalMarks),
      weightage: 0,
      date: isDateless(type) ? null : date,
      startTime: isDateless(type) ? "" : startTime,
      endTime: isDateless(type) ? "" : calculateEndTime(startTime, durationNum),
      duration: durationNum,
    };

    try {
      const saveResult = await saveExamPlanMutation({
        exams: [entry],
        targetStatus: "SCHEDULED",
      }).unwrap();
      const savedExam = saveResult?.data?.[0];
      if (savedExam?._id) {
        await publishExamsMutation({ examIds: [savedExam._id] }).unwrap();
      }
      openAlert({
        message: `${type} exam ${examModal.examId ? "updated" : "created"} for ${subject.code}.`,
        severity: "success",
      });
      setExamModal(null);
      refetchExams();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to save exam.",
        severity: "error",
      });
    }
  };

  const handleDeleteExam = async (exam) => {
    if (!exam?._id) return;
    if (exam.publishStatus === "PUBLISHED") {
      return openAlert({
        message: "Published exams can't be deleted.",
        severity: "warning",
      });
    }
    if (!window.confirm(`Remove this ${exam.type} exam?`)) return;
    try {
      await deleteExamMutation(exam._id).unwrap();
      openAlert({ message: "Exam removed.", severity: "success" });
      refetchExams();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to remove exam.",
        severity: "error",
      });
    }
  };

  // --- Bulk Create (whole Semester or whole Program at once) ---
  const handleOpenBulkCreate = (scope) => {
    if (scope === "semester" && !filters.semesterId) {
      return openAlert({ message: "Select a Semester first.", severity: "warning" });
    }
    if (scope === "program" && (!filters.programId || !filters.termId)) {
      return openAlert({
        message: "Select a Program and Session first.",
        severity: "warning",
      });
    }
    setBulkDialog({
      scope,
      type: "Mid Term",
      totalMarks: "",
      startDate: "",
      startTime: "09:00",
      duration: 60,
      rows: [],
    });
  };

  const handleCloseBulkDialog = () => setBulkDialog(null);

  // Changing any setup field invalidates whatever schedule was already
  // generated — it needs a fresh "Generate Schedule" click rather than
  // silently showing a stale preview.
  const handleBulkDialogChange = (field, value) => {
    setBulkDialog((prev) => (prev ? { ...prev, [field]: value, rows: [] } : prev));
  };

  const handleGenerateBulkSchedule = () => {
    if (!bulkDialog) return;
    const { scope, type, totalMarks, startDate, startTime, duration } = bulkDialog;

    if (!totalMarks || Number(totalMarks) <= 0) {
      return openAlert({ message: "Enter the total marks.", severity: "warning" });
    }
    if (!isDateless(type) && !startDate) {
      return openAlert({ message: "Pick a start date.", severity: "warning" });
    }

    const selectedSemester = semesters.find((s) => s._id === filters.semesterId);
    const candidates =
      scope === "program"
        ? programCandidates
        : subjects.map((s) => ({
            ...s,
            semesterId: filters.semesterId,
            semesterNumber: selectedSemester?.number,
          }));
    const eligible = candidates.filter((c) => !c.examsByType[type]);

    if (eligible.length === 0) {
      return openAlert({
        message: `Every course already has a ${type} exam configured.`,
        severity: "info",
      });
    }

    let rows;
    if (isDateless(type)) {
      rows = eligible.map((c) => ({
        courseId: c.courseId,
        semesterId: c.semesterId,
        semesterNumber: c.semesterNumber,
        code: c.code,
        title: c.title,
        totalMarks: Number(totalMarks),
        date: "",
        startTime: "",
        duration: 0,
      }));
    } else {
      const cursor = new Date(startDate);
      const durationNum = Number(duration) || 60;
      rows = eligible.map((c) => {
        while (cursor.getDay() === 0 || cursor.getDay() === 6) {
          cursor.setDate(cursor.getDate() + 1);
        }
        const row = {
          courseId: c.courseId,
          semesterId: c.semesterId,
          semesterNumber: c.semesterNumber,
          code: c.code,
          title: c.title,
          totalMarks: Number(totalMarks),
          date: cursor.toISOString().slice(0, 10),
          startTime,
          duration: durationNum,
        };
        cursor.setDate(cursor.getDate() + 1);
        return row;
      });
    }

    setBulkDialog((prev) => ({ ...prev, rows }));
  };

  const handleUpdateBulkRow = (index, field, value) => {
    setBulkDialog((prev) => {
      if (!prev) return prev;
      const rows = [...prev.rows];
      rows[index] = { ...rows[index], [field]: value };
      return { ...prev, rows };
    });
  };

  const handleRemoveBulkRow = (index) => {
    setBulkDialog((prev) =>
      prev ? { ...prev, rows: prev.rows.filter((_, i) => i !== index) } : prev,
    );
  };

  const handleSubmitBulkCreate = async () => {
    if (!bulkDialog || bulkDialog.rows.length === 0) return;
    const { type, rows } = bulkDialog;

    const exams = rows.map((row) => ({
      courseId: row.courseId,
      termId: filters.termId,
      programId: filters.programId,
      semesterId: row.semesterId,
      departmentId: filters.departmentId,
      type,
      title: `${row.title} - ${type}`,
      totalMarks: Number(row.totalMarks),
      weightage: 0,
      date: isDateless(type) ? null : row.date,
      startTime: isDateless(type) ? "" : row.startTime,
      endTime: isDateless(type)
        ? ""
        : calculateEndTime(row.startTime, Number(row.duration) || 60),
      duration: isDateless(type) ? 0 : Number(row.duration) || 60,
    }));

    try {
      const saveResult = await saveExamPlanMutation({
        exams,
        targetStatus: "SCHEDULED",
      }).unwrap();
      const savedIds = (saveResult?.data || []).map((e) => e._id).filter(Boolean);
      if (savedIds.length > 0) {
        await publishExamsMutation({ examIds: savedIds }).unwrap();
      }
      const failedCount = saveResult?.failedCount || 0;
      openAlert({
        message:
          failedCount > 0
            ? `${savedIds.length} exam(s) created. ${failedCount} failed: ${(saveResult.errors || []).join("; ")}`
            : `${savedIds.length} exam(s) created and published.`,
        severity: failedCount > 0 ? "warning" : "success",
      });
      setBulkDialog(null);
      refetchExams();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to create exams.",
        severity: "error",
      });
    }
  };

  return {
    filters,
    handleFilterChange,
    departments,
    programs,
    terms,
    semesters,
    isFetchingDepartments,
    isFetchingPrograms,
    isFetchingSemesters: isFetchingSemesters || isFetchingActiveSemesters,
    isReady,

    subjects,
    isFetchingSubjects: isFetchingCourses || isFetchingExams,

    examTypes: EXAM_TYPES,
    isDateless,

    examModal,
    handleOpenExamModal,
    handleCloseExamModal,
    handleExamModalChange,
    handleSaveExam,
    handleDeleteExam,
    isSavingExam: isSaving || isPublishing,
    isDeletingExam: isDeleting,

    bulkDialog,
    handleOpenBulkCreate,
    handleCloseBulkDialog,
    handleBulkDialogChange,
    handleGenerateBulkSchedule,
    handleUpdateBulkRow,
    handleRemoveBulkRow,
    handleSubmitBulkCreate,
    isFetchingBulkCandidates: isFetchingProgramCourses || isFetchingProgramExams,
    isSubmittingBulk: isSaving || isPublishing,
  };
};

export default useCreateExamController;
