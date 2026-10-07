import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetReEvaluationsQuery,
  useUpdateReEvaluationMutation,
  // Hooks for fetching the class roster
  useGetTermsQuery,
  useGetDepartmentsQuery,
  useLazyGetProgramsQuery,
  useGetSemestersQuery,
  useGetCoursesBySemesterQuery,
  useGetCourseStudentsQuery,
} from "../api/examApi";

const normalizeArray = (res) => res?.data || res || [];

export const useReEvaluationController = () => {
  const { openAlert } = useGlobalAlert();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- TABS STATE ---
  const [currentTab, setCurrentTab] = useState(0);
  const handleTabChange = (event, newValue) => setCurrentTab(newValue);

  // --- RE-EVALUATION DATA ---
  const {
    data: appealsRes,
    isFetching: isFetchingReports,
    refetch,
  } = useGetReEvaluationsQuery();
  const [updateAppeal, { isLoading: isUpdating }] =
    useUpdateReEvaluationMutation();
  // Note: To make creating work fully, add useCreateReEvaluationMutation to your examApi.js!
  // const [createAppeal, { isLoading: isCreating }] = useCreateReEvaluationMutation();

  const appeals = appealsRes?.data || [];

  // --- FILTER STATE FOR ROSTER (TAB 0) ---
  const [filters, setFilters] = useState({
    termId: searchParams.get("termId") || "",
    departmentId: searchParams.get("departmentId") || "",
    programId: searchParams.get("programId") || "",
    semesterId: searchParams.get("semesterId") || "",
    courseId: searchParams.get("courseId") || "",
  });

  // --- MODAL STATE ---
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [targetStudent, setTargetStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const [reviewData, setReviewData] = useState({
    status: "Applied",
    oldMarks: "",
    newMarks: "",
    decisionNote: "",
    feePaymentId: "", // Required by your schema
  });

  // --- CATALOG API HOOKS ---
  const { data: termsRes } = useGetTermsQuery();
  const { data: deptsRes } = useGetDepartmentsQuery();
  const { data: semestersRes } = useGetSemestersQuery();
  const [fetchPrograms, { data: programsRes }] = useLazyGetProgramsQuery();

  const { data: coursesRes, isFetching: isFetchingCourses } =
    useGetCoursesBySemesterQuery(
      {
        termId: filters.termId,
        programId: filters.programId,
        semesterId: filters.semesterId,
      },
      { skip: !filters.semesterId || !filters.programId || !filters.termId },
    );

  const isReadyForStudents = Boolean(
    filters.termId &&
    filters.programId &&
    filters.semesterId &&
    filters.courseId,
  );
  const { data: studentsRes, isFetching: isFetchingStudents } =
    useGetCourseStudentsQuery(filters, { skip: !isReadyForStudents });

  useEffect(() => {
    if (filters.departmentId) fetchPrograms(filters.departmentId);
  }, [filters.departmentId, fetchPrograms]);

  const terms = normalizeArray(termsRes);
  const departments = normalizeArray(deptsRes);
  const programs = normalizeArray(programsRes);
  const semestersList = normalizeArray(semestersRes);
  const courses = normalizeArray(coursesRes);
  const students = normalizeArray(studentsRes); // The class roster

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

  // ✅ Open Modal to ADD NEW APPEAL (from Roster)
  const handleOpenAdd = (student) => {
    setTargetStudent(student);
    setIsAddingNew(true);

    // Calculate their current total marks to set as "oldMarks"
    const currentTotal =
      (Number(student.midMarks) || 0) +
      (Number(student.finalMarks) || 0) +
      (Number(student.sessionalMarks) || 0);

    setReviewData({
      status: "Applied",
      oldMarks: currentTotal,
      newMarks: "",
      decisionNote: "",
      feePaymentId: "", // Wait for admin to input challan/receipt #
    });
    setIsModalOpen(true);
  };

  // ✅ Open Modal to UPDATE EXISTING APPEAL (from History)
  const handleOpenReview = (appeal) => {
    setIsAddingNew(false);
    setSelectedAppeal(appeal);
    setReviewData({
      status: appeal.status,
      oldMarks: appeal.oldMarks,
      newMarks: appeal.newMarks || appeal.oldMarks,
      decisionNote: appeal.decisionNote || "",
      feePaymentId: appeal.feePaymentId || "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTargetStudent(null);
    setSelectedAppeal(null);
  };

  const handleSaveReview = async () => {
    try {
      if (isAddingNew) {
        if (!reviewData.feePaymentId) {
          return openAlert({
            message: "Fee Payment ID is required to log an appeal.",
            severity: "warning",
          });
        }

        // FUTURE STEP: Connect this to useCreateReEvaluationMutation when you add it to examApi!
        // await createAppeal({
        //   studentId: targetStudent.studentId,
        //   resultId: targetStudent.registrationId, // using registrationId as a proxy for resultId
        //   feePaymentId: reviewData.feePaymentId,
        //   oldMarks: reviewData.oldMarks,
        //   status: reviewData.status,
        //   decisionNote: reviewData.decisionNote
        // }).unwrap();

        openAlert({
          message: "New Appeal Logged! (Add create API endpoint to save to DB)",
          severity: "info",
        });
        setCurrentTab(1);
      } else {
        await updateAppeal({
          id: selectedAppeal._id,
          data: reviewData,
        }).unwrap();
        openAlert({
          message: "Appeal updated successfully.",
          severity: "success",
        });
      }
      refetch();
      handleCloseModal();
    } catch (err) {
      openAlert({ message: "Failed to update appeal.", severity: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this appeal record?")) {
      // Future Step: connect delete API
      openAlert({ message: "Delete API not connected yet.", severity: "info" });
    }
  };

  return {
    currentTab,
    handleTabChange,
    appeals,
    isFetchingReports,
    filters,
    handleFilterChange,
    terms,
    departments,
    availablePrograms,
    availableSemesters,
    courses,
    students,
    isFetchingCourses,
    isFetchingStudents,
    isReadyForStudents,
    selectedAppeal,
    targetStudent,
    isModalOpen,
    handleOpenReview,
    handleOpenAdd,
    handleCloseModal,
    reviewData,
    setReviewData,
    handleSaveReview,
    isUpdating,
    isAddingNew,
    handleDelete,
  };
};

export default useReEvaluationController;
