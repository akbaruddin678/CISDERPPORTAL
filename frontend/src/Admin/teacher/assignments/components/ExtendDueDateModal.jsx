import React, { useState } from "react";
import { CalendarClock, X, Loader2 } from "lucide-react";

const toLocalInputValue = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Shared between the assignments list (quick action) and the assignment
// editor (detail view) so the extend flow only has to be built once.
const ExtendDueDateModal = ({ assignment, onSubmit, onClose, isSubmitting = false }) => {
  const [newDueDate, setNewDueDate] = useState(() => {
    const current = new Date(assignment.dueDate);
    current.setDate(current.getDate() + 7);
    return toLocalInputValue(current);
  });
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!newDueDate) {
      setError("Pick a new due date.");
      return;
    }
    if (new Date(newDueDate) <= new Date(assignment.dueDate)) {
      setError("The new due date must be later than the current due date.");
      return;
    }
    setError("");
    onSubmit({ newDueDate: new Date(newDueDate).toISOString(), reason: reason.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 p-5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center flex-shrink-0">
              <CalendarClock size={19} />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-base leading-tight">Extend Due Date</h3>
              <p className="text-white/60 text-xs font-medium truncate">{assignment.title}</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between text-sm bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
            <span className="text-slate-500 font-semibold">Current due date</span>
            <span className="font-bold text-slate-700">
              {new Date(assignment.dueDate).toLocaleString(undefined, {
                month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              New Due Date & Time
            </label>
            <input
              type="datetime-local"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm text-slate-800 outline-none transition-all focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              Reason <span className="normal-case font-medium text-slate-300">(optional, visible in history)</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., Students requested more time due to overlapping deadlines."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none transition-all focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
            />
          </div>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-60 shadow-sm"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CalendarClock size={16} />}
              {isSubmitting ? "Extending..." : "Extend Due Date"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtendDueDateModal;
