import { useEffect, useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  useGetLmsAccountsQuery,
  useLazyGetLmsAccountsQuery,
  useUpdateLmsCredentialsMutation,
  useToggleLmsStatusMutation,
  useBulkGenerateLmsEmailsMutation,
  useBulkResetLmsPasswordsMutation,
} from "../api/adminLmsApi";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { exportRowsToPDF, exportRowsToExcel } from "../../Admission/common/pipelineExport";
import {
  useGetDepartmentsQuery,
  useGetProgramsQuery,
  useGetSemestersQuery,
} from "../../accountant/api/depsemtermpro";

const DEBOUNCE_MS = 400;
const EXPORT_PAGE_LIMIT = 5000; // matches the backend's export-size cap

const EXPORT_COLUMNS = [
  { header: "Name", value: (a) => a.name },
  { header: "Roll No", value: (a) => a.rollNumber },
  { header: "LMS Email", value: (a) => a.email },
  { header: "Program", value: (a) => a.program?.name },
  { header: "Class", value: (a) => a.department },
  { header: "Session", value: (a) => a.session },
  { header: "Section", value: (a) => (a.semester ? `Semester ${a.semester}` : "N/A") },
  { header: "LMS Status", value: (a) => a.status },
  { header: "Fee Status", value: (a) => (a.feePendingForSemester ? "Pending" : "Paid") },
  {
    header: "Last Login",
    value: (a) => (a.lastLogin ? new Date(a.lastLogin).toLocaleString() : "Never"),
  },
];

