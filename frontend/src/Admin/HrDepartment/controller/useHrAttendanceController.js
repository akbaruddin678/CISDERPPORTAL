import { useEffect, useMemo, useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetAttendanceForDateQuery,
  useMarkAttendanceMutation,
} from "../api/HrApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const useHrAttendanceController = () => {
  const { openAlert } = useGlobalAlert();
  const [date, setDate] = useState(todayStr());
  const [grid, setGrid] = useState({});

  const { data: rosterRes, isFetching, refetch } = useGetAttendanceForDateQuery(date, {
    refetchOnMountOrArgChange: true,
  });
  const roster = useMemo(() => extractArray(rosterRes), [rosterRes]);

  const [markAttendance, { isLoading: isSaving }] = useMarkAttendanceMutation();

  useEffect(() => {
    const initial = {};
    roster.forEach((r) => {
      // Unmarked stays unmarked — never silently default to "Present";
      // HR (or the biometric/kiosk punch, or the end-of-day absence
      // sweep) is what actually decides a real status.
      if (r.status) initial[r.staffId] = r.status;
    });
    setGrid(initial);
  }, [roster]);

  const handleStatusChange = (staffId, status) => {
    setGrid((prev) => ({ ...prev, [staffId]: status }));
  };

  const statistics = useMemo(() => {
    const counts = { Present: 0, Absent: 0, Late: 0, "Half-Day": 0, "On Leave": 0 };
    Object.values(grid).forEach((status) => {
      if (counts[status] !== undefined) counts[status] += 1;
    });
    return { total: roster.length, ...counts };
  }, [grid, roster]);

  const handleSave = async () => {
    const records = Object.entries(grid).map(([staffId, status]) => ({ staffId, status }));
    if (records.length === 0) {
      return openAlert({ message: "Mark at least one staff member first.", severity: "warning" });
    }
    try {
      const result = await markAttendance({ date, records }).unwrap();
      openAlert({ message: result.message || "Attendance saved.", severity: "success" });
      refetch();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to save attendance.",
        severity: "error",
      });
    }
  };

  return {
    date,
    setDate,
    roster: roster.map((r) => ({ ...r, status: grid[r.staffId] || r.status })),
    isFetching,
    statistics,
    handleStatusChange,
    handleSave,
    isSaving,
  };
};

export default useHrAttendanceController;
