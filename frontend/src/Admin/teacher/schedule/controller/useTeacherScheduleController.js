import { useMemo, useState } from "react";
import { useGetMyTimetableQuery } from "../../api/teacherClassesApi";
import { DAYS, SLOTS } from "../../../Registrar/controller/useMasterTimetableController";

const mapEntry = (raw) => {
  const ca = raw.courseAssignmentId || {};
  return {
    id: raw._id,
    day: raw.day,
    slot: raw.slot,
    room: raw.roomId?.name || raw.room,
    courseAssignmentId: ca._id,
    courseCode: ca.courseId?.code || "—",
    courseTitle: ca.courseId?.title || "Unknown Course",
    section: ca.section || "—",
    faculty: "—",
    department: ca.programId?.name || "—",
    program: ca.programId?.name || "—",
    termName: ca.termId?.name || "—",
    semesterNumber: ca.semesterId?.number,
  };
};

// Read-only weekly schedule for the logged-in teacher, derived from every
// TimetableEntry across their own assigned courses. No create/manage
// ability — that stays with Registrar/HOD, who own the schedule.
export const useTeacherScheduleController = () => {
  const { data, isFetching, error, refetch } = useGetMyTimetableQuery();
  const rawEntries = useMemo(() => data?.data || [], [data]);
  const entries = useMemo(() => rawEntries.map(mapEntry), [rawEntries]);

  const [selectedDay, setSelectedDay] = useState("All");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = useMemo(
    () => entries.filter((e) => selectedDay === "All" || e.day === selectedDay),
    [entries, selectedDay],
  );

  const grid = useMemo(() => {
    const g = {};
    DAYS.forEach((d) => {
      g[d] = {};
      SLOTS.forEach((s) => {
        g[d][s] = null;
      });
    });
    filtered.forEach((e) => {
      if (g[e.day]) g[e.day][e.slot] = e;
    });
    return g;
  }, [filtered]);

  const stats = useMemo(
    () => ({
      total: entries.length,
      departments: [...new Set(entries.map((e) => e.program))].length,
      faculty: [...new Set(entries.map((e) => e.courseCode))].length,
      rooms: [...new Set(entries.map((e) => e.room))].length,
    }),
    [entries],
  );

  const handleViewEntry = (entry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
  };

  return {
    entries: filtered,
    grid,
    isLoading: isFetching,
    error: error ? error.data?.message || "Failed to load your schedule." : null,
    days: DAYS,
    slots: SLOTS,
    stats,
    refetch,

    deptFilter: "All",
    setDeptFilter: () => {},
    departments: ["All"],

    selectedDay,
    setSelectedDay,

    selectedEntry,
    isModalOpen,
    handleViewEntry,
    handleCloseModal,
  };
};

export default useTeacherScheduleController;
