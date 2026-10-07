import React, { useState } from "react";
import {
  Search,
  Users,
  Receipt,
  TrendingDown,
  Calendar,
  Phone,
  CreditCard,
  AlertCircle,
  UserX,
  AlertTriangle,
  X,
  CheckCircle2,
  Loader2,
  UploadCloud,
  Eye,
  FileText,
  Edit2,
  Save,
} from "lucide-react";
import {
  useMarkStudentAsLeftMutation,
  useUpdateLeftStudentDetailsMutation,
} from "../api/leftCasesApi";

const LeftCasesView = ({
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
  selectedDept,
  setSelectedDept,
  selectedProg,
  setSelectedProg,
  selectedTerm,
  setSelectedTerm,
  departments,
  programs,
  terms,
}) => {
  const [selectedStudent, setSelectedStudent] = useState(null); // For Processing Withdrawal
  const [selectedHistoryStudent, setSelectedHistoryStudent] = useState(null); // For Viewing Details

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800">
              Left Cases Management
            </h1>
            <p className="text-slate-500 mt-1">
              Manage withdrawn students and process new withdrawals.
            </p>
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

        {/* ======================================================== */}
        {/* TAB 1: HISTORY & DASHBOARD */}
        {/* ======================================================== */}
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
                value={
                  statsLoading ? "..." : formatCurrency(stats?.totalLostRevenue)
                }
                icon={<TrendingDown className="text-rose-600" />}
                bg="bg-rose-50"
                border="border-rose-200"
                subtitle="Written-off bad debt"
              />
              <StatCard
                title="Cancelled Challans"
                value={
                  statsLoading ? "..." : stats?.totalCancelledChallans || 0
                }
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
                      <td
                        colSpan="4"
                        className="p-12 text-center text-slate-400"
                      >
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                        Loading archive...
                      </td>
                    </tr>
                  ) : historyStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-12 text-center text-slate-400"
                      >
                        No withdrawn students found.
                      </td>
                    </tr>
                  ) : (
                    historyStudents.map((s) => (
                      <tr
                        key={s._id || s.studentId}
                        className="hover:bg-slate-50 group"
                      >
                        <td className="p-4 pl-6">
                          <div className="font-bold text-slate-800">
                            {s.fullName ||
                              s.personalInfo?.fullName ||
                              "Unknown"}
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

        {/* ======================================================== */}
        {/* TAB 2: PROCESS WITHDRAWAL */}
        {/* ======================================================== */}
        {activeTab === "process" && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Filter Toolbar */}
            <div className="p-5 border-b border-slate-200 bg-rose-50/30 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-rose-900">
                    Active Students
                  </h2>
                  <p className="text-xs text-rose-600 font-medium">
                    Select a student to process their withdrawal.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none text-slate-700"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.title || d.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedProg}
                  onChange={(e) => setSelectedProg(e.target.value)}
                  disabled={!selectedDept}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none text-slate-700 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">All Programs</option>
                  {programs.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title || p.name}
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
                      {t.title || t.name}
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
                      No active students found matching filters.
                    </td>
                  </tr>
                ) : (
                  activeStudents.map((student) => (
                    <tr
                      key={student._id}
                      className="hover:bg-rose-50/50 transition-colors group"
                    >
                      <td className="p-4 pl-6">
                        <div className="font-bold text-slate-800">
                          {student.personalInfo?.fullName ||
                            student.fullName ||
                            "Unknown Student"}
                        </div>
                        <div className="text-xs font-mono text-slate-500 mt-1">
                          {student.studentId || student.rollNo}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-bold text-slate-700">
                          {student.programId?.title ||
                            student.programId?.name ||
                            "N/A"}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {student.termId?.title ||
                            student.termId?.name ||
                            "N/A"}
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

        {/* MODALS */}
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
    </div>
  );
};

// ==========================================
// MODAL 1: WITHDRAWAL MODAL (DANGER ZONE)
// ==========================================
// Exported — reused as-is by the COIS/College Withdraw tab
// (view/cois/COISWithdrawView.jsx), since withdrawing a student works
// identically regardless of College/University.
export const WithdrawalModal = ({ student, onClose, setActiveTab }) => {
  const [reason, setReason] = useState("");
  const [file, setFile] = useState(null);
  const [markAsLeft, { isLoading }] = useMarkStudentAsLeftMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return alert("A reason is required.");

    try {
      const formData = new FormData();
      formData.append("reason", reason);
      if (file) formData.append("proofDocument", file);

      await markAsLeft({ id: student._id, formData }).unwrap();
      onClose();
      setActiveTab("history");
    } catch (error) {
      alert(error?.data?.message || "Failed to process withdrawal.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-rose-600 p-6 flex justify-between items-start text-white">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black">Process Withdrawal</h3>
              <p className="text-sm font-medium text-rose-100 mt-1">
                Withdrawing{" "}
                <span className="font-bold text-white">
                  {student.personalInfo?.fullName || student.fullName}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-rose-200 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex gap-3 text-rose-800 text-sm">
            <AlertTriangle className="w-6 h-6 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <strong className="text-rose-900 block mb-1 uppercase tracking-wide">
                Danger: Destructive Action
              </strong>
              This action will <b>permanently cancel</b> all unpaid and overdue
              challans for this student.
            </div>
          </div>

          <div>
            <div className="block text-sm font-bold text-slate-700 mb-2">
              Reason for Leaving <span className="text-rose-500">*</span>
            </div>
            <textarea
              required
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Transferring to another city, financial issues..."
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none resize-none"
            />
          </div>

          <div>
            <div className="block text-sm font-bold text-slate-700 mb-2">
              Proof Document (Optional)
            </div>
            <label className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 relative cursor-pointer transition-colors block">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <UploadCloud
                className={`w-8 h-8 mx-auto mb-2 ${file ? "text-emerald-500" : "text-slate-400"}`}
              />
              {file ? (
                <p className="text-sm font-bold text-emerald-600">
                  {file.name}
                </p>
              ) : (
                <p className="text-sm font-bold text-slate-700">
                  Click or drag file to upload
                </p>
              )}
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !reason.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-lg disabled:opacity-50 transition-colors shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Confirm Withdrawal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// MODAL 2: HISTORY DETAILS & EDIT MODAL
// ==========================================
// Exported — reused as-is by the COIS/College Withdraw tab.
export const HistoryDetailsModal = ({ student, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [reason, setReason] = useState(
    student.remark || student.reason || student.leaveReason || ""
  );
  const [file, setFile] = useState(null);

  const [updateDetails, { isLoading }] = useUpdateLeftStudentDetailsMutation();

  const handleSave = async () => {
    if (!reason.trim()) return alert("Reason cannot be empty.");
    try {
      const formData = new FormData();
      formData.append("reason", reason);
      if (file) formData.append("proofDocument", file);

      await updateDetails({ id: student._id, formData }).unwrap();
      
      // ✅ We don't artificially mock the UI here. We close the modal, 
      // let RTK Query automatically fetch the real image from the DB, 
      // so when you open it again, it's 100% accurate.
      alert("Details updated successfully.");
      onClose();
    } catch (err) {
      alert("Failed to update details.");
    }
  };

  const proofUrl = student.proofDocument || student.documentUrl;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Withdrawal Details</h3>
              <p className="text-[10px] uppercase font-bold text-slate-500">
                {student.personalInfo?.fullName || student.fullName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs font-bold text-slate-500 uppercase">
                Reason for Leaving
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:text-blue-800"
                >
                  <Edit2 size={12} /> Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <textarea
                className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                rows="4"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            ) : (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-sm text-slate-700 leading-relaxed min-h-[80px]">
                {student.remark || student.reason || (
                  <span className="text-slate-400 italic">
                    No reason provided.
                  </span>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Proof Document
            </div>
            {isEditing ? (
              <label className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 cursor-pointer relative transition-colors block">
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.jpg,.jpeg,.png" 
                />
                <UploadCloud
                  className={`w-6 h-6 mx-auto mb-1 ${file ? "text-emerald-500" : "text-slate-400"}`}
                />
                <p className="text-xs font-bold text-slate-600">
                  {file ? file.name : "Upload new document"}
                </p>
              </label>
            ) : proofUrl ? (
              <a
                href={proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-bold"
              >
                <FileText size={18} /> View Uploaded Document
              </a>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-lg text-sm italic text-center">
                No document attached.
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setReason(student.remark || "");
                  setFile(null); 
                }}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}{" "}
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Exported — reused as-is by the COIS/College Withdraw tab.
export const StatCard = ({ title, value, icon, bg, border, subtitle }) => {
  const IconEl = React.cloneElement(icon, {
    className: `w-6 h-6 ${icon.props.className}`,
  });
  return (
    <div
      className={`p-6 rounded-2xl border ${border} ${bg} relative overflow-hidden`}
    >
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-sm font-bold text-slate-600 mb-1">{title}</p>
          <h3 className="text-2xl font-black text-slate-900">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        <div className="p-3 bg-white/60 rounded-xl shadow-sm backdrop-blur-sm">
          {IconEl}
        </div>
      </div>
    </div>
  );
};

export default LeftCasesView;
