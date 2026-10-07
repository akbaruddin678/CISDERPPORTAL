import React from "react";
import { LayoutDashboard, BookOpenCheck, GraduationCap, ShieldCheck } from "lucide-react";

export const HeadofAcademiaLinks = () => {
  return [
    {
      title: "Head of Academia Dashboard",
      description: "Overview of active exams and result statistics.",
      path: "/academia/dashboard", // ✅ Fixed Path
      icon: <LayoutDashboard size={22} strokeWidth={2.5} />,
      color: "text-blue-600",
      bg: "bg-blue-100",
      accent: "bg-blue-600",
    },
    {
      title: "Course Catalog",
      description: "Browse all active courses by class and program.",
      path: "/academia/course-review", // ✅ Fixed Path! This must match getAdminRoutes
      icon: <BookOpenCheck size={22} strokeWidth={2.5} />,
      color: "text-sky-600",
      bg: "bg-sky-100",
      accent: "bg-sky-600",
    },
    {
      title: "Program Regulations",
      description: "Set credit-hour limits and degree duration per program and admission batch.",
      path: "/academia/program-regulations",
      icon: <ShieldCheck size={22} strokeWidth={2.5} />,
      color: "text-violet-600",
      bg: "bg-violet-100",
      accent: "bg-violet-600",
    },
    {
      title: "Approve Marks",
      description: "Review exam marks approved by class heads, then forward to the VC.",
      path: "/academia/approve-marks",
      icon: <GraduationCap size={22} strokeWidth={2.5} />,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      accent: "bg-emerald-600",
    },
  ];
};
