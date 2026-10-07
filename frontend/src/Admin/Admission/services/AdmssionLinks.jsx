import React from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  UserCheck,
  UserPlus,
  IdCard,
} from "lucide-react";

export const AdmssionLinks = () => {
  return [
    {
      title: "Dashboard",
      description: "Overview of application metrics and real-time trends.",
      path: "/admission-office/dashboard",
      icon: <LayoutDashboard size={22} strokeWidth={2.5} />,
      color: "text-blue-600",
      bg: "bg-blue-100",
      accent: "bg-blue-600",
    },
    {
      title: "Admission Process",
      description: "The full applicant pipeline — draft to fee payment, plus trash & stats.",
      path: "/admission-office/admission-list",
      icon: <ClipboardList size={22} strokeWidth={2.5} />,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      accent: "bg-emerald-600",
    },
    {
      title: "Student Management",
      description: "Search, edit, and manage every registered student — including delete, restore, and trash.",
      path: "/admission-office/admission-management",
      icon: <Users size={22} strokeWidth={2.5} />,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
      accent: "bg-indigo-600",
    },
    {
      title: "Student Promotion",
      description: "Approve or reject candidates based on merit scores.",
      path: "/admission-office/student-promotion",
      icon: <UserCheck size={22} strokeWidth={2.5} />,
      color: "text-amber-600",
      bg: "bg-amber-100",
      accent: "bg-amber-600",
    },
    // {
    //   title: "New Admissions",
    //   description: "See which new admissions have a challan generated and paid.",
    //   path: "/admission-office/new-admissions",
    //   icon: <UserPlus size={22} strokeWidth={2.5} />,
    //   color: "text-emerald-600",
    //   bg: "bg-emerald-100",
    //   accent: "bg-emerald-600",
    // },
    {
      title: "Manual Admission",
      description: "Register a walk-in student directly — no email verification required.",
      path: "/admission-office/manual-admission",
      icon: <UserPlus size={22} strokeWidth={2.5} />,
      color: "text-teal-600",
      bg: "bg-teal-100",
      accent: "bg-teal-600",
    },
    {
      title: "Student Cards",
      description: "Take or select a photo and generate print-ready student ID cards with validity dates and sessions.",
      path: "/admission-office/student-cards",
      icon: <IdCard size={22} strokeWidth={2.5} />,
      color: "text-violet-600",
      bg: "bg-violet-100",
      accent: "bg-violet-600",
    },
  ];
};
