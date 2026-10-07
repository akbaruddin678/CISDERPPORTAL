import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";

import {
  useGetTermsQuery,
  useGetSemestersByProgramQuery,
} from "../../../components/catalog/api/catalogApi";

import {
  useGetActiveCoursesQuery,
  useGetDepartmentStaffQuery,
  useGetSemesterAllocationsQuery,
  useAllocateCourseMutation,
} from "../api/hodCourseAllocationApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

// A dedicated page (not a Dialog) for assigning courses to a Semester +
// Session — the department/program/semester/session context comes straight
// from the URL, so this page is real, refreshable, and shareable, and has
// room for a proper searchable table instead of the old modal's cramped
// MenuItem lists (some departments have 50-100+ active courses).
const useHodAssignCourseController = () => {
  const { departmentId, programId, semesterId, termId } = useParams();
  const navigate = useNavigate();
  const { openAlert } = useGlobalAlert();

  const [search, setSearch] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState(new Set());
  const [instructorByCourse, setInstructorByCourse] = useState({});
  const [sectionsInput, setSectionsInput] = useState("A, B");
  const [sectionCapacity, setSectionCapacity] = useState(40);
  const [courseType, setCourseType] = useState("MANDATORY");

  const { data: coursesRes, isFetching: isFetchingCourses } =
    useGetActiveCoursesQuery(departmentId || skipToken, {
      skip: !departmentId,
    });
  const { data: staffRes } = useGetDepartmentStaffQuery();
  // University-only — this whole module has no HSSC/college concept.
  const { data: termsRes } = useGetTermsQuery({ excludeLevel: "HSSC" });
  const { data: semestersRes } = useGetSemestersByProgramQuery(
    programId || skipToken,
    { skip: !programId },
  );
  // Deliberately NOT scoped to semesterId — a course can only live in ONE
  // semester within a given Session/Term for a given program (enforced
  // server-side in createAllocation's own conflict check), so the picker
  // here needs to see every semester's allocations for this session to
  // correctly hide a course that's already taken elsewhere in it, not just
  // in the current semester.
  const { data: allocationsRes, isFetching: isFetchingAllocations } =
    useGetSemesterAllocationsQuery(
      programId && termId ? { programId, termId } : skipToken,
      { skip: !programId || !termId },
    );
  const [allocateCourse, { isLoading: isAllocating }] =
    useAllocateCourseMutation();

  const activeCourses = extractArray(coursesRes);
  const faculty = useMemo(
    () =>
      extractArray(staffRes).filter(
        (s) => (s.departmentId?._id || s.departmentId) === departmentId,
      ),
    [staffRes, departmentId],
  );
  const allocations = extractArray(allocationsRes);
  // Same course, same session, different semester — e.g. already offered
  // in Semester 1 of this session, so it can't also be picked for Semester
  // 2 of the same session. Tracked separately (with which semester) so the
  // page can explain why the course list is shorter than "every active
  // course," instead of just silently shrinking it.
  const crossSemesterAssignments = useMemo(
    () =>
      allocations.filter(
        (a) => String(a.semesterId?._id || a.semesterId) !== String(semesterId),
      ),
    [allocations, semesterId],
  );
  const assignedCourseIds = useMemo(
    () => new Set(allocations.map((a) => a.courseId?._id || a.courseId)),
    [allocations],
  );
  const availableCourses = useMemo(
    () => activeCourses.filter((c) => !assignedCourseIds.has(c._id)),
    [activeCourses, assignedCourseIds],
  );
  const courseCredit = (c) =>
    typeof c.creditHours === "number"
      ? c.creditHours
      : (c.creditHours?.theory || 0) + (c.creditHours?.lab || 0);
  const selectedCreditHoursTotal = useMemo(
    () =>
      activeCourses
        .filter((c) => selectedCourseIds.has(c._id))
        .reduce((sum, c) => sum + courseCredit(c), 0),
    [activeCourses, selectedCourseIds],
  );
  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availableCourses;
    return availableCourses.filter(
      (c) =>
        c.code?.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q),
    );
  }, [availableCourses, search]);

  const termName =
    extractArray(termsRes).find((t) => t._id === termId)?.name || "Session";
  const semesterNumber = extractArray(semestersRes).find(
    (s) => s._id === semesterId,
  )?.number;

  const toggleCourse = (id) =>
    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setInstructorByCourse((prevInst) => {
          const { [id]: _removed, ...rest } = prevInst;
          return rest;
        });
      } else {
        next.add(id);
      }
      return next;
    });

  const allFilteredSelected =
    filteredCourses.length > 0 &&
    filteredCourses.every((c) => selectedCourseIds.has(c._id));

  const toggleAllFiltered = () => {
    const filteredIds = filteredCourses.map((c) => c._id);
    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredIds.forEach((id) => next.delete(id));
      } else {
        filteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const setInstructor = (courseId, instructorId) =>
    setInstructorByCourse((prev) => ({ ...prev, [courseId]: instructorId }));

  // Applies one instructor to every currently-selected course in one go —
  // picking the same teacher row-by-row across a large selection is the
  // single most repetitive part of this page.
  const bulkSetInstructor = (instructorId) =>
    setInstructorByCourse((prev) => {
      const next = { ...prev };
      selectedCourseIds.forEach((id) => {
        next[id] = instructorId;
      });
      return next;
    });

  // Not navigate(-1): this page is its own top-level route (fully unmounts
  // the Courses page behind it, whose Semester/Session/Courses drill state
  // is local React state, not URL-derived) — going back by history alone
  // would land on the bare picker instead of resuming the Courses table.
  // These query params let useHodAllocationController jump straight back.
  const backToCoursesUrl = `/hod/course/allocation?departmentId=${departmentId}&programId=${programId}&semesterId=${semesterId}&termId=${termId}`;
  const handleBack = () => navigate(backToCoursesUrl);

  const handleSubmit = async () => {
    if (selectedCourseIds.size === 0) {
      return openAlert({
        message: "Select at least one course.",
        severity: "warning",
      });
    }
    const sections = [...new Set(sectionsInput.split(",").map((section) => section.trim().toUpperCase()).filter(Boolean))];
    if (!sections.length || Number(sectionCapacity) < 1) {
      return openAlert({ message: "Enter at least one section and a valid seat capacity.", severity: "warning" });
    }
    try {
      await allocateCourse({
        termId,
        programId,
        semesterId,
        courses: Array.from(selectedCourseIds).map((courseId) => ({
          courseId,
          instructorId: instructorByCourse[courseId] || null,
        })),
        sections,
        capacity: Number(sectionCapacity),
        courseType,
      }).unwrap();

      openAlert({
        message: `${selectedCourseIds.size} course${selectedCourseIds.size > 1 ? "s" : ""} assigned successfully!`,
        severity: "success",
      });
      navigate(backToCoursesUrl);
    } catch (error) {
      const conflicts = error.data?.conflicts;
      const message =
        conflicts?.length > 0
          ? `${error.data.message} ${conflicts.join(" ")}`
          : error.data?.message || "Failed to assign courses.";
      openAlert({ message, severity: "error" });
    }
  };

  return {
    termName,
    semesterNumber,
    search,
    setSearch,
    filteredCourses,
    totalAvailable: availableCourses.length,
    crossSemesterCount: crossSemesterAssignments.length,
    selectedCreditHoursTotal,
    isFetchingCourses: isFetchingCourses || isFetchingAllocations,
    selectedCourseIds,
    toggleCourse,
    allFilteredSelected,
    toggleAllFiltered,
    instructorByCourse,
    setInstructor,
    bulkSetInstructor,
    faculty,
    handleBack,
    handleSubmit,
    isAllocating,
    sectionsInput,
    setSectionsInput,
    sectionCapacity,
    setSectionCapacity,
    courseType,
    setCourseType,
  };
};

export default useHodAssignCourseController;
