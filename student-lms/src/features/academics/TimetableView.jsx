import React from "react";
import { Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { useGetMyTimetableQuery } from "./academicApi"; // ✅ Import Hook

const TimetableView = () => {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // ✅ Fetch real timetable from backend
  const { data: scheduleRes, isLoading } = useGetMyTimetableQuery();

  // Fallback to empty schedule if no data yet
  const schedule = scheduleRes?.data || {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Class Schedule
        </h1>
        <p className="text-slate-500 mt-1 font-medium">
          Your weekly academic timetable.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {days.map((day, index) => (
          <div
            key={day}
            className={`flex flex-col md:flex-row border-b border-slate-100 last:border-0 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
          >
            <div className="md:w-48 p-6 flex items-center md:border-r border-slate-100 shrink-0">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Calendar size={20} className="text-blue-500" /> {day}
              </h2>
            </div>

            <div className="p-4 sm:p-6 flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Safely map the array for this specific day */}
              {!schedule[day] || schedule[day].length === 0 ? (
                <div className="flex items-center text-slate-400 font-medium text-sm py-2">
                  No classes scheduled for today.
                </div>
              ) : (
                schedule[day].map((cls, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border flex flex-col justify-between ${cls.color}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold pr-4 text-slate-800">
                        {cls.course}
                      </h4>
                      <span className="bg-white/60 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                        {cls.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold opacity-80 mt-auto text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} /> {cls.time}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} /> {cls.room || "TBA"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimetableView;
