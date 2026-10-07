import { useMemo, useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { useGetUFMReportsQuery, useReviewUFMReportMutation } from "../api/approveUFMApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

const useApproveUFMController = () => {
  const { openAlert } = useGlobalAlert();

  const { data: reportsRes, isFetching, refetch } = useGetUFMReportsQuery();
  const reports = useMemo(() => extractArray(reportsRes), [reportsRes]);

  const [reviewReport, { isLoading: isReviewing }] = useReviewUFMReportMutation();

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [decisionText, setDecisionText] = useState("");
  const [decisionStatus, setDecisionStatus] = useState("Under Review");

  const selectedReport = useMemo(
    () => reports.find((r) => r._id === selectedReportId) || null,
    [reports, selectedReportId],
  );

  const statistics = useMemo(
    () => ({
      total: reports.length,
      reported: reports.filter((r) => r.status === "Reported").length,
      underReview: reports.filter((r) => r.status === "Under Review").length,
      resolved: reports.filter((r) => r.status === "Resolved").length,
    }),
    [reports],
  );

  const filteredReports = useMemo(
    () =>
      reports.filter((r) => {
        if (selectedStatus !== "all" && r.status !== selectedStatus) return false;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          return (
            r.violationType?.toLowerCase().includes(term) ||
            r.studentId?.personalInfo?.fullName?.toLowerCase().includes(term) ||
            r.examId?.courseId?.title?.toLowerCase().includes(term) ||
            r.examId?.courseId?.code?.toLowerCase().includes(term)
          );
        }
        return true;
      }),
    [reports, selectedStatus, searchTerm],
  );

  const openDecisionModal = (report) => {
    setSelectedReportId(report._id);
    setDecisionText(report.committeeDecision || "");
    setDecisionStatus(report.status === "Reported" ? "Under Review" : report.status);
    setIsDecisionOpen(true);
  };

  const closeDecisionModal = () => {
    setIsDecisionOpen(false);
    setSelectedReportId(null);
    setDecisionText("");
  };

  const handleConfirmDecision = async () => {
    if (!decisionText.trim()) {
      return openAlert({
        message: "Please record the committee's decision.",
        severity: "warning",
      });
    }
    try {
      await reviewReport({
        id: selectedReportId,
        committeeDecision: decisionText,
        status: decisionStatus,
      }).unwrap();
      openAlert({ message: "UFM decision recorded.", severity: "success" });
      closeDecisionModal();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to record decision.",
        severity: "error",
      });
    }
  };

  return {
    reports: filteredReports,
    totalReports: reports.length,
    isFetching,
    refetch,
    statistics,

    selectedStatus,
    setSelectedStatus,
    searchTerm,
    setSearchTerm,

    selectedReport,
    isDecisionOpen,
    openDecisionModal,
    closeDecisionModal,
    decisionText,
    setDecisionText,
    decisionStatus,
    setDecisionStatus,
    handleConfirmDecision,
    isReviewing,
  };
};

export default useApproveUFMController;
