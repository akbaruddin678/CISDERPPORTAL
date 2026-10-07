import React from "react";
import {
  ClipboardCheck,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Ban,
} from "lucide-react";
import { EmptyState, ToastView } from "../../Graduation/common/graduationUi";

const selectCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white";

const ResultRow = ({ row, tone }) => (
  <div className="px-4 py-3">
    <p className="text-sm font-bold text-slate-800">
      {row.fullName || row.regNo}
      {row.regNo && <span className="ml-2 font-mono text-[11px] font-semibold text-slate-400">{row.regNo}</span>}
    </p>
    {tone === "done" ? (
      <p className="text-xs font-medium text-emerald-700 mt-0.5">
        CGPA {row.cgpa != null ? row.cgpa.toFixed(2) : "—"} · {row.earnedCredits}/{row.requiredCredits ?? "—"} credits
      </p>
    ) : tone === "timeBarred" ? (
      <p className="text-xs font-medium text-rose-700 mt-0.5">
        {row.semestersElapsed} semesters elapsed, exceeds the {row.maxAllowed}-semester limit for this batch
      </p>
    ) : (
      <ul className="mt-1 text-xs font-medium text-amber-800 list-disc pl-4 space-y-0.5">
        {(row.reasons || []).map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    )}
  </div>
);

const DegreeAuditView = ({
  toast,
  programs,
  programId,
  setProgramId,
  terms,
  admissionTermId,
  setAdmissionTermId,
  run,
  isRunning,
  result,
  reset,
}) => (
  <div className="min-h-screen bg-slate-50">
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
          <ClipboardCheck size={19} />
        </span>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight">Degree Audit</h1>
          <p className="text-xs font-medium text-slate-500">
            Batch Completion — checks CGPA, credit hours and curriculum coverage for final-section students
            and marks the ones who qualify as academically complete.
          </p>
        </div>
      </div>
    </div>

    <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Program
            </span>
            <select value={programId} onChange={(e) => { setProgramId(e.target.value); reset(); }} className={selectCls}>
              <option value="">Select a program…</option>
              {programs.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Admission batch (optional)
            </span>
            <select
              value={admissionTermId}
              onChange={(e) => { setAdmissionTermId(e.target.value); reset(); }}
              className={selectCls}
            >
              <option value="">All batches</option>
              {terms.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={run}
            disabled={!programId || isRunning}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            {isRunning ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {isRunning ? "Running…" : "Run Audit"}
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900">
              {result.done.length} became eligible
              {result.failed.length ? `, ${result.failed.length} not yet eligible` : ""}
              {result.timeBarred?.length ? `, ${result.timeBarred.length} struck off (time barred)` : ""}
            </h2>
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              <RotateCcw size={13} /> Clear results
            </button>
          </div>

          {result.done.length > 0 && (
            <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700">
                <CheckCircle2 size={15} />
                <span className="text-xs font-black uppercase tracking-wider">Academically completed</span>
              </div>
              <div className="divide-y divide-slate-100">
                {result.done.map((row) => (
                  <ResultRow key={row.studentId} row={row} tone="done" />
                ))}
              </div>
            </div>
          )}

          {result.failed.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-800">
                <AlertTriangle size={15} />
                <span className="text-xs font-black uppercase tracking-wider">Not yet eligible</span>
              </div>
              <div className="divide-y divide-slate-100">
                {result.failed.map((row) => (
                  <ResultRow key={row.studentId} row={row} tone="failed" />
                ))}
              </div>
            </div>
          )}

          {result.timeBarred?.length > 0 && (
            <div className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-700">
                <Ban size={15} />
                <span className="text-xs font-black uppercase tracking-wider">Struck off — time barred</span>
              </div>
              <div className="divide-y divide-slate-100">
                {result.timeBarred.map((row) => (
                  <ResultRow key={row.studentId} row={row} tone="timeBarred" />
                ))}
              </div>
            </div>
          )}

          {result.done.length === 0 && result.failed.length === 0 && !result.timeBarred?.length && (
            <EmptyState
              icon={ClipboardCheck}
              title="No final-section students in scope"
              hint="No active student in this program (and batch, if selected) is in their final semester yet."
            />
          )}
        </div>
      )}
    </div>

    <ToastView toast={toast} />
  </div>
);

export default DegreeAuditView;
