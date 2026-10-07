// view/Scholarship/StudentScholarshipListView.js
import React, { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Layers,
} from "lucide-react";

const StudentScholarshipListView = ({
  controllerData,
  filters,
  updateFilters,
  clearFilters,
  onPageChange,
  onOpenApply,
  onOpenApprove,
  onOpenReject,
  onOpenRevoke,
  onOpenDetails,
  onOpenExport,
}) => {
  const {
    studentScholarships = [],
    scholarshipsPagination = {},
    scholarshipPlans = [],
    students = [],
    isLoadingScholarships,
    isApplying,
    handleSetSelectedStudent, // Now this will be a valid function
    handleRefresh,
    setSearchTerm,
    searchTerm,
    // ✅ ADDED: Filter props needed by the modal
    studentListFilters,
    setStudentListFilters,
  } = controllerData;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || "pending";
    const config = {
      pending: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        icon: Clock,
      },
      approved: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        icon: CheckCircle,
      },
      rejected: {
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        icon: XCircle,
      },
      revoked: {
        bg: "bg-slate-100",
        text: "text-slate-600",
        border: "border-slate-200",
        icon: Ban,
      },
    };

    const style = config[s] || config.pending;
    const Icon = style.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${style.bg} ${style.text} ${style.border}`}
      >
        <Icon size={12} strokeWidth={2.5} />
        {status}
      </span>
    );
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* --- CONTROL BAR --- */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        {/* Left: Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
          <div className="relative group w-full md:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search student..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filters.status || ""}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer hover:border-slate-300"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filters.planId || ""}
            onChange={(e) => updateFilters({ planId: e.target.value })}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer hover:border-slate-300 max-w-[200px]"
          >
            <option value="">All Plans</option>
            {scholarshipPlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.title}
              </option>
            ))}
          </select>

          {(filters.status || filters.planId || filters.search) && (
            <button
              onClick={clearFilters}
              className="text-sm text-rose-500 font-medium hover:text-rose-700 px-2 self-center"
            >
              Reset
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
          <button
            onClick={handleRefresh}
            disabled={isLoadingScholarships}
            className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-transparent hover:border-indigo-100"
          >
            <RefreshCw
              size={18}
              className={isLoadingScholarships ? "animate-spin" : ""}
            />
          </button>

          <button
            onClick={onOpenExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
          >
            <Download size={16} />{" "}
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => {
              // Ensure this function exists before calling
              if (handleSetSelectedStudent) handleSetSelectedStudent(null);
              onOpenApply();
            }}
            disabled={isApplying}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all"
          >
            <Plus size={18} /> <span>Assign New</span>
          </button>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Student Profile
                </th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Plan Details
                </th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Fee &amp; Deduction
                </th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingScholarships ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw
                        className="animate-spin text-indigo-500"
                        size={24}
                      />
                      <span className="text-sm font-medium">
                        Loading data...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : studentScholarships.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                        <Search size={24} />
                      </div>
                      <h3 className="text-slate-900 font-bold">
                        No applications found
                      </h3>
                    </div>
                  </td>
                </tr>
              ) : (
                studentScholarships.map((app) => (
                  <tr
                    key={app.id || app._id}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Student Info */}
                    <td className="px-6 py-5 align-top">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border border-indigo-200">
                          {app.studentName ? app.studentName.charAt(0) : "U"}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {app.studentName || "Unknown"}
                          </div>
                          <div className="text-slate-500 text-xs font-medium mt-0.5">
                            {app.studentEmail}
                          </div>
                          <div className="text-slate-400 text-[10px] mt-1 font-mono tracking-wide">
                            {app.studentRegNo && <span>{app.studentRegNo}</span>}
                            {app.studentRegNo && app.studentCNIC && (
                              <span className="mx-1">·</span>
                            )}
                            {app.studentCNIC}
                          </div>
                          {(app.studentProgram || app.studentDepartment) && (
                            <div className="text-slate-500 text-[11px] mt-1.5 font-medium">
                              {app.studentProgram || "—"}
                              {app.studentSemesterNumber
                                ? ` · Sem ${app.studentSemesterNumber}`
                                : ""}
                              {app.studentDepartment && (
                                <div className="text-slate-400 text-[10px]">
                                  {app.studentDepartment}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Plan Details */}
                    <td className="px-6 py-5 align-top">
                      <div className="font-bold text-slate-800 text-sm">
                        {app.planTitle}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                        <Calendar size={12} className="text-slate-400" />{" "}
                        {app.termName || "No Term"}
                      </div>
                      <div className="mt-2 flex flex-col items-start gap-1.5">
                        <span className="inline-flex text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wide">
                          {app.planType === "percentage"
                            ? `${app.planMaxPercentage}%`
                            : `Rs ${Number(app.planMaxAmount || 0).toLocaleString()} Fixed`}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-500">
                          <Layers size={10} />
                          {app.semesterScope === "selective"
                            ? app.semesterNumbers?.length > 0
                              ? `Sem ${app.semesterNumbers.join(", ")}`
                              : "Selected Semesters"
                            : "All Semesters"}
                        </span>
                      </div>
                    </td>

                    {/* Fee & Deduction */}
                    <td className="px-6 py-5 align-top">
                      {!app.hasFeeSetup ? (
                        <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded px-2 py-1 inline-block">
                          Fee not set up
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-xs text-slate-500 font-medium">
                            Tuition{" "}
                            <span className="text-slate-700 font-bold">
                              Rs {app.tuitionAmount.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-xs text-indigo-600 font-bold">
                            − Rs {app.scholarshipAmount.toLocaleString()}
                          </div>
                          <div className="text-xs text-emerald-700 font-bold">
                            Pays Rs {app.netAmount.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5 align-top">
                      {getStatusBadge(app.status)}
                      <div className="text-[10px] text-slate-400 mt-2 font-medium ml-1">
                        Applied: {formatDate(app.appliedAt)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5 align-top text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onOpenDetails(app)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>

                        {app.status === "pending" && (
                          <>
                            <button
                              onClick={() => onOpenApprove(app)}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => onOpenReject(app)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}

                        {app.status === "approved" && onOpenRevoke && (
                          <button
                            onClick={() => onOpenRevoke(app)}
                            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Remove From Scholarship"
                          >
                            <Ban size={18} />
                          </button>
                        )}

                        {(app.status === "rejected" ||
                          app.status === "revoked") && (
                          <button
                            onClick={() => {
                              if (handleSetSelectedStudent)
                                handleSetSelectedStudent({
                                  ...students.find(
                                    (s) => (s.id || s._id) === app.studentId,
                                  ),
                                  name: app.studentName,
                                });
                              onOpenApply();
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Re-apply"
                          >
                            <RefreshCw size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION FOOTER --- */}
        {scholarshipsPagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Page {filters.page} of {scholarshipsPagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(filters.page - 1)}
                disabled={filters.page <= 1 || isLoadingScholarships}
                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
              >
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              <button
                onClick={() => onPageChange(filters.page + 1)}
                disabled={
                  filters.page >= scholarshipsPagination.totalPages ||
                  isLoadingScholarships
                }
                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
              >
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentScholarshipListView;
