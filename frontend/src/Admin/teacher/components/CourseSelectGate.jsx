import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpenCheck, Sparkles, History } from "lucide-react";
import { useGetMyCoursesQuery } from "../api/teacherClassesApi";
import StateCard from "./StateCard";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

const mapAssignmentToCourse = (assignment) => ({
  id: assignment._id,
  subject: assignment.courseId?.title || "Untitled Course",
  code: assignment.courseId?.code || "N/A",
  program: assignment.programId?.name || "Unknown Program",
  semester: assignment.semesterId?.number
    ? `Section ${assignment.semesterId.number}`
    : "Unknown Semester",
  session: assignment.termId?.name || "Unknown Session",
  section: assignment.section,
  isActive: Boolean(assignment.isActive),
});

/**
 * Wraps a course-scoped module (Attendance, Exam Marks, Assignments) so it
 * also works as a standalone dashboard entry point, not just embedded inside
 * the course dashboard's tabs (which always already has a course selected).
 * Reads/writes ?courseId= in the URL so the choice survives a refresh and
 * is back-button-able.
 */
const CourseSelectGate = ({ icon: Icon, title, description, children }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const courseId = searchParams.get("courseId") || null;

  const {
    data: coursesRes,
    isFetching,
    isError,
    refetch,
  } = useGetMyCoursesQuery();

  const courses = useMemo(
    () => extractArray(coursesRes).map(mapAssignmentToCourse),
    [coursesRes],
  );
  const activeCourses = useMemo(() => courses.filter((c) => c.isActive), [courses]);
  const historyCourses = useMemo(() => courses.filter((c) => !c.isActive), [courses]);
  const currentCourse = courses.find((c) => c.id === courseId);

  const selectCourse = (id) => setSearchParams({ courseId: id });
  const changeCourse = () => setSearchParams({});

  // ── COURSE SELECTED — compact switcher bar + the module itself ─────────
  if (courseId && currentCourse) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8 lg:p-12 font-sans w-full">
        <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className={`h-1 w-full ${currentCourse.isActive ? "bg-gradient-to-r from-emerald-400 to-indigo-500" : "bg-slate-200"}`} />
            <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 flex-wrap">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 flex-shrink-0"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 font-black text-lg">
                {currentCourse.subject.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">{currentCourse.subject}</h1>
                <p className="text-slate-500 text-sm font-medium truncate">
                  {currentCourse.program} · {currentCourse.semester}
                  {currentCourse.section ? ` · Sec ${currentCourse.section}` : ""}
                </p>
              </div>
              <button
                onClick={changeCourse}
                className="flex-shrink-0 text-sm font-bold text-indigo-600 hover:text-indigo-700 px-3.5 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                Change Course
              </button>
            </div>
          </div>

          {children(courseId)}
        </div>
      </div>
    );
  }

  // ── NO COURSE SELECTED YET — pick one ───────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 lg:p-12 font-sans w-full">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 shadow-lg">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="relative flex items-center gap-3 sm:gap-4 p-5 sm:p-7">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 flex-shrink-0">
              <ArrowLeft size={22} />
            </button>
            {Icon && (
              <div className="w-11 h-11 rounded-2xl bg-white/10 text-white flex items-center justify-center flex-shrink-0">
                <Icon size={20} />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug">{title}</h1>
              <p className="text-white/60 text-sm font-medium">{description}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Select a Course</h3>

          {isFetching ? (
            <StateCard variant="loading" title="Loading your assigned courses…" />
          ) : isError ? (
            <StateCard
              variant="error"
              icon={BookOpenCheck}
              title="Couldn't load your courses"
              action={
                <button
                  onClick={refetch}
                  className="mt-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors text-sm"
                >
                  Try Again
                </button>
              }
            />
          ) : courses.length === 0 ? (
            <StateCard icon={BookOpenCheck} title="No courses available" description="You are not assigned to any courses yet." />
          ) : (
            <>
              {activeCourses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {activeCourses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => selectCourse(course.id)}
                      className="text-left relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group overflow-hidden"
                    >
                      <div className="h-1 w-full bg-emerald-500" />
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="w-11 h-11 flex-shrink-0 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <BookOpenCheck size={22} />
                          </div>
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex-shrink-0">
                            <Sparkles size={11} /> Active
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-800 leading-snug">{course.subject}</h3>
                        <p className="text-xs font-bold text-slate-400 mt-0.5">{course.code}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-3">
                          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">{course.program}</span>
                          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{course.semester}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {historyCourses.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <History size={15} className="text-slate-500" />
                    <h4 className="text-sm font-bold text-slate-600">History (Past Sessions)</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 opacity-90">
                    {historyCourses.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => selectCourse(course.id)}
                        className="text-left relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden"
                      >
                        <div className="h-1 w-full bg-slate-200" />
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="w-11 h-11 flex-shrink-0 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center">
                              <BookOpenCheck size={22} />
                            </div>
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide bg-slate-100 text-slate-500 px-2 py-1 rounded-full flex-shrink-0">
                              <History size={11} /> History
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-800 leading-snug">{course.subject}</h3>
                          <p className="text-xs font-bold text-slate-400 mt-0.5">{course.code}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-3">
                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{course.program}</span>
                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{course.semester}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseSelectGate;
