import React from "react";
import {
  FaUsers,
  FaUserCheck,
  FaGraduationCap,
  FaSearch,
  FaDownload,
  FaEye,
  FaUniversity,
  FaTimes,
  FaSpinner,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaTrash,
  FaUserSlash,
  FaListUl,
} from "react-icons/fa";
import DeleteStudentModal from "./studentManagement/DeleteStudentModal";

// One consistent, borderless badge — soft tinted background, medium
// weight, normal case — used for both student Status and (implicitly)
// anywhere else this screen needs a small label.
const Badge = ({ label, tone = "slate" }) => {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    indigo: "bg-indigo-50 text-indigo-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${tones[tone] || tones.slate}`}>
      {label}
    </span>
  );
};

const STATUS_TONE = {
  active: "emerald",
  graduated: "indigo",
  suspended: "rose",
  withdrawn: "amber",
};

const StudentManagementView = ({
  students,
  loading,
  filters = {},
  pagination = {},
  catalogData = {},
  stats = {},
  onFilterChange,
  onSearch,
  onStudentClick,
  onExport,
  isExporting,

  activeView,
  setActiveView,
  withdrawnStudents = [],
  isWithdrawnLoading,
  withdrawnFilters = {},
  withdrawnPagination = {},
  searchWithdrawn,
  setWithdrawnPage,

  selectedIds,
  toggleSelect,
  toggleSelectAll,
  allVisibleSelected,

  deleteTarget,
  deleteRemark,
  setDeleteRemark,
  deletePassword,
  setDeletePassword,
  openDeleteModal,
  openBulkDeleteModal,
  closeDeleteModal,
  confirmDelete,
  isDeleting,
}) => {
  const handleSearchChange = (e) => onSearch(e.target.value);
  const handleFilterChange = (key, value) =>
    onFilterChange({ ...filters, [key]: value });

  const clearFilters = () => {
    onFilterChange({
      search: "",
      departmentId: "",
      programId: "",
      semesterId: "",
      sessionId: "",
      status: "",
      page: 1,
    });
  };

  const statCards = [
    { label: "Total Enrolled", value: stats.total, icon: FaUsers, bg: "#eef2ff", fg: "#4338ca" },
    { label: "Active", value: stats.active, icon: FaUserCheck, bg: "#ecfdf5", fg: "#047857" },
    { label: "Graduated", value: stats.graduated, icon: FaGraduationCap, bg: "#f5f3ff", fg: "#6d28d9" },
    { label: "Departments", value: stats.byDepartment?.length || 0, icon: FaUniversity, bg: "#fffbeb", fg: "#b45309" },
  ];

  const inputCls =
    "text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-300 text-slate-700 bg-slate-50 focus:bg-white transition-colors";

  const SelectField = ({ label, value, onChange, disabled, children }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium text-slate-400 ml-0.5">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full appearance-none pl-3.5 pr-8 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed ${inputCls}`}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg width="10" height="6" fill="none" viewBox="0 0 10 6">
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );

  const selectedCount = selectedIds?.size || 0;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-[1440px] mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Student Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Search, edit, and manage every registered student.
            </p>
          </div>
          <button
            onClick={onExport}
            disabled={isExporting || loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm"
          >
            {isExporting ? <FaSpinner className="animate-spin" size={13} /> : <FaDownload size={13} />}
            {isExporting ? "Exporting…" : "Export Excel"}
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <s.icon size={16} style={{ color: s.fg }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 truncate">{s.label}</p>
                <p className="text-lg font-semibold text-slate-900 leading-tight mt-0.5">{s.value ?? "—"}</p>
              </div>
            </div>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveView("active")}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
              activeView === "active" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <FaListUl size={12} /> Students
          </button>
          <button
            onClick={() => setActiveView("withdrawn")}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
              activeView === "withdrawn" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <FaUserSlash size={12} /> Withdrawn
          </button>
        </div>

        {activeView === "withdrawn" ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-medium text-slate-700 text-sm">Withdrawn Students</h2>
            <p className="text-xs text-slate-400 mt-0.5">Students who have left — kept separate from the active directory.</p>
          </div>
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="relative max-w-sm">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search by Student ID or Name…"
                value={withdrawnFilters.search || ""}
                onChange={(e) => searchWithdrawn(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 ${inputCls}`}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[760px]">
              <thead className="bg-slate-50/80 text-slate-400 font-medium text-[11px] uppercase tracking-wide border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Program / Department</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isWithdrawnLoading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <FaSpinner className="animate-spin mx-auto text-indigo-500 mb-2" size={20} />
                      <p className="text-slate-400 text-sm">Loading withdrawn students…</p>
                    </td>
                  </tr>
                ) : withdrawnStudents.length > 0 ? (
                  withdrawnStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs font-medium text-indigo-600">
                        {student.studentId}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-800">{student.personalInfo?.fullName || "N/A"}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{student.personalInfo?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-700 leading-tight">{student.program?.name || "—"}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{student.department?.name}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="text-xs text-slate-600 truncate" title={student.remark || ""}>
                          {student.remark || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onStudentClick(student._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          >
                            <FaEye size={11} /> View
                          </button>
                          <button
                            onClick={() => openDeleteModal(student)}
                            title="Delete this student"
                            className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <FaUserSlash size={22} className="mx-auto text-slate-200 mb-3" />
                      <p className="text-slate-500 text-sm font-medium">No withdrawn students</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {withdrawnPagination.total > 0 && (
            <div className="px-5 py-3.5 border-t border-slate-100 flex justify-between items-center gap-3">
              <p className="text-xs text-slate-500">
                Total: <span className="font-medium text-slate-700">{withdrawnPagination.total}</span> withdrawn student(s)
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={withdrawnPagination.page === 1}
                  onClick={() => setWithdrawnPage(withdrawnPagination.page - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FaChevronLeft size={11} />
                </button>
                <span className="text-xs font-medium text-slate-600 px-2">
                  Page {withdrawnPagination.page} of {Math.max(1, withdrawnPagination.pages)}
                </span>
                <button
                  disabled={withdrawnPagination.page === withdrawnPagination.pages}
                  onClick={() => setWithdrawnPage(withdrawnPagination.page + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FaChevronRight size={11} />
                </button>
              </div>
            </div>
          )}
        </div>
        ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Panel Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <FaFilter size={12} className="text-slate-400" />
              <h2 className="font-medium text-slate-700 text-sm">Filters</h2>
            </div>
            <div className="flex items-center gap-2">
              {selectedCount > 0 && (
                <button
                  onClick={openBulkDeleteModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-100 transition-colors"
                >
                  <FaTrash size={10} /> Delete Selected ({selectedCount})
                </button>
              )}
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <FaTimes size={10} /> Clear
              </button>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="p-5 space-y-3 bg-slate-50/50 border-b border-slate-100">
            <div className="relative">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search by Student ID, Name, or Email…"
                value={filters.search}
                onChange={handleSearchChange}
                className={`w-full pl-10 pr-4 py-2.5 ${inputCls}`}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <SelectField label="Department" value={filters.departmentId} onChange={(e) => handleFilterChange("departmentId", e.target.value)}>
                <option value="">All Departments</option>
                {catalogData.departments?.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </SelectField>

              <SelectField label="Program" value={filters.programId} disabled={!filters.departmentId} onChange={(e) => handleFilterChange("programId", e.target.value)}>
                <option value="">All Programs</option>
                {catalogData.programs?.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </SelectField>

              <SelectField label="Semester" value={filters.semesterId} disabled={!filters.programId} onChange={(e) => handleFilterChange("semesterId", e.target.value)}>
                <option value="">All Semesters</option>
                {catalogData.semesters?.map((s) => <option key={s._id} value={s._id}>Semester {s.number}</option>)}
              </SelectField>

              <SelectField label="Session" value={filters.sessionId} onChange={(e) => handleFilterChange("sessionId", e.target.value)}>
                <option value="">All Sessions</option>
                {catalogData.sessions?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </SelectField>

              <SelectField label="Status" value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)}>
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="graduated">Graduated</option>
                <option value="suspended">Suspended</option>
              </SelectField>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[880px]">
              <thead className="bg-slate-50/80 text-slate-400 font-medium text-[11px] uppercase tracking-wide border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Name &amp; Contact</th>
                  <th className="px-4 py-3">Program / Department</th>
                  <th className="px-4 py-3">Session · Semester</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((__, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 bg-slate-100 rounded-lg animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : students.length > 0 ? (
                  students.map((student, idx) => {
                    const isSelected = selectedIds?.has(student._id);
                    return (
                      <tr key={student._id} className={`transition-colors ${isSelected ? "bg-indigo-50/40" : "hover:bg-slate-50/70"}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(student._id)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-xs font-medium text-indigo-600">
                          {student.studentId}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-white"
                              style={{ background: `hsl(${(idx * 43) % 360}, 55%, 55%)` }}
                            >
                              {(student.personalInfo?.fullName || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800 leading-tight">
                                {student.personalInfo?.fullName || "N/A"}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">{student.personalInfo?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-700 leading-tight">{student.program?.name || "—"}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{student.department?.name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-600">{student.session?.name || "—"}</p>
                          {student.semester?.number && (
                            <span className="mt-1 inline-block">
                              <Badge label={`Sem ${student.semester.number}`} tone="slate" />
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            label={student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : "N/A"}
                            tone={STATUS_TONE[student.status] || "slate"}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onStudentClick(student._id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                            >
                              <FaEye size={11} /> View
                            </button>
                            <button
                              onClick={() => openDeleteModal(student)}
                              title="Delete this student"
                              className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <FaSearch size={22} className="mx-auto text-slate-200 mb-3" />
                      <p className="text-slate-500 text-sm font-medium">No students found</p>
                      <p className="text-slate-400 text-xs mt-0.5">Try adjusting your filters or search terms.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
              <p className="text-xs text-slate-500">
                Showing <span className="font-medium text-slate-700">{(pagination.page - 1) * pagination.limit + 1}</span> –{" "}
                <span className="font-medium text-slate-700">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{" "}
                <span className="font-medium text-slate-700">{pagination.total}</span> students
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => onFilterChange({ ...filters, page: pagination.page - 1 })}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FaChevronLeft size={11} />
                </button>

                {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                  let start = Math.max(1, pagination.page - 2);
                  if (pagination.pages - start < 5) start = Math.max(1, pagination.pages - 4);
                  const pg = start + i;
                  if (pg > pagination.pages) return null;
                  return (
                    <button
                      key={pg}
                      onClick={() => onFilterChange({ ...filters, page: pg })}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                        pagination.page === pg ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}

                <button
                  disabled={pagination.page === pagination.pages}
                  onClick={() => onFilterChange({ ...filters, page: pagination.page + 1 })}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FaChevronRight size={11} />
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      <DeleteStudentModal
        open={Boolean(deleteTarget)}
        mode={deleteTarget?.mode}
        targetName={deleteTarget?.mode === "single" ? (deleteTarget.student.personalInfo?.fullName || deleteTarget.student.studentId) : ""}
        count={deleteTarget?.mode === "bulk" ? deleteTarget.count : 0}
        remark={deleteRemark}
        setRemark={setDeleteRemark}
        password={deletePassword}
        setPassword={setDeletePassword}
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default StudentManagementView;
