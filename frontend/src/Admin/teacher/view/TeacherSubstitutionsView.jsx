import React from "react";
import { CalendarRange, Plus, X, Users, Inbox } from "lucide-react";

const STATUS_META = {
  Requested: { label: "Requested", classes: "bg-yellow-100 text-yellow-800" },
  "Accepted By Substitute": { label: "Covered", classes: "bg-blue-100 text-blue-800" },
  "Approved By HOD": { label: "Approved", classes: "bg-green-100 text-green-800" },
  Rejected: { label: "Rejected", classes: "bg-red-100 text-red-800" },
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "";

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, classes: "bg-gray-100 text-gray-800" };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${meta.classes}`}>{meta.label}</span>;
};

const TABS = [
  { key: "mine", label: "My Requests", icon: CalendarRange },
  { key: "open", label: "Open Requests to Cover", icon: Inbox },
];

const TeacherSubstitutionsView = ({
  activeTab,
  setActiveTab,

  myCourses = [],
  myRequests = [],
  isFetchingMine,
  openRequests = [],
  isFetchingOpen,

  showCreateModal,
  openCreateModal,
  closeCreateModal,
  formData,
  handleInputChange,
  handleCreateRequest,
  isCreating,

  handleAccept,
  isAccepting,
  handleCancel,
  isCancelling,
}) => {
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Class Substitution</h1>
          <p className="text-gray-600">Request coverage when you'll be absent, or cover a colleague's class.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Request Substitution
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "mine" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Absence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Substitute</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isFetchingMine ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                ) : myRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <CalendarRange className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      No substitution requests yet.
                    </td>
                  </tr>
                ) : (
                  myRequests.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {r.courseAssignmentId?.courseId?.title}
                        <div className="text-xs text-gray-400">{r.courseAssignmentId?.courseId?.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(r.dateOfAbsence)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{r.reason}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {r.substituteTeacherId?.personalInfo?.fullName || <span className="text-gray-400 italic">Not yet covered</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={r.status} /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {r.status === "Requested" && (
                          <button
                            onClick={() => handleCancel(r._id)}
                            disabled={isCancelling}
                            className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "open" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isFetchingOpen ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                ) : openRequests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      No open requests right now.
                    </td>
                  </tr>
                ) : (
                  openRequests.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {r.courseAssignmentId?.courseId?.title}
                        <div className="text-xs text-gray-400">{r.courseAssignmentId?.courseId?.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {r.requestingTeacherId?.personalInfo?.fullName || "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(r.dateOfAbsence)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{r.reason}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleAccept(r._id)}
                          disabled={isAccepting}
                          className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                        >
                          Accept
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Request Substitution</h3>
              <button onClick={closeCreateModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                <select
                  name="courseAssignmentId"
                  value={formData.courseAssignmentId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a course</option>
                  {myCourses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.courseId?.title} ({c.courseId?.code}) — Sec {c.section}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Absence *</label>
                <input
                  type="date"
                  name="dateOfAbsence"
                  value={formData.dateOfAbsence}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Why do you need coverage?"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSubstitutionsView;
