import React from "react";
import {
  FaTimes,
  FaFileInvoiceDollar,
  FaUserShield,
  FaUndo,
  FaSpinner,
} from "react-icons/fa";

const CHALLAN_STATUS_META = {
  paid: { label: "Paid", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  overdue: { label: "Overdue", cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
  not_generated: { label: "Not Generated", cls: "bg-slate-100 text-slate-500 ring-1 ring-slate-200" },
};

const ADMISSION_STATUS_META = {
  active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  cancelled_non_payment: {
    label: "Cancelled — Non-Payment",
    cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  },
  re_admitted: { label: "Re-Admitted", cls: "bg-sky-50 text-sky-700 ring-1 ring-sky-200" },
};

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const formatAmount = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

// Dedicated drill-down for a single student's Challan/Payment status and
// Admission lifecycle status — the two fields are independent (see
// StudentProfile.status vs .admissionLifecycleStatus on the backend), each
// with its own history (due dates/pending amount for the former, cancel
// reason/re-admit date for the latter), so they get their own detail card
// here instead of being crammed into the list row.
const StudentLifecyclePanel = ({
  student,
  onClose,
  onReAdmit = () => {},
  isReAdmitting = false,
}) => {
  if (!student) return null;

  const challanMeta =
    CHALLAN_STATUS_META[student.challanStatus] || CHALLAN_STATUS_META.not_generated;
  const admissionMeta =
    ADMISSION_STATUS_META[student.admissionLifecycleStatus] ||
    ADMISSION_STATUS_META.active;
  const isCancelled = student.admissionLifecycleStatus === "cancelled_non_payment";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-black text-lg text-slate-900">
              Admission &amp; Payment Status
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {student.personalInfo?.fullName || "N/A"} · {student.studentId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"
          >
            <FaTimes size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Challan / Payment Status */}
          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/60">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FaFileInvoiceDollar size={14} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Challan / Payment Status
              </h4>
            </div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${challanMeta.cls}`}
            >
              {challanMeta.label}
            </span>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Pending Amount
                </p>
                <p className="font-bold text-slate-800">
                  {formatAmount(student.challanPendingAmount)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Latest Due Date
                </p>
                <p className="font-bold text-slate-800">
                  {formatDate(student.challanLatestDueDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Admission Lifecycle Status */}
          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/60">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FaUserShield size={14} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Admission Status
              </h4>
            </div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${admissionMeta.cls}`}
            >
              {admissionMeta.label}
            </span>

            {isCancelled && (
              <div className="mt-3 text-sm space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Cancelled On
                </p>
                <p className="font-bold text-rose-700">
                  {formatDate(student.cancelledAt)}
                </p>
                {student.cancelledReason && (
                  <p className="text-xs text-slate-500 mt-1">
                    {student.cancelledReason}
                  </p>
                )}
              </div>
            )}

            {student.admissionLifecycleStatus === "re_admitted" && (
              <div className="mt-3 text-sm">
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Re-Admitted On
                </p>
                <p className="font-bold text-sky-700">
                  {formatDate(student.reAdmittedAt)}
                </p>
              </div>
            )}

            {isCancelled && (
              <button
                onClick={() => onReAdmit(student._id)}
                disabled={isReAdmitting}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-sky-600 text-white hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReAdmitting ? (
                  <FaSpinner className="animate-spin" size={14} />
                ) : (
                  <FaUndo size={14} />
                )}
                Re-Admit This Student
              </button>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 text-white font-bold text-sm rounded-lg hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentLifecyclePanel;
