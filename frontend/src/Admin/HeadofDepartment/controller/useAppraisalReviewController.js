import { useMemo, useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetAppraisalsToReviewQuery,
  useSubmitEvaluatorScoreMutation,
} from "../api/appraisalReviewApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

const useAppraisalReviewController = () => {
  const { openAlert } = useGlobalAlert();

  const { data: appraisalsRes, isFetching, refetch } = useGetAppraisalsToReviewQuery();
  const appraisals = useMemo(() => extractArray(appraisalsRes), [appraisalsRes]);

  const [submitScore, { isLoading: isSubmitting }] = useSubmitEvaluatorScoreMutation();

  const [selectedId, setSelectedId] = useState(null);
  const [scoreForm, setScoreForm] = useState({ kpis: [], evaluatorFeedback: "" });

  const selectedAppraisal = useMemo(
    () => appraisals.find((a) => a._id === selectedId) || null,
    [appraisals, selectedId],
  );

  const openScoreModal = (appraisal) => {
    setSelectedId(appraisal._id);
    setScoreForm({
      kpis: appraisal.kpis.map((k) => ({ ...k, score: k.score ?? "", comments: k.comments || "" })),
      evaluatorFeedback: appraisal.evaluatorFeedback || "",
    });
  };
  const closeScoreModal = () => setSelectedId(null);

  const updateKpiScore = (index, field, value) => {
    setScoreForm((prev) => {
      const kpis = [...prev.kpis];
      kpis[index] = { ...kpis[index], [field]: value };
      return { ...prev, kpis };
    });
  };

  const handleSubmitScore = async () => {
    if (scoreForm.kpis.some((k) => k.score === "" || k.score === undefined)) {
      return openAlert({ message: "Score every KPI before completing.", severity: "warning" });
    }
    try {
      await submitScore({
        id: selectedId,
        kpis: scoreForm.kpis.map((k) => ({
          goal: k.goal,
          weightage: k.weightage,
          score: Number(k.score),
          comments: k.comments,
        })),
        evaluatorFeedback: scoreForm.evaluatorFeedback,
      }).unwrap();
      openAlert({ message: "Appraisal completed.", severity: "success" });
      setSelectedId(null);
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to submit scores.",
        severity: "error",
      });
    }
  };

  return {
    appraisals,
    isFetching,
    refetch,

    selectedAppraisal,
    openScoreModal,
    closeScoreModal,
    scoreForm,
    setScoreForm,
    updateKpiScore,
    handleSubmitScore,
    isSubmitting,
  };
};

export default useAppraisalReviewController;
