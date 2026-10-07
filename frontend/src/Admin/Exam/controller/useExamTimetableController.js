import { useMemo, useState } from "react";
import {
  useGetTimetableEntriesQuery,
} from "../../Registrar/api/masterTimetableApi";
import { DAYS, SLOTS, mapEntry } from "../../Registrar/controller/useMasterTimetableController";
import {
  useGetDepartmentsQuery,
  useGetProgramsQuery,
  useGetTermsQuery,
} from "../../../components/catalog/api/catalogApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

// Read-only timetable browser for Exam staff — same weekly grid as the
// Registrar/HOD screens, but with real catalog-backed Department/Program/
// Term filters (resolved server-side) instead of just deriving a department
// list from whatever happened to already be loaded.
export const useExamTimetableController = () => {
  const [departmentId, setDepartmentId] = useState("");
  const [programId, setProgramId] = useState("");
  const [termId, setTermId] = useState("");
  const [selectedDay, setSelectedDay] = useState("All");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: deptRes } = useGetDepartmentsQuery();
  const departmentsList = extractArray(deptRes);

  const { data: progRes } = useGetProgramsQuery({
    context: "university",
    limit: 200,
    ...(departmentId ? { departmentId } : {}),
  });
  const programsList = extractArray(progRes);

  const { data: termRes } = useGetTermsQuery({ excludeLevel: "HSSC" });
  const termsList = extractArray(termRes);

  const { data, isFetching, error, refetch } = useGetTimetableEntriesQuery({
    ...(departmentId ? { departmentId } : {}),
    ...(programId ? { programId } : {}),
    ...(termId ? { termId } : {}),
    ...(selectedDay !== "All" ? { day: selectedDay } : {}),
  });
  const rawEntries = useMemo(() => data?.data || [], [data]);
  const entries = useMemo(() => rawEntries.map(mapEntry), [rawEntries]);

  const setDepartment = (id) => {
    setDepartmentId(id);
    setProgramId(""); // program list is scoped to department — reset on change
  };

  const grid = useMemo(() => {
    const g = {};
    DAYS.forEach((d) => {
      g[d] = {};
      SLOTS.forEach((s) => {
        g[d][s] = null;
      });
    });
    entries.forEach((e) => {
      if (g[e.day]) g[e.day][e.slot] = e;
    });
    return g;
  }, [entries]);

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

  return {
    entries,
    grid,
    isLoading: isFetching,
    error: error ? error.data?.message || "Failed to load timetable." : null,
    days: DAYS,
    slots: SLOTS,
    stats,
    refetch,

    // "deptFilter"/"setDeptFilter" + "departments" match MasterTimetableView's
    // existing filter-bar prop shape, but here they're just labels since
    // filtering happens server-side via departmentId.
    deptFilter: departmentId
      ? departmentsList.find((d) => d._id === departmentId)?.name || "All"
      : "All",
    setDeptFilter: (name) => {
      const match = departmentsList.find((d) => d.name === name);
      setDepartment(match ? match._id : "");
    },
    departments: ["All", ...departmentsList.map((d) => d.name)],

    selectedDay,
    setSelectedDay,

    programOptions: programsList.map((p) => ({ value: p._id, label: p.name })),
    programFilter: programId,
    setProgramFilter: setProgramId,

    termOptions: termsList.map((t) => ({ value: t._id, label: t.name })),
    termFilter: termId,
    setTermFilter: setTermId,

    selectedEntry,
    isModalOpen,
    handleViewEntry,
    handleCloseModal,
  };
};

export default useExamTimetableController;
