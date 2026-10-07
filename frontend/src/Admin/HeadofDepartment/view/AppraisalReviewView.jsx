import React from "react";
import { Star, X, ClipboardCheck } from "lucide-react";

const STATUS_META = {
  Draft: { label: "Draft", classes: "bg-gray-100 text-gray-700" },
  "Pending Employee Review": { label: "Awaiting Self-Assessment", classes: "bg-yellow-100 text-yellow-800" },
  Completed: { label: "Completed", classes: "bg-green-100 text-green-800" },
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, classes: "bg-gray-100 text-gray-800" };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${meta.classes}`}>{meta.label}</span>;
};

const AppraisalReviewView = ({
  appraisals = [],
  isFetching,

  selectedAppraisal,
  openScoreModal,
  closeScoreModal,
  scoreForm,
  setScoreForm,
  updateKpiScore,
  handleSubmitScore,
  isSubmitting,
}) => {
  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Appraisals to Review</h1>
          <p className="text-gray-600 mt-1">
            Score KPIs and give feedback for staff who report to you.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Self-Assessment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isFetching ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                ) : appraisals.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <Star className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      No appraisals assigned to you yet.
                    </td>
                  </tr>
                ) : (
                  appraisals.map((a) => (
                    <tr key={a._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {a.staffId?.personalInfo?.name || "Unknown"}
                        <div className="text-xs text-gray-400">{a.staffId?.departmentId?.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{a.reviewPeriod}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {a.employeeComments || <span className="text-gray-400 italic">Not submitted yet</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={a.status} /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {a.status !== "Completed" && (
                          <button
                            onClick={() => openScoreModal(a)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <ClipboardCheck size={14} /> Score
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

      {selectedAppraisal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Score — {selectedAppraisal.staffId?.personalInfo?.name} ({selectedAppraisal.reviewPeriod})
              </h3>
              <button onClick={closeScoreModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              {selectedAppraisal.employeeComments && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-900">
                  <p className="font-semibold mb-1">Employee's Self-Assessment</p>
                  {selectedAppraisal.employeeComments}
                </div>
              )}

              <div className="space-y-3">
                {scoreForm.kpis.map((kpi, i) => (
                  <div key={i} className="border border-gray-200 rounded-md p-3">
                    <p className="text-sm font-medium text-gray-800">{kpi.goal} <span className="text-gray-400">({kpi.weightage}%)</span></p>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <select
                        value={kpi.score}
                        onChange={(e) => updateKpiScore(i, "score", e.target.value)}
                        className="col-span-1 p-2 border rounded-md text-sm"
                      >
                        <option value="">Score</option>
                        {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <input
                        type="text"
                        placeholder="Comments"
                        value={kpi.comments}
                        onChange={(e) => updateKpiScore(i, "comments", e.target.value)}
                        className="col-span-2 p-2 border rounded-md text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Overall Evaluator Feedback</label>
                <textarea
                  value={scoreForm.evaluatorFeedback}
                  onChange={(e) => setScoreForm((prev) => ({ ...prev, evaluatorFeedback: e.target.value }))}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 pt-0">
              <button onClick={closeScoreModal} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmitScore}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Complete Appraisal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppraisalReviewView;
