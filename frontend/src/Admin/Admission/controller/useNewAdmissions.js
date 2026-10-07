import { useState, useEffect, useMemo, useCallback } from "react";
import {
  useGetAllStudentsQuery,
  useGetDepartmentsQuery,
  useGetProgramsQuery,
} from "../services/studentApi";
import {
  useGetChallanStatusBatchQuery,
  useReAdmitStudentMutation,
} from "../../accountant/api/accountantstudentApi";
import { useLazyGetChallansByStudentIdQuery } from "../../accountant/api/studentChallanApi";
import {
  buildChallanPage,
  openPrintWindow,
} from "../../accountant/common/ChallanPrintTemplate";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";

// "New admission" = first-semester/first-part students, matching the same
// convention already used by the accountant's own "New Admission" screen
// (StudentAdmissionController) — later semesters are ordinary continuing
// students, not new admissions.
export const useNewAdmissions = () => {
  const { openAlert } = useGlobalAlert();

  const [filters, setFilters] = useState({
    search: "",
    departmentId: "",
    programId: "",
    page: 1,
  });

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => clearTimeout(handler);
  }, [filters.search]);

  const { data: studentsRes, isLoading, isFetching } = useGetAllStudentsQuery(
    {
      limit: 0,
      search: debouncedSearch,
      departmentId: filters.departmentId,
      programId: filters.programId,
      // Only students whose admission application was actually accepted —
      // excludes anyone created outside the normal admission portal flow.
      onlyAcceptedAdmission: true,
    },
    { refetchOnMountOrArgChange: true },
  );

  const { data: departmentsRes } = useGetDepartmentsQuery();
  const { data: programsRes } = useGetProgramsQuery();
  const departments = departmentsRes?.data || [];
  const allPrograms = programsRes?.data || [];

  const programs = useMemo(() => {
    if (!filters.departmentId) return allPrograms;
    return allPrograms.filter(
      (p) => (p.departmentId?._id || p.departmentId) === filters.departmentId,
    );
  }, [allPrograms, filters.departmentId]);

  const rawStudents = studentsRes?.data?.students || [];

  // Only first-semester/first-part students are "new admissions".
  const newAdmissions = useMemo(
    () => rawStudents.filter((s) => (s.semester?.number || 1) === 1),
    [rawStudents],
  );

  const studentIds = useMemo(
    () => newAdmissions.map((s) => s._id),
    [newAdmissions],
  );

  // Challan/Payment status is computed on the accounts side from
  // StudentChallan records — fetched in a batch and merged in here rather
  // than duplicating that computation.
  const { data: challanStatusRes } = useGetChallanStatusBatchQuery(
    studentIds,
    { skip: studentIds.length === 0 },
  );
  const challanStatusMap = challanStatusRes?.data || {};

  const students = useMemo(
    () =>
      newAdmissions.map((s) => ({
        ...s,
        challanStatus: challanStatusMap[s._id]?.challanStatus || "not_generated",
        challanPendingAmount: challanStatusMap[s._id]?.pendingAmount || 0,
        challanLatestDueDate: challanStatusMap[s._id]?.latestDueDate || null,
      })),
    [newAdmissions, challanStatusMap],
  );

  // Challan-generation/payment breakdown across every currently-filtered
  // new admission (not just the current page) — this is what the summary
  // cards on the screen show.
  const stats = useMemo(() => {
    const total = students.length;
    let generated = 0;
    let paid = 0;
    let pending = 0;
    let overdue = 0;
    let cancelled = 0;
    for (const s of students) {
      if (s.challanStatus !== "not_generated") generated += 1;
      if (s.challanStatus === "paid") paid += 1;
      if (s.challanStatus === "pending") pending += 1;
      if (s.challanStatus === "overdue") overdue += 1;
      if (s.admissionLifecycleStatus === "cancelled_non_payment") cancelled += 1;
    }
    return {
      total,
      generated,
      notGenerated: total - generated,
      paid,
      unpaid: pending + overdue,
      overdue,
      cancelled,
    };
  }, [students]);

  const itemsPerPage = 20;
  const totalPages = Math.max(1, Math.ceil(students.length / itemsPerPage));
  const paginatedStudents = students.slice(
    (filters.page - 1) * itemsPerPage,
    filters.page * itemsPerPage,
  );
  const pagination = {
    current: filters.page,
    pages: totalPages,
    total: students.length,
  };

  const [reAdmitStudentMutation, { isLoading: isReAdmitting }] =
    useReAdmitStudentMutation();

  const reAdmitStudent = useCallback(
    async (studentId) => {
      try {
        await reAdmitStudentMutation(studentId).unwrap();
      } catch (error) {
        openAlert({
          message:
            error.data?.error ||
            error.data?.message ||
            "Failed to re-admit the student.",
          severity: "error",
        });
      }
    },
    [reAdmitStudentMutation, openAlert],
  );

  // --- PRINT CHALLAN ---
  // Same buildChallanPage/openPrintWindow template used everywhere else in
  // this app (Challan Management, COIS Print Challans, University Bulk
  // Print, etc.), so the printed design is identical no matter where it's
  // triggered from.
  const [triggerGetChallansByStudent] = useLazyGetChallansByStudentIdQuery();
  const [isPrinting, setIsPrinting] = useState(false);

  const printChallan = useCallback(
    async (student) => {
      // Opened synchronously, before the async fetch below, so browsers
      // don't treat it as an unsolicited popup once the data arrives.
      const printWin = window.open("", "_blank");
      setIsPrinting(true);
      try {
        const result = await triggerGetChallansByStudent(student._id).unwrap();
        const printableChallans = (result?.data?.challans || []).filter(
          (c) => !c.isDeleted && c.status !== "cancelled" && c.status !== "merged",
        );

        if (printableChallans.length === 0) {
          printWin?.close();
          openAlert({
            message: "No generated challans found for this student.",
            severity: "warning",
          });
          return;
        }

        openPrintWindow(
          printableChallans.map(buildChallanPage).join(""),
          `Fee Challans - ${student.personalInfo?.fullName || student.studentId}`,
          printWin,
        );
      } catch (error) {
        printWin?.close();
        openAlert({
          message:
            error.data?.error ||
            error.data?.message ||
            "Failed to fetch challans for printing.",
          severity: "error",
        });
      } finally {
        setIsPrinting(false);
      }
    },
    [triggerGetChallansByStudent, openAlert],
  );

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value, page: 1 };
      if (key === "departmentId") next.programId = "";
      return next;
    });
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.pages) {
      setFilters((prev) => ({ ...prev, page }));
    }
  };

  return {
    students: paginatedStudents,
    stats,
    departments,
    programs,
    filters,
    handleFilterChange,
    pagination,
    handlePageChange,
    isLoading: isLoading || isFetching,
    reAdmitStudent,
    isReAdmitting,
    printChallan,
    isPrinting,
  };
};
