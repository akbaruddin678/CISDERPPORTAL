import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, CalendarDays, Clock, Loader2, Save, Send, ClipboardList, ChevronRight, UserX, CheckCircle2,
  Users, TrendingUp, AlertTriangle, Target,
  PencilLine,
} from "lucide-react";
import StateCard from "../components/StateCard";
import PageHero from "../components/PageHero";
import StatTile from "../components/StatTile";

const EXAM_TYPE_STYLES = {
  Sessional: "bg-emerald-50 text-emerald-700 border-emerald-100",
  "Mid Term": "bg-blue-50 text-blue-700 border-blue-100",
  "Final Exam": "bg-purple-50 text-purple-700 border-purple-100",
  Quiz: "bg-teal-50 text-teal-700 border-teal-100",
  Assignment: "bg-amber-50 text-amber-700 border-amber-100",
  Practical: "bg-rose-50 text-rose-700 border-rose-100",
};

const STATUS_STYLES = {
  Scheduled: "bg-slate-100 text-slate-600",
  Ongoing: "bg-amber-100 text-amber-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-red-100 text-red-700",
};

const SUBMISSION_STATUS_META = {
  DRAFT: { label: "Draft", className: "bg-slate-200 text-slate-700" },
  PENDING_HOD: { label: "Pending HOD", className: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Approved", className: "bg-emerald-100 text-emerald-700" },
  RETURNED: { label: "Returned", className: "bg-red-100 text-red-700" },
};

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "TBD";

// Sessional has no fixed date/time — it's a running mark the teacher enters
// off ongoing class performance, so it's never gated on "has it happened yet."
const hasExamEnded = (ex) => {
  if (ex?.type === "Sessional") return true;
  if (!ex?.date) return false;
  const d = new Date(ex.date);
  if (ex.endTime) {
    const [hh, mm] = ex.endTime.split(":").map(Number);
    d.setHours(hh || 0, mm || 0, 0, 0);
  }
  return Date.now() >= d.getTime();
};

/**
 * @param {boolean} embedded - When true (rendered inside TeacherClassesView), the
 *   standalone page header is hidden — the teacher already chose their course.
 */
const TeacherMarksView = ({
  embedded = false,
  scheduledExams = [],
  isFetchingExams = false,

  selectedExamId,
  selectExam,
  closeExamRoster,

  exam,
  submission,
  isEditable = false,
  students = [],
  isFetchingRoster = false,
  handleMarkChange,
  handleToggleAbsent,
  hasUnsavedChanges = false,
  handleSaveMarks,
  isSaving = false,

  handleMarkComplete,
  isCompleting = false,
  handlePublish,
  isPublishing = false,
  handleRequestCorrection,
  isRequestingCorrection = false,
}) => {
  const navigate = useNavigate();

  const totalStudents = students.length;
  const absentCount = students.filter((s) => s.isAbsent).length;
  const markedCount = students.filter(
    (s) => !s.isAbsent && s.obtainedMarks !== null && s.obtainedMarks !== undefined,
  ).length;
  const scored = students.filter(
    (s) => !s.isAbsent && s.obtainedMarks !== null && s.obtainedMarks !== undefined,
  );
  const average = scored.length
    ? (scored.reduce((sum, s) => sum + Number(s.obtainedMarks), 0) / scored.length)
    : null;
  const progressPct = totalStudents ? Math.round(((markedCount + absentCount) / totalStudents) * 100) : 0;

  const outerClass = embedded ? "w-full font-sans" : "w-full font-sans";
  const innerClass = embedded ? "w-full space-y-6" : "max-w-6xl mx-auto space-y-6";

  return (
    <div className={outerClass}>
      <div className={innerClass}>
        {!embedded && (
          <PageHero
            onBack={() => navigate(-1)}
            icon={Target}
            title="Exam Marks"
            subtitle="Mark a past exam complete, enter marks, then publish for HOD review."
          />
        )}

        {!selectedExamId ? (
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Scheduled Exams</h3>
            {isFetchingExams ? (
              <StateCard variant="loading" title="Loading scheduled exams…" />
            ) : scheduledExams.length === 0 ? (
              <StateCard icon={CalendarDays} title="No exams have been scheduled for this course yet." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {scheduledExams.map((ex) => {
                  const statusMeta = ex.submission
                    ? SUBMISSION_STATUS_META[ex.submission.status]
                    : null;
                  const ended = hasExamEnded(ex);

                  return (
                    <div
                      key={ex._id}
                      onClick={ex.submission ? () => selectExam(ex._id) : undefined}
                      className={`text-left p-4 rounded-xl border shadow-sm transition-all ${EXAM_TYPE_STYLES[ex.type] || "bg-slate-50 text-slate-700 border-slate-200"} ${ex.submission ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-black">{ex.type}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_STYLES[ex.status] || "bg-slate-100 text-slate-500"}`}>
                          {ex.status}
                        </span>
                      </div>
                      {ex.type === "Sessional" ? (
                        <p className="text-xs font-semibold flex items-center gap-1.5 opacity-80">
                          <ClipboardList size={13} />
                          Based on ongoing class performance
                        </p>
                      ) : (
                        <>
                          <p className="text-xs font-semibold flex items-center gap-1.5 opacity-80">
                            <CalendarDays size={13} />
                            {formatDate(ex.date)}
                          </p>
                          <p className="text-xs font-semibold flex items-center gap-1.5 opacity-80 mt-1">
                            <Clock size={13} />
                            {ex.startTime} - {ex.endTime}
                          </p>
                        </>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-current/10 text-xs font-bold opacity-90">
                        <span>{ex.totalMarks} marks · {ex.weightage}%</span>
                        {statusMeta ? (
                          <span className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusMeta.className}`}>
                            {statusMeta.label} <ChevronRight size={12} />
                          </span>
                        ) : ended ? (
                          <button
                            onClick={() => handleMarkComplete(ex._id)}
                            disabled={isCompleting}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 hover:bg-white text-[10px] font-bold uppercase transition-colors disabled:opacity-50"
                          >
                            {isCompleting ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                            {ex.type === "Sessional" ? "Start Entering Marks" : "Mark Complete"}
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold uppercase opacity-60">Not held yet</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button onClick={closeExamRoster} className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700">
                <ArrowLeft size={16} /> Back to schedule
              </button>
              {exam && (
                <div className={`flex items-center gap-3 px-3 py-1.5 rounded-xl border text-xs font-bold ${EXAM_TYPE_STYLES[exam.type] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
                  <span>{exam.type}</span>
                  <span className="opacity-70">
                    {exam.type === "Sessional" ? "Ongoing" : formatDate(exam.date)}
                  </span>
                  <span className="opacity-70">{exam.totalMarks} marks</span>
                </div>
              )}
            </div>

            {exam && !isFetchingRoster && students.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatTile icon={Users} label="Students" value={totalStudents} color="#475569" bg="#f1f5f9" />
                <StatTile
                  icon={CheckCircle2}
                  label="Marked"
                  value={<>{markedCount + absentCount}<span className="text-sm font-bold text-slate-400">/{totalStudents}</span></>}
                  color="#059669"
                  bg="#d1fae5"
                />
                <StatTile icon={UserX} label="Absent" value={absentCount} color="#dc2626" bg="#fee2e2" />
                <StatTile
                  icon={TrendingUp}
                  label="Average"
                  value={
                    <>
                      {average === null ? "—" : average.toFixed(1)}
                      {average !== null && <span className="text-sm font-bold text-slate-400">/{exam?.totalMarks}</span>}
                    </>
                  }
                  color="#4338ca"
                  bg="#e0e7ff"
                />
              </div>
            )}

            {exam && !isFetchingRoster && students.length > 0 && (
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            )}

            {submission?.status === "RETURNED" && (
              <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold">
                Returned by HOD{submission.hodRemarks ? `: ${submission.hodRemarks}` : " — please review and re-publish."}
              </div>
            )}
            {submission?.status === "PENDING_HOD" && (
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm font-semibold">
                Awaiting HOD review — marks are locked until a decision is made.
              </div>
            )}
            {submission?.status === "APPROVED" && (
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold">
                Approved by HOD — these marks are final and count toward transcripts.
              </div>
            )}

            {isFetchingRoster ? (
              <StateCard variant="loading" title="Loading class roster…" />
            ) : students.length === 0 ? (
              <StateCard icon={ClipboardList} title="No students are enrolled in this course yet." />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider sticky top-0 z-10">
                        <th className="p-4 font-bold">Student</th>
                        <th className="p-4 font-bold text-center w-48">
                          <span className="inline-flex items-center gap-1.5 justify-center">
                            <Target size={13} /> Marks (max {exam?.totalMarks})
                          </span>
                        </th>
                        <th className="p-4 font-bold text-center">Attendance / Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((s, idx) => (
                        <tr key={s.studentId} className={`transition-colors hover:bg-indigo-50/40 ${idx % 2 === 1 ? "bg-slate-50/50" : ""}`}>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                                {s.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 truncate">{s.name}</p>
                                <p className="text-xs text-slate-400 font-medium">{s.rollNo}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  max={exam?.totalMarks}
                                  disabled={s.isAbsent || !isEditable}
                                  value={s.isAbsent ? "" : s.obtainedMarks ?? ""}
                                  onChange={(e) => handleMarkChange(s.studentId, e.target.value)}
                                  className={`w-20 p-2.5 border rounded-lg text-center outline-none font-bold text-slate-700 disabled:bg-slate-50 disabled:text-slate-300 focus:ring-2 ${
                                    s.wasClamped ? "border-amber-400 focus:ring-amber-400 bg-amber-50" : "border-slate-300 focus:ring-indigo-500"
                                  }`}
                                />
                                <span className="text-xs font-bold text-slate-400">/ {exam?.totalMarks}</span>
                              </div>
                              {s.wasClamped && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                                  <AlertTriangle size={11} /> Capped at {exam?.totalMarks}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleToggleAbsent(s.studentId)}
                              disabled={!isEditable}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                s.isAbsent ? "bg-red-600 border-red-600 text-white shadow-inner" : "border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500"
                              }`}
                            >
                              <UserX size={13} /> {s.isAbsent ? "Absent" : "Mark Absent"}
                            </button>
                            {submission?.status === "APPROVED" && s.resultId && (
                              <button onClick={() => handleRequestCorrection(s)} disabled={isRequestingCorrection} className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-50">
                                <PencilLine size={13} /> Request correction
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: stacked cards */}
                <div className="sm:hidden divide-y divide-slate-100">
                  {students.map((s) => (
                    <div key={s.studentId} className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                          {s.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{s.name}</p>
                          <p className="text-xs text-slate-400 font-medium">{s.rollNo}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={exam?.totalMarks}
                            disabled={s.isAbsent || !isEditable}
                            value={s.isAbsent ? "" : s.obtainedMarks ?? ""}
                            onChange={(e) => handleMarkChange(s.studentId, e.target.value)}
                            placeholder={`/${exam?.totalMarks ?? ""}`}
                            className={`w-16 p-2 border rounded-lg text-center outline-none font-semibold text-slate-700 disabled:bg-slate-50 disabled:text-slate-300 focus:ring-2 ${
                              s.wasClamped ? "border-amber-400 focus:ring-amber-400 bg-amber-50" : "border-slate-300 focus:ring-indigo-500"
                            }`}
                          />
                          <button
                            onClick={() => handleToggleAbsent(s.studentId)}
                            disabled={!isEditable}
                            className={`p-2 rounded-lg border transition-colors disabled:opacity-50 ${
                              s.isAbsent ? "bg-red-600 border-red-600 text-white" : "border-slate-200 text-slate-400"
                            }`}
                          >
                            <UserX size={15} />
                          </button>
                        </div>
                        {s.wasClamped && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                            <AlertTriangle size={11} /> Capped at {exam?.totalMarks}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {isEditable && (
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-500">
                      {hasUnsavedChanges ? "You have unsaved changes" : "All changes saved"}
                    </span>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleSaveMarks}
                        disabled={!hasUnsavedChanges || isSaving}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSaving ? "Saving..." : "Save Marks"}
                      </button>
                      <button
                        onClick={handlePublish}
                        disabled={hasUnsavedChanges || isSaving || isPublishing}
                        title={hasUnsavedChanges ? "Save your changes before publishing." : "Send to HOD"}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                      >
                        {isPublishing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        {isPublishing ? "Publishing..." : "Publish to HOD"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherMarksView;
