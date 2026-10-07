import { useMemo, useState } from "react";
import { useGetMyCoursesQuery } from "../api/teacherClassesApi";
import { useGetLecturesQuery } from "../lectures/api/lecturesApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

// Maps a populated CourseAssignment (as returned by GET /api/staff/my-courses)
// into the flat shape TeacherClassesView already expects.
const mapAssignmentToCourse = (assignment) => ({
  id: assignment._id,
  subject: assignment.courseId?.title || "Untitled Course",
  code: assignment.courseId?.code || "N/A",
  program: assignment.programId?.name || "Unknown Program",
  semester: assignment.semesterId?.number
    ? `Semester ${assignment.semesterId.number}`
    : "Unknown Semester",
  session: assignment.termId?.name || "Unknown Session",
  section: assignment.section,
  isActive: Boolean(assignment.isActive),
});

const useTeacherClassesController = () => {
  const {
    data: coursesRes,
    isFetching: isFetchingCourses,
    isError: isCoursesError,
    error: coursesError,
    refetch: refetchCourses,
  } = useGetMyCoursesQuery();

  const courses = useMemo(
    () => extractArray(coursesRes).map(mapAssignmentToCourse),
    [coursesRes],
  );

  // Current/latest session first, each group ordered by session name.
  const activeCourses = useMemo(
    () => courses.filter((c) => c.isActive),
    [courses],
  );
  const historyCourses = useMemo(
    () => courses.filter((c) => !c.isActive),
    [courses],
  );

  // --- Course selection ---
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const currentCourse = courses.find((c) => c.id === selectedCourseId) || {};

  // --- Tabs ---
  const [activeTab, setActiveTab] = useState("lectures");

  // --- Lecture logs (real backend now — see Admin/teacher/lectures/*) ---
  const {
    data: lecturesRes,
    isFetching: isFetchingLectures,
  } = useGetLecturesQuery(selectedCourseId, { skip: !selectedCourseId });

  const lectures = useMemo(() => extractArray(lecturesRes), [lecturesRes]);

  const groupedLectures = useMemo(
    () =>
      lectures.reduce((acc, lecture) => {
        if (!acc[lecture.week]) acc[lecture.week] = [];
        acc[lecture.week].push(lecture);
        return acc;
      }, {}),
    [lectures],
  );

  const sortedWeeks = useMemo(
    () =>
      Object.keys(groupedLectures).sort(
        (a, b) =>
          parseInt(a.replace(/\D/g, ""), 10) -
          parseInt(b.replace(/\D/g, ""), 10),
      ),
    [groupedLectures],
  );

  const handleSelectCourse = (courseId) => {
    setSelectedCourseId(courseId);
    setActiveTab("lectures");
  };

  return {
    // Course list (grouped by active session vs. history)
    courses,
    activeCourses,
    historyCourses,
    isFetchingCourses,
    isCoursesError,
    coursesErrorMessage:
      coursesError?.data?.message || "Failed to load your assigned courses.",
    refetchCourses,

    // Selection
    selectedCourseId,
    setSelectedCourseId: handleSelectCourse,
    currentCourse,

    // Tabs
    activeTab,
    setActiveTab,

    // Lectures
    groupedLectures,
    sortedWeeks,
    isFetchingLectures,
  };
};

export default useTeacherClassesController;
