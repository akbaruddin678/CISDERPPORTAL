import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  CheckCircle2,
  BookOpen,
  Printer,
  ArrowLeft,
} from "lucide-react";
import StudentRegistrationPortal from "./StudentRegistrationPortal";
import {
  useGetAvailableCoursesQuery,
  useRegisterForCoursesMutation,
} from "./academicApi";
import { useGetMyTranscriptsQuery } from "../academics/transcriptApi";

const CourseRegistrationView = () => {
  const navigate = useNavigate();

  const { data: coursesRes, isLoading: isLoadingCourses } =
    useGetAvailableCoursesQuery();
  const { data: transcriptRes, isLoading: isLoadingTranscripts } =
    useGetMyTranscriptsQuery();

  const [registerCourses, { isLoading: isSubmitting }] =
    useRegisterForCoursesMutation();

  const availableCourses = coursesRes?.data || [];
  const myRecords = transcriptRes?.data || [];

  const registeredCourses = useMemo(() => {
    return myRecords.filter((record) =>
      ["Registered", "In-Progress"].includes(record.status)
    );
  }, [myRecords]);

  const isAlreadyRegistered = registeredCourses.length > 0;
  const isLoading = isLoadingCourses || isLoadingTranscripts;

  const totalRegisteredCredits = registeredCourses.reduce((sum, record) => {
    return sum + (record.courseId?.creditHours?.theory || 0);
  }, 0);

  const handleSubmit = async (selectedCourseIds) => {
    try {
      await registerCourses({ courseIds: selectedCourseIds }).unwrap();
    } catch (error) {
      alert(error?.data?.message || "Registration failed. Please try again.");
    }
  };

  // ================= LOADING =================
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white">
        <Loader2 className="animate-spin text-red-700 mb-4" size={42} />
        <p className="text-slate-500 font-medium">
          Loading registration portal...
        </p>
      </div>
    );
  }

  // ================= REGISTERED =================
  if (isAlreadyRegistered) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Success Banner */}
        <div className="bg-red-900 rounded-3xl p-8 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
              <CheckCircle2 size={32} className="text-red-200" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold">
                Registration Confirmed
              </h2>
              <p className="text-red-200 mt-1 text-sm">
                You are successfully enrolled for this semester.
              </p>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="bg-white text-red-900 hover:bg-red-100 px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2"
          >
            <Printer size={18} /> Print Slip
          </button>
        </div>

        {/* Courses Card */}
        <div className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden">
          
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-red-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="text-red-700" size={20} />
              My Enrolled Courses
            </h3>

            <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
              {totalRegisteredCredits} Credits
            </span>
          </div>

          {/* Course List */}
          <div className="divide-y divide-slate-100">
            {registeredCourses.map((record, index) => (
              <div
                key={record._id || index}
                className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-red-50 transition"
              >
                <div>
                  <p className="text-xs font-semibold text-red-600 mb-1">
                    {record.courseId?.code}
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {record.courseId?.title}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-1">Credits</p>
                    <p className="text-sm font-bold text-slate-700">
                      {record.courseId?.creditHours?.theory || 0}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-1">Status</p>
                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                      {record.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="text-red-700 hover:text-red-900 font-semibold flex items-center gap-2 transition mx-auto mt-6"
        >
          <ArrowLeft size={18} /> Return to Dashboard
        </button>
      </div>
    );
  }

  // ================= REGISTRATION FORM =================
  return (
    <div className="bg-white min-h-screen p-4">
      <StudentRegistrationPortal
        availableCourses={availableCourses}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        onSubmitRegistration={handleSubmit}
      />
    </div>
  );
};

export default CourseRegistrationView;