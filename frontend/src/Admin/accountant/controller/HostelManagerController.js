import { useState, useMemo, useCallback } from "react";
import {
  useGetHostelAllocationsQuery,
  useGetHostelChallansQuery,
  useGetHostelStatsQuery,
  useVacateHostelSeatMutation,
  useGetStudentsQuery,
  useAssignHostelSeatMutation,
  useGenerateHostelChallanMutation,
  useUpdateHostelAllocationMutation, // ✅ Added for fee/room updates
} from "../api/hostelApi";
import {
  useMarkChallanAsPaidMutation,
  useDeleteChallanMutation,
  useUpdateFineAndDueDateMutation,
} from "../api/studentChallanApi";

export const useHostelManagerController = () => {
  const [activeTab, setActiveTab] = useState("allocations");
  const [searchQ, setSearchQ] = useState("");
  const [monthFilter, setMonthFilter] = useState(""); // Format: "YYYY-MM"

  const [showAssignModal, setShowAssign] = useState(false);
  const [showBulkModal, setShowBulk] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [editingAllocation, setEditingAllocation] = useState(null); // ✅ Edit State

  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("dueDate");
  const [sortDir, setSortDir] = useState("desc");
  const [feeSelected, setFeeSelected] = useState(new Set());
  const [payingId, setPayingId] = useState(null);

  // ── Queries ──
  const {
    data: allocData,
    isLoading: allocLoading,
    refetch: refetchAlloc,
  } = useGetHostelAllocationsQuery();
  const {
    data: challanData,
    isLoading: challanLoading,
    refetch: refetchChallans,
  } = useGetHostelChallansQuery();
  const { data: statsData, isLoading: statsLoading } = useGetHostelStatsQuery();
  const { data: studentsData, isLoading: studentsLoading } =
    useGetStudentsQuery({ status: "active", limit: 500 });

  // ── Mutations ──
  const [vacate, { isLoading: vacating }] = useVacateHostelSeatMutation();
  const [assignSeat, { isLoading: assignLoading }] =
    useAssignHostelSeatMutation();
  const [generateBulkChallans, { isLoading: bulkLoading }] =
    useGenerateHostelChallanMutation();
  const [markPaid, { isLoading: paying }] = useMarkChallanAsPaidMutation();
  const [deleteChallan, { isLoading: deleting }] = useDeleteChallanMutation();
  const [updateFineDue, { isLoading: updFine }] =
    useUpdateFineAndDueDateMutation();
  const [updateAlloc, { isLoading: updAllocLoading }] =
    useUpdateHostelAllocationMutation(); // ✅ Hooked up for Allocations

  const stats = statsData?.data ?? {};

  const allocations = useMemo(
    () =>
      Array.isArray(allocData?.data)
        ? allocData.data
        : Array.isArray(allocData)
          ? allocData
          : [],
    [allocData],
  );

  const challans = useMemo(
    () =>
      Array.isArray(challanData?.data)
        ? challanData.data
        : Array.isArray(challanData)
          ? challanData
          : [],
    [challanData],
  );

  const rawStudents = studentsData?.students ?? studentsData?.data;
  const students = useMemo(
    () => (Array.isArray(rawStudents) ? rawStudents : []),
    [rawStudents],
  );

  // ── Filtering Logic ──
  const filteredAllocations = useMemo(() => {
    if (!searchQ.trim()) return allocations;
    const lq = searchQ.toLowerCase();
    return allocations.filter((a) =>
      [
        a.studentId?.personalInfo?.fullName,
        a.studentId?.studentId,
        a.hostelName,
        a.roomNumber,
      ].some((v) => v?.toLowerCase().includes(lq)),
    );
  }, [allocations, searchQ]);

  const filteredChallans = useMemo(() => {
    let list = challans;

    // 1. Status Filter
    if (statusFilter !== "all")
      list = list.filter((c) => c.status === statusFilter);

    // 2. Month Filter ✅ (FIXED: Now strictly filtering based on dueDate)
    if (monthFilter) {
      list = list.filter((c) => {
        if (!c.dueDate) return false;
        const date = new Date(c.dueDate);
        const challanMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        return challanMonth === monthFilter;
      });
    }

    // 3. Search Query
    if (searchQ.trim()) {
      const lq = searchQ.toLowerCase();
      list = list.filter((c) =>
        [
          c.studentId?.personalInfo?.fullName,
          c.studentId?.studentId,
          c.challanNo,
        ].some((v) => v?.toLowerCase().includes(lq)),
      );
    }

    return [...list].sort((a, b) => {
      let va, vb;
      switch (sortKey) {
        case "issueDate":
          va = new Date(a.issueDate ?? a.createdAt);
          vb = new Date(b.issueDate ?? b.createdAt);
          break;
        case "dueDate":
          va = new Date(a.dueDate);
          vb = new Date(b.dueDate);
          break;
        case "netAmount":
          va = a.netAmount ?? 0;
          vb = b.netAmount ?? 0;
          break;
        default:
          va = a.challanNo ?? "";
          vb = b.challanNo ?? "";
      }
      return sortDir === "asc" ? (va > vb ? 1 : -1) : va < vb ? 1 : -1;
    });
  }, [challans, searchQ, statusFilter, monthFilter, sortKey, sortDir]);

  const challanCounts = useMemo(() => {
    const m = { all: challans.length };
    challans.forEach((c) => (m[c.status] = (m[c.status] ?? 0) + 1));
    return m;
  }, [challans]);

  const handleVacate = async (id, name) => {
    if (
      !window.confirm(`Vacate hostel seat for ${name}? This cannot be undone.`)
    )
      return;
    try {
      await vacate(id).unwrap();
      refetchAlloc();
    } catch (err) {
      alert(err?.data?.message ?? "Failed to vacate seat.");
    }
  };

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const toggleAllFees = useCallback(
    () =>
      setFeeSelected((prev) =>
        prev.size === filteredChallans.length && filteredChallans.length > 0
          ? new Set()
          : new Set(filteredChallans.map((c) => c._id)),
      ),
    [filteredChallans],
  );

  const toggleOneFee = (id) =>
    setFeeSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return {
    activeTab,
    setActiveTab,
    searchQ,
    setSearchQ,
    monthFilter,
    setMonthFilter,
    showAssignModal,
    setShowAssign,
    showBulkModal,
    setShowBulk,
    selectedChallan,
    setSelectedChallan,
    editingAllocation,
    setEditingAllocation, // ✅ Passed for Edit Modal
    allocLoading,
    challanLoading,
    statsLoading,
    vacating,
    stats,
    allocations,
    challans,
    filteredAllocations,
    filteredChallans,
    handleVacate,
    refetchAlloc,
    refetchChallans,
    statusFilter,
    setStatusFilter,
    sortKey,
    sortDir,
    handleSort,
    feeSelected,
    setFeeSelected,
    toggleAllFees,
    toggleOneFee,
    payingId,
    challanCounts,

    // API actions
    students,
    studentsLoading,
    assignSeat,
    assignLoading,
    generateBulkChallans,
    bulkLoading,
    markPaid,
    paying,
    deleteChallan,
    deleting,
    updateFineDue,
    updFine,
    updateAlloc, 
    updAllocLoading,
  };
};
