import React from "react";

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  approved: "bg-sky-50 text-sky-700 ring-sky-200",
  deferred: "bg-amber-50 text-amber-700 ring-amber-200",
  suspended: "bg-rose-50 text-rose-700 ring-rose-200",
  graduated: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  academically_completed: "bg-teal-50 text-teal-700 ring-teal-200",
  clearance_in_progress: "bg-violet-50 text-violet-700 ring-violet-200",
  cleared: "bg-cyan-50 text-cyan-700 ring-cyan-200",
};

const STATUS_DOTS = {
  active: "bg-emerald-500",
  approved: "bg-sky-500",
  deferred: "bg-amber-500",
  suspended: "bg-rose-500",
  graduated: "bg-indigo-500",
  academically_completed: "bg-teal-500",
  clearance_in_progress: "bg-violet-500",
  cleared: "bg-cyan-500",
};

const statusLabel = (status) => (status ? status.replace(/_/g, " ") : "unknown");

export const StatusChip = ({ status, onDark = false }) => {
  if (onDark) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-white/15 text-white ring-1 ring-white/25">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
        {statusLabel(status)}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ring-1 ${
        STATUS_STYLES[status] || "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[status] || "bg-slate-400"}`} />
      {statusLabel(status)}
    </span>
  );
};

// Full class strings (not built dynamically) so Tailwind keeps every one.
const AVATAR_GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-fuchsia-500 to-purple-500",
  "from-cyan-500 to-blue-500",
];

const hashString = (str = "") => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
};

const AVATAR_SIZES = {
  sm: "w-9 h-9 text-sm rounded-xl",
  md: "w-11 h-11 text-base rounded-2xl",
  lg: "w-20 h-20 text-3xl rounded-3xl",
};

// Colour is derived from the name, so a student keeps the same avatar
// colour in the grid, the list and the profile drawer.
export const StudentAvatar = ({ name, photo, size = "md", ring = false, neutral = false }) => {
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  const gradient = AVATAR_GRADIENTS[hashString(name) % AVATAR_GRADIENTS.length];
  const ringCls = ring ? "ring-4 ring-white/40" : "";

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`${AVATAR_SIZES[size]} ${ringCls} object-cover shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${AVATAR_SIZES[size]} ${ringCls} ${neutral ? "bg-slate-100 text-slate-600 ring-1 ring-slate-200" : `bg-gradient-to-br ${gradient} text-white shadow-sm`} font-bold flex items-center justify-center shrink-0`}
    >
      {initial}
    </div>
  );
};
