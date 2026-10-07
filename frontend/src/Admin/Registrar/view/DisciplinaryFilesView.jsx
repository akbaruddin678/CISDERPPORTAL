import React from "react";
import { Search, RefreshCw, ChevronDown, ShieldAlert, X, AlertTriangle, Plus } from "lucide-react";

const SeverityBadge = ({ sev }) => {
  const s = { Critical: "bg-rose-200 text-rose-800", High: "bg-rose-100 text-rose-700", Medium: "bg-amber-100 text-amber-700", Low: "bg-slate-100 text-slate-600" };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s[sev] ?? "bg-slate-100 text-slate-600"}`}>{sev}</span>;
};

const StatusBadge = ({ status }) => {
  const s = { "Under Review": "bg-blue-100 text-blue-700", "Action Taken": "bg-amber-100 text-amber-700", Resolved: "bg-emerald-100 text-emerald-700", Suspended: "bg-rose-100 text-rose-700" };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s[status] ?? "bg-slate-100 text-slate-600"}`}>{status}</span>;
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}><Icon size={20} className="text-white" /></div>
    <div><p className="text-xs text-slate-500 font-medium">{label}</p><p className="text-2xl font-bold text-slate-900">{value}</p></div>
  </div>
);

const DisciplinaryModal = ({ file, onClose, onTakeAction, onResolve, onSuspend, actionNote, setActionNote, isUpdating }) => {
  if (!file) return null;
  const studentName = file.studentId?.personalInfo?.fullName || "Unknown";
  const regId = file.studentId?.studentId || "—";
  const program = file.studentId?.programId?.name || "—";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Disciplinary File</h2>
            <p className="text-sm text-slate-500">{studentName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Student", studentName],
              ["Reg ID", regId],
              ["Program", program],
              ["Date", file.incidentDate ? new Date(file.incidentDate).toLocaleDateString() : "—"],
              ["Reported By", file.reportedBy],
              ["Session", file.termId?.name || "—"],
            ].map(([k, v]) => (
              <div key={k} className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">{k}</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5 break-words">{v}</p>
              </div>
            ))}
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
            <p className="text-xs text-rose-500 mb-1">Incident</p>
            <p className="text-sm font-medium text-rose-800">{file.incident}</p>
          </div>
          {file.action && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-600 mb-1">Action Taken</p>
              <p className="text-sm text-amber-900">{file.action}</p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <SeverityBadge sev={file.severity} />
            <StatusBadge status={file.status} />
          </div>
          {file.status !== "Resolved" && file.status !== "Suspended" && (
            <div className="space-y-2 pt-2">
              <textarea
                placeholder="Enter action taken or resolution note..."
                value={actionNote} onChange={(e) => setActionNote(e.target.value)}
                rows={3}
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none"
              />
              <div className="flex gap-2">
                <button onClick={() => onTakeAction(file._id)} disabled={!actionNote.trim() || isUpdating}
                  className="flex-1 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors font-medium disabled:opacity-40">
                  Record Action
                </button>
                <button onClick={() => onResolve(file._id)} disabled={isUpdating} className="flex-1 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-40">
                  Mark Resolved
                </button>
              </div>
              <button onClick={() => onSuspend(file._id)} disabled={isUpdating} className="w-full py-2 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 transition-colors font-medium disabled:opacity-40">
                Suspend Student
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CreateFileModal = ({
  onClose, form, setForm, studentSearch, setStudentSearch, studentResults,
  isSearchingStudents, selectStudent, handleCreateFile, isCreating,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">New Disciplinary File</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-500" /></button>
      </div>
      <div className="p-6 space-y-3">
        <div>
          <label className="text-xs text-slate-500 font-medium">Student</label>
          {form.studentLabel ? (
            <div className="mt-1 flex items-center justify-between bg-violet-50 border border-violet-200 rounded-lg p-2.5">
              <span className="text-sm font-medium text-violet-800">{form.studentLabel}</span>
              <button onClick={() => setForm((f) => ({ ...f, studentId: "", studentLabel: "" }))} className="text-violet-500 hover:text-violet-700">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="relative mt-1">
              <input
                type="text" placeholder="Search by student ID..."
                value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
              />
              {studentSearch && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {isSearchingStudents ? (
                    <p className="p-3 text-xs text-slate-400">Searching...</p>
                  ) : studentResults.length === 0 ? (
                    <p className="p-3 text-xs text-slate-400">No students found.</p>
                  ) : studentResults.map((s) => (
                    <button key={s._id} onClick={() => selectStudent(s)} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm">
                      <p className="font-medium text-slate-900">{s.personalInfo?.fullName || "Unknown"}</p>
                      <p className="text-xs text-slate-400">{s.studentId}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          <label className="text-xs text-slate-500 font-medium">Incident</label>
          <textarea rows={2} value={form.incident} onChange={(e) => setForm((f) => ({ ...f, incident: e.target.value }))}
            className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 font-medium">Incident Date</label>
            <input type="date" value={form.incidentDate} onChange={(e) => setForm((f) => ({ ...f, incidentDate: e.target.value }))}
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium">Severity</label>
            <select value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white">
              {["Low", "Medium", "High", "Critical"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 font-medium">Reported By</label>
          <input type="text" value={form.reportedBy} onChange={(e) => setForm((f) => ({ ...f, reportedBy: e.target.value }))}
            className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none" />
        </div>
        <button onClick={handleCreateFile} disabled={isCreating}
          className="w-full py-2.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors font-medium disabled:opacity-50 mt-2">
          {isCreating ? "Creating..." : "Create File"}
        </button>
      </div>
    </div>
  </div>
);

const DisciplinaryFilesView = ({
  files, isLoading, error, searchQuery, setSearchQuery, statusFilter, setStatusFilter,
  severityFilter, setSeverityFilter, selectedFile, isModalOpen, actionNote, setActionNote,
  stats, refetch, handleViewFile, handleCloseModal, handleTakeAction, handleResolve, handleSuspend, isUpdating,
  isCreateOpen, openCreateModal, closeCreateModal, form, setForm, studentSearch, setStudentSearch,
  studentResults, isSearchingStudents, selectStudent, handleCreateFile, isCreating,
}) => (
  <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Disciplinary Files</h1>
          <p className="text-sm text-slate-500 mt-1">Review and manage all student disciplinary records and actions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-60">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search by student or incident..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-sm" />
          </div>
          {[
            { value: statusFilter,   onChange: setStatusFilter,   options: ["All", "Under Review", "Action Taken", "Resolved", "Suspended"] },
            { value: severityFilter, onChange: setSeverityFilter, options: ["All", "Critical", "High", "Medium", "Low"] },
          ].map(({ value, onChange, options }, i) => (
            <div key={i} className="relative">
              <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none pl-3 pr-7 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white cursor-pointer">
                {options.map((o) => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          ))}
          <button onClick={refetch} disabled={isLoading} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 disabled:opacity-50">
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button onClick={openCreateModal} className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> New File
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShieldAlert}   label="Total Cases"   value={stats.total}       color="bg-violet-500" />
        <StatCard icon={AlertTriangle} label="Under Review"  value={stats.underReview} color="bg-blue-500" />
        <StatCard icon={ShieldAlert}   label="Critical"      value={stats.critical}    color="bg-rose-500" />
        <StatCard icon={ShieldAlert}   label="Resolved"      value={stats.resolved}    color="bg-emerald-500" />
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md"><p className="text-red-700 text-sm">{error}</p></div>}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Student</th>
                <th className="px-6 py-4 font-semibold">Incident</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Reported By</th>
                <th className="px-6 py-4 font-semibold">Severity</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Loading files...</td></tr>
              ) : files.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">No disciplinary files found.</td></tr>
              ) : files.map((f) => (
                <tr key={f._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{f.studentId?.personalInfo?.fullName || "Unknown"}</p>
                    <p className="text-xs text-slate-400">{f.studentId?.studentId}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-700 max-w-[200px] truncate">{f.incident}</td>
                  <td className="px-6 py-4 text-slate-600">{f.incidentDate ? new Date(f.incidentDate).toLocaleDateString() : "—"}</td>
                  <td className="px-6 py-4 text-slate-600 max-w-[140px] truncate">{f.reportedBy}</td>
                  <td className="px-6 py-4"><SeverityBadge sev={f.severity} /></td>
                  <td className="px-6 py-4"><StatusBadge status={f.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleViewFile(f)} className="text-slate-400 hover:text-violet-600 p-1 rounded-md hover:bg-violet-50 text-xs font-medium transition-colors">Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    {isModalOpen && (
      <DisciplinaryModal
        file={selectedFile} onClose={handleCloseModal} onTakeAction={handleTakeAction}
        onResolve={handleResolve} onSuspend={handleSuspend} actionNote={actionNote}
        setActionNote={setActionNote} isUpdating={isUpdating}
      />
    )}
    {isCreateOpen && (
      <CreateFileModal
        onClose={closeCreateModal} form={form} setForm={setForm}
        studentSearch={studentSearch} setStudentSearch={setStudentSearch}
        studentResults={studentResults} isSearchingStudents={isSearchingStudents}
        selectStudent={selectStudent} handleCreateFile={handleCreateFile} isCreating={isCreating}
      />
    )}
  </div>
);

export default DisciplinaryFilesView;