// Server-side paginated + filtered — the table only ever asks for (and
// renders) one page of accounts at a time, instead of loading every student
// into the browser at once (that was freezing the page for large student
// counts). College/University is a server-side `level` filter (not a
// client-side bucket split anymore), so switching tabs re-fetches just that
// tab's page rather than re-slicing an already-huge in-memory array.
export const useLmsManagementController = () => {
  const { openAlert } = useGlobalAlert();
  const [activeTab, setActiveTab] = useState("college");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // --- Department / Program / Semester filters (cascading, same pattern
  // as Student Management) ---
  const [departmentId, setDepartmentId] = useState("");
  const [programId, setProgramId] = useState("");
  const [semesterId, setSemesterId] = useState("");

  const { data: departmentsData } = useGetDepartmentsQuery();
  const { data: programsData } = useGetProgramsQuery();
  const { data: semestersData } = useGetSemestersQuery();

  // Programs/semesters are scoped to whichever tab is active — a College
  // (HSSC) program would always come back empty on the University tab and
  // vice versa, same "level" rule the backend applies to the account list
  // itself.
  const tabPrograms = useMemo(() => {
    const all = programsData?.data || [];
    return activeTab === "college"
      ? all.filter((p) => p.level === "HSSC")
      : all.filter((p) => p.level !== "HSSC");
  }, [programsData, activeTab]);
  const tabProgramIds = useMemo(() => new Set(tabPrograms.map((p) => p._id)), [tabPrograms]);

  const filteredPrograms = useMemo(() => {
    if (!departmentId) return tabPrograms;
    return tabPrograms.filter((p) => (p.departmentId?._id || p.departmentId) === departmentId);
  }, [departmentId, tabPrograms]);

  const filteredSemesters = useMemo(() => {
    const all = (semestersData?.data || []).filter((s) =>
      tabProgramIds.has(s.programId?._id || s.programId),
    );
    if (!programId) return all;
    return all
      .filter((s) => (s.programId?._id || s.programId) === programId)
      .sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [semestersData, tabProgramIds, programId]);

  const catalogData = useMemo(
    () => ({
      departments: departmentsData?.data || [],
      programs: filteredPrograms,
      semesters: filteredSemesters,
    }),
    [departmentsData, filteredPrograms, filteredSemesters],
  );

  const handleDepartmentChange = (value) => {
    setDepartmentId(value);
    setProgramId("");
    setSemesterId("");
  };
  const handleProgramChange = (value) => {
    setProgramId(value);
    setSemesterId("");
  };
  const clearCatalogFilters = () => {
    setDepartmentId("");
    setProgramId("");
    setSemesterId("");
  };

  // Debounce search input so every keystroke doesn't trigger a fetch.
  useEffect(() => {
    const handle = setTimeout(() => setSearchQuery(searchInput.trim()), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // Reset to page 1 whenever the tab, search term, or catalog filters
  // change. Switching tabs also clears the catalog filters — a College
  // department/program selection makes no sense once you're looking at
  // University accounts (and vice versa).
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery, departmentId, programId, semesterId]);
  useEffect(() => {
    clearCatalogFilters();
  }, [activeTab]);

  const { data, isLoading, isFetching, refetch } = useGetLmsAccountsQuery({
    level: activeTab,
    search: searchQuery,
    page,
    limit,
    departmentId,
    programId,
    semesterId,
  });

  const accounts = useMemo(() => data?.data || [], [data]);
  const paginationParams = data?.pagination || {
    total: 0,
    page: 1,
    limit,
    totalPages: 1,
  };
  const tabCounts = data?.counts || { college: 0, university: 0 };

  const handlePageChange = (_event, newPage) => setPage(newPage);
  const handleLimitChange = (event) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(1);
  };

  // --- Export (fetches the FULL tab in one background request, capped at
  // the backend's export limit — never affects what the table renders) ---
  const [triggerExportFetch, { isFetching: isExporting }] = useLazyGetLmsAccountsQuery();
  const fetchAllForExport = async () => {
    const result = await triggerExportFetch({
      level: activeTab,
      search: searchQuery,
      page: 1,
      limit: EXPORT_PAGE_LIMIT,
      departmentId,
      programId,
      semesterId,
    }).unwrap();
    return result?.data || [];
  };

  // --- Edit (LMS email + password) ---
  const [editTarget, setEditTarget] = useState(null);
  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    reset: resetEditForm,
    formState: { errors: editErrors },
  } = useForm({ defaultValues: { email: "", password: "", confirmPassword: "" } });
  const [updateLmsCredentials, { isLoading: isSavingCredentials }] =
    useUpdateLmsCredentialsMutation();

  const openEditModal = (account) => {
    setEditTarget(account);
    resetEditForm({ email: account.email || "", password: "", confirmPassword: "" });
  };
  const closeEditModal = () => {
    setEditTarget(null);
    resetEditForm({ email: "", password: "", confirmPassword: "" });
  };

  const onEditSubmit = async (formValues) => {
    if (formValues.password && formValues.password !== formValues.confirmPassword) {
      openAlert({ message: "Passwords do not match.", severity: "warning" });
      return;
    }
    try {
      const payload = { authId: editTarget._id, email: formValues.email?.trim() };
      if (formValues.password?.trim()) payload.password = formValues.password.trim();
      await updateLmsCredentials(payload).unwrap();
      openAlert({ message: "LMS credentials updated successfully.", severity: "success" });
      closeEditModal();
    } catch (error) {
      openAlert({
        message: error?.data?.message || "Failed to update LMS credentials.",
        severity: "error",
      });
    }
  };

  // --- Row selection (page-level + "whole tab") ---
  const [selectedIds, setSelectedIds] = useState(new Set());
  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const allVisibleSelected = accounts.length > 0 && accounts.every((a) => selectedIds.has(a._id));
  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (accounts.length > 0 && accounts.every((a) => prev.has(a._id))) {
        const next = new Set(prev);
        accounts.forEach((a) => next.delete(a._id));
        return next;
      }
      const next = new Set(prev);
      accounts.forEach((a) => next.add(a._id));
      return next;
    });
  }, [accounts]);
  const clearSelection = () => setSelectedIds(new Set());

  // Pulls every id in the active tab — deliberately ignores the search box
  // (unlike fetchAllForExport, which stays scoped to whatever's currently
  // typed there) so "Select all" always means every student in this tab,
  // not just whichever subset the search happens to be narrowed to right
  // now. This is how "whole list at a time" is satisfied without a
  // dedicated "select all matching" backend endpoint.
  const [isSelectingAllInTab, setIsSelectingAllInTab] = useState(false);
  const selectAllInTab = async () => {
    setIsSelectingAllInTab(true);
    try {
      const result = await triggerExportFetch({
        level: activeTab,
        search: "",
        page: 1,
        limit: EXPORT_PAGE_LIMIT,
      }).unwrap();
      setSelectedIds(new Set((result?.data || []).map((r) => r._id)));
    } catch {
      openAlert({ message: "Failed to select all accounts in this tab.", severity: "error" });
    } finally {
      setIsSelectingAllInTab(false);
    }
  };

  const selectedCount = selectedIds.size;

  // --- Block / Unblock ---
  const [statusTarget, setStatusTarget] = useState(null); // { account, nextStatus }
  const [toggleLmsStatus, { isLoading: isTogglingStatus }] = useToggleLmsStatusMutation();

  const openStatusModal = (account) => {
    setStatusTarget({
      account,
      nextStatus: account.status === "ACTIVE" ? "BLOCKED" : "ACTIVE",
    });
  };
  const closeStatusModal = () => setStatusTarget(null);

  const confirmToggleStatus = async () => {
    if (!statusTarget) return;
    try {
      await toggleLmsStatus({
        authIds: [statusTarget.account._id],
        status: statusTarget.nextStatus,
      }).unwrap();
      openAlert({
        message: `Account ${statusTarget.nextStatus === "ACTIVE" ? "unblocked" : "blocked"} successfully.`,
        severity: "success",
      });
      closeStatusModal();
    } catch (error) {
      openAlert({
        message: error?.data?.message || "Failed to update account status.",
        severity: "error",
      });
    }
  };

  // Bulk block/unblock reuses the exact same endpoint confirmToggleStatus
  // already calls — it always accepted an array of ids, it just never had a
  // multi-select UI in front of it before.
  const bulkToggleStatus = async (status) => {
    if (selectedCount === 0) return;
    try {
      await toggleLmsStatus({ authIds: Array.from(selectedIds), status }).unwrap();
      openAlert({
        message: `${selectedCount} account(s) ${status === "ACTIVE" ? "unblocked" : "blocked"} successfully.`,
        severity: "success",
      });
      clearSelection();
    } catch (error) {
      openAlert({
        message: error?.data?.message || "Failed to update account status.",
        severity: "error",
      });
    }
  };
  const handleBulkBlock = () => bulkToggleStatus("BLOCKED");
  const handleBulkUnblock = () => bulkToggleStatus("ACTIVE");

  // --- Generate LMS Email (single via one-item array, or bulk) ---
  const [bulkGenerateLmsEmails, { isLoading: isGeneratingEmails }] =
    useBulkGenerateLmsEmailsMutation();

  const runGenerateEmails = async (authIds) => {
    try {
      const result = await bulkGenerateLmsEmails({ authIds }).unwrap();
      openAlert({ message: result.message, severity: "success" });
      if (authIds.length > 1) clearSelection();
    } catch (error) {
      openAlert({
        message: error?.data?.message || "Failed to generate LMS email(s).",
        severity: "error",
      });
    }
  };
  const handleGenerateEmail = (account) => runGenerateEmails([account._id]);
  const handleBulkGenerateEmails = () => {
    if (selectedCount === 0) return;
    runGenerateEmails(Array.from(selectedIds));
  };

  // --- Reset LMS Password (auto-generated; single or bulk) — the result
  // is shown in a modal since the plaintext password is never visible again
  // once saved (hashed on the backend).
  const [bulkResetLmsPasswords, { isLoading: isResettingPasswords }] =
    useBulkResetLmsPasswordsMutation();
  const [passwordResults, setPasswordResults] = useState(null); // [{ name, rollNumber, email, newPassword }]

  const runResetPasswords = async (authIds) => {
    try {
      const result = await bulkResetLmsPasswords({ authIds }).unwrap();
      setPasswordResults(result.data);
      if (authIds.length > 1) clearSelection();
    } catch (error) {
      openAlert({
        message: error?.data?.message || "Failed to reset password(s).",
        severity: "error",
      });
    }
  };
  const handleResetPassword = (account) => runResetPasswords([account._id]);
  const handleBulkResetPasswords = () => {
    if (selectedCount === 0) return;
    runResetPasswords(Array.from(selectedIds));
  };
  const closePasswordResults = () => setPasswordResults(null);

  // --- Export (whole tab, not just the currently-rendered page) ---
  const exportPDF = async (title) => {
    try {
      const rows = await fetchAllForExport();
      exportRowsToPDF({
        title,
        columns: EXPORT_COLUMNS,
        rows,
        filename: `${title.replace(/\s+/g, "_")}_LMS_Accounts.pdf`,
      });
    } catch {
      openAlert({ message: "Failed to export PDF.", severity: "error" });
    }
  };
  const exportExcel = async (title) => {
    try {
      const rows = await fetchAllForExport();
      exportRowsToExcel({
        columns: EXPORT_COLUMNS,
        rows,
        filename: `${title.replace(/\s+/g, "_")}_LMS_Accounts_${new Date().toISOString().slice(0, 10)}.xlsx`,
        sheetName: title.slice(0, 31),
      });
    } catch {
      openAlert({ message: "Failed to export Excel.", severity: "error" });
    }
  };

  return {
    activeTab,
    setActiveTab,
    searchInput,
    setSearchInput,
    accounts,
    paginationParams,
    tabCounts,
    page,
    limit,
    handlePageChange,
    handleLimitChange,
    isLoading: isLoading || isFetching,
    isExporting,
    refetch,
    exportPDF,
    exportExcel,

    catalogData,
    departmentId,
    programId,
    semesterId,
    handleDepartmentChange,
    handleProgramChange,
    setSemesterId,
    clearCatalogFilters,

    editTarget,
    isEditModalOpen: Boolean(editTarget),
    openEditModal,
    closeEditModal,
    editControl,
    editErrors,
    onEditSubmit: handleEditSubmit(onEditSubmit),
    isSavingCredentials,

    statusTarget,
    isStatusModalOpen: Boolean(statusTarget),
    openStatusModal,
    closeStatusModal,
    confirmToggleStatus,
    isTogglingStatus,

    selectedIds,
    selectedCount,
    toggleSelect,
    allVisibleSelected,
    toggleSelectAll,
    clearSelection,
    selectAllInTab,
    isSelectingAllInTab,

    handleBulkBlock,
    handleBulkUnblock,

    handleGenerateEmail,
    handleBulkGenerateEmails,
    isGeneratingEmails,

    handleResetPassword,
    handleBulkResetPasswords,
    isResettingPasswords,
    passwordResults,
    isPasswordResultsOpen: Boolean(passwordResults),
    closePasswordResults,
  };
};
