import React from "react";
import { ArrowLeft } from "lucide-react";

// Shared dark slate→indigo gradient page header — one component instead of
// the near-identical hero block that used to be hand-rolled on Attendance
// (standalone mode), Lectures, Assignments, and Marks (standalone mode).
// `badges`: [{ label, icon?: LucideIcon, className? }] rendered as pills
// above the title. `subtitle` can be any node (plain text, or a few lines).
const PageHero = ({ onBack, icon: Icon, badges = [], title, subtitle, actions }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 shadow-lg">
    <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
    <div className="absolute -bottom-16 left-1/3 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl" />
    <div className="relative p-5 sm:p-7 flex items-start justify-between gap-4 flex-wrap">
      <div className="flex items-start gap-3 sm:gap-4 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        {Icon && (
          <div className="w-11 h-11 rounded-2xl bg-white/10 text-white flex items-center justify-center flex-shrink-0">
            <Icon size={20} />
          </div>
        )}
        <div className="min-w-0">
          {badges.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {badges.map((badge, idx) => {
                const BadgeIcon = badge.icon;
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full ${badge.className || "bg-white/10 text-white"}`}
                  >
                    {BadgeIcon && <BadgeIcon size={11} className="text-indigo-300" />}
                    {badge.label}
                  </span>
                );
              })}
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug break-words">{title}</h1>
          {subtitle && <div className="text-sm text-white/60 font-medium mt-1 space-y-0.5">{subtitle}</div>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">{actions}</div>}
    </div>
  </div>
);

export default PageHero;
