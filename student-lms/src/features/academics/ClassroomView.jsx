import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Video,
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  Download,
  PlayCircle,
  Loader2,
} from "lucide-react";
import { useGetMyTranscriptsQuery } from "./transcriptApi"; // Fetch enrolled courses
import { useGetCourseMaterialsQuery } from "./academicApi"; // Fetch materials

const ClassroomView = () => {
  // 1. Fetch Enrolled Courses
  const { data: transcriptRes, isLoading: coursesLoading } =
    useGetMyTranscriptsQuery();
  const enrolledRecords =
    transcriptRes?.data?.filter((r) =>
      ["Registered", "In-Progress"].includes(r.status),
    ) || [];

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState("materials");

  // Auto-select first course
  useEffect(() => {
    if (enrolledRecords.length > 0 && !selectedCourse) {
      setSelectedCourse(enrolledRecords[0].courseId);
    }
  }, [enrolledRecords, selectedCourse]);

  // 2. Fetch Materials for the Selected Course
  const { data: materialsRes, isLoading: materialsLoading } =
    useGetCourseMaterialsQuery(selectedCourse?._id, {
      skip: !selectedCourse?._id, // Don't fetch if no course is selected
    });

  const materials = materialsRes?.data || [];
  const lectures = materials.filter(
    (m) => m.type === "video" || m.type === "pdf",
  );
  const assignments = materials.filter((m) => m.type === "assignment");
  const announcements = materials.filter((m) => m.type === "announcement");

  if (coursesLoading)
    return (
      <div className="p-10 text-center">
        <Loader2 className="animate-spin mx-auto text-blue-600" size={32} />
      </div>
    );

  if (enrolledRecords.length === 0) {
    return (
      <div className="p-10 text-center font-bold text-slate-500">
        You are not enrolled in any courses this term.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
      {/* LEFT SIDEBAR: Course Selector */}
      <div className="w-full lg:w-80 shrink-0 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 mb-4">My Classes</h2>
        {enrolledRecords.map((record) => (
          <div
            key={record._id}
            onClick={() => setSelectedCourse(record.courseId)}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              selectedCourse?._id === record.courseId._id
                ? "bg-blue-50 border-blue-600 shadow-sm"
                : "bg-white border-slate-200 hover:border-blue-300"
            }`}
          >
            <h3 className="font-bold text-slate-900">{record.courseId.code}</h3>
            <p className="text-sm font-medium text-slate-600 truncate">
              {record.courseId.title}
            </p>
          </div>
        ))}
      </div>

      {/* RIGHT CONTENT */}
      {selectedCourse && (
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 sm:p-8 text-white">
            <span className="bg-blue-600/30 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase">
              {selectedCourse.code}
            </span>
            <h1 className="text-2xl font-black mt-3">{selectedCourse.title}</h1>
          </div>

          <div className="flex border-b border-slate-200 px-6 bg-slate-50/50 shrink-0">
            {["materials", "assignments", "announcements"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-500"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/30">
            {materialsLoading ? (
              <Loader2 className="animate-spin mx-auto text-blue-600" />
            ) : (
              <>
                {/* MATERALS TAB */}
                {activeTab === "materials" && (
                  <div className="space-y-4">
                    {lectures.length === 0 ? (
                      <p className="text-slate-400">
                        No materials uploaded yet.
                      </p>
                    ) : (
                      lectures.map((mat) => (
                        <div
                          key={mat._id}
                          className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-200 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-3 rounded-lg ${mat.type === "video" ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-500"}`}
                            >
                              {mat.type === "video" ? <Video /> : <FileText />}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">
                                {mat.title}
                              </h4>
                              <p className="text-xs text-slate-500">
                                {new Date(mat.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <a
                            href={mat.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-800 p-2"
                          >
                            <Download size={20} />
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ASSIGNMENTS TAB */}
                {activeTab === "assignments" && (
                  <div className="space-y-4">
                    {assignments.length === 0 ? (
                      <p className="text-slate-400">No pending assignments.</p>
                    ) : (
                      assignments.map((task) => (
                        <div
                          key={task._id}
                          className="p-5 bg-white border border-slate-200 rounded-xl flex justify-between items-center"
                        >
                          <div>
                            <h4 className="font-bold text-slate-900">
                              {task.title}
                            </h4>
                            <p className="text-sm text-red-500 font-medium flex items-center gap-1">
                              <Clock size={16} /> Due:{" "}
                              {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <button className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">
                            <UploadCloud size={18} /> Submit
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ANNOUNCEMENTS */}
                {activeTab === "announcements" && (
                  <div className="space-y-4">
                    {announcements.length === 0 ? (
                      <p className="text-slate-400">No announcements.</p>
                    ) : (
                      announcements.map((ann) => (
                        <div
                          key={ann._id}
                          className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800"
                        >
                          <h4 className="font-bold">{ann.title}</h4>
                          <p className="text-sm mt-1">{ann.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomView;
