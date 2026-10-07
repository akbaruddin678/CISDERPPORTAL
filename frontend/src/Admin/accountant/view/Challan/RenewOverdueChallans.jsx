import React, { useState, useMemo } from "react";
import {
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckSquare,
  Square,
  ArrowRight,
} from "lucide-react";
import { useGetOverdueInstallmentsQuery } from "../../api/studentChallanApi";

const RenewOverdueChallans = ({
  terms,
  departments,
  programsAll = [],
  semestersAll = [],
  actions,
  isProcessing,
}) => {
  const [filters, setFilters] = useState({
    termId: "",
    departmentId: "",
    programId: "",
    semesterId: "",
  });
  const [selection, setSelection] = useState([]);
  const [lastResult, setLastResult] = useState(null);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "departmentId") {
        next.programId = "";
        next.semesterId = "";
      }
      if (key === "programId") next.semesterId = "";
      return next;
    });
    setSelection([]);
    setLastResult(null);
  };

  const universityPrograms = useMemo(() => {
    if (!filters.departmentId) return [];
    return programsAll.filter(
      (p) => String(p.departmentId?._id || p.departmentId) === String(filters.departmentId),
    );
  }, [programsAll, filters.departmentId]);

  const semesters = useMemo(() => {
    if (!filters.programId) return [];
    return semestersAll
      .filter((s) => String(s.programId?._id || s.programId) === String(filters.programId))
      .sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [semestersAll, filters.programId]);

  const { data: overdueRes, isFetching } = useGetOverdueInstallmentsQuery(filters, {
    skip: !filters.termId,
  });
  const rows = overdueRes?.data || [];

  const toggleOne = (id) =>
    setSelection((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () =>
    setSelection(selection.length === rows.length ? [] : rows.map((r) => r._id));

  const fmt = (v) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(v || 0);

  const handleRenewSelected = async () => {
    if (selection.length === 0 || !actions.bulkRenew) return;
    const result = await actions.bulkRenew(selection);
    setLastResult(result);
    setSelection([]);
  };

  const selectStyles =
    "w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 disabled:bg-slate-50";

  return (
    <div className="animate-in fade-in duration-300 space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Scope
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            className={selectStyles}
            value={filters.termId}
            onChange={(e) => handleFilterChange("termId", e.target.value)}
          >
            <option value="">Select Session...</option>
            {terms?.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            className={selectStyles}
            value={filters.departmentId}
            onChange={(e) => handleFilterChange("departmentId", e.target.value)}
          >
            <option value="">All Classes</option>
            {departments?.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            className={selectStyles}
            value={filters.programId}
            disabled={!filters.departmentId}
            onChange={(e) => handleFilterChange("programId", e.target.value)}
          >
            <option value="">All Programs</option>
            {universityPrograms.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            className={selectStyles}
            value={filters.semesterId}
            disabled={!filters.programId}
            onChange={(e) => handleFilterChange("semesterId", e.target.value)}
          >
            <option value="">All Sections</option>
            {semesters.map((s) => (
              <option key={s._id} value={s._id}>
                Sem {s.number}
              </option>
            ))}
          </select>
        </div>
      </div>

      {lastResult && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-sm text-indigo-800 font-medium flex items-center gap-2">
          <RefreshCw size={16} />
          Renewed {lastResult.renewedCount} challan(s).
          {lastResult.conflictCount > 0 &&
            ` ${lastResult.conflictCount} need a decision — resolve them below.`}
          {lastResult.errorCount > 0 && ` ${lastResult.errorCount} failed.`}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-500" />
            Overdue Installments ({rows.length})
          </h3>
          <button
            disabled={selection.length === 0 || isProcessing}
            onClick={handleRenewSelected}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-lg hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Renew Selected ({selection.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
              <tr>
                <th className="p-4 w-10">
                  <button onClick={toggleAll} className="text-slate-500">
                    {selection.length === rows.length && rows.length > 0 ? (
                      <CheckSquare size={16} />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="p-4">Student</th>
                <th className="p-4">Installment</th>
                <th className="p-4">Month Shift</th>
                <th className="p-4">Fine</th>
                <th className="p-4">Remaining</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!filters.termId ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-slate-400">
                    Select a session to see overdue installments.
                  </td>
                </tr>
              ) : isFetching ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-slate-400">
                    <Loader2 size={20} className="animate-spin mx-auto" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-slate-400">
                    No overdue installments in this scope.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <button onClick={() => toggleOne(r._id)} className="text-slate-500">
                        {selection.includes(r._id) ? (
                          <CheckSquare size={16} className="text-indigo-600" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-700">{r.studentName}</p>
                      <p className="text-xs text-slate-400 font-mono">{r.studentRegNo}</p>
                    </td>
                    <td className="p-4 text-slate-600">#{r.installmentNumber}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-600">
                        {r.currentMonth} <ArrowRight size={12} /> {r.targetMonth}
                      </div>
                    </td>
                    <td className="p-4 text-rose-600 font-bold">{fmt(r.fineAmount)}</td>
                    <td className="p-4 font-bold text-slate-800">{fmt(r.remainingAmount)}</td>
                    <td className="p-4">
                      {r.hasConflict ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase rounded border border-amber-200">
                          Needs Decision
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded border border-emerald-200">
                          Ready
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        disabled={isProcessing}
                        onClick={() => actions.onRenew(r._id, r.dueDate)}
                        className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 border border-amber-100 disabled:opacity-40"
                      >
                        Renew
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RenewOverdueChallans;
