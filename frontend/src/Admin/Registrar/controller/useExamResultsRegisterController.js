import { useMemo, useState } from "react";
import {
  useGetSubmissionsForRegisterQuery,
  useGetSubmissionRosterForRegisterQuery,
} from "../api/examResultsRegisterApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

// Read-only register — defaults to showing only officially declared
// (VC-approved) results, though the underlying list includes every
// non-draft submission so earlier stages can be inspected too.
const DEFAULT_STATUS = "APPROVED";

const useExamResultsRegisterController = () => {
  const {
    data: submissionsRes,
    isFetching,
    refetch,
  } = useGetSubmissionsForRegisterQuery();
  const submissions = useMemo(() => extractArray(submissionsRes), [submissionsRes]);

  const [selectedStatus, setSelectedStatus] = useState(DEFAULT_STATUS);
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: rosterRes, isFetching: isFetchingRoster } =
    useGetSubmissionRosterForRegisterQuery(selectedSubmissionId, {
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
      declared: submissions.filter((s) => s.status === "APPROVED").length,
      inProgress: submissions.filter((s) =>
        ["PENDING_HOD", "PENDING_ACADEMIA", "PENDING_VC"].includes(s.status),
      ).length,
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
  };
};

export default useExamResultsRegisterController;
