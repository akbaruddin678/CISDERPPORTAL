import { useState, useEffect, useMemo } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetUfmReportsQuery,
  useUpdateUfmReportMutation,
  useCreateUfmReportManualMutation,
  useDeleteUfmReportMutation,
  useGetTermsQuery,
  useGetDepartmentsQuery,
  useLazyGetProgramsQuery,
  useGetSemestersQuery,
  useGetCoursesBySemesterQuery,
  useGetCourseStudentsQuery,
} from "../api/examApi";

const normalizeArray = (res) => res?.data || res || [];

export const useUFMController = () => {
  const { openAlert } = useGlobalAlert();

  // --- TABS STATE ---
  const [currentTab, setCurrentTab] = useState(0);
  const handleTabChange = (event, newValue) => setCurrentTab(newValue);

  // --- UFM DATA & MUTATIONS ---
  const {
    data: reportsRes,
    isFetching: isFetchingReports,
    refetch,
  } = useGetUfmReportsQuery();
  const [updateUfm, { isLoading: isUpdating }] = useUpdateUfmReportMutation();
  const [createUfm, { isLoading: isCreating }] =
    useCreateUfmReportManualMutation();
  const [deleteUfm] = useDeleteUfmReportMutation();

  const reports = reportsRes?.data || [];

  // --- FILTER STATE FOR ROSTER (TAB 0) ---
  const [filters, setFilters] = useState({
    termId: "",
    departmentId: "",
    programId: "",
    semesterId: "",
    courseId: "",
  });

  // --- MODAL STATE ---
  const [selectedReport, setSelectedReport] = useState(null); // For Updating
  const [targetStudent, setTargetStudent] = useState(null); // For Creating
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [decisionData, setDecisionData] = useState({
    status: "Reported",
    committeeDecision: "",
    violationType: "",
    statement: "",
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
  const students = normalizeArray(studentsRes); // Student Roster!

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
      return nf;
    });
  };

  // ✅ Open Modal to ADD NEW CASE from the Roster
  const handleOpenAdd = (student) => {
    setTargetStudent(student);
    setIsAddingNew(true);
    setDecisionData({
      status: "Reported",
      committeeDecision: "",
      violationType: "",
      statement: "",
    });
    setIsModalOpen(true);
  };

  // ✅ Open Modal to UPDATE EXISTING CASE
  const handleOpenReview = (report) => {
    setIsAddingNew(false);
    setSelectedReport(report);
    setDecisionData({
      status: report.status,
      committeeDecision: report.committeeDecision || "",
      violationType: report.violationType,
      statement: report.statement,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTargetStudent(null);
    setSelectedReport(null);
  };

  const handleSaveDecision = async () => {
    try {
      if (isAddingNew) {
        if (!decisionData.violationType || !decisionData.statement) {
          return openAlert({
            message: "Violation Type and Statement are required.",
            severity: "error",
          });
        }
        await createUfm({
          studentId: targetStudent.studentId,
          courseId: filters.courseId,
          termId: filters.termId,
          violationType: decisionData.violationType,
          statement: decisionData.statement,
          status: decisionData.status,
          committeeDecision: decisionData.committeeDecision,
          reportedBy: "60d5ecb8b343d93412345678", // Replace with real Auth User ID when connected
        }).unwrap();
        openAlert({
          message: "New UFM Case logged successfully!",
          severity: "success",
        });
        setCurrentTab(1); // Jump to the history tab after creating
      } else {
        await updateUfm({
          id: selectedReport._id,
          data: decisionData,
        }).unwrap();
        openAlert({
          message: "Decision updated successfully.",
          severity: "success",
        });
      }
      refetch();
      handleCloseModal();
    } catch (err) {
      openAlert({ message: "Failed to save the report.", severity: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteUfm(id).unwrap();
        openAlert({ message: "Deleted successfully.", severity: "success" });
        refetch();
      } catch (error) {
        openAlert({ message: "Failed to delete.", severity: "error" });
      }
    }
  };

  return {
    currentTab,
    handleTabChange,
    reports,
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
    selectedReport,
    targetStudent,
    isModalOpen,
    handleOpenReview,
    handleOpenAdd,
    handleCloseModal,
    decisionData,
    setDecisionData,
    handleSaveDecision,
    isUpdating,
    isCreating,
    isAddingNew,
    handleDelete,
  };
};

export default useUFMController;
