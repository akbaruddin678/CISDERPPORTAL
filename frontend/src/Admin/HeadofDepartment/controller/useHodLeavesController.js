import { useMemo, useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetAllLeaveRequestsForHodQuery,
  useReviewLeaveRequestAsHodMutation,
} from "../api/hodLeaveApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

const ACTIONABLE_STATUS = "Pending";

const useHodLeavesController = () => {
  const { openAlert } = useGlobalAlert();

  const { data: requestsRes, isFetching, refetch } = useGetAllLeaveRequestsForHodQuery();
  const requests = useMemo(() => extractArray(requestsRes), [requestsRes]);

  const [reviewRequest, { isLoading: isReviewing }] = useReviewLeaveRequestAsHodMutation();

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [decisionRemarks, setDecisionRemarks] = useState("");

  const selectedRequest = useMemo(
    () => requests.find((r) => r._id === selectedRequestId) || null,
    [requests, selectedRequestId],
  );

  const statistics = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((r) => r.status === ACTIONABLE_STATUS).length,
      forwardedToHr: requests.filter((r) => r.status === "Approved_HOD").length,
      approved: requests.filter((r) => r.status === "Approved_HR").length,
      rejected: requests.filter((r) => r.status === "Rejected").length,
    }),
    [requests],
  );

  const filteredRequests = useMemo(
    () =>
      requests.filter((r) => {
        if (selectedStatus !== "all" && r.status !== selectedStatus) return false;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          return (
            r.staffId?.personalInfo?.name?.toLowerCase().includes(term) ||
            r.staffId?.employeeId?.toLowerCase().includes(term) ||
            r.leaveType?.toLowerCase().includes(term)
          );
        }
        return true;
      }),
    [requests, selectedStatus, searchTerm],
  );

  const openDecisionModal = (request) => {
    setSelectedRequestId(request._id);
    setDecisionRemarks("");
    setIsDecisionOpen(true);
  };
  const closeDecisionModal = () => {
    setIsDecisionOpen(false);
    setSelectedRequestId(null);
  };

  const handleApprove = async (request) => {
    try {
      await reviewRequest({ id: request._id, decision: "Approved_HOD" }).unwrap();
      openAlert({ message: "Leave request approved and forwarded to HR.", severity: "success" });
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to approve request.",
        severity: "error",
      });
    }
  };

  const handleConfirmReject = async () => {
    if (!decisionRemarks.trim()) {
      return openAlert({ message: "Please provide a reason for rejecting.", severity: "warning" });
    }
    try {
      await reviewRequest({
        id: selectedRequestId,
        decision: "Rejected",
        remarks: decisionRemarks,
      }).unwrap();
      openAlert({ message: "Leave request rejected.", severity: "success" });
      closeDecisionModal();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to reject request.",
        severity: "error",
      });
    }
  };

  return {
    requests: filteredRequests,
    totalRequests: requests.length,
    isFetching,
    refetch,
    statistics,

    selectedStatus,
    setSelectedStatus,
    searchTerm,
    setSearchTerm,

    selectedRequest,
    isDecisionOpen,
    openDecisionModal,
    closeDecisionModal,
    decisionRemarks,
    setDecisionRemarks,

    handleApprove,
    handleConfirmReject,
    isReviewing,
  };
};

export default useHodLeavesController;
