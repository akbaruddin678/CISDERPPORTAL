import { useState, useMemo } from "react";
import {
  useGetPaymentRecordsQuery,
  useCreateAllocationMutation,
  useAddReceivedFundMutation,
  useAddDirectExpenseMutation,
  useAddExpenseMutation,
  useUpdateRecordMutation,
  useDeleteRecordMutation,
  useDeleteExpenseMutation,
} from "../api/paymentRecordApi";
import { useAuth } from "../../../components/auth/context/AuthContext";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";

const PaymentRecordController = ({ children }) => {
  const { userData } = useAuth();
  const { openAlert } = useGlobalAlert();

  const userRole = userData?.roles?.[0] || "accountant";

  // --- View State ---
  const [activeTab, setActiveTab] = useState("allocations"); // "allocations" | "received" | "direct"

  // --- Modal States ---
  const [isAllocationModalOpen, setAllocationModalOpen] = useState(false);
  const [isReceivedFundModalOpen, setReceivedFundModalOpen] = useState(false);
  const [isDirectExpenseModalOpen, setDirectExpenseModalOpen] = useState(false);
  const [selectedRecordForExpense, setSelectedRecordForExpense] =
    useState(null);

  // --- Edit & Delete States ---
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingRecordId, setDeletingRecordId] = useState(null);

  // --- API Hooks ---
  const { data, isLoading } = useGetPaymentRecordsQuery();
  const [createAllocation, { isLoading: isCreating }] =
    useCreateAllocationMutation();
  const [addReceivedFund, { isLoading: isAddingReceived }] =
    useAddReceivedFundMutation();
  const [addDirectExpense, { isLoading: isAddingDirect }] =
    useAddDirectExpenseMutation();
  const [addExpense, { isLoading: isAddingExpense }] = useAddExpenseMutation();

  const [updateRecord, { isLoading: isUpdating }] = useUpdateRecordMutation();
  const [deleteRecord, { isLoading: isDeleting }] = useDeleteRecordMutation();
  const [deleteExpense] = useDeleteExpenseMutation();

  // --- Data Categorization ---
  const allRecords = data?.data || [];

  const allocations = useMemo(
    () =>
      allRecords.filter((r) => !r.recordType || r.recordType === "allocation"),
    [allRecords],
  );

  const receivedFunds = useMemo(
    () => allRecords.filter((r) => r.recordType === "received"),
    [allRecords],
  );

  const directExpenses = useMemo(
    () => allRecords.filter((r) => r.recordType === "direct"),
    [allRecords],
  );

  // --- Submit Handlers ---
  const handleCreateOrUpdateAllocation = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      if (editingRecord) {
        // Prepare JSON for update (assuming no file upload on update for simplicity)
        const updateData = {
          title: formData.get("title"),
          allocatedAmount: Number(formData.get("allocatedAmount")),
        };
        await updateRecord({
          id: editingRecord._id,
          data: updateData,
        }).unwrap();
        openAlert({
          message: "Allocation updated successfully",
          severity: "success",
        });
      } else {
        await createAllocation(formData).unwrap();
        openAlert({
          message: "Fund allocated successfully",
          severity: "success",
        });
      }
      setAllocationModalOpen(false);
      setEditingRecord(null);
    } catch (error) {
      openAlert({
        message: error?.data?.message || "Operation failed",
        severity: "error",
      });
    }
  };

  const handleCreateOrUpdateReceivedFund = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      if (editingRecord) {
        const updateData = {
          title: formData.get("title"),
          source: formData.get("source"),
          receivedAmount: Number(formData.get("receivedAmount")),
          allocatedAmount: Number(formData.get("receivedAmount")), // Keep in sync
        };
        await updateRecord({
          id: editingRecord._id,
          data: updateData,
        }).unwrap();
        openAlert({
          message: "Received fund updated successfully",
          severity: "success",
        });
      } else {
        await addReceivedFund(formData).unwrap();
        openAlert({
          message: "Received money logged successfully",
          severity: "success",
        });
      }
      setReceivedFundModalOpen(false);
      setEditingRecord(null);
    } catch (error) {
      openAlert({
        message: error?.data?.message || "Operation failed",
        severity: "error",
      });
    }
  };

  const handleCreateOrUpdateDirectExpense = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      if (editingRecord) {
        const updateData = {
          description: formData.get("description"),
          title: formData.get("description"),
          source: formData.get("source"),
          amount: Number(formData.get("amount")),
        };
        await updateRecord({
          id: editingRecord._id,
          data: updateData,
        }).unwrap();
        openAlert({
          message: "Direct expense updated successfully",
          severity: "success",
        });
      } else {
        await addDirectExpense(formData).unwrap();
        openAlert({
          message: "Direct expense logged successfully",
          severity: "success",
        });
      }
      setDirectExpenseModalOpen(false);
      setEditingRecord(null);
    } catch (error) {
      openAlert({
        message: error?.data?.message || "Operation failed",
        severity: "error",
      });
    }
  };

  const handleAddSubExpense = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await addExpense({
        recordId: selectedRecordForExpense._id,
        formData,
      }).unwrap();
      openAlert({
        message: "Expense logged successfully",
        severity: "success",
      });
      setSelectedRecordForExpense(null);
    } catch (error) {
      openAlert({ message: "Failed to log expense", severity: "error" });
    }
  };

  const handleDeleteRecord = async () => {
    try {
      await deleteRecord(deletingRecordId).unwrap();
      openAlert({
        message: "Record deleted successfully",
        severity: "success",
      });
      setDeletingRecordId(null);
    } catch (error) {
      openAlert({ message: "Failed to delete record", severity: "error" });
    }
  };

  const handleDeleteSubExpense = async (recordId, expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense?"))
      return;
    try {
      await deleteExpense({ recordId, expenseId }).unwrap();
      openAlert({
        message: "Expense deleted successfully",
        severity: "success",
      });
    } catch (error) {
      openAlert({ message: "Failed to delete expense", severity: "error" });
    }
  };

  // Open Edit Modals
  const openEditModal = (record, type) => {
    setEditingRecord(record);
    if (type === "allocation") setAllocationModalOpen(true);
    if (type === "received") setReceivedFundModalOpen(true);
    if (type === "direct") setDirectExpenseModalOpen(true);
  };

  return children({
    userRole,
    allocations,
    receivedFunds,
    directExpenses,
    activeTab,
    setActiveTab,
    isLoading,
    isCreating: isCreating || isUpdating,
    isAddingExpense,
    isAddingDirect: isAddingDirect || isUpdating,
    isAddingReceived: isAddingReceived || isUpdating,
    isDeleting,

    // Modals
    isAllocationModalOpen,
    setAllocationModalOpen,
    isReceivedFundModalOpen,
    setReceivedFundModalOpen,
    isDirectExpenseModalOpen,
    setDirectExpenseModalOpen,
    selectedRecordForExpense,
    setSelectedRecordForExpense,

    // Edit & Delete state
    editingRecord,
    setEditingRecord,
    deletingRecordId,
    setDeletingRecordId,

    // Handlers
    handleCreateOrUpdateAllocation,
    handleCreateOrUpdateReceivedFund,
    handleCreateOrUpdateDirectExpense,
    handleAddSubExpense,
    handleDeleteRecord,
    handleDeleteSubExpense,
    openEditModal,
  });
};

export default PaymentRecordController;
