import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  FileText,
  Loader2,
  Calendar,
  Wallet,
  AlertCircle,
  PieChart,
  ArrowUpRight,
  ShieldAlert,
  Edit,
  X,
  DownloadCloud,
  Zap,
} from "lucide-react";
import { useCOISReports } from "../../controller/useCOISReports";

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
    <div
      className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}
    >
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        {title}
      </p>
      <h3 className="text-2xl font-black text-slate-800">{value}</h3>
    </div>
  </div>
);

const EditOverdueModal = ({
  isOpen,
  onClose,
  challan,
  onUpdate,
  isLoading,
}) => {
  const [fine, setFine] = useState(0);
  const [date, setDate] = useState("");

  useEffect(() => {
    if (isOpen && challan) {
      setFine(challan.fineAmount || 0);
      setDate(new Date(challan.dueDate).toISOString().split("T")[0]);
    }
  }, [isOpen, challan]);

  if (!isOpen || !challan) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>
        <h3 className="font-bold text-lg text-slate-800 mb-4 border-b pb-3">
          Update Overdue Status
        </h3>

        <div className="mb-4 bg-rose-50 p-3 rounded-lg border border-rose-100">
          <p className="text-xs font-bold text-rose-800 uppercase tracking-wide">
            Ref: {challan.challanNo}
          </p>
          <p className="text-sm font-bold text-rose-900 mt-1">
            {challan.studentId?.personalInfo?.fullName ||
              challan.studentName ||
              "N/A"}
          </p>
          <p className="text-[11px] font-semibold text-rose-700 mt-0.5">
            S/o:{" "}
            {challan.studentId?.familyInfo?.fatherName ||
              challan.fatherName ||
              "N/A"}
          </p>
          <p className="text-xs text-rose-600 font-mono mt-1">
            {challan.studentId?.studentId || challan.studentRegNo || "N/A"}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
              Extend Due Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-slate-700 bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
              Override Late Fine (PKR)
            </label>
            <input
              type="number"
              value={fine}
              onChange={(e) => setFine(e.target.value)}
              className="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-800 bg-slate-50"
            />
          </div>
          <button
            disabled={isLoading}
            onClick={async () => {
              const success = await onUpdate(challan._id, fine, date);
              if (success) onClose();
            }}
            className="w-full mt-2 bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors flex justify-center gap-2 shadow-md shadow-indigo-200 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ReportsView() {
  const {
    activeTab,
    setActiveTab,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    yearOptions,
    monthOptions,
    summary,
    details,
    overdueList,
    periodName,
    isLoading,
    isUpdatingFine,
    isProcessingFines,
    isMasterExporting,
    handleUpdateOverdue,
    handleProcessFines,
    handleExportExcel,
    handleExportPDF,
    handleExportMasterExcel,
  } = useCOISReports();

  const [editingOverdue, setEditingOverdue] = useState(null);

  const recoveryRate =
    summary.totalGeneratedAmount > 0
      ? Math.round(
          (summary.totalCollectedAmount / summary.totalGeneratedAmount) * 100,
        )
      : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            Financial Reports & Analytics
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Monitor COIS revenue, exports, and defaulters.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportMasterExcel}
            disabled={isMasterExporting || isLoading}
            className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
          >
            {isMasterExporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <DownloadCloud size={16} />
            )}
            Export Master Audit (All Data)
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-20">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner w-full md:w-auto">
          <button
            onClick={() => setActiveTab("monthly")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "monthly" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Monthly Overview
          </button>
          <button
            onClick={() => setActiveTab("overdue")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "overdue" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <ShieldAlert size={14} /> Overdue Defaulters
          </button>
        </div>

        {activeTab === "monthly" && (
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Calendar size={14} className="text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 rounded-xl px-4 py-2 outline-none cursor-pointer"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <div className="hidden lg:flex gap-2 ml-4 pl-4 border-l border-slate-200">
              <button
                onClick={handleExportExcel}
                className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                title="Export Month to Excel"
              >
                <FileSpreadsheet size={18} />
              </button>
              <button
                onClick={handleExportPDF}
                className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                title="Export Month to PDF"
              >
                <FileText size={18} />
              </button>
            </div>
          </div>
        )}

       }
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 size={40} className="animate-spin text-violet-500 mb-4" />
          <p className="font-bold">Fetching Financial Data...</p>
        </div>
      ) : (
        <>
          {activeTab === "monthly" && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Generated Revenue"
                  value={`Rs. ${summary.totalGeneratedAmount.toLocaleString()}`}
                  icon={Wallet}
                  color="text-violet-600"
                  bg="bg-violet-50"
                />
                <StatCard
                  title="Collected Amount"
                  value={`Rs. ${summary.totalCollectedAmount.toLocaleString()}`}
                  icon={ArrowUpRight}
                  color="text-emerald-600"
                  bg="bg-emerald-50"
                />
                <StatCard
                  title="Pending Balance"
                  value={`Rs. ${summary.totalPendingAmount.toLocaleString()}`}
                  icon={AlertCircle}
                  color="text-amber-500"
                  bg="bg-amber-50"
                />
                <div className="bg-slate-900 p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-500/20 rounded-full blur-xl"></div>
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/5 z-10">
                    <PieChart className="w-6 h-6 text-indigo-300" />
                  </div>
                  <div className="z-10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Recovery Rate
                    </p>
                    <h3 className="text-2xl font-black text-white">
                      {recoveryRate}%
                    </h3>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-700">
                    Statement Details - {periodName} {selectedYear}
                  </h3>
                  <span className="text-xs font-bold bg-white border border-slate-200 px-3 py-1 rounded-lg text-slate-500">
                    {details.length} Records
                  </span>
                </div>
                <div className="overflow-x-auto max-h-[600px]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-6 py-4">Challan Ref</th>
                        <th className="px-6 py-4">Student Profile</th>
                        <th className="px-6 py-4">Fee Type</th>
                        <th className="px-6 py-4 text-right">Net Amt</th>
                        <th className="px-6 py-4 text-right">Collected</th>
                        <th className="px-6 py-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {details.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-12 text-center text-slate-400"
                          >
                            No records generated for this month.
                          </td>
                        </tr>
                      ) : (
                        details.map((row, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-6 py-4 font-mono text-xs text-slate-500">
                              {row.challanNo}
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-800">
                                {row.studentName || "N/A"}
                              </p>
                              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                                S/o: {row.fatherName || "N/A"}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {row.studentRegNo || "N/A"}
                              </p>
                            </td>
                            <td className="px-6 py-4 uppercase text-xs font-bold text-slate-500">
                              {row.type.replace(/_/g, " ")}
                            </td>
                            <td className="px-6 py-4 text-right font-black">
                              Rs. {row.netAmount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right font-black text-emerald-600">
                              Rs. {row.paidAmount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${row.status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : row.status === "overdue" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}
                              >
                                {row.status}
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

          {activeTab === "overdue" && (
            <div className="bg-white border border-rose-200 rounded-2xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-4">
              <div className="px-6 py-4 border-b border-rose-100 bg-rose-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                    <ShieldAlert size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-rose-900">
                      Overdue Challans List
                    </h3>
                    <p className="text-xs text-rose-600 font-medium">
                      Students who missed their due dates.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold bg-white border border-rose-200 px-3 py-1 rounded-lg text-rose-600">
                  {overdueList.length} Defaulters
                </span>
              </div>
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-4">Challan Ref</th>
                      <th className="px-6 py-4">Student Profile</th>
                      <th className="px-6 py-4">Due Date</th>
                      <th className="px-6 py-4 text-right">Base Amount</th>
                      <th className="px-6 py-4 text-right">Late Fine</th>
                      <th className="px-6 py-4 text-right text-rose-600">
                        Total Payable
                      </th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {overdueList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-16 text-center text-slate-400"
                        >
                          No overdue challans found. Excellent!
                        </td>
                      </tr>
                    ) : (
                      overdueList.map((row, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-rose-50/30 transition-colors"
                        >
                          <td className="px-6 py-4 font-mono text-xs text-slate-500">
                            {row.challanNo}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">
                              {row.studentId?.personalInfo?.fullName ||
                                row.studentName ||
                                "N/A"}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                              S/o:{" "}
                              {row.studentId?.familyInfo?.fatherName ||
                                row.fatherName ||
                                "N/A"}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {row.studentId?.studentId ||
                                row.studentRegNo ||
                                "N/A"}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-rose-600 font-bold text-xs">
                            {new Date(row.dueDate).toLocaleDateString("en-GB")}
                          </td>
                          <td className="px-6 py-4 text-right font-mono">
                            Rs.{" "}
                            {(
                              row.netAmount - (row.fineAmount || 0)
                            ).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-amber-600">
                            Rs. {(row.fineAmount || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-rose-700 text-base">
                            Rs. {row.netAmount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setEditingOverdue(row)}
                              className="p-2 bg-white text-indigo-600 border border-slate-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-sm"
                              title="Edit Date & Fine"
                            >
                              <Edit size={14} />
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

          <EditOverdueModal
            isOpen={!!editingOverdue}
            onClose={() => setEditingOverdue(null)}
            challan={editingOverdue}
            isLoading={isUpdatingFine}
            onUpdate={handleUpdateOverdue}
          />
        </>
      )}
    </div>
  );
}
