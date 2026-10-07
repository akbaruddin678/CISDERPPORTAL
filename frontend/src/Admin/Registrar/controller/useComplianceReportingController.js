import { useMemo, useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetComplianceReportsQuery,
  useCreateComplianceReportMutation,
  useMarkReportSubmittedMutation,
} from "../api/complianceReportingApi";

export const useComplianceReportingController = () => {
  const { openAlert } = useGlobalAlert();
  const { data, isFetching, error, refetch } = useGetComplianceReportsQuery();
  const reports = useMemo(() => data?.data || [], [data]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const categories = useMemo(() => {
    const u = [...new Set(reports.map((r) => r.category))];
    return ["All", ...u];
  }, [reports]);

  const filtered = useMemo(
    () =>
      reports.filter((r) => {
        const q = searchQuery.toLowerCase();
        return (
          (q === "" ||
            r.title.toLowerCase().includes(q) ||
            r.authority.toLowerCase().includes(q)) &&
          (statusFilter === "All" || r.status === statusFilter) &&
          (categoryFilter === "All" || r.category === categoryFilter)
        );
      }),
    [reports, searchQuery, statusFilter, categoryFilter],
  );

  const stats = useMemo(
    () => ({
      total: reports.length,
      submitted: reports.filter((r) => r.status === "Submitted").length,
      pending: reports.filter((r) => r.status === "Pending").length,
      overdue: reports.filter((r) => r.status === "Late").length,
    }),
    [reports],
  );

  // Submit-with-file modal
  const [submitTarget, setSubmitTarget] = useState(null);
  const [submitFile, setSubmitFile] = useState(null);
  const openSubmitModal = (report) => {
    setSubmitTarget(report);
    setSubmitFile(null);
  };
  const closeSubmitModal = () => {
    setSubmitTarget(null);
    setSubmitFile(null);
  };

  const [markSubmitted, { isLoading: isSubmitting }] = useMarkReportSubmittedMutation();
  const handleMarkSubmitted = async () => {
    try {
      const formData = new FormData();
      if (submitFile) formData.append("file", submitFile);
      await markSubmitted({ id: submitTarget._id, formData }).unwrap();
      openAlert({ message: "Report marked as submitted.", severity: "success" });
      closeSubmitModal();
    } catch (err) {
      openAlert({ message: err.data?.message || "Failed to submit report.", severity: "error" });
    }
  };

  // New report form
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", category: "", authority: "", dueDate: "" });
  const openCreateModal = () => {
    setCreateForm({ title: "", category: "", authority: "", dueDate: "" });
    setIsCreateOpen(true);
  };
  const closeCreateModal = () => setIsCreateOpen(false);

  const [createReport, { isLoading: isCreating }] = useCreateComplianceReportMutation();
  const handleCreateReport = async () => {
    if (!createForm.title.trim() || !createForm.category.trim() || !createForm.authority.trim() || !createForm.dueDate) {
      return openAlert({ message: "Please fill in all fields.", severity: "warning" });
    }
    try {
      await createReport(createForm).unwrap();
      openAlert({ message: "Compliance report created.", severity: "success" });
      closeCreateModal();
    } catch (err) {
      openAlert({ message: err.data?.message || "Failed to create report.", severity: "error" });
    }
  };

  return {
    reports: filtered,
    isLoading: isFetching,
    error: error ? error.data?.message || "Failed to load compliance reports." : null,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    categories,
    stats,
    refetch,

    submitTarget,
    submitFile,
    setSubmitFile,
    openSubmitModal,
    closeSubmitModal,
    handleMarkSubmitted,
    isSubmitting,

    isCreateOpen,
    openCreateModal,
    closeCreateModal,
    createForm,
    setCreateForm,
    handleCreateReport,
    isCreating,
  };
};
