import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  BookOpen,
  Award,
  Loader2,
  ArrowRight,
  Megaphone,
  CalendarDays,
  Bell,
  ChevronRight,
  Info,
  MessageCircle,
  X,
  Headset,
  Sparkles,
  TrendingUp,
  GraduationCap,
  Target,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  useGetMyTranscriptsQuery,
  useGetAnnouncementsQuery,
  useGetUpcomingEventsQuery,
} from "../academics/transcriptApi";

const gradePoints = {
  "A+": 4.0, A: 4.0, "A-": 3.7, "B+": 3.3, B: 3.0,
  "B-": 2.7, "C+": 2.3, C: 2.0, D: 1.0, F: 0.0,
};

// ── STATIC ATTENDANCE DATA (replace with API hook when ready) ─────────────────
const attendanceData = [
  { id: 1, course: "Web Engineering",       code: "CS-401", total: 30, attended: 27, status: "Safe"    },
  { id: 2, course: "Database Systems",      code: "CS-312", total: 28, attended: 22, status: "Safe"    },
  { id: 3, course: "Operating Systems",     code: "CS-321", total: 25, attended: 17, status: "Warning" },
  { id: 4, course: "Data Structures",       code: "CS-211", total: 32, attended: 29, status: "Safe"    },
  { id: 5, course: "Artificial Intelligence",code:"CS-451", total: 20, attended: 12, status: "Short"   },
];



// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value }) => (
  <div className="relative overflow-hidden rounded-md p-6 flex flex-col gap-3 bg-red-900 border border-red-900 shadow-sm hover:-translate-y-1 transition-transform duration-300 group">
    <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/5 group-hover:scale-110 transition-transform duration-500" />
    <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/5" />
    <div className="w-12 h-12 rounded-md bg-white/15 border border-white/20 flex items-center justify-center text-white relative z-10">
      {icon}
    </div>
    <div className="relative z-10">
      <p className="text-[11px] font-bold text-white/80 uppercase tracking-[0.15em]">{label}</p>
      <p className="text-4xl font-black text-white mt-1 tracking-tight">{value}</p>
    </div>
  </div>
);

