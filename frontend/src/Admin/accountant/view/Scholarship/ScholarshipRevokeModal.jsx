// view/Scholarship/ScholarshipRevokeModal.js
import React, { useState } from "react";
import { X, Ban, User, Award, RefreshCw } from "lucide-react";

// "Remove student from scholarship" — only offered for approved
// applications. A reason is required so there's always a record of WHY a
// scholarship was unassigned (audit trail, same pattern as rejection).
const ScholarshipRevokeModal = ({
  isOpen,
  onClose,
  application,
  handleRevokeScholarship,
  onSuccess,
  onError,
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !application) return null;

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError("A reason is required to unassign this scholarship.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const result = await handleRevokeScholarship({
        id: application.id,
        reason: reason.trim(),
      });

      if (result && result.success) {
        onSuccess(result.message || "Scholarship revoked");
        onClose();
      } else {
        onError(result?.message || "Revoke failed");
      }
    } catch (err) {
      onError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* --- HEADER --- */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-200 text-slate-700 rounded-xl shadow-sm">
              <Ban size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Remove From Scholarship
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Unassign this student's active grant
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* --- BODY --- */}
        <div className="p-6">
          {/* Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              Current Grant
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <User size={14} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Student</p>
                  <p className="text-sm font-bold text-slate-900">
                    {application.studentName}
                  </p>
                </div>
              </div>

              <div className="w-full h-px bg-slate-100"></div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <Award size={14} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">
                    Scholarship Plan
                  </p>
                  <p className="text-sm font-bold text-indigo-700">
                    {application.planTitle}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 text-amber-800 text-xs font-medium rounded-lg px-3 py-2.5 mb-5">
            Once revoked, this scholarship will stop applying to the
            student's tuition immediately. The application can be re-applied
            for later if needed.
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Reason for Removal <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              rows={4}
              placeholder="Why is this scholarship being unassigned? (e.g. student withdrew, no longer meets criteria, duplicate grant, etc.)"
              className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-500/20 transition-all ${
                error ? "border-rose-300" : "border-slate-200 focus:border-slate-400"
              }`}
            />
            {error && <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex-[2] py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 shadow-lg shadow-slate-200 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Ban size={18} />
              )}
              {isSubmitting ? "Processing..." : "Confirm Removal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipRevokeModal;
