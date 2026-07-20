import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Video,
  FileText,
  UploadCloud,
  Clock,
  Download,
  Loader2,
  GraduationCap,
  Megaphone,
  Bell,
  CalendarDays,
} from "lucide-react";
import { useGetMyTranscriptsQuery } from "./transcriptApi";
import { useGetCourseMaterialsQuery } from "./academicApi";

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
      skip: !selectedCourse?._id,
    });

  const materials = materialsRes?.data || [];
  const lectures = materials.filter(
    (m) => m.type === "video" || m.type === "pdf",
  );
  const assignments = materials.filter((m) => m.type === "assignment");
  const announcements = materials.filter((m) => m.type === "announcement");

  // ── Loading state ────────────────────────────────────────────────
  if (coursesLoading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <div className="w-14 h-14 rounded-md bg-red-50 flex items-center justify-center mb-4 border border-red-100">
          <Loader2 className="animate-spin text-red-900" size={28} />
        </div>
        <p className="font-semibold text-slate-500 text-sm">Loading your classroom…</p>
      </div>
    );

  // ── Empty enrollment state ───────────────────────────────────────
  if (enrolledRecords.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="border-2 border-dashed border-red-100 p-12 rounded-md text-center bg-red-50/40">
          <div className="w-14 h-14 rounded-md bg-red-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="text-red-900" size={26} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Enrolled Courses</h3>
          <p className="text-slate-500 mt-1 text-sm">
            You are not enrolled in any courses this term.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "materials",     label: "Materials",     icon: <FileText size={14} />,  count: lectures.length },
    { id: "assignments",   label: "Assignments",   icon: <UploadCloud size={14} />, count: assignments.length },
    { id: "announcements", label: "Announcements", icon: <Megaphone size={14} />, count: announcements.length },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6">

      {/* ── LEFT SIDEBAR: Course Selector ── */}
      <div className="w-full lg:w-80 shrink-0">
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-md bg-red-900 text-white flex items-center justify-center">
              <GraduationCap size={17} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-none">My Classes</h2>
              <p className="text-[11px] text-slate-400 mt-1">
                {enrolledRecords.length} active course{enrolledRecords.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {enrolledRecords.map((record) => {
              const isSelected = selectedCourse?._id === record.courseId._id;
              return (
                <div
                  key={record._id}
                  onClick={() => setSelectedCourse(record.courseId)}
                  className={`p-4 rounded-md border cursor-pointer transition-all duration-200 group ${
                    isSelected
                      ? "bg-red-900 border-red-900 text-white shadow-sm"
                      : "bg-white border-slate-200 hover:border-red-200 hover:bg-red-50/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-[10px] font-black tracking-widest uppercase ${
                        isSelected ? "text-red-200" : "text-red-900"
                      }`}
                    >
                      {record.courseId.code}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                        isSelected
                          ? "bg-white/15 text-white border border-white/20"
                          : "bg-red-50 text-red-900 border border-red-100"
                      }`}
                    >
                      {record.status}
                    </span>
                  </div>
                  <h3
                    className={`text-sm font-bold truncate ${
                      isSelected ? "text-white" : "text-slate-800"
                    }`}
                  >
                    {record.courseId.title}
                  </h3>
                  <p
                    className={`text-[11px] mt-1 ${
                      isSelected ? "text-red-100/80" : "text-slate-400"
                    }`}
                  >
                    {record.courseId?.creditHours?.theory || 0} credits
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── RIGHT CONTENT ── */}
      {selectedCourse && (
        <div className="flex-1 bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-8rem)]">

          {/* Course Header */}
          <div className="relative overflow-hidden bg-red-900 p-6 sm:p-8 text-white">
            {/* Decorative blobs */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute -bottom-10 left-1/3 w-32 h-32 rounded-full bg-black/10" />
            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 px-3 py-1 rounded-sm text-[10px] font-black tracking-widest uppercase">
                <BookOpen size={12} /> {selectedCourse.code}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black mt-3 tracking-tight">
                {selectedCourse.title}
              </h1>
              <p className="text-red-100/90 mt-2 text-sm font-medium flex items-center gap-1.5">
                <CalendarDays size={14} />
                {selectedCourse?.creditHours?.theory || 0} credit hours
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 px-4 sm:px-6 bg-slate-50 shrink-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-red-900 text-red-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                      activeTab === tab.id
                        ? "bg-red-900 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/40">
            {materialsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <div className="w-12 h-12 rounded-md bg-red-50 flex items-center justify-center mb-3 border border-red-100">
                  <Loader2 className="animate-spin text-red-900" size={22} />
                </div>
                <p className="font-semibold text-slate-500 text-sm">Loading content…</p>
              </div>
            ) : (
              <>
                {/* MATERIALS TAB */}
                {activeTab === "materials" && (
                  <div className="space-y-3">
                    {lectures.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-md border border-dashed border-red-100">
                        <div className="w-14 h-14 rounded-md bg-red-50 flex items-center justify-center mx-auto mb-3 border border-red-100">
                          <FileText className="text-red-900" size={24} />
                        </div>
                        <p className="text-sm font-semibold text-slate-600">No materials yet</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Your instructor hasn't uploaded any materials.
                        </p>
                      </div>
                    ) : (
                      lectures.map((mat) => (
                        <div
                          key={mat._id}
                          className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-md hover:border-red-200 hover:bg-red-50/30 transition-all duration-200 group"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-11 h-11 rounded-md bg-red-50 text-red-900 border border-red-100 flex items-center justify-center flex-shrink-0 group-hover:bg-red-900 group-hover:text-white transition-all">
                              {mat.type === "video" ? <Video size={18} /> : <FileText size={18} />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-red-50 text-red-900 border border-red-100">
                                  {mat.type}
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {new Date(mat.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-red-900 transition-colors">
                                {mat.title}
                              </h4>
                            </div>
                          </div>
                          <a
                            href={mat.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-3 flex items-center gap-1.5 text-xs font-bold text-white bg-red-900 hover:bg-red-950 px-3 py-2 rounded-md transition-all duration-150 shrink-0"
                          >
                            <Download size={13} /> <span className="hidden sm:inline">Download</span>
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ASSIGNMENTS TAB */}
                {activeTab === "assignments" && (
                  <div className="space-y-3">
                    {assignments.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-md border border-dashed border-red-100">
                        <div className="w-14 h-14 rounded-md bg-red-50 flex items-center justify-center mx-auto mb-3 border border-red-100">
                          <UploadCloud className="text-red-900" size={24} />
                        </div>
                        <p className="text-sm font-semibold text-slate-600">No pending assignments</p>
                        <p className="text-xs text-slate-400 mt-0.5">You're all caught up!</p>
                      </div>
                    ) : (
                      assignments.map((task) => {
                        const due = new Date(task.dueDate);
                        const isOverdue = due < new Date();
                        return (
                          <div
                            key={task._id}
                            className="p-5 bg-white border border-slate-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-red-200 transition-all"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-red-50 text-red-900 border border-red-100">
                                  Assignment
                                </span>
                                {isOverdue && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-red-900 text-white border border-red-900">
                                    Overdue
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-slate-800 text-sm">
                                {task.title}
                              </h4>
                              <p className={`text-xs font-medium flex items-center gap-1.5 mt-1 ${isOverdue ? "text-red-900" : "text-slate-500"}`}>
                                <Clock size={13} /> Due: {due.toLocaleDateString([], {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                            <button className="flex items-center justify-center gap-2 bg-red-900 hover:bg-red-950 text-white px-5 py-2.5 rounded-md font-bold text-sm transition-all duration-150 shrink-0 active:scale-95">
                              <UploadCloud size={16} /> Submit
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* ANNOUNCEMENTS TAB */}
                {activeTab === "announcements" && (
                  <div className="space-y-3">
                    {announcements.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-md border border-dashed border-red-100">
                        <div className="w-14 h-14 rounded-md bg-red-50 flex items-center justify-center mx-auto mb-3 border border-red-100">
                          <Megaphone className="text-red-900" size={24} />
                        </div>
                        <p className="text-sm font-semibold text-slate-600">No announcements</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          You'll see class updates here when posted.
                        </p>
                      </div>
                    ) : (
                      announcements.map((ann) => (
                        <div
                          key={ann._id}
                          className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-md hover:border-red-200 hover:bg-red-50/30 transition-all duration-200"
                        >
                          <div className="w-10 h-10 rounded-md bg-red-50 text-red-900 border border-red-100 flex items-center justify-center flex-shrink-0">
                            <Bell size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-red-50 text-red-900 border border-red-100">
                                Announcement
                              </span>
                              {ann.createdAt && (
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {new Date(ann.createdAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm">{ann.title}</h4>
                            {ann.description && (
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                {ann.description}
                              </p>
                            )}
                          </div>
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