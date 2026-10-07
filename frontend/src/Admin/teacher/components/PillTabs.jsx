import React from "react";

// Shared pill-style tab bar used across the teacher course tabs — one
// visual pattern (single indigo-600 accent) instead of the 3 different
// tab-bar styles that used to exist (icon-grid, underline, pill).
// `tabs`: [{ key, label, icon: LucideIcon, count }]
const PillTabs = ({ tabs, activeKey, onChange, className = "" }) => (
  <div className={`flex gap-1.5 sm:gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto ${className}`}>
    {tabs.map((tab) => {
      const Icon = tab.icon;
      const isActive = tab.key === activeKey;
      return (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            isActive
              ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-200"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          }`}
        >
          {Icon && <Icon size={15} />}
          {tab.label}
          {typeof tab.count === "number" && (
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export default PillTabs;
