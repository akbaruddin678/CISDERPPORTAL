import React, { useEffect, useState } from "react";
import { AlarmClock, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import {
  useGetFineSettingsQuery,
  useUpdateFineSettingsMutation,
} from "../api/fineManagementApi";

const QUICK_AMOUNTS = [0, 100, 200, 500, 1000, 2000];

// Late fine charged after a challan's due date. 0 = no fine at all.
const LateFineSettingsContainer = () => {
  const { data, isLoading, isError } = useGetFineSettingsQuery();
  const [updateSettings, { isLoading: saving }] = useUpdateFineSettingsMutation();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState(null); // { type, text }

  const saved = data?.data?.lateFineAmount;

  useEffect(() => {
    if (saved !== undefined) setAmount(String(saved));
  }, [saved]);

  const value = amount === "" ? NaN : Number(amount);
  const invalid = !Number.isFinite(value) || value < 0;
  const unchanged = !invalid && value === saved;

  const save = async () => {
    setMessage(null);
    try {
      const res = await updateSettings({ lateFineAmount: value }).unwrap();
      setMessage({
        type: "success",
        text: `${res.message} ${res.data.updatedChallans} open challan(s) updated.`,
      });
    } catch (err) {
      setMessage({ type: "error", text: err?.data?.error || err?.data?.message || "Could not save the setting." });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-rose-100 p-3 text-rose-600">
            <AlarmClock size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Late Fine</h1>
            <p className="text-sm text-slate-500">The fine charged on a challan after its due date.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" /> Loading…
            </div>
          ) : isError ? (
            <p className="text-sm text-rose-600">Could not load the current setting.</p>
          ) : (
            <>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Fine after due date (Rs)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">Rs</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-lg font-bold outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount(String(q))}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      Number(amount) === q && amount !== ""
                        ? "border-rose-500 bg-rose-50 text-rose-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {q === 0 ? "No fine" : `Rs ${q.toLocaleString()}`}
                  </button>
                ))}
              </div>

              <div
                className={`mt-5 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
                  !invalid && value === 0 ? "bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-600"
                }`}
              >
                {!invalid && value === 0 ? (
                  <>
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    <span>With 0, no fine is imposed. Challans simply turn overdue after the due date.</span>
                  </>
                ) : (
                  <span>
                    A challan not paid by its due date gets a one-time fine of{" "}
                    <b>Rs {invalid ? "—" : value.toLocaleString()}</b> added to its total. The challan prints it as
                    &quot;Payable after due date&quot;.
                  </span>
                )}
              </div>

              <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-slate-500">
                <li>Saving updates challans that are still open and not yet overdue.</li>
                <li>Challans that already went overdue keep the fine they were charged. Use Fines &amp; Due Dates to waive one.</li>
                <li>New challans use the amount that is set when they are created.</li>
              </ul>

              {message && (
                <div
                  className={`mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
                    message.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {message.type === "success" ? <CheckCircle2 size={16} className="mt-0.5" /> : <AlertTriangle size={16} className="mt-0.5" />}
                  <span>{message.text}</span>
                </div>
              )}

              <button
                type="button"
                onClick={save}
                disabled={saving || invalid || unchanged}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-40"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Save
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LateFineSettingsContainer;
