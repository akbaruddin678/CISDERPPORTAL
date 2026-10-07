// view/Scholarship/ScholarshipRejectionModal.js
import React, { useState } from "react";
import { X, XCircle, User, Award, RefreshCw, ShieldAlert } from "lucide-react";

const ScholarshipRejectionModal = ({
  isOpen,
  onClose,
  application,
  handleRejectScholarship,
  onSuccess,
  onError,
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !application) return null;

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError("A reason is required to reject this application.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const result = await handleRejectScholarship({
        id: application.id,
        rejectionReason: reason.trim(),
      });

      if (result && result.success) {
        onSuccess(result.message || "Application rejected");
        onClose();
      } else {
        onError(result?.message || "Rejection failed");
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
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shadow-sm">
              <ShieldAlert size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Reject Application</h2>
              <p className="text-xs text-slate-500 font-medium">
                Decline this scholarship request
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
              Application Details
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

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Reason for Rejection <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              rows={4}
              placeholder="Explain why this application is being rejected — the student/accountant record will show this reason."
              className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500/20 transition-all ${
                error ? "border-rose-300" : "border-slate-200 focus:border-rose-400"
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
              className="flex-[2] py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <XCircle size={18} />
              )}
              {isSubmitting ? "Processing..." : "Confirm Rejection"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipRejectionModal;
