import {
  Activity,
  Search,
  Download,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Flag,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const METHOD_COLORS = {
  POST: "bg-blue-50 text-blue-700 border-blue-200",
  PUT: "bg-amber-50 text-amber-700 border-amber-200",
  PATCH: "bg-amber-50 text-amber-700 border-amber-200",
  DELETE: "bg-red-50 text-red-700 border-red-200",
};

const Pill = ({ children, className = "" }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${className}`}
  >
    {children}
  </span>
);

const ActivityLogView = ({
  logs,
  total,
  page,
  totalPages,
  isLoading,
  isFetching,
  meta,
  filters,
  onFilterChange,
  onResetFilters,
  onPageChange,
  onRefresh,
  onExport,
  isExporting,
  onViewDetail,
  selectedLog,
  onCloseDetail,
  reviewNote,
  onReviewNoteChange,
  onSaveReview,
  onUnreview,
  isReviewSaving,
}) => {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100">
            <Activity size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Activity Log</h1>
            <p className="text-xs text-slate-400">
              Every data change made by every user, system-wide
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={onExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
          >
            <Download size={13} />
            {isExporting ? "Exporting..." : "Export Excel"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <div className="col-span-2 md:col-span-2 relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search email / route / note..."
            value={filters.search || ""}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="w-full pl-8 pr-2 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <select
          value={filters.module || ""}
          onChange={(e) => onFilterChange("module", e.target.value)}
          className="text-xs rounded-lg border border-slate-200 px-2 py-2"
        >
          <option value="">All Modules</option>
          {(meta?.modules || []).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={filters.action || ""}
          onChange={(e) => onFilterChange("action", e.target.value)}
          className="text-xs rounded-lg border border-slate-200 px-2 py-2"
        >
          <option value="">All Actions</option>
          {(meta?.actions || []).map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={filters.method || ""}
          onChange={(e) => onFilterChange("method", e.target.value)}
          className="text-xs rounded-lg border border-slate-200 px-2 py-2"
        >
          <option value="">All Methods</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
        <select
          value={filters.success ?? ""}
          onChange={(e) => onFilterChange("success", e.target.value)}
          className="text-xs rounded-lg border border-slate-200 px-2 py-2"
        >
          <option value="">Any Status</option>
          <option value="true">Success</option>
          <option value="false">Failed</option>
        </select>
        <select
          value={filters.reviewed ?? ""}
          onChange={(e) => onFilterChange("reviewed", e.target.value)}
          className="text-xs rounded-lg border border-slate-200 px-2 py-2"
        >
          <option value="">Reviewed: Any</option>
          <option value="true">Reviewed</option>
          <option value="false">Unreviewed</option>
        </select>
        <input
          type="date"
          value={filters.dateFrom || ""}
          onChange={(e) => onFilterChange("dateFrom", e.target.value)}
          className="text-xs rounded-lg border border-slate-200 px-2 py-2"
        />
        <input
          type="date"
          value={filters.dateTo || ""}
          onChange={(e) => onFilterChange("dateTo", e.target.value)}
          className="text-xs rounded-lg border border-slate-200 px-2 py-2"
        />
        <button
          onClick={onResetFilters}
          className="text-xs font-bold text-slate-500 hover:text-slate-700 underline justify-self-start"
        >
          Reset filters
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[10px] font-bold tracking-wide">
                <th className="text-left px-3 py-2.5">Time</th>
                <th className="text-left px-3 py-2.5">User</th>
                <th className="text-left px-3 py-2.5">Module</th>
                <th className="text-left px-3 py-2.5">Action</th>
                <th className="text-left px-3 py-2.5">Method</th>
                <th className="text-left px-3 py-2.5">Route</th>
                <th className="text-left px-3 py-2.5">Status</th>
                <th className="text-left px-3 py-2.5">Reviewed</th>
                <th className="text-right px-3 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    No activity found for these filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log._id}
                    className="border-b border-slate-50 hover:bg-slate-50/70"
                  >
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                      {fmtDateTime(log.createdAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-slate-700">
                        {log.userEmail}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {(log.userRoles || []).join(", ") || "—"}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{log.module}</td>
                    <td className="px-3 py-2.5 text-slate-600 capitalize">
                      {log.action}
                    </td>
                    <td className="px-3 py-2.5">
                      <Pill
                        className={
                          METHOD_COLORS[log.method] ||
                          "bg-slate-50 text-slate-600 border-slate-200"
                        }
                      >
                        {log.method}
                      </Pill>
                    </td>
                    <td
                      className="px-3 py-2.5 text-slate-500 max-w-[260px] truncate font-mono text-[11px]"
                      title={log.route}
                    >
                      {log.route}
                    </td>
                    <td className="px-3 py-2.5">
                      {log.success ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                          <CheckCircle2 size={13} /> {log.statusCode}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 font-bold text-[11px]">
                          <XCircle size={13} /> {log.statusCode}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {log.reviewed ? (
                        <Pill className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Reviewed
                        </Pill>
                      ) : (
                        <Pill className="bg-slate-50 text-slate-500 border-slate-200">
                          Pending
                        </Pill>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => onViewDetail(log)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
                      >
                        <Eye size={12} /> Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500">
          <span>
            {total} total entr{total === 1 ? "y" : "ies"} — page {page} of{" "}
            {Math.max(totalPages, 1)}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-sm">
                Activity Detail
              </h2>
              <button
                onClick={onCloseDetail}
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    User
                  </p>
                  <p className="font-semibold text-slate-700">
                    {selectedLog.userEmail}
                  </p>
                  <p className="text-slate-400">
                    {(selectedLog.userRoles || []).join(", ") || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Time
                  </p>
                  <p className="font-semibold text-slate-700">
                    {fmtDateTime(selectedLog.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Route
                  </p>
                  <p className="font-mono text-slate-700 break-all">
                    {selectedLog.method} {selectedLog.route}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Status
                  </p>
                  <p
                    className={`font-semibold ${selectedLog.success ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {selectedLog.statusCode}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    IP Address
                  </p>
                  <p className="text-slate-700">
                    {selectedLog.ipAddress || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Duration
                  </p>
                  <p className="text-slate-700">
                    {selectedLog.durationMs != null
                      ? `${selectedLog.durationMs} ms`
                      : "—"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                  User Agent
                </p>
                <p className="text-slate-600 break-all">
                  {selectedLog.userAgent || "—"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Request Payload
                </p>
                <pre className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-[11px] overflow-x-auto max-h-52">
                  {selectedLog.requestBody &&
                  Object.keys(selectedLog.requestBody).length > 0
                    ? JSON.stringify(selectedLog.requestBody, null, 2)
                    : "— empty —"}
                </pre>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 flex items-center gap-1">
                  <Flag size={11} /> Review Note
                </p>
                <textarea
                  value={reviewNote}
                  onChange={(e) => onReviewNoteChange(e.target.value)}
                  rows={2}
                  placeholder="e.g. Confirmed with accountant, this change was authorized."
                  className="w-full text-xs rounded-lg border border-slate-200 px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={onSaveReview}
                    disabled={isReviewSaving}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {selectedLog.reviewed
                      ? "Update Review"
                      : "Mark as Reviewed"}
                  </button>
                  {selectedLog.reviewed && (
                    <button
                      onClick={onUnreview}
                      disabled={isReviewSaving}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Unmark
                    </button>
                  )}
                  {selectedLog.reviewed && (
                    <span className="text-[10px] text-slate-400">
                      Reviewed by {selectedLog.reviewedBy?.email || "—"} on{" "}
                      {fmtDateTime(selectedLog.reviewedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogView;
