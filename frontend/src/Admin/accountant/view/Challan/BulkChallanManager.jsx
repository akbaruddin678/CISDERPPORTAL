import React, { useState, useMemo } from "react";
import {
  Filter,
  Calendar,
  Trash2,
  CheckSquare,
  Square,
  Loader2,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  FileText,
  Settings,
  User,
} from "lucide-react";

import { useGetStudentsQuery } from "../../api/accountantstudentApi";
import {
  useGetChallansQuery,
  useGetPreviousDuesSummaryQuery,
} from "../../api/studentChallanApi";
import { useGetBatchInstallmentStatusQuery } from "../../api/installmentApi";

const getInitials = (name) =>
  name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const BulkChallanManager = ({
  terms,
  departments,
  programsAll = [],
  semestersAll = [],
  actions,
  isProcessing,
  miscFeesList = [],
}) => {
  const [filters, setFilters] = useState({
    termId: "",
    departmentId: "",
    programId: "",
    semesterId: "",
    search: "",
  });

  const [selection, setSelection] = useState([]);

  // ✅ NEW STATES: Date and Month
  const [actionDate, setActionDate] = useState("");
  const [billingMonth, setBillingMonth] = useState("");
  // "none" | "fine_only" | "both" — one global choice applied to every
  // selected student's previous unpaid dues (a per-challan choice isn't
  // practical across a whole batch — that level of control lives in the
  // single-generate flow instead).
  const [previousDuesMode, setPreviousDuesMode] = useState("none");
  // Separate, explicit review step for deleting previous unpaid challans
  // outright — student-wise and itemized, never a blind bulk wipe.
  const [showDeleteReview, setShowDeleteReview] = useState(false);
  const [deleteSelections, setDeleteSelections] = useState(new Set());

  const [mode, setMode] = useState("generate");

  const [feeTypes, setFeeTypes] = useState({
    tuition: true,
    admission: false,
    readmission: false,
    exam: false,
    general: false,
  });

  const [selectedMiscFees, setSelectedMiscFees] = useState([]);
  const [showMiscDropdown, setShowMiscDropdown] = useState(false);
  const [bulkExamTitle, setBulkExamTitle] = useState("");

  const { data: studentsRes, isFetching: isFetchingStudents } =
    useGetStudentsQuery(
      { ...filters, excludeLevel: "HSSC", limit: 500 },
      { skip: !filters.departmentId },
    );

  const { data: challansRes, isFetching: isFetchingChallans } =
    useGetChallansQuery(
      filters.termId && filters.departmentId
        ? {
            termId: filters.termId,
            departmentId: filters.departmentId,
            limit: 1000,
          }
        : { skip: true },
    );

  // Whether each currently-selected student has a real (>1 installment)
  // plan for the filtered semester — drives the same Billing Month
  // required/disabled rule used in the single-generate modal. Requires a
  // semester filter to be meaningful (an installment plan is per-semester).
  const { data: installmentStatusRes } = useGetBatchInstallmentStatusQuery(
    { studentIds: selection, semesterId: filters.semesterId },
    { skip: selection.length === 0 || !filters.semesterId },
  );
  // Billing Month is a TUITION-only concept — Admission/Readmission/Exam/
  // Misc fee setups have no month at all, so this must also require
  // "tuition" to actually be one of the selected fee types for this batch,
  // not just that some selected student happens to have a tuition plan.
  // Otherwise generating an Exam-only or Admission-only batch for students
  // who also have tuition installment plans would wrongly show/require a
  // Billing Month.
  const anySelectedHasInstallmentPlan =
    feeTypes.tuition &&
    Object.values(installmentStatusRes?.data || {}).some(Boolean);

  // Previous-dues summary for the currently-selected batch — same
  // eligibility as the single-generate flow's own preview, computed
  // server-side so it can never drift from what generate() actually merges.
  const { data: prevDuesRes } = useGetPreviousDuesSummaryQuery(selection, {
    skip: selection.length === 0,
  });
  const previousDuesTotalAmount = prevDuesRes?.data?.totalAmount || 0;
  const studentsWithPreviousDuesCount =
    prevDuesRes?.data?.totalStudentsWithDues || 0;

  // programsAll/semestersAll are the full, already university-only catalog
  // (excludeLevel:"HSSC" applied once in the parent controller) — cascade
  // them against this component's OWN independent Department/Program
  // selection rather than re-fetching + re-filtering HSSC entities here.
  const universityPrograms = useMemo(() => {
    if (!filters.departmentId) return [];
    return programsAll.filter(
      (p) =>
        String(p.departmentId?._id || p.departmentId) ===
        String(filters.departmentId),
    );
  }, [programsAll, filters.departmentId]);

  const semesters = useMemo(() => {
    if (!filters.programId) return [];
    return semestersAll
      .filter(
        (s) =>
          String(s.programId?._id || s.programId) ===
          String(filters.programId),
      )
      .sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [semestersAll, filters.programId]);

  const students = useMemo(() => {
    const list =
      studentsRes?.data?.students ||
      studentsRes?.data?.data ||
      studentsRes?.data ||
      [];
    return Array.isArray(list) ? list : [];
  }, [studentsRes]);

  const challanMap = useMemo(() => {
    const map = {};
    const list = challansRes?.data?.challans || challansRes?.data || [];
    if (Array.isArray(list)) {
      list.forEach((c) => {
        if (c.status !== "cancelled" && !c.isDeleted) {
          const sId = c.studentId?._id || c.studentId;
          if (sId) map[sId] = c;
        }
      });
    }
    return map;
  }, [challansRes]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      if (key === "departmentId") {
        newFilters.programId = "";
        newFilters.semesterId = "";
      }
      if (key === "programId") {
        newFilters.semesterId = "";
      }
      return newFilters;
    });
    setSelection([]);
    setPreviousDuesMode("none");
    setShowDeleteReview(false);
    setDeleteSelections(new Set());
  };

  const toggleSelectAll = () =>
    setSelection(
      selection.length === students.length ? [] : students.map((s) => s._id),
    );
  const toggleSelectOne = (id) =>
    setSelection((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleTypeChange = (type) => {
    setFeeTypes((prev) => {
      const newState = { ...prev, [type]: !prev[type] };
      if (type === "admission" && newState.admission)
        newState.readmission = false;
      if (type === "readmission" && newState.readmission)
        newState.admission = false;
      if (type === "general") {
        if (newState.general) setShowMiscDropdown(true);
        else {
          setShowMiscDropdown(false);
          setSelectedMiscFees([]);
        }
      }
      if (type === "exam" && !newState.exam) {
        setBulkExamTitle("");
      }
      return newState;
    });
  };

  const toggleMiscFee = (id) =>
    setSelectedMiscFees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleAction = async () => {
    const selectedTypes = Object.keys(feeTypes).filter((k) => feeTypes[k]);

    const isOnlyMisc =
      selectedTypes.length === 1 && selectedTypes.includes("general");
    if (!filters.termId && !isOnlyMisc)
      return alert("Please select a Session/Term first.");

    if (selection.length === 0) return alert("No students selected.");

    if (mode === "generate") {
      if (!actionDate) return alert("Due Date required.");
      // Billing Month only matters when at least one selected student is on
      // an installment plan for this semester — same rule as single-generate.
      if (anySelectedHasInstallmentPlan && !billingMonth)
        return alert(
          "Billing Month required — at least one selected student is on an installment plan.",
        );
      if (selectedTypes.length === 0)
        return alert("Select at least one fee type.");
      if (feeTypes.general && selectedMiscFees.length === 0)
        return alert("Select at least one specific General/Misc fee.");

      const monthLabel = billingMonth ? ` for the month of ${billingMonth}` : "";
      if (
        !window.confirm(
          `Generate Challans for ${selection.length} students${monthLabel}?`,
        )
      )
        return;

      // ✅ PASS dueDate AND billingMonth TO THE GENERATOR
      await actions.generateBulk({
        studentIds: selection,
        termId: filters.termId || null,
        dueDate: actionDate,
        // Never send a billingMonth for a batch that doesn't include
        // tuition at all — even a stale value typed earlier (before
        // tuition was unchecked) must not leak into an Exam/Admission/
        // Misc-only batch.
        billingMonth: feeTypes.tuition ? billingMonth || null : null,
        departmentId: filters.departmentId,
        programId: filters.programId,
        semesterId: filters.semesterId,
        feeTypes: selectedTypes,
        miscFeeIds: selectedMiscFees,
        examTitles: bulkExamTitle.trim() ? [bulkExamTitle.trim()] : [],
        mergeBase: previousDuesMode === "both",
        carryFine: previousDuesMode === "fine_only" || previousDuesMode === "both",
      });
      setSelection([]);
      setPreviousDuesMode("none");
    } else if (mode === "delete") {
      const ids = selection.map((sid) => challanMap[sid]?._id).filter(Boolean);
      if (ids.length === 0)
        return alert("No active challans found for selected students.");
      if (!window.confirm(`Delete ${ids.length} challans?`)) return;
      await actions.bulkDelete(ids);
      setSelection([]);
    } else if (mode === "update_date") {
      if (!actionDate) return alert("Select new Due Date.");
      const ids = selection.map((sid) => challanMap[sid]?._id).filter(Boolean);
      if (ids.length === 0) return alert("No active challans found to update.");
      await actions.bulkUpdateDate(ids, actionDate);
      setSelection([]);
    }
  };

  const isLoading = isProcessing || isFetchingStudents || isFetchingChallans;

  return (
    <div className="flex h-[calc(100vh-160px)] gap-6 animate-in fade-in duration-300">
      <div className="w-[380px] bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col shrink-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex gap-2">
          {[
            {
              id: "generate",
              label: "Generate",
              icon: RefreshCw,
              color: "indigo",
            },
            {
              id: "update_date",
              label: "Update Date",
              icon: Calendar,
              color: "amber",
            },
            { id: "delete", label: "Delete", icon: Trash2, color: "rose" },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => {
                setMode(btn.id);
                setSelection([]);
                setPreviousDuesMode("none");
                setShowDeleteReview(false);
                setDeleteSelections(new Set());
              }}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all ${
                mode === btn.id
                  ? `bg-white text-${btn.color}-600 shadow-sm ring-1 ring-slate-200`
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <btn.icon size={18} /> {btn.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 border-b border-slate-100 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Filter size={14} /> Target Audience
            </h3>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase">
                Session <span className="text-rose-500">*</span>
              </label>
              <select
                className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                value={filters.termId}
                onChange={(e) => handleFilterChange("termId", e.target.value)}
              >
                <option value="">Select Session...</option>
                {terms?.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase">
                Class <span className="text-rose-500">*</span>
              </label>
              <select
                className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                value={filters.departmentId}
                onChange={(e) =>
                  handleFilterChange("departmentId", e.target.value)
                }
              >
                <option value="">Select Class...</option>
                {departments?.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">
                  Program
                </label>
                <select
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-lg disabled:bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                  value={filters.programId}
                  disabled={!filters.departmentId}
                  onChange={(e) =>
                    handleFilterChange("programId", e.target.value)
                  }
                >
                  <option value="">All</option>
                  {universityPrograms.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">
                  Section
                </label>
                <select
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-lg disabled:bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                  value={filters.semesterId}
                  disabled={!filters.programId}
                  onChange={(e) =>
                    handleFilterChange("semesterId", e.target.value)
                  }
                >
                  <option value="">All</option>
                  {semesters.map((s) => (
                    <option key={s._id} value={s._id}>
                      Section {s.number}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Settings size={14} /> Operation Config
            </h3>

            {(mode === "generate" || mode === "update_date") && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
                    onChange={(e) => setActionDate(e.target.value)}
                  />
                </div>
                {/* Billing Month is a TUITION-only concept — required if at
                    least one selected student is on an installment plan
                    for the filtered semester; otherwise still freely
                    pickable for a lump-sum tuition challan. When tuition
                    isn't one of the selected fee types at all (Exam,
                    Admission, Readmission, Misc), there's nothing to pick —
                    those fee setups have no month. */}
                {mode === "generate" &&
                  (feeTypes.tuition ? (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Billing Month{" "}
                        {anySelectedHasInstallmentPlan && (
                          <span className="text-rose-500">*</span>
                        )}
                      </label>
                      <select
                        className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700 cursor-pointer"
                        value={billingMonth}
                        onChange={(e) => setBillingMonth(e.target.value)}
                      >
                        <option value="">Select Month…</option>
                        {MONTHS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Billing Month
                      </label>
                      <div className="w-full p-2.5 border border-slate-200 rounded-lg text-sm text-slate-400 bg-slate-50">
                        Not applicable
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {mode === "generate" && (
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block mt-2">
                  Include Fee Types <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["tuition", "exam", "admission", "readmission"].map((t) => (
                    <label
                      key={t}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer text-[11px] transition-all ${feeTypes[t] ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold" : "bg-white hover:bg-slate-50 text-slate-600"} ${(t === "admission" && feeTypes.readmission) || (t === "readmission" && feeTypes.admission) ? "opacity-50 cursor-not-allowed grayscale" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="accent-indigo-600 w-3.5 h-3.5"
                        checked={feeTypes[t]}
                        onChange={() => handleTypeChange(t)}
                        disabled={
                          (t === "admission" && feeTypes.readmission) ||
                          (t === "readmission" && feeTypes.admission)
                        }
                      />
                      <span className="capitalize">{t}</span>
                    </label>
                  ))}
                  <label
                    className={`col-span-2 flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border cursor-pointer text-[11px] transition-all ${feeTypes.general ? "bg-slate-800 border-slate-900 text-white font-bold" : "bg-white hover:bg-slate-50 text-slate-600"}`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="accent-indigo-400 w-3.5 h-3.5"
                        checked={feeTypes.general}
                        onChange={() => handleTypeChange("general")}
                      />
                      <span>General / Misc Fees</span>
                    </div>
                    {feeTypes.general &&
                      (showMiscDropdown ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      ))}
                  </label>
                </div>

                {feeTypes.exam && (
                  <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-200 animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">
                      Specific Exam Title (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mid-Term Exam (Leave empty for all)"
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium text-slate-700 bg-white"
                      value={bulkExamTitle}
                      onChange={(e) => setBulkExamTitle(e.target.value)}
                    />
                  </div>
                )}

                {feeTypes.general && (
                  <div className="mt-2 bg-slate-50 p-3 rounded-lg border border-slate-200 animate-in slide-in-from-top-2">
                    <div
                      className="flex justify-between items-center mb-2 cursor-pointer"
                      onClick={() => setShowMiscDropdown(!showMiscDropdown)}
                    >
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Select Specific Fees
                      </span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 rounded-full font-bold">
                        {selectedMiscFees.length}
                      </span>
                    </div>
                    <div
                      className={`space-y-1 overflow-y-auto transition-all duration-300 ${showMiscDropdown ? "max-h-40" : "max-h-0 overflow-hidden"}`}
                    >
                      {!miscFeesList || miscFeesList.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2 text-center">
                          No miscellaneous fees defined.
                        </p>
                      ) : (
                        miscFeesList.map((fee) => (
                          <label
                            key={fee._id}
                            className={`flex items-center gap-2 text-xs p-2 rounded cursor-pointer border transition-colors ${selectedMiscFees.includes(fee._id) ? "bg-white border-indigo-200 shadow-sm" : "border-transparent hover:bg-white"}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedMiscFees.includes(fee._id)}
                              onChange={() => toggleMiscFee(fee._id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="flex justify-between w-full">
                              <span className="text-slate-700 truncate font-medium">
                                {fee.title || fee.name || "Misc Fee"}
                              </span>
                              <span className="font-mono text-slate-500 text-[10px] bg-slate-100 px-1.5 rounded ml-2">
                                {fee.amount}
                              </span>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {selection.length > 0 && previousDuesTotalAmount > 0 && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 p-3 rounded-lg space-y-2">
                    <div className="text-[11px] font-bold text-amber-900 leading-tight">
                      Previous Unpaid Dues — {studentsWithPreviousDuesCount} of{" "}
                      {selection.length} selected student
                      {selection.length > 1 ? "s" : ""} have unpaid dues
                      totalling Rs {previousDuesTotalAmount.toLocaleString()}
                    </div>

                    <div className="flex flex-col gap-1">
                      {[
                        { value: "none", label: "Don't include" },
                        { value: "fine_only", label: "Include Fine Only" },
                        { value: "both", label: "Include Both (Base + Fine)" },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-amber-800"
                        >
                          <input
                            type="radio"
                            name="previousDuesMode"
                            checked={previousDuesMode === opt.value}
                            onChange={() => setPreviousDuesMode(opt.value)}
                            className="w-3.5 h-3.5 accent-amber-600"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                    <p className="text-[9px] text-amber-700 font-medium">
                      Applies to every selected student — rolls their own
                      unpaid challans into their new one as itemized lines
                      (e.g. "Installment 1 Fee", "Fine on Admission Fee").
                    </p>

                    <button
                      type="button"
                      onClick={() => setShowDeleteReview((v) => !v)}
                      className="text-[10px] font-bold text-rose-600 underline"
                    >
                      {showDeleteReview
                        ? "Hide delete review"
                        : "Review & Delete Previous Unpaid Challans"}
                    </button>

                    {showDeleteReview && (
                      <div className="border border-rose-200 rounded-lg bg-white max-h-56 overflow-y-auto divide-y divide-rose-100">
                        {selection.filter(
                          (sid) =>
                            prevDuesRes?.data?.perStudent?.[sid]?.items
                              ?.length > 0,
                        ).length === 0 ? (
                          <p className="p-3 text-[10px] text-slate-400 italic">
                            None of the selected students have previous
                            unpaid challans.
                          </p>
                        ) : (
                          selection
                            .filter(
                              (sid) =>
                                prevDuesRes?.data?.perStudent?.[sid]?.items
                                  ?.length > 0,
                            )
                            .map((sid) => {
                              const stu = students.find((s) => s._id === sid);
                              const items =
                                prevDuesRes.data.perStudent[sid].items;
                              return (
                                <div key={sid} className="p-2.5">
                                  <div className="text-[11px] font-bold text-slate-700 mb-1">
                                    {stu?.personalInfo?.fullName ||
                                      stu?.name ||
                                      sid}
                                  </div>
                                  <ul className="space-y-1">
                                    {items.map((item) => (
                                      <li
                                        key={item.challanId}
                                        className="flex items-center justify-between gap-2"
                                      >
                                        <label className="flex items-center gap-1.5 text-[10px] text-slate-600 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={deleteSelections.has(
                                              item.challanId,
                                            )}
                                            onChange={() =>
                                              setDeleteSelections((prev) => {
                                                const next = new Set(prev);
                                                if (next.has(item.challanId))
                                                  next.delete(item.challanId);
                                                else next.add(item.challanId);
                                                return next;
                                              })
                                            }
                                            className="w-3 h-3 accent-rose-600"
                                          />
                                          {item.label}
                                        </label>
                                        <span className="font-mono text-[10px] text-slate-500">
                                          Rs {item.amount.toLocaleString()}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })
                        )}
                      </div>
                    )}

                    {showDeleteReview && deleteSelections.size > 0 && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (
                            !window.confirm(
                              `Permanently delete ${deleteSelections.size} previous unpaid challan(s)? This cannot be undone.`,
                            )
                          )
                            return;
                          await actions.bulkDelete(Array.from(deleteSelections));
                          setDeleteSelections(new Set());
                        }}
                        className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-colors"
                      >
                        Delete Selected ({deleteSelections.size})
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {mode === "delete" && (
              <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-xs border border-rose-100 flex gap-3 leading-relaxed">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>
                  <strong>Warning:</strong> This will permanently delete active,
                  unpaid challans for the selected students.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 mt-auto shrink-0">
          <button
            onClick={handleAction}
            disabled={isLoading || selection.length === 0}
            className={`w-full py-3.5 rounded-xl font-bold text-white flex justify-center items-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${mode === "generate" ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200" : ""} ${mode === "delete" ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200" : ""} ${mode === "update_date" ? "bg-slate-900 hover:bg-slate-800 shadow-slate-200" : ""}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Processing...
              </>
            ) : (
              <>
                {mode === "generate"
                  ? "Generate Challans"
                  : mode === "delete"
                    ? "Confirm Bulk Delete"
                    : "Update Due Dates"}{" "}
                ({selection.length})
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center gap-4 shrink-0">
          <div className="relative w-96">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={18}
            />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
              placeholder="Search by Name or Reg ID..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>
          <div className="flex items-center gap-4">
            {isLoading && (
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                <Loader2 className="animate-spin" size={14} /> Loading...
              </div>
            )}
            <span className="text-xs font-bold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg">
              {students.length} Records Loaded
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-50/30">
          {!filters.departmentId && students.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <User size={48} className="mb-4 opacity-20 text-slate-500" />
              <p className="font-medium text-slate-600">
                Select a Class to load students.
              </p>
              <p className="text-xs mt-1">
                Bulk operations require class-level filtering to prevent
                system overload.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-slate-500 font-bold uppercase text-[11px] tracking-wider sticky top-0 border-b border-slate-200 z-10 shadow-sm">
                <tr>
                  <th className="p-4 w-[50px] whitespace-nowrap">
                    <div
                      className="flex items-center gap-2 cursor-pointer text-indigo-600"
                      onClick={toggleSelectAll}
                    >
                      {selection.length > 0 &&
                      selection.length === students.length ? (
                        <CheckSquare size={18} />
                      ) : (
                        <Square size={18} className="text-slate-400" />
                      )}{" "}
                      All
                    </div>
                  </th>
                  <th className="p-4 whitespace-nowrap">Student Profile</th>
                  <th className="p-4 whitespace-nowrap">Contact Info</th>
                  <th className="p-4 whitespace-nowrap">Academic Info</th>
                  <th className="p-4 whitespace-nowrap text-right">
                    Current Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {students.length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center text-slate-400">
                      <p className="text-base font-medium">
                        No students found matching your criteria.
                      </p>
                    </td>
                  </tr>
                ) : (
                  students.map((s) => {
                    const isSelected = selection.includes(s._id);
                    const existing = challanMap[s._id];
                    const isPaid = existing?.status === "paid";
                    const fatherName =
                      s.personalInfo?.fatherName ||
                      s.familyInfo?.fatherName ||
                      "-";

                    return (
                      <tr
                        key={s._id}
                        className={`group transition-colors cursor-pointer ${isSelected ? "bg-indigo-50/40" : "hover:bg-slate-50"}`}
                        onClick={() => toggleSelectOne(s._id)}
                      >
                        <td className="p-4 whitespace-nowrap text-slate-400 group-hover:text-indigo-400">
                          {isSelected ? (
                            <CheckSquare
                              size={18}
                              className="text-indigo-600"
                            />
                          ) : (
                            <Square size={18} />
                          )}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center text-xs font-bold shrink-0">
                              {getInitials(s.personalInfo?.fullName || "ST")}
                            </div>
                            <div>
                              <div
                                className={`font-bold text-sm ${isSelected ? "text-indigo-900" : "text-slate-800"}`}
                              >
                                {s.personalInfo?.fullName || "N/A"}
                              </div>
                              <div className="text-xs text-slate-500 font-mono mt-0.5">
                                {s.studentId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="text-xs font-medium text-slate-700">
                            {fatherName}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            {s.personalInfo?.phone || "-"}
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="text-xs font-medium text-slate-700">
                            {s.programId?.name || s.program?.name || "N/A"}
                          </div>
                          <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                            Sem{" "}
                            {s.semesterId?.number || s.semester?.number || "-"}
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap text-right">
                          {existing ? (
                            <div className="flex flex-col items-end gap-1">
                              <div
                                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}
                              >
                                {isPaid ? (
                                  <CheckCircle2 size={12} />
                                ) : (
                                  <FileText size={12} />
                                )}{" "}
                                {isPaid ? "Paid" : "Generated"}
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 font-medium">
                                #{existing.challanNo}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-slate-100 text-slate-400 border border-slate-200">
                              Not Generated
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkChallanManager;
