import { useMemo, useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetReEvaluationsQuery,
  useReviewReEvaluationMutation,
} from "../api/approveRecheckingApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

const useApproveRecheckingController = () => {
  const { openAlert } = useGlobalAlert();

  const { data: appealsRes, isFetching, refetch } = useGetReEvaluationsQuery();
  const appeals = useMemo(() => extractArray(appealsRes), [appealsRes]);

  const [reviewAppeal, { isLoading: isReviewing }] = useReviewReEvaluationMutation();

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedAppealId, setSelectedAppealId] = useState(null);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [decisionStatus, setDecisionStatus] = useState("Under Review");
  const [newMarksInput, setNewMarksInput] = useState("");
  const [decisionNote, setDecisionNote] = useState("");

  const selectedAppeal = useMemo(
    () => appeals.find((a) => a._id === selectedAppealId) || null,
    [appeals, selectedAppealId],
  );

  const statistics = useMemo(
    () => ({
      total: appeals.length,
      applied: appeals.filter((a) => a.status === "Applied").length,
      underReview: appeals.filter((a) => a.status === "Under Review").length,
      resolved: appeals.filter((a) => ["Changed", "Unchanged"].includes(a.status)).length,
    }),
    [appeals],
  );

  const filteredAppeals = useMemo(
    () =>
      appeals.filter((a) => {
        if (selectedStatus !== "all" && a.status !== selectedStatus) return false;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          return (
            a.studentId?.personalInfo?.fullName?.toLowerCase().includes(term) ||
            a.resultId?.examId?.courseId?.title?.toLowerCase().includes(term) ||
            a.resultId?.examId?.courseId?.code?.toLowerCase().includes(term)
          );
        }
        return true;
      }),
    [appeals, selectedStatus, searchTerm],
  );

  const openDecisionModal = (appeal) => {
    setSelectedAppealId(appeal._id);
    setDecisionStatus(appeal.status === "Applied" ? "Under Review" : appeal.status);
    setNewMarksInput(appeal.newMarks ?? "");
    setDecisionNote(appeal.decisionNote || "");
    setIsDecisionOpen(true);
  };

  const closeDecisionModal = () => {
    setIsDecisionOpen(false);
    setSelectedAppealId(null);
    setNewMarksInput("");
    setDecisionNote("");
  };

  const handleConfirmDecision = async () => {
    if (decisionStatus === "Changed" && newMarksInput === "") {
      return openAlert({
        message: "Enter the revised marks before marking this Changed.",
        severity: "warning",
      });
    }
    try {
      await reviewAppeal({
        id: selectedAppealId,
        newMarks: newMarksInput === "" ? undefined : Number(newMarksInput),
        decisionNote,
        status: decisionStatus,
      }).unwrap();
      openAlert({ message: "Re-evaluation decision recorded.", severity: "success" });
      closeDecisionModal();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to record decision.",
        severity: "error",
      });
    }
  };

  return {
    appeals: filteredAppeals,
    totalAppeals: appeals.length,
    isFetching,
    refetch,
    statistics,

    selectedStatus,
    setSelectedStatus,
    searchTerm,
    setSearchTerm,

    selectedAppeal,
    isDecisionOpen,
    openDecisionModal,
    closeDecisionModal,
    decisionStatus,
    setDecisionStatus,
    newMarksInput,
    setNewMarksInput,
    decisionNote,
    setDecisionNote,
    handleConfirmDecision,
    isReviewing,
  };
};

export default useApproveRecheckingController;
