import { useMemo, useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetSchedulableAssignmentsQuery,
  useGetTimetableEntriesQuery,
  useCreateTimetableEntryMutation,
  useDeleteTimetableEntryMutation,
} from "../api/masterTimetableApi";
import { useGetRoomsQuery } from "../api/roomApi";

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const SLOTS = [
  "08:00–09:00",
  "09:00–10:00",
  "10:00–11:00",
  "11:00–12:00",
  "12:00–13:00",
  "13:00–14:00",
  "14:00–15:00",
  "15:00–16:00",
];

export const mapEntry = (raw) => {
  const ca = raw.courseAssignmentId || {};
  return {
    id: raw._id,
    day: raw.day,
    slot: raw.slot,
    // Falls back to the deprecated free-text pair for any row not yet
    // backfilled onto roomId (see scripts/2026-10-backfill-room-collection.mjs).
    room: raw.roomId?.name || raw.room,
    roomCapacity: raw.roomId?.capacity ?? raw.roomCapacity,
    courseAssignmentId: ca._id,
    courseCode: ca.courseId?.code || "—",
    courseTitle: ca.courseId?.title || "Unknown Course",
    section: ca.section || "—",
    faculty: ca.instructorId?.personalInfo?.name || "Unassigned",
    department: ca.programId?.departmentId?.name || "—",
    program: ca.programId?.name || "—",
    termName: ca.termId?.name || "—",
    semesterNumber: ca.semesterId?.number,
  };
};

export const useMasterTimetableController = () => {
  const { openAlert } = useGlobalAlert();
  const { data, isFetching, error, refetch } = useGetTimetableEntriesQuery();
  const rawEntries = useMemo(() => data?.data || [], [data]);
  const entries = useMemo(() => rawEntries.map(mapEntry), [rawEntries]);

  const [deptFilter, setDeptFilter] = useState("All");
  const [selectedDay, setSelectedDay] = useState("All");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const departments = useMemo(() => {
    const u = [...new Set(entries.map((e) => e.department))];
    return ["All", ...u];
  }, [entries]);

  const filtered = useMemo(
    () =>
      entries.filter(
        (e) =>
          (deptFilter === "All" || e.department === deptFilter) &&
          (selectedDay === "All" || e.day === selectedDay),
      ),
    [entries, deptFilter, selectedDay],
  );

  const grid = useMemo(() => {
    const g = {};
    DAYS.forEach((d) => {
      g[d] = {};
      SLOTS.forEach((s) => {
        g[d][s] = [];
      });
    });
    filtered.forEach((e) => {
      if (g[e.day]?.[e.slot]) g[e.day][e.slot].push(e);
    });
    return g;
  }, [filtered]);

  const stats = useMemo(
    () => ({
      total: entries.length,
      departments: [...new Set(entries.map((e) => e.department))].length,
      faculty: [...new Set(entries.map((e) => e.faculty))].length,
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

  const [deleteEntry, { isLoading: isDeleting }] = useDeleteTimetableEntryMutation();
  const handleDeleteEntry = async (id) => {
    try {
      await deleteEntry(id).unwrap();
      openAlert({ message: "Timetable entry removed.", severity: "success" });
      handleCloseModal();
    } catch (err) {
      openAlert({ message: err.data?.message || "Failed to remove entry.", severity: "error" });
    }
  };

  // New-entry scheduling form
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ day: "Monday", slot: SLOTS[0], courseAssignmentId: "", roomId: "" });

  const { data: assignmentsRes, isFetching: isFetchingAssignments } = useGetSchedulableAssignmentsQuery(
    undefined,
    { skip: !isCreateOpen },
  );
  const assignmentOptions = useMemo(() => assignmentsRes?.data || [], [assignmentsRes]);

  const { data: roomsRes, isFetching: isFetchingRooms } = useGetRoomsQuery(
    { isActive: true },
    { skip: !isCreateOpen },
  );
  const roomOptions = useMemo(() => roomsRes?.data || [], [roomsRes]);

  const openCreateModal = () => {
    setForm({ day: "Monday", slot: SLOTS[0], courseAssignmentId: "", roomId: "" });
    setIsCreateOpen(true);
  };
  const closeCreateModal = () => setIsCreateOpen(false);

  const [createEntry, { isLoading: isCreating }] = useCreateTimetableEntryMutation();
  const handleCreateEntry = async () => {
    if (!form.courseAssignmentId || !form.roomId) {
      return openAlert({ message: "Select a course and a room.", severity: "warning" });
    }
    try {
      await createEntry(form).unwrap();
      openAlert({ message: "Timetable entry scheduled.", severity: "success" });
      closeCreateModal();
    } catch (err) {
      const detail = err.data?.conflicts?.join(" ");
      openAlert({ message: detail || err.data?.message || "Failed to schedule entry.", severity: "error" });
    }
  };

  return {
    entries: filtered,
    grid,
    isLoading: isFetching,
    error: error ? error.data?.message || "Failed to load timetable." : null,
    deptFilter,
    setDeptFilter,
    selectedDay,
    setSelectedDay,
    departments,
    selectedEntry,
    isModalOpen,
    stats,
    days: DAYS,
    slots: SLOTS,
    refetch,
    handleViewEntry,
    handleCloseModal,
    handleDeleteEntry,
    isDeleting,

    isCreateOpen,
    openCreateModal,
    closeCreateModal,
    form,
    setForm,
    assignmentOptions,
    isFetchingAssignments,
    roomOptions,
    isFetchingRooms,
    handleCreateEntry,
    isCreating,
  };
};
