import React from "react";
import {
  Search, X, GraduationCap, Loader2, ClipboardList, Clock3, CheckCircle2, Undo2, UserX, Eye,
} from "lucide-react";

const STATUS_META = {
  PENDING_HOD: { label: "Pending HOD", className: "bg-indigo-100 text-indigo-700" },
  PENDING_ACADEMIA: { label: "Pending Academia", className: "bg-amber-100 text-amber-700" },
  PENDING_VC: { label: "Pending VC", className: "bg-orange-100 text-orange-700" },
  APPROVED: { label: "Officially Declared", className: "bg-emerald-100 text-emerald-700" },
  RETURNED: { label: "Returned", className: "bg-red-100 text-red-700" },
};

const StatusPill = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, className: "bg-slate-100 text-slate-500" };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${meta.className}`}>
      {meta.label}
    </span>
  );
};

const StatCard = (props) => {
  const Icon = props.icon;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${props.className}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{props.label}</p>
        <p className="text-2xl font-bold text-slate-900">{props.value}</p>
      </div>
    </div>
  );
};

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "TBD";

const ExamResultsRegisterView = ({
  submissions = [],
  totalSubmissions = 0,
  isFetching = false,
  statistics = { total: 0, declared: 0, inProgress: 0, returned: 0 },
  availableSemesters = [],

  selectedStatus,
  setSelectedStatus,
  selectedSemester,
  setSelectedSemester,
  searchTerm,
  setSearchTerm,

  selectedSubmission,
  rosterStudents = [],
  rosterExam,
  isFetchingRoster = false,
  isDetailsOpen,
  openDetails,
  closeDetails,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Exam Results Register</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Read-only record of exam results across the university, by approval stage.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={ClipboardList} label="Total Submissions" value={statistics.total} className="bg-blue-600" />
          <StatCard icon={CheckCircle2} label="Officially Declared" value={statistics.declared} className="bg-emerald-600" />
          <StatCard icon={Clock3} label="In Progress" value={statistics.inProgress} className="bg-amber-600" />
          <StatCard icon={Undo2} label="Returned" value={statistics.returned} className="bg-red-600" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by course, teacher, or exam type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING_HOD">Pending HOD</option>
            <option value="PENDING_ACADEMIA">Pending Academia</option>
            <option value="PENDING_VC">Pending VC</option>
            <option value="APPROVED">Officially Declared</option>
            <option value="RETURNED">Returned</option>
          </select>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All Sections</option>
            {availableSemesters.map((n) => (
              <option key={n} value={n}>Semester {n}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {isFetching ? (
            <div className="p-16 text-center">
              <Loader2 size={28} className="animate-spin mx-auto text-indigo-500" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-16 text-center text-slate-400">
              <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">
                {totalSubmissions === 0
                  ? "No exam results recorded yet."
                  : "No results match the current filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                    <th className="p-4 font-bold">Course</th>
                    <th className="p-4 font-bold">Teacher</th>
                    <th className="p-4 font-bold">Session / Section</th>
                    <th className="p-4 font-bold">Exam</th>
                    <th className="p-4 font-bold">Marks</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{s.courseTitle}</p>
                        <p className="text-xs font-semibold text-emerald-600">
                          {s.courseCode}{s.section ? ` · Sec ${s.section}` : ""}
                        </p>
                      </td>
                      <td className="p-4 text-sm font-semibold text-slate-700">{s.teacherName}</td>
                      <td className="p-4">
                        <p className="text-sm font-semibold text-slate-600">{s.termName}</p>
                        <p className="text-xs text-slate-400">Semester {s.semesterNumber ?? "?"}</p>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
                          {s.exam?.type || "Exam"}
                        </span>
                        <p className="text-xs text-slate-400 mt-1">{formatDate(s.exam?.date)}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-semibold text-slate-700">{s.exam?.totalMarks} marks</p>
                        <p className="text-xs text-slate-400">{s.exam?.weightage}% weightage</p>
                      </td>
                      <td className="p-4"><StatusPill status={s.status} /></td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openDetails(s)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600 text-xs font-bold transition-colors"
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail modal — read-only */}
      {isDetailsOpen && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedSubmission.courseTitle} — {selectedSubmission.exam?.type}
                </h2>
                <p className="text-sm text-slate-500">
                  {selectedSubmission.courseCode} · {selectedSubmission.teacherName} · {selectedSubmission.termName}, Semester {selectedSubmission.semesterNumber}
                </p>
              </div>
              <button onClick={closeDetails} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                <span className="text-sm font-medium text-slate-700">Status</span>
                <StatusPill status={selectedSubmission.status} />
              </div>

              {selectedSubmission.status === "RETURNED" && selectedSubmission.hodRemarks && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <span className="font-bold">Remarks:</span> {selectedSubmission.hodRemarks}
                </div>
              )}

              {isFetchingRoster ? (
                <div className="py-10 text-center">
                  <Loader2 size={24} className="animate-spin mx-auto text-indigo-500" />
                </div>
              ) : rosterStudents.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No students found for this course.</p>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider">
                        <th className="p-3 font-bold">Roll No.</th>
                        <th className="p-3 font-bold">Student</th>
                        <th className="p-3 font-bold text-center">
                          Marks / {rosterExam?.totalMarks ?? selectedSubmission.exam?.totalMarks}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rosterStudents.map((st) => (
                        <tr key={st.studentId}>
                          <td className="p-3 text-sm text-slate-600">{st.rollNo}</td>
                          <td className="p-3 text-sm font-semibold text-slate-800">{st.name}</td>
                          <td className="p-3 text-center">
                            {st.isAbsent ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                                <UserX size={11} /> Absent
                              </span>
                            ) : (
                              <span className="text-sm font-bold text-slate-800">{st.obtainedMarks ?? "—"}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={closeDetails}
                className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamResultsRegisterView;
