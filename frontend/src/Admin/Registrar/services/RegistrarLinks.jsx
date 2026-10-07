import React from "react";
import {
  Megaphone,
  Users,
  Database,
  LibraryBig,
  CalendarDays,
  UserMinus,
  CheckCircle,
  GraduationCap,
  History,
  FileText,
  ShieldAlert,
  ClipboardList,
  Bell,
} from "lucide-react";

export const RegistrarLinks = () => {
  return [
    // ==========================================
    // ADMISSIONS & ONBOARDING (Section 8)
    // ==========================================
    {
      title: "Admission Campaigns",
      description:
        "Start a named admission session — the landing page announces it for 10 days.",
      path: "/registrar/admissions/campaigns",
      icon: <Megaphone size={22} strokeWidth={2.5} />,
      color: "text-blue-600",
      bg: "bg-blue-100",
      accent: "bg-blue-600",
    },
    {
      title: "Merit Lists & Enrollment",
      description:
        "View all submitted admission applications for the current cycle.",
      path: "/registrar/admissions/merit-lists",
      icon: <Users size={22} strokeWidth={2.5} />,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      accent: "bg-emerald-600",
    },

    // ==========================================
    // CORE STUDENT MANAGEMENT (Section 2.2)
    // ==========================================
    {
      title: "Student Master Database",
      description:
        "Manage complete student lifecycles, transfers, and official records.",
      path: "/registrar/students/directory",
      icon: <Database size={22} strokeWidth={2.5} />,
      color: "text-violet-600",
      bg: "bg-violet-100",
      accent: "bg-violet-600",
    },
    {
      title: "Course Withdrawals",
      description:
        "Read-only register of course withdrawals processed by Heads of Class.",
      path: "/registrar/students/withdrawals",
      icon: <UserMinus size={22} strokeWidth={2.5} />,
      color: "text-rose-600",
      bg: "bg-rose-100",
      accent: "bg-rose-600",
    },
    {
      title: "Disciplinary Files",
      description:
        "Log and maintain official student disciplinary actions and warnings.",
      path: "/registrar/students/disciplinary",
      icon: <ShieldAlert size={22} strokeWidth={2.5} />,
      color: "text-red-600",
      bg: "bg-red-100",
      accent: "bg-red-600",
    },

    // ==========================================
    // ACADEMIC ADMINISTRATION (Sections 6 & 9)
    // ==========================================
    {
      title: "Notifications",
      description: "Publish targeted notices to student and teacher portals.",
      path: "/communications/notifications",
      icon: <Bell size={22} strokeWidth={2.5} />,
      color: "text-blue-600",
      bg: "bg-blue-100",
      accent: "bg-blue-600",
    },
    {
      title: "Master Timetable",
      description:
        "Manage and oversee university-wide scheduling and departmental timetables.",
      path: "/registrar/timetable/master",
      icon: <CalendarDays size={22} strokeWidth={2.5} />,
      color: "text-orange-600",
      bg: "bg-orange-100",
      accent: "bg-orange-600",
    },

    // ==========================================
    // GRADUATION & ALUMNI (Sections 2.2 & 5)
    // ==========================================
    {
      title: "Graduation & Degree Clearance",
      description:
        "Track every student through HOD, Exam, offices and Accounts, give final approval and manage the graduate list.",
      path: "/registrar/graduation/clearances",
      icon: <CheckCircle size={22} strokeWidth={2.5} />,
      color: "text-amber-600",
      bg: "bg-amber-100",
      accent: "bg-amber-600",
    },
    {
      title: "Exam Results Register",
      description:
        "Read-only record of exam results across the university, by approval stage.",
      path: "/registrar/results/register",
      icon: <ClipboardList size={22} strokeWidth={2.5} />,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      accent: "bg-emerald-600",
    },
    {
      title: "Alumni Records",
      description:
        "Manage graduated student profiles and alumni networking records.",
      path: "/registrar/alumni",
      icon: <History size={22} strokeWidth={2.5} />,
      color: "text-teal-600",
      bg: "bg-teal-100",
      accent: "bg-teal-600",
    },

    // ==========================================
    // REPORTING (Section 9)
    // ==========================================
    {
      title: "Compliance Reporting",
      description:
        "Generate official administrative and compliance reports for the VC.",
      path: "/registrar/reports/compliance",
      icon: <FileText size={22} strokeWidth={2.5} />,
      color: "text-slate-600",
      bg: "bg-slate-200",
      accent: "bg-slate-600",
    },
    {
      title: "Course Code Assignment",
      description:
        "Assign official course codes to Admin-created courses to activate them.",
      path: "/registrar/course/managements",
      icon: <FileText size={22} strokeWidth={2.5} />,
      color: "text-slate-600",
      bg: "bg-slate-200",
      accent: "bg-slate-600",
    },
  ];
};
