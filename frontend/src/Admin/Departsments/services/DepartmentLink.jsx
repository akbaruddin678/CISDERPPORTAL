import React from "react";
import {
  Building,
  Users,
  BookOpenCheck,
  GraduationCap,
  FileText,
  ClipboardList,
  UserCircle,
} from "lucide-react";

export const DepartmentLink = () => {
  return [
    {
      title: "My Class",
      description: "Overview of your department's structure and key metrics.",
      path: "/departments/mydepartments",
      icon: <Building size={22} strokeWidth={2.5} />,
      color: "text-cyan-600",
      bg: "bg-cyan-100",
      accent: "bg-cyan-600",
    },
    {
      title: "Class Faculty",
      description: "Manage teachers, assign roles, and view faculty schedules.",
      path: "/departments/teachers",
      icon: <Users size={22} strokeWidth={2.5} />,
      color: "text-blue-600",
      bg: "bg-blue-100",
      accent: "bg-blue-600",
    },
    {
      title: "Class Students",
      description: "View enrolled students, academic standing, and batches.",
      path: "/departments/students",
      icon: <GraduationCap size={22} strokeWidth={2.5} />,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      accent: "bg-emerald-600",
    },
    {
      title: "Course Management",
      description: "Manage programs, sections, and active course offerings.",
      path: "/departments/courses",
      icon: <BookOpenCheck size={22} strokeWidth={2.5} />,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
      accent: "bg-indigo-600",
    },
    {
      title: "Subject Allocation",
      description: "Assign specific subjects to faculty for upcoming terms.",
      path: "/departments/subjects",
      icon: <FileText size={22} strokeWidth={2.5} />,
      color: "text-purple-600",
      bg: "bg-purple-100",
      accent: "bg-purple-600",
    },
    {
      title: "Class Exams",
      description: "View upcoming departmental exams and invigilation duties.",
      path: "/departments/exams",
      icon: <ClipboardList size={22} strokeWidth={2.5} />,
      color: "text-orange-600",
      bg: "bg-orange-100",
      accent: "bg-orange-600",
    },
    {
      title: "Coordinators & HOD",
      description: "Manage class coordinators and HOD assignments.",
      path: "/departments/coordinators",
      icon: <UserCircle size={22} strokeWidth={2.5} />,
      color: "text-pink-600",
      bg: "bg-pink-100",
      accent: "bg-pink-600",
    },
  ];
};
