import React from "react";
import { FileText, Check, X, Search } from "lucide-react";

const STATUS_META = {
  Pending: { label: "Awaiting Your Review", classes: "bg-yellow-100 text-yellow-800" },
  Approved_HOD: { label: "Forwarded to HR", classes: "bg-blue-100 text-blue-800" },
  Approved_HR: { label: "Approved", classes: "bg-green-100 text-green-800" },
  Rejected: { label: "Rejected", classes: "bg-red-100 text-red-800" },
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, classes: "bg-gray-100 text-gray-800" };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${meta.classes}`}>{meta.label}</span>;
};

const StatTile = ({ label, value, classes }) => (
  <div className={`rounded-xl p-4 text-center ${classes}`}>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs font-semibold uppercase tracking-wide mt-1">{label}</p>
  </div>
);

const ACTIONABLE_STATUS = "Pending";

const HodLeavesView = ({
  requests = [],
  totalRequests = 0,
  isFetching,
  statistics = { total: 0, pending: 0, forwardedToHr: 0, approved: 0, rejected: 0 },

  selectedStatus,
  setSelectedStatus,
  searchTerm,
  setSearchTerm,

  selectedRequest,
  isDecisionOpen,
  openDecisionModal,
  closeDecisionModal,
  decisionRemarks,
  setDecisionRemarks,

  handleApprove,
  handleConfirmReject,
  isReviewing,
}) => {
  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Leave Requests</h1>
          <p className="text-gray-600 mt-1">
            Review leave requests from staff in your department — approved requests are forwarded to HR for final sign-off.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatTile label="Total" value={statistics.total} classes="bg-slate-100 text-slate-700" />
          <StatTile label="Awaiting You" value={statistics.pending} classes="bg-yellow-50 text-yellow-800" />
          <StatTile label="Forwarded to HR" value={statistics.forwardedToHr} classes="bg-blue-50 text-blue-800" />
          <StatTile label="Approved" value={statistics.approved} classes="bg-green-50 text-green-800" />
          <StatTile label="Rejected" value={statistics.rejected} classes="bg-red-50 text-red-800" />
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by staff or leave type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Awaiting Your Review</option>
            <option value="Approved_HOD">Forwarded to HR</option>
            <option value="Approved_HR">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isFetching ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      {totalRequests === 0 ? "No leave requests from your department yet." : "No requests match the current filters."}
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {r.staffId?.personalInfo?.name || "Unknown"}
                        <div className="text-xs text-gray-400">{r.staffId?.employeeId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.leaveType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(r.startDate)} — {formatDate(r.endDate)}
                        <span className="text-gray-400"> ({r.totalDays}d)</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{r.reason}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={r.status} /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {r.status === ACTIONABLE_STATUS && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(r)}
                              disabled={isReviewing}
                              className="text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => openDecisionModal(r)}
                              disabled={isReviewing}
                              className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                              title="Reject"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isDecisionOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Reject Leave Request</h3>
              <p className="text-sm text-gray-500 mt-1">{selectedRequest.staffId?.personalInfo?.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                value={decisionRemarks}
                onChange={(e) => setDecisionRemarks(e.target.value)}
                required
                rows="3"
                placeholder="Reason for rejection..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3 p-6 pt-0">
              <button
                onClick={closeDecisionModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isReviewing}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HodLeavesView;
