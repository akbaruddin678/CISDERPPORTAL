import React, { useState } from "react";
import { Loader2, FileSpreadsheet, FileText, Award } from "lucide-react";
import { StudentAvatar } from "../../HeadofDepartment/view/HodStudentBits";
import {
  EmptyState,
  ErrorBox,
} from "../common/graduationUi";
import { fmtDate } from "../common/graduationHelpers";
import { exportGraduatesExcel, exportGraduatesPDF } from "../common/graduationExport";

const GraduatesPanel = ({ w }) => {
  const [busy, setBusy] = useState("");
  const scopeLabel = w.year ? `Batch ${w.year}` : "All Graduates";

  const run = async (kind, fn) => {
    setBusy(kind);
    try {
      await fn(w.graduates, { scopeLabel });
    } catch {
      w.notify("Export failed. Please try again.", "error");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={w.year}
          onChange={(e) => w.setYear(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <option value="">All batches</option>
          {w.graduateYears.map((y) => (
            <option key={y} value={y}>
              Batch {y}
            </option>
          ))}
        </select>
        <div className="ml-auto flex gap-2">
          <button
            disabled={!w.graduates.length || !!busy}
            onClick={() => run("xlsx", exportGraduatesExcel)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 ring-1 ring-emerald-200 disabled:opacity-40"
          >
            {busy === "xlsx" ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />} Excel
          </button>
          <button
            disabled={!w.graduates.length || !!busy}
            onClick={() => run("pdf", exportGraduatesPDF)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 ring-1 ring-rose-200 disabled:opacity-40"
          >
            {busy === "pdf" ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} PDF
          </button>
        </div>
      </div>

      {w.graduatesErrorMessage && <ErrorBox message={w.graduatesErrorMessage} />}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {w.isLoadingGraduates && !w.graduates.length ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="animate-spin" />
          </div>
        ) : w.graduates.length === 0 ? (
          <EmptyState icon={Award} title="No graduates yet" hint="Students appear here once the Registrar gives final approval." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="text-left font-bold px-4 py-3">Student</th>
                  <th className="text-left font-bold px-4 py-3">Degree serial</th>
                  <th className="text-left font-bold px-4 py-3 hidden md:table-cell">Program</th>
                  <th className="text-center font-bold px-4 py-3">CGPA</th>
                  <th className="text-left font-bold px-4 py-3 hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {w.graduates.map((g) => (
                  <tr
                    key={g._id}
                    onClick={() => w.openClearance(g._id)}
                    className="hover:bg-indigo-50/40 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <StudentAvatar name={g.student?.fullName} size="sm" />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{g.student?.fullName}</p>
                          <p className="text-[11px] font-mono font-semibold text-slate-400">{g.student?.regNo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-700">{g.degreeSerial}</td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-500 hidden md:table-cell">{g.program?.name}</td>
                    <td className="px-4 py-3 text-center font-black text-slate-800">
                      {g.cgpa != null ? Number(g.cgpa).toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-500 hidden sm:table-cell">{fmtDate(g.graduatedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => w.openClearance(g._id)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraduatesPanel;
