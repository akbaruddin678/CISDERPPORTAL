import { useEffect, useMemo, useState } from "react";
import { useGlobalAlert } from "../../../../shared/Alert/context/AlertContext";
import {
  useGetScheduledExamsQuery,
  useGetExamRosterQuery,
  useSaveExamMarksMutation,
  useMarkExamCompleteMutation,
  usePublishExamMarksMutation,
  useRequestGradeCorrectionMutation,
} from "../api/teacherMarksApi";

const EDITABLE_STATUSES = ["DRAFT", "RETURNED"];

const useTeacherMarksController = ({ courseAssignmentId }) => {
  const { openAlert } = useGlobalAlert();

  const [selectedExamId, setSelectedExamId] = useState(null);
  // Local, unsaved edits keyed by studentId — merged over the server roster
  // so typing doesn't need a round-trip per keystroke.
  const [edits, setEdits] = useState({});

  const { data: examsRes, isFetching: isFetchingExams } =
    useGetScheduledExamsQuery(courseAssignmentId, { skip: !courseAssignmentId });
  const scheduledExams = useMemo(() => examsRes?.data || [], [examsRes]);

  const { data: rosterRes, isFetching: isFetchingRoster } = useGetExamRosterQuery(
    { courseAssignmentId, examId: selectedExamId },
    { skip: !courseAssignmentId || !selectedExamId },
  );
  const exam = rosterRes?.data?.exam || null;
  const submission = rosterRes?.data?.submission || null;
  const roster = useMemo(() => rosterRes?.data?.students || [], [rosterRes]);
  const isEditable = submission ? EDITABLE_STATUSES.includes(submission.status) : false;

  const [saveExamMarksMutation, { isLoading: isSaving }] =
    useSaveExamMarksMutation();
  const [markCompleteMutation, { isLoading: isCompleting }] =
    useMarkExamCompleteMutation();
  const [publishMutation, { isLoading: isPublishing }] =
    usePublishExamMarksMutation();
  const [requestCorrectionMutation, { isLoading: isRequestingCorrection }] =
    useRequestGradeCorrectionMutation();

  const students = useMemo(
    () => roster.map((s) => ({ ...s, ...edits[s.studentId] })),
    [roster, edits],
  );

  useEffect(() => {
    setSelectedExamId(null);
    setEdits({});
  }, [courseAssignmentId]);

  const selectExam = (examId) => {
    setSelectedExamId(examId);
    setEdits({});
  };

  const closeExamRoster = () => {
    setSelectedExamId(null);
    setEdits({});
  };

  // Clamps to [0, exam.totalMarks] — a teacher can never save a mark above
  // this exam's own total, whichever type it is (Sessional/Mid/Final all
  // carry their own totalMarks, so the cap is always specific to the exam
  // currently open). `wasClamped` flags the row so the view can show why the
  // value changed instead of silently rewriting what they typed.
  const handleMarkChange = (studentId, value) => {
    if (value === "") {
      setEdits((prev) => ({
        ...prev,
        [studentId]: { ...prev[studentId], obtainedMarks: null, wasClamped: false },
      }));
      return;
    }
    const raw = Number(value);
    if (Number.isNaN(raw)) return;
    const max = exam?.totalMarks ?? Infinity;
    const overMax = raw > max;
    const clamped = Math.min(Math.max(raw, 0), max);
    setEdits((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], obtainedMarks: clamped, wasClamped: overMax },
    }));
  };

  const handleToggleAbsent = (studentId) => {
    setEdits((prev) => {
      const current = students.find((s) => s.studentId === studentId);
      const nextAbsent = !(prev[studentId]?.isAbsent ?? current?.isAbsent);
      return {
        ...prev,
        [studentId]: { ...prev[studentId], isAbsent: nextAbsent },
      };
    });
  };

  const handleMarkComplete = async (examId) => {
    try {
      await markCompleteMutation({ courseAssignmentId, examId }).unwrap();
      selectExam(examId);
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to mark exam complete.",
        severity: "error",
      });
    }
  };

  const handlePublish = async () => {
    try {
      const result = await publishMutation({
        courseAssignmentId,
        examId: selectedExamId,
      }).unwrap();
      openAlert({
        message: result?.message || "Marks published to HOD for review.",
        severity: "success",
      });
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to publish marks.",
        severity: "error",
      });
    }
  };

  const hasUnsavedChanges = Object.keys(edits).length > 0;

  const handleSaveMarks = async () => {
    const records = Object.entries(edits).map(([studentId, fields]) => ({
      studentId,
      obtainedMarks: fields.obtainedMarks ?? 0,
      isAbsent: Boolean(fields.isAbsent),
    }));

    if (records.length === 0) {
      return openAlert({ message: "No changes to save.", severity: "warning" });
    }

    try {
      const result = await saveExamMarksMutation({
        courseAssignmentId,
        examId: selectedExamId,
        records,
      }).unwrap();
      openAlert({
        message: result?.message || "Marks saved successfully.",
        severity: "success",
      });
      setEdits({});
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to save marks.",
        severity: "error",
      });
    }
  };

  const handleRequestCorrection = async (student) => {
    const proposedMarks = window.prompt(
      `Corrected marks for ${student.name} (current: ${student.obtainedMarks}/${exam?.totalMarks})`,
      String(student.obtainedMarks ?? ""),
    );
    if (proposedMarks === null) return;
    const reason = window.prompt("Explain the calculation error (minimum 10 characters):", "");
    if (reason === null) return;
    try {
      const result = await requestCorrectionMutation({
        examResultId: student.resultId,
        courseAssignmentId,
        proposedMarks: Number(proposedMarks),
        reason,
      }).unwrap();
      openAlert({ message: result.message, severity: "success" });
    } catch (error) {
      openAlert({ message: error.data?.message || "Failed to submit correction request.", severity: "error" });
    }
  };

  return {
    scheduledExams,
    isFetchingExams,

    selectedExamId,
    selectExam,
    closeExamRoster,

    exam,
    submission,
    isEditable,
    students,
    isFetchingRoster,
    handleMarkChange,
    handleToggleAbsent,
    hasUnsavedChanges,
    handleSaveMarks,
    isSaving,

    handleMarkComplete,
    isCompleting,
    handlePublish,
    isPublishing,
    handleRequestCorrection,
    isRequestingCorrection,
  };
};

export default useTeacherMarksController;
