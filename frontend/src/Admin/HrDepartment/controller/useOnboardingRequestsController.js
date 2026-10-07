import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetOnboardingRequestsQuery,
  useRejectOnboardingRequestMutation,
} from "../api/HrApi";

// Drives the HR-side review of applications submitted through the public,
// no-login /teacher-onboarding page. Approve doesn't call a backend
// endpoint of its own — it navigates straight into the real onboarding
// wizard (useHrOnboardController.js) with the request's data pre-filled,
// reusing that wizard's existing prefill mechanism and its already-working
// createStaff flow instead of duplicating account-creation logic here.
export const useOnboardingRequestsController = () => {
  const { openAlert } = useGlobalAlert();
  const navigate = useNavigate();
  const [statusTab, setStatusTab] = useState("pending");

  const { data, isFetching, refetch } = useGetOnboardingRequestsQuery(statusTab);
  const requests = data?.data || [];

  const [rejectOnboardingRequest, { isLoading: isRejecting }] = useRejectOnboardingRequestMutation();

  const handleApprove = (request) => {
    navigate("/hr/onboard", {
      state: {
        prefillFromApplication: request,
        sourceOnboardingRequestId: request._id,
      },
    });
  };

  const [viewTarget, setViewTarget] = useState(null);
  const openViewModal = (request) => setViewTarget(request);
  const closeViewModal = () => setViewTarget(null);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const openRejectModal = (request) => {
    setRejectTarget(request);
    setRejectReason("");
  };
  const closeRejectModal = () => {
    setRejectTarget(null);
    setRejectReason("");
  };
  const confirmReject = async () => {
    try {
      await rejectOnboardingRequest({ id: rejectTarget._id, reason: rejectReason.trim() }).unwrap();
      openAlert({ message: "Application rejected.", severity: "success" });
      closeRejectModal();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to reject application.",
        severity: "error",
      });
    }
  };

  return {
    statusTab,
    setStatusTab,
    requests,
    isLoading: isFetching,
    refetch,
    handleApprove,

    viewTarget,
    isViewModalOpen: Boolean(viewTarget),
    openViewModal,
    closeViewModal,

    rejectTarget,
    isRejectModalOpen: Boolean(rejectTarget),
    openRejectModal,
    closeRejectModal,
    rejectReason,
    setRejectReason,
    confirmReject,
    isRejecting,
  };
};
