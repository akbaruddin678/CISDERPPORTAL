import { useMemo, useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetAllStaffQuery,
  useGetExitRecordsQuery,
  useCreateExitRecordMutation,
  useUpdateExitRecordMutation,
} from "../api/HrApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

const initialForm = {
  staffId: "",
  type: "Resignation",
  noticeGivenDate: "",
  lastWorkingDay: "",
  reason: "",
};

const useHrExitsController = () => {
  const { openAlert } = useGlobalAlert();

  const { data: staffRes } = useGetAllStaffQuery();
  const staffList = useMemo(() => extractArray(staffRes), [staffRes]);

  const { data: recordsRes, isFetching, refetch } = useGetExitRecordsQuery();
  const records = useMemo(() => extractArray(recordsRes), [recordsRes]);

  const [createExitRecord, { isLoading: isCreating }] = useCreateExitRecordMutation();
  const [updateExitRecord, { isLoading: isUpdating }] = useUpdateExitRecordMutation();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  const [expandedId, setExpandedId] = useState(null);
  const toggleExpanded = (id) => setExpandedId((prev) => (prev === id ? null : id));

  const [settlementAmounts, setSettlementAmounts] = useState({});
  const setSettlementAmount = (recordId, value) =>
    setSettlementAmounts((prev) => ({ ...prev, [recordId]: value }));

  const openCreateModal = () => {
    setFormData(initialForm);
    setShowCreateModal(true);
  };
  const closeCreateModal = () => setShowCreateModal(false);
  const handleFormChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.staffId || !formData.noticeGivenDate || !formData.lastWorkingDay) {
      return openAlert({ message: "Please fill all required fields.", severity: "warning" });
    }
    try {
      await createExitRecord(formData).unwrap();
      openAlert({ message: "Exit record created.", severity: "success" });
      setShowCreateModal(false);
    } catch (error) {
      openAlert({ message: error.data?.message || "Failed to create exit record.", severity: "error" });
    }
  };

  const handleToggleClearance = async (record, key) => {
    try {
      await updateExitRecord({
        id: record._id,
        clearances: { [key]: !record.clearances[key] },
      }).unwrap();
    } catch (error) {
      openAlert({ message: error.data?.message || "Failed to update clearance.", severity: "error" });
    }
  };

  const handleMarkSettled = async (record) => {
    const amount = settlementAmounts[record._id];
    if (!amount) {
      return openAlert({ message: "Enter the final settlement amount first.", severity: "warning" });
    }
    try {
      await updateExitRecord({
        id: record._id,
        finalSettlementAmount: Number(amount),
        finalSettlementPaid: true,
      }).unwrap();
      openAlert({ message: "Final settlement marked as paid.", severity: "success" });
    } catch (error) {
      openAlert({ message: error.data?.message || "Failed to update record.", severity: "error" });
    }
  };

  return {
    staffList,
    records,
    isFetching,
    refetch,

    expandedId,
    toggleExpanded,

    settlementAmounts,
    setSettlementAmount,

    showCreateModal,
    openCreateModal,
    closeCreateModal,
    formData,
    handleFormChange,
    handleCreate,
    isCreating,

    handleToggleClearance,
    handleMarkSettled,
    isUpdating,
  };
};

export default useHrExitsController;
