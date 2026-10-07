import { useMemo, useState } from "react";
import { useGlobalAlert } from "../../../../shared/Alert/context/AlertContext";
import {
  useGetMyAppraisalsQuery,
  useSubmitSelfAssessmentMutation,
} from "../api/appraisalSelfApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

const useTeacherAppraisalsController = () => {
  const { openAlert } = useGlobalAlert();

  const { data: appraisalsRes, isFetching, refetch } = useGetMyAppraisalsQuery();
  const appraisals = useMemo(() => extractArray(appraisalsRes), [appraisalsRes]);

  const [submitSelfAssessment, { isLoading: isSubmitting }] = useSubmitSelfAssessmentMutation();

  const [selectedId, setSelectedId] = useState(null);
  const [comments, setComments] = useState("");

  const selectedAppraisal = useMemo(
    () => appraisals.find((a) => a._id === selectedId) || null,
    [appraisals, selectedId],
  );

  const openAssessmentModal = (appraisal) => {
    setSelectedId(appraisal._id);
    setComments(appraisal.employeeComments || "");
  };
  const closeAssessmentModal = () => setSelectedId(null);

  const handleSubmit = async () => {
    if (!comments.trim()) {
      return openAlert({ message: "Write your self-assessment first.", severity: "warning" });
    }
    try {
      await submitSelfAssessment({ id: selectedId, employeeComments: comments }).unwrap();
      openAlert({ message: "Self-assessment submitted.", severity: "success" });
      setSelectedId(null);
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to submit self-assessment.",
        severity: "error",
      });
    }
  };

  return {
    appraisals,
    isFetching,
    refetch,

    selectedAppraisal,
    openAssessmentModal,
    closeAssessmentModal,
    comments,
    setComments,
    handleSubmit,
    isSubmitting,
  };
};

export default useTeacherAppraisalsController;
