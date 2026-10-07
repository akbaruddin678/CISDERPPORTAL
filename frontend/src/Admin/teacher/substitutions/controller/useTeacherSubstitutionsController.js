import { useMemo, useState } from "react";
import { useGlobalAlert } from "../../../../shared/Alert/context/AlertContext";
import { useGetMyCoursesQuery } from "../../api/teacherClassesApi";
import {
  useGetMySubstitutionRequestsQuery,
  useGetOpenSubstitutionRequestsQuery,
  useCreateSubstitutionRequestMutation,
  useAcceptSubstitutionRequestMutation,
  useCancelSubstitutionRequestMutation,
} from "../api/substitutionApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

const initialForm = { courseAssignmentId: "", dateOfAbsence: "", reason: "" };

const useTeacherSubstitutionsController = () => {
  const { openAlert } = useGlobalAlert();

  const [activeTab, setActiveTab] = useState("mine"); // "mine" | "open"

  const { data: coursesRes } = useGetMyCoursesQuery();
  const myCourses = useMemo(
    () => extractArray(coursesRes).filter((c) => c.isActive),
    [coursesRes],
  );

  const { data: mineRes, isFetching: isFetchingMine } = useGetMySubstitutionRequestsQuery();
  const myRequests = extractArray(mineRes);

  const { data: openRes, isFetching: isFetchingOpen } = useGetOpenSubstitutionRequestsQuery();
  const openRequests = extractArray(openRes);

  const [createRequest, { isLoading: isCreating }] = useCreateSubstitutionRequestMutation();
  const [acceptRequest, { isLoading: isAccepting }] = useAcceptSubstitutionRequestMutation();
  const [cancelRequest, { isLoading: isCancelling }] = useCancelSubstitutionRequestMutation();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setFormData(initialForm);
    setShowCreateModal(true);
  };
  const closeCreateModal = () => setShowCreateModal(false);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!formData.courseAssignmentId || !formData.dateOfAbsence || !formData.reason) {
      return openAlert({ message: "Please fill all fields.", severity: "warning" });
    }
    try {
      await createRequest(formData).unwrap();
      openAlert({ message: "Substitution request created.", severity: "success" });
      setShowCreateModal(false);
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to create substitution request.",
        severity: "error",
      });
    }
  };

  const handleAccept = async (id) => {
    try {
      await acceptRequest(id).unwrap();
      openAlert({ message: "You've accepted this class coverage.", severity: "success" });
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to accept request.",
        severity: "error",
      });
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelRequest(id).unwrap();
      openAlert({ message: "Substitution request cancelled.", severity: "success" });
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to cancel request.",
        severity: "error",
      });
    }
  };

  return {
    activeTab,
    setActiveTab,

    myCourses,
    myRequests,
    isFetchingMine,
    openRequests,
    isFetchingOpen,

    showCreateModal,
    openCreateModal,
    closeCreateModal,
    formData,
    handleInputChange,
    handleCreateRequest,
    isCreating,

    handleAccept,
    isAccepting,
    handleCancel,
    isCancelling,
  };
};

export default useTeacherSubstitutionsController;
