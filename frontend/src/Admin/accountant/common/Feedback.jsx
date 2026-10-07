import React, { useEffect } from "react";
import { CheckCircle, XCircle, X, Loader2, AlertTriangle } from "lucide-react";

export const ToastNotification = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;
  const isError = notification.type === "error";

  return (
    <div
      className={`fixed top-6 right-6 z-[100] flex items-start gap-3 px-5 py-4 rounded-xl shadow-xl border animate-in slide-in-from-right-10 duration-300 backdrop-blur-md ${
        isError
          ? "bg-red-50/90 border-red-200 text-red-800"
          : "bg-emerald-50/90 border-emerald-200 text-emerald-800"
      }`}
    >
      {isError ? (
        <XCircle className="mt-0.5 shrink-0" size={20} />
      ) : (
        <CheckCircle className="mt-0.5 shrink-0" size={20} />
      )}
      <div className="flex-1">
        <h4 className="font-bold text-sm">
          {isError ? "Action Failed" : "Success"}
        </h4>
        <p className="text-sm opacity-90 leading-tight mt-1">
          {notification.message}
        </p>
      </div>
      <button
        onClick={onClose}
        className="opacity-50 hover:opacity-100 transition-opacity"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export const ConfirmationModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading,
  isDestructive,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 scale-100 animate-in zoom-in-95">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            isDestructive
              ? "bg-red-100 text-red-600"
              : "bg-amber-100 text-amber-600"
          }`}
        >
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-slate-500 text-sm mt-2 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 font-bold text-white rounded-xl flex justify-center items-center gap-2 transition-colors ${
              isDestructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
