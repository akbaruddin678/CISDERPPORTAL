import React, { useMemo } from "react";
import { Loader2, Printer, Clock, BookOpen, FlaskConical } from "lucide-react";

const TimetableView = () => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const isLoading = false;

  // ✅ STATIC DATA — untouched
  const schedule = {
    Monday: [
      { time: "08:30 - 09:30", course: "Web Engineering",   type: "Lecture", room: "Room 101" },
      { time: "10:00 - 12:00", course: "Database Systems",  type: "Lab",     room: "Lab 2"    },
    ],
    Tuesday: [
      { time: "09:00 - 10:00", course: "Operating Systems", type: "Lecture", room: "Room 203" },
      { time: "11:00 - 12:00", course: "Data Structures",   type: "Lecture", room: "Room 105" },
    ],
    Wednesday: [
      { time: "08:30 - 09:30", course: "Computer Networks", type: "Lecture", room: "Room 304" },
      { time: "10:00 - 12:00", course: "Programming Lab",   type: "Lab",     room: "CS Lab"   },
    ],
    Thursday: [
      { time: "09:00 - 10:00", course: "Software Engineering", type: "Lecture", room: "Room 202" },
    ],
    Friday: [
      { time: "11:00 - 12:00", course: "Artificial Intelligence", type: "Lecture", room: "Room 401" },
    ],
    Saturday: [],
  };

  const timeSlots = useMemo(() => {
    const times = new Set();
    days.forEach((day) => {
      schedule[day]?.forEach((cls) => { if (cls.time) times.add(cls.time); });
    });
    return Array.from(times).sort();
  }, []);

  const getClassForSlot = (day, time) =>
    schedule[day]?.find((cls) => cls.time === time);

  const handlePrint = () => window.print();

  // Count total classes per day for the legend dots
  const dayClassCount = (day) => schedule[day]?.length || 0;

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50 rounded-2xl">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <Loader2 className="animate-spin text-red-900" size={26} />
        </div>
        <p className="text-slate-500 font-semibold text-sm">Loading timetable…</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">

      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden rounded-2xl shadow-md shadow-red-900/15 no-print"
        style={{ background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 60%, #b91c1c 100%)" }}>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute bottom-0 left-1/3 w-24 h-24 rounded-full bg-red-950/30 blur-xl" />

        <div className="relative z-10 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center">
                <Clock size={14} className="text-red-200" />
              </div>
              <span className="text-red-200/70 text-xs font-semibold uppercase tracking-widest">Weekly Schedule</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Class Timetable</h1>
            <p className="text-red-200/60 text-xs mt-1">
              {timeSlots.length} time slots · {days.filter(d => dayClassCount(d) > 0).length} active days
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="no-print inline-flex items-center gap-2 bg-white hover:bg-red-50 text-red-900 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-150 active:scale-95 shadow-sm flex-shrink-0"
          >
            <Printer size={16} />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* ── DAY SUMMARY CHIPS ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-print">
        {days.map((day) => {
          const count   = dayClassCount(day);
          const isToday = day === today;
          return (
            <div
              key={day}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isToday
                  ? "bg-red-900 text-white border-red-900 shadow-sm shadow-red-900/30"
                  : count > 0
                  ? "bg-white text-slate-700 border-slate-200"
                  : "bg-slate-50 text-slate-400 border-slate-100"
              }`}
            >
              <span>{day.slice(0, 3)}</span>
              {count > 0 && (
                <span className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center ${
                  isToday ? "bg-white/20 text-white" : "bg-red-50 text-red-900"
                }`}>
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── TIMETABLE ── */}
      <div className="overflow-x-auto rounded-2xl shadow-md border-2 border-slate-300 bg-white">
        <table className="w-full border-collapse text-sm">

          {/* HEADER */}
          <thead>
            <tr>
              {/* Time column header */}
              <th className="p-4 text-left min-w-[130px] sticky left-0 z-10 bg-white border-b-2 border-r-2 border-slate-300">
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-red-900" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Time</span>
                </div>
              </th>

              {days.map((day) => {
                const isToday = day === today;
                return (
                  <th
                    key={day}
                    className={`p-4 text-center min-w-[160px] border-b-2 border-r-2 border-slate-300 last:border-r-0 ${
                      isToday ? "bg-red-900" : "bg-white"
                    }`}
                  >
                    <p className={`text-xs font-black uppercase tracking-wider ${isToday ? "text-white" : "text-slate-700"}`}>
                      {day}
                    </p>
                    {dayClassCount(day) > 0 ? (
                      <p className={`text-[10px] font-medium mt-0.5 ${isToday ? "text-red-200" : "text-slate-400"}`}>
                        {dayClassCount(day)} class{dayClassCount(day) > 1 ? "es" : ""}
                      </p>
                    ) : (
                      <p className={`text-[10px] font-medium mt-0.5 ${isToday ? "text-red-300" : "text-slate-300"}`}>No class</p>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {timeSlots.map((time, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>

                {/* TIME CELL */}
                <td className="p-4 border-b-2 border-r-2 border-slate-300 sticky left-0 z-10 bg-inherit">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-8 rounded-full bg-red-900/20 flex-shrink-0" />
                    <span className="text-xs font-bold text-red-900 whitespace-nowrap">{time}</span>
                  </div>
                </td>

                {/* DAY CELLS */}
                {days.map((day) => {
                  const cls     = getClassForSlot(day, time);
                  const isToday = day === today;
                  const isLab   = cls?.type?.toLowerCase() === "lab";

                  return (
                    <td
                      key={day}
                      className={`border-b-2 border-r-2 border-slate-200 last:border-r-0 p-2 align-top ${
                        isToday ? "bg-red-900/[0.02]" : ""
                      }`}
                    >
                      {cls ? (
                        <div className={`min-h-[88px] flex flex-col justify-between rounded-xl p-3 border transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 ${
                          isLab
                            ? "bg-amber-50 border-2 border-amber-300"
                            : "bg-red-50 border-2 border-red-200"
                        }`}>
                          <div>
                            {/* Type badge */}
                            <div className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-2 ${
                              isLab
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {isLab
                                ? <FlaskConical size={9} />
                                : <BookOpen size={9} />
                              }
                              {cls.type}
                            </div>

                            <p className="font-bold text-slate-800 text-xs leading-snug">
                              {cls.course}
                            </p>
                          </div>

                          {/* Room */}
                          <div className="flex items-center gap-1 mt-2">
                            <div className={`w-1 h-1 rounded-full ${isLab ? "bg-amber-400" : "bg-red-400"}`} />
                            <p className={`text-[11px] font-semibold ${isLab ? "text-amber-700" : "text-red-700"}`}>
                              {cls.room}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="min-h-[88px] flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── LEGEND ── */}
      <div className="flex items-center gap-4 no-print pb-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Legend</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
          <span className="text-xs text-slate-500 font-medium">Lecture</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />
          <span className="text-xs text-slate-500 font-medium">Lab</span>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <div className="w-4 h-3 rounded bg-red-900" />
          <span className="text-xs text-slate-500 font-medium">Today</span>
        </div>
      </div>

      {/* ── PRINT STYLES ── */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          @page { size: A4 landscape; margin: 10mm; }
          th, td { border: 2px solid #cbd5e1 !important; }
          table { border: 2px solid #94a3b8 !important; border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default TimetableView;