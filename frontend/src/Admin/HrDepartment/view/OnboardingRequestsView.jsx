import React from "react";
import { ClipboardList, CheckCircle2, XCircle, Clock, Eye } from "lucide-react";
import OnboardingRequestDetailModal from "./OnboardingRequestDetailModal";

const STATUS_TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "N/A");

const OnboardingRequestsView = ({
  statusTab,
  setStatusTab,
  requests,
  isLoading,
  handleApprove,
  openRejectModal,

  viewTarget,
  isViewModalOpen,
  openViewModal,
  closeViewModal,

  rejectTarget,
  isRejectModalOpen,
  closeRejectModal,
  rejectReason,
  setRejectReason,
  confirmReject,
  isRejecting,
}) => (
  <div className="p-4 md:p-8 space-y-6">
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
        <ClipboardList size={20} />
      </div>
      <div>
        <h1 className="text-xl font-black text-slate-900">Onboarding Requests</h1>
        <p className="text-sm text-slate-500 font-medium">
          Applications submitted through the public teacher/staff onboarding page.
        </p>
      </div>
    </div>

    <div className="flex gap-2 border-b border-slate-200">
      {STATUS_TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => setStatusTab(tab.value)}
          className={`px-4 py-2 text-sm font-bold rounded-t-xl transition-colors ${
            statusTab === tab.value
              ? "bg-white border border-b-0 border-slate-200 text-slate-900"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>

    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-400 font-bold text-[11px] uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Applying For</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">Loading...</td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">No {statusTab} requests.</td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800">{r.firstName} {r.lastName}</div>
                    <div className="text-xs text-slate-400">{r.nationalId || "No CNIC provided"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700">{r.email}</div>
                    <div className="text-xs text-slate-400">{r.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{r.departmentId?.name || "N/A"}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700">{r.designation || r.role}</div>
                    <div className="text-xs text-slate-400">{r.employmentType}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openViewModal(r)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200"
                      >
                        <Eye size={12} /> View
                      </button>
                      {statusTab === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(r)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100"
                          >
                            <CheckCircle2 size={12} /> Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(r)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-100"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>

    {isViewModalOpen && (
      <OnboardingRequestDetailModal
        request={viewTarget}
        onClose={closeViewModal}
        onApprove={(r) => {
          closeViewModal();
          handleApprove(r);
        }}
        onReject={(r) => {
          closeViewModal();
          openRejectModal(r);
        }}
      />
    )}

    {isRejectModalOpen && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
          <div className="flex items-center gap-2 text-rose-600 font-black">
            <XCircle size={20} /> Reject Application
          </div>
          <p className="text-sm text-slate-500">
            Rejecting <strong>{rejectTarget?.firstName} {rejectTarget?.lastName}</strong>&apos;s application. You
            can optionally add a reason.
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="Reason (optional)"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-400"
          />
          <div className="flex justify-end gap-2">
            <button onClick={closeRejectModal} disabled={isRejecting} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl">
              Cancel
            </button>
            <button
              onClick={confirmReject}
              disabled={isRejecting}
              className="px-4 py-2 text-sm font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50"
            >
              {isRejecting ? "Rejecting..." : "Reject Application"}
            </button>
          </div>
        </div>
      </div>
    )}

    {requests.length === 0 && statusTab === "pending" && !isLoading && (
      <p className="flex items-center gap-2 text-xs text-slate-400">
        <Clock size={12} /> Share the public link with applicants: <code>/teacher-onboarding</code>
      </p>
    )}
  </div>
);

export default OnboardingRequestsView;
