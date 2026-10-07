import { useEffect, useState } from "react";
import {
  useGetDailyInvoicesQuery,
  useLazyGetDailyInvoicesQuery,
  useBulkShiftUnpaidInvoiceDueDateMutation,
  useBulkCancelUnpaidInvoicesMutation,
  useUpdateChallanDueDateMutation,
  useDeleteChallanMutation,
} from "../api/studentChallanApi";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { exportRowsToPDF, exportRowsToExcel } from "../../Admission/common/pipelineExport";

const EMPTY_FILTERS = {
  invoiceNo: "",
  dueFrom: "",
  dueTo: "",
  paidFrom: "",
  paidTo: "",
  name: "",
  status: "",
};

const EXPORT_PAGE_LIMIT = 5000;

const EXPORT_COLUMNS = [
  { header: "Reg No", value: (r) => r.regNo },
  { header: "One Bill Invoice No", value: (r) => r.oneBillInvoiceNo || "N/A" },
  { header: "Name", value: (r) => r.name },
  { header: "Due Date", value: (r) => (r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "N/A") },
  { header: "Amount", value: (r) => r.amount },
  { header: "After Due Date", value: (r) => r.afterDueDateAmount },
  { header: "Amount Paid", value: (r) => r.amountPaid },
  { header: "Paid Date", value: (r) => (r.paidDate ? new Date(r.paidDate).toLocaleDateString() : "") },
  { header: "Mobile", value: (r) => r.mobile },
  { header: "Status", value: (r) => (r.status === "PAID" ? "Paid" : "Unpaid") },
  { header: "Paid By", value: (r) => r.paidBy || "" },
];

