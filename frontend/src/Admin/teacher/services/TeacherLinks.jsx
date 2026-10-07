import React from "react";
import {
  BookOpenCheck,
  Users,
  CalendarDays,
  CalendarClock,
  GraduationCap,
  ClipboardList,
  IdCard,
} from "lucide-react";

export const TeacherLink = () => {
  // 1. Define the base links that ALL teachers see
  const links = [
    {
      title: "My Profile",
      description:
        "View your personal, academic, and employment details.",
      path: "/teacher/profile",
      icon: <IdCard size={24} strokeWidth={2} />,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      category: "Academic Operations",
    },
    {
      title: "My Classes & Schedule",
      description:
        "View your assigned courses, enrolled students, and timetable.",
      path: "/teacher/classes",
      icon: <BookOpenCheck size={24} strokeWidth={2} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      category: "Academic Operations",
    },
    {
      title: "My Schedule",
      description:
        "Your weekly class timetable — day, time, and room for every course.",
      path: "/teacher/schedule",
      icon: <CalendarClock size={24} strokeWidth={2} />,
      color: "text-sky-600",
      bg: "bg-sky-50",
      category: "Academic Operations",
    },
    {
      title: "Mark Attendance",
      description:
        "Record daily class attendance and monitor student absences.",
      path: "/teacher/attendance",
      icon: <Users size={24} strokeWidth={2} />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      category: "Academic Operations",
    },
    {
      title: "Upload Exam Marks",
      description:
        "Submit Midterm and Final exam marks for your assigned subjects.",
      path: "/teacher/marks",
      icon: <GraduationCap size={24} strokeWidth={2} />,
      color: "text-purple-600",
      bg: "bg-purple-50",
      category: "Academic Operations",
    },
    {
      title: "Assignments",
      description:
        "Create assignments, set due dates, and manage extensions.",
      path: "/teacher/assignments",
      icon: <ClipboardList size={24} strokeWidth={2} />,
      color: "text-teal-600",
      bg: "bg-teal-50",
      category: "Academic Operations",
    },
    {
      title: "My Leave Requests",
      description:
        "Apply for casual, medical, or annual leave and track HOD/HR approval.",
      path: "/teacher/leaves",
      icon: <CalendarDays size={24} strokeWidth={2} />,
      color: "text-orange-600",
      bg: "bg-orange-50",
      category: "Administrative",
    },
  ];

  return links;
};
