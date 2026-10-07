import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, CalendarDays, Plus, X, Loader2, FileStack, Clock4,
  CheckCircle2, XCircle, Hourglass, Ban,
} from "lucide-react";
import StateCard from "../components/StateCard";

const STATUS_META = {
  Pending: { label: "Pending", className: "bg-amber-100 text-amber-700", icon: Hourglass },
  Approved_HOD: { label: "Approved by HOD", className: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  Approved_HR: { label: "Approved", className: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  Rejected: { label: "Rejected", className: "bg-rose-100 text-rose-700", icon: XCircle },
};

const LEAVE_TYPES = ["Casual", "Medical", "Annual", "Unpaid", "Maternity"];

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, className: "bg-slate-100 text-slate-600", icon: Clock4 };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${meta.className}`}>
      <Icon size={12} /> {meta.label}
    </span>
  );
};

const fieldClass =
  "w-full px-3.5 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50";

const TeacherLeaveView = ({
  requests = [],
  isFetching,

  showApplyModal,
  openApplyModal,
  closeApplyModal,
  formData,
  handleInputChange,
  handleSubmitApplication,
  isSubmitting,

  handleCancelRequest,
  isCancelling,
}) => {
  const navigate = useNavigate();

  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const approvedCount = requests.filter((r) => r.status === "Approved_HR").length;
  const rejectedCount = requests.filter((r) => r.status === "Rejected").length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 lg:p-12 font-sans w-full">
      <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 shadow-lg">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="relative p-5 sm:p-7 flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3 sm:gap-4 min-w-0">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 flex-shrink-0">
                <ArrowLeft size={20} />
              </button>
              <div className="w-11 h-11 rounded-2xl bg-white/10 text-white flex items-center justify-center flex-shrink-0">
                <CalendarDays size={20} />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug">My Leave Requests</h1>
                <p className="text-white/60 text-sm font-medium">Apply for leave and track your HOD/HR approval status.</p>
              </div>
            </div>
            <button
              onClick={openApplyModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-indigo-50 text-indigo-700 text-sm font-bold rounded-xl transition-colors shadow-sm flex-shrink-0"
            >
              <Plus size={16} /> Apply Leave
            </button>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wide">
              <FileStack size={13} /> Total
            </div>
            <p className="mt-1 text-xl font-black text-slate-800">{requests.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-amber-500 text-[11px] font-bold uppercase tracking-wide">
              <Hourglass size={13} /> Pending
            </div>
            <p className="mt-1 text-xl font-black text-amber-700">{pendingCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-emerald-500 text-[11px] font-bold uppercase tracking-wide">
              <CheckCircle2 size={13} /> Approved
            </div>
            <p className="mt-1 text-xl font-black text-emerald-700">{approvedCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-rose-500 text-[11px] font-bold uppercase tracking-wide">
              <XCircle size={13} /> Rejected
            </div>
            <p className="mt-1 text-xl font-black text-rose-700">{rejectedCount}</p>
          </div>
        </div>

        {isFetching ? (
          <StateCard variant="loading" title="Loading your leave requests…" />
        ) : requests.length === 0 ? (
          <StateCard
            icon={CalendarDays}
            title="No leave applications yet"
            description='Click "Apply Leave" to submit your first request.'
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Desktop/tablet: table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                    <th className="p-4 font-bold">Type</th>
                    <th className="p-4 font-bold">Duration</th>
                    <th className="p-4 font-bold">Reason</th>
                    <th className="p-4 font-bold">Applied On</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold">Remarks</th>
                    <th className="p-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((app) => (
                    <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-800">{app.leaveType}</td>
                      <td className="p-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                        {formatDate(app.startDate)} — {formatDate(app.endDate)}
                        <span className="text-slate-400"> ({app.totalDays}d)</span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 max-w-xs truncate">{app.reason}</td>
                      <td className="p-4 text-sm text-slate-400 font-medium whitespace-nowrap">{formatDate(app.createdAt)}</td>
                      <td className="p-4"><StatusBadge status={app.status} /></td>
                      <td className="p-4 text-sm text-slate-500">
                        {app.hrReview?.remarks || app.hodReview?.remarks || <span className="text-slate-300 italic">—</span>}
                      </td>
                      <td className="p-4">
                        {app.status === "Pending" && (
                          <button
                            onClick={() => handleCancelRequest(app._id)}
                            disabled={isCancelling}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            <Ban size={12} /> Withdraw
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: stacked cards */}
            <div className="sm:hidden divide-y divide-slate-100">
              {requests.map((app) => (
                <div key={app._id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-800">{app.leaveType}</p>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-sm text-slate-600 font-medium">
                    {formatDate(app.startDate)} — {formatDate(app.endDate)}
                    <span className="text-slate-400"> ({app.totalDays}d)</span>
                  </p>
                  <p className="text-sm text-slate-500">{app.reason}</p>
                  {(app.hrReview?.remarks || app.hodReview?.remarks) && (
                    <p className="text-xs text-slate-400 italic">
                      {app.hrReview?.remarks || app.hodReview?.remarks}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400 font-medium">Applied {formatDate(app.createdAt)}</span>
                    {app.status === "Pending" && (
                      <button
                        onClick={() => handleCancelRequest(app._id)}
                        disabled={isCancelling}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        <Ban size={12} /> Withdraw
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 p-5">
              <button
                onClick={closeApplyModal}
                className="absolute top-4 right-4 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center flex-shrink-0">
                  <CalendarDays size={19} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-base leading-tight">Apply for Leave</h3>
                  <p className="text-white/60 text-xs font-medium">Goes to your HOD first, then HR for final sign-off.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitApplication} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Leave Type</label>
                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleInputChange}
                  required
                  className={`${fieldClass} cursor-pointer`}
                >
                  <option value="">Select type</option>
                  {LEAVE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Reason</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  placeholder="Please provide details..."
                  className={`${fieldClass} resize-none`}
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeApplyModal}
                  className="flex-1 px-4 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-60 shadow-sm whitespace-nowrap"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherLeaveView;
