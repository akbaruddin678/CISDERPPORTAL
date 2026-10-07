import React from "react";
import { Link } from "react-router-dom";
import LinkCard from "../../../shared/LinkCard/container/CardContainer.jsx";
import { HODLink } from "../services/HODLink.jsx";
import {
  CheckCircle2,
  UserCheck,
  AlertTriangle,
  FileSignature,
  BookOpen,
  Users,
  ArrowRight,
} from "lucide-react";

const StatTile = ({ icon: Icon, label, value, color, bg }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-xl ${bg} ${color} flex-shrink-0`}>
      <Icon size={20} strokeWidth={2.25} />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
      <p className="text-xs font-semibold text-slate-500 mt-1.5 truncate">{label}</p>
    </div>
  </div>
);

const HODHomeView = ({ stats, actionItems, isLoading }) => {
  const links = HODLink();

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-6 sm:px-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* 1. Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-300 pb-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight uppercase">
              Head of Department Portal
            </h1>
            <p className="text-base text-slate-600 font-medium max-w-2xl">
              Monitor departmental progress, approve academic records, and oversee faculty.
            </p>
          </div>
        </header>

        {/* 2. KPI Stat Row */}
        <section>
          <h2 className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 mb-3">
            Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatTile icon={CheckCircle2} label="Marks Pending" value={isLoading ? "—" : stats.pendingMarksCount} color="text-indigo-600" bg="bg-indigo-100" />
            <StatTile icon={UserCheck} label="Attendance Pending" value={isLoading ? "—" : stats.pendingAttendanceCount} color="text-teal-600" bg="bg-teal-100" />
            <StatTile icon={AlertTriangle} label="Open UFM Cases" value={isLoading ? "—" : stats.pendingUfmCount} color="text-red-600" bg="bg-red-100" />
            <StatTile icon={FileSignature} label="Pending Appeals" value={isLoading ? "—" : stats.pendingReEvalCount} color="text-pink-600" bg="bg-pink-100" />
            <StatTile icon={BookOpen} label="Class Courses" value={isLoading ? "—" : stats.departmentCourseCount} color="text-violet-600" bg="bg-violet-100" />
            <StatTile icon={Users} label="Active Students" value={isLoading ? "—" : stats.departmentStudentCount} color="text-blue-600" bg="bg-blue-100" />
          </div>
        </section>

        {/* 3. Action Required */}
        <section>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-3xl">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" /> Action Required
            </h2>
            {isLoading ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : actionItems.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nothing needs attention right now — all queues are clear.
              </p>
            ) : (
              <div className="space-y-2">
                {actionItems.map((item) => (
                  <Link
                    key={item.key}
                    to={item.path}
                    className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 hover:bg-amber-100 transition-colors group"
                  >
                    <span className="text-sm font-semibold text-amber-900">{item.label}</span>
                    <ArrowRight size={16} className="text-amber-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 4. Systems Grid */}
        <section>
          <h2 className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 mb-3">
            Modules
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
            {links.map((link, index) => (
              <div key={index} className="h-full">
                <LinkCard
                  title={link.title}
                  description={link.description}
                  path={link.path}
                  icon={link.icon}
                  color={link.color}
                  bg={link.bg}
                  accent={link.accent}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HODHomeView;
