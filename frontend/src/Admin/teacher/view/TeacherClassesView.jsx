import React from "react";
import {
  ArrowLeft, BookOpenCheck, CalendarDays, CheckSquare, GraduationCap,
  Plus, Paperclip, ChevronRight, ClipboardList,
  History, Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import StateCard from "../components/StateCard";

const TABS = [
  { key: "lectures", label: "Lectures", icon: CalendarDays },
  { key: "assignments", label: "Assignments", icon: ClipboardList },
  { key: "attendance", label: "Attendance", icon: CheckSquare },
  { key: "exam", label: "Exam Marks", icon: GraduationCap },
];

// Single accent for every tab's active state (previously 5 different colors).
const TAB_ACTIVE_CLASS = "bg-indigo-600 text-white shadow-sm";

// --- MAIN COMPONENT ---
const TeacherClassesView = ({
  courses = [],
  activeCourses = [],
  historyCourses = [],
  isFetchingCourses = false,
  isCoursesError = false,
  coursesErrorMessage = "Failed to load your assigned courses.",
  refetchCourses = () => {},
  selectedCourseId = null,
  setSelectedCourseId = () => {},
  currentCourse = {},
  activeTab = "lectures",
  setActiveTab = () => {},
  groupedLectures = {},
  sortedWeeks = [],
  isFetchingLectures = false,
  // Embedded module JSX passed in from the container
  attendanceModule = null,
  marksModule = null,
  assignmentsModule = null,
}) => {
  const navigate = useNavigate();

  // ── COURSE PICKER ─────────────────────────────────────────────────────────
  if (!selectedCourseId) {
    const renderCourseCard = (course) => (
      <div
        key={course.id}
        onClick={() => setSelectedCourseId(course.id)}
        className={`relative bg-white rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group overflow-hidden ${
          course.isActive ? "border-slate-200 hover:border-blue-300" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <div className={`h-1 w-full ${course.isActive ? "bg-emerald-500" : "bg-slate-200"}`} />
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="w-11 h-11 flex-shrink-0 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <BookOpenCheck size={22} />
            </div>
            {course.isActive ? (
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex-shrink-0">
                <Sparkles size={11} /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide bg-slate-100 text-slate-500 px-2 py-1 rounded-full flex-shrink-0">
                <History size={11} /> History
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-slate-800 leading-snug">{course.subject}</h3>
          <p className="text-xs font-bold text-slate-400 mt-0.5">{course.code}</p>

          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">{course.program}</span>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{course.semester}</span>
            {course.section && (
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Sec {course.section}</span>
            )}
          </div>
          <p className="text-slate-400 font-medium text-xs mt-2.5">{course.session}</p>

          <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-slate-600 font-semibold text-sm">Open Dashboard</span>
            <ArrowLeft size={16} className="text-slate-400 group-hover:text-blue-600 rotate-180 transition-colors" />
          </div>
        </div>
      </div>
    );

    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8 lg:p-12 font-sans w-full">
        <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600 flex-shrink-0">
              <ArrowLeft size={22} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <BookOpenCheck size={22} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">My Classes & Schedule</h1>
              <p className="text-slate-500 text-sm sm:text-base">Select a course to view lectures, attendance, and exams.</p>
            </div>
          </div>

          {isFetchingCourses ? (
            <StateCard variant="loading" title="Loading your assigned courses…" />
          ) : isCoursesError ? (
            <StateCard
              variant="error"
              icon={BookOpenCheck}
              title="Couldn't load your courses"
              description={coursesErrorMessage}
              action={
                <button
                  onClick={refetchCourses}
                  className="mt-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors text-sm"
                >
                  Try Again
                </button>
              }
            />
          ) : courses.length === 0 ? (
            <StateCard
              icon={BookOpenCheck}
              title="No courses available"
              description="You are not assigned to any courses yet."
            />
          ) : (
            <>
              {/* Current / Active Session */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={17} className="text-emerald-600" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">Current Session</h2>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                    {activeCourses.length}
                  </span>
                </div>
                {activeCourses.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 mb-8">
                    <p className="text-slate-500 text-sm">No courses assigned in the latest session yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10">
                    {activeCourses.map(renderCourseCard)}
                  </div>
                )}
              </div>

              {/* History / Past Sessions */}
              {historyCourses.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <History size={17} className="text-slate-500" />
                    <h2 className="text-base sm:text-lg font-bold text-slate-800">History (Past Sessions)</h2>
                    <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                      {historyCourses.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 opacity-90">
                    {historyCourses.map(renderCourseCard)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── COURSE DASHBOARD ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 lg:p-12 font-sans w-full">
      <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">

        {/* Control panel: course header + tab bar in one cohesive card */}
        <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className={`h-1 w-full ${currentCourse?.isActive ? "bg-gradient-to-r from-emerald-400 to-indigo-500" : "bg-slate-200"}`} />
          <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
            <button
              onClick={() => setSelectedCourseId(null)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 flex-shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 font-black text-lg">
              {(currentCourse?.subject || "C").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">{currentCourse?.subject || "Course"}</h1>
                {currentCourse?.isActive ? (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex-shrink-0">
                    <Sparkles size={10} /> Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full flex-shrink-0">
                    <History size={10} /> History
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm font-medium truncate">
                {currentCourse?.program || "Program"} · {currentCourse?.semester || "Semester"}
                {currentCourse?.session ? ` · ${currentCourse.session}` : ""}
              </p>
            </div>
          </div>

          {/* Tab bar — wraps into a compact grid on mobile, single row on desktop */}
          <div className="border-t border-slate-100 p-2 sm:p-3">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-2.5 rounded-xl font-semibold text-[11px] sm:text-sm transition-colors sm:flex-1 sm:min-w-[130px] ${
                      activeTab === tab.key ? TAB_ACTIVE_CLASS : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-center leading-tight">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── LECTURES TAB ──────────────────────────────────────────────── */}
        {activeTab === "lectures" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <CalendarDays size={17} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">Weekly Lecture Logs</h2>
                  {sortedWeeks?.length > 0 && (
                    <p className="text-xs text-slate-400 font-semibold">
                      {sortedWeeks.length} week{sortedWeeks.length === 1 ? "" : "s"} logged
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => navigate(`/teacher/lectures/new?courseId=${selectedCourseId}`)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm shadow-sm"
              >
                <Plus size={16} /> Add Lecture Note
              </button>
            </div>

            {isFetchingLectures ? (
              <StateCard variant="loading" size="sm" title="Loading lectures…" />
            ) : !sortedWeeks || sortedWeeks.length === 0 ? (
              <StateCard
                icon={BookOpenCheck}
                title="No lectures recorded yet"
                description='Click "Add Lecture Note" to begin.'
              />
            ) : (
              <div className="space-y-4">
                {sortedWeeks.map((week, weekIdx) => (
                  <div key={week} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2.5 bg-slate-50 px-5 py-3 border-b border-slate-100">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center flex-shrink-0">
                        {weekIdx + 1}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-800">{week}</h3>
                      <span className="ml-auto text-[11px] font-bold text-slate-400">
                        {groupedLectures[week]?.length || 0} lecture{(groupedLectures[week]?.length || 0) === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {groupedLectures[week]?.map((lecture) => (
                        <div
                          key={lecture.id}
                          onClick={() => navigate(`/teacher/lectures/${lecture.id}`)}
                          className="p-4 sm:p-5 hover:bg-indigo-50/40 transition-colors cursor-pointer group flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                              <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">{lecture.topic}</h4>
                              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex-shrink-0">
                                {new Date(lecture.date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-slate-500 text-sm font-medium line-clamp-1">{lecture.description}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {lecture.attachments?.length > 0 && (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-full">
                                <Paperclip size={13} /> {lecture.attachments.length}
                              </div>
                            )}
                            <div className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-full group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all flex-shrink-0">
                              <ChevronRight size={18} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ASSIGNMENTS TAB — renders the full embedded module ───────── */}
        {activeTab === "assignments" && (
          <div className="animate-in fade-in duration-300">
            {assignmentsModule}
          </div>
        )}

        {/* ── ATTENDANCE TAB — renders the full embedded module ────────── */}
        {activeTab === "attendance" && (
          <div className="animate-in fade-in duration-300">
            {attendanceModule}
          </div>
        )}

        {/* ── EXAM MARKS TAB — renders the full embedded module ───────── */}
        {activeTab === "exam" && (
          <div className="animate-in fade-in duration-300">
            {marksModule}
          </div>
        )}

      </div>
    </div>
  );
};

export default TeacherClassesView;
