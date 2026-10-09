import React from "react";
import { AlertTriangle, X, ArrowRightCircle, GitMerge } from "lucide-react";

// Shown when renewing an overdue installment would collide with another
// live installment already sitting in the shifted target month — used by
// both the single-row Renew action and the bulk "Renew Overdue" tab, so
// this two-choice prompt only has to be built once.
const RenewConflictDialog = ({ data, isSubmitting, onResolve, onClose }) => {
  if (!data) return null;
  const { targetMonth, conflictingChallan } = data;

  const fmt = (v) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(v || 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-amber-50/60">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Monthly Fee Part Already Set Up
              </h3>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                {targetMonth}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            There is already a monthly fee part set up for <strong>{targetMonth}</strong>
            {conflictingChallan?.challanNo ? ` (${conflictingChallan.challanNo})` : ""}.
            Choose how to proceed:
          </p>

          {conflictingChallan && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
              <div>
                <p className="font-bold text-slate-700">
                  Monthly Fee Part #{conflictingChallan.installmentNumber}
                </p>
                <p className="text-xs text-slate-500">{conflictingChallan.billingMonth}</p>
              </div>
              <p className="font-bold text-slate-800">{fmt(conflictingChallan.remainingAmount)}</p>
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            <button
              disabled={isSubmitting}
              onClick={() => onResolve("shiftAll")}
              className="w-full flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-4 py-3 text-left transition-colors disabled:opacity-50"
            >
              <ArrowRightCircle size={20} className="text-indigo-600 shrink-0" />
              <span>
                <span className="block text-sm font-bold text-indigo-900">
                  Shift All Months Forward
                </span>
                <span className="block text-xs text-indigo-600">
                  Move this and every later monthly fee part one month later.
                </span>
              </span>
            </button>

            <button
              disabled={isSubmitting}
              onClick={() => onResolve("merge")}
              className="w-full flex items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 px-4 py-3 text-left transition-colors disabled:opacity-50"
            >
              <GitMerge size={20} className="text-purple-600 shrink-0" />
              <span>
                <span className="block text-sm font-bold text-purple-900">
                  Merge Both Monthly Parts
                </span>
                <span className="block text-xs text-purple-600">
                  Combine both amounts and the fine into one challan for {targetMonth}.
                </span>
              </span>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenewConflictDialog;
