import React from "react";
import { useSelector } from "react-redux";
import {
  CalendarDays,
  Clock,
  Hourglass,
  BookOpen,
  Loader2,
  AlertCircle,
  Printer,
} from "lucide-react";
import { useGetMyDateSheetQuery } from "./academicApi";

const DatesheetView = () => {
  const user = useSelector((state) => state.auth.user);

  const { data: datesheetRes, isLoading, isError } = useGetMyDateSheetQuery();
  const apiExams = datesheetRes?.data || [];

  // ================= MOCK DATA =================
  const mockExams = [
    {
      _id: "1",
      date: "2026-06-10",
      startTime: "09:00 AM",
      duration: 120,
      totalMarks: 100,
      type: "Mid Term",
      courseId: {
        code: "CS101",
        title: "Introduction to Programming",
      },
    },
    {
      _id: "2",
      date: "2026-06-12",
      startTime: "11:00 AM",
      duration: 90,
      totalMarks: 50,
      type: "Quiz",
      courseId: {
        code: "CS205",
        title: "Data Structures",
      },
    },
    {
      _id: "3",
      date: "2026-06-15",
      startTime: "02:00 PM",
      duration: 180,
      totalMarks: 100,
      type: "Final Exam",
      courseId: {
        code: "CS301",
        title: "Operating Systems",
      },
    },
    {
      _id: "4",
      date: "2026-05-01",
      startTime: "10:00 AM",
      duration: 120,
      totalMarks: 75,
      type: "Mid Term",
      courseId: {
        code: "CS210",
        title: "Database Systems",
      },
    },
  ];

  // Toggle mock mode here
  const USE_MOCK = true;

  const exams = USE_MOCK ? mockExams : apiExams;

  // ================= PRINT =================
  const handlePrintSlip = () => {
    if (!exams || exams.length === 0) return;
    window.print();
  };

  // ================= LOADING =================
  if (isLoading && !USE_MOCK) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white">
        <Loader2 className="animate-spin mb-4 text-red-700" size={40} />
        <p className="text-slate-500 font-medium">
          Loading your exam schedule...
        </p>
      </div>
    );
  }

  if (isError && !USE_MOCK) {
    return (
      <div className="p-10 text-center text-red-600 font-bold">
        Failed to load date sheet. Please try again later.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8 bg-white">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            Date Sheet
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Your upcoming exams and schedule.
          </p>
        </div>

        {exams.length > 0 && (
          <button
            onClick={handlePrintSlip}
            className="inline-flex items-center gap-2 bg-red-800 hover:bg-red-900 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition"
          >
            <Printer size={18} />
            Print Roll No Slip
          </button>
        )}
      </div>

      {/* EMPTY STATE */}
      {exams.length === 0 ? (
        <div className="bg-white border border-red-100 p-16 rounded-3xl text-center shadow-sm">
          <CalendarDays className="mx-auto mb-4 text-red-200" size={64} />
          <h3 className="text-xl font-bold text-slate-900">
            No Exams Scheduled
          </h3>
          <p className="text-slate-500 mt-2 font-medium">
            Your date sheet has not been published yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => {
            const examDate = new Date(exam.date);
            const isPast = examDate < new Date();

            return (
              <div
                key={exam._id}
                className={`flex flex-col md:flex-row rounded-2xl border overflow-hidden transition ${
                  isPast
                    ? "bg-slate-50 border-slate-200 opacity-70"
                    : "bg-white border-red-100 shadow-sm hover:shadow-md"
                }`}
              >

                {/* DATE BLOCK */}
                <div
                  className={`md:w-44 p-6 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r ${
                    isPast
                      ? "bg-slate-100 text-slate-500"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {examDate.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>

                  <span className="text-4xl font-black my-1">
                    {examDate.getDate()}
                  </span>

                  <span className="text-xs font-bold uppercase tracking-widest">
                    {examDate.toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* DETAILS */}
                <div className="p-6 flex-1 flex flex-col justify-between">

                  <div className="flex justify-between items-start">
                    <div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                          exam.type === "Final Exam"
                            ? "bg-red-100 text-red-700"
                            : exam.type === "Mid Term"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {exam.type}
                      </span>

                      <h3 className="text-xl font-bold text-slate-900 mt-2">
                        {exam.courseId?.title}
                      </h3>

                      <p className="text-sm text-slate-500 font-medium flex items-center gap-1 mt-1">
                        <BookOpen size={16} />
                        {exam.courseId?.code}
                      </p>
                    </div>

                    {isPast && (
                      <span className="bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <AlertCircle size={14} />
                        Conducted
                      </span>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-6 text-sm font-medium text-slate-600">

                    <div className="flex items-center gap-2">
                      <Clock className="text-red-600" size={18} />
                      {exam.startTime || "TBA"}
                    </div>

                    <div className="flex items-center gap-2">
                      <Hourglass className="text-red-600" size={18} />
                      {exam.duration} mins
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[10px] font-bold">
                        #
                      </div>
                      {exam.totalMarks} Marks
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DatesheetView;