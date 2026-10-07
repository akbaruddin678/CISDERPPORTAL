import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetGroupedRevenueQuery,
  useGetSemesterStudentsQuery,
} from "../api/revenueExplorerApi";

// Which existing screen each "link out" button on the Student level sends
// staff to — these three screens didn't support being deep-linked to a
// specific student before this feature; see the matching `?studentId=`
// read added to each of their controllers.
const LINK_PATHS = {
  feeSetup: "/student-fee-management",
  installment: "/student-installment-management",
  challan: "/student-challan-management",
};

export const useRevenueExplorer = () => {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  // The drill-down path itself — null until the admin clicks into that
  // level. Each entry keeps both the id (for querying) and a display name
  // (for the breadcrumb), so the breadcrumb never needs a second lookup.
  const [department, setDepartment] = useState(null);
  const [program, setProgram] = useState(null);
  const [semester, setSemester] = useState(null);

  // Exactly one of these is ever "current" — whichever level hasn't been
  // drilled into yet determines what the grouped-revenue query groups by.
  const groupBy = semester
    ? null
    : program
      ? "semester"
      : department
        ? "program"
        : "department";

  const { data: groupedRes, isFetching: isGroupedLoading } =
    useGetGroupedRevenueQuery(
      {
        month,
        year,
        groupBy,
        departmentId: department?.id,
        programId: program?.id,
      },
      { skip: !groupBy, refetchOnMountOrArgChange: true },
    );

  const { data: studentsRes, isFetching: isStudentsLoading } =
    useGetSemesterStudentsQuery(
      { semesterId: semester?.id, month, year },
      { skip: !semester, refetchOnMountOrArgChange: true },
    );

  const items = groupedRes?.data?.items || [];
  const unassignedTotal = groupedRes?.data?.unassignedTotal || 0;
  const students = studentsRes?.data?.students || [];
  const period = groupedRes?.data?.period || studentsRes?.data?.period || null;

  const monthOptions = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ].map((label, i) => ({ value: i + 1, label }));
  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i),
    [today],
  );

  // Drilling in always resets any deeper level state — going Department ->
  // Program then picking a NEW department must not leave a stale Program
  // selection scoping the (now different) query.
  const drillInto = (item) => {
    if (!department) {
      setDepartment({ id: item.id, name: item.name });
    } else if (!program) {
      setProgram({ id: item.id, name: item.name });
    } else if (!semester) {
      setSemester({ id: item.id, name: item.name });
    }
  };

  const goToRoot = () => {
    setDepartment(null);
    setProgram(null);
    setSemester(null);
  };
  const goToDepartment = () => {
    setProgram(null);
    setSemester(null);
  };
  const goToProgram = () => setSemester(null);

  const linkToStudent = (studentId, screen) => {
    const path = LINK_PATHS[screen];
    if (!path || !studentId) return;
    navigate(`${path}?studentId=${studentId}`);
  };

  return {
    month,
    setMonth,
    year,
    setYear,
    monthOptions,
    yearOptions,
    period,
    department,
    program,
    semester,
    currentLevel: semester ? "student" : groupBy,
    items,
    unassignedTotal,
    students,
    isLoading: isGroupedLoading || isStudentsLoading,
    drillInto,
    goToRoot,
    goToDepartment,
    goToProgram,
    linkToStudent,
  };
};
