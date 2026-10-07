import React, { useRef, useCallback, useState, useEffect } from "react";
import {
  Search,
  Filter,
  Check,
  Users,
  X,
  ArrowLeft,
  Save,
  Plus,
  Minus,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Layers,
  TrendingUp,
  DollarSign,
  Wand2,
  Menu,
  Lock,
  CheckCircle2,
  ShieldAlert,
  History,
  MessageSquare,
} from "lucide-react";
import { Checkbox } from "@mui/material";

// ─────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────

const Avatar = ({ name = "", size = "md" }) => {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const sizeMap = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-12 h-12 text-sm",
  };
  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-semibold shrink-0 bg-slate-100 text-slate-600`}
    >
      {initials || "?"}
    </div>
  );
};

const Badge = ({ children, variant = "default" }) => {
  const map = {
    default: "bg-slate-100 text-slate-600",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${map[variant]}`}
    >
      {children}
    </span>
  );
};

const StatusDot = () => (
  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
    Active
  </span>
);

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

// ─────────────────────────────────────────────────────────
// Success state
// ─────────────────────────────────────────────────────────

const SuccessPopup = ({ selectedStudents, count }) => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90">
    <div className="text-center max-w-sm px-6">
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
        <Check size={26} className="text-emerald-600" strokeWidth={2.5} />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">
        Configuration saved
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        The installment plan has been applied to your selection
      </p>
      <div className="flex justify-center gap-8">
        <div>
          <p className="text-2xl font-bold text-slate-900">
            {selectedStudents.length}
          </p>
          <p className="text-xs text-slate-500">Students</p>
        </div>
        <div className="w-px bg-slate-200" />
        <div>
          <p className="text-2xl font-bold text-slate-900">{count}</p>
          <p className="text-xs text-slate-500">Installments</p>
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────
// Visual split preview
// ─────────────────────────────────────────────────────────

