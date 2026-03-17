import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Lock,
  CheckCircle2,
  BookOpen,
  Loader2,
} from "lucide-react";

const StudentRegistrationPortal = ({
  availableCourses = [],
  onSubmitRegistration,
  isSubmitting = false,
}) => {
  const [selectedCourses, setSelectedCourses] = useState([]);

  // Auto-select mandatory retakes on load
  useEffect(() => {
    if (Array.isArray(availableCourses) && availableCourses.length > 0) {
      const mandatory = availableCourses
        .filter((c) => c?.isMandatoryRetake)
        .map((c) => c?.course?._id)
        .filter(Boolean);
      setSelectedCourses(mandatory);
    }
  }, [availableCourses]);

  const toggleCourse = (courseId, isMandatory) => {
    if (isMandatory) return; // Prevent unselecting mandatory courses

    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    );
  };

  // --- Show Loading/Empty State ---
  if (!availableCourses || availableCourses.length === 0) {
    return (
      <div className="p-10 max-w-4xl mx-auto text-center bg-white rounded-2xl border border-slate-200 shadow-sm mt-6">
        <Loader2
          className="animate-spin mx-auto mb-4 text-blue-600"
          size={32}
        />
        <h3 className="text-lg font-bold text-slate-900">Loading Courses...</h3>
        <p className="text-slate-500 mt-1">
          Please wait while we fetch your academic records.
        </p>
      </div>
    );
  }

  // --- Categorize Courses for better UX ---
  const alreadyEnrolledOrPassed = [];
  const availableToRegister = [];
  const lockedDueToPrereqs = [];

  availableCourses.forEach((item) => {
    if (!item.course) return;

    if (item.isLocked) {
      if (
        item.lockReason?.toLowerCase().includes("completed") ||
        item.lockReason?.toLowerCase().includes("enrolled")
      ) {
        alreadyEnrolledOrPassed.push(item);
      } else {
        lockedDueToPrereqs.push(item);
      }
    } else {
      availableToRegister.push(item);
    }
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Course Registration
        </h2>
        <p className="text-slate-500 mt-1 font-medium">
          Select your courses for the upcoming term.
        </p>
      </div>

      {/* SECTION 1: Available Courses (Action Required) */}
      {availableToRegister.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="text-blue-600" size={24} />
            <h3 className="text-xl font-bold text-slate-900">
              Available to Register
            </h3>
          </div>

          <div className="grid gap-4">
            {availableToRegister.map(({ course, isMandatoryRetake }) => {
              const isSelected = selectedCourses.includes(course._id);

              return (
                <div
                  key={course._id}
                  className={`p-5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between ${
                    isMandatoryRetake
                      ? "bg-red-50 border-red-200"
                      : isSelected
                        ? "bg-blue-50 border-blue-400 shadow-sm"
                        : "bg-white border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-lg text-slate-900">
                        {course.code}{" "}
                        <span className="text-slate-400 mx-1">|</span>{" "}
                        {course.title}
                      </h4>
                      {isMandatoryRetake && (
                        <span className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
                          <AlertCircle size={14} strokeWidth={2.5} /> Mandatory
                          Retake
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                      Theory: {course.creditHours?.theory || 0} Credits
                      {course.creditHours?.lab > 0 &&
                        ` | Lab: ${course.creditHours.lab} Credits`}
                    </p>
                  </div>

                  <div>
                    <button
                      disabled={isMandatoryRetake}
                      onClick={() =>
                        toggleCourse(course._id, isMandatoryRetake)
                      }
                      className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
                        isMandatoryRetake
                          ? "bg-red-200 text-red-700 cursor-not-allowed opacity-70"
                          : isSelected
                            ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                            : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {isSelected || isMandatoryRetake ? "Selected" : "Select"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Action */}
          <div className="mt-6 flex justify-end bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <span className="text-slate-600 font-medium">
                {selectedCourses.length} course
                {selectedCourses.length !== 1 ? "s" : ""} selected
              </span>
              <button
                onClick={() => onSubmitRegistration(selectedCourses)}
                disabled={selectedCourses.length === 0 || isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
              >
                {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                {isSubmitting ? "Processing..." : "Confirm Registration"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: Already Enrolled or Passed */}
      {alreadyEnrolledOrPassed.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="text-green-600" size={24} />
            <h3 className="text-xl font-bold text-slate-900">
              Current & Completed Courses
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alreadyEnrolledOrPassed.map(({ course, lockReason }) => (
              <div
                key={course._id}
                className="p-4 rounded-xl border border-green-100 bg-green-50/30 flex justify-between items-center opacity-80"
              >
                <div>
                  <h4 className="font-bold text-slate-800">
                    {course.code} - {course.title}
                  </h4>
                  <p className="text-xs font-semibold text-green-700 mt-1">
                    {lockReason}
                  </p>
                </div>
                <CheckCircle2 className="text-green-500" size={20} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3: Locked (Missing Prerequisites) */}
      {lockedDueToPrereqs.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="text-orange-500" size={24} />
            <h3 className="text-xl font-bold text-slate-900">Locked Courses</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lockedDueToPrereqs.map(({ course, lockReason }) => (
              <div
                key={course._id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center"
              >
                <div>
                  <h4 className="font-bold text-slate-700">
                    {course.code} - {course.title}
                  </h4>
                  <p className="text-xs font-semibold text-orange-600 mt-1 flex items-center gap-1">
                    {lockReason}
                  </p>
                </div>
                <Lock className="text-slate-400" size={18} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default StudentRegistrationPortal;
