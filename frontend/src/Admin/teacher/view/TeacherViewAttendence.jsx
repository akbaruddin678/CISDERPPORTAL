import React from "react";
import {
  CheckCircle2, XCircle, Clock4, Users, User,
  BarChart3, Loader2, CalendarCheck, ClipboardList, ClipboardCheck, CheckCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import StateCard from "../components/StateCard";
import PillTabs from "../components/PillTabs";
import PageHero from "../components/PageHero";
import StatTile from "../components/StatTile";

const ATTENDANCE_TABS = [
  { key: "mark", label: "Mark Attendance", icon: CalendarCheck },
  { key: "class-report", label: "Class Report", icon: Users },
  { key: "individual-report", label: "Individual Report", icon: User },
];

const STATUS_STYLES = {
  Present: "bg-emerald-100 text-emerald-700",
  Absent: "bg-red-100 text-red-700",
  Late: "bg-amber-100 text-amber-700",
};

const percentageColor = (pct) => {
  if (pct >= 75) return { text: "text-emerald-700", bg: "bg-emerald-100", bar: "bg-emerald-500" };
  if (pct >= 50) return { text: "text-amber-700", bg: "bg-amber-100", bar: "bg-amber-500" };
  return { text: "text-red-700", bg: "bg-red-100", bar: "bg-red-500" };
};

/**
 * @param {boolean} embedded - When true (rendered inside TeacherClassesView), the outer
 *   min-h-screen wrapper, top padding, and standalone page header are all suppressed so
 *   the view slots neatly into the parent layout without double-spacing.
 */
const TeacherAttendanceView = ({
  embedded = false,
  activeTab,
  setActiveTab,

  students = [],
  isFetchingRoster = false,
  markStudent,
  markAllPresent,
  markedCount = 0,
  isSaving = false,
  handleSubmitAttendance,

  classReport = { totalSessions: 0, students: [] },
  isFetchingClassReport = false,

  roster = [],
  selectedStudentId,
  setSelectedStudentId,
  studentReport = { log: [], monthly: [] },
  isFetchingStudentReport = false,
}) => {
  const navigate = useNavigate();

  const totalStudents = students.length;
  const presentCount = students.filter((s) => s.status === "Present").length;
  const absentCount = students.filter((s) => s.status === "Absent").length;
  const lateCount = students.filter((s) => s.status === "Late").length;
  const attendancePercentage =
    totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  const selectedStudent = roster.find((s) => s.studentId === selectedStudentId);

  const outerClass = embedded
    ? "w-full font-sans"
    : "min-h-screen bg-slate-50 p-4 sm:p-8 lg:p-12 font-sans w-full";
  const innerClass = embedded ? "w-full space-y-6" : "max-w-6xl mx-auto space-y-6";

  return (
    <div className={outerClass}>
      <div className={innerClass}>
        {!embedded && (
          <div className="mb-2">
            <PageHero
              onBack={() => navigate(-1)}
              icon={ClipboardCheck}
              title="Attendance"
              subtitle="Mark daily attendance and review class/student reports."
            />
          </div>
        )}

        {/* Tab Navigation */}
        <PillTabs tabs={ATTENDANCE_TABS} activeKey={activeTab} onChange={setActiveTab} />

        {/* ── MARK ATTENDANCE TAB ── */}
        {activeTab === "mark" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-slate-400 font-medium">
                Marking attendance for{" "}
                <span className="font-bold text-slate-600">
                  {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </span>
              </p>
              {totalStudents > 0 && markAllPresent && (
                <button
                  onClick={markAllPresent}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-sm font-bold rounded-xl transition-colors"
                >
                  <CheckCheck size={16} /> Mark All Present
                </button>
              )}
            </div>

            {isFetchingRoster ? (
              <StateCard variant="loading" title="Loading class roster…" />
            ) : totalStudents === 0 ? (
              <StateCard icon={ClipboardList} title="No students are enrolled in this course yet." />
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <StatTile icon={Users} label="Total" value={totalStudents} color="#475569" bg="#f1f5f9" />
                  <StatTile icon={CheckCircle2} label="Present" value={presentCount} color="#059669" bg="#d1fae5" />
                  <StatTile icon={XCircle} label="Absent" value={absentCount} color="#dc2626" bg="#fee2e2" />
                  <StatTile icon={Clock4} label="Late" value={lateCount} color="#d97706" bg="#fef3c7" />
                  <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-4 rounded-2xl shadow-sm col-span-2 md:col-span-1 flex flex-col items-center justify-center text-center">
                    <span className="text-indigo-100 text-xs font-bold uppercase block mb-1">Today's %</span>
                    <span className="text-2xl font-black text-white">{attendancePercentage}%</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Desktop/tablet: table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                          <th className="p-4 font-bold">Student</th>
                          <th className="p-4 font-bold text-center">Status</th>
                          <th className="p-4 font-bold">Mark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {students.map((student) => (
                          <tr key={student.studentId} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                                  {student.name?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 truncate">{student.name}</p>
                                  <p className="text-xs text-slate-400 font-medium">{student.rollNo}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[student.status] || "bg-slate-100 text-slate-400 border border-slate-200"}`}>
                                {student.status || "Not Marked"}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden divide-x divide-slate-200">
                                <button
                                  onClick={() => markStudent(student.studentId, "Present")}
                                  className={`flex items-center gap-1 px-3 py-1.5 transition-all text-sm font-bold ${student.status === "Present" ? "bg-emerald-500 text-white" : "bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"}`}
                                >
                                  <CheckCircle2 size={16} /> Present
                                </button>
                                <button
                                  onClick={() => markStudent(student.studentId, "Absent")}
                                  className={`flex items-center gap-1 px-3 py-1.5 transition-all text-sm font-bold ${student.status === "Absent" ? "bg-red-500 text-white" : "bg-white text-slate-600 hover:bg-red-50 hover:text-red-700"}`}
                                >
                                  <XCircle size={16} /> Absent
                                </button>
                                <button
                                  onClick={() => markStudent(student.studentId, "Late")}
                                  className={`flex items-center gap-1 px-3 py-1.5 transition-all text-sm font-bold ${student.status === "Late" ? "bg-amber-500 text-white" : "bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-700"}`}
                                >
                                  <Clock4 size={16} /> Late
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: stacked cards */}
                  <div className="sm:hidden divide-y divide-slate-100">
                    {students.map((student) => (
                      <div key={student.studentId} className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                              {student.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 truncate">{student.name}</p>
                              <p className="text-xs text-slate-400 font-medium">{student.rollNo}</p>
                            </div>
                          </div>
                          <span className={`flex-shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[student.status] || "bg-slate-100 text-slate-400 border border-slate-200"}`}>
                            {student.status || "Not Marked"}
                          </span>
                        </div>
                        <div className="flex rounded-lg border border-slate-200 overflow-hidden divide-x divide-slate-200">
                          <button
                            onClick={() => markStudent(student.studentId, "Present")}
                            className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 transition-all text-xs font-bold ${student.status === "Present" ? "bg-emerald-500 text-white" : "bg-white text-slate-600"}`}
                          >
                            <CheckCircle2 size={14} /> Present
                          </button>
                          <button
                            onClick={() => markStudent(student.studentId, "Absent")}
                            className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 transition-all text-xs font-bold ${student.status === "Absent" ? "bg-red-500 text-white" : "bg-white text-slate-600"}`}
                          >
                            <XCircle size={14} /> Absent
                          </button>
                          <button
                            onClick={() => markStudent(student.studentId, "Late")}
                            className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 transition-all text-xs font-bold ${student.status === "Late" ? "bg-amber-500 text-white" : "bg-white text-slate-600"}`}
                          >
                            <Clock4 size={14} /> Late
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500">{markedCount} of {totalStudents} students marked</span>
                    <button
                      onClick={handleSubmitAttendance}
                      disabled={markedCount === 0 || isSaving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isSaving && <Loader2 size={16} className="animate-spin" />}
                      {isSaving ? "Saving..." : "Save Attendance"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── CLASS REPORT TAB ── */}
        {activeTab === "class-report" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {isFetchingClassReport ? (
              <StateCard variant="loading" title="Loading class report…" />
            ) : classReport.students.length === 0 ? (
              <StateCard icon={BarChart3} title="No attendance has been recorded for this course yet." />
            ) : (
              <>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-600">
                    Total Sessions Held: <span className="font-black text-slate-800">{classReport.totalSessions}</span>
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                          <th className="p-4 font-bold">Roll No.</th>
                          <th className="p-4 font-bold">Student Name</th>
                          <th className="p-4 font-bold text-center">Present</th>
                          <th className="p-4 font-bold text-center">Absent</th>
                          <th className="p-4 font-bold text-center">Late</th>
                          <th className="p-4 font-bold">Attendance %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {classReport.students.map((s) => {
                          const colors = percentageColor(s.percentage);
                          return (
                            <tr key={s.studentId} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 text-slate-600 font-medium">{s.rollNo}</td>
                              <td className="p-4 font-bold text-slate-800">{s.name}</td>
                              <td className="p-4 text-center font-bold text-emerald-600">{s.present}</td>
                              <td className="p-4 text-center font-bold text-red-600">{s.absent}</td>
                              <td className="p-4 text-center font-bold text-amber-600">{s.late}</td>
                              <td className="p-4 w-48">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${colors.bar}`} style={{ width: `${s.percentage}%` }} />
                                  </div>
                                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>{s.percentage}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── INDIVIDUAL REPORT TAB ── */}
        {activeTab === "individual-report" && (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:max-h-[600px] lg:overflow-y-auto">
              {roster.length === 0 ? (
                <p className="p-6 text-sm text-slate-400 text-center">No students enrolled.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {roster.map((s) => (
                    <button
                      key={s.studentId}
                      onClick={() => setSelectedStudentId(s.studentId)}
                      className={`w-full text-left p-4 transition-colors ${s.studentId === selectedStudentId ? "bg-indigo-50 border-l-4 border-indigo-600" : "hover:bg-slate-50 border-l-4 border-transparent"}`}
                    >
                      <p className="text-sm font-bold text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-400 font-medium">{s.rollNo}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-5">
              {isFetchingStudentReport ? (
                <StateCard variant="loading" title="Loading student report…" />
              ) : !selectedStudent ? (
                <StateCard icon={User} title="Select a student to view their report." />
              ) : (
                <>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800">{selectedStudent.name}</h3>
                    <p className="text-sm text-slate-400 font-medium mb-4">{selectedStudent.rollNo}</p>

                    {studentReport.monthly.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">No attendance recorded yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {studentReport.monthly.map((m) => {
                          const total = m.present + m.absent + m.late;
                          const pct = total > 0 ? Math.round(((m.present + m.late) / total) * 100) : 0;
                          const colors = percentageColor(pct);
                          return (
                            <div key={m.month} className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                              <p className="text-xs font-bold text-slate-500 uppercase mb-1">{m.month}</p>
                              <p className={`text-lg font-black ${colors.text}`}>{pct}%</p>
                              <p className="text-[11px] text-slate-400 font-medium">
                                {m.present}P · {m.absent}A · {m.late}L
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                      <h4 className="text-sm font-bold text-slate-700">Day-by-Day Log</h4>
                    </div>
                    {studentReport.log.length === 0 ? (
                      <p className="p-6 text-sm text-slate-400 text-center">No sessions recorded yet.</p>
                    ) : (
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {[...studentReport.log].reverse().map((entry, idx) => (
                          <div key={idx} className="flex items-center justify-between px-6 py-3">
                            <span className="text-sm font-medium text-slate-600">
                              {new Date(entry.date).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[entry.status] || "bg-slate-100 text-slate-500"}`}>
                              {entry.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAttendanceView;
