import React from "react";
import { Plus, X, Briefcase, ArrowLeft, Users, UserPlus } from "lucide-react";

const POSTING_STATUS_META = {
  Draft: "bg-gray-100 text-gray-700",
  Published: "bg-green-100 text-green-800",
  Closed: "bg-red-100 text-red-800",
};

const APPLICATION_STATUSES = [
  "Applied",
  "Shortlisted",
  "Interview Scheduled",
  "Offered",
  "Hired",
  "Rejected",
];

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "");

const HrRecruitmentView = ({
  departments = [],
  postings = [],
  isFetchingPostings,
  selectedPosting,
  setSelectedPostingId,
  applications = [],
  isFetchingApplications,

  showPostingModal,
  openPostingModal,
  closePostingModal,
  postingForm,
  handlePostingFormChange,
  handleCreatePosting,
  isCreatingPosting,
  handleTogglePublish,

  showApplicationModal,
  openApplicationModal,
  closeApplicationModal,
  applicationForm,
  handleApplicationFormChange,
  handleAddApplication,
  isAddingApplication,
  handleApplicationStatusChange,
  handleStartOnboarding,
}) => {
  if (selectedPosting) {
    return (
      <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-6">
          <button onClick={() => setSelectedPostingId(null)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
            <ArrowLeft size={16} /> Back to Postings
          </button>

          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{selectedPosting.title}</h1>
              <p className="text-gray-600 mt-1">{selectedPosting.employmentType} · {selectedPosting.departmentId?.name || "N/A"}</p>
            </div>
            <button
              onClick={openApplicationModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} /> Record Application
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resume</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isFetchingApplications ? (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                  ) : applications.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                        <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        No applications recorded yet.
                      </td>
                    </tr>
                  ) : (
                    applications.map((a) => (
                      <tr key={a._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.applicantName}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{a.email}<div className="text-xs text-gray-400">{a.phone}</div></td>
                        <td className="px-6 py-4 text-sm">
                          <a href={a.resumeUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={a.status}
                            onChange={(e) => handleApplicationStatusChange(a, e.target.value)}
                            className="px-2 py-1 text-xs font-medium rounded-md border border-gray-300"
                          >
                            {APPLICATION_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {a.status === "Hired" && (
                            <button
                              onClick={() => handleStartOnboarding(a)}
                              className="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-medium"
                            >
                              <UserPlus size={14} /> Start Onboarding
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

        {showApplicationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Record Application</h3>
                <button onClick={closeApplicationModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddApplication} className="p-6 space-y-4">
                <input type="text" placeholder="Applicant name *" value={applicationForm.applicantName} onChange={(e) => handleApplicationFormChange("applicantName", e.target.value)} required className="w-full p-2 border rounded-md" />
                <input type="email" placeholder="Email *" value={applicationForm.email} onChange={(e) => handleApplicationFormChange("email", e.target.value)} required className="w-full p-2 border rounded-md" />
                <input type="text" placeholder="Phone *" value={applicationForm.phone} onChange={(e) => handleApplicationFormChange("phone", e.target.value)} required className="w-full p-2 border rounded-md" />
                <input type="text" placeholder="Resume URL *" value={applicationForm.resumeUrl} onChange={(e) => handleApplicationFormChange("resumeUrl", e.target.value)} required className="w-full p-2 border rounded-md" />
                <textarea placeholder="Cover letter (optional)" value={applicationForm.coverLetter} onChange={(e) => handleApplicationFormChange("coverLetter", e.target.value)} rows="3" className="w-full p-2 border rounded-md" />
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeApplicationModal} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                  <button type="submit" disabled={isAddingApplication} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                    {isAddingApplication ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Recruitment</h1>
            <p className="text-gray-600 mt-1">Manage job postings and track applicants.</p>
          </div>
          <button
            onClick={openPostingModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} /> New Posting
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isFetchingPostings ? (
            <p className="text-gray-500 col-span-full text-center py-8">Loading...</p>
          ) : postings.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow p-12 text-center text-gray-500">
              <Briefcase className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              No job postings yet.
            </div>
          ) : (
            postings.map((p) => (
              <div key={p._id} className="bg-white rounded-lg shadow p-5 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-slate-800">{p.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${POSTING_STATUS_META[p.status]}`}>{p.status}</span>
                </div>
                <p className="text-sm text-gray-500">{p.departmentId?.name || "N/A"} · {p.employmentType}</p>
                <p className="text-xs text-gray-400">Deadline: {formatDate(p.applicationDeadline)}</p>
                <p className="text-sm text-gray-700">{p.applicationCount} application(s)</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setSelectedPostingId(p._id)} className="flex-1 text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded-md py-1.5">
                    View Applications
                  </button>
                  <button onClick={() => handleTogglePublish(p)} className="flex-1 text-sm text-gray-600 hover:text-gray-800 font-medium border border-gray-200 rounded-md py-1.5">
                    {p.status === "Published" ? "Close" : "Publish"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showPostingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">New Job Posting</h3>
              <button onClick={closePostingModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreatePosting} className="p-6 space-y-4">
              <input type="text" placeholder="Job title *" value={postingForm.title} onChange={(e) => handlePostingFormChange("title", e.target.value)} required className="w-full p-2 border rounded-md" />
              <div className="grid grid-cols-2 gap-4">
                <select value={postingForm.departmentId} onChange={(e) => handlePostingFormChange("departmentId", e.target.value)} className="w-full p-2 border rounded-md">
                  <option value="">Select department</option>
                  {departments.map((d) => (<option key={d._id} value={d._id}>{d.name}</option>))}
                </select>
                <select value={postingForm.employmentType} onChange={(e) => handlePostingFormChange("employmentType", e.target.value)} className="w-full p-2 border rounded-md">
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Visiting">Visiting</option>
                </select>
              </div>
              <textarea placeholder="Description *" value={postingForm.description} onChange={(e) => handlePostingFormChange("description", e.target.value)} required rows="3" className="w-full p-2 border rounded-md" />
              <textarea placeholder="Requirements (one per line)" value={postingForm.requirements} onChange={(e) => handlePostingFormChange("requirements", e.target.value)} rows="3" className="w-full p-2 border rounded-md" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline *</label>
                <input type="date" value={postingForm.applicationDeadline} onChange={(e) => handlePostingFormChange("applicationDeadline", e.target.value)} required className="w-full p-2 border rounded-md" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closePostingModal} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={isCreatingPosting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {isCreatingPosting ? "Creating..." : "Create Posting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrRecruitmentView;
