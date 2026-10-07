import React from "react";
import { CheckCircle, Clock, AlertTriangle, XCircle, X } from "lucide-react";

// --- Notification Banner ---
export const NotificationBanner = ({ notification, onClose }) => {
  if (!notification) return null;
  const isError = notification.type === "error";

  return (
    <div
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-top-5 duration-300 ${
        isError
          ? "bg-red-50 border-red-200 text-red-700"
          : "bg-emerald-50 border-emerald-200 text-emerald-700"
      }`}
    >
      {isError ? <XCircle size={20} /> : <CheckCircle size={20} />}
      <p className="font-medium text-sm">{notification.message}</p>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
};

// --- Status Badge ---
export const StatusBadge = ({ status, isVoid }) => {
  if (isVoid) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">
        <XCircle size={12} /> Voided
      </span>
    );
  }

  const styles = {
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    issued: "bg-blue-50 text-blue-700 border-blue-200",
    overdue: "bg-rose-50 text-rose-700 border-rose-200",
    partial: "bg-amber-50 text-amber-700 border-amber-200",
    draft: "bg-slate-50 text-slate-600 border-slate-200",
  };

  const icons = {
    paid: <CheckCircle size={12} />,
    issued: <Clock size={12} />,
    overdue: <AlertTriangle size={12} />,
    partial: <Clock size={12} />,
    draft: <Clock size={12} />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase border ${
        styles[status] || styles.draft
      }`}
    >
      {icons[status]} {status}
    </span>
  );
};

// --- Stats Card ---
export const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
          {title}
        </p>
        <h3 className="text-2xl font-black text-slate-900 mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon size={20} />
      </div>
    </div>
  </div>
);
