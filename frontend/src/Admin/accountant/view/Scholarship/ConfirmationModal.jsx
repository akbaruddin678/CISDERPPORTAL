// components/common/ConfirmationModal.js
import React from "react";
import { AlertTriangle, AlertCircle, Info, CheckCircle, RefreshCw } from "lucide-react";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmation Required",
  message = "Are you sure you want to perform this action?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const icons = {
    warning: AlertTriangle,
    error: AlertCircle,
    info: Info,
    success: CheckCircle,
  };

  // Same emerald/amber/rose/indigo semantic tokens used everywhere else in
  // this module (ScholarshipRevokeModal, ScholarshipRejectionModal, etc.).
  const theme = {
    warning: { chip: "bg-amber-50 text-amber-600", button: "bg-amber-600 hover:bg-amber-700 shadow-amber-100" },
    error: { chip: "bg-rose-50 text-rose-600", button: "bg-rose-600 hover:bg-rose-700 shadow-rose-100" },
    info: { chip: "bg-indigo-50 text-indigo-600", button: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100" },
    success: { chip: "bg-emerald-50 text-emerald-600", button: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" },
  };

  const Icon = icons[type] || AlertTriangle;
  const style = theme[type] || theme.warning;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />

      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* --- HEADER --- */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className={`p-2.5 rounded-xl shadow-sm ${style.chip}`}>
            <Icon size={22} strokeWidth={1.75} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 leading-tight">{title}</h3>
        </div>

        {/* --- BODY --- */}
        <div className="px-6 py-5">
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>

        {/* --- FOOTER --- */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`flex-[2] py-3 text-white font-bold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${style.button}`}
          >
            {isLoading && <RefreshCw size={18} className="animate-spin" />}
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
