import { useState } from "react";
import { useGlobalAlert } from "../../../../shared/Alert/context/AlertContext";
import {
  useGetMyLeaveRequestsQuery,
  useSubmitLeaveRequestMutation,
  useCancelLeaveRequestMutation,
} from "../api/leaveApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

const initialForm = { leaveType: "", startDate: "", endDate: "", reason: "" };

const useTeacherLeaveController = () => {
  const { openAlert } = useGlobalAlert();

  const { data: requestsRes, isFetching, refetch } = useGetMyLeaveRequestsQuery();
  const requests = extractArray(requestsRes);

  const [submitLeaveRequest, { isLoading: isSubmitting }] = useSubmitLeaveRequestMutation();
  const [cancelLeaveRequest, { isLoading: isCancelling }] = useCancelLeaveRequestMutation();

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openApplyModal = () => {
    setFormData(initialForm);
    setShowApplyModal(true);
  };
  const closeApplyModal = () => setShowApplyModal(false);

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
      return openAlert({ message: "Please fill all fields.", severity: "warning" });
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      return openAlert({ message: "End date can't be before the start date.", severity: "warning" });
    }

    try {
      await submitLeaveRequest(formData).unwrap();
      openAlert({ message: "Leave request submitted.", severity: "success" });
      setShowApplyModal(false);
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to submit leave request.",
        severity: "error",
      });
    }
  };

  const handleCancelRequest = async (id) => {
    try {
      await cancelLeaveRequest(id).unwrap();
      openAlert({ message: "Leave request withdrawn.", severity: "success" });
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to withdraw leave request.",
        severity: "error",
      });
    }
  };

  return {
    requests,
    isFetching,
    refetch,

    showApplyModal,
    openApplyModal,
    closeApplyModal,
    formData,
    handleInputChange,
    handleSubmitApplication,
    isSubmitting,

    handleCancelRequest,
    isCancelling,
  };
};

export default useTeacherLeaveController;