const InstallmentVisualizer = ({ count, customPercentages }) => {
  if (count === 1) {
    return (
      <div className="border border-slate-200 rounded-xl p-4 flex items-center gap-3 bg-emerald-50/50">
        <Check className="text-emerald-600" size={18} />
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800">
            Single full payment
          </p>
          <p className="text-xs text-slate-500">100% due at billing</p>
        </div>
        <span className="text-lg font-bold text-slate-900">100%</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
        {Array.from({ length: count }).map((_, i) => {
          const pct = customPercentages[i] || 0;
          return (
            <div
              key={i}
              className="bg-indigo-500 border-r-2 border-white last:border-r-0"
              style={{
                width: `${pct}%`,
                minWidth: pct > 0 ? "2px" : 0,
                opacity: 0.55 + (0.45 * (i + 1)) / count,
              }}
              title={`Installment ${i + 1}: ${pct.toFixed(1)}%`}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {customPercentages.map((pct, i) => (
          <div
            key={i}
            className="border border-slate-200 rounded-lg py-2 text-center"
          >
            <p className="text-[10px] font-medium text-slate-400 uppercase mb-0.5">
              #{i + 1}
            </p>
            <p className="text-sm font-bold text-slate-800">
              {pct > 0 ? pct.toFixed(1) : 0}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// One installment's amount / percentage / month
// ─────────────────────────────────────────────────────────

const InstallmentCard = ({
  i,
  pct,
  month,
  simulatedAmount,
  handlePercentageUpdate,
  handleMonthUpdate,
  autoCorrectRest,
  totalCount,
  disabled = false,
}) => {
  const [localAmt, setLocalAmt] = useState("");
  const localAmtRef = useRef(localAmt);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    localAmtRef.current = localAmt;
  }, [localAmt]);

  useEffect(() => {
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
    <div className="border border-slate-200 rounded-xl p-3.5 bg-white hover:border-indigo-300 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500">
          Installment {i + 1}
        </span>
        {totalCount > 1 && (
          <button
            onClick={() => autoCorrectRest(i)}
            disabled={disabled}
            title="Lock this and auto-balance the rest"
            className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
          >
            <Wand2 size={13} />
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        <div>
          <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">
            Amount (PKR)
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">
              Rs
            </span>
            <input
              type="number"
              min="0"
              step="any"
              disabled={!simulatedAmount || disabled}
              value={localAmt}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => onAmtChange(e.target.value)}
              className="w-full border border-slate-200 rounded-lg pl-8 pr-2 py-2 text-sm font-medium text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400 text-right"
              placeholder={simulatedAmount ? "0" : "Locked"}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">
            Percentage
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="any"
              disabled={disabled}
              value={pct === 0 ? "" : Number(pct.toFixed(4))}
              onChange={(e) =>
                handlePercentageUpdate(i, Number(e.target.value))
              }
              className="w-full border border-slate-200 rounded-lg pr-7 pl-2 py-2 text-sm font-medium text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400"
              placeholder="0"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">
              %
            </span>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">
            Billing month
          </label>
          <select
            value={month || ""}
            disabled={disabled}
            onChange={(e) => handleMonthUpdate(i, e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm font-medium text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
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

// ─────────────────────────────────────────────────────────
// Setup page (configure installments for selected students)
// ─────────────────────────────────────────────────────────

const SetupPage = ({ data }) => {
  const {
    setShowSetupPage,
    selectedStudents,
    removeStudent,
    installmentCount,
    handleCountChange,
    customPercentages,
    handlePercentageUpdate,
    customMonths,
    handleMonthUpdate,
    isSaving,
    saveSuccess,
    handleSaveConfiguration,
    applyPreset,
    autoCorrectRest,
    fetchedTotalFee,
    loadingFees,
    hasTuitionFeeSetup,
    tuitionFeeRemark,
    activeSemesterNumber,
    hasExistingPreference,
    isLegacyUntaggedPreference,
    handleAssignPreferenceSemester,
    isAssigningSemester,
    loadingPreference,
    pastPreferences = [],
    loadingPreferenceHistory,
  } = data;

  const [totalFee, setTotalFee] = useState("");
  const [showAdvanceUI, setShowAdvanceUI] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceInstCount, setAdvanceInstCount] = useState(1);
  const [showStudentPanel, setShowStudentPanel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (fetchedTotalFee > 0) setTotalFee(fetchedTotalFee);
  }, [fetchedTotalFee]);

  const count = parseInt(installmentCount) || 1;
  const rawTotal = customPercentages.reduce((a, b) => a + Number(b), 0);
  const isTotalValid = Math.abs(100 - rawTotal) < 0.0000001;
  const isSingleStudent = selectedStudents.length === 1;
  // Installments are a split of the Tuition fee — without one there's
  // nothing to split, so block the configurator entirely rather than let
  // staff save a plan against a $0 base.
  const feeNotSetUp = isSingleStudent && !loadingFees && !hasTuitionFeeSetup;

  return (
    <div className="h-[calc(100vh-100px)] bg-slate-50 flex flex-col relative overflow-hidden">
      {saveSuccess && (
        <SuccessPopup selectedStudents={selectedStudents} count={count} />
      )}

      {/* Slim header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center gap-3 shrink-0">
        <button
          onClick={() => setShowSetupPage(false)}
          className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Configure installment plan
          </p>
          <p className="text-xs text-slate-500">
            {selectedStudents.length} student
            {selectedStudents.length !== 1 ? "s" : ""} selected
          </p>
        </div>
        <button
          onClick={() => setShowStudentPanel((v) => !v)}
          className="ml-auto lg:hidden p-2 rounded-lg border border-slate-200 text-slate-500"
        >
          <Users size={16} />
        </button>
      </div>

      {/* Semester status — only meaningful for a single selected student.
          This always reflects the student's own current semester now (see
          controller) — it's never affected by a leftover list filter. */}
      {isSingleStudent && !loadingPreference && (
        <div
          className={`px-4 sm:px-6 py-3 border-b flex items-center justify-between gap-3 shrink-0 ${
            hasExistingPreference
              ? "bg-emerald-50 border-emerald-100"
              : "bg-amber-50 border-amber-100"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {hasExistingPreference ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert size={16} className="text-amber-600 shrink-0" />
            )}
            <p
              className={`text-sm font-semibold ${
                hasExistingPreference ? "text-emerald-800" : "text-amber-800"
              }`}
            >
              {hasExistingPreference
                ? `Editing the existing plan for Semester ${activeSemesterNumber ?? "—"}.`
                : `No installment plan set yet for Semester ${activeSemesterNumber ?? "—"} — saving will create one.`}
              {isLegacyUntaggedPreference && (
                <span className="block text-xs font-normal text-emerald-700 mt-0.5">
                  This is an older plan set up before semester tracking —
                  assign it properly so it stops relying on a fallback.
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isLegacyUntaggedPreference && (
              <button
                onClick={handleAssignPreferenceSemester}
                disabled={isAssigningSemester}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-2.5 py-1.5 rounded-lg whitespace-nowrap"
              >
                <CheckCircle2 size={13} />
                {isAssigningSemester
                  ? "Assigning..."
                  : `Assign to Semester ${activeSemesterNumber ?? ""}`}
              </button>
            )}
            {pastPreferences.length > 0 && (
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 whitespace-nowrap"
              >
                <History size={13} />
                {showHistory
                  ? "Hide"
                  : `View ${pastPreferences.length} previous semester${pastPreferences.length !== 1 ? "s" : ""}`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Previous semesters — read-only */}
      {isSingleStudent && showHistory && pastPreferences.length > 0 && (
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0 space-y-2 max-h-64 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Previous semester plans (read-only)
          </p>
          {loadingPreferenceHistory ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 size={14} className="animate-spin" /> Loading history…
            </div>
          ) : (
            pastPreferences
              .slice()
              .sort(
                (a, b) => (b.semesterId?.number || 0) - (a.semesterId?.number || 0),
              )
              .map((pref) => (
                <div
                  key={pref._id}
                  className="border border-slate-200 rounded-lg bg-white p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      <Lock size={12} className="text-slate-400" />
                      {pref.semesterId?.name ||
                        `Semester ${pref.semesterId?.number ?? "—"}`}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {pref.defaultInstallments} installment
                        {pref.defaultInstallments !== 1 ? "s" : ""}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        View only
                      </span>
                    </span>
                  </div>
                  {pref.defaultInstallments > 1 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(pref.customPercentages || []).map((pct, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-medium rounded-lg"
                        >
                          #{i + 1} · {Number(pct).toFixed(1)}%
                          {pref.customMonths?.[i] && (
                            <span className="text-slate-400">
                              · {pref.customMonths[i]}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        {/* Selected students — sidebar on desktop, drawer on mobile */}
        <div
          className={`
            bg-white border-r border-slate-200 flex-col shrink-0 w-72
            ${showStudentPanel ? "flex absolute inset-y-0 left-0 z-30 shadow-lg" : "hidden"}
            lg:flex lg:static lg:shadow-none
          `}
        >
          <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">
              Selected students
            </p>
            <button
              onClick={() => setShowStudentPanel(false)}
              className="lg:hidden text-slate-400"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {selectedStudents.map((student) => {
              const name = student.personalInfo?.fullName || "Unknown";
              const program =
                student.programId?.name || student.program?.name || "—";
              return (
                <div
                  key={student._id}
                  className="border border-slate-200 rounded-lg p-2.5 flex items-center gap-2.5 group hover:border-slate-300 transition-colors"
                >
                  <Avatar name={name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {student.studentId} · {program}
                    </p>
                  </div>
                  <button
                    onClick={() => removeStudent(student._id)}
                    className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main config column */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-8xl mx-auto p-4 sm:p-6 space-y-5 pb-16">
            {feeNotSetUp ? (
              <div className="bg-white border border-amber-200 rounded-xl p-8 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                  <AlertTriangle size={22} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Fee not set up for this student yet
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    {selectedStudents[0]?.personalInfo?.fullName || "This student"}{" "}
                    doesn't have a Tuition fee configured for Semester{" "}
                    {activeSemesterNumber ?? "—"} yet. Set that up first in
                    Student Fee Management, then come back to configure their
                    installment plan.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Step 1: fee + count */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-sm font-semibold text-slate-900 mb-0.5">
                Total fee & number of installments
              </p>
              <p className="text-xs text-slate-500 mb-4">
                {loadingFees
                  ? "Fetching configured fee…"
                  : "Set the total fee first — it's the base for every amount below."}
              </p>

              {isSingleStudent && tuitionFeeRemark && (
                <div className="mb-4 flex items-start gap-2 text-xs text-indigo-800 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2.5">
                  <MessageSquare size={14} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold uppercase tracking-wide text-[10px] text-indigo-500 mb-0.5">
                      Fee setup remark
                    </p>
                    <p className="leading-relaxed">{tuitionFeeRemark}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-slate-500 uppercase mb-1.5">
                    Total fee amount
                    {loadingFees && (
                      <Loader2
                        size={10}
                        className="inline ml-1.5 animate-spin text-slate-400"
                      />
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                      Rs
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={totalFee}
                      onChange={(e) => setTotalFee(e.target.value)}
                      disabled={loadingFees}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-sm font-medium disabled:bg-slate-50"
                      placeholder="100000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 uppercase mb-1.5">
                    Installments
                  </label>
                  <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2 py-1.5">
                    <button
                      onClick={() => count > 1 && handleCountChange(count - 1)}
                      disabled={count <= 1}
                      className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-lg font-bold text-slate-900 w-6 text-center tabular-nums">
                      {count}
                    </span>
                    <button
                      onClick={() => count < 12 && handleCountChange(count + 1)}
                      disabled={count >= 12}
                      className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: distribution */}
            {count > 1 && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Amount distribution
                    </p>
                    <p className="text-xs text-slate-500">
                      How much each installment is worth
                    </p>
                  </div>
                  <Badge variant={isTotalValid ? "success" : "warning"}>
                    {isTotalValid ? (
                      <Check size={12} />
                    ) : (
                      <AlertTriangle size={12} />
                    )}
                    {rawTotal.toFixed(2)}%
                  </Badge>
                </div>

                {/* Presets */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => {
                      setShowAdvanceUI(false);
                      applyPreset("equal");
                    }}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                  >
                    <Layers size={12} /> Equal split
                  </button>
                  <button
                    onClick={() => {
                      setShowAdvanceUI(false);
                      applyPreset("front");
                    }}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                  >
                    <TrendingUp size={12} /> Front-loaded
                  </button>
                  <button
                    onClick={() => {
                      setShowAdvanceUI(false);
                      applyPreset("back");
                    }}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                  >
                    <TrendingUp size={12} className="rotate-90" /> Back-loaded
                  </button>
                  <button
                    onClick={() => setShowAdvanceUI((v) => !v)}
                    className={`px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      showAdvanceUI
                        ? "border-indigo-400 text-indigo-600 bg-indigo-50"
                        : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                  >
                    <DollarSign size={12} /> Advance / paid split
                  </button>
                </div>

                {showAdvanceUI && (
                  <div className="mb-4 p-4 border border-slate-200 rounded-lg bg-slate-50 flex flex-col sm:flex-row items-end gap-3">
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1.5">
                        Already paid
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">
                          Rs
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={advanceAmount}
                          onChange={(e) => setAdvanceAmount(e.target.value)}
                          className="w-full pl-8 pr-2 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-sm font-medium bg-white"
                          placeholder="20000"
                        />
                      </div>
                    </div>
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] font-medium text-slate-500 uppercase mb-1.5">
                        Covers first N installments
                      </label>
                      <select
                        value={advanceInstCount}
                        onChange={(e) =>
                          setAdvanceInstCount(Number(e.target.value))
                        }
                        className="w-full px-2 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-sm font-medium bg-white"
                      >
                        {Array.from({ length: Math.max(1, count - 1) }).map(
                          (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1} installment{i + 1 > 1 ? "s" : ""}
                            </option>
                          ),
                        )}
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
                      className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                  {customPercentages.map((pct, i) => (
                    <InstallmentCard
                      key={i}
                      i={i}
                      pct={pct}
                      month={customMonths[i]}
                      simulatedAmount={totalFee}
                      handlePercentageUpdate={handlePercentageUpdate}
                      handleMonthUpdate={handleMonthUpdate}
                      autoCorrectRest={autoCorrectRest}
                      totalCount={count}
                    />
                  ))}
                </div>

                {!isTotalValid && (
                  <div className="border border-amber-200 bg-amber-50 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                    <div className="flex items-start gap-2 flex-1">
                      <AlertTriangle
                        className="text-amber-600 shrink-0 mt-0.5"
                        size={16}
                      />
                      <p className="text-xs text-amber-800">
                        Percentages sum to <strong>{rawTotal}%</strong> — must
                        equal exactly 100% to save.
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
                      className="w-full sm:w-auto px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                    >
                      Auto-balance last
                    </button>
                  </div>
                )}

                <InstallmentVisualizer
                  count={count}
                  customPercentages={customPercentages}
                />
              </div>
            )}

            {/* A single "installment" is really just the whole fee paid at
                once — not a split — but it still needs a Billing Month so
                challan generation knows which month this challan is for. */}
            {count === 1 && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-sm font-semibold text-slate-900">
                    Billing month
                  </p>
                  <span className="text-sm font-bold text-slate-900">
                    Rs {Number(totalFee || 0).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Whole fee, due in one payment — pick which month it's
                  billed for.
                </p>
                <select
                  value={customMonths[0] || ""}
                  onChange={(e) => handleMonthUpdate(0, e.target.value)}
                  className="w-full sm:w-64 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
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

            {/* Save bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex gap-6 flex-1">
                <div>
                  <p className="text-xs text-slate-500">Students</p>
                  <p className="text-xl font-bold text-slate-900">
                    {selectedStudents.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Installments</p>
                  <p className="text-xl font-bold text-slate-900">{count}</p>
                </div>
              </div>
              <button
                onClick={handleSaveConfiguration}
                disabled={isSaving || !isTotalValid}
                className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save configuration
                  </>
                )}
              </button>
            </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Main page (filter + pick students)
// ─────────────────────────────────────────────────────────

const MainPage = ({ data }) => {
  const {
    filters,
    handleFilterChange,
    terms,
    departments,
    programs,
    semesters,
    studentsList,
    loadMoreStudents,
    hasMore,
    isStudentsLoading,
    selectedStudents,
    toggleStudentSelection,
    toggleSelectAll,
    proceedToSetup,
  } = data;

  const [showFilters, setShowFilters] = useState(false);

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

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(loaderCallback, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loaderCallback]);

  const filterFields = [
    {
      label: "Academic session",
      key: "termId",
      options: terms,
      placeholder: "All sessions",
    },
    {
      label: "Department",
      key: "departmentId",
      options: departments,
      placeholder: "All departments",
    },
    {
      label: "Program",
      key: "programId",
      options: programs,
      placeholder: "All programs",
      disabled: !filters.departmentId,
    },
    {
      label: "Semester",
      key: "semesterId",
      options: semesters,
      placeholder: "All semesters",
      disabled: !filters.programId,
      labelFn: (opt) => opt.name || `Semester ${opt.number}`,
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] bg-slate-50 relative">
      {/* Filters — sidebar on desktop, drawer on mobile */}
      <div
        className={`
          bg-white border-slate-200 shrink-0 w-full lg:w-64
          border-b lg:border-b-0 lg:border-r
          ${showFilters ? "block" : "hidden"} lg:block
        `}
      >
        <div className="px-4 py-3.5 border-b border-slate-200 hidden lg:flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <p className="text-sm font-semibold text-slate-900">Filters</p>
        </div>
        <div className="p-4 grid grid-cols-2 lg:grid-cols-1 gap-3">
          {filterFields.map(
            ({ label, key, options, placeholder, disabled, labelFn }) => (
              <div key={key}>
                <label className="block text-[11px] font-medium text-slate-500 uppercase mb-1.5">
                  {label}
                </label>
                <select
                  disabled={disabled}
                  value={filters[key]}
                  onChange={(e) => handleFilterChange(key, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400 transition-colors"
                >
                  <option value="">{placeholder}</option>
                  {options.map((opt) => (
                    <option key={opt._id} value={opt._id}>
                      {labelFn ? labelFn(opt) : opt.name}
                    </option>
                  ))}
                </select>
              </div>
            ),
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Slim toolbar */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="lg:hidden p-2 border border-slate-200 rounded-lg text-slate-500"
          >
            <Menu size={16} />
          </button>

          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              placeholder="Search by name or ID…"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:inline">
              {selectedStudents.length} selected
            </span>
            <button
              onClick={proceedToSetup}
              disabled={selectedStudents.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm rounded-lg transition-colors"
            >
              Configure <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse min-w-[720px]">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 sm:px-6 py-3 w-12">
                  <Checkbox
                    size="small"
                    checked={allVisibleSelected}
                    indeterminate={
                      selectedStudents.length > 0 && !allVisibleSelected
                    }
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                </th>
                {[
                  "Reg ID",
                  "Student name",
                  "Father name",
                  "Department",
                  "Program",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
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
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-indigo-50/70" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 sm:px-6 py-3">
                      <Checkbox
                        size="small"
                        checked={isSelected}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 sm:px-6 py-3 font-mono text-xs text-slate-500">
                      {student.studentId}
                    </td>
                    <td className="px-4 sm:px-6 py-3 font-medium text-slate-900">
                      {student.personalInfo?.fullName || "N/A"}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-slate-600">
                      {student.familyInfo?.fatherName || "N/A"}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-slate-500 text-xs">
                      {student.departmentId?.name || "—"}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-slate-500 text-xs">
                      {student.programId?.name || "—"}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <StatusDot />
                    </td>
                  </tr>
                );
              })}

              {!isStudentsLoading && studentsList.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <p className="text-sm font-medium text-slate-500">
                      No students found
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try adjusting your filters
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {isStudentsLoading && (
            <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-sm">
              <Loader2 size={16} className="animate-spin" /> Loading students…
            </div>
          )}

          <div ref={sentinelRef} className="h-1" />
        </div>
      </div>
    </div>
  );
};

const InstallmentConfigurationView = ({ data }) => {
  if (data.showSetupPage) return <SetupPage data={data} />;
  return <MainPage data={data} />;
};

export default InstallmentConfigurationView;
