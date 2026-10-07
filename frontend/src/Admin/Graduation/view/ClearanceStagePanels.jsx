import React from "react";
import {
  ClipboardCheck,
  Building2,
  Wallet,
  BadgeCheck,
  Loader2,
  CircleAlert,
  CircleCheck,
  Undo2,
  FileDown,
  PartyPopper,
  GraduationCap,
} from "lucide-react";
import {
  CheckList,
  SectionCard,
  StepPill,
  SummaryTiles,
  CourseTable,
} from "../common/graduationUi";
import { fmtDate, fmtDateTime, fmtRs } from "../common/graduationHelpers";
import { exportTranscriptPDF } from "../common/graduationExport";

const PrimaryButton = ({ children, disabled, busy, onClick, tone = "indigo" }) => (
  <button
    disabled={disabled || busy}
    onClick={onClick}
    className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
      tone === "emerald"
        ? "bg-emerald-600 hover:bg-emerald-700"
        : "bg-indigo-600 hover:bg-indigo-700"
    }`}
  >
    {busy && <Loader2 size={15} className="animate-spin" />}
    {children}
  </button>
);

const GhostDanger = ({ children, disabled, onClick, icon }) => {
  const Icon = icon;
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 ring-1 ring-rose-200 transition-all disabled:opacity-40"
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
};

const RemarksBox = ({ value, onChange, placeholder = "Remarks (optional)" }) => (
  <textarea
    rows={2}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
  />
);

const Hint = ({ tone = "amber", children }) => (
  <p
    className={`text-xs font-semibold rounded-xl px-3.5 py-2.5 ${
      tone === "rose" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
    }`}
  >
    {children}
  </p>
);

// ---------------------------------------------------------------- HOD / EXAM
export const AcademicPanel = ({ c, stageKey }) => {
  const { data, clearance, permissions, checks } = c;
  const isHod = stageKey === "hod";
  const canAct = !!permissions[stageKey];
  const report = data?.report;
  const returned = isHod && clearance.stages.exam.status === "rejected";

  return (
    <div className="space-y-5">
      {returned && (
        <div className="flex items-start gap-3 rounded-2xl bg-rose-50 ring-1 ring-rose-200 p-4 text-sm text-rose-800">
          <Undo2 size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-black">Returned by the Examination Office</p>
            <p className="font-medium mt-0.5">
              {clearance.stages.exam.remarks || "No reason recorded."}
              <span className="text-rose-500"> — {clearance.stages.exam.actedByName}</span>
            </p>
          </div>
        </div>
      )}

      <SectionCard
        title={isHod ? "Academic verification" : "Examination review"}
        icon={ClipboardCheck}
      >
        {report ? (
          <div className="space-y-5">
            <SummaryTiles summary={report.summary} requirements={report.requirements} />
            <CheckList
              checks={checks}
              editable={canAct}
              confirmations={c.confirmations}
              onConfirm={c.setConfirmation}
            />
            {canAct && (
              <>
                <RemarksBox value={c.remarks} onChange={c.setRemarks} />
                {c.blockers.length > 0 ? (
                  <Hint tone="rose">
                    {c.blockers.length} requirement(s) are not met — this can't be approved until they are resolved.
                  </Hint>
                ) : c.missingRemarks.length > 0 ? (
                  <Hint>Add a confirmation remark for {c.missingRemarks.length} item(s) the system couldn't verify.</Hint>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  {isHod ? (
                    <PrimaryButton
                      disabled={!c.canSubmitChecks}
                      busy={c.isActing}
                      onClick={c.submitHod}
                    >
                      Submit to Examination Office
                    </PrimaryButton>
                  ) : (
                    <>
                      <PrimaryButton
                        disabled={!c.canSubmitChecks}
                        busy={c.isActing}
                        onClick={c.approveExam}
                      >
                        Approve &amp; open offices
                      </PrimaryButton>
                      <GhostDanger icon={Undo2} onClick={() => c.openDialog({ kind: "exam-reject" })}>
                        Return to HOD
                      </GhostDanger>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm font-medium text-slate-400">Loading academic report…</p>
        )}
      </SectionCard>

      {report && (
        <SectionCard title="Course results" icon={GraduationCap}>
          <CourseTable semesters={report.semesters} />
        </SectionCard>
      )}
    </div>
  );
};

// ------------------------------------------------------------------- OFFICES
export const OfficesPanel = ({ c }) => {
  const { clearance, permissions, data } = c;
  return (
    <SectionCard title="Auxiliary office clearances" icon={Building2}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clearance.offices.map((o) => {
          const mine = permissions.officeKeys?.includes(o.key);
          const auto = data?.officeChecks?.[o.key];
          const blocked = auto?.state === "blocked";
          return (
            <div
              key={o.key}
              className={`rounded-2xl border p-4 ${
                mine ? "border-indigo-300 bg-indigo-50/40 ring-2 ring-indigo-100" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-slate-900">{o.name}</p>
                  {mine && <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Your desk</p>}
                </div>
                <StepPill status={o.status} />
              </div>

              {auto && auto.state !== "manual" && (
                <p
                  className={`mt-3 text-xs font-semibold rounded-lg px-3 py-2 ${
                    blocked ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {auto.detail}
                </p>
              )}

              {o.actedByName && o.status !== "pending" && (
                <p className="mt-3 text-[11px] font-medium text-slate-500">
                  {o.actedByName === "System" ? "Automatically marked not applicable" : o.actedByName} ·{" "}
                  {fmtDateTime(o.actedAt)}
                  {o.remarks && o.actedByName !== "System" ? (
                    <span className="block text-slate-700 font-semibold mt-0.5">“{o.remarks}”</span>
                  ) : null}
                </p>
              )}

              {o.status === "pending" && !mine && (
                <p className="mt-3 text-xs font-medium text-slate-400">Waiting for {o.name} to clear.</p>
              )}

              {mine && (
                <div className="mt-4 space-y-2.5">
                  <input
                    value={c.officeRemarks[o.key] || ""}
                    onChange={(e) => c.setOfficeRemark(o.key, e.target.value)}
                    placeholder="Remarks (required if not cleared)"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={blocked || c.isActing}
                      onClick={() => c.approveOffice(o.key)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40"
                    >
                      <CircleCheck size={14} /> Mark cleared
                    </button>
                    <button
                      disabled={c.isActing}
                      onClick={() => c.openDialog({ kind: "office-reject", officeKey: o.key })}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 ring-1 ring-rose-200 disabled:opacity-40"
                    >
                      <CircleAlert size={14} /> Not cleared
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};

// ------------------------------------------------------------------- FINANCE
const DuesTable = ({ finance }) => (
  <div className="space-y-3">
    <div
      className={`flex items-center justify-between rounded-xl px-4 py-3 ${
        finance.outstanding > 0 ? "bg-rose-50 ring-1 ring-rose-200" : "bg-emerald-50 ring-1 ring-emerald-200"
      }`}
    >
      <p className={`text-sm font-black ${finance.outstanding > 0 ? "text-rose-700" : "text-emerald-700"}`}>
        {finance.outstanding > 0 ? "Outstanding dues" : "No outstanding dues"}
      </p>
      <p className={`text-lg font-black ${finance.outstanding > 0 ? "text-rose-700" : "text-emerald-700"}`}>
        {fmtRs(finance.outstanding)}
      </p>
    </div>
    {finance.challans.length > 0 && (
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="text-left font-bold px-3 py-2">Challan</th>
              <th className="text-left font-bold px-3 py-2">Type</th>
              <th className="text-left font-bold px-3 py-2">Due</th>
              <th className="text-right font-bold px-3 py-2">Remaining</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {finance.challans.map((ch) => (
              <tr key={ch._id}>
                <td className="px-3 py-2 font-mono font-semibold text-slate-600">{ch.challanNo}</td>
                <td className="px-3 py-2 font-semibold text-slate-700">{ch.challanType}</td>
                <td className="px-3 py-2 font-medium text-slate-500">{fmtDate(ch.dueDate)}</td>
                <td className="px-3 py-2 text-right font-black text-rose-600">{fmtRs(ch.remainingAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export const FinancePanel = ({ c }) => {
  const { clearance, permissions, data } = c;
  const finance = data?.finance;
  const canAct = !!permissions.finance;
  const rejected = clearance.stages.finance.status === "rejected";
  return (
    <SectionCard title="Accounts & Finance" icon={Wallet}>
      {!finance ? (
        <p className="text-sm font-medium text-slate-400">Loading dues…</p>
      ) : (
        <div className="space-y-4">
          {rejected && (
            <Hint tone="rose">
              Withheld by {clearance.stages.finance.actedByName}: {clearance.stages.finance.remarks}
            </Hint>
          )}
          <DuesTable finance={finance} />
          <p className="text-xs font-medium text-slate-400">
            Degree-issuance and convocation fees can be billed with a challan (fee head “Degree Issuance Fee”) —
            once billed, the student can't clear until it is paid.
          </p>
          {canAct && (
            <>
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3.5 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={c.feeReceived}
                  onChange={(e) => c.setFeeReceived(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-indigo-600"
                />
                <span className="text-sm font-bold text-slate-800">
                  Degree issuance / convocation fee has been received
                </span>
              </label>
              <RemarksBox value={c.remarks} onChange={c.setRemarks} />
              <div className="flex flex-wrap gap-3">
                <PrimaryButton
                  disabled={finance.outstanding > 0 || !c.feeReceived}
                  busy={c.isActing}
                  onClick={c.approveFinance}
                >
                  Clear finance &amp; send to Registrar
                </PrimaryButton>
                <GhostDanger onClick={() => c.openDialog({ kind: "finance-reject" })}>Withhold clearance</GhostDanger>
              </div>
            </>
          )}
        </div>
      )}
    </SectionCard>
  );
};

// ----------------------------------------------------------------- REGISTRAR
export const RegistrarPanel = ({ c }) => {
  const { clearance, permissions, data } = c;
  const canAct = !!permissions.registrar;
  const report = data?.report;
  const rejected = clearance.stages.registrar.status === "rejected";
  return (
    <div className="space-y-5">
      <SectionCard title="Registrar's final approval" icon={BadgeCheck}>
        <div className="space-y-4">
          {rejected && (
            <Hint tone="rose">
              Withheld by {clearance.stages.registrar.actedByName}: {clearance.stages.registrar.remarks}
            </Hint>
          )}
          {report && <SummaryTiles summary={report.summary} requirements={report.requirements} />}
          {data?.finance && data.finance.outstanding > 0 && (
            <Hint tone="rose">
              New dues of {fmtRs(data.finance.outstanding)} appeared after Finance signed off — graduation is blocked
              until they are paid.
            </Hint>
          )}
          <p className="text-xs font-medium text-slate-500">
            Confirming will mark the student as <b>Graduated</b>, issue a degree serial number and add them to the
            official graduate list.
          </p>
          {canAct && (
            <>
              <RemarksBox value={c.remarks} onChange={c.setRemarks} />
              <div className="flex flex-wrap gap-3">
                <PrimaryButton
                  tone="emerald"
                  busy={c.isActing}
                  disabled={!!(data?.finance && data.finance.outstanding > 0)}
                  onClick={c.finalize}
                >
                  <PartyPopper size={16} /> Confirm graduation
                </PrimaryButton>
                <GhostDanger onClick={() => c.openDialog({ kind: "registrar-reject" })}>Withhold approval</GhostDanger>
              </div>
            </>
          )}
        </div>
      </SectionCard>
      {report && (
        <SectionCard title="Course results" icon={GraduationCap}>
          <CourseTable semesters={report.semesters} />
        </SectionCard>
      )}
    </div>
  );
};

// ----------------------------------------------------------------- COMPLETED
export const CompletedPanel = ({ c }) => {
  const { clearance, data } = c;
  const transcript = data?.transcript;
  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 shadow-lg shadow-emerald-200">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-100">
          <PartyPopper size={16} /> Graduated
        </p>
        <p className="text-3xl font-black mt-2 tracking-tight">{clearance.degreeSerial}</p>
        <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4 text-sm font-semibold text-emerald-50">
          <span>Date: {fmtDate(clearance.graduatedAt)}</span>
          <span>CGPA: {clearance.cgpa != null ? Number(clearance.cgpa).toFixed(2) : "—"}</span>
          <span>Batch: {clearance.graduationYear}</span>
        </div>
        {transcript && (
          <button
            onClick={() =>
              exportTranscriptPDF(transcript, {
                degreeSerial: clearance.degreeSerial,
                graduatedAt: clearance.graduatedAt,
              })
            }
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-bold ring-1 ring-white/30"
          >
            <FileDown size={15} /> Download transcript (PDF)
          </button>
        )}
      </div>
      {transcript && (
        <SectionCard title="Official transcript" icon={GraduationCap}>
          <CourseTable semesters={transcript.semesters} />
        </SectionCard>
      )}
    </div>
  );
};

// Transcript download while the clearance is still in progress (Exam Office
// froze it on approval).
export const TranscriptButton = ({ transcript, clearance }) =>
  transcript ? (
    <button
      onClick={() =>
        exportTranscriptPDF(transcript, {
          degreeSerial: clearance.degreeSerial,
          graduatedAt: clearance.graduatedAt,
        })
      }
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 ring-1 ring-indigo-200"
    >
      <FileDown size={14} /> Transcript PDF
    </button>
  ) : null;
