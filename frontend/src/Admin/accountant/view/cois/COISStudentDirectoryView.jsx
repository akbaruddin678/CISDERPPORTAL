import React, { useState, useEffect } from "react";
import { Search, ChevronRight, Loader2, Users } from "lucide-react";
import { useGetStudentsQuery } from "../../api/accountantstudentApi";
import COISStudent360View from "./COISStudent360View"; // ✅ Imports your 360 view

export default function COISStudentDirectoryView() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Students list
  const { data: studentsRes, isLoading } = useGetStudentsQuery({
    search: debouncedSearch,
    limit: 50, // Load top 50 matches
  });

  // Extract array safely
  let studentsList = [];
  if (studentsRes?.data?.data) studentsList = studentsRes.data.data;
  else if (studentsRes?.data?.students)
    studentsList = studentsRes.data.students;
  else if (Array.isArray(studentsRes?.data)) studentsList = studentsRes.data;

  // 1. IF STUDENT IS SELECTED -> RENDER 360 DOSSIER
  if (selectedStudentId) {
    return (
      <COISStudent360View
        studentId={selectedStudentId}
        onBack={() => setSelectedStudentId(null)}
      />
    );
  }

  // 2. IF NO STUDENT IS SELECTED -> RENDER DIRECTORY SEARCH
  return (
    <div className="h-[calc(100vh-100px)] bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden animate-in fade-in duration-300">
      {/* Header & Search */}
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800">
            Student Directory
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Search for a student to view their complete dossier.
          </p>
        </div>
        <div className="relative w-full md:w-96">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by Name, Roll No, or CNIC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
          />
        </div>
      </div>

      {/* Directory List */}
      <div className="flex-1 overflow-auto bg-white p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={40} className="animate-spin text-violet-500 mb-4" />
            <p className="font-bold">Searching directory...</p>
          </div>
        ) : studentsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Users size={48} className="opacity-20 mb-4" />
            <p className="font-bold text-lg text-slate-500">
              No students found
            </p>
            <p className="text-sm mt-1">Try adjusting your search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentsList.map((student) => {
              const initials =
                student.personalInfo?.fullName
                  ?.split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || "ST";

              return (
                <div
                  key={student._id}
                  onClick={() => setSelectedStudentId(student._id)}
                  className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-violet-400 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-violet-50 text-violet-600 font-black flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 truncate">
                      {student.personalInfo?.fullName || "Unknown"}
                    </h3>
                    <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">
                      {student.studentId}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 mt-1 truncate">
                      {student.programId?.name || "No Program Assigned"}
                    </p>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-slate-300 group-hover:text-violet-500 shrink-0"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
