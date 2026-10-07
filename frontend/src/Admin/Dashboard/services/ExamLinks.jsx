import React from "react";
import {
  FilePlus2,
  UploadCloud,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  FileSpreadsheet,
} from "lucide-react";

export const ExamLinks = () => {
  return [
    {
      title: "Exam Dashboard",
      description: "Overview of active exams and result statistics.",
      path: "/exam/dashboard",
      icon: <LayoutDashboard size={22} strokeWidth={2.5} />,
      color: "text-blue-600",
      bg: "bg-blue-100",
      accent: "bg-blue-600",
    },
    {
      title: "Student Registration",
      description: "Register Student into their respective Course.",
      path: "/exam/student/registration", 
      icon: <FilePlus2 size={22} strokeWidth={2.5} />,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      accent: "bg-emerald-600",
    },
    {
      title: "Create Exam",
      description: "Schedule new exams, set subjects, and define criteria.",
      path: "/exam/create", 
      icon: <FilePlus2 size={22} strokeWidth={2.5} />,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      accent: "bg-emerald-600",
    },
    {
      title: "Marks Upload",
      description: "Upload student marks via Excel or manual entry.",
      path: "/exam/marks-upload",
      icon: <UploadCloud size={22} strokeWidth={2.5} />,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
      accent: "bg-indigo-600",
    },
    {
      title: "Date Sheet",
      description: "Manage and view the examination schedule.",
      path: "/exam/schedule",
      icon: <CalendarDays size={22} strokeWidth={2.5} />,
      color: "text-orange-600",
      bg: "bg-orange-100",
      accent: "bg-orange-600",
    },
    {
      title: "Results",
      description: "Generate transcript and view student performance.",
      path: "/exam/results",
      icon: <GraduationCap size={22} strokeWidth={2.5} />,
      color: "text-purple-600",
      bg: "bg-purple-100",
      accent: "bg-purple-600",
    },
  ];
};
