import React from "react";

// Shared stat tile (icon badge + big number + label) — lifted out of
// TeacherHomeView.jsx so Home, Attendance, and Marks all render the exact
// same polished tile instead of three hand-rolled near-duplicates.
const StatTile = ({ icon: Icon, label, value, color, bg, isLoading }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5">
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: bg, color }}
    >
      {Icon && <Icon size={22} strokeWidth={2.25} />}
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-black text-slate-900 leading-none">{isLoading ? "—" : value}</p>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1.5 truncate">{label}</p>
    </div>
  </div>
);

export default StatTile;
