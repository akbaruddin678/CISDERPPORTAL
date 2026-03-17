import React, { useMemo } from "react";
import { useGetMyTranscriptsQuery } from "./transcriptApi";
import {
  FileText,
  Award,
  BookOpen,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

// Standard GPA Mapping (Adjust to match your university's actual grading scale)
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

const TranscriptView = () => {
  const {
    data: transcriptRes,
    isLoading,
    isError,
  } = useGetMyTranscriptsQuery();
  const records = transcriptRes?.data || [];

  // Group records by Term and Semester
  const { groupedRecords, totalCredits, cgpa } = useMemo(() => {
    const groups = {};
    let totalPoints = 0;
    let totalGradedCredits = 0;
    let earnedCredits = 0;

    records.forEach((record) => {
      // Grouping key (e.g., "Fall 2024 - Semester 3")
      const termName = record.termId?.name || "Unknown Term";
      const semNumber = record.semesterId?.number || "?";
      const groupKey = `${termName} - Semester ${semNumber}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          term: termName,
          semester: semNumber,
          courses: [],
          termGpa: 0,
          termCredits: 0,
          termPoints: 0,
        };
      }

      groups[groupKey].courses.push(record);

      const credits = record.courseId?.creditHours?.theory || 0; // Simplified credit calculation

      if (record.status === "Passed") {
        earnedCredits += credits;
      }

      // Calculate GPA if grade exists
      if (record.grade && gradePoints[record.grade] !== undefined) {
        const points = gradePoints[record.grade] * credits;
        groups[groupKey].termPoints += points;
        groups[groupKey].termCredits += credits;
        totalPoints += points;
        totalGradedCredits += credits;
      }
    });

    // Calculate Term GPAs
    Object.values(groups).forEach((group) => {
      group.termGpa =
        group.termCredits > 0
          ? (group.termPoints / group.termCredits).toFixed(2)
          : "N/A";
    });

    const calculatedCgpa =
      totalGradedCredits > 0
        ? (totalPoints / totalGradedCredits).toFixed(2)
        : "0.00";

    return {
      groupedRecords: Object.values(groups),
      totalCredits: earnedCredits,
      cgpa: calculatedCgpa,
    };
  }, [records]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "Passed":
        return <CheckCircle2 className="text-green-500" size={18} />;
      case "Failed":
        return <XCircle className="text-red-500" size={18} />;
      default:
        return <Clock className="text-orange-500" size={18} />;
    }
  };

  const getGradeColor = (grade) => {
    if (!grade) return "bg-gray-100 text-gray-600";
    if (grade.includes("A")) return "bg-green-100 text-green-800";
    if (grade.includes("B")) return "bg-blue-100 text-blue-800";
    if (grade.includes("C")) return "bg-yellow-100 text-yellow-800";
    if (grade === "F") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <Loader2 className="animate-spin mb-4 text-blue-600" size={40} />
        <p className="font-medium text-lg">Loading your academic records...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8">
      {/* HEADER & STATS */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Academic Transcripts
        </h1>
        <p className="text-slate-500 mt-1 font-medium">
          View your complete result cards and grade history.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Award size={32} strokeWidth={2} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">
              Cumulative GPA
            </p>
            <p className="text-4xl font-black text-slate-900 mt-1">{cgpa}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <BookOpen size={32} strokeWidth={2} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">
              Credits Earned
            </p>
            <p className="text-4xl font-black text-slate-900 mt-1">
              {totalCredits}
            </p>
          </div>
        </div>
      </div>

      {/* RESULT CARDS (Grouped by Semester) */}
      {groupedRecords.length === 0 ? (
        <div className="bg-white border border-slate-200 p-16 rounded-2xl text-center shadow-sm">
          <FileText
            className="mx-auto mb-4 text-slate-300"
            size={64}
            strokeWidth={1.5}
          />
          <h3 className="text-xl font-bold text-slate-900">No Records Found</h3>
          <p className="text-slate-500 mt-2 font-medium">
            You have not completed or registered for any courses yet.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedRecords.map((group, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Semester Card Header */}
              <div className="bg-slate-50 border-b border-slate-200 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {group.term}
                  </h3>
                  <p className="text-sm font-medium text-blue-600 uppercase tracking-wider mt-1">
                    Semester {group.semester}
                  </p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-center min-w-[120px]">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Term GPA
                  </p>
                  <p className="text-xl font-black text-slate-900">
                    {group.termGpa}
                  </p>
                </div>
              </div>

              {/* Semester Courses Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-bold">
                      <th className="p-4 pl-6">Course Code</th>
                      <th className="p-4">Course Title</th>
                      <th className="p-4 text-center">Cr. Hrs</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 pr-6 text-right">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {group.courses.map((record) => (
                      <tr
                        key={record._id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="p-4 pl-6">
                          <span className="font-mono text-slate-700 font-semibold">
                            {record.courseId?.code}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-900">
                            {record.courseId?.title}
                          </span>
                          {record.isRetake && (
                            <span className="ml-2 text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              Retake
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center text-slate-600 font-medium">
                          {record.courseId?.creditHours?.theory}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-700">
                            {getStatusIcon(record.status)}
                            {record.status}
                          </div>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <span
                            className={`px-3 py-1 rounded-lg text-sm font-bold ${getGradeColor(record.grade)}`}
                          >
                            {record.grade || "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TranscriptView;
