import { useMemo, useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetAllStaffQuery,
  useGetAppraisalsQuery,
  useCreateAppraisalMutation,
  useUpdateAppraisalMutation,
} from "../api/HrApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

const emptyKpi = { goal: "", weightage: "" };
const initialForm = { staffId: "", evaluatorId: "", reviewPeriod: "", kpis: [{ ...emptyKpi }] };

const useHrAppraisalsController = () => {
  const { openAlert } = useGlobalAlert();

  const [reviewPeriod, setReviewPeriod] = useState("");

  const { data: staffRes } = useGetAllStaffQuery();
  const staffList = useMemo(() => extractArray(staffRes), [staffRes]);

  const { data: appraisalsRes, isFetching, refetch } = useGetAppraisalsQuery(
    reviewPeriod ? { reviewPeriod } : undefined,
  );
  const appraisals = useMemo(() => extractArray(appraisalsRes), [appraisalsRes]);

  const [createAppraisal, { isLoading: isCreating }] = useCreateAppraisalMutation();
  const [updateAppraisal, { isLoading: isUpdating }] = useUpdateAppraisalMutation();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  const openCreateModal = () => {
    setFormData(initialForm);
    setShowCreateModal(true);
  };
  const closeCreateModal = () => setShowCreateModal(false);

  const handleFormChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const addKpiRow = () => {
    setFormData((prev) => ({ ...prev, kpis: [...prev.kpis, { ...emptyKpi }] }));
  };
  const updateKpiRow = (index, field, value) => {
    setFormData((prev) => {
      const kpis = [...prev.kpis];
      kpis[index] = { ...kpis[index], [field]: value };
      return { ...prev, kpis };
    });
  };
  const removeKpiRow = (index) => {
    setFormData((prev) => ({ ...prev, kpis: prev.kpis.filter((_, i) => i !== index) }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.staffId || !formData.reviewPeriod) {
      return openAlert({ message: "Select staff and enter a review period.", severity: "warning" });
    }
    const validKpis = formData.kpis.filter((k) => k.goal && k.weightage);
    if (validKpis.length === 0) {
      return openAlert({ message: "Add at least one KPI.", severity: "warning" });
    }
    try {
      await createAppraisal({
        staffId: formData.staffId,
        evaluatorId: formData.evaluatorId || undefined,
        reviewPeriod: formData.reviewPeriod,
        kpis: validKpis.map((k) => ({
          goal: k.goal,
          weightage: Number(k.weightage),
        })),
      }).unwrap();
      openAlert({ message: "Appraisal created.", severity: "success" });
      setShowCreateModal(false);
    } catch (error) {
      openAlert({ message: error.data?.message || "Failed to create appraisal.", severity: "error" });
    }
  };

  // Draft -> Pending Employee Review: hands it to the employee for
  // self-assessment before the evaluator scores it.
  const handleSendForSelfAssessment = async (appraisal) => {
    try {
      await updateAppraisal({ id: appraisal._id, status: "Pending Employee Review" }).unwrap();
      openAlert({ message: "Sent to employee for self-assessment.", severity: "success" });
    } catch (error) {
      openAlert({ message: error.data?.message || "Failed to update appraisal.", severity: "error" });
    }
  };

  // Admin override — normally the evaluator completes it via their own
  // "To Review" screen, but HR can force-close one if needed.
  const handleForceComplete = async (appraisal) => {
    try {
      await updateAppraisal({ id: appraisal._id, status: "Completed" }).unwrap();
      openAlert({ message: "Appraisal marked completed.", severity: "success" });
    } catch (error) {
      openAlert({ message: error.data?.message || "Failed to update appraisal.", severity: "error" });
    }
  };

  return {
    reviewPeriod,
    setReviewPeriod,
    staffList,
    appraisals,
    isFetching,
    refetch,

    showCreateModal,
    openCreateModal,
    closeCreateModal,
    formData,
    handleFormChange,
    addKpiRow,
    updateKpiRow,
    removeKpiRow,
    handleCreate,
    isCreating,

    handleSendForSelfAssessment,
    handleForceComplete,
    isUpdating,
  };
};

export default useHrAppraisalsController;
