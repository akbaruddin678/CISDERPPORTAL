import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  X,
  AlertCircle,
  Calendar,
  Save,
  Loader2,
  FileText,
  Download,
  CheckSquare,
  Square,
  RefreshCw,
  TrendingUp,
  Clock,
  ChevronUp,
  ChevronDown,
  Minus,
  FileSpreadsheet,
  Trash2,
  Eye,
  Receipt,
} from "lucide-react";
import { Checkbox } from "@mui/material";

// --- API HOOKS ---
import {
  useGetChallansPaginatedQuery,
  useLazyGetChallansPaginatedQuery,
  useUpdateFineAndDueDateMutation,
  useBulkUpdateFineAndDueDateMutation,
  useTriggerOverdueProcessingMutation,
  useDeleteChallanMutation,
  useRenewChallanMutation,
  useBulkRenewChallansMutation,
} from "../api/studentChallanApi";
import { useGetTermsQuery, useGetDepartmentsQuery } from "../api/depsemtermpro";
import { useLazyGetStudentsQuery } from "../api/accountantstudentApi";
import { ConfirmationModal } from "../common/Feedback";
import { DetailModal } from "../view/Challan/ChallanModals";
import RenewConflictDialog from "../view/Challan/RenewConflictDialog";
import InvoiceSheetModal from "../view/Challan/InvoiceSheetModal";
import { exportInvoiceSheet } from "../common/invoiceSheetExport";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// The only real fee categories a challan's free-form `challanType` string
// ever gets built from (see StudentChallanService.generate()) — "Academic"
// here means "tuition/installment", matched exactly the same way the
// backend's own `type` filter already does (challanType is a joined
// string like "TUITION_EXAM", not a fixed enum, hence substring buckets).
const CHALLAN_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "tuition", label: "Academic (Tuition/Installment)" },
  { value: "exam", label: "Exam" },
  { value: "admission", label: "Admission" },
  { value: "readmission", label: "Readmission" },
  { value: "misc", label: "Misc / General" },
];

// --- HELPERS ---
const fmtPKR = (val) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(val || 0);

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");

const isOverdue = (c) => {
  if (c.status === "overdue") return true;
  if (c.dueDate && c.status !== "paid") {
    return new Date(c.dueDate) < new Date();
  }
  return false;
};

// --- SUB-COMPONENTS ---

