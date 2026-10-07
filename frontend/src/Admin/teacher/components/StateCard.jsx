import React from "react";
import { Loader2, AlertTriangle } from "lucide-react";

// Shared loading / empty / error placeholder used across the teacher course
// tabs (Lectures, Attendance, Exam Marks, Question Bank, Assignments) so the
// same visual language is used everywhere instead of ~10 near-duplicated
// ad-hoc blocks.
const VARIANT_STYLES = {
  loading: { wrap: "border-slate-200", icon: "text-indigo-500", title: "text-slate-600" },
  empty: { wrap: "border-slate-200", icon: "text-slate-400", title: "text-slate-700" },
  error: { wrap: "border-red-200 bg-red-50/40", icon: "text-red-500", title: "text-red-700" },
};

const StateCard = ({
  variant = "empty",
  icon: Icon,
  title,
  description,
  action,
  size = "md",
  className = "",
}) => {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.empty;
  const padding = size === "sm" ? "p-8" : "p-12 sm:p-16";

  return (
    <div className={`bg-white ${padding} rounded-2xl border ${styles.wrap} text-center ${className}`}>
      <div className="flex flex-col items-center gap-3">
        {variant === "loading" ? (
          <Loader2 size={28} className={`animate-spin ${styles.icon}`} />
        ) : (
          <div className={`w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center ${styles.icon}`}>
            {Icon ? <Icon size={22} /> : <AlertTriangle size={22} />}
          </div>
        )}
        {title && <p className={`text-sm font-bold ${styles.title}`}>{title}</p>}
        {description && (
          <p className="text-xs text-slate-400 font-medium max-w-sm">{description}</p>
        )}
        {action}
      </div>
    </div>
  );
};

export default StateCard;
