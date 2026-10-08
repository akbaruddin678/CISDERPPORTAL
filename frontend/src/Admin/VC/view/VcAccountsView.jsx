import React from "react";
import {
  Wallet,
  Search,
  Loader2,
  FileSpreadsheet,
  PiggyBank,
  Users,
  TrendingUp,
  Compass,
  SlidersHorizontal,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { EmptyState, ErrorBox, ToastView } from "../../Graduation/common/graduationUi";
import RevenueExplorerContainer from "../../accountant/container/RevenueExplorerContainer";

const selectCls =
  "rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

const KpiTile = ({ label, value, icon, tone }) => {
  const Icon = icon;
  const toneMap = {
    slate: "bg-slate-100 text-slate-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    indigo: "bg-blue-50 text-blue-700",
  };
  return (
    <div className="flex min-h-[88px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneMap[tone]}`}>
        <Icon size={19} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold text-slate-500">{label}</p>
        <p className="mt-0.5 text-lg font-bold leading-tight text-slate-900 tabular-nums">{value}</p>
      </div>
    </div>
  );
};

const PAY_STATUS_STYLE = {
  Paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Partial: "bg-amber-50 text-amber-700 ring-amber-200",
  Unpaid: "bg-rose-50 text-rose-700 ring-rose-200",
  "No Challan Yet": "bg-slate-100 text-slate-500 ring-slate-200",
};

const ReportTab = (c) => (
  <div className="space-y-4">
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><SlidersHorizontal size={16} /></span>
          Financial filters
        </div>
        {(Object.values(c.filters).some(Boolean) || c.search) && (
          <button onClick={c.clearFilters} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"><RotateCcw size={14} /> Clear</button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <select value={c.filters.departmentId} onChange={(e) => c.setFilter("departmentId", e.target.value)} className={selectCls}>
        <option value="">All classes</option>
        {c.departments.map((d) => (
          <option key={d._id} value={d._id}>{d.name}</option>
        ))}
      </select>
      <select value={c.filters.programId} onChange={(e) => c.setFilter("programId", e.target.value)} className={selectCls}>
        <option value="">All programs</option>
        {c.programs.map((p) => (
          <option key={p._id} value={p._id}>{p.name}</option>
        ))}
      </select>
      <select value={c.filters.semesterId} onChange={(e) => c.setFilter("semesterId", e.target.value)} className={selectCls}>
        <option value="">All sections</option>
        {c.semesters.map((s) => (
          <option key={s._id} value={s._id}>Section {s.number}</option>
        ))}
      </select>
      <select value={c.filters.termId} onChange={(e) => c.setFilter("termId", e.target.value)} className={selectCls}>
        <option value="">All sessions</option>
        {c.sessions.map((t) => (
          <option key={t._id} value={t._id}>{t.name}</option>
        ))}
      </select>
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={c.runReport}
        disabled={c.isFetching}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {c.isFetching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        Apply filters
      </button>
      <div className="relative flex-1 min-w-[220px]">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={c.search}
          onChange={(e) => c.setSearch(e.target.value)}
          placeholder="Search name, reg. no. or father's name"
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <button
        onClick={c.handleExport}
        disabled={!c.rows.length || c.isExporting}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
      >
        {c.isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
        Export Excel
      </button>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiTile label="Students" value={c.totalRowCount.toLocaleString()} icon={Users} tone="slate" />
      <KpiTile label="Fee Generated" value={c.fmtRs(c.totals.fee)} icon={PiggyBank} tone="indigo" />
      <KpiTile label="Collected" value={c.fmtRs(c.totals.paid)} icon={Wallet} tone="emerald" />
      <KpiTile label="Outstanding" value={c.fmtRs(c.totals.outstanding)} icon={TrendingUp} tone="rose" />
    </div>

    {c.errorMessage && <ErrorBox message={c.errorMessage} />}

    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {c.isLoading ? (
        <div className="flex justify-center py-16 text-slate-400">
          <Loader2 className="animate-spin" />
        </div>
      ) : c.rows.length === 0 ? (
        <EmptyState icon={Wallet} title="No students match" hint="Try different filters, or clear the search." />
      ) : (
        <>
        <div className="max-h-[560px] overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left font-bold px-3 py-2.5">Student</th>
                <th className="text-left font-bold px-3 py-2.5 hidden md:table-cell">Program</th>
                <th className="text-left font-bold px-3 py-2.5 hidden lg:table-cell">Sem / Session</th>
                <th className="text-right font-bold px-3 py-2.5">Fee</th>
                <th className="text-right font-bold px-3 py-2.5">Paid</th>
                <th className="text-right font-bold px-3 py-2.5">Outstanding</th>
                <th className="text-left font-bold px-3 py-2.5 hidden xl:table-cell">Scholarship</th>
                <th className="text-left font-bold px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {c.rows.map((r) => (
                <tr key={`${r.studentId}-${r.semester}`} className="hover:bg-blue-50/40">
                  <td className="px-3 py-2.5">
                    <p className="font-bold text-slate-900">{r.studentName}</p>
                    <p className="text-[10px] font-mono font-semibold text-slate-400">{r.studentId}</p>
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell text-slate-500 font-medium">
                    {r.program}
                    <div className="text-[10px] text-slate-400">{r.department}</div>
                  </td>
                  <td className="px-3 py-2.5 hidden lg:table-cell text-slate-500 font-medium">
                    {r.semester} · {r.session}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-700">{c.fmtRs(r.configuredTotalFee)}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-600">{c.fmtRs(r.totalPaid)}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-rose-600">{c.fmtRs(r.outstanding)}</td>
                  <td className="px-3 py-2.5 hidden xl:table-cell text-slate-500 font-medium">
                    {r.scholarshipName !== "N/A" ? r.scholarshipName : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ring-1 ${
                        PAY_STATUS_STYLE[r.paymentStatus] || PAY_STATUS_STYLE.Unpaid
                      }`}
                    >
                      {r.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {c.filteredRowCount > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-xs font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {((c.page - 1) * c.pageSize + 1).toLocaleString()}–{Math.min(c.page * c.pageSize, c.filteredRowCount).toLocaleString()} of {c.filteredRowCount.toLocaleString()}
            </span>
            <div className="flex items-center gap-2">
              <span className="mr-1">Page {c.page} of {Math.max(1, Math.ceil(c.filteredRowCount / c.pageSize))}</span>
              <button disabled={c.page <= 1} onClick={() => c.setPage(c.page - 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={15} /></button>
              <button disabled={c.page >= Math.ceil(c.filteredRowCount / c.pageSize)} onClick={() => c.setPage(c.page + 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40" aria-label="Next page"><ChevronRight size={15} /></button>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  </div>
);

const VcAccountsView = (c) => (
  <div className="min-h-screen bg-slate-50">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-5 inline-flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {[
          ["report", "Master Financial Report", Wallet],
          ["explorer", "Revenue Explorer", Compass],
        ].map(([key, label, icon]) => {
          const TabIcon = icon;
          return (
          <button
            key={key}
            onClick={() => c.setTab(key)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              c.tab === key ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <TabIcon size={15} /> {label}
          </button>
          );
        })}
      </div>

      {c.tab === "report" ? (
        <ReportTab {...c} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-1">
          <RevenueExplorerContainer readOnly />
        </div>
      )}
    </div>

    <ToastView toast={c.toast} />
  </div>
);

export default VcAccountsView;
