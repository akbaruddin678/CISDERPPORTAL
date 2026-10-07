import React from "react";
import {
  User,
  Phone,
  Mail,
  Building2,
  GraduationCap,
  Receipt,
  Wallet,
  AlertCircle,
  FileText,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  FileDown,
  Layers,
  Award,
} from "lucide-react";
import { useCOISStudent360 } from "../../controller/useCOISStudent360";

const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }) => (
  <div
    className={`p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 bg-white`}
  >
    <div
      className={`w-10 h-10 rounded-lg ${bgClass} ${colorClass} flex items-center justify-center shrink-0`}
    >
      <Icon size={20} />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {title}
      </p>
      <h3 className="text-xl font-black text-slate-800">{value}</h3>
    </div>
  </div>
);

export default function COISStudent360View({ studentId, onBack }) {
  const {
    student,
    challans,
    financialSummary,
    safeFullName,
    safeFatherName,
    safeRegNo,
    activeTab,
    setActiveTab,
    loading,
    handleExportPDF,
    handleExportWord,
  } = useCOISStudent360(studentId);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-violet-500 mb-4" />
        <p className="font-bold">Loading Comprehensive Profile...</p>
      </div>
    );
  }

  const initials =
    safeFullName
      ?.split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("") || "ST";

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="w-14 h-14 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-xl font-black border-2 border-violet-200">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">
              {safeFullName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {safeRegNo}
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  student?.status === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {student?.status || "UNKNOWN"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportWord}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-sm rounded-xl border border-blue-200 transition-colors"
          >
            <FileText size={16} /> Export Word
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-sm rounded-xl border border-rose-200 transition-colors"
          >
            <FileDown size={16} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* --- LEFT COLUMN: STATIC PROFILE --- */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <User size={16} className="text-violet-500" /> Personal Details
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <User size={16} className="text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Father's Name
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {safeFatherName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    CNIC / B-Form
                  </p>
                  <p className="text-sm font-mono text-slate-800">
                    {student?.personalInfo?.cnic || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Phone
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {student?.personalInfo?.phone || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Email
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {student?.personalInfo?.email || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Building2 size={16} className="text-violet-500" /> Enrollment
                Info
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Program
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {student?.programId?.name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Class
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {student?.departmentId?.name || "College Division"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Current Part
                </p>
                <p className="text-sm font-medium text-slate-800">
                  Part {student?.semesterId?.number || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: TABS --- */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex gap-1">
            <button
              onClick={() => setActiveTab("financials")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all ${
                activeTab === "financials"
                  ? "bg-violet-50 text-violet-700 border border-violet-200 shadow-sm"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Wallet size={16} /> Financial Dues & Challans
            </button>
            <button
              onClick={() => setActiveTab("academics")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all ${
                activeTab === "academics"
                  ? "bg-violet-50 text-violet-700 border border-violet-200 shadow-sm"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <GraduationCap size={16} /> Academic Performance
            </button>
          </div>

          {activeTab === "financials" && (
            <div className="space-y-6 animate-in fade-in">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  title="Total Invoiced"
                  value={`Rs. ${financialSummary.totalGenerated.toLocaleString()}`}
                  icon={Receipt}
                  bgClass="bg-blue-50"
                  colorClass="text-blue-600"
                />
                <StatCard
                  title="Total Paid"
                  value={`Rs. ${financialSummary.totalPaid.toLocaleString()}`}
                  icon={CheckCircle2}
                  bgClass="bg-emerald-50"
                  colorClass="text-emerald-600"
                />
                <StatCard
                  title="Pending Dues"
                  value={`Rs. ${financialSummary.totalPending.toLocaleString()}`}
                  icon={AlertCircle}
                  bgClass="bg-rose-50"
                  colorClass="text-rose-600"
                />
                <StatCard
                  title="Scholarships"
                  value={`Rs. ${financialSummary.totalScholarship.toLocaleString()}`}
                  icon={Award}
                  bgClass="bg-indigo-50"
                  colorClass="text-indigo-600"
                />
              </div>

              {/* Master Challan Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-slate-800">
                    Comprehensive Ledger
                  </h3>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] sticky top-0 z-10">
                      <tr>
                        <th className="px-5 py-3">Challan Ref</th>
                        <th className="px-5 py-3">Timelines</th>
                        <th className="px-5 py-3">Fee Breakdown</th>
                        <th className="px-5 py-3 text-right">Totals</th>
                        <th className="px-5 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {challans.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-12 text-center text-slate-400"
                          >
                            No financial records found.
                          </td>
                        </tr>
                      ) : (
                        challans.map((c) => (
                          <tr key={c._id} className="hover:bg-slate-50">
                            {/* Ref & Type */}
                            <td className="px-5 py-4">
                              <p className="font-mono text-xs font-bold text-slate-800">
                                {c.challanNo}
                              </p>
                              <div className="flex flex-col items-start gap-1 mt-1">
                                <span className="text-[10px] font-bold uppercase text-slate-500">
                                  {c.challanType?.replace(/_/g, " ") ||
                                    "UNKNOWN"}
                                </span>
                                {c.isInstallment && (
                                  <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                                    <Layers size={10} /> Installment
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Timelines */}
                            <td className="px-5 py-4 text-[10px]">
                              <div className="grid grid-cols-[50px_1fr] gap-x-2 gap-y-1">
                                <span className="text-slate-400 font-bold">
                                  Gen:
                                </span>{" "}
                                <span className="font-mono text-slate-700">
                                  {c.createdAt
                                    ? new Date(c.createdAt).toLocaleDateString(
                                        "en-GB",
                                      )
                                    : "—"}
                                </span>
                                <span className="text-slate-400 font-bold">
                                  Due:
                                </span>{" "}
                                <span className="font-mono text-rose-600 font-bold">
                                  {c.dueDate
                                    ? new Date(c.dueDate).toLocaleDateString(
                                        "en-GB",
                                      )
                                    : "—"}
                                </span>
                                <span className="text-slate-400 font-bold">
                                  Paid:
                                </span>{" "}
                                <span className="font-mono text-emerald-600 font-bold">
                                  {c.paidAt
                                    ? new Date(c.paidAt).toLocaleDateString(
                                        "en-GB",
                                      )
                                    : "—"}
                                </span>
                              </div>
                            </td>

                            {/* Breakdown */}
                            <td className="px-5 py-4 text-[10px]">
                              <div className="grid grid-cols-[50px_1fr] gap-x-2 gap-y-1">
                                <span className="text-slate-400 font-bold">
                                  Base:
                                </span>{" "}
                                <span className="font-mono text-slate-700">
                                  Rs. {(c.originalTotal || 0).toLocaleString()}
                                </span>
                                <span className="text-slate-400 font-bold">
                                  Disc:
                                </span>{" "}
                                <span className="font-mono text-indigo-600">
                                  Rs.{" "}
                                  {(c.scholarshipAmount || 0).toLocaleString()}
                                </span>
                                <span className="text-slate-400 font-bold">
                                  Fine:
                                </span>{" "}
                                <span className="font-mono text-amber-600">
                                  Rs. {(c.fineAmount || 0).toLocaleString()}
                                </span>
                              </div>
                            </td>

                            {/* Totals */}
                            <td className="px-5 py-4 text-[11px] text-right">
                              <div className="flex flex-col items-end gap-1">
                                <div>
                                  <span className="text-slate-400 font-bold mr-2">
                                    Net:
                                  </span>{" "}
                                  <span className="font-black text-slate-800 text-xs">
                                    Rs. {(c.netAmount || 0).toLocaleString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-bold mr-2">
                                    Paid:
                                  </span>{" "}
                                  <span className="font-black text-emerald-600">
                                    Rs. {(c.paidAmount || 0).toLocaleString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-bold mr-2">
                                    Bal:
                                  </span>{" "}
                                  <span className="font-black text-rose-600">
                                    Rs.{" "}
                                    {(c.remainingAmount || 0).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-5 py-4 text-center">
                              <span
                                className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${
                                  c.status === "paid"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : c.status === "overdue"
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : c.status === "cancelled"
                                        ? "bg-slate-100 text-slate-400 border-slate-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "academics" && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in p-12 text-center text-slate-500">
              <GraduationCap
                size={48}
                className="mx-auto mb-4 text-slate-300"
              />
              <h3 className="text-lg font-bold text-slate-800">
                Academic Records
              </h3>
              <p className="text-sm mt-2 max-w-md mx-auto">
                Academic performance, attendance, and exam history will be
                integrated here upon linking with the Examination Module.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
