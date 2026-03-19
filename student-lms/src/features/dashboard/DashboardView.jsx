import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  BookOpen,
  Award,
  Clock as ClockIcon,
  Loader2,
  ArrowRight,
  Megaphone,
  CalendarDays,
  Bell,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetMyTranscriptsQuery } from "../academics/transcriptApi";

const gradePoints = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  D: 1.0,
  F: 0.0,
};

// --- Live Clock Component ---
const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-end">
      <div className="text-2xl font-black text-blue-600 tracking-tight">
        {time.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </div>
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        {time.toLocaleDateString([], {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </div>
    </div>
  );
};

const DashboardView = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  // Fetch real academic data
  const { data: transcriptRes, isLoading } = useGetMyTranscriptsQuery();
  const records = transcriptRes?.data || [];

  // Calculate Dashboard Metrics
  const { currentCourses, cgpa, totalCredits } = useMemo(() => {
    let totalPoints = 0;
    let totalGradedCredits = 0;
    let earnedCredits = 0;

    const active = records.filter((r) =>
      ["Registered", "In-Progress"].includes(r.status),
    );

    records.forEach((record) => {
      const credits = record.courseId?.creditHours?.theory || 0;
      if (record.status === "Passed") earnedCredits += credits;

      if (record.grade && gradePoints[record.grade] !== undefined) {
        totalPoints += gradePoints[record.grade] * credits;
        totalGradedCredits += credits;
      }
    });

    const calculatedCgpa =
      totalGradedCredits > 0
        ? (totalPoints / totalGradedCredits).toFixed(2)
        : "0.00";

    return {
      currentCourses: active,
      cgpa: calculatedCgpa,
      totalCredits: earnedCredits,
    };
  }, [records]);

  // --- MOCK DATA FOR NEW WIDGETS (Replace with API later) ---
  const announcements = [
    {
      id: 1,
      title: "Fall Semester Mid-Terms Schedule Released",
      date: "2 hrs ago",
      type: "Academic",
      color: "bg-blue-100 text-blue-700",
    },
    {
      id: 2,
      title: "Campus IT Maintenance Downtime",
      date: "Yesterday",
      type: "General",
      color: "bg-orange-100 text-orange-700",
    },
    {
      id: 3,
      title: "Fee Submission Deadline Extended",
      date: "3 days ago",
      type: "Finance",
      color: "bg-green-100 text-green-700",
    },
  ];

  const upcomingEvents = [
    { id: 1, title: "Advanced Database Quiz 2", time: "Tomorrow, 10:00 AM" },
    { id: 2, title: "Software Eng. Project Phase 1", time: "Friday, 11:59 PM" },
    { id: 3, title: "Guest Lecture: AI in 2025", time: "Next Mon, 2:00 PM" },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <Loader2 className="animate-spin mb-4 text-blue-600" size={40} />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Ready to continue your learning journey?
          </p>
        </div>
        <LiveClock />
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <BookOpen size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">
              Active Courses
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {currentCourses.length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <Award size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">
              Current CGPA
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">{cgpa}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <ClockIcon size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">
              Credits Earned
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {totalCredits}
            </p>
          </div>
        </div>
      </div>

      {/* MAIN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (Wider) - Courses & Announcements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Courses Area */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Enrolled Courses
              </h2>
              <button
                onClick={() => navigate("/courses")}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg"
              >
                Registrations <ArrowRight size={16} />
              </button>
            </div>

            {currentCourses.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 p-10 rounded-2xl text-center">
                <BookOpen className="mx-auto mb-4 text-slate-300" size={40} />
                <h3 className="text-lg font-bold text-slate-900">
                  No Active Courses
                </h3>
                <p className="text-slate-500 mt-1 mb-4 text-sm">
                  You are not registered for any courses this term.
                </p>
                <button
                  onClick={() => navigate("/courses")}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-sm hover:bg-blue-700"
                >
                  Register Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentCourses.map((record) => (
                  <div
                    key={record._id}
                    className="rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all group flex flex-col"
                  >
                    <div className="h-24 bg-gradient-to-br from-slate-800 to-slate-900 p-4 flex flex-col justify-end relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-5 rounded-full blur-xl"></div>
                      <span className="text-white/80 text-[10px] font-black tracking-wider uppercase mb-1">
                        {record.courseId?.code || "CODE"}
                      </span>
                      <h3 className="text-white text-base font-bold leading-tight relative z-10 truncate">
                        {record.courseId?.title || "Unknown Course"}
                      </h3>
                    </div>
                    <div className="p-4 bg-white flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-semibold text-slate-500">
                          Credits: {record.courseId?.creditHours?.theory || 0}
                        </span>
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {record.status}
                        </span>
                      </div>
                      <div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{
                              width:
                                record.status === "In-Progress" ? "65%" : "10%",
                            }}
                          ></div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium text-right">
                          Semester in progress
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Announcements / Notice Board */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Megaphone className="text-blue-600" size={24} />
              <h2 className="text-xl font-bold text-slate-900">Notice Board</h2>
            </div>

            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="mt-1">
                    <Bell className="text-slate-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${announcement.color}`}
                      >
                        {announcement.type}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {announcement.date}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800">
                      {announcement.title}
                    </h3>
                  </div>
                  <ChevronRight className="text-slate-300 mt-2" size={20} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Narrow) - Sidebar Widgets */}
        <div className="space-y-6">
          {/* Calendar / Schedule Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CalendarDays className="text-blue-600" size={24} />
                <h2 className="text-lg font-bold text-slate-900">Upcoming</h2>
              </div>
              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-lg">
                This Week
              </span>
            </div>

            <div className="space-y-4">
              {upcomingEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="relative pl-4 border-l-2 border-slate-200 py-1"
                >
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -left-[5px] top-2 w-2 h-2 rounded-full ${index === 0 ? "bg-red-500 ring-4 ring-red-50" : "bg-blue-400"}`}
                  ></div>
                  <p className="text-xs font-bold text-slate-500 mb-0.5">
                    {event.time}
                  </p>
                  <p className="text-sm font-bold text-slate-800 leading-snug">
                    {event.title}
                  </p>
                </div>
              ))}
            </div>

            <button className="w-full mt-6 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-xl transition-colors border border-slate-200">
              View Full Calendar
            </button>
          </div>

          {/* Quick Support / Contact Widget */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-sm p-6 text-white text-center">
            <h3 className="font-bold text-lg mb-2">Need Academic Help?</h3>
            <p className="text-sm text-blue-100 mb-4">
              Contact your coordinator or IT support for assistance.
            </p>
            <button className="bg-white text-blue-700 w-full py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-blue-50 transition-colors">
              Open Support Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
