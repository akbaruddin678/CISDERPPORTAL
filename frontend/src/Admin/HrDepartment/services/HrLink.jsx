import React from "react";
import {
  Users,
  UserPlus,
  CalendarCheck,
  CalendarClock,
  Banknote,
  Briefcase,
  TrendingUp,
  UserMinus,
  Fingerprint,
  ClipboardList,
  GraduationCap,
  Boxes,
  Bell,
  BookOpen,
  Landmark,
  Crown,
  School,
  UsersRound,
} from "lucide-react";

export const HrLink = () => {
  return [
    // --- EMPLOYEE MANAGEMENT ---
    {
      title: "Staff Directory",
      description:
        "View and manage profiles for all active teachers and staff.",
      path: "/hr/employees",
      icon: <Users size={24} strokeWidth={2} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      accent: "bg-blue-600",
      category: "Employee Management",
    },
    {
      title: "Onboard New Hire",
      description:
        "Register new employees, assign departments, and generate Employee IDs.",
      path: "/hr/onboard",
      icon: <UserPlus size={24} strokeWidth={2} />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      accent: "bg-emerald-600",
      category: "Employee Management",
    },
    {
      title: "Onboarding Requests",
      description:
        "Review applications submitted through the public teacher/staff onboarding page.",
      path: "/hr/onboarding-requests",
      icon: <ClipboardList size={24} strokeWidth={2} />,
      color: "text-amber-600",
      bg: "bg-amber-50",
      accent: "bg-amber-600",
      category: "Employee Management",
    },

    // --- ROLE-BASED MANAGEMENT ---
    {
      title: "Teacher Management",
      description: "Manage only teaching staff — profiles, status, and access.",
      path: "/hr/employees/role/teacher",
      icon: <BookOpen size={24} strokeWidth={2} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      accent: "bg-blue-600",
      category: "Role-Based Management",
    },
    {
      title: "HOD Management",
      description: "Manage only Heads of Department.",
      path: "/hr/employees/role/hod",
      icon: <Landmark size={24} strokeWidth={2} />,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      accent: "bg-indigo-600",
      category: "Role-Based Management",
    },
    {
      title: "VC Management",
      description: "Manage only the Vice Chancellor and Pro/Vice VC.",
      path: "/hr/employees/role/vc",
      icon: <Crown size={24} strokeWidth={2} />,
      color: "text-amber-600",
      bg: "bg-amber-50",
      accent: "bg-amber-600",
      category: "Role-Based Management",
    },
    {
      title: "Head of Academia Management",
      description: "Manage only university-wide academic oversight staff.",
      path: "/hr/employees/role/head_of_academia",
      icon: <School size={24} strokeWidth={2} />,
      color: "text-violet-600",
      bg: "bg-violet-50",
      accent: "bg-violet-600",
      category: "Role-Based Management",
    },
    {
      title: "Other Staff Management",
      description: "Manage everyone outside Teacher, HOD, VC, and Head of Academia.",
      path: "/hr/employees/role/other",
      icon: <UsersRound size={24} strokeWidth={2} />,
      color: "text-slate-600",
      bg: "bg-slate-50",
      accent: "bg-slate-600",
      category: "Role-Based Management",
    },

    // --- TIME & ATTENDANCE ---
    {
      title: "Notifications",
      description: "Publish targeted notices to student and teacher portals.",
      path: "/communications/notifications",
      icon: <Bell size={24} strokeWidth={2} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      accent: "bg-blue-600",
      category: "Employee Management",
    },
    {
      title: "Staff Attendance",
      description: "Review daily attendance, biometric punch times, and correct records manually.",
      path: "/hr/attendance",
      icon: <CalendarCheck size={24} strokeWidth={2} />,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      accent: "bg-indigo-600",
      category: "Time & Attendance",
    },
    {
      title: "Attendance Kiosk",
      description: "Open the self-service check-in/check-out screen for a shared terminal.",
      path: "/attendance-kiosk",
      icon: <Fingerprint size={24} strokeWidth={2} />,
      color: "text-teal-600",
      bg: "bg-teal-50",
      accent: "bg-teal-600",
      category: "Time & Attendance",
    },
    {
      title: "Leave Approvals",
      description:
        "Review and approve sick, annual, and maternity leave requests.",
      path: "/hr/leaves",
      icon: <CalendarClock size={24} strokeWidth={2} />,
      color: "text-orange-600",
      bg: "bg-orange-50",
      accent: "bg-orange-600",
      category: "Time & Attendance",
    },

    // --- PAYROLL & PERFORMANCE ---
    {
      title: "Payroll & Salary",
      description:
        "Process monthly salaries, deductions, and generate salary slips.",
      path: "/hr/payroll",
      icon: <Banknote size={24} strokeWidth={2} />,
      color: "text-green-600",
      bg: "bg-green-50",
      accent: "bg-green-600",
      category: "Payroll & Performance",
    },
    {
      title: "Appraisals & KPIs",
      description:
        "Manage yearly performance reviews and employee goal tracking.",
      path: "/hr/appraisals",
      icon: <TrendingUp size={24} strokeWidth={2} />,
      color: "text-purple-600",
      bg: "bg-purple-50",
      accent: "bg-purple-600",
      category: "Payroll & Performance",
    },

    // --- RECRUITMENT & EXIT ---
    {
      title: "Recruitment & Hiring",
      description:
        "Post job openings, track applicants, and schedule interviews.",
      path: "/hr/recruitment",
      icon: <Briefcase size={24} strokeWidth={2} />,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      accent: "bg-cyan-600",
      category: "Recruitment & Exit",
    },
    {
      title: "Exit Management",
      description:
        "Process resignations, final settlements, and clearance forms.",
      path: "/hr/exits",
      icon: <UserMinus size={24} strokeWidth={2} />,
      color: "text-rose-600",
      bg: "bg-rose-50",
      accent: "bg-rose-600",
      category: "Recruitment & Exit",
    },
    {
      title: "Alumni Portal",
      description:
        "Browse former teachers and staff — designation, department, and exit history.",
      path: "/hr/alumni",
      icon: <GraduationCap size={24} strokeWidth={2} />,
      color: "text-violet-600",
      bg: "bg-violet-50",
      accent: "bg-violet-600",
      category: "Recruitment & Exit",
    },

    // --- INVENTORY & ASSETS ---
    {
      title: "Inventory Management",
      description:
        "Rooms, furniture, stationery, and equipment — tracked and issued against staff records.",
      path: "/hr/inventory",
      icon: <Boxes size={24} strokeWidth={2} />,
      color: "text-teal-600",
      bg: "bg-teal-50",
      accent: "bg-teal-600",
      category: "Inventory & Assets",
    },
  ];
};
