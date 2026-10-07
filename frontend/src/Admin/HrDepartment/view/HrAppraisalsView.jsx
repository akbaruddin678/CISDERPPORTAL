import React from "react";
import { Plus, X, Star } from "lucide-react";

const STATUS_META = {
  Draft: "bg-gray-100 text-gray-700",
  "Pending Employee Review": "bg-yellow-100 text-yellow-800",
  Completed: "bg-green-100 text-green-800",
};

const HrAppraisalsView = ({
  reviewPeriod,
  setReviewPeriod,
  staffList = [],
  appraisals = [],
  isFetching,

  showCreateModal,
  openCreateModal,
  closeCreateModal,
  formData,
  handleFormChange,
  addKpiRow,
  updateKpiRow,
  removeKpiRow,
  handleCreate,
  isCreating,

  handleSendForSelfAssessment,
  handleForceComplete,
  isUpdating,
}) => {
  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Appraisals &amp; KPIs</h1>
            <p className="text-gray-600 mt-1">Create and track staff performance reviews.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} /> New Appraisal
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <input
            type="text"
            placeholder="Filter by review period (e.g. 2025-2026)"
            value={reviewPeriod}
            onChange={(e) => setReviewPeriod(e.target.value)}
            className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evaluator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isFetching ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                ) : appraisals.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <Star className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      No appraisals yet.
                    </td>
                  </tr>
                ) : (
                  appraisals.map((a) => (
                    <tr key={a._id} className="hover:bg-gray-50 align-top">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {a.staffId?.personalInfo?.name || "Unknown"}
                        <div className="text-xs text-gray-400">{a.staffId?.departmentId?.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {a.evaluatorId?.personalInfo?.name || "Unassigned"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{a.reviewPeriod}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{a.overallScore ?? "—"} / 5</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_META[a.status] || "bg-gray-100"}`}>
                          {a.status}
                        </span>
                        {a.employeeComments && (
                          <p className="text-xs text-gray-500 mt-1.5 max-w-xs">
                            <span className="font-semibold">Self-assessment:</span> {a.employeeComments}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm space-y-1">
                        {a.status === "Draft" && (
                          <button onClick={() => handleSendForSelfAssessment(a)} disabled={isUpdating} className="block text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50">
                            Send for Self-Assessment
                          </button>
                        )}
                        {a.status !== "Completed" && (
                          <button onClick={() => handleForceComplete(a)} disabled={isUpdating} className="block text-green-600 hover:text-green-800 font-medium disabled:opacity-50">
                            Force Complete
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
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">New Appraisal</h3>
              <button onClick={closeCreateModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff *</label>
                  <select
                    value={formData.staffId}
                    onChange={(e) => handleFormChange("staffId", e.target.value)}
                    required
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select staff</option>
                    {staffList.map((s) => (
                      <option key={s._id} value={s._id}>{s.personalInfo?.name} ({s.employeeId})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review Period *</label>
                  <input
                    type="text" placeholder="e.g. 2025-2026"
                    value={formData.reviewPeriod}
                    onChange={(e) => handleFormChange("reviewPeriod", e.target.value)}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Evaluator</label>
                <select
                  value={formData.evaluatorId}
                  onChange={(e) => handleFormChange("evaluatorId", e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Auto-detect from reporting line</option>
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id}>{s.personalInfo?.name} ({s.employeeId})</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank to use the employee's manager on file (roleAssignments), or pick someone directly.
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">KPIs</label>
                  <button type="button" onClick={addKpiRow} className="text-xs text-blue-600 hover:text-blue-800 font-medium">+ Add KPI</button>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Define the goals and their weightage — scoring happens later, after the employee's self-assessment.
                </p>
                {formData.kpis.map((kpi, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
                    <input
                      type="text" placeholder="Goal" value={kpi.goal}
                      onChange={(e) => updateKpiRow(i, "goal", e.target.value)}
                      className="col-span-8 p-2 border rounded-md text-sm"
                    />
                    <input
                      type="number" placeholder="Weight %" value={kpi.weightage}
                      onChange={(e) => updateKpiRow(i, "weightage", e.target.value)}
                      className="col-span-3 p-2 border rounded-md text-sm"
                    />
                    <button type="button" onClick={() => removeKpiRow(i)} className="col-span-1 text-red-500 hover:text-red-700"><X size={16} /></button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeCreateModal} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={isCreating} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {isCreating ? "Creating..." : "Create Appraisal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrAppraisalsView;
