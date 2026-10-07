import React, { useState } from "react";
import {
  Users,
  Layers,
  Zap,
  ChevronRight,
  Loader2,
  MessageSquare,
  X,
  Search,
  Filter,
  GraduationCap,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { CircularProgress } from "@mui/material";
import BulkChallanManager from "./BulkChallanManager";
import AutoFeeGenerator from "./AutoFeeGenerator";
import RenewOverdueChallans from "./RenewOverdueChallans";
import DailyInvoiceView from "../cois/DailyInvoiceView";

const getInitials = (name) => {
  return name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const RemarkModal = ({ isOpen, onClose, remark, studentName }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Student Remark
              </h3>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                {studentName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          <div className="bg-slate-50 border border-slate-200 text-slate-700 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
            {remark || "No remark available."}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const DashboardView = ({ data }) => {
  const [activeTab, setActiveTab] = useState("students");
  const [remarkModal, setRemarkModal] = useState({
    open: false,
    text: "",
    name: "",
  });
  const {
    filters,
    updateFilters,
    departments,
    programs,
    semesters,
    terms,
    studentsList,
    loadMoreStudents,
    isLoading,
    selectStudent,
  } = data;

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 350) {
      loadMoreStudents();
    }
  };

  // Departments/programs/students are already university-only (the
  // controller now fetches them all with excludeLevel:"HSSC" via
  // getCompleteCatalog, same as the other accountant pages) — no need to
  // re-filter HSSC entities out client-side here anymore.
  const universityDepartments = departments || [];
  const universityPrograms = programs || [];
  const universityStudentsList = studentsList || [];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            FEE MANAGEMENT
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Manage student challans
          </p>
        </div>
        <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 mt-4 md:mt-0 shadow-sm">
          <button
            onClick={() => setActiveTab("students")}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === "students" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
          >
            <Users size={16} /> Directory
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === "bulk" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
          >
            <Layers size={16} /> Bulk Tools
          </button>
          <button
            onClick={() => setActiveTab("auto")}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === "auto" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
          >
            <Zap size={16} /> Auto Generator
          </button>
          <button
            onClick={() => setActiveTab("daily-invoice")}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === "daily-invoice" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
          >
            <Calendar size={16} /> Daily Invoice
          </button>
          <button
            onClick={() => setActiveTab("renew")}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === "renew" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
          >
            <RefreshCw size={16} /> Renew Overdue
          </button>
        </div>
      </div>

      <RemarkModal
        isOpen={remarkModal.open}
        onClose={() => setRemarkModal({ open: false, text: "", name: "" })}
        remark={remarkModal.text}
        studentName={remarkModal.name}
      />

      {activeTab === "students" && (
        <div className="flex h-[calc(100vh-160px)] gap-6">
          <div className="w-[300px] bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col shrink-0 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-900">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Filter size={18} className="text-indigo-400" /> Filter Records
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Locate students to manage challans.
              </p>
            </div>
            <div className="p-5 space-y-5 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Academic Session <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:border-indigo-500 focus:ring-2 transition-all font-medium text-slate-700"
                  value={filters.termId}
                  onChange={(e) => updateFilters("termId", e.target.value)}
                >
                  <option value="">Select Session...</option>
                  {terms.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Department
                </label>
                <select
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:border-indigo-500 focus:ring-2 transition-all font-medium text-slate-700"
                  value={filters.departmentId}
                  onChange={(e) =>
                    updateFilters("departmentId", e.target.value)
                  }
                >
                  <option value="">All Departments</option>
                  {/* ✅ Using Filtered Departments */}
                  {universityDepartments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Program
                </label>
                <select
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-lg disabled:bg-slate-50 outline-none focus:border-indigo-500 focus:ring-2 transition-all font-medium text-slate-700"
                  value={filters.programId}
                  disabled={!filters.departmentId}
                  onChange={(e) => updateFilters("programId", e.target.value)}
                >
                  <option value="">All Programs</option>
                  {/* ✅ Using Filtered Programs */}
                  {universityPrograms.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Semester
                </label>
                <select
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-lg disabled:bg-slate-50 outline-none focus:border-indigo-500 focus:ring-2 transition-all font-medium text-slate-700"
                  value={filters.semesterId}
                  disabled={!filters.programId}
                  onChange={(e) => updateFilters("semesterId", e.target.value)}
                >
                  <option value="">All Semesters</option>
                  {semesters.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name || `Semester ${s.number}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center gap-4 shrink-0">
              <div className="relative w-96">
                <Search
                  className="absolute left-3 top-3 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
                  placeholder="Search by Name or Reg ID..."
                  value={filters.search}
                  onChange={(e) => updateFilters("search", e.target.value)}
                />
                {filters.search && (
                  <button
                    onClick={() => updateFilters("search", "")}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="text-xs font-bold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg">
                {universityStudentsList.length} Records Loaded
              </div>
            </div>

            <div
              className="flex-1 overflow-auto bg-slate-50/30"
              onScroll={handleScroll}
            >
              {!filters.termId && universityStudentsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Users size={48} className="mb-4 opacity-20 text-slate-500" />
                  <p className="font-medium">
                    Select an Academic Session to load students.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-white text-slate-500 font-bold uppercase text-xs sticky top-0 border-b border-slate-200 z-10 shadow-sm">
                    <tr>
                      <th className="p-4 whitespace-nowrap">Profile</th>
                      <th className="p-4 whitespace-nowrap">Reg ID</th>
                      <th className="p-4 whitespace-nowrap">Father Name</th>
                      <th className="p-4 whitespace-nowrap">CNIC</th>
                      <th className="p-4 whitespace-nowrap">Phone</th>
                      <th className="p-4 whitespace-nowrap">Program Info</th>
                      <th className="p-4 whitespace-nowrap">Remark</th>
                      <th className="p-4 whitespace-nowrap text-center">
                        Status
                      </th>
                      <th className="p-4 whitespace-nowrap text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {universityStudentsList.length === 0 && !isLoading ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="p-20 text-center text-slate-400"
                        >
                          <p className="text-base font-medium">
                            No students found matching your criteria.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      universityStudentsList.map((s) => {
                        const fatherName =
                          s.personalInfo?.fatherName ||
                          s.familyInfo?.fatherName ||
                          "-";
                        return (
                          <tr
                            key={s._id}
                            className="group hover:bg-indigo-50/40 transition-colors cursor-pointer"
                            onClick={() => selectStudent(s)}
                          >
                            <td className="p-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-sm shrink-0">
                                  {getInitials(
                                    s.personalInfo?.fullName || "ST",
                                  )}
                                </div>
                                <span className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                                  {s.personalInfo?.fullName || "N/A"}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 font-mono text-slate-500 font-bold text-xs whitespace-nowrap">
                              {s.studentId}
                            </td>
                            <td className="p-4 text-slate-600 whitespace-nowrap">
                              {fatherName}
                            </td>
                            <td className="p-4 font-mono text-slate-500 text-xs whitespace-nowrap">
                              {s.personalInfo?.cnic || "-"}
                            </td>
                            <td className="p-4 font-mono text-slate-500 text-xs whitespace-nowrap">
                              {s.personalInfo?.phone || "-"}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                <GraduationCap size={14} />{" "}
                                {s.programId?.name || s.program?.name || "N/A"}
                              </div>
                              <div className="text-[10px] font-bold text-slate-500 mt-0.5 ml-5">
                                Sem{" "}
                                {s.semesterId?.number ||
                                  s.semester?.number ||
                                  "-"}
                              </div>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              {s.remark ? (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRemarkModal({
                                      open: true,
                                      text: s.remark,
                                      name: s.personalInfo?.fullName,
                                    });
                                  }}
                                  className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 w-fit hover:bg-amber-100 transition-colors"
                                >
                                  <MessageSquare size={12} />{" "}
                                  <span className="text-[10px] font-bold uppercase">
                                    View
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-300 italic">
                                  -
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${s.status === "active" || s.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}
                              >
                                {s.status ||
                                  (s.isActive ? "Active" : "Inactive")}
                              </span>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap">
                              <button className="text-slate-300 group-hover:text-indigo-600 transition-colors p-2 hover:bg-white rounded-full shadow-sm border border-transparent group-hover:border-slate-200">
                                <ChevronRight size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}

              {isLoading && (
                <div className="p-6 flex justify-center bg-white">
                  <CircularProgress size={24} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "bulk" && (
        <BulkChallanManager
          terms={data.terms}
          departments={universityDepartments}
          programsAll={data.programsAll}
          semestersAll={data.semestersAll}
          actions={data.actions}
          isProcessing={data.isProcessing}
          miscFeesList={data.miscFeesList}
        />
      )}

      {activeTab === "auto" && (
        <AutoFeeGenerator
          terms={data.terms}
          departments={universityDepartments}
          programsAll={data.programsAll}
          semestersAll={data.semestersAll}
          actions={data.actions}
          isProcessing={data.isProcessing}
        />
      )}

      {activeTab === "daily-invoice" && <DailyInvoiceView scope="university" />}

      {activeTab === "renew" && (
        <RenewOverdueChallans
          terms={data.terms}
          departments={universityDepartments}
          programsAll={data.programsAll}
          semestersAll={data.semestersAll}
          actions={data.actions}
          isProcessing={data.isProcessing}
        />
      )}
    </div>
  );
};

export default DashboardView;
