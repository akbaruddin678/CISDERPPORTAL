import React from "react";
import { Star, X, ClipboardEdit } from "lucide-react";

const STATUS_META = {
  Draft: { label: "Draft (not yet started)", classes: "bg-gray-100 text-gray-700" },
  "Pending Employee Review": { label: "Awaiting Your Self-Assessment", classes: "bg-yellow-100 text-yellow-800" },
  Completed: { label: "Completed", classes: "bg-green-100 text-green-800" },
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, classes: "bg-gray-100 text-gray-800" };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${meta.classes}`}>{meta.label}</span>;
};

const TeacherAppraisalsView = ({
  appraisals = [],
  isFetching,

  selectedAppraisal,
  openAssessmentModal,
  closeAssessmentModal,
  comments,
  setComments,
  handleSubmit,
  isSubmitting,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">My Appraisals</h2>
          <p className="text-sm text-gray-500 mt-1">
            Review your performance goals and submit a self-assessment once one is ready for you.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Goals</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Score</th>
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
                    No appraisals yet.
                  </td>
                </tr>
              ) : (
                appraisals.map((a) => (
                  <tr key={a._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.reviewPeriod}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <ul className="list-disc list-inside space-y-0.5">
                        {a.kpis?.map((k, i) => <li key={i}>{k.goal} <span className="text-gray-400">({k.weightage}%)</span></li>)}
                      </ul>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{a.overallScore ?? "—"} / 5</td>
                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={a.status} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {a.status === "Pending Employee Review" && (
                        <button
                          onClick={() => openAssessmentModal(a)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <ClipboardEdit size={14} /> Self-Assess
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

      {selectedAppraisal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Self-Assessment — {selectedAppraisal.reviewPeriod}</h3>
              <button onClick={closeAssessmentModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Your Goals</p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
                  {selectedAppraisal.kpis?.map((k, i) => <li key={i}>{k.goal} ({k.weightage}%)</li>)}
                </ul>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Self-Assessment *</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows="5"
                  placeholder="Describe your progress against each goal this period..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 pt-0">
              <button onClick={closeAssessmentModal} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Self-Assessment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAppraisalsView;
