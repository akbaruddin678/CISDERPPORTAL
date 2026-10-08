import React from "react";
import { X, History, CircleCheck, CircleAlert, Ban, Loader2 } from "lucide-react";
import { StudentAvatar } from "../../HeadofDepartment/view/HodStudentBits";
import {
  StageTracker,
  StagePill,
  SectionCard,
  ReasonDialog,
  ErrorBox,
} from "../common/graduationUi";
import { STAGES, fmtDateTime } from "../common/graduationHelpers";
import {
  AcademicPanel,
  OfficesPanel,
  FinancePanel,
  RegistrarPanel,
  CompletedPanel,
  TranscriptButton,
} from "./ClearanceStagePanels";

const ACTION_TEXT = {
  started: "Clearance started",
  hod_submitted: "HOD verified and submitted",
  exam_approved: "Examination Office approved",
  exam_rejected: "Examination Office returned it",
  office_approved: "Office cleared",
  office_rejected: "Office marked not cleared",
  finance_approved: "Finance cleared",
  finance_rejected: "Finance withheld clearance",
  graduated: "Graduated",
  registrar_rejected: "Registrar withheld approval",
  cancelled: "Cancelled",
};

const DIALOGS = {
  "exam-reject": { title: "Return to Head of Department", label: "Why is it being returned?", confirm: "Return to HOD" },
  "office-reject": { title: "Mark as not cleared", label: "What is still outstanding?", confirm: "Mark not cleared" },
  "finance-reject": { title: "Withhold finance clearance", label: "Reason", confirm: "Withhold" },
  "registrar-reject": { title: "Withhold final approval", label: "Reason", confirm: "Withhold" },
  cancel: { title: "Cancel this clearance", label: "Why is it being cancelled?", confirm: "Cancel clearance" },
};

const SignOffs = ({ clearance }) => {
  const rows = [];
  STAGES.filter((s) => s.key !== "offices").forEach((s) => {
    const step = clearance.stages[s.key];
    if (step && ["approved", "rejected"].includes(step.status)) {
      rows.push({ key: s.key, label: s.label, step });
    }
  });
  clearance.offices
    .filter((o) => ["approved", "rejected"].includes(o.status))
    .forEach((o) => rows.push({ key: `office-${o.key}`, label: o.name, step: o }));
  if (!rows.length) return null;

  return (
    <SectionCard title="Sign-offs" icon={CircleCheck}>
      <ul className="space-y-3">
        {rows.map(({ key, label, step }) => (
          <li key={key} className="flex items-start gap-3">
            {step.status === "approved" ? (
              <CircleCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <CircleAlert size={18} className="text-rose-500 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">{label}</p>
              <p className="text-[11px] font-medium text-slate-500">
                {step.actedByName} · {fmtDateTime(step.actedAt)}
              </p>
              {step.remarks && <p className="text-xs font-semibold text-slate-700 mt-1">“{step.remarks}”</p>}
              {step.confirmations?.length > 0 && (
                <ul className="mt-1.5 space-y-1">
                  {step.confirmations.map((cf) => (
                    <li key={cf.key} className="text-[11px] font-semibold text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1">
                      Manually confirmed — {cf.label}: {cf.remark}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
};

const Timeline = ({ history }) => (
  <SectionCard title="Activity" icon={History}>
    <ol className="relative border-l-2 border-slate-100 ml-2 space-y-4">
      {[...history].reverse().map((h) => (
        <li key={`${h.at}-${h.action}-${h.officeKey || ""}`} className="pl-5 relative">
          <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-indigo-400 ring-4 ring-white" />
          <p className="text-xs font-bold text-slate-800">
            {ACTION_TEXT[h.action] || h.action}
            {h.officeKey ? <span className="text-slate-400"> · {h.officeKey}</span> : null}
          </p>
          <p className="text-[11px] font-medium text-slate-400">
            {h.byName} · {fmtDateTime(h.at)}
          </p>
          {h.remarks && <p className="text-xs font-medium text-slate-600 mt-0.5">“{h.remarks}”</p>}
        </li>
      ))}
    </ol>
  </SectionCard>
);

const ClearanceDrawer = ({ c, onClose }) => {
  const { clearance, stage, data, permissions } = c;
  const dialogMeta = c.dialog ? DIALOGS[c.dialog.kind] : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative w-full max-w-3xl h-full bg-slate-50 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
          {clearance ? (
            <div className="flex items-center gap-3 min-w-0">
              <StudentAvatar name={clearance.student?.fullName} />
              <div className="min-w-0">
                <p className="text-base font-black text-slate-900 truncate">{clearance.student?.fullName}</p>
                <p className="text-[11px] font-mono font-semibold text-slate-400 truncate">
                  {clearance.student?.regNo} · {clearance.program?.name || "—"}
                  {clearance.semesterNumber != null ? ` · Section ${clearance.semesterNumber}` : ""}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm font-bold text-slate-400">Loading…</p>
          )}
          <div className="flex items-center gap-3 shrink-0">
            {c.isRefreshing && <Loader2 size={16} className="animate-spin text-indigo-500" />}
            {clearance && <StagePill stage={clearance.status === "graduated" ? "completed" : clearance.currentStage} />}
            <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className={`p-6 space-y-5 transition-opacity ${c.isRefreshing ? "opacity-50 pointer-events-none" : ""}`}>
          {c.errorMessage && <ErrorBox message={c.errorMessage} />}
          {c.isLoading && (
            <div className="flex justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin" />
            </div>
          )}

          {clearance && (
            <>
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-4 py-6">
                <StageTracker clearance={clearance} />
                {clearance.department?.name && (
                  <p className="text-center text-[11px] font-semibold text-slate-400 mt-4">
                    {clearance.department.name} · started by {clearance.startedByName}
                  </p>
                )}
              </div>

              {clearance.status === "cancelled" && (
                <div className="flex items-start gap-3 rounded-2xl bg-slate-100 ring-1 ring-slate-200 p-4 text-sm text-slate-600">
                  <Ban size={18} className="shrink-0 mt-0.5" />
                  <p className="font-medium">
                    <b>Cancelled.</b> {clearance.cancelReason}
                  </p>
                </div>
              )}

              {clearance.status === "graduated" && <CompletedPanel c={c} />}
              {clearance.status === "in_progress" && stage === "hod" && <AcademicPanel c={c} stageKey="hod" />}
              {clearance.status === "in_progress" && stage === "exam" && <AcademicPanel c={c} stageKey="exam" />}
              {clearance.status === "in_progress" && stage === "offices" && <OfficesPanel c={c} />}
              {clearance.status === "in_progress" && stage === "finance" && <FinancePanel c={c} />}
              {clearance.status === "in_progress" && stage === "registrar" && <RegistrarPanel c={c} />}

              {clearance.status === "in_progress" && data?.transcript && stage !== "exam" && (
                <div className="flex justify-end">
                  <TranscriptButton transcript={data.transcript} clearance={clearance} />
                </div>
              )}

              <SignOffs clearance={clearance} />
              <Timeline history={clearance.history} />

              {permissions.cancel && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => c.openDialog({ kind: "cancel" })}
                    className="text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    Cancel this clearance
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {dialogMeta && (
        <ReasonDialog
          title={dialogMeta.title}
          label={dialogMeta.label}
          confirmLabel={dialogMeta.confirm}
          busy={c.isActing}
          onConfirm={c.confirmDialog}
          onClose={c.closeDialog}
        />
      )}
    </div>
  );
};

export default ClearanceDrawer;
