import React from "react";
import {
  Award,
  Search,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Paperclip,
  ExternalLink,
} from "lucide-react";
import { SectionCard, EmptyState, ErrorBox } from "../../Graduation/common/graduationUi";
import { fmtDate } from "../../Graduation/common/graduationHelpers";

const STATUS_STYLE = {
  Submitted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Draft: "bg-slate-100 text-slate-500 ring-slate-200",
  Late: "bg-rose-50 text-rose-700 ring-rose-200",
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ring-1 ${
      STATUS_STYLE[status] || STATUS_STYLE.Draft
    }`}
  >
    {status}
  </span>
);

const KpiTile = ({ label, value, icon, tone, loading }) => {
  const Icon = icon;
  const toneMap = {
    slate: "bg-slate-100 text-slate-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex items-center gap-3">
      <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${toneMap[tone]}`}>
        <Icon size={19} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">{label}</p>
        {loading ? (
          <div className="h-6 w-10 bg-slate-100 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-xl font-black text-slate-900 leading-tight">{value}</p>
        )}
      </div>
    </div>
  );
};

const selectCls =
  "rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200";

const VcAccreditationsView = (c) => (
  <div className="min-h-screen bg-slate-50">
    <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 text-white">
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-14 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
            <Award size={22} />
          </span>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">University Accreditations</h1>
            <p className="text-sm font-medium text-slate-300 mt-0.5 max-w-xl">
              Compliance reports and accreditation submissions tracked by the Registrar's office.
            </p>
          </div>
        </div>
        <button
          onClick={c.refetch}
          disabled={c.isFetching}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-900 bg-white hover:bg-indigo-50 shadow-lg disabled:opacity-60"
        >
          {c.isFetching ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          Refresh
        </button>
      </div>
    </div>

    <div className="max-w-6xl mx-auto px-6 -mt-8 pb-16 space-y-5">
      {c.errorMessage && <ErrorBox message={c.errorMessage} />}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiTile label="Total Reports" value={c.stats.total} icon={FileText} tone="slate" loading={c.isLoading} />
        <KpiTile label="Submitted" value={c.stats.submitted} icon={CheckCircle2} tone="emerald" loading={c.isLoading} />
        <KpiTile label="Pending" value={c.stats.pending} icon={Clock} tone="amber" loading={c.isLoading} />
        <KpiTile label="Overdue" value={c.stats.overdue} icon={AlertTriangle} tone="rose" loading={c.isLoading} />
      </div>

      <SectionCard title="Reports" icon={Award}>
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={c.searchQuery}
              onChange={(e) => c.setSearchQuery(e.target.value)}
              placeholder="Search title or authority"
              className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <select value={c.statusFilter} onChange={(e) => c.setStatusFilter(e.target.value)} className={selectCls}>
            {["All", "Draft", "Pending", "Submitted", "Late"].map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All statuses" : s}
              </option>
            ))}
          </select>
          <select value={c.categoryFilter} onChange={(e) => c.setCategoryFilter(e.target.value)} className={selectCls}>
            {c.categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "All" ? "All categories" : cat}
              </option>
            ))}
          </select>
        </div>

        {c.isLoading ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="animate-spin" />
          </div>
        ) : c.reports.length === 0 ? (
          <EmptyState
            icon={Award}
            title={c.totalCount === 0 ? "No compliance reports yet" : "No report matches these filters"}
            hint={
              c.totalCount === 0
                ? "The Registrar's office logs accreditation and compliance submissions here."
                : "Try a different search, status or category."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="text-left font-bold px-3 py-2.5">Report</th>
                  <th className="text-left font-bold px-3 py-2.5 hidden sm:table-cell">Category</th>
                  <th className="text-left font-bold px-3 py-2.5 hidden md:table-cell">Authority</th>
                  <th className="text-left font-bold px-3 py-2.5">Due</th>
                  <th className="text-left font-bold px-3 py-2.5 hidden lg:table-cell">Submitted</th>
                  <th className="text-left font-bold px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {c.reports.map((r) => (
                  <tr key={r._id} className="hover:bg-indigo-50/30">
                    <td className="px-3 py-3 font-bold text-slate-900">{r.title}</td>
                    <td className="px-3 py-3 hidden sm:table-cell text-xs font-medium text-slate-500">{r.category}</td>
                    <td className="px-3 py-3 hidden md:table-cell text-xs font-medium text-slate-500">{r.authority}</td>
                    <td className="px-3 py-3 text-xs font-medium text-slate-500">{fmtDate(r.dueDate)}</td>
                    <td className="px-3 py-3 hidden lg:table-cell text-xs font-medium text-slate-500">
                      {r.submittedDate ? fmtDate(r.submittedDate) : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      {r.fileUrl && (
                        <a
                          href={r.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          <Paperclip size={12} /> File <ExternalLink size={10} />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  </div>
);

export default VcAccreditationsView;
