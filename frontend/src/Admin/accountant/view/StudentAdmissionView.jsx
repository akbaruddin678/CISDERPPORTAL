import React, { useState } from "react";
import {
  Search,
  Calendar,
  Eye,
  X,
  User,
  Phone,
  CreditCard,
  Building,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Building2,
  CheckCircle2,
  Printer,
  FileText,
  Ban,
  AlertTriangle,
  FileDown,
  Sheet,
} from "lucide-react";
import StudentLifecyclePanel from "../../Admission/view/StudentLifecyclePanel";

// One consistent, borderless badge style used everywhere in this screen —
// soft tinted background, medium weight, normal case.
const Badge = ({ label, tone = "slate" }) => {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    slate: "bg-slate-100 text-slate-600",
    sky: "bg-sky-50 text-sky-700",
    indigo: "bg-indigo-50 text-indigo-700",
  };
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium ${tones[tone] || tones.slate}`}>
      {label}
    </span>
  );
};

const CHALLAN_STATUS_META = {
  paid: { label: "Paid", tone: "emerald" },
  pending: { label: "Pending", tone: "amber" },
  overdue: { label: "Overdue", tone: "rose" },
  not_generated: { label: "Not Generated", tone: "slate" },
};

const ADMISSION_LIFECYCLE_META = {
  active: { label: "Active", tone: "emerald" },
  cancelled_non_payment: { label: "Cancelled", tone: "rose" },
  re_admitted: { label: "Re-Admitted", tone: "sky" },
};

const StudentDetailsModal = ({ student, onClose }) => {
  if (!student) return null;

  const fatherName =
    student.familyInfo?.fatherName || student.personalInfo?.fatherName || "N/A";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-base text-slate-800 flex items-center gap-2">
            <User className="text-indigo-500" size={18} />
            Student Details
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-semibold">
              {student.personalInfo?.fullName?.charAt(0) || "?"}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {student.personalInfo?.fullName || "N/A"}
              </h2>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                Reg No: {student.studentId}
              </p>
            </div>
            <div className="ml-auto">
              <Badge label={student.status} tone="emerald" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Personal Information
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-slate-600">
                  <User size={15} className="text-slate-400" />
                  <span className="w-24 text-slate-500">Father Name</span>
                  <span className="font-medium text-slate-900">{fatherName}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <CreditCard size={15} className="text-slate-400" />
                  <span className="w-24 text-slate-500">CNIC</span>
                  <span className="font-mono font-medium text-slate-900">
                    {student.personalInfo?.cnic || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone size={15} className="text-slate-400" />
                  <span className="w-24 text-slate-500">Phone</span>
                  <span className="font-mono font-medium text-slate-900">
                    {student.personalInfo?.phone || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Academic Information
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-slate-600">
                  <Building size={15} className="text-slate-400" />
                  <span className="w-24 text-slate-500">Department</span>
                  <span className="font-medium text-slate-900">
                    {student.departmentId?.name || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Building size={15} className="text-slate-400" />
                  <span className="w-24 text-slate-500">Program</span>
                  <span className="font-medium text-slate-900">
                    {student.programId?.name || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar size={15} className="text-slate-400" />
                  <span className="w-24 text-slate-500">Date Added</span>
                  <span className="font-medium text-slate-900">
                    {new Date(student.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <MessageSquare size={13} /> Remarks & Notes
            </h4>
            <div className="bg-amber-50/60 border border-amber-100 p-3.5 rounded-xl text-sm text-amber-900">
              {student.remark || (
                <span className="text-amber-700/50 italic">
                  No remarks added during admission.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white font-medium text-sm rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Same four mutually-exclusive states used on the Admission module's own
// pipeline (Accepted / Challan Generated / Fee Paid / Fee Overdue) — every
// student on this screen is already accepted, so "state" here is purely
// about where their fee challan stands.
const STATE_TABS = [
  { key: "all", label: "All" },
  { key: "not_generated", label: "Not Generated", icon: Ban, color: "#64748b" },
  { key: "pending", label: "Challan Generated", icon: FileText, color: "#2563eb" },
  { key: "paid", label: "Fee Paid", icon: CheckCircle2, color: "#059669" },
  { key: "overdue", label: "Fee Overdue", icon: AlertTriangle, color: "#be123c" },
];

const StudentAdmissionView = (props) => {
  const {
    stateFilter = "all",
    handleStateFilterChange = () => {},
    stateCounts = { all: 0, not_generated: 0, pending: 0, paid: 0, overdue: 0 },
    filters,
    handleFilterChange,
    departments,
    programs,
    studentsList,
    pagination,
    handlePageChange,
    isLoading,
    selectedStudent,
    openStudentDetails,
    closeStudentDetails,
    reAdmitStudent = () => {},
    isReAdmitting = false,
    printChallan = () => {},
    isPrinting = false,
    exportSectionPDF = () => {},
    exportSectionExcel = () => {},
    isExporting = false,
  } = props;

  const [lifecycleStudent, setLifecycleStudent] = useState(null);

  const inputCls =
    "text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-300 text-slate-700 bg-slate-50 focus:bg-white transition-colors";

  const activeStateLabel = STATE_TABS.find((t) => t.key === stateFilter)?.label || "All";

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col p-6 gap-5 animate-in fade-in duration-300">
      <StudentDetailsModal student={selectedStudent} onClose={closeStudentDetails} />
      <StudentLifecyclePanel
        student={lifecycleStudent}
        onClose={() => setLifecycleStudent(null)}
        onReAdmit={reAdmitStudent}
        isReAdmitting={isReAdmitting}
      />

      {/* Header + Filters — one top bar */}
      <div className="flex flex-col gap-4 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Building2 size={16} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">New Admissions</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Semester 1 enrollments from the Admission Process
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">From</label>
              <input
                type="date"
                className={`px-2.5 py-1.5 ${inputCls}`}
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">To</label>
              <input
                type="date"
                className={`px-2.5 py-1.5 ${inputCls}`}
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
            <select
              className={`px-2.5 py-1.5 w-36 ${inputCls}`}
              value={filters.departmentId}
              onChange={(e) => handleFilterChange("departmentId", e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
            <select
              className={`px-2.5 py-1.5 w-36 disabled:bg-slate-100 disabled:text-slate-400 ${inputCls}`}
              value={filters.programId}
              disabled={!filters.departmentId}
              onChange={(e) => handleFilterChange("programId", e.target.value)}
            >
              <option value="">All Programs</option>
              {programs.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, reg no, CNIC…"
                className={`w-56 pl-9 pr-3.5 py-2 ${inputCls}`}
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden relative min-h-0">
        {/* State Tabs + Export */}
        <div className="flex items-center justify-between gap-2 px-3 pt-2 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto">
            {STATE_TABS.map((tab) => {
              const isActive = stateFilter === tab.key;
              const count = stateCounts[tab.key] ?? 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleStateFilterChange(tab.key)}
                  className={`relative px-3.5 py-2.5 text-sm font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    isActive ? "text-indigo-700" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.icon && (
                    <tab.icon size={14} style={{ color: isActive ? "#4338ca" : tab.color }} />
                  )}
                  {tab.label}
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[11px] font-medium ${
                      isActive ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                  {isActive && (
                    <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-indigo-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 pb-2 shrink-0">
            <button
              onClick={() => exportSectionPDF(activeStateLabel)}
              disabled={isExporting}
              title={`Download "${activeStateLabel}" as PDF`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <FileDown size={14} /> PDF
            </button>
            <button
              onClick={() => exportSectionExcel(activeStateLabel)}
              disabled={isExporting}
              title={`Download "${activeStateLabel}" as Excel`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <Sheet size={14} /> Excel
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[820px]">
            <thead className="bg-slate-50/80 text-slate-400 font-medium text-[11px] uppercase tracking-wide sticky top-0 border-b border-slate-100 z-10">
              <tr>
                <th className="px-4 py-3">Date Added</th>
                <th className="px-4 py-3">Reg No</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Program</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Remarks</th>
                <th className="px-4 py-3 text-center">Challan</th>
                <th className="px-4 py-3 text-center">Admission</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <Loader2 size={22} className="animate-spin mx-auto text-indigo-500 mb-2" />
                    <p className="text-slate-400 text-sm">Fetching admission records…</p>
                  </td>
                </tr>
              ) : studentsList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <User size={36} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400 text-sm">
                      {stateFilter === "all"
                        ? "No Semester 1 students found."
                        : `No students in "${activeStateLabel}" for this stage.`}
                    </p>
                  </td>
                </tr>
              ) : (
                studentsList.map((student) => {
                  const phone = student.personalInfo?.phone || "-";
                  const dateAdded = new Date(student.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                  const programName = student.programId?.name || student.program?.name || "-";
                  const stageLabel = `Sem ${student.semesterId?.number || 1}`;

                  const challanMeta = CHALLAN_STATUS_META[student.challanStatus] || CHALLAN_STATUS_META.not_generated;
                  const lifecycleMeta = ADMISSION_LIFECYCLE_META[student.admissionLifecycleStatus] || ADMISSION_LIFECYCLE_META.active;

                  return (
                    <tr key={student._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">{dateAdded}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs font-medium text-indigo-600">
                        {student.studentId}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">
                        {student.personalInfo?.fullName || "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 text-xs">{programName}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge label={stageLabel} tone="indigo" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-slate-500">{phone}</td>
                      <td className="px-4 py-3 whitespace-nowrap max-w-[150px] truncate text-xs text-slate-500">
                        {student.remark ? (
                          <span className="flex items-center gap-1.5 text-amber-700">
                            <MessageSquare size={12} /> Has remark
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button onClick={() => setLifecycleStudent(student)} title="View full challan & admission status">
                          <Badge label={challanMeta.label} tone={challanMeta.tone} />
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button onClick={() => setLifecycleStudent(student)} title="View full challan & admission status">
                          <Badge label={lifecycleMeta.label} tone={lifecycleMeta.tone} />
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openStudentDetails(student)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => printChallan(student)}
                            disabled={isPrinting}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Print this student's challan(s)"
                          >
                            <Printer size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500">
            Total: <span className="font-medium text-slate-700">{pagination.total}</span>
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={pagination.current === 1 || isLoading}
              onClick={() => handlePageChange(pagination.current - 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-medium text-slate-600 px-3">
              Page {pagination.current} of {Math.max(1, pagination.pages)}
            </span>
            <button
              disabled={pagination.current === pagination.pages || pagination.pages === 0 || isLoading}
              onClick={() => handlePageChange(pagination.current + 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAdmissionView;
