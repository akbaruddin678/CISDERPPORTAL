// components/common/Notification.js
import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

const Notification = ({ type = "info", message, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 200);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  // Same emerald/rose/amber/indigo semantic tokens used everywhere else in
  // this module, instead of raw green/red/yellow/blue.
  const theme = {
    success: { border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-800", chip: "bg-emerald-100 text-emerald-600" },
    error: { border: "border-rose-200", bg: "bg-rose-50", text: "text-rose-800", chip: "bg-rose-100 text-rose-600" },
    warning: { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-800", chip: "bg-amber-100 text-amber-600" },
    info: { border: "border-indigo-200", bg: "bg-indigo-50", text: "text-indigo-800", chip: "bg-indigo-100 text-indigo-600" },
  };

  const Icon = icons[type] || Info;
  const style = theme[type] || theme.info;

  return (
    <div
      className={`w-80 md:w-96 border rounded-2xl shadow-lg animate-in slide-in-from-right-4 fade-in duration-300 ${style.border} ${style.bg}`}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`shrink-0 p-2 rounded-xl ${style.chip}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
        <p className={`flex-1 text-sm font-semibold leading-snug pt-1 ${style.text}`}>{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 200);
          }}
          className="shrink-0 p-1 -mr-1 -mt-1 text-slate-400 hover:text-slate-600 hover:bg-white/60 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Notification;
