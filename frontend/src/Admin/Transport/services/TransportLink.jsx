import React from "react";
import {
  LayoutDashboard,
  Settings,
  ClipboardList,
  UserCheck,
  GraduationCap,
} from "lucide-react";

export const TransportLinks = () => {
  return [
    {
      title: "Dashboard",
      description: "Overview of application metrics and real-time trends.",
      path: "#",
      icon: <LayoutDashboard size={22} strokeWidth={2.5} />,
      color: "text-blue-600",
      bg: "bg-blue-100",
      accent: "bg-blue-600",
    },
    {
      title: "Student registration",
      description: "View and filter all submitted student applications.",
      path: "/transport/registration",
      icon: <ClipboardList size={22} strokeWidth={2.5} />,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      accent: "bg-emerald-600",
    },
    {
      title: "Graduation Clearance",
      description: "Confirm graduating students hold no transport allocation or dues.",
      path: "/clearance-desk",
      icon: <GraduationCap size={22} strokeWidth={2.5} />,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
      accent: "bg-indigo-600",
    },
  ];
};
