import React from "react";
import {
  Search,
  Users,
  GraduationCap,
  LayoutGrid,
  List,
  Phone,
  Mail,
  CalendarDays,
  ArrowRight,
  ChevronRight,
  AlertCircle,
  Layers,
  BookOpen,
  X,
} from "lucide-react";
import HodStudentProfileDrawer from "./HodStudentProfileDrawer";
import { StatusChip, StudentAvatar } from "./HodStudentBits";

const HeroStat = ({ icon, label, value }) => {
  const Icon = icon;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/15 px-4 py-3">
      <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-black leading-none">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-100 mt-1 truncate">
          {label}
        </p>
      </div>
    </div>
  );
};

const DirectoryStat = ({ icon, label, value }) => {
  const Icon = icon;
  return (
    <div className="flex min-h-[84px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">{value}</p>
        <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">{label}</p>
      </div>
    </div>
  );
};

const StudentCard = ({ student, onOpen, professional = false }) => (
  <button
    onClick={() => onOpen(student._id)}
    className={`group border bg-white p-4 text-left transition-colors ${professional ? "rounded-xl border-slate-200 hover:border-blue-300 hover:bg-blue-50/30" : "rounded-2xl border-slate-200/80 shadow-sm hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100/60"}`}
  >
    <div className="flex items-start gap-3">
      <StudentAvatar name={student.fullName} neutral={professional} />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold text-slate-900 transition-colors ${professional ? "group-hover:text-blue-700" : "group-hover:text-indigo-700"}`}>
          {student.fullName}
        </p>
        <p className="text-[11px] font-mono font-semibold text-slate-400 truncate mt-0.5">
          {student.studentId}
        </p>
      </div>
    </div>

    <div className="mt-4 space-y-1.5 text-xs font-medium text-slate-500">
      <p className="flex items-center gap-2 truncate">
        <CalendarDays size={13} className="text-slate-300 shrink-0" />
        {student.session?.name || "No session"}
      </p>
      <p className="flex items-center gap-2 truncate">
        <Phone size={13} className="text-slate-300 shrink-0" />
        {student.phone || "No phone on file"}
      </p>
    </div>

    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
      <StatusChip status={student.status} />
      <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all">
        View profile <ArrowRight size={12} />
      </span>
    </div>
  </button>
);

const StudentRow = ({ student, onOpen, professional = false }) => (
  <button
    onClick={() => onOpen(student._id)}
    className={`group flex w-full items-center gap-4 px-4 py-3 text-left transition-colors ${professional ? "hover:bg-blue-50/40" : "hover:bg-indigo-50/50"}`}
  >
    <StudentAvatar name={student.fullName} size="sm" neutral={professional} />
    <div className="min-w-0 flex-1">
      <p className={`truncate text-sm font-semibold text-slate-900 transition-colors ${professional ? "group-hover:text-blue-700" : "group-hover:text-indigo-700"}`}>
        {student.fullName}
      </p>
      <p className="text-[11px] font-mono font-semibold text-slate-400 truncate">
        {student.studentId}
      </p>
    </div>
    <span className="hidden md:block w-28 text-xs font-medium text-slate-500 truncate">
      {student.session?.name || "—"}
    </span>
    <span className="hidden md:flex items-center gap-1.5 w-36 text-xs font-medium text-slate-500 truncate">
      <Phone size={12} className="text-slate-300 shrink-0" />
      {student.phone || "—"}
    </span>
    <span className="hidden lg:flex items-center gap-1.5 w-56 text-xs font-medium text-slate-500 truncate">
      <Mail size={12} className="text-slate-300 shrink-0" />
      <span className="truncate">{student.email || "—"}</span>
    </span>
    <StatusChip status={student.status} />
    <ChevronRight
      size={16}
      className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0"
    />
  </button>
);

const GridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-4">
        <div className="flex gap-3">
          <div className="w-11 h-11 rounded-2xl bg-slate-200" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 rounded bg-slate-200 w-2/3" />
            <div className="h-2.5 rounded bg-slate-100 w-1/2" />
          </div>
        </div>
        <div className="mt-5 space-y-2">
          <div className="h-2.5 rounded bg-slate-100 w-3/4" />
          <div className="h-2.5 rounded bg-slate-100 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

const ErrorBox = ({ message }) => (
  <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-5 text-sm font-medium">
    <AlertCircle size={18} className="shrink-0 mt-0.5" />
    {message}
  </div>
);

const HodStudentsView = ({
  programs = [],
  departments = [],
  selectedDepartmentId,
  selectDepartment,
  isLoadingPrograms,
  programsErrorMessage,
  selectedProgramId,
  selectedProgram,
  selectProgram,
  departmentName,
  departmentTotal,
  maxProgramCount,

  searchQuery,
  setSearchQuery,
  totalStudents,
  activeStudentCount,
  visibleStudentCount,

  semesterGroups = [],
  semesterOptions = [],
  visibleGroups = [],
  activeSemesterKey,
  selectSemester,
  viewMode,
  setViewMode,
  isLoadingStudents,
  studentsErrorMessage,
  pagination = { page: 1, total: 0, totalPages: 1 },
  page,
  setPage,
  pageSize,
  setPageSize,

  selectedStudentId,
  openStudent,
  closeStudent,
  profile,
  isLoadingProfile,
  profileErrorMessage,
  profilePosition,
  profileTotal,
  goPrev,
  goNext,
  eyebrow = "Head of Department",
  heading = "Department Students",
  minimalHeader = false,
}) => {
  const isSearching = searchQuery.trim().length > 0;
  const showProgramUI = !isLoadingPrograms && !programsErrorMessage && programs.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero */}
        {minimalHeader ? (
          showProgramUI && (
            <section aria-label="Student directory summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <DirectoryStat icon={Users} label={departmentName === "All departments" ? "Students university-wide" : "Students in department"} value={departmentTotal} />
              <DirectoryStat icon={BookOpen} label="Academic programs" value={programs.length} />
              <DirectoryStat icon={GraduationCap} label="Selected program" value={totalStudents} />
              <DirectoryStat icon={Layers} label="Sections in use" value={semesterOptions.length} />
            </section>
          )
        ) : (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 text-white p-6 md:p-8 shadow-xl shadow-indigo-200/60">
          <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-28 left-1/3 w-64 h-64 rounded-full bg-white/5" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-2xl bg-white/15 ring-1 ring-white/25 flex items-center justify-center">
                <GraduationCap size={22} />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-200">
                  {eyebrow}
                </p>
                <h1 className="text-2xl md:text-3xl font-black leading-tight">
                  {heading}
                </h1>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-indigo-100 max-w-xl">
              {departmentName
                ? `${departmentName} — browse every student by program and semester, and open any profile in one click.`
                : "Browse every student by program and semester, and open any profile in one click."}
            </p>

            {showProgramUI && (
              <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
                <HeroStat
                  icon={Users}
                  label={departmentName === "All departments" ? "Students university-wide" : "Students in department"}
                  value={departmentTotal}
                />
                <HeroStat icon={BookOpen} label="Programs" value={programs.length} />
                <HeroStat
                  icon={GraduationCap}
                  label="In this program"
                  value={totalStudents}
                />
                <HeroStat icon={Layers} label="Sections in use" value={semesterGroups.length} />
              </div>
            )}
          </div>
        </div>
        )}

        {isLoadingPrograms ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-200/70" />
            ))}
          </div>
        ) : programsErrorMessage ? (
          <ErrorBox message={programsErrorMessage} />
        ) : programs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <BookOpen size={24} />
            </div>
            <p className="font-bold text-slate-700">No programs found for your class</p>
          </div>
        ) : (
          <>
            {/* Program cards */}
            {minimalHeader ? (
              <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                <div>
                  <label htmlFor="vc-student-department" className="mb-2 block text-xs font-semibold text-slate-600">Class</label>
                  <select id="vc-student-department" value={selectedDepartmentId} onChange={(event) => selectDepartment(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                    <option value="all">All classes</option>
                    {departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="vc-student-program" className="mb-2 block text-xs font-semibold text-slate-600">Academic program</label>
                  <select id="vc-student-program" value={selectedProgramId} onChange={(event) => selectProgram(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                    {programs.map((program) => <option key={program._id} value={program._id}>{program.name} ({program.studentCount} students)</option>)}
                  </select>
                </div>
              </div>
            ) : (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
                Programs
              </p>
              <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1">
                {programs.map((p) => {
                  const active = p._id === selectedProgramId;
                  const pct = maxProgramCount ? (p.studentCount / maxProgramCount) * 100 : 0;
                  return (
                    <button
                      key={p._id}
                      onClick={() => selectProgram(p._id)}
                      className={`min-w-[230px] text-left p-4 rounded-2xl border transition-all duration-200 ${
                        minimalHeader
                          ? active
                            ? "bg-blue-50/30 border-blue-500 ring-1 ring-blue-100"
                            : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                          : active
                            ? "bg-white border-indigo-500 ring-4 ring-indigo-500/10 shadow-lg shadow-indigo-100"
                            : "bg-white/70 border-slate-200 hover:bg-white hover:border-indigo-300 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {p.code || "PROGRAM"}
                        </span>
                        {active && <span className={`h-2 w-2 rounded-full ${minimalHeader ? "bg-blue-600" : "bg-indigo-500"}`} />}
                      </div>
                      <p className={`mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm text-slate-900 ${minimalHeader ? "font-semibold" : "font-black"}`}>
                        {p.name}
                      </p>
                      <div className="flex items-end justify-between mt-3">
                        <span className={`text-3xl text-slate-900 leading-none ${minimalHeader ? "font-bold" : "font-black"}`}>
                          {p.studentCount}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">students</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 mt-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${minimalHeader ? "bg-blue-600" : "bg-gradient-to-r from-indigo-500 to-violet-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            )}

            {/* Toolbar */}
            <div className={`border border-slate-200 bg-white p-4 space-y-4 ${minimalHeader ? "rounded-xl" : "rounded-2xl shadow-sm"}`}>
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${selectedProgram?.name || "students"} by name, registration no, phone or email…`}
                    className={`w-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-sm font-medium outline-none transition-all focus:bg-white ${minimalHeader ? "rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100" : "rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"}`}
                  />
                  {isSearching && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center"
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                    {isSearching || activeSemesterKey !== "all"
                      ? `Showing ${visibleStudentCount} of ${totalStudents}`
                      : `${totalStudents} students · ${activeStudentCount} active`}
                  </span>
                  <div className={`flex bg-slate-100 p-1 ${minimalHeader ? "rounded-lg" : "rounded-xl"}`}>
                    {[
                      { mode: "grid", icon: LayoutGrid, label: "Grid view" },
                      { mode: "list", icon: List, label: "List view" },
                    ].map(({ mode, icon, label }) => {
                      const ModeIcon = icon;
                      return (
                        <button
                          key={mode}
                          onClick={() => setViewMode(mode)}
                          aria-label={label}
                          title={label}
                          className={`w-9 h-8 rounded-lg flex items-center justify-center transition-all ${
                            viewMode === mode
                              ? `bg-white shadow-sm ${minimalHeader ? "text-blue-700" : "text-indigo-600"}`
                              : "text-slate-400 hover:text-slate-700"
                          }`}
                        >
                          <ModeIcon size={16} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Semester chips */}
              {minimalHeader && semesterOptions.length > 0 ? (
                <div className="max-w-sm">
                  <label htmlFor="vc-student-semester" className="mb-2 block text-xs font-semibold text-slate-600">Section</label>
                  <select id="vc-student-semester" value={activeSemesterKey} onChange={(event) => selectSemester(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                    <option value="all">All semesters ({totalStudents})</option>
                    {semesterOptions.map((semester) => <option key={semester._id} value={semester._id}>{semester.label} ({semester.count})</option>)}
                  </select>
                </div>
              ) : semesterGroups.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[
                    {
                      key: "all",
                      label: "All sections",
                      count: semesterGroups.reduce((n, g) => n + g.students.length, 0),
                    },
                    ...semesterGroups.map((g) => ({
                      key: g.key,
                      label: g.label,
                      count: g.students.length,
                    })),
                  ].map((chip) => {
                    const active = chip.key === activeSemesterKey;
                    return (
                      <button
                        key={chip.key}
                        onClick={() => selectSemester(chip.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                          active
                            ? `${minimalHeader ? "bg-blue-600" : "bg-indigo-600 shadow-md shadow-indigo-200"} text-white`
                            : `bg-slate-100 text-slate-600 ${minimalHeader ? "hover:bg-blue-50 hover:text-blue-700" : "hover:bg-indigo-50 hover:text-indigo-700"}`
                        }`}
                      >
                        {chip.label}
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                            active ? "bg-white/25 text-white" : "bg-white text-slate-500"
                          }`}
                        >
                          {chip.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Students */}
            {isLoadingStudents ? (
              <GridSkeleton />
            ) : studentsErrorMessage ? (
              <ErrorBox message={studentsErrorMessage} />
            ) : visibleGroups.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-14 text-center shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Users size={24} />
                </div>
                <p className="font-bold text-slate-700">
                  {isSearching ? "No students match your search" : "No students in this program yet"}
                </p>
                {isSearching && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-3 text-sm font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                {visibleGroups.map((group) => (
                  <section key={group.key}>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className={`text-lg text-slate-900 ${minimalHeader ? "font-semibold" : "font-black"}`}>{group.label}</h2>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${minimalHeader ? "bg-blue-50 text-blue-700" : "bg-indigo-50 text-indigo-700"}`}>
                        {group.students.length} student{group.students.length === 1 ? "" : "s"}
                      </span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>

                    {viewMode === "grid" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {group.students.map((s) => (
                          <StudentCard key={s._id} student={s} onOpen={openStudent} professional={minimalHeader} />
                        ))}
                      </div>
                    ) : (
                      <div className={`divide-y divide-slate-100 overflow-hidden border border-slate-200 bg-white ${minimalHeader ? "rounded-xl" : "rounded-2xl shadow-sm"}`}>
                        {group.students.map((s) => (
                          <StudentRow key={s._id} student={s} onOpen={openStudent} professional={minimalHeader} />
                        ))}
                      </div>
                    )}
                  </section>
                ))}
                {pagination.total > 0 && (
                  <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-medium text-slate-500">
                      Showing {(pagination.page - 1) * pageSize + 1}–{Math.min(pagination.page * pageSize, pagination.total)} of {pagination.total} students
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <select aria-label="Students per page" value={pageSize} onChange={(event) => setPageSize(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400">
                        {[10, 20, 50].map((size) => <option key={size} value={size}>{size} per page</option>)}
                      </select>
                      <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
                      <span className="px-2 text-xs font-semibold text-slate-600">Page {pagination.page} of {pagination.totalPages}</span>
                      <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <HodStudentProfileDrawer
        isOpen={!!selectedStudentId}
        onClose={closeStudent}
        profile={profile}
        isLoading={isLoadingProfile}
        errorMessage={profileErrorMessage}
        position={profilePosition}
        total={profileTotal}
        onPrev={goPrev}
        onNext={goNext}
      />
    </div>
  );
};

export default HodStudentsView;
