import { useState, useMemo, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { useModalController } from "../../../shared/modal/hooks/useModalController";
import * as API from "../api/feeStructureApi"; // Update this path to your actual fee structure API
import { useGetStudentsQuery } from "../api/accountantstudentApi";
import {
  useGetTermsQuery,
  useGetDepartmentsQuery,
  useGetProgramsByDepartmentQuery,
} from "../api/depsemtermpro";

const SEMESTER_SCOPED_CATEGORIES = ["ACADEMIC", "EXAM"];

export const useCOISFeeSetup = () => {
  const { openAlert } = useGlobalAlert();
  const { modalState, openModal, closeModal } = useModalController();

  // --- UI STATES ---
  const [showGeneratorPage, setShowGeneratorPage] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [editingId, setEditingId] = useState(null);

  // --- SEARCH & FILTER STATES ---
  const [studentSearch, setStudentSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);

  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState(""); // Hidden from UI, auto-set
  const [selectedProg, setSelectedProg] = useState("");
  // "1" or "2" — HSSC programs always have exactly two Parts, so this is a
  // plain number filter, independent of Program, instead of a specific
  // Semester document ID that requires picking a Program first to resolve.
  const [selectedPart, setSelectedPart] = useState("");

  const [page, setPage] = useState(1);
  const [studentsList, setStudentsList] = useState([]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(studentSearch), 400);
    return () => clearTimeout(handler);
  }, [studentSearch]);

  useEffect(() => {
    setPage(1);
    setStudentsList([]);
  }, [debouncedSearch, selectedTerm, selectedDept, selectedProg, selectedPart]);

  // --- DATA FETCHING & AUTO-COLLEGE FILTER ---
  const { data: termData } = useGetTermsQuery();
  const { data: deptData } = useGetDepartmentsQuery();

  // ✅ AUTO-DETECT & LOCK COLLEGE DEPARTMENT
  useEffect(() => {
    if (deptData?.data && !selectedDept) {
      const coisDept = deptData.data.find(
        (d) =>
          d.name?.toLowerCase().includes("college") ||
          d.name?.toLowerCase().includes("intermediate") ||
          d.departmentName?.toLowerCase().includes("college"),
      );
      if (coisDept) setSelectedDept(coisDept._id);
      else if (deptData.data.length > 0) setSelectedDept(deptData.data[0]._id); // Fallback
    }
  }, [deptData, selectedDept]);

  // context: "college" scopes this to HSSC-level programs only (by
  // Program.level) — passing selectedDept directly here was silently
  // building a malformed query string (RTK's `new URLSearchParams(idString)`
  // does not produce `?departmentId=...`), so this dropdown was actually
  // returning every program in the system, university included.
  const { data: progData } = useGetProgramsByDepartmentQuery({
    context: "college",
    limit: 200,
  });

  const termOptions = useMemo(
    () =>
      termData?.data?.map((t) => ({
        label: t.name || t.termName,
        value: t._id,
      })) || [],
    [termData],
  );
  const progOptions = useMemo(
    () =>
      progData?.data?.map((p) => ({
        label: p.name || p.programName,
        value: p._id,
      })) || [],
    [progData],
  );
  // HSSC programs always have exactly two Parts — no per-program lookup
  // needed, and this lets the filter work before/without picking one.
  const PART_OPTIONS = [
    { label: "Part 1", value: "1" },
    { label: "Part 2", value: "2" },
  ];

  // --- STUDENTS FETCHING ---
  const { data: studentsData, isFetching: loadingStudents } =
    useGetStudentsQuery({
      search: debouncedSearch,
      termId: selectedTerm,
      departmentId: selectedDept, // Hard-locked to College
      programId: selectedProg,
      semesterNumber: selectedPart,
      page: page,
      limit: 30,
    });

  useEffect(() => {
    if (studentsData?.data || studentsData?.students) {
      const fetchedStudents = Array.isArray(studentsData.data)
        ? studentsData.data
        : studentsData.data?.data || studentsData.students || [];
      if (page === 1) {
        setStudentsList(fetchedStudents);
      } else {
        setStudentsList((prev) => {
          const newItems = fetchedStudents.filter(
            (n) => !prev.some((p) => p._id === n._id),
          );
          return [...prev, ...newItems];
        });
      }
    }
  }, [studentsData, page]);

  const loadMoreStudents = useCallback(() => {
    const meta = studentsData?.data?.pagination || studentsData?.pagination;
    const totalPages = meta?.totalPages || meta?.pages || 1;
    if (!loadingStudents && page < totalPages) setPage((p) => p + 1);
  }, [loadingStudents, studentsData, page]);

  // --- FEE LOGIC ---
  const singleStudentId =
    selectedStudents.length === 1 ? selectedStudents[0]._id : null;
  const {
    data: studentFeesRes,
    isLoading: loadingFees,
    refetch: refetchFees,
  } = API.useGetStudentFeesQuery(singleStudentId, { skip: !singleStudentId });
  const studentFees = useMemo(() => studentFeesRes?.data || [], [studentFeesRes]);

  const [upsertFee] = API.useUpsertStudentFeeMutation();
  const [bulkCreateFee] = API.useBulkCreateStudentFeeMutation();
  const [deleteFee] = API.useDeleteStudentFeeMutation();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { totalAmount: 0, securityFee: 0, feeItems: [], remarks: "" },
  });

  const handleProgChange = (val) => setSelectedProg(val);

  const partIdOf = (s) => String(s?.semesterId?._id || s?.semesterId || "");

  // Tuition/Exam fees are set per-Part — a bulk selection spanning two
  // different Parts has no single correct semesterId to tag the fee with,
  // so mixing Parts within one selection is blocked at the moment a
  // student would be added, not just at submit time.
  const toggleStudentSelect = (student) => {
    setSelectedStudents((prev) => {
      if (prev.some((s) => s._id === student._id)) {
        return prev.filter((s) => s._id !== student._id);
      }
      const existingPart = prev[0] ? partIdOf(prev[0]) : "";
      const newPart = partIdOf(student);
      if (existingPart && newPart && existingPart !== newPart) {
        openAlert({
          message: `${student.personalInfo?.fullName || "This student"} is in a different Part than your current selection — select students from the same Part only.`,
          severity: "warning",
        });
        return prev;
      }
      return [...prev, student];
    });
  };

  const selectAll = () => {
    const allVisibleIds = studentsList.map((s) => s._id);
    // Any visible student already selected — clicking again always clears
    // the visible ones. Requiring EVERY visible id to be selected before
    // allowing a clear would make deselection unreachable whenever some
    // visible students were skipped for being in a different Part (they can
    // never be added, so "all visible selected" could never become true).
    const anyVisibleSelected = allVisibleIds.some((id) =>
      selectedStudents.some((s) => s._id === id),
    );
    if (anyVisibleSelected) {
      setSelectedStudents((prev) =>
        prev.filter((s) => !allVisibleIds.includes(s._id)),
      );
      return;
    }
    const basePart = selectedStudents[0]
      ? partIdOf(selectedStudents[0])
      : partIdOf(studentsList[0]);
    const matching = basePart
      ? studentsList.filter((s) => partIdOf(s) === basePart)
      : studentsList;
    const newSelection = [...selectedStudents];
    matching.forEach((student) => {
      if (!newSelection.some((s) => s._id === student._id))
        newSelection.push(student);
    });
    setSelectedStudents(newSelection);
    const skipped = studentsList.length - matching.length;
    if (skipped > 0) {
      openAlert({
        message: `${skipped} student(s) were skipped — they're in a different Part than the rest of this selection.`,
        severity: "info",
      });
    }
  };

  const proceedToGenerator = () => {
    if (selectedStudents.length === 0)
      return openAlert({
        message: "Select at least one student",
        severity: "warning",
      });
    setShowGeneratorPage(true);
  };

  const handleAdd = () => {
    reset({ totalAmount: 0, securityFee: 0, feeItems: [], remarks: "" });
    setEditingId(null);
    openModal({ name: "studentFeeModal" });
  };

  // Pre-fills the modal with the existing record so Save re-upserts it
  // (onSubmit already passes `id: editingId` through to upsertFee) instead
  // of creating a duplicate. The Security Deposit line (Admission only) is
  // split back out of the saved total, since the form's Total Amount field
  // is the pre-breakdown base the accountant originally typed, not the
  // final sum including security.
  const handleEdit = (fee) => {
    const securityItem = (fee.feeItems || []).find((i) =>
      (i.headName || "").toLowerCase().includes("security"),
    );
    const securityAmt = securityItem?.amount || 0;
    reset({
      totalAmount: (fee.totalAmount || 0) - securityAmt,
      securityFee: securityAmt,
      feeItems: fee.feeItems || [],
      remarks: fee.remarks || "",
    });
    setEditingId(fee._id);
    openModal({ name: "studentFeeModal" });
  };

  const handleDelete = async (fee) => {
    if (
      !window.confirm(
        `Delete this ${fee.category} fee record (Rs. ${(fee.totalAmount || 0).toLocaleString()})? This cannot be undone.`,
      )
    )
      return;
    try {
      await deleteFee(fee._id).unwrap();
      openAlert({ message: "Fee record deleted", severity: "success" });
      refetchFees();
    } catch (e) {
      openAlert({
        message: e?.data?.message || "Failed to delete fee record",
        severity: "error",
      });
    }
  };

  const generateBreakdown = useCallback(
    (baseAmount, tab, securityAmount = 0) => {
      const amount = Number(baseAmount) || 0;
      if (tab === 4)
        return [
          {
            headName: "Miscellaneous Fee",
            frequency: "ONCE",
            isPercentage: false,
            percentageValue: 0,
            amount,
          },
        ];

      let rules = [];
      if (tab === 0)
        rules = [
          { name: "Tuition", percent: 60 },
          { name: "Maintenance", percent: 15 },
          { name: "Laboratory", percent: 8 },
          { name: "Library", percent: 17 },
        ];
      else if (tab === 1) rules = [{ name: "Admission", percent: 100 }];
      else if (tab === 2) rules = [{ name: "Re-Admission", percent: 100 }];
      else if (tab === 3) rules = [{ name: "Exam Fee", percent: 100 }];

      const generated = rules.map((r) => ({
        headName: r.name,
        frequency: "SEMESTER",
        isPercentage: true,
        percentageValue: r.percent,
        amount: Math.round((amount * r.percent) / 100),
      }));
      if (tab === 1 && securityAmount > 0)
        generated.push({
          headName: "Security Deposit",
          frequency: "ONCE",
          isPercentage: false,
          percentageValue: 0,
          amount: Number(securityAmount),
        });
      return generated;
    },
    [],
  );

  const onSubmit = async (data) => {
    try {
      const refStudent = selectedStudents[0];
      const isBulk = selectedStudents.length > 1;
      const termId =
        (isBulk && selectedTerm) ||
        refStudent?.termId?._id ||
        refStudent?.termId;
      // ACADEMIC (Tuition) and EXAM repeat every Part, so they must be
      // tagged with a real semesterId — without it, the backend can't tell
      // this Part's fee setup apart from any other, and features that
      // depend on per-Part scoping (Master Data export, the Student
      // Profile report, installment plans) silently break or show the
      // wrong data. Always taken from the selected student(s)' OWN current
      // Part — never from the (possibly stale) filter dropdown — so a Part
      // 1 student can never end up with a fee tagged to Part 2 or vice
      // versa.
      const semesterId = refStudent?.semesterId?._id || refStudent?.semesterId;
      const amount = Number(data.totalAmount);
      const categoryMap = [
        "ACADEMIC",
        "ADMISSION",
        "READMISSION",
        "EXAM",
        "MISC",
      ];
      const category = categoryMap[activeTab] || "MISC";
      const semesterScoped = category === "ACADEMIC" || category === "EXAM";

      if (semesterScoped && isBulk) {
        const distinctParts = new Set(selectedStudents.map(partIdOf));
        if (distinctParts.size > 1) {
          return openAlert({
            message:
              "Selected students span more than one Part — Tuition/Exam fees can only be bulk-assigned to students who are all in the same Part.",
            severity: "warning",
          });
        }
      }

      if (semesterScoped && !semesterId) {
        return openAlert({
          message:
            "This student has no Part/Semester on record — cannot set a Tuition/Exam fee.",
          severity: "warning",
        });
      }

      let items = generateBreakdown(
        amount,
        activeTab,
        Number(data.securityFee || 0),
      );
      const finalTotal = items.reduce(
        (sum, item) => sum + Number(item.amount),
        0,
      );

      const payloadBase = {
        termId,
        semesterId: semesterScoped ? semesterId : null,
        category,
        totalAmount: finalTotal,
        feeItems: items,
        remarks: data.remarks?.trim() || `${category} Fee`,
      };

      if (selectedStudents.length > 1) {
        await bulkCreateFee({
          ...payloadBase,
          studentIds: selectedStudents.map((s) => s._id),
        }).unwrap();
        openAlert({
          message: `Assigned to ${selectedStudents.length} students`,
          severity: "success",
        });
      } else {
        await upsertFee({
          ...payloadBase,
          id: editingId,
          studentId: selectedStudents[0]._id,
        }).unwrap();
        openAlert({ message: "Saved", severity: "success" });
      }
      if (selectedStudents.length === 1) refetchFees();
      closeModal();
    } catch {
      openAlert({ message: "Failed to save", severity: "error" });
    }
  };

  // Only ACADEMIC/EXAM repeat per-Part — a Part 2 student's `studentFees`
  // list also contains their old Part 1 Tuition/Exam records (kept as
  // history, not overwritten), which must never be blended into the
  // current Part's table. Split them here instead: `filteredTableData` is
  // always just the CURRENT Part's rows, and `previousPartTableData` is the
  // prior Part's rows for the same category, shown separately as read-only
  // reference.
  const currentPartNumber = singleStudentId
    ? (selectedStudents[0]?.semesterId?.number ?? null)
    : null;

  const filteredTableData = useMemo(() => {
    const category = ["ACADEMIC", "ADMISSION", "READMISSION", "EXAM", "MISC"][
      activeTab
    ];
    return studentFees.filter((f) => {
      if (f.category !== category) return false;
      if (!SEMESTER_SCOPED_CATEGORIES.includes(category)) return true;
      return (f.semesterId?.number ?? null) === currentPartNumber;
    });
  }, [studentFees, activeTab, currentPartNumber]);

  const previousPartTableData = useMemo(() => {
    const category = ["ACADEMIC", "ADMISSION", "READMISSION", "EXAM", "MISC"][
      activeTab
    ];
    if (!SEMESTER_SCOPED_CATEGORIES.includes(category)) return [];
    if (currentPartNumber == null) return [];
    return studentFees.filter(
      (f) =>
        f.category === category &&
        f.semesterId?.number != null &&
        f.semesterId.number !== currentPartNumber,
    );
  }, [studentFees, activeTab, currentPartNumber]);

  return {
    showGeneratorPage,
    setShowGeneratorPage,
    proceedToGenerator,
    activeTab,
    setActiveTab,
    selectedStudents,
    setSelectedStudents,
    toggleStudentSelect,
    selectAll,
    studentsList,
    loadMoreStudents,
    loadingStudents,
    termOptions,
    selectedTerm,
    setSelectedTerm,
    progOptions,
    selectedProg,
    handleProgChange,
    partOptions: PART_OPTIONS,
    selectedPart,
    setSelectedPart,
    studentSearch,
    setStudentSearch,
    tableData: filteredTableData,
    previousPartTableData,
    currentPartNumber,
    loadingFees,
    handleAdd,
    handleEdit,
    handleDelete,
    editingId,
    onSubmit: handleSubmit(onSubmit),
    modalState,
    closeModal,
    control,
    errors,
    watch,
    setValue,
    generateBreakdown,
  };
};
