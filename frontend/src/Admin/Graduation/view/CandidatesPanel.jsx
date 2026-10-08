import React from "react";
import {
  Loader2,
  Rocket,
  X,
  Users,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { StudentAvatar } from "../../HeadofDepartment/view/HodStudentBits";
import { CheckList, SummaryTiles, SectionCard, EmptyState, ErrorBox } from "../common/graduationUi";

const Modal = ({ children, onClose, wide = false }) => (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className={`w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl`}
    >
      {children}
    </div>
  </div>
);

const PreviewDialog = ({ w }) => {
  const report = w.eligibility?.report;
  const student = w.eligibility?.student;
  const blockers = (report?.checks || []).filter((c) => c.status === "fail");
  return (
    <Modal wide onClose={w.closePreview}>
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <StudentAvatar name={student?.fullName} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-900 truncate">{student?.fullName || "Loading…"}</p>
            <p className="text-[11px] font-mono font-semibold text-slate-400">{student?.regNo}</p>
          </div>
        </div>
        <button onClick={w.closePreview} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500">
          <X size={18} />
        </button>
      </div>
      <div className="p-6 space-y-4 bg-slate-50 rounded-b-3xl">
        {w.eligibilityErrorMessage && <ErrorBox message={w.eligibilityErrorMessage} />}
        {w.isLoadingEligibility && (
          <div className="flex justify-center py-12 text-slate-400">
            <Loader2 className="animate-spin" />
          </div>
        )}
        {report && (
          <>
            <SummaryTiles summary={report.summary} requirements={report.requirements} />
            <SectionCard title="Where this student stands">
              <CheckList checks={report.checks} />
            </SectionCard>
            <p className="text-xs font-medium text-slate-500">
              Starting opens the clearance file. You'll confirm anything the system can't verify on the next
              screen before sending it to the Examination Office.
            </p>
            <div className="flex flex-wrap justify-end gap-3">
              <button onClick={w.closePreview} className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100">
                Not now
              </button>
              <button
                disabled={w.isStarting}
                onClick={() => w.start(student._id)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40"
              >
                {w.isStarting ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
                Start clearance{blockers.length ? " anyway" : ""}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

const BulkConfirmDialog = ({ w }) => {
  const byProgram = w.selectedStudents.reduce((acc, s) => {
    acc[s.programName || "Unknown program"] = (acc[s.programName || "Unknown program"] || 0) + 1;
    return acc;
  }, {});
  const n = w.selectedIds.length;
  return (
    <Modal onClose={w.isBulkStarting ? undefined : w.closeBulk}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <span className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers size={22} />
          </span>
          <div>
            <h3 className="text-lg font-black text-slate-900">
              Start clearance for {n} student{n === 1 ? "" : "s"}?
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              A clearance file opens for each one. You'll still confirm each student's details and send them
              to the Examination Office from the <span className="font-bold text-slate-700">To submit</span> tab.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 ring-1 ring-slate-200 divide-y divide-slate-200 overflow-hidden">
          {Object.entries(byProgram).map(([name, count]) => (
            <div key={name} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="font-semibold text-slate-700 truncate pr-3">{name}</span>
              <span className="font-black text-slate-900">{count}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={w.closeBulk}
            disabled={w.isBulkStarting}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={w.confirmBulk}
            disabled={w.isBulkStarting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 disabled:opacity-60"
          >
            {w.isBulkStarting ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
            {w.isBulkStarting ? "Starting…" : `Start ${n} clearance${n === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const BulkResultDialog = ({ w }) => {
  const { started = [], skipped = [] } = w.bulkResult || {};
  return (
    <Modal onClose={() => w.finishBulk(false)}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <span
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              started.length ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            }`}
          >
            {started.length ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
          </span>
          <div>
            <h3 className="text-lg font-black text-slate-900">
              {started.length
                ? `${started.length} clearance${started.length === 1 ? "" : "s"} started`
                : "Nothing was started"}
            </h3>
            {skipped.length > 0 && (
              <p className="text-sm text-slate-500 mt-1">
                {skipped.length} student{skipped.length === 1 ? " was" : "s were"} skipped — see why below.
              </p>
            )}
          </div>
        </div>

        {skipped.length > 0 && (
          <div className="mt-5 max-h-60 overflow-y-auto rounded-2xl ring-1 ring-amber-200 bg-amber-50/60 divide-y divide-amber-100">
            {skipped.map((s) => (
              <div key={s.studentId} className="px-4 py-2.5">
                <p className="text-sm font-bold text-slate-800">{s.fullName || s.studentId}</p>
                <p className="text-xs font-medium text-amber-800">{s.reason}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => w.finishBulk(false)}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            Stay here
          </button>
          {started.length > 0 && (
            <button
              onClick={() => w.finishBulk(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200"
            >
              Go to “To submit”
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

const SemesterBar = ({ number, total, isFinal }) => {
  if (number == null) return <span className="text-[11px] font-semibold text-slate-400">No section</span>;
  const pct = total ? Math.min(100, Math.round((number / total) * 100)) : 0;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[10px] font-bold mb-1">
        <span className={isFinal ? "text-emerald-600" : "text-slate-500"}>
          Section {number}
          {total ? ` of ${total}` : ""}
        </span>
        {isFinal && <span className="text-emerald-600">Final</span>}
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${isFinal ? "bg-emerald-500" : "bg-indigo-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const Check = ({ checked, onChange, label }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    aria-label={label}
    className="w-[18px] h-[18px] rounded-md accent-indigo-600 cursor-pointer shrink-0"
  />
);

const CandidatesPanel = ({ w }) => {
  const picked = w.selectedIds.length;
  return (
    <div className="space-y-4 pb-24">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={w.programId}
          onChange={(e) => w.setProgramId(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <option value="">All programs</option>
          {(w.candidateMeta.programs || []).map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>

        {w.candidateMeta.total != null && (
          <span className="ml-auto text-xs font-bold text-slate-400">
            {w.candidateMeta.total} student{w.candidateMeta.total === 1 ? "" : "s"} eligible
          </span>
        )}
      </div>

      {w.candidatesErrorMessage && <ErrorBox message={w.candidatesErrorMessage} />}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {w.candidates.length > 0 && (
          <div className="flex items-center gap-4 px-5 py-3 bg-slate-50/80 border-b border-slate-100">
            <Check checked={w.allPicked} onChange={w.togglePickAll} label="Select all" />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              {picked ? `${picked} selected` : "Select all"}
            </span>
            <span className="hidden md:block ml-auto w-52 text-[11px] font-black uppercase tracking-wider text-slate-400">
              Progress
            </span>
            <span className="w-28" />
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {w.isLoadingCandidates && !w.candidates.length ? (
            <div className="flex justify-center py-16 text-slate-400">
              <Loader2 className="animate-spin" />
            </div>
          ) : w.candidates.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No students to start"
              hint="No student has passed the degree audit yet. Run a Degree Audit from the Examination Office first."
            />
          ) : (
            w.candidates.map((s) => {
              const on = w.selectedIds.includes(s._id);
              return (
                <div
                  key={s._id}
                  className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                    on ? "bg-indigo-50/60" : "hover:bg-slate-50"
                  }`}
                >
                  <Check checked={on} onChange={() => w.togglePick(s._id)} label={`Select ${s.fullName}`} />
                  <StudentAvatar name={s.fullName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{s.fullName}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      <span className="font-mono font-semibold">{s.regNo}</span>
                      <span> · {s.programName}</span>
                    </p>
                  </div>
                  <div className="hidden md:block w-52">
                    <SemesterBar number={s.semesterNumber} total={s.durationStages} isFinal={s.isFinalSemester} />
                  </div>
                  <button
                    onClick={() => w.openPreview(s._id)}
                    className="w-28 px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-white hover:bg-indigo-50 ring-1 ring-indigo-200 transition-colors"
                  >
                    Review &amp; start
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {picked > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-900 text-white pl-5 pr-3 py-3 shadow-2xl shadow-slate-900/30">
            <span className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-black">
              {picked}
            </span>
            <span className="text-sm font-bold">
              {picked} student{picked === 1 ? "" : "s"} selected
            </span>
            <button
              onClick={w.clearPicked}
              className="ml-auto px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/10"
            >
              Clear
            </button>
            <button
              onClick={w.openBulkConfirm}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-500 hover:bg-indigo-400"
            >
              <Rocket size={15} /> Start clearance
            </button>
          </div>
        </div>
      )}

      {w.previewStudentId && <PreviewDialog w={w} />}
      {w.bulkStep === "confirm" && <BulkConfirmDialog w={w} />}
      {w.bulkStep === "result" && <BulkResultDialog w={w} />}
    </div>
  );
};

export default CandidatesPanel;