// ── Course Card ───────────────────────────────────────────────────────────────
const CourseCard = ({ record }) => {
  const progress = record.status === "In-Progress" ? 65 : 10;
  return (
    <div className="rounded-md border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 hover:border-red-200 transition-all duration-300 flex flex-col bg-white group">
      <div className="h-28 bg-red-900 p-5 flex flex-col justify-end relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-500" />
        <div className="absolute left-0 bottom-0 w-20 h-20 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <span className="text-red-200 text-[10px] font-black tracking-widest uppercase mb-1 relative z-10">{record.courseId?.code || "CODE"}</span>
        <h3 className="text-white text-sm font-bold leading-snug relative z-10 truncate">{record.courseId?.title || "Unknown Course"}</h3>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Target size={12} className="text-red-900" />{record.courseId?.creditHours?.theory || 0} credits
          </span>
          <span className="text-[10px] font-bold bg-red-50 text-red-900 border border-red-100 px-2.5 py-0.5 rounded-sm uppercase tracking-wider">{record.status}</span>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1.5">
            <span className="uppercase tracking-wider">Progress</span>
            <span className="text-red-900">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-sm h-1.5 overflow-hidden">
            <div className="bg-red-900 h-1.5 rounded-sm transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Attendance Badge helpers ───────────────────────────────────────────────────
const attendanceConfig = {
  Safe:    { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 size={13} className="text-emerald-500" />, label: "Safe" },
  Warning: { bar: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 border-amber-200",       icon: <AlertTriangle size={13} className="text-amber-500" />,  label: "Warning" },
  Short:   { bar: "bg-red-500",     badge: "bg-red-50 text-red-700 border-red-200",             icon: <XCircle size={13} className="text-red-500" />,          label: "Short" },
};

// ── Announcement Badge ────────────────────────────────────────────────────────
const badgeStyle = (type) => {
  switch (type?.toLowerCase()) {
    case "academic": return "bg-red-50 text-red-900 border border-red-100";
    case "finance":  return "bg-orange-50 text-orange-700 border border-orange-100";
    case "urgent":   return "bg-red-900 text-white border border-red-900";
    default:         return "bg-slate-100 text-slate-600 border border-slate-200";
  }
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const DashboardView = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  const { data: transcriptRes, isLoading: isTranscriptLoading } = useGetMyTranscriptsQuery();
  const { data: announceRes,   isLoading: isAnnounceLoading   } = useGetAnnouncementsQuery();
  const { data: eventsRes,     isLoading: isEventsLoading     } = useGetUpcomingEventsQuery();

  const records        = transcriptRes?.data || [];
  const announcements  = announceRes?.data   || [];
  const upcomingEvents = eventsRes?.data      || [];

  const { currentCourses, cgpa, totalCredits } = useMemo(() => {
    let totalPoints = 0, totalGradedCredits = 0, earnedCredits = 0;
    const active = records.filter((r) => ["Registered", "In-Progress"].includes(r.status));
    records.forEach((record) => {
      const credits = record.courseId?.creditHours?.theory || 0;
      if (record.status === "Passed") earnedCredits += credits;
      if (record.grade && gradePoints[record.grade] !== undefined) {
        totalPoints        += gradePoints[record.grade] * credits;
        totalGradedCredits += credits;
      }
    });
    return {
      currentCourses: active,
      cgpa: totalGradedCredits > 0 ? (totalPoints / totalGradedCredits).toFixed(2) : "0.00",
      totalCredits: earnedCredits,
    };
  }, [records]);

  const handleWhatsAppSupport = () => {
    const phoneNumber = "923492649173";
    const message = encodeURIComponent(
      `Hello IT Support, my name is ${user?.name?.split(" ")[0] || "a student"}. I need some technical assistance with my portal.`
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
    setIsSupportModalOpen(false);
  };

  if (isTranscriptLoading || isAnnounceLoading || isEventsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <div className="w-14 h-14 rounded-md bg-red-50 flex items-center justify-center mb-4 border border-red-100">
          <Loader2 className="animate-spin text-red-900" size={28} />
        </div>
        <p className="font-semibold text-slate-500 text-sm">Loading your dashboard…</p>
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "Student";
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Overall attendance stats
  const overallAttended = attendanceData.reduce((s, r) => s + r.attended, 0);
  const overallTotal    = attendanceData.reduce((s, r) => s + r.total, 0);
  const overallPct      = overallTotal > 0 ? Math.round((overallAttended / overallTotal) * 100) : 0;
  const shortCount      = attendanceData.filter(r => r.status === "Short").length;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">

      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden rounded-md bg-red-900 p-6 sm:p-8 shadow-lg">
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 left-1/4 w-48 h-48 rounded-full bg-black/10" />
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-3 bg-white/10 border border-white/20 px-3 py-1 rounded-sm">
              <Sparkles size={13} className="text-yellow-200" />
              <span className="text-white text-xs font-semibold">{greeting}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {firstName}! <span className="inline-block animate-pulse">👋</span>
            </h1>
            <p className="text-red-100/90 mt-2 text-sm font-medium flex items-center gap-1.5">
              <GraduationCap size={15} />
              {user?.program || "Your learning journey continues"}
            </p>
          </div>
          
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<BookOpen size={22} />}   label="Active Courses" value={currentCourses.length} />
        <StatCard icon={<Award size={22} />}       label="Current CGPA"   value={cgpa} />
        <StatCard icon={<TrendingUp size={22} />}  label="Credits Earned" value={totalCredits} />
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">

          {/* Enrolled Courses */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-red-900 text-white flex items-center justify-center">
                  <BookOpen size={17} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-none">Enrolled Courses</h2>
                  <p className="text-[11px] text-slate-400 mt-1">Your current term</p>
                </div>
              </div>
              <button onClick={() => navigate("/courses")}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-red-900 hover:bg-red-950 px-3.5 py-2 rounded-md transition-all duration-150">
                Registrations <ArrowRight size={13} />
              </button>
            </div>
            {currentCourses.length === 0 ? (
              <div className="border-2 border-dashed border-red-100 p-10 rounded-md text-center bg-red-50/40">
                <div className="w-14 h-14 rounded-md bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="text-red-900" size={26} />
                </div>
                <h3 className="text-base font-bold text-slate-800">No Active Courses</h3>
                <p className="text-slate-500 mt-1 mb-5 text-sm">You are not registered for any courses this term.</p>
                <button onClick={() => navigate("/courses")}
                  className="bg-red-900 hover:bg-red-950 text-white px-6 py-2.5 rounded-md font-bold text-sm transition-all">
                  Register Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentCourses.map((record) => <CourseCard key={record._id} record={record} />)}
              </div>
            )}
          </div>

          {/* ── ATTENDANCE TABLE ── */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-red-900 text-white flex items-center justify-center">
                  <UserCheck size={17} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-none">Attendance</h2>
                  <p className="text-[11px] text-slate-400 mt-1">Current semester</p>
                </div>
              </div>

              {/* Overall pill */}
              <div className="flex items-center gap-3">
                {shortCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-md">
                    <AlertTriangle size={12} /> {shortCount} Short
                  </span>
                )}
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overall</p>
                  <p className={`text-xl font-black leading-none ${overallPct >= 75 ? "text-emerald-600" : overallPct >= 60 ? "text-amber-600" : "text-red-600"}`}>
                    {overallPct}%
                  </p>
                </div>
              </div>
            </div>

            {/* Overall progress bar */}
            <div className="mb-5">
              <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
                <span>{overallAttended} classes attended</span>
                <span>{overallTotal} total</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ${
                    overallPct >= 75 ? "bg-emerald-500" : overallPct >= 60 ? "bg-amber-400" : "bg-red-500"
                  }`}
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              {/* 75% threshold marker */}
              <div className="relative mt-1">
                <div className="absolute h-2 w-px bg-slate-400" style={{ left: "75%" }} />
                <span className="absolute text-[9px] font-bold text-slate-400 -translate-x-1/2" style={{ left: "75%", top: "4px" }}>75%</span>
              </div>
            </div>

            {/* Table — Desktop */}
            <div className="hidden sm:block rounded-md border border-slate-200 overflow-hidden">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200" style={{ background: "linear-gradient(135deg, #7f1d1d08, #7f1d1d03)" }}>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Course</th>
                    <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-24">Attended</th>
                    <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-16">Total</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-36">Progress</th>
                    <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-24">%</th>
                    <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceData.map((row, idx) => {
                    const pct    = Math.round((row.attended / row.total) * 100);
                    const config = attendanceConfig[row.status];
                    return (
                      <tr key={row.id} className={`hover:bg-slate-50/60 transition-colors ${idx % 2 === 1 ? "bg-slate-50/30" : "bg-white"}`}>
                        {/* Course */}
                        <td className="px-4 py-3.5">
                          <p className="text-[11px] font-bold text-red-900 uppercase tracking-wider">{row.code}</p>
                          <p className="font-semibold text-slate-800 text-sm leading-snug">{row.course}</p>
                        </td>
                        {/* Attended */}
                        <td className="px-4 py-3.5 text-center">
                          <span className="text-lg font-black text-slate-800">{row.attended}</span>
                        </td>
                        {/* Total */}
                        <td className="px-4 py-3.5 text-center">
                          <span className="text-sm font-semibold text-slate-400">{row.total}</span>
                        </td>
                        {/* Bar */}
                        <td className="px-4 py-3.5">
                          <div className="relative">
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-2 rounded-full ${config.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                            </div>
                            {/* 75% marker */}
                            <div className="absolute top-0 h-2 w-px bg-slate-400/50" style={{ left: "75%" }} />
                          </div>
                        </td>
                        {/* Percentage */}
                        <td className="px-4 py-3.5 text-center">
                          <span className={`text-sm font-black ${pct >= 75 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-600"}`}>
                            {pct}%
                          </span>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${config.badge}`}>
                            {config.icon}{config.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cards — Mobile */}
            <div className="sm:hidden space-y-3">
              {attendanceData.map((row) => {
                const pct    = Math.round((row.attended / row.total) * 100);
                const config = attendanceConfig[row.status];
                return (
                  <div key={row.id} className="border border-slate-200 rounded-md p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-[11px] font-bold text-red-900 uppercase tracking-wider">{row.code}</p>
                        <p className="font-semibold text-slate-800 text-sm">{row.course}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border flex-shrink-0 ${config.badge}`}>
                        {config.icon}{config.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-2 rounded-full ${config.bar}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className={`text-sm font-black w-10 text-right ${pct >= 75 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-600"}`}>
                        {pct}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-1.5">{row.attended} of {row.total} classes attended</p>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Legend</span>
              {Object.entries(attendanceConfig).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${cfg.bar}`} />
                  <span className="text-[11px] text-slate-500 font-semibold">{key}</span>
                </div>
              ))}
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-px h-3 bg-slate-400" />
                <span className="text-[10px] text-slate-400 font-semibold">75% min required</span>
              </div>
            </div>
          </div>

          {/* Notice Board */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-md bg-red-900 text-white flex items-center justify-center">
                <Megaphone size={17} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-none">Notice Board</h2>
                <p className="text-[11px] text-slate-400 mt-1">Stay updated</p>
              </div>
              {announcements.length > 0 && (
                <span className="ml-auto text-xs font-bold bg-red-900 text-white px-2.5 py-1 rounded-sm">{announcements.length} New</span>
              )}
            </div>
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="text-center py-8 bg-red-50/40 rounded-md border border-dashed border-red-100">
                  <Info size={28} className="mx-auto mb-2 text-red-300" />
                  <p className="text-sm font-semibold text-slate-600">No new announcements</p>
                  <p className="text-xs text-slate-400 mt-0.5">You are all caught up!</p>
                </div>
              ) : (
                announcements.map((a) => (
                  <div key={a._id || a.id}
                    className="flex items-start gap-4 p-4 rounded-md border border-slate-200 hover:border-red-200 hover:bg-red-50/40 transition-all duration-200 cursor-pointer group">
                    <div className="w-10 h-10 rounded-md bg-red-50 text-red-900 flex items-center justify-center flex-shrink-0 group-hover:bg-red-900 group-hover:text-white transition-all border border-red-100">
                      <Bell size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${badgeStyle(a.type)}`}>{a.type || "Notice"}</span>
                        <span className="text-[11px] text-slate-400 font-medium">{new Date(a.date || a.createdAt || new Date()).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm truncate group-hover:text-red-900 transition-colors">{a.title}</h3>
                      {a.summary && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{a.summary}</p>}
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-red-900 group-hover:translate-x-1 mt-1.5 flex-shrink-0 transition-all" size={18} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">

          {/* Upcoming Events */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-red-900 text-white flex items-center justify-center">
                  <CalendarDays size={17} />
                </div>
                <h2 className="text-base font-bold text-slate-900">Upcoming</h2>
              </div>
              <span className="text-[10px] font-bold bg-red-50 text-red-900 border border-red-100 px-2.5 py-1 rounded-sm uppercase tracking-wider">This Week</span>
            </div>
            <div className="space-y-4">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-6">
                  <CalendarDays size={28} className="mx-auto mb-2 text-red-200" />
                  <p className="text-sm font-semibold text-slate-600">Schedule is clear</p>
                  <p className="text-xs text-slate-400 mt-0.5">No upcoming events.</p>
                </div>
              ) : (
                upcomingEvents.map((event, i) => (
                  <div key={event._id || event.id} className="relative pl-5 border-l-2 border-red-100 py-1">
                    <div className={`absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full border-2 border-white ${i === 0 ? "bg-red-900 ring-4 ring-red-100 animate-pulse" : "bg-red-300"}`} />
                    <p className="text-[11px] font-bold text-red-900 mb-0.5 uppercase tracking-wider">
                      {new Date(event.time || event.date || new Date()).toLocaleString([], {
                        weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                    <p className="text-sm font-bold text-slate-700 leading-snug">{event.title}</p>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => navigate("/calendar")}
              className="w-full mt-6 py-2.5 bg-red-50 hover:bg-red-100 text-red-900 text-sm font-bold rounded-md transition-all border border-red-100">
              View Full Calendar
            </button>
          </div>

          {/* Support Widget */}
          <div className="relative overflow-hidden rounded-md bg-red-900 p-6 text-white shadow-lg">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-black/10" />
            <div className="relative z-10 text-center">
              <div className="mx-auto w-14 h-14 bg-white/15 border border-white/20 rounded-md flex items-center justify-center mb-4">
                <Headset size={24} className="text-white" />
              </div>
              <h3 className="font-bold text-base mb-1.5">Technical Support</h3>
              <p className="text-xs text-red-100/80 mb-5 leading-relaxed">Facing portal issues? Our IT team is ready to help you 24/7.</p>
              <button onClick={() => setIsSupportModalOpen(true)}
                className="bg-white hover:bg-red-50 text-red-900 w-full py-2.5 rounded-md font-bold text-sm transition-all duration-150 active:scale-95">
                Get Support
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SUPPORT MODAL ── */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="h-1.5 w-full bg-red-900" />
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-red-900 flex items-center justify-center">
                  <Headset size={16} className="text-white" />
                </div>
                <h3 className="text-base font-bold text-slate-900">IT Support</h3>
              </div>
              <button onClick={() => setIsSupportModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-900 hover:bg-red-50 rounded-sm transition-all">
                <X size={15} />
              </button>
            </div>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-md flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={28} className="text-red-900" />
              </div>
              <h4 className="font-bold text-slate-900 mb-1.5">Chat with Support</h4>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Click below to open WhatsApp and message our technical support team. We typically reply within a few minutes.
              </p>
              <button onClick={handleWhatsAppSupport}
                className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-white font-bold rounded-md shadow-md shadow-green-100 flex items-center justify-center gap-2 transition-all duration-150">
                <MessageCircle size={17} />
                Continue to WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;