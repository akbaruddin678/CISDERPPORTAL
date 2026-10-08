import React from "react";
import { Search, RefreshCw, ChevronDown, X, AlertTriangle, FileText, LogOut, UserMinus } from "lucide-react";

const TypeBadge = ({ type }) => (
  <span className={`px-2 py-0.5 rounded text-xs font-medium ${type === "Drop" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
    {type}
  </span>
);

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

const WithdrawalDetailModal = ({ record, onClose }) => {
  if (!record) return null;
  const reg = record.studentCourseRegistrationId;
  const rows = [
    ["Student", reg?.studentId?.personalInfo?.fullName || "Unknown"],
    ["Reg ID", reg?.studentId?.studentId || "—"],
    ["Course", reg?.courseId?.title || "—"],
    ["Code", reg?.courseId?.code || "—"],
    ["Type", record.withdrawalType],
    ["Decided By", record.decidedBy?.personalInfo?.fullName || "—"],
    ["Decided On", record.decidedAt ? new Date(record.decidedAt).toLocaleDateString() : "—"],
    ["Section", reg?.semesterId?.number ? `Section ${reg.semesterId.number}` : "—"],
    ["Session", reg?.termId?.name || "—"],
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Withdrawal Record</h2>
            <p className="text-sm text-slate-500">Processed by Head of Department</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} className="text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {rows.map(([k, v]) => (
              <div key={k} className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">{k}</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5 break-words">{v}</p>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">Reason</p>
            <p className="text-sm text-slate-700 italic">"{record.reason}"</p>
          </div>
          {record.withdrawalType === "Withdrawal" && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">A 'W' grade is permanently recorded on the student's transcript.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CourseWithdrawalsView = ({
  withdrawals, isLoading, error, searchQuery, setSearchQuery,
  typeFilter, setTypeFilter,
  selectedRecord, isModalOpen,
  stats, refetch, handleViewRecord, handleCloseModal,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Course Withdrawals Register</h1>
            <p className="text-sm text-slate-500 mt-1">Read-only record of withdrawals processed by Heads of Class.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search student or course..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-sm" />
            </div>
            <div className="relative">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none bg-white cursor-pointer">
                {["All", "Drop", "Withdrawal"].map((o) => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button onClick={refetch} disabled={isLoading} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 disabled:opacity-50">
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={FileText} label="Total Records" value={stats.total} color="bg-violet-500" />
          <StatCard icon={UserMinus} label="Drops" value={stats.drops} color="bg-blue-500" />
          <StatCard icon={LogOut} label="Withdrawals" value={stats.withdrawals} color="bg-purple-500" />
        </div>

        {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md"><p className="text-red-700 text-sm">{error}</p></div>}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-semibold">Student</th>
                  <th className="px-6 py-4 font-semibold">Course</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Decided By</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">Loading register...</td></tr>
                ) : withdrawals.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">No withdrawal records found.</td></tr>
                ) : withdrawals.map((r) => {
                  const reg = r.studentCourseRegistrationId;
                  return (
                    <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{reg?.studentId?.personalInfo?.fullName || "Unknown"}</p>
                        <p className="text-xs text-slate-400">{reg?.studentId?.studentId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-800">{reg?.courseId?.title}</p>
                        <p className="text-xs text-slate-400 font-mono">{reg?.courseId?.code}</p>
                      </td>
                      <td className="px-6 py-4"><TypeBadge type={r.withdrawalType} /></td>
                      <td className="px-6 py-4 text-slate-600">{r.decidedBy?.personalInfo?.fullName || "—"}</td>
                      <td className="px-6 py-4 text-slate-600">{r.decidedAt ? new Date(r.decidedAt).toLocaleDateString() : "—"}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleViewRecord(r)} className="text-slate-400 hover:text-violet-600 p-1 rounded-md hover:bg-violet-50 transition-colors text-xs font-medium">
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <WithdrawalDetailModal record={selectedRecord} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default CourseWithdrawalsView;
