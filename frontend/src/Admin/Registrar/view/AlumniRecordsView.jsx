import React from "react";
import { Search, RefreshCw, ChevronDown, GraduationCap, Briefcase, BookOpen, Users, X, Plus } from "lucide-react";

const StatusBadge = ({ status }) => {
  const s = { Employed: "bg-emerald-100 text-emerald-700", "Higher Ed": "bg-blue-100 text-blue-700", Seeking: "bg-amber-100 text-amber-700" };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s[status] ?? "bg-slate-100 text-slate-600"}`}>{status}</span>;
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}><Icon size={20} className="text-white" /></div>
    <div><p className="text-xs text-slate-500 font-medium">{label}</p><p className="text-2xl font-bold text-slate-900">{value}</p></div>
  </div>
);

const EditAlumnusModal = ({ alumnus, onClose, editForm, setEditForm, handleSaveEdit, isUpdating }) => {
  if (!alumnus) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{alumnus.name}</h2>
            <p className="text-sm text-slate-500">{alumnus.regId} · Class of {alumnus.gradYear}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 font-medium">Employer</label>
              <input type="text" value={editForm.employer} onChange={(e) => setEditForm((f) => ({ ...f, employer: e.target.value }))}
                className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Designation</label>
              <input type="text" value={editForm.designation} onChange={(e) => setEditForm((f) => ({ ...f, designation: e.target.value }))}
                className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium">Contact Email</label>
            <input type="email" value={editForm.contactEmail} onChange={(e) => setEditForm((f) => ({ ...f, contactEmail: e.target.value }))}
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium">Contact Phone</label>
            <input type="text" value={editForm.contactPhone} onChange={(e) => setEditForm((f) => ({ ...f, contactPhone: e.target.value }))}
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium">Status</label>
            <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white">
              {["Employed", "Seeking", "Higher Ed"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <button onClick={handleSaveEdit} disabled={isUpdating}
            className="w-full py-2.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors font-medium disabled:opacity-50 mt-2">
            {isUpdating ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateAlumnusModal = ({
  onClose, studentSearch, setStudentSearch, studentResults, isSearchingStudents,
  selectedStudent, selectStudent, createForm, setCreateForm, handleCreateProfile, isCreating,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">New Alumni Record</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-500" /></button>
      </div>
      <div className="p-6 space-y-3">
        <div>
          <label className="text-xs text-slate-500 font-medium">Graduated Student</label>
          {selectedStudent ? (
            <div className="mt-1 flex items-center justify-between bg-violet-50 border border-violet-200 rounded-lg p-2.5">
              <span className="text-sm font-medium text-violet-800">
                {selectedStudent.personalInfo?.fullName || "Unknown"} ({selectedStudent.studentId})
              </span>
            </div>
          ) : (
            <div className="relative mt-1">
              <input
                type="text" placeholder="Search by student ID (graduated only)..."
                value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
              />
              {studentSearch && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {isSearchingStudents ? (
                    <p className="p-3 text-xs text-slate-400">Searching...</p>
                  ) : studentResults.length === 0 ? (
                    <p className="p-3 text-xs text-slate-400">No graduated students found.</p>
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
          <label className="text-xs text-slate-500 font-medium">Graduation Year</label>
          <input type="number" value={createForm.graduationYear} onChange={(e) => setCreateForm((f) => ({ ...f, graduationYear: Number(e.target.value) }))}
            className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 font-medium">Employer</label>
            <input type="text" value={createForm.employer} onChange={(e) => setCreateForm((f) => ({ ...f, employer: e.target.value }))}
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium">Designation</label>
            <input type="text" value={createForm.designation} onChange={(e) => setCreateForm((f) => ({ ...f, designation: e.target.value }))}
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none" />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 font-medium">Status</label>
          <select value={createForm.status} onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}
            className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white">
            {["Employed", "Seeking", "Higher Ed"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <button onClick={handleCreateProfile} disabled={isCreating}
          className="w-full py-2.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors font-medium disabled:opacity-50 mt-2">
          {isCreating ? "Creating..." : "Create Record"}
        </button>
      </div>
    </div>
  </div>
);

const AlumniRecordsView = ({
  alumni, isLoading, error, searchQuery, setSearchQuery, yearFilter, setYearFilter,
  statusFilter, setStatusFilter, years, stats, refetch,
  selectedAlumnus, isModalOpen, handleViewAlumnus, handleCloseModal, editForm, setEditForm, handleSaveEdit, isUpdating,
  isCreateOpen, openCreateModal, closeCreateModal, studentSearch, setStudentSearch, studentResults,
  isSearchingStudents, selectedStudent, selectStudent, createForm, setCreateForm, handleCreateProfile, isCreating,
}) => (
  <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Alumni Records</h1>
          <p className="text-sm text-slate-500 mt-1">Maintain the university's alumni database and track career outcomes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-60">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search alumni..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-sm" />
          </div>
          {[
            { value: yearFilter, onChange: setYearFilter, options: years },
            { value: statusFilter, onChange: setStatusFilter, options: ["All", "Employed", "Higher Ed", "Seeking"] },
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
            <Plus size={16} /> New Record
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={GraduationCap} label="Total Alumni"   value={stats.total}    color="bg-violet-500" />
        <StatCard icon={Briefcase}     label="Employed"       value={stats.employed} color="bg-emerald-500" />
        <StatCard icon={BookOpen}      label="Higher Studies" value={stats.higherEd} color="bg-blue-500" />
        <StatCard icon={Users}         label="Seeking"        value={stats.seeking}  color="bg-amber-500" />
      </div>

      {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md"><p className="text-red-700 text-sm">{error}</p></div>}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Alumni</th>
                <th className="px-6 py-4 font-semibold">Program</th>
                <th className="px-6 py-4 font-semibold">Year</th>
                <th className="px-6 py-4 font-semibold">Employer</th>
                <th className="px-6 py-4 font-semibold">Designation</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Loading alumni records...</td></tr>
              ) : alumni.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">No alumni records found.</td></tr>
              ) : alumni.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">{a.name.charAt(0)}</div>
                      <div><p className="font-medium text-slate-900">{a.name}</p><p className="text-xs text-slate-400">{a.regId}</p></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 max-w-[160px] truncate">{a.program}</td>
                  <td className="px-6 py-4 text-slate-600">{a.gradYear}</td>
                  <td className="px-6 py-4 text-slate-600">{a.employer}</td>
                  <td className="px-6 py-4 text-slate-600">{a.designation}</td>
                  <td className="px-6 py-4"><StatusBadge status={a.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleViewAlumnus(a)} className="text-slate-400 hover:text-violet-600 p-1 rounded-md hover:bg-violet-50 text-xs font-medium transition-colors">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {isModalOpen && (
      <EditAlumnusModal
        alumnus={selectedAlumnus} onClose={handleCloseModal} editForm={editForm}
        setEditForm={setEditForm} handleSaveEdit={handleSaveEdit} isUpdating={isUpdating}
      />
    )}
    {isCreateOpen && (
      <CreateAlumnusModal
        onClose={closeCreateModal} studentSearch={studentSearch} setStudentSearch={setStudentSearch}
        studentResults={studentResults} isSearchingStudents={isSearchingStudents}
        selectedStudent={selectedStudent} selectStudent={selectStudent}
        createForm={createForm} setCreateForm={setCreateForm}
        handleCreateProfile={handleCreateProfile} isCreating={isCreating}
      />
    )}
  </div>
);

export default AlumniRecordsView;
