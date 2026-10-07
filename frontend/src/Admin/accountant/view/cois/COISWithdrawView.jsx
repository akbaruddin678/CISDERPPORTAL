import React, { useState } from "react";
import {
  Search,
  Users,
  Receipt,
  TrendingDown,
  Calendar,
  Phone,
  CreditCard,
  Eye,
  Loader2,
  UserX,
} from "lucide-react";
import { StatCard, WithdrawalModal, HistoryDetailsModal } from "../LeftCasesView";
import { useCOISWithdraw } from "../../controller/useCOISWithdraw";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// College/COIS counterpart to LeftCasesView.jsx — same two-tab flow
// (Dashboard & Archive / Process Withdrawal) and the exact same
// WithdrawalModal/HistoryDetailsModal, scoped to the College department so
// only COIS students ever show up here. No Department dropdown — it's
// auto-locked to College, same as every other COIS screen.
const COISWithdrawView = () => {
  const {
    activeTab,
    setActiveTab,
    stats,
    statsLoading,
    historyStudents,
    historyLoading,
    historySearch,
    setHistorySearch,
    activeStudents,
    activeLoading,
    activeSearch,
    setActiveSearch,
    selectedProg,
    setSelectedProg,
    selectedTerm,
    setSelectedTerm,
    programs,
    terms,
  } = useCOISWithdraw();

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedHistoryStudent, setSelectedHistoryStudent] = useState(null);

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1>Withdraw</h1>
          <p>Process College student withdrawals and review the withdrawal archive</p>
        </div>
        <div className="flex bg-slate-200 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${
              activeTab === "history"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Dashboard & Archive
          </button>
          <button
            onClick={() => setActiveTab("process")}
            className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${
              activeTab === "process"
                ? "bg-white text-rose-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Process Withdrawal
          </button>
        </div>
      </div>

      {activeTab === "history" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Withdrawn"
              value={statsLoading ? "..." : stats?.totalLeftStudents || 0}
              icon={<Users className="text-blue-600" />}
              bg="bg-blue-50"
              border="border-blue-200"
            />
            <StatCard
              title="Cancelled Overdue Revenue"
              value={statsLoading ? "..." : formatCurrency(stats?.totalLostRevenue)}
              icon={<TrendingDown className="text-rose-600" />}
              bg="bg-rose-50"
              border="border-rose-200"
              subtitle="Written-off bad debt"
            />
            <StatCard
              title="Cancelled Challans"
              value={statsLoading ? "..." : stats?.totalCancelledChallans || 0}
              icon={<Receipt className="text-amber-600" />}
              bg="bg-amber-50"
              border="border-amber-200"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                Withdrawn Students Archive
              </h2>
              <div className="relative w-72">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search archive..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4 pl-6">Student Info</th>
                  <th className="p-4">Contact Details</th>
                  <th className="p-4">Date Withdrawn</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyLoading ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Loading archive...
                    </td>
                  </tr>
                ) : historyStudents.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-slate-400">
                      No withdrawn students found.
                    </td>
                  </tr>
                ) : (
                  historyStudents.map((s) => (
                    <tr key={s._id || s.studentId} className="hover:bg-slate-50 group">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-slate-800">
                          {s.fullName || s.personalInfo?.fullName || "Unknown"}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {s.studentId || s.rollNo}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        <div>
                          <CreditCard className="inline w-3.5 h-3.5 mr-1" />{" "}
                          {s.cnic || s.personalInfo?.cnic || "N/A"}
                        </div>
                        <div className="mt-1">
                          <Phone className="inline w-3.5 h-3.5 mr-1" />{" "}
                          {s.phone || s.personalInfo?.phone || "N/A"}
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-700">
                        <Calendar className="inline w-4 h-4 mr-1 text-slate-400" />
                        {formatDate(s.updatedAt)}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => setSelectedHistoryStudent(s)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "process" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-5 border-b border-slate-200 bg-rose-50/30 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-rose-900">Active College Students</h2>
              <p className="text-xs text-rose-600 font-medium">
                Select a student to process their withdrawal.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name or ID..."
                  value={activeSearch}
                  onChange={(e) => setActiveSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
              <select
                value={selectedProg}
                onChange={(e) => setSelectedProg(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none text-slate-700"
              >
                <option value="">All Programs</option>
                {programs.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name || p.title}
                  </option>
                ))}
              </select>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none text-slate-700"
              >
                <option value="">All Sessions</option>
                {terms.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name || t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-4 pl-6">Student</th>
                <th className="p-4">Program / Session</th>
                <th className="p-4">Contact</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeLoading ? (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
                    Loading active students...
                  </td>
                </tr>
              ) : activeStudents.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-slate-400">
                    No active College students found matching filters.
                  </td>
                </tr>
              ) : (
                activeStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-rose-50/50 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-800">
                        {student.personalInfo?.fullName || student.fullName || "Unknown Student"}
                      </div>
                      <div className="text-xs font-mono text-slate-500 mt-1">
                        {student.studentId || student.rollNo}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-bold text-slate-700">
                        {student.programId?.name || student.programId?.title || "N/A"}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {student.termId?.name || student.termId?.title || "N/A"}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {student.personalInfo?.phone || student.phone || "N/A"}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-2 px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-sm font-bold transition-all"
                      >
                        <UserX className="w-4 h-4" /> Withdraw
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedStudent && (
        <WithdrawalModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          setActiveTab={setActiveTab}
        />
      )}

      {selectedHistoryStudent && (
        <HistoryDetailsModal
          student={selectedHistoryStudent}
          onClose={() => setSelectedHistoryStudent(null)}
        />
      )}
    </div>
  );
};

export default COISWithdrawView;