// Scope-aware "Daily Invoice" ledger (College or University) — server-side
// filtered + paginated, same "table only ever renders one page" discipline
// used by LMS Management, since this table can realistically hold
// thousands of rows.
export const useDailyInvoice = (scope = "college") => {
  const { openAlert } = useGlobalAlert();

  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [appliedFilters]);

  const { data, isLoading, isFetching, refetch } = useGetDailyInvoicesQuery({
    ...appliedFilters,
    scope,
    page,
    limit,
  });

  const rows = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit, totalPages: 1 };
  // Totals across the WHOLE filtered set, not just the rendered page —
  // updates every time Filter/Clear is applied since that changes what the
  // server-side aggregate sums.
  const summary = data?.summary || { totalAmount: 0, totalPaidAmount: 0 };

  const handleFilterFieldChange = (field, value) =>
    setDraftFilters((prev) => ({ ...prev, [field]: value }));
  const applyFilters = () => setAppliedFilters(draftFilters);
  const clearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };

  const handlePageChange = (newPage) => setPage(newPage);
  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  // --- Export (whole filtered set, not just the rendered page) ---
  const [triggerExportFetch, { isFetching: isExporting }] = useLazyGetDailyInvoicesQuery();
  const scopeLabel = scope === "university" ? "University" : "College";
  const fetchAllForExport = async () => {
    const result = await triggerExportFetch({
      ...appliedFilters,
      scope,
      page: 1,
      limit: EXPORT_PAGE_LIMIT,
    }).unwrap();
    return result?.data || [];
  };
  const exportPDF = async () => {
    try {
      const exportRows = await fetchAllForExport();
      exportRowsToPDF({
        title: `Daily Invoice — ${scopeLabel}`,
        columns: EXPORT_COLUMNS,
        rows: exportRows,
        filename: `Daily_Invoice_${scopeLabel}.pdf`,
      });
    } catch {
      openAlert({ message: "Failed to export PDF.", severity: "error" });
    }
  };
  const exportExcel = async () => {
    try {
      const exportRows = await fetchAllForExport();
      exportRowsToExcel({
        columns: EXPORT_COLUMNS,
        rows: exportRows,
        filename: `Daily_Invoice_${scopeLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`,
        sheetName: "Daily Invoice",
      });
    } catch {
      openAlert({ message: "Failed to export Excel.", severity: "error" });
    }
  };

  // --- Bulk: Change Unpaid Invoice Date ---
  const [isShiftDateModalOpen, setIsShiftDateModalOpen] = useState(false);
  const [bulkShiftUnpaidInvoiceDueDate, { isLoading: isShiftingDate }] =
    useBulkShiftUnpaidInvoiceDueDateMutation();

  const openShiftDateModal = () => setIsShiftDateModalOpen(true);
  const closeShiftDateModal = () => setIsShiftDateModalOpen(false);
  const confirmShiftDate = async (newDueDate) => {
    if (!newDueDate) {
      openAlert({ message: "Please pick a new due date.", severity: "warning" });
      return;
    }
    try {
      const result = await bulkShiftUnpaidInvoiceDueDate({
        filters: appliedFilters,
        newDueDate,
        scope,
      }).unwrap();
      openAlert({ message: result?.message || "Due date updated.", severity: "success" });
      closeShiftDateModal();
    } catch (error) {
      openAlert({
        message: error?.data?.message || "Failed to update due dates.",
        severity: "error",
      });
    }
  };

  // --- Bulk: Clear Unpaid Invoices (non-destructive cancel) ---
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [bulkCancelUnpaidInvoices, { isLoading: isClearing }] =
    useBulkCancelUnpaidInvoicesMutation();

  const openClearModal = () => setIsClearModalOpen(true);
  const closeClearModal = () => setIsClearModalOpen(false);
  const confirmClearUnpaid = async () => {
    try {
      const result = await bulkCancelUnpaidInvoices({
        filters: appliedFilters,
        scope,
      }).unwrap();
      openAlert({ message: result?.message || "Unpaid invoices cleared.", severity: "success" });
      closeClearModal();
    } catch (error) {
      openAlert({
        message: error?.data?.message || "Failed to clear unpaid invoices.",
        severity: "error",
      });
    }
  };

  // --- Row: View ---
  const [viewTarget, setViewTarget] = useState(null);
  const openViewModal = (row) => setViewTarget(row);
  const closeViewModal = () => setViewTarget(null);

  // --- Row: Edit (due date, unpaid only) ---
  const [editTarget, setEditTarget] = useState(null);
  const [updateChallanDueDate, { isLoading: isSavingEdit }] = useUpdateChallanDueDateMutation();
  const openEditModal = (row) => setEditTarget(row);
  const closeEditModal = () => setEditTarget(null);
  const confirmEditDueDate = async (newDueDate) => {
    if (!editTarget || !newDueDate) return;
    try {
      await updateChallanDueDate({ id: editTarget._id, dueDate: newDueDate }).unwrap();
      openAlert({ message: "Due date updated.", severity: "success" });
      closeEditModal();
    } catch (error) {
      openAlert({
        message: error?.data?.message || "Failed to update due date.",
        severity: "error",
      });
    }
  };

  // --- Row: Delete (unpaid only, soft-cancel) ---
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteChallan, { isLoading: isDeleting }] = useDeleteChallanMutation();
  const openDeleteModal = (row) => setDeleteTarget(row);
  const closeDeleteModal = () => setDeleteTarget(null);
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteChallan({ id: deleteTarget._id }).unwrap();
      openAlert({ message: "Invoice cancelled.", severity: "success" });
      closeDeleteModal();
    } catch (error) {
      openAlert({
        message: error?.data?.message || "Failed to cancel invoice.",
        severity: "error",
      });
    }
  };

  return {
    draftFilters,
    handleFilterFieldChange,
    applyFilters,
    clearFilters,

    rows,
    pagination,
    summary,
    page,
    limit,
    handlePageChange,
    handleLimitChange,
    isLoading: isLoading || isFetching,
    refetch,

    isExporting,
    exportPDF,
    exportExcel,

    isShiftDateModalOpen,
    openShiftDateModal,
    closeShiftDateModal,
    confirmShiftDate,
    isShiftingDate,

    isClearModalOpen,
    openClearModal,
    closeClearModal,
    confirmClearUnpaid,
    isClearing,

    viewTarget,
    openViewModal,
    closeViewModal,

    editTarget,
    openEditModal,
    closeEditModal,
    confirmEditDueDate,
    isSavingEdit,

    deleteTarget,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    isDeleting,
  };
};
