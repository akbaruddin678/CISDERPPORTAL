import React from "react";

// Shared form field label + input styling — was hand-rolled identically as
// local `FieldLabel`/`fieldClass` in both the Lecture and Assignment
// editors. Exported separately so callers can use `fieldClass` directly on
// a native <input>/<select>/<textarea> while still sharing one definition.
export const FieldLabel = ({ children }) => (
  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
    {children}
  </label>
);

export const fieldClass =
  "w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50";
