import React, { useState, useEffect } from "react";
import { X, CalendarClock } from "lucide-react";

// Same day-of-month one month later, clamped to the shorter month's last
// day, pushed to a week from today if that still lands in the past —
// mirrors the backend's own default so the pre-filled date matches what
// renewing would otherwise pick automatically.
const suggestDueDate = (oldDueDate) => {
  if (!oldDueDate) return "";
  const d = new Date(oldDueDate);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d <= today) {
    const grace = new Date(today);
    grace.setDate(grace.getDate() + 7);
    d.setTime(grace.getTime());
  }
  return d.toISOString().slice(0, 10);
};

// Shown right when Renew is clicked, before anything is sent to the
// server — lets the accountant pick the new due date instead of always
// getting the auto-computed "one month later" default.
const RenewDueDateDialog = ({ data, isSubmitting, onConfirm, onClose }) => {
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (data) setDueDate(suggestDueDate(data.oldDueDate));
  }, [data]);

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/60">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <CalendarClock size={18} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Renew Challan</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            New Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
          />
          <p className="text-xs text-slate-400">
            The old challan is cancelled and this fine carries forward onto a new one due on the date above.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(dueDate)}
            disabled={isSubmitting || !dueDate}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? "Renewing..." : "Renew"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenewDueDateDialog;
