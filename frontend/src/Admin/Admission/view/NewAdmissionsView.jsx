import React, { useState } from "react";
import {
  FaSearch,
  FaEye,
  FaSpinner,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaUserPlus,
  FaUndo,
  FaPrint,
  FaFileInvoiceDollar,
  FaBan,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUserSlash,
} from "react-icons/fa";
import StudentLifecyclePanel from "./StudentLifecyclePanel";

const CHALLAN_STATUS_META = {
  paid: { label: "Paid", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", dot: "bg-amber-500" },
  overdue: { label: "Overdue", cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-200", dot: "bg-rose-500" },
  not_generated: { label: "Not Generated", cls: "bg-slate-100 text-slate-500 ring-1 ring-slate-200", dot: "bg-slate-400" },
};

const ADMISSION_STATUS_META = {
  active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
  cancelled_non_payment: {
    label: "Cancelled — Non-Payment",
    cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    dot: "bg-rose-500",
  },
  re_admitted: { label: "Re-Admitted", cls: "bg-sky-50 text-sky-700 ring-1 ring-sky-200", dot: "bg-sky-500" },
};

const NewAdmissionsView = ({
  students = [],
  stats = {},
  departments = [],
  programs = [],
  filters = {},
  onFilterChange,
  pagination = {},
  onPageChange,
  isLoading,
  onStudentClick,
  onReAdmit,
  isReAdmitting,
  onPrintChallan = () => {},
  isPrinting = false,
}) => {
  const [lifecycleStudent, setLifecycleStudent] = useState(null);

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{ background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}
    >
      <StudentLifecyclePanel
        student={lifecycleStudent}
        onClose={() => setLifecycleStudent(null)}
        onReAdmit={onReAdmit}
        isReAdmitting={isReAdmitting}
      />

      <div className="max-w-[1440px] mx-auto space-y-7">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FaUserPlus size={18} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600 mb-1">
              Admission Office
            </p>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
              New Admissions
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              First-semester/Part-1 students — with Challan &amp; Admission status
            </p>
          </div>
        </div>

        {/* Challan Generation / Payment Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              label: "Challan Generated",
              value: stats.generated,
              icon: FaFileInvoiceDollar,
              bg: "#eff6ff",
              fg: "#1d4ed8",
            },
            {
              label: "Challan Not Generated",
              value: stats.notGenerated,
              icon: FaBan,
              bg: "#f1f5f9",
              fg: "#475569",
            },
            {
              label: "Paid",
              value: stats.paid,
              icon: FaCheckCircle,
              bg: "#ecfdf5",
              fg: "#047857",
            },
            {
              label: "Unpaid",
              value: stats.unpaid,
              icon: FaExclamationTriangle,
              bg: "#fffbeb",
              fg: "#b45309",
            },
            {
              label: "Cancelled — Non-Payment",
              value: stats.cancelled,
              icon: FaUserSlash,
              bg: "#fef2f2",
              fg: "#b91c1c",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-shadow"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: s.bg }}
              >
                <s.icon size={18} style={{ color: s.fg }} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 truncate">
                  {s.label}
                </p>
                <p className="text-2xl font-black text-slate-900 leading-tight tracking-tight mt-0.5">
                  {s.value ?? 0}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Panel */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="p-6 space-y-4 bg-slate-50/50 border-b border-slate-100">
            <div className="relative">
              <FaSearch
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search by Student ID, Name, or Email…"
                value={filters.search}
                onChange={(e) => onFilterChange("search", e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 outline-none transition-all shadow-sm"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select
                value={filters.departmentId}
                onChange={(e) => onFilterChange("departmentId", e.target.value)}
                className="w-full pl-3.5 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={filters.programId}
                onChange={(e) => onFilterChange("programId", e.target.value)}
                disabled={!filters.departmentId}
                className="w-full pl-3.5 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">All Programs</option>
                {programs.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {[
                    "Student ID",
                    "Name & Contact",
                    "Program / Department",
                    "Challan Status",
                    "Admission Status",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] whitespace-nowrap bg-slate-50/80"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      {[...Array(6)].map((__, j) => (
                        <td key={j} className="px-6 py-4">
                          <div
                            className="h-4 bg-slate-100 rounded-lg animate-pulse"
                            style={{ width: `${60 + Math.random() * 30}%` }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : students.length > 0 ? (
                  students.map((student, idx) => {
                    const csc =
                      CHALLAN_STATUS_META[student.challanStatus] ||
                      CHALLAN_STATUS_META.not_generated;
                    const alc =
                      ADMISSION_STATUS_META[student.admissionLifecycleStatus] ||
                      ADMISSION_STATUS_META.active;
                    const isCancelled =
                      student.admissionLifecycleStatus === "cancelled_non_payment";

                    return (
                      <tr
                        key={student._id}
                        className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {student.studentId}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black text-white"
                              style={{ background: `hsl(${(idx * 43) % 360}, 60%, 55%)` }}
                            >
                              {(student.personalInfo?.fullName || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 leading-tight">
                                {student.personalInfo?.fullName || "N/A"}
                              </p>
                              <p className="text-xs text-slate-400 font-medium mt-0.5">
                                {student.personalInfo?.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-800 leading-tight">
                            {student.program?.name || "—"}
                          </p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {student.department?.name}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <button
                            onClick={() => setLifecycleStudent(student)}
                            title="View full challan & admission status"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-transform hover:scale-105 ${csc.cls}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${csc.dot}`} />
                            {csc.label}
                          </button>
                        </td>

                        <td className="px-6 py-4">
                          <button
                            onClick={() => setLifecycleStudent(student)}
                            title="View full challan & admission status"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-transform hover:scale-105 ${alc.cls}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${alc.dot}`} />
                            {alc.label}
                            {isCancelled && <FaUndo size={9} className="ml-0.5" />}
                          </button>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onStudentClick(student._id)}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm"
                            >
                              <FaEye size={11} /> Profile
                            </button>
                            <button
                              onClick={() => onPrintChallan(student)}
                              disabled={isPrinting}
                              title="Print this student's challan(s)"
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isPrinting ? (
                                <FaSpinner size={11} className="animate-spin" />
                              ) : (
                                <FaPrint size={11} />
                              )}
                              Print
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="inline-flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                          <FaSearch size={20} className="opacity-40" />
                        </div>
                        <p className="font-bold text-slate-600">No new admissions found</p>
                        <p className="text-sm">Try adjusting your filters or search terms.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-3">
              <p className="text-xs font-semibold text-slate-500">
                <span className="text-slate-800 font-black">{pagination.total}</span>{" "}
                new admission{pagination.total === 1 ? "" : "s"}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={pagination.current === 1}
                  onClick={() => onPageChange(pagination.current - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold shadow-sm"
                >
                  <FaChevronLeft size={10} />
                </button>
                <span className="text-xs font-bold text-slate-700 px-3">
                  Page {pagination.current} of {Math.max(1, pagination.pages)}
                </span>
                <button
                  disabled={pagination.current === pagination.pages}
                  onClick={() => onPageChange(pagination.current + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-bold shadow-sm"
                >
                  <FaChevronRight size={10} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewAdmissionsView;
