import React, { useMemo } from "react";
import {
  fmt,
  fmtDate,
  StatusBadge,
  ChallanTypeBadge,
  LoadingState,
  EmptyState,
} from "../../common/Hostelshared";
import {
  Eye,
  CheckCircle,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
  Calendar,
  Printer,
} from "lucide-react";

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "issued", label: "Issued" },
  { id: "overdue", label: "Overdue" },
  { id: "paid", label: "Paid" },
  { id: "partial", label: "Partial" },
  { id: "cancelled", label: "Cancelled" },
];

export default function HostelFeeView({
  loading,
  onView,
  filteredChallans,
  statusFilter,
  setStatusFilter,
  sortKey,
  sortDir,
  handleSort,
  feeSelected,
  setFeeSelected,
  toggleAllFees,
  toggleOneFee,
  payingId,
  challanCounts,
  handleQuickPay,
  handleBulkDeleteFees,
  monthFilter,
  setMonthFilter,
  onSinglePrint, // ✅ Received print prop
  onBulkPrint, // ✅ Received bulk print prop
}) {
  if (loading) return <LoadingState label="Loading challans…" />;

  const allSelected =
    feeSelected.size === filteredChallans.length && filteredChallans.length > 0;

  const monthLabel = useMemo(() => {
    if (!monthFilter) return null;
    const [y, m] = monthFilter.split("-");
    return new Date(+y, +m - 1).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  }, [monthFilter]);

  return (
    <div className="space-y-3">
      {/* ── Status + Month Filter Row ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 border-b border-slate-100">
          <div className="flex gap-0.5 overflow-x-auto">
            {STATUS_TABS.map((t) => {
              const active = statusFilter === t.id;
              const count = challanCounts[t.id];
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setStatusFilter(t.id);
                    setFeeSelected(new Set());
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                    active
                      ? "text-indigo-600 border-indigo-600"
                      : "text-slate-500 border-transparent hover:text-slate-800"
                  }`}
                >
                  {t.label}
                  {count > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${active ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {monthLabel && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-semibold text-indigo-700 shrink-0 ml-3">
              <Calendar size={12} />
              {monthLabel}
              <button
                onClick={() => setMonthFilter("")}
                className="text-indigo-400 hover:text-indigo-700 ml-0.5"
              >
                <X size={11} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Bulk Action Bar ── */}
      {feeSelected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-950 text-white rounded-2xl">
          <span className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-xs font-bold">
            {feeSelected.size}
          </span>
          <span className="text-sm font-semibold">
            {feeSelected.size === 1 ? "record" : "records"} selected
          </span>
          <div className="w-px h-4 bg-indigo-700 mx-1" />
          <button
            onClick={handleBulkDeleteFees}
            className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 text-xs font-semibold transition-colors"
          >
            <Trash2 size={13} /> Delete Selected
          </button>

          {/* ✅ Print Selected Button */}
          <div className="w-px h-4 bg-indigo-700 mx-1" />
          <button
            onClick={onBulkPrint}
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-xs font-semibold transition-colors"
          >
            <Printer size={13} /> Print Selected
          </button>

          <button
            onClick={() => setFeeSelected(new Set())}
            className="ml-auto text-indigo-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
          >
            <X size={12} /> Clear
          </button>
        </div>
      )}

      {/* ── Table ── */}
      {filteredChallans.length === 0 ? (
        <EmptyState
          icon="🧾"
          title={
            statusFilter === "all"
              ? "No hostel challans yet"
              : `No ${statusFilter} challans`
          }
          sub={
            monthLabel
              ? `No challans found for ${monthLabel}.`
              : "Challans are generated automatically when a student is assigned."
          }
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Hostel Fee Challans
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {filteredChallans.length} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAllFees}
                      className="w-4 h-4 rounded border-slate-300 accent-indigo-600 cursor-pointer"
                    />
                  </th>
                  <SortTh
                    label="Challan No"
                    k="challanNo"
                    current={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Type</th>
                  <SortTh
                    label="Net Amount"
                    k="netAmount"
                    current={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Balance</th>
                  <SortTh
                    label="Issue Date"
                    k="issueDate"
                    current={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <SortTh
                    label="Due Date"
                    k="dueDate"
                    current={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredChallans.map((c, i) => {
                  const name = c.studentId?.personalInfo?.fullName ?? "—";
                  const regNo = c.studentId?.studentId ?? "—";
                  const isPaid = c.status === "paid";
                  const isOverdue = c.status === "overdue";
                  const isCancelled = c.status === "cancelled";
                  const isSelected = feeSelected.has(c._id);
                  return (
                    <tr
                      key={c._id ?? i}
                      className={`transition-colors ${isSelected ? "bg-indigo-50/60" : isOverdue ? "bg-amber-50/40 hover:bg-amber-50/70" : "hover:bg-slate-50/80"}`}
                    >
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOneFee(c._id)}
                          className="w-4 h-4 rounded border-slate-300 accent-indigo-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onView(c)}
                          className="font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline text-sm transition-colors"
                        >
                          {c.challanNo}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 text-sm">
                          {name}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {regNo}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <ChallanTypeBadge type={c.challanType} />
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {fmt(c.netAmount)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600">
                        {fmt(c.paidAmount)}
                      </td>
                      <td
                        className={`px-4 py-3 font-semibold ${c.remainingAmount > 0 ? "text-rose-600" : "text-emerald-600"}`}
                      >
                        {fmt(c.remainingAmount)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {fmtDate(c.issueDate ?? c.createdAt)}
                      </td>
                      <td
                        className={`px-4 py-3 text-xs font-semibold ${isOverdue ? "text-rose-600" : "text-slate-500"}`}
                      >
                        {fmtDate(c.dueDate)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          {/* ✅ Single Print Action */}
                          {!isCancelled && (
                            <button
                              onClick={() => onSinglePrint(c)}
                              title="Print Challan"
                              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                            >
                              <Printer size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => onView(c)}
                            title="View Details"
                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                          >
                            <Eye size={14} />
                          </button>
                          {!isPaid && (
                            <button
                              onClick={() => handleQuickPay(c)}
                              title="Mark as Paid"
                              disabled={payingId === c._id}
                              className="w-8 h-8 rounded-lg border border-emerald-100 bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-all disabled:opacity-50"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          {!isPaid && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Delete challan ${c.challanNo}?`,
                                  )
                                )
                                  handleBulkDeleteFees();
                              }}
                              title="Delete"
                              className="w-8 h-8 rounded-lg border border-rose-100 bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-8">
            <FooterStat
              label="Total Generated"
              value={fmt(
                filteredChallans.reduce((s, c) => s + (c.netAmount ?? 0), 0),
              )}
            />
            <FooterStat
              label="Total Collected"
              value={fmt(
                filteredChallans.reduce((s, c) => s + (c.paidAmount ?? 0), 0),
              )}
              color="text-emerald-600"
            />
            <FooterStat
              label="Total Outstanding"
              value={fmt(
                filteredChallans.reduce(
                  (s, c) => s + (c.remainingAmount ?? 0),
                  0,
                ),
              )}
              color="text-rose-600"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SortTh({ label, k, current, dir, onSort }) {
  const active = current === k;
  return (
    <th
      onClick={() => onSort(k)}
      className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest cursor-pointer select-none transition-colors ${active ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
    >
      <span className="flex items-center gap-1">
        {label}{" "}
        <span className="opacity-60">
          {active ? (
            dir === "asc" ? (
              <ChevronUp size={11} />
            ) : (
              <ChevronDown size={11} />
            )
          ) : (
            <ChevronsUpDown size={11} />
          )}
        </span>
      </span>
    </th>
  );
}

function FooterStat({ label, value, color }) {
  return (
    <div className="text-right">
      <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
      <p className={`font-bold text-sm ${color || "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}
