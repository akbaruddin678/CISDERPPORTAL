import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/slice/authSlice";
import logo from "../../assets/neilogo.png";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  CreditCard,
  LogOut,
  User,
  Menu,
  Bell,
  Mail,
  Search,
  CalendarDays,
  ChevronDown,
  MonitorPlay,
  Calendar,
  X,
} from "lucide-react";

/* ── HEADER CLOCK ─────────────────────────────────────────────────── */
const HeaderClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/60 border border-slate-200/60 shadow-sm">
      <CalendarDays size={13} className="text-red-900" />
      <span className="text-xs font-semibold text-slate-600">
        {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
      </span>
      <span className="w-px h-3 bg-slate-300" />
      <span className="text-xs font-bold text-red-900 tabular-nums">
        {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </span>
    </div>
  );
};

/* ── NAV ITEMS ────────────────────────────────────────────────────── */
const navItems = [
  { name: "Dashboard",  path: "/dashboard",  icon: LayoutDashboard },
  { name: "Classroom",  path: "/classroom",  icon: MonitorPlay     },
  { name: "Timetable",  path: "/timetable",  icon: Calendar        },
  { name: "Date Sheet", path: "/datesheet",  icon: CalendarDays    },
  { name: "Courses",    path: "/courses",    icon: BookOpen        },
  { name: "Transcripts",path: "/transcripts",icon: FileText        },
  { name: "Finance",    path: "/finance",    icon: CreditCard      },
  { name: "Profile",    path: "/profile",    icon: User            },
];

/* ── SIDEBAR ──────────────────────────────────────────────────────── */
const SidebarContent = ({ onClose }) => {
  const location = useLocation();

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200">

      {/* Decorative glow top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-red-100/60 blur-3xl pointer-events-none" />

      {/* ── LOGO ── */}
      <div className="relative px-5 pt-6 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center overflow-hidden">
              <img src={logo} className="h-8 w-8 object-contain" alt="NEI Logo" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-red-900 tracking-tight leading-none">NEI CMS</h1>
                <p className="text-xs text-slate-400 font-semibold mt-1 tracking-wide uppercase">Student Portal</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="mt-5 h-px bg-slate-100" />
      </div>

      {/* ── NAV ── */}
      <nav className="flex-1 px-3 pb-2 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] px-3 mb-3">Navigation</p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => onClose?.()}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                active
                  ? "bg-red-900 text-white shadow-md shadow-red-900/30"
                  : "text-slate-600 hover:bg-red-50 hover:text-red-900"
              }`}
            >
              {/* Active left accent */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-red-300" />
              )}

              <span className={`flex-shrink-0 transition-transform duration-150 group-hover:scale-110 ${active ? "text-red-200" : ""}`}>
                <Icon size={17} />
              </span>
              <span className="truncate">{item.name}</span>

              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-300 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── LOGOUT ── */}
      <div className="px-3 pb-6 pt-3">
        <div className="h-px bg-slate-100 mb-4" />
        <button
          onClick={() => {}}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl
            bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200
            text-red-800 hover:text-red-900 font-semibold text-sm
            transition-all duration-150 group"
          id="logout-btn"
        >
          <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform duration-150" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

/* ── MAIN LAYOUT ──────────────────────────────────────────────────── */
const StudentLayout = () => {
  const location  = useLocation();
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const user      = useSelector((state) => state.auth.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // Wire logout button
  useEffect(() => {
    const btn = document.getElementById("logout-btn");
    if (btn) btn.onclick = handleLogout;
  });

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:block w-60 flex-shrink-0 relative shadow-2xl shadow-red-950/30 z-20">
        <SidebarContent />
      </aside>

      {/* ── MOBILE OVERLAY ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── MOBILE SIDEBAR ── */}
      <aside
        className={`fixed md:hidden inset-y-0 left-0 w-64 z-50 transition-transform duration-300 ease-out shadow-2xl shadow-black/40
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── TOP BAR ── */}
        <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 sm:px-6
          bg-white border-b border-slate-200/80 shadow-sm z-10">

          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={19} />
            </button>

            {/* Search */}
            <div className="hidden md:flex items-center relative">
              <Search className="absolute left-3 text-slate-400 pointer-events-none" size={14} />
              <input
                placeholder="Search anything..."
                className="pl-8 pr-4 py-1.5 w-56 rounded-xl bg-slate-100 border border-transparent
                  focus:outline-none focus:bg-white focus:border-slate-200 focus:shadow-sm
                  text-sm text-slate-700 placeholder:text-slate-400 transition-all duration-200"
              />
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 sm:gap-3">

            <HeaderClock />

            {/* Icon buttons */}
            <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors relative">
              <Mail size={17} />
            </button>
            <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors relative">
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-700" />
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-slate-200" />

            {/* Profile chip */}
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-all duration-150 group"
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm"
                style={{ background: "linear-gradient(135deg, #7f1d1d, #be123c)" }}>
                {user?.name?.charAt(0) || "S"}
              </div>

              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight max-w-[100px] truncate">{user?.name || "Student"}</p>
                <p className="text-[10px] text-red-700 font-semibold leading-tight max-w-[100px] truncate">{user?.program || "Program"}</p>
              </div>

              <ChevronDown size={13} className="text-slate-400 group-hover:text-slate-600 transition-colors hidden sm:block" />
            </button>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;