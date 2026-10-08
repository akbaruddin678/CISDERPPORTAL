import React from "react";
import { Search, RefreshCw, Eye, X, Printer } from "lucide-react";

const StudentDirectoryView = ({
  students = [],
  isLoading,
  searchQuery,
  setSearchQuery,
  refetch,
  page,
  setPage,
  pagination = { page: 1, pages: 1, total: 0 },

  selectedStudent,
  isFetchingDetails,
  isModalOpen,
  handleViewStudent,
  handleCloseModal,

  printDirectory,
  printStudentDetail,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Master Directory</h1>
            <p className="text-sm text-slate-500 mt-1">{pagination.total} student record(s).</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by registration ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-sm"
              />
            </div>
            <button onClick={printDirectory} className="p-2.5 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-lg border border-violet-200 transition-colors" title="Print Directory">
              <Printer size={18} />
            </button>
            <button onClick={refetch} disabled={isLoading} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border border-slate-200 disabled:opacity-50" title="Refresh">
              <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-semibold">Student</th>
                  <th className="px-6 py-4 font-semibold">Registration ID</th>
                  <th className="px-6 py-4 font-semibold">Program</th>
                  <th className="px-6 py-4 font-semibold">Section</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">Loading student records...</td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">No students found.</td></tr>
                ) : (
                  students.map((student) => (
                    <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold">
                            {student.personalInfo?.fullName?.charAt(0) || "?"}
                          </div>
                          <span className="font-medium text-slate-900">{student.personalInfo?.fullName || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">{student.studentId}</td>
                      <td className="px-6 py-4 text-slate-600">{student.program?.name || "N/A"}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {student.semester?.number ? `Section ${student.semester.number}` : "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            student.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : student.status === "graduated"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleViewStudent(student)}
                          className="text-slate-400 hover:text-violet-600 transition-colors p-1.5 rounded-md hover:bg-violet-50"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center px-6 py-3 border-t border-slate-200 text-sm text-slate-500">
            <span>Page {pagination.page} of {pagination.pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 border border-slate-300 rounded-md disabled:opacity-40">
                Previous
              </button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.pages} className="px-3 py-1.5 border border-slate-300 rounded-md disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Student Record</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printStudentDetail(selectedStudent)}
                  className="p-2 hover:bg-violet-50 text-violet-600 rounded-lg transition-colors"
                  title="Print"
                >
                  <Printer size={18} />
                </button>
                <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X size={18} className="text-slate-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {isFetchingDetails ? (
                <p className="text-center text-slate-500 py-6">Loading...</p>
              ) : selectedStudent ? (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ["Registration ID", selectedStudent.studentId],
                    ["Name", selectedStudent.personalInfo?.fullName],
                    ["Email", selectedStudent.personalInfo?.email],
                    ["Phone", selectedStudent.personalInfo?.phone],
                    ["Department", selectedStudent.department?.name],
                    ["Program", selectedStudent.program?.name],
                    ["Section", selectedStudent.semester?.number ? `Section ${selectedStudent.semester.number}` : "N/A"],
                    ["Session", selectedStudent.session?.name],
                    ["Status", selectedStudent.status],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500">{k}</p>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">{v || "N/A"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-6">No details found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDirectoryView;
