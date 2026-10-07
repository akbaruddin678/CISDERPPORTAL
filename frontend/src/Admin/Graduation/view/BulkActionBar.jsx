import React from "react";
import { Loader2, CheckCircle2, AlertTriangle, X, ListChecks } from "lucide-react";

const TONE = {
  primary: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200",
  danger: "bg-rose-600 hover:bg-rose-700 shadow-rose-200",
};

const ActionDialog = ({ w }) => {
  const spec = w.bulkAction;
  const run = w.bulkRun;
  const n = w.eligibleRows.length;
  const skippedByEligibility = w.pickedRows.length - n;
  const running = run?.status === "running";
  const finished = run?.status === "done";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={running ? undefined : w.closeBulkAction}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
      >
        {!finished ? (
          <div className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {spec.verb} {n} clearance{n === 1 ? "" : "s"}
                </h3>
                <p className="text-sm text-slate-500 mt-1">{spec.blurb}</p>
              </div>
              {!running && (
                <button onClick={w.closeBulkAction} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500">
                  <X size={18} />
                </button>
              )}
            </div>

            {skippedByEligibility > 0 && (
              <div className="mt-4 flex gap-2.5 rounded-xl bg-amber-50 ring-1 ring-amber-200 px-3.5 py-3 text-xs font-semibold text-amber-800">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                {skippedByEligibility} of your {w.pickedRows.length} selected {skippedByEligibility === 1 ? "isn't" : "aren't"} at
                this step and will be left out.
              </div>
            )}

            <label className="block mt-5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Remark for all {n} {spec.remark === "required" ? "(required)" : "(optional)"}
              </span>
              <textarea
                rows={3}
                value={w.bulkForm.remarks}
                disabled={running}
                onChange={(e) => w.setBulkForm({ ...w.bulkForm, remarks: e.target.value })}
                placeholder="Written once, recorded on every selected clearance"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white"
              />
            </label>

            {spec.confirmable && (
              <label className="mt-3 flex items-start gap-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={w.bulkForm.confirmUnverified}
                  disabled={running}
                  onChange={(e) => w.setBulkForm({ ...w.bulkForm, confirmUnverified: e.target.checked })}
                  className="w-[18px] h-[18px] mt-0.5 accent-indigo-600"
                />
                <span className="text-sm text-slate-700">
                  <span className="font-bold">Also confirm items the system couldn't verify</span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    Uses the remark above as the confirmation. Failed requirements still block a student.
                  </span>
                </span>
              </label>
            )}

            {spec.needsFeeReceived && (
              <label className="mt-3 flex items-start gap-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={w.bulkForm.feeReceived}
                  disabled={running}
                  onChange={(e) => w.setBulkForm({ ...w.bulkForm, feeReceived: e.target.checked })}
                  className="w-[18px] h-[18px] mt-0.5 accent-indigo-600"
                />
                <span className="text-sm font-bold text-slate-700">
                  The degree issuance / convocation fee has been received
                </span>
              </label>
            )}

            {w.bulkFormError && !running && (
              <p className="mt-3 text-xs font-bold text-rose-600">{w.bulkFormError}</p>
            )}

            {running && (
              <div className="mt-5">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                  <span>Processing…</span>
                  <span>
                    {run.processed} / {run.total}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${(run.processed / run.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={w.closeBulkAction}
                disabled={running}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={w.submitBulkAction}
                disabled={running || !!w.bulkFormError || n === 0}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md disabled:opacity-40 ${TONE[spec.tone]}`}
              >
                {running && <Loader2 size={15} className="animate-spin" />}
                {spec.verb} {n}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-start gap-4">
              <span
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  run.done.length ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                }`}
              >
                {run.done.length ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {run.done.length} done{run.failed.length ? `, ${run.failed.length} not processed` : ""}
                </h3>
                {run.failed.length > 0 && (
                  <p className="text-sm text-slate-500 mt-1">
                    These stay where they are so you can fix them and try again.
                  </p>
                )}
              </div>
            </div>

            {run.failed.length > 0 && (
              <div className="mt-5 max-h-72 overflow-y-auto rounded-2xl ring-1 ring-amber-200 bg-amber-50/60 divide-y divide-amber-100">
                {run.failed.map((f) => (
                  <div key={f.id} className="px-4 py-3">
                    <p className="text-sm font-bold text-slate-800">
                      {f.fullName || f.id}
                      {f.regNo && <span className="ml-2 font-mono text-[11px] font-semibold text-slate-400">{f.regNo}</span>}
                    </p>
                    <p className="text-xs font-medium text-amber-800 mt-0.5">{f.reason}</p>
                    {[...(f.blockers || []), ...(f.unconfirmed || [])].length > 0 && (
                      <ul className="mt-1.5 text-[11px] font-medium text-slate-600 list-disc pl-4 space-y-0.5">
                        {(f.blockers || []).map((b) => (
                          <li key={`b-${b}`}>{b} — must be resolved</li>
                        ))}
                        {(f.unconfirmed || []).map((b) => (
                          <li key={`u-${b}`}>{b} — needs a confirmation</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={w.closeBulkAction}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BulkActionBar = ({ w }) => {
  const picked = w.pickedRows.length;
  return (
    <>
      {picked > 0 && !w.bulkAction && w.bulkChoices.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-900 text-white pl-5 pr-3 py-3 shadow-2xl shadow-slate-900/30">
            <span className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-black">
              {picked}
            </span>
            <span className="text-sm font-bold mr-auto">
              {picked} selected
            </span>
            <button onClick={w.clearRows} className="px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/10">
              Clear
            </button>
            {w.bulkChoices.map((c) => (
              <button
                key={c.key}
                onClick={() => w.openBulkAction(c.key)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold ${
                  c.tone === "danger" ? "bg-white/10 hover:bg-rose-500 text-rose-100 hover:text-white" : "bg-indigo-500 hover:bg-indigo-400"
                }`}
              >
                {c.tone !== "danger" && <ListChecks size={15} />}
                {c.label}
                <span className="text-[11px] opacity-70">({c.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {w.bulkAction && <ActionDialog w={w} />}
    </>
  );
};

export default BulkActionBar;
