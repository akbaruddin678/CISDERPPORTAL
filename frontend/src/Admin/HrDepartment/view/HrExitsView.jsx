import React from "react";
import { Plus, X, LogOut, ChevronDown, ChevronUp, Check } from "lucide-react";

const CLEARANCE_LABELS = {
  itDepartment: "IT Department",
  library: "Library",
  finance: "Finance",
  departmentHod: "Department HOD",
};

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "");

const allClearancesDone = (clearances = {}) =>
  Boolean(clearances.itDepartment && clearances.library && clearances.finance && clearances.departmentHod);

const HrExitsView = ({
  staffList = [],
  records = [],
  isFetching,

  expandedId,
  toggleExpanded,

  settlementAmounts,
  setSettlementAmount,

  showCreateModal,
  openCreateModal,
  closeCreateModal,
  formData,
  handleFormChange,
  handleCreate,
  isCreating,

  handleToggleClearance,
  handleMarkSettled,
  isUpdating,
}) => {
  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Exit Management</h1>
            <p className="text-gray-600 mt-1">Track resignations, terminations, and clearance checklists.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} /> New Exit Record
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden divide-y divide-gray-200">
          {isFetching ? (
            <p className="text-center text-gray-500 py-12">Loading...</p>
          ) : records.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <LogOut className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              No exit records yet.
            </div>
          ) : (
            records.map((r) => {
              const cleared = allClearancesDone(r.clearances);
              const isExpanded = expandedId === r._id;
              return (
                <div key={r._id}>
                  <button
                    onClick={() => toggleExpanded(r._id)}
                    className="w-full flex justify-between items-center px-6 py-4 hover:bg-gray-50 text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.staffId?.personalInfo?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-500">{r.type} · Last Working Day: {formatDate(r.lastWorkingDay)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${cleared ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {cleared ? "Fully Cleared" : "Clearance Pending"}
                      </span>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-6 pb-5 space-y-4">
                      <p className="text-sm text-gray-600">{r.reason}</p>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Clearance Checklist</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {Object.entries(CLEARANCE_LABELS).map(([key, label]) => (
                            <button
                              key={key}
                              onClick={() => handleToggleClearance(r, key)}
                              disabled={isUpdating}
                              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border disabled:opacity-50 ${
                                r.clearances[key] ? "bg-green-50 border-green-300 text-green-800" : "bg-white border-gray-300 text-gray-600"
                              }`}
                            >
                              {r.clearances[key] && <Check size={14} />}
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-sm text-gray-600">
                          Final Settlement:{" "}
                          {r.finalSettlementPaid ? (
                            <span className="text-green-700 font-medium">
                              Paid{r.finalSettlementAmount ? ` — Rs. ${r.finalSettlementAmount.toLocaleString("en-PK")}` : ""}
                            </span>
                          ) : (
                            "Not paid"
                          )}
                        </span>
                        {!r.finalSettlementPaid && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="Amount"
                              value={settlementAmounts[r._id] || ""}
                              onChange={(e) => setSettlementAmount(r._id, e.target.value)}
                              className="w-28 px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                            />
                            <button
                              onClick={() => handleMarkSettled(r)}
                              disabled={isUpdating}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                            >
                              Mark Settlement Paid
                            </button>
                          </div>
                        )}
                      </div>
                      {cleared && (
                        <p className="text-xs text-gray-400 pt-1">
                          All clearances complete — this employee's login and staff record have been deactivated.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">New Exit Record</h3>
              <button onClick={closeCreateModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <select
                value={formData.staffId}
                onChange={(e) => handleFormChange("staffId", e.target.value)}
                required
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select staff</option>
                {staffList.map((s) => (<option key={s._id} value={s._id}>{s.personalInfo?.name} ({s.employeeId})</option>))}
              </select>
              <select value={formData.type} onChange={(e) => handleFormChange("type", e.target.value)} className="w-full p-2 border rounded-md">
                <option value="Resignation">Resignation</option>
                <option value="Termination">Termination</option>
                <option value="Retirement">Retirement</option>
                <option value="Contract Expiry">Contract Expiry</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notice Given *</label>
                  <input type="date" value={formData.noticeGivenDate} onChange={(e) => handleFormChange("noticeGivenDate", e.target.value)} required className="w-full p-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Working Day *</label>
                  <input type="date" value={formData.lastWorkingDay} onChange={(e) => handleFormChange("lastWorkingDay", e.target.value)} required className="w-full p-2 border rounded-md" />
                </div>
              </div>
              <textarea placeholder="Reason" value={formData.reason} onChange={(e) => handleFormChange("reason", e.target.value)} rows="3" className="w-full p-2 border rounded-md" />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeCreateModal} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={isCreating} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {isCreating ? "Creating..." : "Create Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrExitsView;
