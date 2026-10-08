import React from "react";
import { Search, CircleCheck, ChevronLeft, ChevronRight, FilterX, X } from "lucide-react";
import { StudentAvatar } from "../../HeadofDepartment/view/HodStudentBits";
import { ErrorBox } from "../../Graduation/common/graduationUi";
import { fmtDate } from "../../Graduation/common/graduationHelpers";

const selectCls =
  "w-full rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 truncate";
const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400";

const Badge = ({ tone, children }) => (
  <span
    className={`px-2 py-0.5 rounded-full text-[9px] font-bold ring-1 ${
      tone === "green"
        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
        : "bg-amber-50 text-amber-700 ring-amber-200"
    }`}
  >
    {children}
  </span>
);

// Department -> program -> semester / session filters, a search box, and a
// paged list of matching students to pick from.
const StudentPicker = ({ c }) => {
  const s = c.student;
  return (
    <div>
      {s && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-indigo-50/60 ring-1 ring-indigo-100 p-3">
          <StudentAvatar name={s.fullName} photo={c.photo} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Selected</p>
            <p className="text-sm font-black text-slate-900 truncate">{s.fullName}</p>
            <p className="text-[11px] font-mono font-semibold text-slate-500 truncate">{s.regNo}</p>
            <p className="text-[11px] font-medium text-slate-400 truncate">
              {s.programName}
              {s.semesterNumber != null ? ` · Section ${s.semesterNumber}` : ""}
            </p>
          </div>
          <button
            onClick={c.clearStudent}
            className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-slate-400"
          >
            <X size={15} />
          </button>
        </div>
      )}
      {c.studentErrorMessage && (
        <div className="mb-3">
          <ErrorBox message={c.studentErrorMessage} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <select
          value={c.filters.departmentId}
          onChange={(e) => c.setFilter("departmentId", e.target.value)}
          className={selectCls}
        >
          <option value="">All classes</option>
          {c.departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={c.filters.programId}
          onChange={(e) => c.setFilter("programId", e.target.value)}
          className={selectCls}
        >
          <option value="">All programs</option>
          {c.programs.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={c.filters.semesterNumber}
          onChange={(e) => c.setFilter("semesterNumber", e.target.value)}
          className={selectCls}
        >
          <option value="">All sections</option>
          {c.semesterNumbers.map((n) => (
            <option key={n} value={n}>
              Section {n}
            </option>
          ))}
        </select>
        <select
          value={c.filters.sessionId}
          onChange={(e) => c.setFilter("sessionId", e.target.value)}
          className={selectCls}
        >
          <option value="">All sessions</option>
          {c.sessions.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="relative mt-2.5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={c.search}
          onChange={(e) => c.setSearch(e.target.value)}
          placeholder="Search by name, reg. no. or CNIC"
          className={`${inputCls} pl-10`}
        />
      </div>

      <div className="flex items-center justify-between mt-3 mb-1.5">
        <span className="text-[11px] font-bold text-slate-400">
          {c.isSearching && !c.searchResults.length
            ? "Loading…"
            : `${c.pickerPagination.total} student${c.pickerPagination.total === 1 ? "" : "s"}`}
        </span>
        {c.activeFilterCount > 0 && (
          <button
            onClick={c.resetFilters}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
          >
            <FilterX size={12} /> Clear filters
          </button>
        )}
      </div>

      {c.pickerErrorMessage && <ErrorBox message={c.pickerErrorMessage} />}
      <div
        className={`rounded-xl border border-slate-200 overflow-hidden transition-opacity ${
          c.isSearching ? "opacity-60" : ""
        }`}
      >
        {c.searchResults.length === 0 ? (
          <p className="p-5 text-center text-xs font-medium text-slate-400">
            {c.isSearching ? "Loading students…" : "No student matches these filters."}
          </p>
        ) : (
          c.searchResults.map((r) => {
            const picked = r._id === c.studentId;
            return (
              <button
                key={r._id}
                onClick={() => c.selectStudent(r._id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-slate-100 last:border-0 transition-colors ${
                  picked ? "bg-indigo-50" : "hover:bg-slate-50"
                }`}
              >
                <StudentAvatar name={r.fullName} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-900 truncate">{r.fullName}</span>
                  <span className="block text-[11px] font-mono font-semibold text-slate-400 truncate">
                    {r.regNo}
                    <span className="font-sans">
                      {" "}
                      · {r.programName || "—"}
                      {r.semesterNumber != null ? ` · Section ${r.semesterNumber}` : ""}
                    </span>
                  </span>
                </span>
                <span className="flex flex-col items-end gap-1 shrink-0">
                  {picked && <CircleCheck size={16} className="text-indigo-600" />}
                  {r.activeCard ? (
                    <Badge tone="green">Card · till {fmtDate(r.activeCard.expiryDate)}</Badge>
                  ) : !r.hasPhoto ? (
                    <Badge tone="amber">No photo</Badge>
                  ) : null}
                </span>
              </button>
            );
          })
        )}
      </div>

      {c.pickerPagination.pages > 1 && (
        <div className="flex items-center justify-between mt-2.5 text-[11px] font-bold text-slate-500">
          <span>
            Page {c.pickerPagination.page} of {c.pickerPagination.pages}
          </span>
          <div className="flex gap-1.5">
            <button
              disabled={c.pickerPage <= 1}
              onClick={() => c.setPickerPage(c.pickerPage - 1)}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={c.pickerPage >= c.pickerPagination.pages}
              onClick={() => c.setPickerPage(c.pickerPage + 1)}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPicker;
