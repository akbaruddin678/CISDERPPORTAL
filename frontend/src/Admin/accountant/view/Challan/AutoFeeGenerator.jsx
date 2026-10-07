import React, { useEffect, useState, useMemo } from "react";
import {
  Zap,
  Calendar,
  CalendarClock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Filter,
  Pencil,
  ArrowRight,
  Wallet,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useGetAutoGeneratePreviewQuery } from "../../api/studentChallanApi";

const EMPTY_FILTERS = { termId: "", departmentId: "", programId: "", semesterId: "" };
const todayISO = () => new Date().toISOString().split("T")[0];

const StepDot = ({ active, done, label, index }) => (
  <div className="flex items-center gap-2">
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
        done
          ? "bg-emerald-500 text-white"
          : active
            ? "bg-indigo-600 text-white"
            : "bg-slate-200 text-slate-500"
      }`}
    >
      {done ? <CheckCircle2 size={14} /> : index}
    </div>
    <span className={`text-xs font-bold ${active ? "text-slate-900" : "text-slate-400"}`}>
      {label}
    </span>
  </div>
);

const SummaryRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
    <span className="text-xs font-semibold text-slate-500">{label}</span>
    <span className="text-sm font-bold text-slate-800">{value}</span>
  </div>
);

// Auto Fee Generator — the admin picks a Session (optionally narrowed by
// Department/Program/Semester), a Billing Month and a Due Date; the backend
// scans every matching student and generates a challan ONLY for the ones
// whose plan (installment or whole-fee) is actually configured for that
// month. Students without a plan, or whose plan is due a different month,
// are simply not touched — there's nothing to hand-pick here, unlike Bulk
// Tools.
//
// "Intelligent" pieces, both driven by one live preview scan
// (`getAutoGeneratePreview`, the exact same eligibility logic the real
// generation run uses — never two competing implementations that could
// drift apart):
//   - shows how many students actually match the current scope, live
//   - the Billing Month dropdown only ever lists months that STILL have
//     someone due — a month that's already fully billed (installment past
//     that point, or a whole-fee student already invoiced) just never
//     shows a count above zero, so it naturally drops off the list
//     without any separate "already generated" bookkeeping.
//
// Two-step flow (Configure → Review) so the setup is shown back in full
// before anything is generated, with a one-click way to go edit it.
const AutoFeeGenerator = ({
  terms,
  departments,
  programsAll = [],
  semestersAll = [],
  actions,
  isProcessing,
}) => {
  const [step, setStep] = useState("configure"); // configure | review
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [billingMonth, setBillingMonth] = useState("");
  const [generationDate, setGenerationDate] = useState(todayISO);
  const [dueDate, setDueDate] = useState("");
  const [allowMultipleTuition, setAllowMultipleTuition] = useState(false);
  const [includeArrears, setIncludeArrears] = useState(true);
  const [result, setResult] = useState(null);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "departmentId") {
        next.programId = "";
        next.semesterId = "";
      }
      if (key === "programId") next.semesterId = "";
      return next;
    });
    setBillingMonth(""); // scope changed — the previously chosen month may no longer apply
  };

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
          String(s.programId?._id || s.programId) === String(filters.programId),
      )
      .sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [semestersAll, filters.programId]);

  const {
    data: previewData,
    isFetching: isPreviewLoading,
  } = useGetAutoGeneratePreviewQuery(
    {
      termId: filters.termId,
      departmentId: filters.departmentId || undefined,
      programId: filters.programId || undefined,
      semesterId: filters.semesterId || undefined,
    },
    { skip: !filters.termId },
  );
  const preview = previewData?.data;
  const availableMonths = useMemo(() => preview?.availableMonths || [], [preview]);

  // If the currently-selected month falls out of the available list (scope
  // narrowed further, or the preview refreshed), clear it rather than
  // silently keep a stale/now-invalid selection.
  useEffect(() => {
    if (billingMonth && availableMonths.length > 0 && !availableMonths.some((m) => m.month === billingMonth)) {
      setBillingMonth("");
    }
  }, [availableMonths, billingMonth]);

  const termName = terms?.find((t) => t._id === filters.termId)?.name || "—";
  const deptName = filters.departmentId
    ? departments?.find((d) => d._id === filters.departmentId)?.name
    : "All Departments";
  const progName = filters.programId
    ? universityPrograms.find((p) => p._id === filters.programId)?.name
    : "All Programs";
  const semLabel = filters.semesterId
    ? `Sem ${semesters.find((s) => s._id === filters.semesterId)?.number}`
    : "All Semesters";

  const goToReview = () => {
    if (!filters.termId) return alert("Please select a Session first.");
    if (!billingMonth) return alert("Please select a Billing Month to scan for.");
    if (!generationDate) return alert("Please select a Generation Date.");
    if (!dueDate) return alert("Please select a Due Date for the generated challans.");
    setStep("review");
  };

  const handleGenerate = async () => {
    const res = await actions.autoGenerate({
      termId: filters.termId,
      departmentId: filters.departmentId || null,
      programId: filters.programId || null,
      semesterId: filters.semesterId || null,
      billingMonth,
      generationDate,
      dueDate,
      feeTypes: ["tuition"],
      allowMultipleTuition,
      includeArrears,
    });
    setResult(res?.data || null);
    setStep("configure");
  };

  const startOver = () => {
    setResult(null);
    setFilters(EMPTY_FILTERS);
    setBillingMonth("");
    setGenerationDate(todayISO());
    setDueDate("");
    setAllowMultipleTuition(false);
    setIncludeArrears(true);
    setStep("configure");
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Auto Fee Generator</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Pick a month and due date — every student whose plan has a fee due
                that month gets a challan automatically.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <StepDot index={1} label="Configure" active={step === "configure"} done={step === "review"} />
            <div className="flex-1 h-px bg-slate-200" />
            <StepDot index={2} label="Review & Generate" active={step === "review"} done={false} />
          </div>
        </div>

        {step === "configure" ? (
          <div className="p-6 space-y-5">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                <Filter size={14} /> Scope (optional narrowing)
              </h3>
              <div className="grid grid-cols-2 gap-3">
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
                    Class
                  </label>
                  <select
                    className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                    value={filters.departmentId}
                    onChange={(e) => handleFilterChange("departmentId", e.target.value)}
                  >
                    <option value="">All Classes</option>
                    {departments?.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">
                    Program
                  </label>
                  <select
                    className="w-full p-2.5 text-sm border border-slate-200 rounded-lg disabled:bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                    value={filters.programId}
                    disabled={!filters.departmentId}
                    onChange={(e) => handleFilterChange("programId", e.target.value)}
                  >
                    <option value="">All Programs</option>
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
                    onChange={(e) => handleFilterChange("semesterId", e.target.value)}
                  >
                    <option value="">All Sections</option>
                    {semesters.map((s) => (
                      <option key={s._id} value={s._id}>
                        Sem {s.number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live match count — the "intelligent" part: shows real
                  numbers the instant a Session is picked, not a guess. */}
              {filters.termId && (
                <div className="mt-3 flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3.5 py-2.5">
                  <Users size={15} className="text-indigo-600 shrink-0" />
                  {isPreviewLoading ? (
                    <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                      <Loader2 size={12} className="animate-spin" /> Scanning students...
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-indigo-700">
                      {preview?.totalStudents ?? 0} student(s) in this scope —{" "}
                      {preview?.studentsWithPlan ?? 0} with a saved fee/installment plan
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                <Calendar size={14} /> Generation Trigger
              </h3>
              <div className="space-y-1.5 mb-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase">
                  Billing Month <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700 cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  disabled={!filters.termId || isPreviewLoading || availableMonths.length === 0}
                >
                  <option value="">
                    {!filters.termId
                      ? "Select a Session first..."
                      : isPreviewLoading
                        ? "Scanning..."
                        : availableMonths.length === 0
                          ? "No months left to bill in this scope"
                          : "Select Month..."}
                  </option>
                  {availableMonths.map((m) => (
                    <option key={m.month} value={m.month}>
                      {m.month} ({m.count} student{m.count === 1 ? "" : "s"})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 font-medium">
                  Only months where at least one student still has a fee due are shown —
                  already-billed months are hidden automatically.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <CalendarClock size={12} /> Generation Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
                    value={generationDate}
                    onChange={(e) => setGenerationDate(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-400 font-medium">
                    When the challan is issued/created.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-400 font-medium">
                    When payment is actually due.
                  </p>
                </div>
              </div>

              <label className="flex items-center justify-between p-3 mt-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                <span className="text-xs font-bold text-slate-600">
                  Allow Multiple Tuition Challans in this Session
                </span>
                <input
                  type="checkbox"
                  checked={allowMultipleTuition}
                  onChange={(e) => setAllowMultipleTuition(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 mt-2 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <Wallet size={14} /> Include unpaid/overdue balances (arrears) in the new challan
                </span>
                <input
                  type="checkbox"
                  checked={includeArrears}
                  onChange={(e) => setIncludeArrears(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                />
              </label>
            </div>

            <button
              onClick={goToReview}
              className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-200"
            >
              Review Setup <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Your Setup
                </h3>
                <button
                  onClick={() => setStep("configure")}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Pencil size={12} /> Edit
                </button>
              </div>
              <SummaryRow label="Session" value={termName} />
              <SummaryRow label="Class" value={deptName} />
              <SummaryRow label="Program" value={progName} />
              <SummaryRow label="Section" value={semLabel} />
              <SummaryRow
                label="Students in scope"
                value={`${preview?.totalStudents ?? 0} (${preview?.studentsWithPlan ?? 0} with a plan)`}
              />
              <SummaryRow label="Billing Month" value={billingMonth} />
              <SummaryRow
                label="Generation Date"
                value={new Date(generationDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              />
              <SummaryRow
                label="Due Date"
                value={new Date(dueDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              />
              <SummaryRow
                label="Multiple Tuition Challans"
                value={allowMultipleTuition ? "Allowed" : "Not allowed"}
              />
              <SummaryRow
                label="Include Arrears"
                value={includeArrears ? "Yes — merged into new challan" : "No — left separate"}
              />
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-800 font-medium">
                Only students whose saved fee/installment plan is actually due in{" "}
                <b>{billingMonth || "this month"}</b> will get a challan. Everyone else is left
                untouched — nothing is generated blindly.
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isProcessing}
              className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-70"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Scanning & Generating...
                </>
              ) : (
                <>
                  <Zap size={18} /> Confirm & Generate
                </>
              )}
            </button>
          </div>
        )}

        {result && (
          <div className="border-t border-slate-100 bg-slate-50 p-6 space-y-4 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Last Run Report
              </h3>
              <button
                onClick={startOver}
                className="text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                Run another
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                <div className="text-2xl font-black text-slate-800">
                  {result.matchedCount ?? 0}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                  Matched
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-emerald-200 text-center">
                <div className="text-2xl font-black text-emerald-600 flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={20} /> {result.successCount ?? 0}
                </div>
                <div className="text-[10px] font-bold text-emerald-500 uppercase mt-1">
                  Generated
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-rose-200 text-center">
                <div className="text-2xl font-black text-rose-600 flex items-center justify-center gap-1.5">
                  <XCircle size={20} /> {result.failedCount ?? 0}
                </div>
                <div className="text-[10px] font-bold text-rose-500 uppercase mt-1">
                  Failed
                </div>
              </div>
            </div>

            {result.errors?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h4 className="text-amber-800 font-bold text-xs uppercase flex items-center gap-1.5 mb-2">
                  <AlertTriangle size={14} /> Details
                </h4>
                <div className="space-y-1 max-h-48 overflow-y-auto sr-scroll">
                  {result.errors.map((err, i) => (
                    <div
                      key={i}
                      className="text-[11px] text-amber-800 bg-white/60 px-2.5 py-1.5 rounded border border-amber-100"
                    >
                      {err}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoFeeGenerator;
