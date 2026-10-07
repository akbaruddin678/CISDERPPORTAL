import { useMemo, useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetSubmissionsForReviewQuery,
  useGetSubmissionRosterQuery,
  useReviewSubmissionMutation,
} from "../api/approveMarksApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

// This is the final stage of the chain (DRAFT -> PENDING_HOD ->
// PENDING_ACADEMIA -> PENDING_VC -> APPROVED) — approving here officially
// declares the result: ExamResult rows flip to "Verified" and it counts
// toward transcripts.
const PENDING_STATUS = "PENDING_VC";

const useApproveMarksController = () => {
  const { openAlert } = useGlobalAlert();

  const {
    data: submissionsRes,
    isFetching,
    refetch,
  } = useGetSubmissionsForReviewQuery();
  const submissions = useMemo(() => extractArray(submissionsRes), [submissionsRes]);

  const [reviewSubmissionMutation, { isLoading: isReviewing }] =
    useReviewSubmissionMutation();

  const [selectedStatus, setSelectedStatus] = useState(PENDING_STATUS);
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [returnRemarks, setReturnRemarks] = useState("");

  const { data: rosterRes, isFetching: isFetchingRoster } =
    useGetSubmissionRosterQuery(selectedSubmissionId, {
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
      returned: submissions.filter((s) => s.status === "RETURNED").length,
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
            s.teacherName?.toLowerCase().includes(term) ||
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
      openAlert({
        message: "Result officially declared.",
        severity: "success",
      });
      closeDetails();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to approve marks.",
        severity: "error",
      });
    }
  };

  const handleConfirmReturn = async () => {
    if (!returnRemarks.trim()) {
      return openAlert({
        message: "Please provide a reason for returning these marks.",
        severity: "warning",
      });
    }
    try {
      await reviewSubmissionMutation({
        id: selectedSubmissionId,
        decision: "RETURNED",
        remarks: returnRemarks,
      }).unwrap();
      openAlert({ message: "Marks returned to the teacher.", severity: "success" });
      closeReturnModal();
      closeDetails();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to return marks.",
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

export default useApproveMarksController;
