import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/slice/authSlice";
import logo from "../../assets/logo.png";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  CreditCard,
  LogOut,
  User,
  Menu,
  X,
  GraduationCap,
  Bell,
  Mail,
  Search,
  CalendarDays,
  ChevronDown,
  MonitorPlay,
  Calendar,
} from "lucide-react";

// --- Sub-Component: Live Header Clock ---
const HeaderClock = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden lg:flex items-center gap-2 text-slate-500 bg-slate-50/80 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
      <CalendarDays size={16} className="text-blue-600" />
      <span className="text-xs font-bold text-slate-700">
        {now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}
      </span>
      <span className="text-slate-300">|</span>
      <span className="text-xs font-bold text-slate-700 w-[60px] text-center">
        {now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
};

const StudentLayout = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // ✅ CORRECTED AND CONSISTENT SIDEBAR NAMING
  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "My Classroom", path: "/classroom", icon: MonitorPlay },
    { name: "Class Timetable", path: "/timetable", icon: Calendar },
    { name: "Date Sheet", path: "/datesheet", icon: CalendarDays },
    { name: "Course Registration", path: "/courses", icon: BookOpen },
    { name: "Transcripts & Results", path: "/transcripts", icon: FileText },
    { name: "Fee & Payments", path: "/finance", icon: CreditCard },
    { name: "My Profile", path: "/profile", icon: User },
  ];

  const SidebarContent = () => (
    <>
      {/* 1. Main Logo Area */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <img src={logo} alt="NEI Logo" className="h-10 w-10 object-contain" />
          <h1 className="text-2xl font-black text-red-900 tracking-tighter">
            CMS--NEI
          </h1>
        </div>
      </div>

      {/* 2. PROPERLY DESIGNED "STUDENT PORTAL" BADGE */}
      <div className="px-6 pt-6 pb-2">
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
          <div className="bg-white p-1.5 rounded-lg shadow-sm border border-red-50">
            <GraduationCap
              className="text-red-700"
              size={16}
              strokeWidth={2.5}
            />
          </div>
          <span className="text-xs font-black text-red-900 tracking-widest uppercase">
            Student Portal
          </span>
        </div>
      </div>

      {/* 3. Navigation Links */}
      <nav className="flex-1 px-4 mt-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* 4. Logout Button */}
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 transition-all font-bold text-sm"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex z-10 relative">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white shadow-2xl flex flex-col z-50 md:hidden transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* ========================================= */}
        {/* TOP NAVBAR (UPGRADED)                     */}
        {/* ========================================= */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
          {/* Left: Mobile Menu & Search */}
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-slate-500 hover:text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-200"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>

            {/* Global Search Bar (Hidden on Mobile) */}
            <div className="hidden md:flex items-center relative group">
              <Search
                className="absolute left-3 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Search courses, resources..."
                className="pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 w-64 lg:w-80 transition-all placeholder:text-slate-400 font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Right Side: Clock, Notifications, Profile */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Live Date/Time Component */}
            <HeaderClock />

            {/* Communication & Alerts */}
            <div className="flex items-center gap-1 sm:gap-2 border-r border-slate-200 pr-3 sm:pr-5">
              <button
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
                title="Messages"
              >
                <Mail size={20} />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white"></span>
              </button>
              <button
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors relative"
                title="Notifications"
              >
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
            </div>

            {/* User Profile Trigger */}
            <div
              className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-colors"
              onClick={() => navigate("/profile")}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900 leading-none">
                  {user?.name || "Student Name"}
                </p>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-1">
                  {user?.program || "Enrolled Program"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-200">
                {user?.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={20} />
                )}
              </div>
              <ChevronDown
                size={16}
                className="text-slate-400 hidden sm:block"
              />
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;
