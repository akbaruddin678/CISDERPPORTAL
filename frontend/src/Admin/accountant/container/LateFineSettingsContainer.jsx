import React, { useEffect, useMemo, useState } from "react";
import { AlarmClock, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import {
  useGetFineSettingsQuery,
  useUpdateFineSettingsMutation,
} from "../api/fineManagementApi";

const EMPTY_TIERS = [
  { durationDays: "5", amount: "0" },
  { durationDays: "6", amount: "0" },
  { durationDays: null, amount: "0" },
];

const normalizeForForm = (tiers, legacyAmount = 0) => {
  if (!Array.isArray(tiers) || tiers.length !== 3) {
    return [
      { durationDays: "5", amount: String(legacyAmount || 0) },
      { durationDays: "6", amount: "0" },
      { durationDays: null, amount: "0" },
    ];
  }
  return tiers.map((tier, index) => ({
    durationDays: index === 2 ? null : String(tier.durationDays ?? ""),
    amount: String(tier.amount ?? 0),
  }));
};

const toPayload = (tiers) =>
  tiers.map((tier, index) => ({
    durationDays: index === 2 ? null : Number(tier.durationDays),
    amount: Number(tier.amount),
  }));

const LateFineSettingsContainer = () => {
  const { data, isLoading, isError } = useGetFineSettingsQuery();
  const [updateSettings, { isLoading: saving }] = useUpdateFineSettingsMutation();
  const [tiers, setTiers] = useState(EMPTY_TIERS);
  const [message, setMessage] = useState(null);

  const savedTiers = data?.data?.lateFineTiers;
  const legacyAmount = data?.data?.lateFineAmount;

  useEffect(() => {
    if (savedTiers || legacyAmount !== undefined) {
      setTiers(normalizeForForm(savedTiers, legacyAmount));
    }
  }, [savedTiers, legacyAmount]);

  const parsed = useMemo(() => toPayload(tiers), [tiers]);
  const invalid = parsed.some(
    (tier, index) =>
      !Number.isFinite(tier.amount) ||
      tier.amount < 0 ||
      (index < 2 && (!Number.isInteger(tier.durationDays) || tier.durationDays < 1)),
  );
  const unchanged =
    !invalid &&
    JSON.stringify(parsed) ===
      JSON.stringify(toPayload(normalizeForForm(savedTiers, legacyAmount)));

  const updateTier = (index, field, value) => {
    setMessage(null);
    setTiers((current) =>
      current.map((tier, tierIndex) =>
        tierIndex === index ? { ...tier, [field]: value } : tier,
      ),
    );
  };

  const save = async () => {
    setMessage(null);
    try {
      const res = await updateSettings({ lateFineTiers: parsed }).unwrap();
      setMessage({
        type: "success",
        text: `${res.message} ${res.data.updatedChallans} open challan(s) updated.`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err?.data?.error || err?.data?.message || "Could not save the setting.",
      });
    }
  };

  let startDay = 1;
  const stageDescriptions = parsed.map((tier, index) => {
    if (index === 2) return `Day ${startDay} onward`;
    const endDay = startDay + (Number.isFinite(tier.durationDays) ? tier.durationDays : 0) - 1;
    const text = `Days ${startDay}–${Math.max(startDay, endDay)}`;
    startDay = endDay + 1;
    return text;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-rose-100 p-3 text-rose-600">
            <AlarmClock size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Late Fine</h1>
            <p className="text-sm text-slate-500">
              Add up to three fine stages as a challan remains overdue.
            </p>
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
              <div className="grid gap-4 md:grid-cols-3">
                {tiers.map((tier, index) => (
                  <section
                    key={`late-fine-stage-${index + 1}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <h2 className="font-bold text-slate-900">Fine stage {index + 1}</h2>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-rose-700">
                        {stageDescriptions[index]}
                      </span>
                    </div>

                    {index < 2 ? (
                      <label className="mb-4 block">
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Applies for how many days
                        </span>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={tier.durationDays}
                            onChange={(event) => updateTier(index, "durationDays", event.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 pr-14 font-bold outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                            days
                          </span>
                        </div>
                      </label>
                    ) : (
                      <div className="mb-4 rounded-xl bg-white px-3 py-3 text-sm text-slate-600">
                        Final stage continues until the challan is paid.
                      </div>
                    )}

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Additional fine (Rs)
                      </span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                          Rs
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={tier.amount}
                          onChange={(event) => updateTier(index, "amount", event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-lg font-bold outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                        />
                      </div>
                    </label>
                  </section>
                ))}
              </div>

              <div className="mt-5 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
                Each stage is added once. For example, Rs 200 for the first 5 days and an additional
                Rs 400 for the next 6 days makes the total late fine Rs 600 from day 6.
              </div>

              <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-slate-500">
                <li>Use Rs 0 for any stage you do not want to charge.</li>
                <li>New challans keep a copy of this schedule when they are generated.</li>
                <li>Saving also updates open challans; overdue fines then increase automatically by stage.</li>
              </ul>

              {message && (
                <div
                  className={`mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
                    message.type === "success"
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  )}
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
                Save fine schedule
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LateFineSettingsContainer;
