import React from "react";
import { Search, RefreshCw, ChevronDown, FileText, CheckCircle, Clock, AlertTriangle, Upload, X, Plus, Paperclip } from "lucide-react";

const StatusBadge = ({ status }) => {
  const s = { Submitted: "bg-emerald-100 text-emerald-700", Pending: "bg-amber-100 text-amber-700", Draft: "bg-slate-100 text-slate-600", Late: "bg-rose-100 text-rose-700" };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s[status] ?? "bg-slate-100 text-slate-600"}`}>{status}</span>;
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}><Icon size={20} className="text-white" /></div>
    <div><p className="text-xs text-slate-500 font-medium">{label}</p><p className="text-2xl font-bold text-slate-900">{value}</p></div>
  </div>
);

const SubmitReportModal = ({ report, onClose, submitFile, setSubmitFile, handleMarkSubmitted, isSubmitting }) => {
  if (!report) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Submit Report</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-600">{report.title}</p>
          <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-lg p-3 cursor-pointer hover:bg-slate-50">
            <Paperclip size={16} className="text-slate-400" />
            <span className="text-sm text-slate-500">{submitFile ? submitFile.name : "Attach file (optional)"}</span>
            <input type="file" className="hidden" onChange={(e) => setSubmitFile(e.target.files?.[0] || null)} />
          </label>
          <button onClick={handleMarkSubmitted} disabled={isSubmitting}
            className="w-full py-2.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors font-medium disabled:opacity-50">
            {isSubmitting ? "Submitting..." : "Mark As Submitted"}
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateReportModal = ({ onClose, createForm, setCreateForm, handleCreateReport, isCreating }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">New Compliance Report</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-500" /></button>
      </div>
      <div className="p-6 space-y-3">
        <div>
          <label className="text-xs text-slate-500 font-medium">Title</label>
          <input type="text" value={createForm.title} onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 font-medium">Category</label>
            <input type="text" placeholder="e.g. Enrollment" value={createForm.category} onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium">Authority</label>
            <input type="text" placeholder="e.g. HEC" value={createForm.authority} onChange={(e) => setCreateForm((f) => ({ ...f, authority: e.target.value }))}
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none" />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 font-medium">Due Date</label>
          <input type="date" value={createForm.dueDate} onChange={(e) => setCreateForm((f) => ({ ...f, dueDate: e.target.value }))}
            className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none" />
        </div>
        <button onClick={handleCreateReport} disabled={isCreating}
          className="w-full py-2.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors font-medium disabled:opacity-50 mt-2">
          {isCreating ? "Creating..." : "Create Report"}
        </button>
      </div>
    </div>
  </div>
);

const ComplianceReportingView = ({
  reports, isLoading, error, searchQuery, setSearchQuery, statusFilter, setStatusFilter,
  categoryFilter, setCategoryFilter, categories, stats, refetch,
  submitTarget, submitFile, setSubmitFile, openSubmitModal, closeSubmitModal, handleMarkSubmitted, isSubmitting,
  isCreateOpen, openCreateModal, closeCreateModal, createForm, setCreateForm, handleCreateReport, isCreating,
}) => (
  <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Compliance Reporting</h1>
          <p className="text-sm text-slate-500 mt-1">Track regulatory report submissions to HEC, PEC, FBR, and other authorities.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-60">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search reports..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-sm" />
          </div>
          {[
            { value: statusFilter,   onChange: setStatusFilter,   options: ["All", "Submitted", "Pending", "Draft", "Late"] },
            { value: categoryFilter, onChange: setCategoryFilter, options: categories },
          ].map(({ value, onChange, options }, i) => (
            <div key={i} className="relative">
              <select value={value} onChange={(e) => onChange(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white cursor-pointer">
                {options.map((o) => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          ))}
          <button onClick={refetch} disabled={isLoading} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 disabled:opacity-50">
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button onClick={openCreateModal} className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> New Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText}     label="Total Reports"  value={stats.total}     color="bg-violet-500" />
        <StatCard icon={CheckCircle}  label="Submitted"      value={stats.submitted} color="bg-emerald-500" />
        <StatCard icon={Clock}        label="Pending"        value={stats.pending}   color="bg-amber-500" />
        <StatCard icon={AlertTriangle} label="Overdue"       value={stats.overdue}   color="bg-rose-500" />
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md"><p className="text-red-700 text-sm">{error}</p></div>}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Report</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Authority</th>
                <th className="px-6 py-4 font-semibold">Due Date</th>
                <th className="px-6 py-4 font-semibold">Submitted</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Loading reports...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">No reports found.</td></tr>
              ) : reports.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900 max-w-[220px] whitespace-normal">{r.title}</p>
                    {r.fileUrl && (
                      <a href={r.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-violet-600 hover:underline">View file</a>
                    )}
                  </td>
                  <td className="px-6 py-4"><span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded text-xs font-medium">{r.category}</span></td>
                  <td className="px-6 py-4 font-medium text-slate-700">{r.authority}</td>
                  <td className="px-6 py-4 text-slate-600">{new Date(r.dueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-slate-600">{r.submittedDate ? new Date(r.submittedDate).toLocaleDateString() : "—"}</td>
                  <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                  <td className="px-6 py-4 text-right">
                    {r.status !== "Submitted" && (
                      <button onClick={() => openSubmitModal(r)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs rounded-lg hover:bg-violet-700 transition-colors font-medium ml-auto">
                        <Upload size={12} /> Submit
                      </button>
                    )}
                    {r.status === "Submitted" && <span className="text-xs text-slate-400">Submitted</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {submitTarget && (
      <SubmitReportModal
        report={submitTarget} onClose={closeSubmitModal} submitFile={submitFile}
        setSubmitFile={setSubmitFile} handleMarkSubmitted={handleMarkSubmitted} isSubmitting={isSubmitting}
      />
    )}
    {isCreateOpen && (
      <CreateReportModal
        onClose={closeCreateModal} createForm={createForm} setCreateForm={setCreateForm}
        handleCreateReport={handleCreateReport} isCreating={isCreating}
      />
    )}
  </div>
);

export default ComplianceReportingView;
