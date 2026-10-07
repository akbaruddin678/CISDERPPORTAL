import { useEffect, useMemo, useState } from "react";
import { useGlobalAlert } from "../../../../shared/Alert/context/AlertContext";
import {
  useGetRosterQuery,
  useMarkAttendanceMutation,
  useGetClassReportQuery,
  useGetStudentReportQuery,
} from "../api/attendanceApi";

const useTeacherAttendanceController = ({ courseAssignmentId }) => {
  const { openAlert } = useGlobalAlert();

  const [activeTab, setActiveTab] = useState("mark");
  // Local, unsaved edits made in the Mark Attendance tab — keyed by studentId.
  const [pendingStatuses, setPendingStatuses] = useState({});
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const {
    data: rosterRes,
    isFetching: isFetchingRoster,
  } = useGetRosterQuery({ courseAssignmentId }, { skip: !courseAssignmentId });

  const roster = useMemo(() => rosterRes?.data || [], [rosterRes]);

  const [markAttendanceMutation, { isLoading: isSaving }] =
    useMarkAttendanceMutation();

  // What the Mark tab actually renders: server-known status, overridden by
  // any not-yet-saved local click.
  const students = useMemo(
    () =>
      roster.map((s) => ({
        ...s,
        status: pendingStatuses[s.studentId] ?? s.status,
      })),
    [roster, pendingStatuses],
  );

  useEffect(() => {
    setPendingStatuses({});
  }, [courseAssignmentId]);

  useEffect(() => {
    if (roster.length > 0 && !selectedStudentId) {
      setSelectedStudentId(roster[0].studentId);
    } else if (roster.length === 0) {
      setSelectedStudentId(null);
    }
  }, [roster, selectedStudentId]);

  const markStudent = (studentId, status) => {
    setPendingStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  // Seeds every roster student to Present in one click — nothing is saved
  // until "Save Attendance," so a teacher can still click individual
  // students afterward to flip exceptions (absent/late) before submitting.
  const markAllPresent = () => {
    setPendingStatuses(Object.fromEntries(roster.map((s) => [s.studentId, "Present"])));
  };

  const markedCount = students.filter((s) => s.status).length;

  const handleSubmitAttendance = async () => {
    const records = students
      .filter((s) => s.status)
      .map((s) => ({ studentId: s.studentId, status: s.status }));

    if (records.length === 0) {
      return openAlert({
        message: "Mark at least one student before submitting.",
        severity: "warning",
      });
    }

    try {
      const result = await markAttendanceMutation({
        courseAssignmentId,
        records,
      }).unwrap();
      openAlert({
        message: result?.message || "Attendance saved successfully.",
        severity: "success",
      });
      setPendingStatuses({});
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to save attendance.",
        severity: "error",
      });
    }
  };

  // --- Class Report (fetched only while that tab is open) ---
  const { data: classReportRes, isFetching: isFetchingClassReport } =
    useGetClassReportQuery(courseAssignmentId, {
      skip: !courseAssignmentId || activeTab !== "class-report",
    });
  const classReport = classReportRes?.data || { totalSessions: 0, students: [] };

  // --- Individual Report (fetched only while that tab is open) ---
  const { data: studentReportRes, isFetching: isFetchingStudentReport } =
    useGetStudentReportQuery(
      { courseAssignmentId, studentId: selectedStudentId },
      {
        skip:
          !courseAssignmentId ||
          !selectedStudentId ||
          activeTab !== "individual-report",
      },
    );
  const studentReport = studentReportRes?.data || { log: [], monthly: [] };

  return {
    activeTab,
    setActiveTab,

    // Mark Attendance
    students,
    isFetchingRoster,
    markStudent,
    markAllPresent,
    markedCount,
    isSaving,
    handleSubmitAttendance,

    // Class Report
    classReport,
    isFetchingClassReport,

    // Individual Report
    roster,
    selectedStudentId,
    setSelectedStudentId,
    studentReport,
    isFetchingStudentReport,
  };
};

export default useTeacherAttendanceController;
