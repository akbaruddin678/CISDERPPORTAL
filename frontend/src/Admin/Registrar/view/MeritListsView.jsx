import React from "react";
import { Search, RefreshCw, ChevronDown, Eye, X, Users, Clock, CheckCircle } from "lucide-react";

const STATUS_LABELS = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  accepted: "Accepted",
  rejected: "Rejected",
};

const StatusBadge = ({ status }) => {
  const styles = {
    accepted: "bg-emerald-100 text-emerald-700",
    submitted: "bg-blue-100 text-blue-700",
    under_review: "bg-amber-100 text-amber-700",
    rejected: "bg-rose-100 text-rose-700",
    draft: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] ?? "bg-slate-100 text-slate-600"}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
};

const StatCard = (props) => {
  const Icon = props.icon;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${props.color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{props.label}</p>
        <p className="text-2xl font-bold text-slate-900">{props.value}</p>
      </div>
    </div>
  );
};

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "N/A");

const MeritListsView = ({
  admissions = [],
  isLoading,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  statusOptions = [],
  stats = { total: 0, submitted: 0, underReview: 0, accepted: 0 },
  refetch,
  page,
  setPage,
  hasMore,

  selectedAdmission,
  isFetchingDetails,
  isModalOpen,
  handleViewDetails,
  handleCloseModal,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Merit Lists &amp; Enrollment</h1>
            <p className="text-sm text-slate-500 mt-1">Real submitted admission applications, by department and program.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search applicants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-sm"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white cursor-pointer"
              >
                {statusOptions.map((o) => (<option key={o} value={o}>{STATUS_LABELS[o] || o}</option>))}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button onClick={refetch} disabled={isLoading} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 disabled:opacity-50">
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total (this page)" value={stats.total} color="bg-violet-500" />
          <StatCard icon={Clock} label="Submitted" value={stats.submitted} color="bg-blue-500" />
          <StatCard icon={Clock} label="Under Review" value={stats.underReview} color="bg-amber-500" />
          <StatCard icon={CheckCircle} label="Accepted" value={stats.accepted} color="bg-emerald-500" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-semibold">Applicant</th>
                  <th className="px-6 py-4 font-semibold">Program</th>
                  <th className="px-6 py-4 font-semibold">Department</th>
                  <th className="px-6 py-4 font-semibold">Session</th>
                  <th className="px-6 py-4 font-semibold">Applied</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
                ) : admissions.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">No applications found.</td></tr>
                ) : admissions.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{a.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{a.registrationNumber}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-[180px] truncate">{a.program}</td>
                    <td className="px-6 py-4 text-slate-600">{a.department}</td>
                    <td className="px-6 py-4 text-slate-600">{a.session}</td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(a.appliedDate)}</td>
                    <td className="px-6 py-4"><StatusBadge status={a.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleViewDetails(a)}
                        className="text-slate-400 hover:text-violet-600 transition-colors p-1.5 rounded-md hover:bg-violet-50"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center px-6 py-3 border-t border-slate-200 text-sm text-slate-500">
            <span>Page {page}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-slate-300 rounded-md disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore}
                className="px-3 py-1.5 border border-slate-300 rounded-md disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Application Details</h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="p-6">
              {isFetchingDetails ? (
                <p className="text-center text-slate-500 py-6">Loading...</p>
              ) : selectedAdmission ? (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ["Name", selectedAdmission.student?.name],
                    ["Email", selectedAdmission.student?.email],
                    ["Phone", selectedAdmission.student?.phone],
                    ["CNIC", selectedAdmission.student?.cnic],
                    ["Father's Name", selectedAdmission.student?.fatherName],
                    ["Gender", selectedAdmission.student?.gender],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500">{k}</p>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">{v || "N/A"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-6">No details found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeritListsView;
