import React, { useRef, useCallback, useState, useEffect } from "react";
import {
  Search,
  Check,
  Users,
  X,
  ArrowLeft,
  Save,
  Plus,
  Minus,
  ChevronRight,
  Layers,
  CheckCircle2,
  Loader2,
  SlidersHorizontal,
  AlertTriangle,
  Wand2,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { Checkbox } from "@mui/material";
import { useCOISInstallment } from "../../controller/useCOISInstallment";

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

const Avatar = ({ name = "", size = "md" }) => {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const sizeMap = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-12 h-12 text-sm",
  };
  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-bold shrink-0 border-2 border-white`}
      style={{
        background: `hsl(${hue},55%,88%)`,
        color: `hsl(${hue},55%,30%)`,
      }}
    >
      {initials || "?"}
    </div>
  );
};

const Badge = ({ children, variant = "default" }) => {
  const map = {
    default: "bg-slate-100 text-slate-600 border-slate-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${map[variant]}`}
    >
      {children}
    </span>
  );
};

// ─── ONE INSTALLMENT'S AMOUNT / PERCENTAGE / MONTH ───
const InstallmentCard = ({
  i,
  pct,
  month,
  simulatedAmount,
  handlePercentageUpdate,
  handleMonthUpdate,
  autoCorrectRest,
  totalCount,
}) => {
  const [localAmt, setLocalAmt] = React.useState("");
  const localAmtRef = React.useRef(localAmt);
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    localAmtRef.current = localAmt;
  }, [localAmt]);

  React.useEffect(() => {
    if (!isFocused && simulatedAmount > 0) {
      const currentAmt = Number(localAmtRef.current);
      const expectedPct = Number(
        ((currentAmt / simulatedAmount) * 100).toFixed(6),
      );
      if (expectedPct !== pct) {
        setLocalAmt(pct ? Math.round((pct / 100) * simulatedAmount) : "");
      }
    }
  }, [pct, simulatedAmount, isFocused]);

  const onAmtChange = (val) => {
    setLocalAmt(val);
    if (simulatedAmount > 0) {
      const newPct = Number(((Number(val) / simulatedAmount) * 100).toFixed(6));
      handlePercentageUpdate(i, newPct);
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl p-3.5 bg-white hover:border-violet-300 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-500">
          Installment {i + 1}
        </span>
        {totalCount > 1 && (
          <button
            onClick={() => autoCorrectRest(i)}
            title="Lock this and auto-balance the rest"
            className="p-1 text-slate-400 hover:text-violet-600 transition-colors"
          >
            <Wand2 size={13} />
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
            Amount (PKR)
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
              Rs
            </span>
            <input
              type="number"
              min="0"
              step="any"
              disabled={!simulatedAmount}
              value={localAmt}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => onAmtChange(e.target.value)}
              className="w-full border border-slate-200 rounded-lg pl-8 pr-2 py-2 text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50 disabled:bg-slate-50 disabled:text-slate-400 text-right"
              placeholder={simulatedAmount ? "0" : "Locked"}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
            Percentage
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="any"
              value={pct === 0 ? "" : Number(pct.toFixed(4))}
              onChange={(e) =>
                handlePercentageUpdate(i, Number(e.target.value))
              }
              className="w-full border border-slate-200 rounded-lg pr-7 pl-2 py-2 text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50"
              placeholder="0"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
              %
            </span>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
            Billing month
          </label>
          <select
            value={month || ""}
            onChange={(e) => handleMonthUpdate(i, e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50 cursor-pointer"
          >
            <option value="" disabled>
              Select month…
            </option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

// ─── ONE INSTALLMENT'S FIXED AMOUNT (amount mode — the Rupee figure IS the
// stored value, not derived from a percentage) ───
const AmountInstallmentCard = ({
  i,
  amount,
  month,
  totalFee,
  handleAmountUpdate,
  handleMonthUpdate,
  autoCorrectAmountRest,
  totalCount,
}) => {
  const pct = totalFee > 0 ? ((Number(amount) || 0) / totalFee) * 100 : 0;
  return (
    <div className="border border-slate-200 rounded-xl p-3.5 bg-white hover:border-violet-300 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-500">
          Installment {i + 1}
        </span>
        {totalCount > 1 && (
          <button
            onClick={() => autoCorrectAmountRest(i, totalFee)}
            title="Lock this and auto-balance the rest"
            className="p-1 text-slate-400 hover:text-violet-600 transition-colors"
          >
            <Wand2 size={13} />
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
            Amount (PKR) — fixed
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
              Rs
            </span>
            <input
              type="number"
              min="0"
              step="any"
              value={amount === 0 ? "" : amount}
              onChange={(e) => handleAmountUpdate(i, e.target.value, totalFee)}
              className="w-full border border-slate-200 rounded-lg pl-8 pr-2 py-2 text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50 text-right"
              placeholder="0"
            />
          </div>
        </div>

        <p className="text-[11px] text-slate-400 font-medium">
          ≈ {pct.toFixed(1)}% of total fee
        </p>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
            Billing month
          </label>
          <select
            value={month || ""}
            onChange={(e) => handleMonthUpdate(i, e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50 cursor-pointer"
          >
            <option value="" disabled>
              Select month…
            </option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

// ─── VISUALIZER ───
const InstallmentVisualizer = ({ count, customPercentages }) => {
  const colors = [
    "bg-indigo-500",
    "bg-violet-500",
    "bg-sky-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
  ];
  if (count === 1) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
        <div className="p-3 bg-emerald-100 rounded-xl">
          <CheckCircle2 className="text-emerald-600" size={22} />
        </div>
        <div>
          <p className="font-bold text-emerald-900 text-sm">
            Single Full Payment
          </p>
          <p className="text-xs text-emerald-600 mt-0.5">
            100% due at time of billing
          </p>
        </div>
        <span className="ml-auto text-2xl font-black text-emerald-700">
          100%
        </span>
      </div>
    );
  }
  return (
    <div className="flex h-5 rounded-full overflow-hidden shadow-inner bg-slate-100 relative">
      {Array.from({ length: count }).map((_, i) => {
        const pct = customPercentages[i] || 0;
        return (
          <div
            key={i}
            className={`${colors[i % colors.length]} flex items-center justify-center transition-all duration-300 border-r border-white/20 last:border-0`}
            style={{ width: `${pct}%` }}
          >
            {pct >= 10 && (
              <span className="text-[10px] font-bold text-white/90">
                {pct}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── ROOT COMPONENT ───
export default function COISInstallmentView() {
  const {
    showSetupPage,
    setShowSetupPage,
    proceedToSetup,
    terms,
    programs,
    partOptions,
    selectedTerm,
    setSelectedTerm,
    selectedProg,
    handleProgChange,
    selectedPart,
    setSelectedPart,
    search,
    setSearch,
    studentsList,
    loadMoreStudents,
    hasMore,
    isStudentsLoading,
    selectedStudents,
    toggleStudentSelection,
    toggleSelectAll,
    removeStudent,
    installmentCount,
    handleCountChange,
    installmentMode,
    setInstallmentMode,
    customPercentages,
    handlePercentageUpdate,
    customAmounts,
    handleAmountUpdate,
    applyPreset,
    autoCorrectRest,
    autoCorrectAmountRest,
    customMonths,
    handleMonthUpdate,
    fetchedTotalFee,
    loadingFees,
    hasTuitionFeeSetup,
    currentPartNumber,
    isSaving,
    saveSuccess,
    handleSaveConfiguration,
  } = useCOISInstallment();

  const [totalFee, setTotalFee] = useState("");
  const [showAdvanceUI, setShowAdvanceUI] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceInstCount, setAdvanceInstCount] = useState(1);

  useEffect(() => {
    if (fetchedTotalFee > 0) setTotalFee(fetchedTotalFee);
  }, [fetchedTotalFee]);

  const allVisibleSelected =
    studentsList.length > 0 &&
    studentsList.every((s) =>
      selectedStudents.some((sel) => sel._id === s._id),
    );

  const sentinelRef = useRef(null);
  const loaderCallback = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !isStudentsLoading)
        loadMoreStudents();
    },
    [hasMore, isStudentsLoading, loadMoreStudents],
  );

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(loaderCallback, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loaderCallback]);

  // ─── SETUP PAGE ───
  if (showSetupPage) {
    const count = parseInt(installmentCount) || 1;
    const totalPct = customPercentages.reduce((a, b) => a + b, 0);
    const diff = 100 - totalPct;
    const totalAmt = customAmounts.reduce((a, b) => a + Number(b || 0), 0);
    const amountDiff = Math.round((Number(totalFee) || 0) - totalAmt);
    const isSingleStudent = selectedStudents.length === 1;
    // Installments are a split of the Tuition fee — without one there's
    // nothing to split, so block the configurator entirely rather than let
    // staff save a plan against a $0 base.
    const feeNotSetUp = isSingleStudent && !loadingFees && !hasTuitionFeeSetup;

    return (
      <div
        className="h-full bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden"
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        {saveSuccess && (
          <div
            className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center"
            style={{ animation: "fadeIn 0.3s ease-out" }}
          >
            <div
              className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-5 shadow-xl shadow-emerald-200"
              style={{
                animation:
                  "bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              }}
            >
              <Check size={40} className="text-white" strokeWidth={3.5} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">
              Successfully Configured!
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              Saved preferences for {selectedStudents.length} student(s).
            </p>
          </div>
        )}

        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-4 shrink-0">
          <button
            onClick={() => setShowSetupPage(false)}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
            <span>Installments</span>
            <ChevronRight size={14} />
            <span className="text-slate-800 font-semibold">Configure Plan</span>
          </div>
        </div>

        <div className="flex-1 flex gap-0 overflow-hidden relative z-10">
          <div className="w-[340px] bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 shadow-sm z-20">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-white">
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Users size={16} className="text-violet-600" /> Selected Roster
              </h2>
              <span className="px-2.5 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-bold">
                {selectedStudents.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedStudents.map((student) => (
                <div
                  key={student._id}
                  className="bg-white border border-slate-200 rounded-xl p-3 hover:border-violet-300 transition-all group relative shadow-sm"
                >
                  <button
                    onClick={() => removeStudent(student._id)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-md bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={student.personalInfo?.fullName || "Unknown"}
                      size="md"
                    />
                    <div className="min-w-0 flex-1 pr-6">
                      <p className="font-bold text-slate-900 text-sm truncate">
                        {student.personalInfo?.fullName || "Unknown"}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 mt-0.5">
                        <span className="font-semibold text-violet-600">
                          {student.studentId}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-y-auto bg-white p-8">
            <div className="max-w-4xl w-full mx-auto space-y-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
                    <Layers size={22} className="text-white" />
                  </div>
                  Payment Setup
                </h2>
              </div>

              {feeNotSetUp ? (
                <div className="bg-white border border-amber-200 rounded-3xl p-8 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                    <AlertTriangle size={22} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Fee not set up for this student yet
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      {selectedStudents[0]?.personalInfo?.fullName ||
                        "This student"}{" "}
                      doesn't have a Tuition fee configured for Part{" "}
                      {currentPartNumber ?? "—"} yet. Set that up first in Fee
                      Setup, then come back to configure their installment
                      plan.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-7">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">
                          Total fee & number of installments
                        </h3>
                        <p className="text-sm text-slate-500">
                          {loadingFees
                            ? "Fetching configured fee…"
                            : "Set the total fee first — it's the base for every amount below."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mt-5">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                          Total fee amount
                          {loadingFees && (
                            <Loader2
                              size={10}
                              className="inline ml-1.5 animate-spin text-slate-400"
                            />
                          )}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                            Rs
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={totalFee}
                            onChange={(e) => setTotalFee(e.target.value)}
                            disabled={loadingFees}
                            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-50 text-sm font-bold disabled:bg-slate-100"
                            placeholder="100000"
                          />
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-2xl p-2 flex items-center gap-4 shrink-0">
                        <button
                          onClick={() =>
                            count > 1 && handleCountChange(count - 1, totalFee)
                          }
                          disabled={count <= 1}
                          className="w-10 h-10 rounded-xl hover:bg-slate-50 border border-slate-200 flex items-center justify-center transition-all disabled:opacity-30"
                        >
                          <Minus size={18} />
                        </button>
                        <span className="text-4xl font-black text-violet-600 tabular-nums w-12 text-center">
                          {count}
                        </span>
                        <button
                          onClick={() =>
                            count < 12 && handleCountChange(count + 1, totalFee)
                          }
                          disabled={count >= 12}
                          className="w-10 h-10 rounded-xl hover:bg-slate-50 border border-slate-200 flex items-center justify-center transition-all disabled:opacity-30"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {count > 1 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-7">
                      <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">
                            Amount distribution
                          </h3>
                          <p className="text-sm text-slate-500">
                            How much each installment is worth
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
                            <button
                              onClick={() => setInstallmentMode("percentage", totalFee)}
                              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                                installmentMode !== "amount"
                                  ? "bg-violet-600 text-white"
                                  : "text-slate-500 hover:text-violet-600"
                              }`}
                            >
                              Percentage
                            </button>
                            <button
                              onClick={() => setInstallmentMode("amount", totalFee)}
                              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                                installmentMode === "amount"
                                  ? "bg-violet-600 text-white"
                                  : "text-slate-500 hover:text-violet-600"
                              }`}
                            >
                              Fixed Amount
                            </button>
                          </div>
                          {installmentMode === "amount" ? (
                            <span
                              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg ${
                                amountDiff === 0
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {amountDiff === 0 ? (
                                <CheckCircle2 size={16} />
                              ) : (
                                <AlertTriangle size={16} />
                              )}
                              Total: Rs {totalAmt.toLocaleString()}
                              {amountDiff !== 0 &&
                                ` (${amountDiff > 0 ? `Rs ${amountDiff.toLocaleString()} missing` : `Rs ${Math.abs(amountDiff).toLocaleString()} over`})`}
                            </span>
                          ) : (
                            <span
                              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg ${totalPct === 100 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                            >
                              {totalPct === 100 ? (
                                <CheckCircle2 size={16} />
                              ) : (
                                <AlertTriangle size={16} />
                              )}
                              Total: {totalPct}%{" "}
                              {diff !== 0 &&
                                ` (${diff > 0 ? `+${diff}% missing` : `${Math.abs(diff)}% over`})`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Presets */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        <button
                          onClick={() => {
                            setShowAdvanceUI(false);
                            applyPreset("equal", { totalFee });
                          }}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-violet-300 hover:text-violet-600 transition-colors flex items-center gap-1.5 bg-white"
                        >
                          <Layers size={12} /> Equal split
                        </button>
                        <button
                          onClick={() => {
                            setShowAdvanceUI(false);
                            applyPreset("front", { totalFee });
                          }}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-violet-300 hover:text-violet-600 transition-colors flex items-center gap-1.5 bg-white"
                        >
                          <TrendingUp size={12} /> Front-loaded
                        </button>
                        <button
                          onClick={() => {
                            setShowAdvanceUI(false);
                            applyPreset("back", { totalFee });
                          }}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-violet-300 hover:text-violet-600 transition-colors flex items-center gap-1.5 bg-white"
                        >
                          <TrendingUp size={12} className="rotate-90" />{" "}
                          Back-loaded
                        </button>
                        <button
                          onClick={() => setShowAdvanceUI((v) => !v)}
                          className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                            showAdvanceUI
                              ? "border-violet-400 text-violet-600 bg-violet-50"
                              : "border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600 bg-white"
                          }`}
                        >
                          <DollarSign size={12} /> Advance / paid split
                        </button>
                      </div>

                      {showAdvanceUI && (
                        <div className="mb-6 p-4 border border-slate-200 rounded-xl bg-white flex flex-col sm:flex-row items-end gap-3">
                          <div className="flex-1 w-full">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                              Already paid
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                                Rs
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={advanceAmount}
                                onChange={(e) =>
                                  setAdvanceAmount(e.target.value)
                                }
                                className="w-full pl-8 pr-2 py-2 border border-slate-200 rounded-lg outline-none focus:border-violet-500 text-sm font-bold bg-slate-50"
                                placeholder="20000"
                              />
                            </div>
                          </div>
                          <div className="flex-1 w-full">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                              Covers first N installments
                            </label>
                            <select
                              value={advanceInstCount}
                              onChange={(e) =>
                                setAdvanceInstCount(Number(e.target.value))
                              }
                              className="w-full px-2 py-2 border border-slate-200 rounded-lg outline-none focus:border-violet-500 text-sm font-bold bg-slate-50"
                            >
                              {Array.from({
                                length: Math.max(1, count - 1),
                              }).map((_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {i + 1} installment{i + 1 > 1 ? "s" : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() =>
                              applyPreset("advance", {
                                totalFee,
                                advanceAmount,
                                advanceInstCount,
                              })
                            }
                            className="w-full sm:w-auto px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-lg transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                        {installmentMode === "amount"
                          ? customAmounts.map((amt, i) => (
                              <AmountInstallmentCard
                                key={i}
                                i={i}
                                amount={amt}
                                month={customMonths[i]}
                                totalFee={totalFee}
                                handleAmountUpdate={handleAmountUpdate}
                                handleMonthUpdate={handleMonthUpdate}
                                autoCorrectAmountRest={autoCorrectAmountRest}
                                totalCount={count}
                              />
                            ))
                          : customPercentages.map((pct, i) => (
                              <InstallmentCard
                                key={i}
                                i={i}
                                pct={pct}
                                month={customMonths[i]}
                                simulatedAmount={totalFee}
                                handlePercentageUpdate={handlePercentageUpdate}
                                handleMonthUpdate={handleMonthUpdate}
                                autoCorrectRest={(idx) => autoCorrectRest(idx, totalFee)}
                                totalCount={count}
                              />
                            ))}
                      </div>

                      {installmentMode === "amount" ? (
                        amountDiff !== 0 && (
                          <div className="border border-amber-200 bg-amber-50 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                            <div className="flex items-start gap-2 flex-1">
                              <AlertTriangle
                                className="text-amber-600 shrink-0 mt-0.5"
                                size={16}
                              />
                              <p className="text-xs text-amber-800">
                                Amounts sum to <strong>Rs {totalAmt.toLocaleString()}</strong> —
                                must equal the total fee (Rs {Number(totalFee || 0).toLocaleString()}) to save.
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                const sumExceptLast = customAmounts
                                  .slice(0, count - 1)
                                  .reduce((a, b) => a + Number(b || 0), 0);
                                handleAmountUpdate(
                                  count - 1,
                                  Math.round((Number(totalFee) || 0) - sumExceptLast),
                                  totalFee,
                                );
                              }}
                              className="w-full sm:w-auto px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                            >
                              Auto-balance last
                            </button>
                          </div>
                        )
                      ) : (
                        totalPct !== 100 && (
                          <div className="border border-amber-200 bg-amber-50 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                            <div className="flex items-start gap-2 flex-1">
                              <AlertTriangle
                                className="text-amber-600 shrink-0 mt-0.5"
                                size={16}
                              />
                              <p className="text-xs text-amber-800">
                                Percentages sum to <strong>{totalPct}%</strong> —
                                must equal exactly 100% to save.
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                const sumExceptLast = customPercentages
                                  .slice(0, count - 1)
                                  .reduce((a, b) => a + Number(b), 0);
                                handlePercentageUpdate(
                                  count - 1,
                                  Number((100 - sumExceptLast).toFixed(6)),
                                );
                              }}
                              className="w-full sm:w-auto px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                            >
                              Auto-balance last
                            </button>
                          </div>
                        )
                      )}

                      <InstallmentVisualizer
                        count={count}
                        customPercentages={customPercentages}
                      />
                    </div>
                  )}

                  {count === 1 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-7">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-bold text-slate-800 text-lg">
                          Billing month
                        </h3>
                        <span className="text-lg font-black text-slate-900">
                          Rs {Number(totalFee || 0).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mb-4">
                        Whole fee, due in one payment — pick which month it's
                        billed for.
                      </p>
                      <select
                        value={customMonths[0] || ""}
                        onChange={(e) => handleMonthUpdate(0, e.target.value)}
                        className="w-full sm:w-64 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-violet-500 cursor-pointer bg-white"
                      >
                        <option value="" disabled>
                          Select month…
                        </option>
                        {MONTHS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-sm text-slate-400 font-medium mb-1">
                      Target Students
                    </p>
                    <p className="text-3xl font-black">
                      {selectedStudents.length}
                    </p>
                  </div>
                  <div className="w-px h-12 bg-slate-700"></div>
                  <div>
                    <p className="text-sm text-slate-400 font-medium mb-1">
                      Total Installments
                    </p>
                    <p className="text-3xl font-black">{count}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSaveConfiguration(totalFee)}
                  disabled={
                    isSaving ||
                    (count > 1 && installmentMode === "amount"
                      ? amountDiff !== 0
                      : totalPct !== 100)
                  }
                  className="w-full md:w-auto px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-500 font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />{" "}
                      Processing...
                    </>
                  ) : (
                    <>
                      <Save size={18} /> Confirm & Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN STUDENT SELECTION PAGE ───
  return (
    <div className="h-full bg-white rounded-2xl border border-slate-200 shadow-sm flex overflow-hidden">
      {/* ── LEFT SIDEBAR ── */}
      <div className="w-64 bg-slate-50 border-r border-slate-200 p-5 flex flex-col shrink-0 z-10">
        <div className="flex items-center gap-2 mb-6">
          <SlidersHorizontal size={18} className="text-violet-600" />
          <h2 className="font-black text-slate-800">Filter Students</h2>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
              Academic Session
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-3 py-2.5 outline-none focus:border-violet-400"
            >
              <option value="">All Sessions</option>
              {terms.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
              Program (COIS)
            </label>
            <select
              value={selectedProg}
              onChange={(e) => handleProgChange(e.target.value)}
              className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-3 py-2.5 outline-none focus:border-violet-400"
            >
              <option value="">All College Programs</option>
              {programs.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
              Section / Part
            </label>
            <select
              value={selectedPart}
              onChange={(e) => setSelectedPart(e.target.value)}
              className="w-full bg-white border border-slate-200 text-sm font-medium rounded-xl px-3 py-2.5 outline-none disabled:opacity-50"
            >
              <option value="">All Parts</option>
              {partOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
          <div className="relative w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search roll number or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-500"
            />
          </div>
          <button
            onClick={proceedToSetup}
            disabled={selectedStudents.length === 0}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm"
          >
            Configure Installments <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-6 py-3 w-10">
                  <Checkbox
                    size="small"
                    checked={allVisibleSelected}
                    indeterminate={
                      selectedStudents.length > 0 && !allVisibleSelected
                    }
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-6 py-3">Roll No</th>
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">Program</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentsList.map((student) => {
                const isSelected = selectedStudents.some(
                  (s) => s._id === student._id,
                );
                return (
                  <tr
                    key={student._id}
                    onClick={() => toggleStudentSelection(student)}
                    className={`cursor-pointer transition-colors ${isSelected ? "bg-violet-50" : "hover:bg-slate-50"}`}
                  >
                    <td
                      className="px-6 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        size="small"
                        checked={isSelected}
                        onChange={() => toggleStudentSelection(student)}
                      />
                    </td>
                    <td className="px-6 py-3 font-mono font-bold text-slate-500">
                      {student.studentId}
                    </td>
                    <td className="px-6 py-3 font-bold text-slate-800">
                      {student.personalInfo?.fullName || "N/A"}
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-600">
                      {student.programId?.name || "—"}
                    </td>
                    <td className="px-6 py-3">
                      <Badge>Default</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div ref={sentinelRef} className="h-4" />
          {isStudentsLoading && (
            <div className="py-4 flex justify-center">
              <Loader2 size={20} className="animate-spin text-violet-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
