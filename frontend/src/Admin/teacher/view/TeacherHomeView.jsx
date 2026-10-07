import React from "react";
import { Link } from "react-router-dom";
import { TeacherLink } from "../services/TeacherLinks.jsx";
import StatTile from "../components/StatTile.jsx";
import {
  BookOpenCheck,
  GraduationCap,
  CalendarDays,
  CalendarRange,
  ArrowUpRight,
  Sparkles,
  LayoutGrid,
  ClipboardList,
  Bell,
} from "lucide-react";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const STAT_TILES = [
  { key: "activeCourseCount", label: "Active Courses", icon: BookOpenCheck, color: "#2563eb", bg: "#eff6ff" },
  { key: "pendingMarksCount", label: "Pending Grading", icon: GraduationCap, color: "#7c3aed", bg: "#f5f3ff" },
  { key: "pendingLeaveCount", label: "Leave Requests", icon: CalendarDays, color: "#b45309", bg: "#fffbeb" },
  { key: "openSubstitutionCount", label: "Open Substitutions", icon: CalendarRange, color: "#be185d", bg: "#fdf2f8" },
];

const CATEGORY_META = {
  "Academic Operations": { icon: LayoutGrid, color: "#2563eb" },
  Administrative: { icon: ClipboardList, color: "#7c3aed" },
};

const TeacherHomeView = ({ isLoading, user, stats = {}, notifications = [], isLoadingNotifications = false }) => {
  const roles = user?.roles || [];
  const links = TeacherLink(roles);
  const categories = ["Academic Operations", "Administrative"];
  const displayName = stats.teacherName || "Professor";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-slate-50 pb-14 font-sans w-full">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white pt-14 pb-24 px-6 sm:px-12">
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto flex items-center gap-5 flex-wrap">
          {stats.profilePhotoUrl ? (
            <img
              src={stats.profilePhotoUrl}
              alt={displayName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white/15 flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center font-black text-2xl flex-shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles size={13} /> {today}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {getGreeting()}, {isLoading ? "…" : displayName}
            </h1>
            <p className="text-indigo-200/70 text-sm md:text-base mt-1">
              {stats.designation ? `${stats.designation} · ` : ""}Here's what's on your plate today.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-14 max-w-7xl mx-auto px-6 sm:px-12 space-y-10">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {STAT_TILES.map(({ key, ...tile }) => (
            <StatTile key={key} {...tile} value={stats[key]} isLoading={isLoading} />
          ))}
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-black text-slate-900"><Bell size={18} className="text-blue-700" /> Notifications</h2>
              <p className="mt-1 text-xs text-slate-500">Notices sent to teachers or directly to you.</p>
            </div>
            {notifications.length > 0 && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-extrabold text-blue-700">{notifications.length}</span>}
          </div>
          {isLoadingNotifications ? (
            <div className="space-y-2">{[1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
          ) : notifications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-8 text-center text-sm font-semibold text-slate-500">No new notifications.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {notifications.slice(0, 6).map((notification) => (
                <article key={notification._id} className={`rounded-xl border p-4 ${notification.type === "Urgent" ? "border-rose-200 bg-rose-50/60" : "border-slate-200 bg-white"}`}>
                  <div className="flex items-center justify-between gap-3"><span className={`text-[10px] font-extrabold uppercase tracking-wider ${notification.type === "Urgent" ? "text-rose-700" : "text-blue-700"}`}>{notification.type}</span><time className="text-[11px] text-slate-400">{new Date(notification.date || notification.createdAt).toLocaleDateString()}</time></div>
                  <h3 className="mt-2 text-sm font-extrabold text-slate-900">{notification.title}</h3>
                  <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600">{notification.body || notification.summary}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Module groups */}
        {categories.map((category) => {
          const categoryLinks = links.filter((link) => link.category === category);
          if (categoryLinks.length === 0) return null;
          const meta = CATEGORY_META[category] || {};
          const CategoryIcon = meta.icon;

          return (
            <div key={category} className="space-y-4">
              <div
                className="flex items-center gap-2.5 pl-3 border-l-4 rounded-sm"
                style={{ borderColor: meta.color }}
              >
                {CategoryIcon && (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
                  >
                    <CategoryIcon size={16} />
                  </div>
                )}
                <h2 className="text-base font-black text-slate-800 uppercase tracking-wide">{category}</h2>
                <span className="text-xs font-bold text-slate-400">({categoryLinks.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {categoryLinks.map((link, index) => (
                  <Link
                    key={index}
                    to={link.path}
                    className="relative text-left group block bg-white rounded-2xl border border-slate-200 p-6 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 w-full overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1 ${link.accent || "bg-indigo-500"} scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300`} />
                    <div className="flex items-start justify-between mb-4">
                      <div className={`inline-flex p-3 rounded-xl ${link.bg} ${link.color}`}>
                        {link.icon}
                      </div>
                      <ArrowUpRight
                        size={18}
                        className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                      />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 mb-1.5 group-hover:text-indigo-700 transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {link.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherHomeView;
