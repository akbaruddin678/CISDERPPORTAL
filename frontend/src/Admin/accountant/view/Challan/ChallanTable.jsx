import React from "react";
import {
  CheckCircle,
  Clock,
  XCircle,
  Printer,
  Trash2,
  Percent,
  Layers,
  ArrowRight,
  Edit,
  Tag,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon, // ✅ Imported Image Icon
  MessageSquare, // ✅ Imported Message Icon
} from "lucide-react";

// --- Status Badge Component ---
const StatusBadge = ({ status, isVoid }) => {
  if (isVoid)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded border border-slate-200">
        <XCircle size={12} /> VOID
      </span>
    );

  const c =
    {
      paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
      issued: "bg-blue-50 text-blue-700 border-blue-200",
      overdue: "bg-rose-50 text-rose-700 border-rose-200",
      partial: "bg-amber-50 text-amber-700 border-amber-200",
      merged: "bg-purple-50 text-purple-700 border-purple-200",
    }[status] || "bg-slate-50 border-slate-200";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${c} text-[10px] font-black uppercase rounded border`}
    >
      <Clock size={12} /> {status}
    </span>
  );
};

// --- Main Table Component ---
const ChallanTable = ({ challans, actions, onRowClick }) => {
  const fmt = (v) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(v);

  const formatType = (typeString) => {
    if (!typeString) return "Fee";
    return typeString
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" + ");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
            <tr>
              <th className="p-4">Ref #</th>
              <th className="p-4">Type</th>
              <th className="p-4">Remark</th>
              <th className="p-4">Section</th>
              <th className="p-4">Due Date</th>
              <th className="p-4">Fine</th>
              <th className="p-4">Net Payable</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {challans.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-12 text-center text-slate-400">
                  No records found
                </td>
              </tr>
            ) : (
              challans.map((c) => {
                const isVoid =
                  c.status === "cancelled" ||
                  c.status === "merged" ||
                  c.isDeleted;
                const isPaid = c.status === "paid";
                const isInst = c.isInstallment;

                return (
                  <tr
                    key={c._id}
                    className={`transition-colors cursor-pointer ${isVoid ? "bg-slate-50/50" : "hover:bg-slate-50"}`}
                    onClick={() => onRowClick && onRowClick(c)}
                  >
                    {/* REF # & DELETED DETAILS */}
                    <td className="p-4">
                      <div className="font-mono font-bold text-slate-700 flex items-center gap-2">
                        {isInst && (
                          <ArrowRight size={14} className="text-purple-400" />
                        )}
                        <span
                          className={
                            isVoid
                              ? "line-through decoration-slate-400 text-slate-400"
                              : ""
                          }
                        >
                          {c.challanNo}
                        </span>
                      </div>
                      {c.isDeleted && (
                        <div className="mt-1.5 flex items-start gap-1 text-[10px] text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded w-fit max-w-[200px]">
                          <AlertTriangle
                            size={12}
                            className="shrink-0 mt-0.5"
                          />
                          <div className="leading-tight">
                            <span className="font-bold uppercase tracking-wide">
                              Soft Deleted
                            </span>
                            <br />
                            <span className="text-rose-500">
                              Reason: {c.deletionReason || "Manual User Action"}
                              <br />
                              Date:{" "}
                              {new Date(
                                c.deletedAt || c.updatedAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* TYPE */}
                    <td className="p-4 align-top">
                      {isInst ? (
                        <span
                          className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase flex items-center gap-1 w-fit ${isVoid ? "bg-slate-100 text-slate-400 border-slate-200" : "bg-purple-50 text-purple-700 border-purple-100"}`}
                        >
                          <Layers size={10} /> Installment {c.installmentNumber}
                        </span>
                      ) : (
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded border uppercase ${isVoid ? "bg-slate-100 text-slate-400 border-slate-200" : "text-slate-600 bg-slate-100 border-slate-200"}`}
                        >
                          {formatType(c.challanType)}
                        </span>
                      )}
                    </td>

                    {/* REMARK — from Fee Setup, optional */}
                    <td className="p-4 align-top max-w-[160px]">
                      {c.feeSetupRemark ? (
                        <div
                          className={`flex items-start gap-1 text-[10px] px-2 py-1 rounded border w-fit max-w-full ${
                            isVoid
                              ? "text-slate-400 bg-slate-50 border-slate-200"
                              : "text-slate-600 bg-slate-50 border-slate-200"
                          }`}
                          title={c.feeSetupRemark}
                        >
                          <MessageSquare size={10} className="shrink-0 mt-0.5" />
                          <span className="truncate">{c.feeSetupRemark}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>

                    {/* SEMESTER / PART — this challan's own semester, not
                        the student's current one, so history from a
                        previous semester is clearly told apart instead of
                        looking like a duplicate/contradiction. */}
                    <td
                      className={`p-4 align-top text-xs font-semibold ${isVoid ? "text-slate-400" : "text-slate-600"}`}
                    >
                      {c.semesterId?.name ||
                        (c.semesterId?.number
                          ? `Section ${c.semesterId.number}`
                          : "—")}
                    </td>

                    {/* DUE DATE */}
                    <td
                      className={`p-4 font-medium text-xs align-top ${isVoid ? "text-slate-400" : "text-slate-600"}`}
                    >
                      {new Date(c.dueDate).toLocaleDateString()}
                    </td>

                    {/* FINE */}
                    <td className="p-4 align-top">
                      {c.fineAmount > 0 && !isVoid ? (
                        <span className="text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded text-xs border border-rose-100">
                          +{fmt(c.fineAmount)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* NET PAYABLE */}
                    <td className="p-4 align-top">
                      <div
                        className={`font-bold ${isVoid ? "text-slate-400" : "text-slate-900"}`}
                      >
                        {fmt(c.netAmount)}
                      </div>
                      {c.discountAmount > 0 && !isVoid && (
                        <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                          <Tag size={10} /> Discounted
                        </div>
                      )}
                    </td>

                    {/* STATUS & REMARK */}
                    <td className="p-4 align-top">
                      <div className="flex flex-col items-start gap-1.5">
                        <StatusBadge status={c.status} isVoid={isVoid} />

                        {/* ✅ DISPLAY REMARK IF PAID */}
                        {isPaid && c.paymentRemark && (
                          <div
                            className="flex items-start gap-1 text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded w-fit max-w-[150px]"
                            title={c.paymentRemark}
                          >
                            <MessageSquare
                              size={10}
                              className="shrink-0 mt-0.5"
                            />
                            <span className="truncate">{c.paymentRemark}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td
                      className="p-4 align-top flex justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* ✅ NEW: VIEW RECEIPT BUTTON */}
                      {isPaid && c.paymentProof && (
                        <a
                          href={c.paymentProof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 border border-emerald-100"
                          title="View Payment Receipt"
                        >
                          <ImageIcon size={14} />
                        </a>
                      )}

                      {!isVoid && !isPaid && (
                        <>
                          <button
                            onClick={() => actions.onPay(c._id)}
                            className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 border border-emerald-100"
                            title="Mark Paid"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => actions.onEditDate(c._id)}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 border border-blue-100"
                            title="Extend Date"
                          >
                            <Edit size={14} />
                          </button>
                          {!isInst && (
                            <>
                              <button
                                onClick={() => actions.onDiscount(c._id)}
                                className="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 border border-indigo-100"
                                title="Apply Discount"
                              >
                                <Tag size={14} />
                              </button>
                              <button
                                onClick={() => actions.onInstallment(c._id)}
                                className="p-1.5 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 border border-purple-100"
                                title="Split into Installments"
                              >
                                <Percent size={14} />
                              </button>
                            </>
                          )}
                          {isInst && c.status === "overdue" && (
                            <button
                              onClick={() => actions.onRenew(c._id, c.dueDate)}
                              className="p-1.5 bg-amber-50 text-amber-600 rounded hover:bg-amber-100 border border-amber-100"
                              title="Renew — reissue next month with the fine carried forward"
                            >
                              <RefreshCw size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => actions.onDelete(c._id)}
                            className="p-1.5 bg-rose-50 text-rose-600 rounded hover:bg-rose-100 border border-rose-100"
                            title="Void Challan"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}

                      {!isVoid && (
                        <button
                          onClick={() => actions.onPrint(c._id)}
                          className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 border border-slate-200"
                          title="Print Challan"
                        >
                          <Printer size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChallanTable;
