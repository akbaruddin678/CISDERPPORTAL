import React, { useMemo } from "react";
import { useGetMyTranscriptsQuery } from "./transcriptApi";
import {
  FileText,
  Award,
  BookOpen,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  GraduationCap,
  TrendingUp,
} from "lucide-react";

// ── backend untouched ─────────────────────────────────────────────
const gradePoints = {
  "A+": 4.0, A: 4.0, "A-": 3.7,
  "B+": 3.3, B: 3.0, "B-": 2.7,
  "C+": 2.3, C: 2.0,
  D: 1.0, F: 0.0,
};

const TranscriptView = () => {
  const { data: transcriptRes, isLoading } = useGetMyTranscriptsQuery();
  const records = transcriptRes?.data || [];

  const { groupedRecords, totalCredits, cgpa } = useMemo(() => {
    const groups = {};
    let totalPoints = 0, totalGradedCredits = 0, earnedCredits = 0;

    records.forEach((record) => {
      const termName  = record.termId?.name       || "Unknown Term";
      const semNumber = record.semesterId?.number  || "?";
      const groupKey  = `${termName} - Semester ${semNumber}`;

      if (!groups[groupKey]) {
        groups[groupKey] = { term: termName, semester: semNumber, courses: [], termPoints: 0, termCredits: 0 };
      }

      groups[groupKey].courses.push(record);

      const credits = record.courseId?.creditHours?.theory || 0;
      if (record.status === "Passed") earnedCredits += credits;

      if (record.grade && gradePoints[record.grade] !== undefined) {
        const points = gradePoints[record.grade] * credits;
        groups[groupKey].termPoints  += points;
        groups[groupKey].termCredits += credits;
        totalPoints        += points;
        totalGradedCredits += credits;
      }
    });

    Object.values(groups).forEach((g) => {
      g.termGpa = g.termCredits > 0 ? (g.termPoints / g.termCredits).toFixed(2) : "N/A";
    });

    return {
      groupedRecords: Object.values(groups),
      totalCredits: earnedCredits,
      cgpa: totalGradedCredits ? (totalPoints / totalGradedCredits).toFixed(2) : "0.00",
    };
  }, [records]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "Passed":  return <CheckCircle2 className="text-emerald-500" size={15} />;
      case "Failed":  return <XCircle      className="text-red-500"     size={15} />;
      default:        return <Clock        className="text-amber-500"   size={15} />;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Passed":  return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Failed":  return "bg-red-50 text-red-700 border-red-200";
      default:        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const getGradeStyle = (grade) => {
    if (!grade) return "bg-slate-100 text-slate-500 border-slate-200";
    if (["A+","A","A-"].includes(grade)) return "bg-red-900 text-white border-red-900";
    if (["B+","B","B-"].includes(grade)) return "bg-red-100 text-red-800 border-red-200";
    if (["C+","C"].includes(grade))       return "bg-amber-50 text-amber-800 border-amber-200";
    if (grade === "D")                    return "bg-orange-50 text-orange-700 border-orange-200";
    if (grade === "F")                    return "bg-red-50 text-red-700 border-red-200";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  const cgpaNum = parseFloat(cgpa);
  const cgpaPct = Math.min((cgpaNum / 4.0) * 100, 100);
  // ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <Loader2 className="animate-spin text-red-900" size={26} />
        </div>
        <p className="text-slate-500 font-semibold text-sm">Loading academic records…</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">

      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden rounded-2xl shadow-md shadow-red-900/15"
        style={{ background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 55%, #b91c1c 100%)" }}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute bottom-0 left-1/4 w-32 h-32 rounded-full bg-red-950/30 blur-xl" />

        <div className="relative z-10 px-6 sm:px-8 py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center">
                <GraduationCap size={14} className="text-red-200" />
              </div>
              <span className="text-red-200/70 text-xs font-semibold uppercase tracking-widest">Academic Record</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Academic Transcripts</h1>
            <p className="text-red-200/60 text-sm mt-1">Your full academic performance overview</p>
          </div>

          {/* CGPA ring */}
          <div className="flex items-center gap-5 bg-white/10 border border-white/15 rounded-2xl px-6 py-4 flex-shrink-0">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5"/>
                <circle cx="32" cy="32" r="26" fill="none" stroke="#fca5a5" strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - cgpaPct / 100)}`}
                  strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-black text-white leading-none">{cgpa}</span>
                <span className="text-[9px] text-red-300 font-bold leading-none mt-0.5">/ 4.0</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-red-200/70 font-semibold uppercase tracking-wider">CGPA</p>
              <p className="text-2xl font-black text-white">{cgpa}</p>
              <p className="text-xs text-red-300/70 mt-0.5">{totalCredits} credits earned</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <Award size={22} className="text-red-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cumulative GPA</p>
            <p className="text-3xl font-black text-slate-900 mt-0.5">{cgpa}</p>
          </div>
          {/* Mini bar */}
          <div className="w-20 hidden sm:block">
            <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-1">
              <span>0</span><span>4.0</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-2 rounded-full bg-red-900 transition-all duration-700"
                style={{ width: `${cgpaPct}%` }} />
            </div>
          </div>
          <div className="w-1 h-10 rounded-full bg-red-200 flex-shrink-0 ml-1" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={22} className="text-red-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Credits Earned</p>
            <p className="text-3xl font-black text-slate-900 mt-0.5">{totalCredits}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Semesters</p>
            <p className="text-2xl font-black text-slate-300">{groupedRecords.length}</p>
          </div>
          <div className="w-1 h-10 rounded-full bg-red-200 flex-shrink-0 ml-1" />
        </div>
      </div>

      {/* ── EMPTY STATE ── */}
      {groupedRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
            <FileText className="text-red-300" size={28} strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Records Found</h3>
          <p className="text-sm text-slate-400 mt-1">No transcript data available yet.</p>
        </div>

      ) : (
        <div className="space-y-5">
          {groupedRecords.map((group, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

              {/* ── TERM HEADER ── */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100"
                style={{ background: "linear-gradient(135deg, #7f1d1d08, #7f1d1d03)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-900 flex items-center justify-center flex-shrink-0 shadow-sm shadow-red-900/20">
                    <span className="text-xs font-black text-white">{group.semester}</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm leading-tight">{group.term}</h2>
                    <p className="text-xs text-red-800 font-semibold mt-0.5">Semester {group.semester}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Term GPA</p>
                    <p className="text-2xl font-black text-red-900 leading-none">{group.termGpa}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Courses</p>
                    <p className="text-2xl font-black text-slate-700 leading-none">{group.courses.length}</p>
                  </div>
                </div>
              </div>

              {/* ── MOBILE CARDS ── */}
              <div className="p-4 space-y-3 md:hidden">
                {group.courses.map((record) => (
                  <div key={record._id} className="border border-slate-100 rounded-xl p-4 hover:border-red-100 transition-colors">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-red-900 uppercase tracking-wider mb-0.5">
                          {record.courseId?.code}
                        </p>
                        <p className="font-bold text-slate-800 text-sm leading-snug truncate">
                          {record.courseId?.title}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-black border flex-shrink-0 ${getGradeStyle(record.grade)}`}>
                        {record.grade || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-slate-400 font-semibold">
                        {record.courseId?.creditHours?.theory} Credit hrs
                      </span>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusStyle(record.status)}`}>
                        {getStatusIcon(record.status)} {record.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── DESKTOP TABLE ── */}
              <div className="hidden md:block">
                {/* Table header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/60">
                  <div className="col-span-2">Code</div>
                  <div className="col-span-5">Course Title</div>
                  <div className="col-span-1 text-center">Credits</div>
                  <div className="col-span-2 text-center">Status</div>
                  <div className="col-span-2 text-center">Grade</div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-slate-50">
                  {group.courses.map((record, rIdx) => (
                    <div
                      key={record._id}
                      className={`grid grid-cols-12 gap-4 px-6 py-3.5 items-center hover:bg-slate-50/60 transition-colors duration-150 ${
                        rIdx % 2 === 1 ? "bg-slate-50/30" : "bg-white"
                      }`}
                    >
                      {/* Code */}
                      <div className="col-span-2">
                        <span className="text-[11px] font-bold text-red-900 uppercase tracking-wider">
                          {record.courseId?.code || "—"}
                        </span>
                      </div>

                      {/* Title */}
                      <div className="col-span-5">
                        <p className="font-semibold text-slate-800 text-sm truncate">
                          {record.courseId?.title || "Unknown"}
                        </p>
                      </div>

                      {/* Credits */}
                      <div className="col-span-1 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
                          {record.courseId?.creditHours?.theory ?? "—"}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="col-span-2 flex justify-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(record.status)}`}>
                          {getStatusIcon(record.status)}
                          {record.status || "—"}
                        </span>
                      </div>

                      {/* Grade */}
                      <div className="col-span-2 flex justify-center">
                        <span className={`inline-flex items-center justify-center w-12 h-8 rounded-lg text-xs font-black border ${getGradeStyle(record.grade)}`}>
                          {record.grade || "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Term footer */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-6">
                  <span className="text-xs text-slate-400 font-semibold">
                    {group.courses.length} course{group.courses.length !== 1 ? "s" : ""} ·{" "}
                    {group.courses.reduce((s, r) => s + (r.courseId?.creditHours?.theory || 0), 0)} credit hrs
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Term GPA</span>
                    <span className="text-sm font-black text-red-900 bg-red-50 border border-red-100 px-3 py-0.5 rounded-lg">
                      {group.termGpa}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TranscriptView;