const StatCard = ({ label, value, sub, icon, accent }) => {
  const accents = {
    rose: "bg-rose-50 border-rose-100 text-rose-600",
    amber: "bg-amber-50 border-amber-100 text-amber-600",
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-600",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-600",
  };
  const iconAccents = {
    rose: "bg-rose-100 text-rose-600",
    amber: "bg-amber-100 text-amber-600",
    indigo: "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
  };
  return (
    <div
      className={`flex items-center gap-3.5 px-5 py-3.5 bg-white border rounded-2xl shadow-sm ${accents[accent] || "border-slate-200"}`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconAccents[accent] || "bg-slate-100 text-slate-500"}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {label}
        </p>
        <p className="text-lg font-bold text-slate-900 leading-tight">
          {value}
        </p>
        {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

const StatusPill = ({ status }) => {
  const cfg = {
    overdue: "bg-rose-50 text-rose-700 border-rose-200",
    issued: "bg-amber-50 text-amber-700 border-amber-200",
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const dots = {
    overdue: "bg-rose-500",
    issued: "bg-amber-400",
    paid: "bg-emerald-500",
  };
  const s = status || "issued";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg[s] || cfg.issued}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dots[s] || dots.issued}`} />
      {s}
    </span>
  );
};

// Inline editable fine cell
const FineCell = ({ challan, onSave, isSaving }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(challan.fineAmount || 0);

  // Same re-sync reasoning as DueDateCell — otherwise re-opening the
  // editor shows a stale value from before the last save.
  useEffect(() => {
    if (!editing) setVal(challan.fineAmount || 0);
  }, [challan.fineAmount, editing]);

  const handleSave = async () => {
    if (Number(val) === challan.fineAmount) {
      setEditing(false);
      return;
    }
    await onSave(challan._id, { fineAmount: Number(val) });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 justify-end">
        <input
          type="number"
          autoFocus
          className="w-24 text-right bg-rose-50 border border-rose-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-rose-700 outline-none focus:ring-2 focus:ring-rose-300"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-6 h-6 rounded-md bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 transition-colors"
        >
          {isSaving ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <Save size={10} />
          )}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="w-6 h-6 rounded-md bg-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-300 transition-colors"
        >
          <X size={10} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-center justify-end gap-1.5 w-full text-right"
      title="Click to edit fine"
    >
      <span
        className={`font-mono font-bold text-sm ${challan.fineAmount > 0 ? "text-rose-600" : "text-slate-400"}`}
      >
        {challan.fineAmount > 0 ? fmtPKR(challan.fineAmount) : "—"}
      </span>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-slate-400 font-medium">
        edit
      </span>
    </button>
  );
};

// Inline editable due date cell
const DueDateCell = ({ challan, onSave, isSaving }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(
    challan.dueDate
      ? new Date(challan.dueDate).toISOString().split("T")[0]
      : "",
  );

  // `val` is only seeded once via useState's initializer — without this,
  // re-opening the editor after a save (or after the row's data changes
  // for any other reason) would show whatever was typed last time instead
  // of the actual current due date, since the same component instance is
  // reused across renders (stable `key={c._id}`).
  useEffect(() => {
    if (!editing) {
      setVal(
        challan.dueDate
          ? new Date(challan.dueDate).toISOString().split("T")[0]
          : "",
      );
    }
  }, [challan.dueDate, editing]);

  const handleSave = async () => {
    await onSave(challan._id, { dueDate: val });
    setEditing(false);
  };

  const isPast =
    challan.dueDate &&
    new Date(challan.dueDate) < new Date() &&
    challan.status !== "paid";

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="date"
          autoFocus
          className="bg-amber-50 border border-amber-300 rounded-lg px-2 py-1 text-xs font-bold text-amber-800 outline-none focus:ring-2 focus:ring-amber-300"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-6 h-6 rounded-md bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700"
        >
          {isSaving ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <Save size={10} />
          )}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="w-6 h-6 rounded-md bg-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-300"
        >
          <X size={10} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-center gap-1.5 text-left"
      title="Click to edit due date"
    >
      <span
        className={`text-xs font-semibold ${isPast ? "text-rose-600" : "text-slate-600"}`}
      >
        {fmtDate(challan.dueDate)}
      </span>
      {isPast && <Clock size={11} className="text-rose-400" />}
      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-slate-400 font-medium">
        edit
      </span>
    </button>
  );
};

// One box doing double duty: free-text search (matches student name OR
// invoice/challan no, via the existing `search` filter) AND a live
// dropdown of matching students to pin the whole list to exactly one of
// them. Previously this was a second, separate "Select a student..." box
// sitting next to the original search bar — confusing since both looked
// like "search for a student." Controlled by the parent's own
// `searchText`/`onSearchTextChange` (the same state that drives the
// `search` query param) so there's only one input, one place to type.
const StudentPicker = ({
  student,
  onSelect,
  onClear,
  searchText,
  onSearchTextChange,
}) => {
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchText), 350);
    return () => clearTimeout(handler);
  }, [searchText]);

  const [fetchStudents, { data: res, isFetching }] = useLazyGetStudentsQuery();

  useEffect(() => {
    if (!student && debouncedQuery.trim().length >= 2) {
      fetchStudents({ search: debouncedQuery.trim(), limit: 8 });
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [debouncedQuery, student, fetchStudents]);

  const results = Array.isArray(res?.data?.data)
    ? res.data.data
    : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.students)
        ? res.data.students
        : [];

  if (student) {
    return (
      <div className="flex-1 flex items-center px-4">
        <div className="flex items-center gap-2 px-3 py-1.5 my-2 bg-indigo-50 border border-indigo-100 rounded-lg">
          <span className="text-sm font-bold text-indigo-700 truncate max-w-[200px]">
            {student.name}
          </span>
          <span className="text-xs text-indigo-400">#{student.regNo}</span>
          <button
            onClick={onClear}
            className="text-indigo-400 hover:text-indigo-700 p-0.5"
            title="Clear student"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex items-center px-4 focus-within:bg-indigo-50/30 transition-colors">
      <Search size={15} className="text-slate-400 mr-3 shrink-0" />
      <input
        type="text"
        placeholder="Search by student name, invoice no, or select a student..."
        className="flex-1 py-3 bg-transparent text-sm outline-none text-slate-800 placeholder:text-slate-400"
        value={searchText}
        onChange={(e) => onSearchTextChange(e.target.value)}
        onFocus={() => searchText.trim().length >= 2 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
      />
      {searchText && (
        <button
          onClick={() => onSearchTextChange("")}
          className="text-slate-400 hover:text-slate-600 p-1"
        >
          <X size={14} />
        </button>
      )}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-50">
            Matching students — click to pin
          </div>
          {isFetching ? (
            <div className="p-3 text-xs text-slate-400 text-center">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-xs text-slate-400 text-center">No students found.</div>
          ) : (
            results.map((s) => (
              <button
                key={s._id}
                onMouseDown={() => {
                  onSelect({
                    id: s._id,
                    name: s.personalInfo?.fullName || "Unknown",
                    regNo: s.studentId || "N/A",
                  });
                  onSearchTextChange("");
                }}
                className="w-full flex flex-col items-start px-3 py-2 hover:bg-indigo-50 text-left border-b border-slate-50 last:border-0"
              >
                <span className="text-sm font-semibold text-slate-700">
                  {s.personalInfo?.fullName || "Unknown"}
                </span>
                <span className="text-[11px] text-slate-400">{s.studentId || "N/A"}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---
const FineDueDateManagement = () => {
  const [filters, setFilters] = useState({
    termId: "",
    departmentId: "",
    search: "",
    status: "overdue",
    type: "",
    month: "",
  });
  // Kept separate from `filters` since it carries a display name/regNo
  // alongside the id the query actually filters on (studentId).
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selection, setSelection] = useState([]);
  const [page, setPage] = useState(1);
  const [challansList, setChallansList] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [invoiceSheetOpen, setInvoiceSheetOpen] = useState(false);
  const [isGeneratingInvoiceSheet, setIsGeneratingInvoiceSheet] = useState(false);
  const [bulkFine, setBulkFine] = useState("");
  const [bulkDate, setBulkDate] = useState("");
  const [actionPanelOpen, setActionPanelOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  // Bulk renew can return several conflicts at once (each needing its own
  // shift/merge decision) — resolved one at a time, oldest first.
  const [renewConflictQueue, setRenewConflictQueue] = useState([]);
  const activeRenewConflict = renewConflictQueue[0] || null;

  const [triggerAutoFine] = useTriggerOverdueProcessingMutation();

  useEffect(() => {
    triggerAutoFine();
  }, [triggerAutoFine]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => clearTimeout(handler);
  }, [filters.search]);

  useEffect(() => {
    setPage(1);
    setChallansList([]);
    setSelection([]);
  }, [
    debouncedSearch,
    filters.termId,
    filters.departmentId,
    filters.status,
    filters.type,
    filters.month,
    selectedStudent?.id,
  ]);

  const { data: termsRes } = useGetTermsQuery();
  const { data: deptRes } = useGetDepartmentsQuery();
  const terms = termsRes?.data || [];
  const departments = deptRes?.data || [];

  const {
    data: challansRes,
    isFetching,
    refetch,
  } = useGetChallansPaginatedQuery({
    ...filters,
    search: debouncedSearch,
    studentId: selectedStudent?.id || "",
    page,
    limit: 50,
    excludeType: "hostel",
  });

  const [fetchFullDataForExport] = useLazyGetChallansPaginatedQuery();
  const [updateSingle, { isLoading: isUpdatingSingle }] =
    useUpdateFineAndDueDateMutation();
  const [updateBulk, { isLoading: isUpdatingBulk }] =
    useBulkUpdateFineAndDueDateMutation();
  const [deleteChallanMutation, { isLoading: isDeleting }] =
    useDeleteChallanMutation();
  const [bulkRenewMutation, { isLoading: isBulkRenewing }] =
    useBulkRenewChallansMutation();
  const [renewChallanMutation, { isLoading: isRenewingOne }] =
    useRenewChallanMutation();

  const isInitialLoad = isFetching && page === 1 && challansList.length === 0;
  const isFetchingMore = isFetching && page > 1;
  const isSaving = isUpdatingSingle || isUpdatingBulk;

  const globalOverdueCount = challansRes?.data?.totalItems || 0;
  const globalTotalFines = challansRes?.data?.totalFines || 0;
  const totalPages = challansRes?.data?.totalPages || 1;

  useEffect(() => {
    if (challansRes?.data?.challans) {
      const fetched = challansRes.data.challans;
      setChallansList((prev) => {
        if (page === 1) return fetched;
        const newItems = fetched.filter(
          (n) => !prev.some((p) => p._id === n._id),
        );
        return [...prev, ...newItems];
      });
    }
  }, [challansRes, page]);

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (
      scrollHeight - scrollTop <= clientHeight + 200 &&
      !isFetching &&
      page < totalPages
    ) {
      setPage((p) => p + 1);
    }
  };

  const allSelected =
    selection.length === challansList.length && challansList.length > 0;
  const someSelected = selection.length > 0 && !allSelected;

  const toggleSelectAll = () =>
    setSelection(allSelected ? [] : challansList.map((c) => c._id));

  const toggleRow = (id) =>
    setSelection((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  // Patches the already-loaded list in place with the server's real
  // post-save values (status/fineAmount can change again inside the
  // backend's recalculateFine — e.g. extending a due date past today
  // clears the overdue fine automatically) — rather than calling
  // refetch(), which only re-fetches the CURRENT page. For anyone who's
  // scrolled past page 1, the merge logic that stitches infinite-scroll
  // pages together explicitly skips any id already in the list, so a
  // refetch silently never showed the update for rows loaded earlier —
  // this is what made editing look like it "didn't work." Only known
  // response fields are merged (not the whole object), since the API
  // response isn't populated the way the list's studentId/programId are.
  const patchChallan = (id, updated) => {
    if (!updated) return;
    setChallansList((prev) =>
      prev.map((c) =>
        c._id === id
          ? {
              ...c,
              dueDate: updated.dueDate ?? c.dueDate,
              fineAmount: updated.fineAmount ?? c.fineAmount,
              status: updated.status ?? c.status,
              netAmount: updated.netAmount ?? c.netAmount,
              remainingAmount: updated.remainingAmount ?? c.remainingAmount,
              paidAmount: updated.paidAmount ?? c.paidAmount,
            }
          : c,
      ),
    );
  };

  const handleSingleSave = async (id, payload) => {
    try {
      const result = await updateSingle({ id, ...payload }).unwrap();
      patchChallan(id, result?.data);
    } catch {
      alert("Failed to update record.");
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    try {
      await deleteChallanMutation({ id }).unwrap();
      setChallansList((prev) => prev.filter((c) => c._id !== id));
      setSelection((prev) => prev.filter((x) => x !== id));
    } catch (e) {
      alert(e?.data?.message || "Failed to delete challan.");
    }
    setConfirmDeleteId(null);
  };

  // Renews every selected overdue installment. Anything not eligible
  // (not overdue, not an installment, already deleted) comes back in
  // `errors` and is just reported, not silently dropped. Anything that
  // hits another installment already sitting in its shifted target month
  // comes back in `conflicts` and is queued for the accountant to resolve
  // one at a time via the same dialog Challan Management's Renew Overdue
  // tab uses.
  const handleBulkRenew = async () => {
    if (!selection.length) return;
    try {
      const res = await bulkRenewMutation(selection).unwrap();
      const { renewedCount, conflictCount, errorCount, conflicts, renewed } =
        res.data || {};
      const renewedIds = new Set((renewed || []).map((c) => c._id));
      setChallansList((prev) => prev.filter((c) => !renewedIds.has(c._id)));
      setSelection([]);
      if (conflicts?.length) {
        setRenewConflictQueue(
          conflicts.map((cf) => ({
            challanId: cf.challanId,
            targetMonth: cf.targetMonth,
            conflictingChallan: cf.conflictingChallan,
          })),
        );
      }
      alert(
        `Renewed ${renewedCount || 0} challan(s).` +
          (conflictCount ? ` ${conflictCount} need a decision.` : "") +
          (errorCount ? ` ${errorCount} failed.` : ""),
      );
    } catch (e) {
      alert(e?.data?.message || "Bulk renew failed.");
    }
  };

  const resolveActiveRenewConflict = async (resolution) => {
    if (!activeRenewConflict) return;
    try {
      await renewChallanMutation({
        id: activeRenewConflict.challanId,
        resolution,
      }).unwrap();
      setChallansList((prev) =>
        prev.filter((c) => c._id !== activeRenewConflict.challanId),
      );
    } catch (e) {
      alert(e?.data?.message || "Renew failed.");
    }
    setRenewConflictQueue((prev) => prev.slice(1));
  };

  const handleBulkApply = async () => {
    if (!selection.length) return;
    if (!bulkFine && !bulkDate)
      return alert("Enter a fine amount or due date to apply.");
    try {
      const payload = {
        fineAmount: bulkFine !== "" ? Number(bulkFine) : undefined,
        dueDate: bulkDate || undefined,
      };
      const result = await updateBulk({ ids: selection, ...payload }).unwrap();
      (result?.data || []).forEach((updated) =>
        patchChallan(updated._id, updated),
      );
      setSelection([]);
      setBulkFine("");
      setBulkDate("");
      setActionPanelOpen(false);
    } catch {
      alert("Bulk update failed.");
    }
  };

  const executeExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetchFullDataForExport({
        ...filters,
        search: debouncedSearch,
        studentId: selectedStudent?.id || "",
        limit: 5000,
        excludeType: "hostel",
      }).unwrap();
      const list = res?.data?.challans || [];
      const headers = [
        "Challan No",
        "Student ID",
        "Name",
        "Program",
        "Status",
        "Due Date",
        "Fine (PKR)",
        "Net Amount (PKR)",
      ];
      const rows = list.map((c) => [
        c.challanNo,
        c.studentId?.studentId,
        c.studentId?.personalInfo?.fullName,
        c.programId?.name,
        c.status,
        fmtDate(c.dueDate),
        c.fineAmount || 0,
        c.netAmount || 0,
      ]);
      const BOM = "\uFEFF";
      const csv = [headers, ...rows]
        .map((r) =>
          r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");
      const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Fine_Report_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  // Same underlying data as the CSV export, rendered as a PDF instead —
  // built entirely client-side (jsPDF + autoTable, dynamically imported),
  // matching how every other report export in this app works since there
  // is no backend "/api/reports" route for this.
  const executeExportPDF = async () => {
    setIsExporting(true);
    try {
      const res = await fetchFullDataForExport({
        ...filters,
        search: debouncedSearch,
        studentId: selectedStudent?.id || "",
        limit: 5000,
        excludeType: "hostel",
      }).unwrap();
      const list = res?.data?.challans || [];
      if (list.length === 0) {
        alert("No data to export.");
        return;
      }

      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "landscape", format: "a4" });
      doc.setFontSize(15);
      doc.setTextColor(30, 41, 59);
      doc.text("Fine & Due Date Report", 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const statusLabel = filters.status
        ? filters.status.charAt(0).toUpperCase() + filters.status.slice(1)
        : "All";
      doc.text(
        `Generated: ${new Date().toLocaleDateString("en-GB")}  |  Status: ${statusLabel}  |  ${list.length} records`,
        14,
        21,
      );

      autoTable(doc, {
        startY: 26,
        head: [
          [
            "Challan No",
            "Student",
            "Reg No",
            "Program",
            "Status",
            "Due Date",
            "Fine",
            "Net Amount",
          ],
        ],
        body: list.map((c) => [
          c.challanNo || "—",
          c.studentId?.personalInfo?.fullName || "—",
          c.studentId?.studentId || "—",
          c.programId?.name || "—",
          (c.status || "—").toUpperCase(),
          fmtDate(c.dueDate),
          fmtPKR(c.fineAmount),
          fmtPKR(c.netAmount),
        ]),
        theme: "striped",
        styles: { fontSize: 8, cellPadding: 2.2 },
        headStyles: {
          fillColor: [225, 29, 72],
          textColor: 255,
          fontStyle: "bold",
        },
        columnStyles: {
          6: { halign: "right" },
          7: { halign: "right", fontStyle: "bold" },
        },
      });

      doc.save(`Fine_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch {
      alert("PDF export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  // Builds the bulk-upload Invoice Sheet for exactly the rows currently
  // selected via the table checkboxes — reuses the already-loaded challan
  // objects (no extra fetch needed) since `challansList` is populated the
  // same way this action's data requirements need.
  const handleGenerateInvoiceSheet = async ({ fineAmount }) => {
    const selected = challansList.filter((c) => selection.includes(c._id));
    if (selected.length === 0) return;
    setIsGeneratingInvoiceSheet(true);
    try {
      const { generatedCount, skipped } = await exportInvoiceSheet(selected, {
        fineAmount,
      });
      setInvoiceSheetOpen(false);
      // Invoice Number is built from paymentReference (set only once a
      // challan has been synced to EzPay) — anything selected without one
      // yet can't get a valid invoice number, so it's left out and reported
      // rather than silently dropped or given a malformed number.
      if (skipped.length > 0) {
        const names = skipped
          .slice(0, 8)
          .map((s) => `${s.name} (#${s.challanNo})`)
          .join(", ");
        const more = skipped.length > 8 ? ` and ${skipped.length - 8} more` : "";
        alert(
          generatedCount > 0
            ? `Generated ${generatedCount} invoice(s). Skipped ${skipped.length} record(s) with no payment reference yet: ${names}${more}.`
            : `No invoice sheet generated — none of the selected records have a payment reference yet: ${names}${more}.`,
        );
      }
    } catch {
      alert("Failed to generate invoice sheet.");
    } finally {
      setIsGeneratingInvoiceSheet(false);
    }
  };

  const selectionSummary = useMemo(() => {
    const selected = challansList.filter((c) => selection.includes(c._id));
    const totalFines = selected.reduce((s, c) => s + (c.fineAmount || 0), 0);
    const totalNet = selected.reduce((s, c) => s + (c.netAmount || 0), 0);
    return { count: selected.length, totalFines, totalNet };
  }, [selection, challansList]);

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] bg-slate-50 overflow-hidden">
      {/* ── TOP STRIP ── */}
      <div className="px-6 pt-6 pb-0 shrink-0 space-y-4">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-sm shadow-rose-200 shrink-0 mt-0.5">
              <AlertCircle size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                Fine & Deadline Control
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage overdue records and apply late fee adjustments.
              </p>
            </div>
          </div>
          <div className="flex gap-2.5 shrink-0">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
              title="Refresh data"
            >
              <RefreshCw
                size={15}
                className={isFetching ? "animate-spin text-indigo-400" : ""}
              />
            </button>
            <div className="relative">
              <button
                onClick={() => setExportMenuOpen((v) => !v)}
                disabled={isExporting || challansList.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-700 transition-all font-semibold shadow-sm text-sm disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} className="text-emerald-600" />
                )}
                Export
                <ChevronDown size={13} />
              </button>
              {exportMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setExportMenuOpen(false)}
                  />
                  <div className="absolute top-[calc(100%+6px)] right-0 bg-white border border-slate-100 rounded-xl shadow-lg z-50 min-w-[160px] overflow-hidden py-1">
                    <button
                      onClick={() => {
                        setExportMenuOpen(false);
                        executeExport();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 text-left"
                    >
                      <FileSpreadsheet size={14} className="text-emerald-600" />
                      Export to CSV
                    </button>
                    <button
                      onClick={() => {
                        setExportMenuOpen(false);
                        executeExportPDF();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 text-left"
                    >
                      <FileText size={14} className="text-rose-600" />
                      Export to PDF
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={() => {
                        setExportMenuOpen(false);
                        if (selection.length === 0) {
                          alert("Select at least one record first.");
                          return;
                        }
                        setInvoiceSheetOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 text-left"
                    >
                      <Receipt size={14} className="text-indigo-600" />
                      Generate Invoice Sheet
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-3">
          <StatCard
            label="Overdue Records"
            value={globalOverdueCount.toLocaleString()}
            sub="matching current filter"
            icon={<AlertCircle size={16} />}
            accent="rose"
          />
          <StatCard
            label="Total Fines"
            value={fmtPKR(globalTotalFines)}
            sub="cumulative late fees"
            icon={<TrendingUp size={16} />}
            accent="amber"
          />
          {selection.length > 0 && (
            <StatCard
              label="Selected"
              value={`${selectionSummary.count} records`}
              sub={`Net: ${fmtPKR(selectionSummary.totalNet)}`}
              icon={<CheckSquare size={16} />}
              accent="indigo"
            />
          )}
        </div>

        {/* Challan Type + Month scope bar */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex flex-col sm:flex-row gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <select
              className="px-4 py-3 bg-transparent text-sm font-medium text-slate-600 outline-none cursor-pointer min-w-[200px]"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              {CHALLAN_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              className="px-4 py-3 bg-transparent text-sm font-medium text-slate-600 outline-none cursor-pointer min-w-[160px]"
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            >
              <option value="">All Months</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter + search bar */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex flex-col sm:flex-row gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {/* Search / student picker — one box, does both */}
            <StudentPicker
              student={selectedStudent}
              onSelect={setSelectedStudent}
              onClear={() => setSelectedStudent(null)}
              searchText={filters.search}
              onSearchTextChange={(v) => setFilters({ ...filters, search: v })}
            />

            {/* Department */}
            <select
              className="px-4 py-3 bg-transparent text-sm font-medium text-slate-600 outline-none cursor-pointer min-w-[160px]"
              value={filters.departmentId}
              onChange={(e) =>
                setFilters({ ...filters, departmentId: e.target.value })
              }
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Status quick tabs */}
            <div className="flex items-center gap-1 px-3 py-2">
              {[
                {
                  label: "Overdue",
                  val: "overdue",
                  color: "text-rose-600 bg-rose-50 border-rose-200",
                },
                {
                  label: "Pending",
                  val: "issued",
                  color: "text-amber-600 bg-amber-50 border-amber-200",
                },
                {
                  label: "All",
                  val: "",
                  color: "text-slate-600 bg-slate-100 border-slate-200",
                },
              ].map(({ label, val, color }) => (
                <button
                  key={label}
                  onClick={() => setFilters({ ...filters, status: val })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${filters.status === val ? color : "text-slate-400 border-transparent hover:text-slate-600"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── BULK ACTION PANEL (slides in when rows are selected) ── */}
      {selection.length > 0 && (
        <div className="px-6 pt-3 shrink-0">
          <div className="bg-indigo-950 text-white rounded-2xl overflow-hidden shadow-lg shadow-indigo-950/20">
            <button
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-indigo-900 transition-colors"
              onClick={() => setActionPanelOpen((o) => !o)}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-xs font-bold">
                  {selection.length}
                </div>
                <span className="text-sm font-semibold">records selected</span>
                <span className="text-indigo-400 text-xs">
                  — click to {actionPanelOpen ? "collapse" : "expand"} bulk
                  actions
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelection([]);
                  }}
                  className="text-indigo-400 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <X size={12} /> Clear selection
                </button>
                {actionPanelOpen ? (
                  <ChevronUp size={16} className="text-indigo-400" />
                ) : (
                  <ChevronDown size={16} className="text-indigo-400" />
                )}
              </div>
            </button>

            {actionPanelOpen && (
              <div className="px-5 pb-4 pt-0 border-t border-indigo-900">
                <div className="flex flex-wrap items-end gap-4 mt-3">
                  <div>
                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1.5">
                      Set Fine Amount (PKR)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2000"
                      className="w-36 bg-indigo-900 border border-indigo-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-indigo-600"
                      value={bulkFine}
                      onChange={(e) => setBulkFine(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1.5">
                      Set New Due Date
                    </label>
                    <input
                      type="date"
                      className="bg-indigo-900 border border-indigo-700 text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      value={bulkDate}
                      onChange={(e) => setBulkDate(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 pb-0.5">
                    <button
                      onClick={handleBulkApply}
                      disabled={isSaving || (!bulkFine && !bulkDate)}
                      className="flex items-center gap-2 px-5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    >
                      {isSaving ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      Apply to {selection.length} records
                    </button>
                  </div>
                  <p className="text-indigo-400 text-xs self-end pb-1">
                    Leave blank to keep existing value. Only filled fields will
                    be updated.
                  </p>
                </div>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-indigo-900">
                  <button
                    onClick={handleBulkRenew}
                    disabled={isBulkRenewing}
                    className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isBulkRenewing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                    Renew {selection.length} Selected
                  </button>
                  <p className="text-indigo-400 text-xs">
                    Only overdue installments can be renewed — anything else
                    selected is reported, not skipped silently.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DATA TABLE ── */}
      <div className="flex-1 px-6 pb-6 pt-3 min-h-0">
        <div className="h-full bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* Table header */}
          <div className="shrink-0 border-b border-slate-100 bg-slate-50">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr>
                  <th className="px-4 py-3 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {allSelected ? (
                        <CheckSquare size={16} className="text-indigo-600" />
                      ) : someSelected ? (
                        <Minus size={16} className="text-indigo-400" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Student
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Program
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                    Status
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                    Fine
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                    Net Payable
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                    Actions
                  </th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto" onScroll={handleScroll}>
            {isInitialLoad ? (
              <div className="flex flex-col items-center justify-center h-60 gap-3 text-slate-400">
                <Loader2 size={32} className="animate-spin text-rose-400" />
                <p className="text-sm font-semibold">
                  Loading overdue records...
                </p>
              </div>
            ) : challansList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-slate-400">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <FileText size={24} className="opacity-30 text-slate-500" />
                </div>
                <p className="font-bold text-slate-600">No records found</p>
                <p className="text-sm mt-1">Try adjusting your filters.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <tbody className="divide-y divide-slate-100">
                  {challansList.map((c) => {
                    const isSelected = selection.includes(c._id);
                    return (
                      <tr
                        key={c._id}
                        className={`group transition-colors cursor-pointer ${isSelected ? "bg-indigo-50/60" : "hover:bg-slate-50/80"}`}
                        onClick={() => toggleRow(c._id)}
                      >
                        {/* Checkbox */}
                        <td
                          className="px-4 py-3.5 w-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            size="small"
                            checked={isSelected}
                            onChange={() => toggleRow(c._id)}
                            sx={{
                              padding: 0,
                              color: "#cbd5e1",
                              "&.Mui-checked": { color: "#4f46e5" },
                            }}
                          />
                        </td>

                        {/* Student */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${isSelected ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"}`}
                            >
                              {c.studentId?.personalInfo?.fullName?.charAt(0) ||
                                "?"}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-sm leading-none">
                                {c.studentId?.personalInfo?.fullName ||
                                  "Unknown"}
                              </p>
                              <p className="text-[10px] font-mono text-slate-400 mt-1">
                                {c.studentId?.studentId} · #{c.challanNo}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Program */}
                        <td className="px-4 py-3.5">
                          <p className="text-xs font-medium text-slate-600 max-w-[180px] truncate">
                            {c.programId?.name || "—"}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 text-center">
                          <StatusPill status={c.status} />
                        </td>

                        {/* Due Date (inline edit) */}
                        <td
                          className="px-4 py-3.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DueDateCell
                            challan={c}
                            onSave={handleSingleSave}
                            isSaving={isSaving}
                          />
                        </td>

                        {/* Fine (inline edit) */}
                        <td
                          className="px-4 py-3.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FineCell
                            challan={c}
                            onSave={handleSingleSave}
                            isSaving={isSaving}
                          />
                        </td>

                        {/* Net Amount */}
                        <td className="px-4 py-3.5 text-right">
                          <span className="font-mono font-bold text-sm text-slate-900">
                            {fmtPKR(c.netAmount)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td
                          className="px-4 py-3.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setDetailData(c)}
                              title="View Details"
                              className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              onClick={() => c.status !== "paid" && setConfirmDeleteId(c._id)}
                              disabled={c.status === "paid"}
                              title={
                                c.status === "paid"
                                  ? "A paid challan can't be deleted"
                                  : "Delete this challan"
                              }
                              className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-slate-100 disabled:hover:text-slate-500"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Load more indicator */}
            {isFetchingMore && (
              <div className="py-5 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 border-t border-slate-100 bg-slate-50/50">
                <Loader2 size={14} className="animate-spin text-indigo-400" />
                Loading more records...
              </div>
            )}

            {/* End of list indicator */}
            {!isFetching && challansList.length > 0 && page >= totalPages && (
              <div className="py-4 text-center text-xs text-slate-400 border-t border-slate-100">
                All {challansList.length} records loaded
              </div>
            )}
          </div>
        </div>
      </div>

      <DetailModal
        isOpen={!!detailData}
        onClose={() => setDetailData(null)}
        data={detailData}
        student={
          detailData
            ? {
                personalInfo: detailData.studentId?.personalInfo,
                studentId: detailData.studentId?.studentId,
                program: detailData.programId,
                semester: detailData.semesterId,
              }
            : null
        }
      />

      <ConfirmationModal
        isOpen={!!confirmDeleteId}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteConfirmed}
        isLoading={isDeleting}
        title="Delete Challan"
        message="This challan will be cancelled and hidden from active lists. Continue?"
        isDestructive={true}
      />

      <RenewConflictDialog
        data={activeRenewConflict}
        isSubmitting={isRenewingOne}
        onResolve={resolveActiveRenewConflict}
        onClose={() => setRenewConflictQueue((prev) => prev.slice(1))}
      />

      <InvoiceSheetModal
        isOpen={invoiceSheetOpen}
        count={selection.length}
        isGenerating={isGeneratingInvoiceSheet}
        onClose={() => setInvoiceSheetOpen(false)}
        onGenerate={handleGenerateInvoiceSheet}
      />
    </div>
  );
};

export default FineDueDateManagement;
