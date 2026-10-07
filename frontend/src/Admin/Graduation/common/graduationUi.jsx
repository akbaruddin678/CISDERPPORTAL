import React, { useState } from "react";
import { STAGES, stageState } from "./graduationHelpers";
import {
  Check,
  X,
  AlertTriangle,
  Loader2,
  CircleAlert,
  CircleCheck,
  BookOpen,
} from "lucide-react";

const NODE_STYLES = {
  done: "bg-emerald-500 text-white ring-emerald-200",
  current: "bg-indigo-600 text-white ring-indigo-200 shadow-lg shadow-indigo-200",
  rejected: "bg-rose-500 text-white ring-rose-200",
  upcoming: "bg-white text-slate-400 ring-slate-200",
};

export const StageTracker = ({ clearance }) => {
  const officeDone = (clearance.offices || []).filter((o) =>
    ["approved", "not_applicable"].includes(o.status),
  ).length;
  return (
    <ol className="flex items-start">
      {STAGES.map((stage, i) => {
        const Icon = stage.icon;
        const state = stageState(clearance, stage.key);
        const isLast = i === STAGES.length - 1;
        return (
          <li key={stage.key} className="flex-1 min-w-0 flex flex-col items-center relative">
            {!isLast && (
              <span
                className={`absolute top-5 left-1/2 w-full h-0.5 ${
                  state === "done" ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            )}
            <span
              className={`relative z-10 w-10 h-10 rounded-2xl ring-4 flex items-center justify-center ${NODE_STYLES[state]}`}
            >
              {state === "done" ? (
                <Check size={18} strokeWidth={3} />
              ) : state === "rejected" ? (
                <X size={18} strokeWidth={3} />
              ) : (
                <Icon size={17} />
              )}
            </span>
            <span
              className={`mt-2 text-[11px] font-bold text-center leading-tight px-1 ${
                state === "upcoming" ? "text-slate-400" : "text-slate-700"
              }`}
            >
              {stage.short}
            </span>
            {stage.key === "offices" && (clearance.offices || []).length > 0 && (
              <span className="text-[10px] font-semibold text-slate-400">
                {officeDone}/{clearance.offices.length} cleared
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
};

// Compact pipeline dots for list rows.
export const StageDots = ({ clearance }) => (
  <span className="inline-flex items-center gap-1">
    {STAGES.map((s) => {
      const state = stageState(clearance, s.key);
      const cls =
        state === "done"
          ? "bg-emerald-500"
          : state === "current"
            ? "bg-indigo-600 ring-2 ring-indigo-200"
            : state === "rejected"
              ? "bg-rose-500"
              : "bg-slate-200";
      return <span key={s.key} title={s.label} className={`w-2.5 h-2.5 rounded-full ${cls}`} />;
    })}
  </span>
);

const STAGE_TEXT = {
  hod: "With HOD",
  exam: "With Exam Office",
  offices: "With Offices",
  finance: "With Accounts",
  registrar: "With Registrar",
  completed: "Graduated",
  cancelled: "Cancelled",
};
const STAGE_PILL = {
  hod: "bg-sky-50 text-sky-700 ring-sky-200",
  exam: "bg-violet-50 text-violet-700 ring-violet-200",
  offices: "bg-amber-50 text-amber-700 ring-amber-200",
  finance: "bg-teal-50 text-teal-700 ring-teal-200",
  registrar: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-slate-100 text-slate-500 ring-slate-200",
};

export const StagePill = ({ stage }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ring-1 ${
      STAGE_PILL[stage] || STAGE_PILL.cancelled
    }`}
  >
    {STAGE_TEXT[stage] || stage}
  </span>
);

const STEP_PILL = {
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  not_applicable: "bg-slate-100 text-slate-500 ring-slate-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  locked: "bg-slate-100 text-slate-400 ring-slate-200",
};
const STEP_TEXT = {
  approved: "Cleared",
  not_applicable: "Not applicable",
  pending: "Pending",
  rejected: "Not cleared",
  locked: "Waiting",
};

export const StepPill = ({ status }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ring-1 ${
      STEP_PILL[status] || STEP_PILL.locked
    }`}
  >
    {STEP_TEXT[status] || status}
  </span>
);

export const SectionCard = ({ title, icon, right, children, tone = "default" }) => {
  const Icon = icon;
  return (
    <section
      className={`rounded-2xl border p-5 ${
        tone === "danger" ? "bg-rose-50/60 border-rose-200" : "bg-white border-slate-200/80"
      } shadow-sm`}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
          {Icon && (
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Icon size={16} />
            </span>
          )}
          {title}
        </h3>
        {right}
      </div>
      {children}
    </section>
  );
};

const CHECK_ICON = {
  pass: { icon: CircleCheck, cls: "text-emerald-500" },
  fail: { icon: CircleAlert, cls: "text-rose-500" },
  unverified: { icon: AlertTriangle, cls: "text-amber-500" },
};

// One row per automatic check. With `editable`, every "unverified" row gets a
// remark box — filling it in is the manual confirmation the backend requires.
export const CheckList = ({ checks = [], confirmations = {}, onConfirm, editable = false, accepted = [] }) => {
  const acceptedMap = Object.fromEntries((accepted || []).map((a) => [a.key, a.remark]));
  return (
    <ul className="space-y-2.5">
      {checks.map((c) => {
        const meta = CHECK_ICON[c.status] || CHECK_ICON.unverified;
        const Icon = meta.icon;
        const filled = !!(confirmations[c.key] || "").trim();
        return (
          <li
            key={c.key}
            className={`rounded-xl border p-3.5 ${
              c.status === "fail"
                ? "border-rose-200 bg-rose-50/60"
                : c.status === "unverified"
                  ? "border-amber-200 bg-amber-50/50"
                  : "border-slate-200 bg-slate-50/60"
            }`}
          >
            <div className="flex items-start gap-3">
              <Icon size={18} className={`${meta.cls} shrink-0 mt-0.5`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">{c.label}</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{c.detail}</p>
                {c.status === "unverified" && editable && (
                  <div className="mt-2.5">
                    <input
                      value={confirmations[c.key] || ""}
                      onChange={(e) => onConfirm?.(c.key, e.target.value)}
                      placeholder="I confirm this manually — add a remark (required)"
                      className={`w-full rounded-lg border bg-white px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                        filled ? "border-emerald-300" : "border-amber-300"
                      }`}
                    />
                  </div>
                )}
                {c.status === "unverified" && !editable && acceptedMap[c.key] && (
                  <p className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg px-3 py-1.5">
                    Confirmed manually: {acceptedMap[c.key]}
                  </p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

const GRADE_TONE = (grade) =>
  grade === "F" ? "text-rose-600" : grade === "A" || grade === "A-" ? "text-emerald-600" : "text-slate-800";

export const SummaryTiles = ({ summary, requirements }) => {
  const tiles = [
    { label: "CGPA", value: summary.cgpa != null ? Number(summary.cgpa).toFixed(2) : "—", hint: requirements?.minCGPA != null ? `min ${Number(requirements.minCGPA).toFixed(2)}` : "" },
    { label: "Credits earned", value: summary.earnedCredits, hint: summary.requiredCredits != null ? `of ${summary.requiredCredits}` : "requirement not set" },
    { label: "Courses passed", value: summary.passedCourses, hint: `of ${summary.registeredCourses}` },
    { label: "Failed / awaiting", value: `${summary.failedCourses} / ${summary.pendingCourses}`, hint: "courses" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-xl bg-slate-50 border border-slate-200/70 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.label}</p>
          <p className="text-xl font-black text-slate-900 leading-tight mt-1">{t.value}</p>
          <p className="text-[11px] font-medium text-slate-400">{t.hint}</p>
        </div>
      ))}
    </div>
  );
};

// Semester-by-semester results. Works with both the live report and the
// frozen transcript (same row shape).
export const CourseTable = ({ semesters = [] }) => {
  if (!semesters.length) {
    return (
      <p className="text-sm font-medium text-slate-400 flex items-center gap-2">
        <BookOpen size={16} /> No course registrations on record.
      </p>
    );
  }
  return (
    <div className="space-y-5">
      {semesters.map((sem) => (
        <div key={`${sem.number}-${sem.term}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-slate-700">
              {sem.name}
              {sem.term ? <span className="text-slate-400 font-semibold"> · {sem.term}</span> : null}
            </p>
            <p className="text-[11px] font-bold text-slate-500">
              SGPA {sem.sgpa != null ? Number(sem.sgpa).toFixed(2) : "—"}
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="text-left font-bold px-3 py-2">Code</th>
                  <th className="text-left font-bold px-3 py-2">Course</th>
                  <th className="text-center font-bold px-3 py-2">Cr</th>
                  <th className="text-center font-bold px-3 py-2">%</th>
                  <th className="text-center font-bold px-3 py-2">Grade</th>
                  <th className="text-center font-bold px-3 py-2">GP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sem.courses.map((c) => (
                  <tr key={`${c.code}-${c.percentage}-${c.credits}`} className={c.counted === false ? "opacity-50" : ""}>
                    <td className="px-3 py-2 font-mono font-semibold text-slate-500">{c.code}</td>
                    <td className="px-3 py-2 font-semibold text-slate-800">
                      {c.title}
                      {c.counted === false && (
                        <span className="ml-2 text-[10px] font-bold text-slate-400">superseded by retake</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center font-semibold text-slate-600">{c.credits}</td>
                    {c.state === "graded" ? (
                      <>
                        <td className="px-3 py-2 text-center font-semibold text-slate-600">
                          {Number(c.percentage).toFixed(1)}
                        </td>
                        <td className={`px-3 py-2 text-center font-black ${GRADE_TONE(c.grade)}`}>{c.grade}</td>
                        <td className="px-3 py-2 text-center font-semibold text-slate-600">
                          {Number(c.gradePoints).toFixed(1)}
                        </td>
                      </>
                    ) : (
                      <td colSpan={3} className="px-3 py-2 text-center font-semibold text-amber-600">
                        Awaiting verified result
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

// Small modal that asks for a required reason before a rejecting action.
export const ReasonDialog = ({ title, label, confirmLabel, tone = "danger", busy, onConfirm, onClose }) => {
  const [value, setValue] = useState("");
  const valid = value.trim().length > 0;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6">
        <h4 className="text-lg font-black text-slate-900">{title}</h4>
        <label className="block text-xs font-bold text-slate-500 mt-4 mb-1.5">{label}</label>
        <textarea
          autoFocus
          rows={4}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
        />
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            disabled={!valid || busy}
            onClick={() => onConfirm(value.trim())}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 flex items-center gap-2 ${
              tone === "danger" ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ToastView = ({ toast }) =>
  toast ? (
    <div className="fixed bottom-6 right-6 z-[80]">
      <div
        className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl text-sm font-bold text-white ${
          toast.type === "error" ? "bg-rose-600" : "bg-slate-900"
        }`}
      >
        {toast.type === "error" ? <CircleAlert size={18} /> : <CircleCheck size={18} className="text-emerald-400" />}
        <span className="max-w-sm">{toast.message}</span>
      </div>
    </div>
  ) : null;

export const EmptyState = ({ icon, title, hint }) => {
  const Icon = icon;
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <span className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
        <Icon size={26} />
      </span>
      <p className="text-sm font-black text-slate-700">{title}</p>
      {hint && <p className="text-xs font-medium text-slate-400 mt-1 max-w-xs">{hint}</p>}
    </div>
  );
};

export const ErrorBox = ({ message }) => (
  <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-5 text-sm font-medium">
    <CircleAlert size={18} className="shrink-0 mt-0.5" />
    {message}
  </div>
);
