import { useMemo, useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetAttendanceSubmissionsForReviewQuery,
  useGetAttendanceSubmissionRosterQuery,
  useReviewAttendanceSubmissionMutation,
} from "../api/approveAttendanceApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

// One-stage sign-off (unlike the 3-stage Marks chain) — approving here is
// final for attendance, no further escalation to Academia/VC.
const PENDING_STATUS = "PENDING_HOD";

const useApproveAttendanceController = () => {
  const { openAlert } = useGlobalAlert();

  const {
    data: submissionsRes,
    isFetching,
    refetch,
  } = useGetAttendanceSubmissionsForReviewQuery();
  const submissions = useMemo(() => extractArray(submissionsRes), [submissionsRes]);

  const [reviewSubmissionMutation, { isLoading: isReviewing }] =
    useReviewAttendanceSubmissionMutation();

  const [selectedStatus, setSelectedStatus] = useState(PENDING_STATUS);
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [returnRemarks, setReturnRemarks] = useState("");

  const { data: rosterRes, isFetching: isFetchingRoster } =
    useGetAttendanceSubmissionRosterQuery(selectedSubmissionId, {
      skip: !selectedSubmissionId,
    });
  const rosterStudents = useMemo(() => rosterRes?.data?.students || [], [rosterRes]);
  const rosterExam = rosterRes?.data?.exam || null;

  const selectedSubmission = useMemo(
    () => submissions.find((s) => s.id === selectedSubmissionId) || null,
    [submissions, selectedSubmissionId],
  );

  const availableSemesters = useMemo(() => {
    const set = new Set(
      submissions
        .map((s) => s.semesterNumber)
        .filter((n) => n !== undefined && n !== null),
    );
    return [...set].sort((a, b) => a - b);
  }, [submissions]);

  const statistics = useMemo(
    () => ({
      total: submissions.length,
      pending: submissions.filter((s) => s.status === PENDING_STATUS).length,
      approved: submissions.filter((s) => s.status === "APPROVED").length,
    }),
    [submissions],
  );

  const filteredSubmissions = useMemo(
    () =>
      submissions.filter((s) => {
        if (selectedStatus !== "all" && s.status !== selectedStatus) {
          return false;
        }
        if (
          selectedSemester !== "all" &&
          String(s.semesterNumber) !== String(selectedSemester)
        ) {
          return false;
        }
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          return (
            s.courseTitle?.toLowerCase().includes(term) ||
            s.courseCode?.toLowerCase().includes(term) ||
            s.exam?.type?.toLowerCase().includes(term)
          );
        }
        return true;
      }),
    [submissions, selectedStatus, selectedSemester, searchTerm],
  );

  const openDetails = (submission) => {
    setSelectedSubmissionId(submission.id);
    setIsDetailsOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
    setSelectedSubmissionId(null);
  };

  const openReturnModal = (submission) => {
    setSelectedSubmissionId(submission.id);
    setReturnRemarks("");
    setIsReturnOpen(true);
  };

  const closeReturnModal = () => {
    setIsReturnOpen(false);
    setReturnRemarks("");
  };

  const handleApprove = async (submission) => {
    try {
      await reviewSubmissionMutation({
        id: submission.id,
        decision: "APPROVED",
      }).unwrap();
      openAlert({ message: "Attendance approved.", severity: "success" });
      closeDetails();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to approve attendance.",
        severity: "error",
      });
    }
  };

  const handleConfirmReturn = async () => {
    if (!returnRemarks.trim()) {
      return openAlert({
        message: "Please provide a reason for returning this submission.",
        severity: "warning",
      });
    }
    try {
      await reviewSubmissionMutation({
        id: selectedSubmissionId,
        decision: "RETURNED",
        remarks: returnRemarks,
      }).unwrap();
      openAlert({
        message: "Attendance returned to Exam-Cell for correction.",
        severity: "success",
      });
      closeReturnModal();
      closeDetails();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to return attendance.",
        severity: "error",
      });
    }
  };

  return {
    submissions: filteredSubmissions,
    totalSubmissions: submissions.length,
    isFetching,
    refetch,
    statistics,
    availableSemesters,

    selectedStatus,
    setSelectedStatus,
    selectedSemester,
    setSelectedSemester,
    searchTerm,
    setSearchTerm,

    selectedSubmission,
    rosterStudents,
    rosterExam,
    isFetchingRoster,
    isDetailsOpen,
    openDetails,
    closeDetails,
    isReturnOpen,
    openReturnModal,
    closeReturnModal,
    returnRemarks,
    setReturnRemarks,

    handleApprove,
    handleConfirmReturn,
    isReviewing,
  };
};

export default useApproveAttendanceController;
