import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { useModalController } from "../../../shared/modal/hooks/useModalController";
import * as API from "../api/feeStructureApi";
import {
  useGetStudentsQuery,
  useGetStudentDetailsQuery,
} from "../api/accountantstudentApi";
import { useGetCompleteCatalogQuery } from "../api/depsemtermpro";

const useStudentFeeController = () => {
  const { openAlert } = useGlobalAlert();
  const { modalState, openModal, closeModal } = useModalController();

  const [showGeneratorPage, setShowGeneratorPage] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [showMiscModal, setShowMiscModal] = useState(false);

  const [studentSearch, setStudentSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  // Fee history table defaults to the student's CURRENT term only, so a
  // just-promoted student's stale prior-semester fee doesn't look like it
  // still applies. Staff can opt back into seeing everything.
  const [showAllTerms, setShowAllTerms] = useState(false);

  // Deep-link support — landing here as `?studentId=...` (e.g. from the
  // Revenue Explorer's "open in Fee Setup" link) auto-selects that student
  // and jumps straight to their fee setup screen instead of leaving this
  // on the blank student-search list. A minimal `{_id}` stub is enough:
  // useGetStudentDetailsQuery below fetches and merges in the rest.
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const deepLinkId = searchParams.get("studentId");
    if (deepLinkId && selectedStudents.length === 0) {
      setSelectedStudents([{ _id: deepLinkId }]);
      setShowGeneratorPage(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedProg, setSelectedProg] = useState("");
  const [selectedSem, setSelectedSem] = useState("");

  const [page, setPage] = useState(1);
  const [studentsList, setStudentsList] = useState([]);

  // --- Search Debounce ---
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(studentSearch), 400);
    return () => clearTimeout(handler);
  }, [studentSearch]);

  // --- Reset Pagination on Filter Change ---
  useEffect(() => {
    setPage(1);
    setStudentsList([]);
  }, [debouncedSearch, selectedTerm, selectedDept, selectedProg, selectedSem]);

  // --- Dropdown Data Fetching ---
  // Fee setup is shared by every school/class on the active campus. The
  // dropdowns only narrow the directory; they never define the academic
  // scope of a saved fee. That scope comes from each selected student.
  const { data: catalogRes } = useGetCompleteCatalogQuery({});
  const catalog = catalogRes?.data || {
    departments: [],
    programs: [],
    terms: [],
    semesters: [],
  };

  const termOptions = useMemo(
    () => catalog.terms.map((t) => ({ label: t.name, value: t._id })),
    [catalog.terms],
  );
  const deptOptions = useMemo(
    () => catalog.departments.map((d) => ({ label: d.name, value: d._id })),
    [catalog.departments],
  );
  const progOptions = useMemo(() => {
    if (!selectedDept) return [];
    return catalog.programs
      .filter(
        (p) =>
          String(p.departmentId?._id || p.departmentId) ===
          String(selectedDept),
      )
      .map((p) => ({ label: p.name, value: p._id }));
  }, [catalog.programs, selectedDept]);
  // Sections follow the chosen program; with only a class chosen they are
  // every section of that class's programs (shown with the program name).
  const semOptions = useMemo(() => {
    if (!selectedDept && !selectedProg) return [];
    let list = catalog.semesters;
    if (selectedProg) {
      list = list.filter(
        (s) => String(s.programId?._id || s.programId) === String(selectedProg),
      );
    } else {
      const programIds = new Set(
        catalog.programs
          .filter(
            (p) => String(p.departmentId?._id || p.departmentId) === String(selectedDept),
          )
          .map((p) => String(p._id)),
      );
      list = list.filter((s) => programIds.has(String(s.programId?._id || s.programId)));
    }
    return [...list]
      .sort((a, b) => (a.number || 0) - (b.number || 0))
      .map((s) => ({
        label:
          (s.name || `Section ${s.number}`) +
          (!selectedProg && s.programId?.name ? ` (${s.programId.name})` : ""),
        value: s._id,
      }));
  }, [catalog.semesters, catalog.programs, selectedDept, selectedProg]);

  // --- Students Fetching & Pagination ---
  const { data: studentsData, isFetching: loadingStudents } =
    useGetStudentsQuery({
      search: debouncedSearch,
      termId: selectedTerm,
      departmentId: selectedDept,
      programId: selectedProg,
      semesterId: selectedSem,
      page: page,
      limit: 30,
    });

  useEffect(() => {
    if (studentsData?.data || studentsData?.students) {
      const fetchedStudents = Array.isArray(studentsData.data)
        ? studentsData.data
        : studentsData.data?.students ||
          studentsData.data?.data ||
          studentsData.students ||
          [];

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
    const paginationObj =
      studentsData?.data?.pagination || studentsData?.pagination;
    const totalPages = paginationObj?.totalPages || paginationObj?.pages || 1;
    if (!loadingStudents && page < totalPages) setPage((p) => p + 1);
  }, [loadingStudents, studentsData, page]);

  // --- Fee Heads Fetching ---
  const { data: feeHeadsData, isLoading: loadingHeads } =
    API.useGetFeeHeadsQuery({
      type: "ACADEMIC,ADMISSION,READMISSION,EXAM",
    });
  const feeHeadOptions = useMemo(
    () =>
      feeHeadsData?.data?.map((h) => ({ label: h.name, value: h._id })) || [],
    [feeHeadsData],
  );

  // --- Student Specific Fee Fetching ---
  const selectedStudentRow =
    selectedStudents.length === 1 ? selectedStudents[0] : null;
  const singleStudentId = selectedStudentRow?._id || null;

  // The row from the (possibly stale) student list/search cache is fine for
  // display, but NOT for deciding "which semester is current" — if the
  // student was promoted elsewhere (e.g. the Admission module's semester
  // promotion tool, a different RTK Query slice this page never
  // invalidates), that cached row can still show their OLD semester. Pull a
  // fresh, authoritative read here instead of trusting it.
  const {
    data: freshStudentRes,
    refetch: refetchStudentDetails,
  } = useGetStudentDetailsQuery(singleStudentId, {
    skip: !singleStudentId,
    refetchOnMountOrArgChange: true,
  });
  const singleStudent = freshStudentRes?.data
    ? { ...selectedStudentRow, ...freshStudentRes.data }
    : selectedStudentRow;

  const {
    data: studentFeesRes,
    isLoading: loadingFees,
    refetch: refetchFees,
  } = API.useGetStudentFeesQuery(singleStudentId, { skip: !singleStudentId });
  const studentFees = useMemo(
    () => studentFeesRes?.data || [],
    [studentFeesRes],
  );

  // --- Global Misc Fees ---
  const { data: globalMiscRes } = API.useGetMiscellaneousFeesQuery();
  const globalMiscFees = globalMiscRes?.data || [];
  const [createGlobalMisc] = API.useCreateMiscellaneousFeeMutation();
  const [deleteGlobalMisc] = API.useDeleteMiscellaneousFeeMutation();

  // --- Mutations ---
  const [upsertFee] = API.useUpsertStudentFeeMutation();
  const [bulkCreateFee] = API.useBulkCreateStudentFeeMutation();
  const [deleteFee] = API.useDeleteStudentFeeMutation();
  const [assignFeeSemester, { isLoading: isAssigningSemester }] =
    API.useAssignFeeSemesterMutation();

  // --- Form Setup ---
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      totalAmount: 0,
      admissionFee: 0,
      registrationFee: 0,
      securityFee: 0,
      feeItems: [],
      feeSetupRemark: "",
    },
  });

  // --- Handlers ---
  const handleDeptChange = (val) => {
    setSelectedDept(val);
    setSelectedProg("");
    setSelectedSem("");
  };

  const handleProgChange = (val) => {
    setSelectedProg(val);
    setSelectedSem("");
  };

  const toggleStudentSelect = (student) => {
    setSelectedStudents((prev) => {
      const exists = prev.find((s) => s._id === student._id);
      return exists
        ? prev.filter((s) => s._id !== student._id)
        : [...prev, student];
    });
  };

  const selectAll = () => {
    const allVisibleIds = studentsList.map((s) => s._id);
    const anyVisibleSelected = allVisibleIds.some((id) =>
      selectedStudents.some((s) => s._id === id),
    );
    if (anyVisibleSelected) {
      setSelectedStudents((prev) =>
        prev.filter((s) => !allVisibleIds.includes(s._id)),
      );
    } else {
      const newSelection = [...selectedStudents];
      studentsList.forEach((student) => {
        if (!newSelection.some((s) => s._id === student._id))
          newSelection.push(student);
      });
      setSelectedStudents(newSelection);
    }
  };

  const clearSelectedStudents = () => setSelectedStudents([]);

  const getDerivedTermId = (student) => {
    if (!student) return null;
    return (
      student.term?._id || student.term || student.termId?._id || student.termId
    );
  };

  const getDerivedSemesterId = (student) => {
    if (!student) return null;
    return (
      student.semester?._id ||
      student.semester ||
      student.semesterId?._id ||
      student.semesterId
    );
  };

  const proceedToGenerator = () => {
    if (selectedStudents.length === 0)
      return openAlert({
        message: "Select at least one student",
        severity: "warning",
      });
    // Force a fresh read of the student's semester/term right as we enter
    // the setup flow — the list row selected on the previous screen may be
    // stale if the student was promoted elsewhere since it was fetched.
    if (selectedStudents.length === 1) refetchStudentDetails();
    setShowGeneratorPage(true);
  };

  const handleAdd = () => {
    if (selectedStudents.length === 0)
      return openAlert({
        message: "Select at least one student first.",
        severity: "warning",
      });

    setEditingId(null);
    reset({
      title: "",
      totalAmount: 0,
      admissionFee: 0,
      registrationFee: 0,
      securityFee: 0,
      feeItems: [],
      feeSetupRemark: "",
    });
    openModal({ name: "studentFeeModal" });
  };

  const handleEdit = (row) => {
    setEditingId(row._id);

    if (activeTab === 1 || activeTab === 2) {
      const admItem = row.feeItems?.find(
        (i) =>
          i.headName?.toLowerCase().includes("admission") ||
          i.headId?.name?.toLowerCase().includes("admission"),
      );
      const regItem = row.feeItems?.find(
        (i) =>
          i.headName?.toLowerCase().includes("registration") ||
          i.headId?.name?.toLowerCase().includes("registration"),
      );
      const secItem = row.feeItems?.find(
        (i) =>
          i.headName?.toLowerCase().includes("security") ||
          i.headId?.name?.toLowerCase().includes("security"),
      );

      reset({
        title: row.title || row.name || "",
        admissionFee: admItem ? admItem.amount : 0,
        registrationFee: regItem ? regItem.amount : row.registrationFee || 0,
        securityFee: secItem ? secItem.amount : row.securityDeposit || 0,
        feeItems: [],
        feeSetupRemark: row.feeSetupRemark || "",
      });
    } else {
      reset({
        title: row.title || row.name || "",
        totalAmount: row.totalAmount,
        feeItems: row.feeItems || [],
        feeSetupRemark: row.feeSetupRemark || "",
      });
    }
    openModal({ name: "studentFeeModal" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this fee?")) return;
    try {
      await deleteFee(id).unwrap();
      refetchFees();
    } catch {
      openAlert({ message: "Deletion Failed", severity: "error" });
    }
  };

  // Permanently tags a legacy (untagged) fee record — currently only
  // being SHOWN as this semester's fee via the read-time fallback — with
  // the student's actual current semester, once staff confirm it. After
  // this, it's a normal, properly-tagged record everywhere.
  const handleAssignSemester = async (recordId) => {
    if (!currentSemesterId) return;
    if (
      !window.confirm(
        `Assign this fee record to Section ${singleStudent?.semesterId?.number ?? ""}? This cannot be undone.`,
      )
    )
      return;
    try {
      await assignFeeSemester({
        id: recordId,
        semesterId: currentSemesterId,
      }).unwrap();
      openAlert({ message: "Section assigned", severity: "success" });
      refetchFees();
    } catch (err) {
      openAlert({
        message: err?.data?.message || "Failed to assign semester",
        severity: "error",
      });
    }
  };

  const generateBreakdown = useCallback(
    (baseAmount, tab) => {
      const amount = Number(baseAmount) || 0;
      if (!feeHeadOptions || feeHeadOptions.length === 0) return [];
      let rules = [];
      if (tab === 0)
        rules = [
          { name: "Tuition", percent: 60, freq: "SEMESTER" },
          { name: "Maintenance", percent: 15, freq: "SEMESTER" },
          { name: "Laboratory", percent: 8, freq: "SEMESTER" },
          { name: "Institutional", percent: 7, freq: "SEMESTER" },
          { name: "Library", percent: 5, freq: "SEMESTER" },
          { name: "Sports", percent: 5, freq: "SEMESTER" },
        ];
      else if (tab === 3)
        rules = [{ name: "Exam Fee", percent: 100, freq: "SEMESTER" }];

      const generated = [];
      rules.forEach((rule) => {
        const head = feeHeadOptions.find((opt) =>
          opt.label.toLowerCase().includes(rule.name.toLowerCase()),
        );
        if (head)
          generated.push({
            headId: head.value,
            headName: head.label,
            frequency: rule.freq,
            isPercentage: true,
            percentageValue: rule.percent,
            amount: Math.round((amount * rule.percent) / 100),
          });
      });
      return generated;
    },
    [feeHeadOptions],
  );

  const onSubmit = async (data) => {
    try {
      const isBulk = selectedStudents.length > 1;
      // In single-student mode, `singleStudent` is the freshly-fetched
      // record (see above) — use it over the raw list selection so a
      // just-promoted student's fee gets tagged with their real current
      // term/semester, not whatever was cached when they were selected.
      // Class/program/section/session dropdowns are search filters only.
      // A selected student's own profile supplies these IDs. For bulk
      // setup the backend resolves them independently for every student,
      // which safely supports one class containing multiple programs and
      // separate Section A documents.
      const termId = isBulk
        ? null
        : getDerivedTermId(singleStudent || selectedStudents[0]);
      const semesterId = isBulk
        ? null
        : getDerivedSemesterId(singleStudent || selectedStudents[0]);
      const categoryMap = ["ACADEMIC", "ADMISSION", "READMISSION", "EXAM"];
      const category = categoryMap[activeTab];
      let payloadBase = {};

      if (activeTab === 1 || activeTab === 2) {
        if (!isBulk && !termId)
          return openAlert({ message: "Term ID missing", severity: "error" });

        const admFee = Number(data.admissionFee || 0);
        const regFee = Number(data.registrationFee || 0);
        const secFee = Number(data.securityFee || 0);

        const items = [];
        if (admFee > 0)
          items.push({
            headId: null,
            headName: activeTab === 1 ? "Admission Fee" : "Re-Admission Fee",
            frequency: "ONCE",
            isPercentage: false,
            percentageValue: 0,
            amount: admFee,
          });
        if (regFee > 0)
          items.push({
            headId: null,
            headName: "Registration Fee",
            frequency: "ONCE",
            isPercentage: false,
            percentageValue: 0,
            amount: regFee,
          });
        if (secFee > 0)
          items.push({
            headId: null,
            headName: "Security Deposit",
            frequency: "ONCE",
            isPercentage: false,
            percentageValue: 0,
            amount: secFee,
          });

        const finalTotal = admFee + regFee + secFee;
        if (finalTotal <= 0)
          return openAlert({
            message: "Total amount cannot be 0",
            severity: "warning",
          });

        payloadBase = {
          title:
            data.title ||
            (activeTab === 1 ? "Admission Fee" : "Re-Admission Fee"),
          termId,
          category,
          totalAmount: finalTotal,
          securityDeposit: secFee,
          registrationFee: regFee,
          feeItems: items,
          remarks: "Admission Processing",
          feeSetupRemark: data.feeSetupRemark?.trim() || "",
        };
      } else {
        if (!isBulk && !termId)
          return openAlert({ message: "Term ID missing", severity: "error" });
        if (!isBulk && !semesterId)
          return openAlert({
            message:
              "This student has no Section assigned in their academic profile.",
            severity: "warning",
          });

        const amount = Number(data.totalAmount);
        let items = data.feeItems || [];
        if (items.length === 0) items = generateBreakdown(amount, activeTab);

        const breakdownSum = items.reduce(
          (sum, item) => sum + Number(item.amount),
          0,
        );
        if (breakdownSum <= 0)
          return openAlert({
            message: "Breakdown missing",
            severity: "warning",
          });

        payloadBase = {
          title: data.title || (activeTab === 3 ? "Exam Fee" : "Tuition Fee"),
          termId,
          semesterId,
          category,
          totalAmount: breakdownSum,
          securityDeposit: 0,
          feeItems: items,
          remarks: "Fee",
          feeSetupRemark: data.feeSetupRemark?.trim() || "",
        };
      }

      if (selectedStudents.length > 1) {
        await bulkCreateFee({
          ...payloadBase,
          studentIds: selectedStudents.map((s) => s._id),
          remarks: "Bulk Fee",
        }).unwrap();
        openAlert({
          message: `Assigned to ${selectedStudents.length} students`,
          severity: "success",
        });
      } else if (selectedStudents.length === 1) {
        await upsertFee({
          ...payloadBase,
          id: editingId,
          studentId: selectedStudents[0]._id,
        }).unwrap();
        openAlert({ message: "Saved", severity: "success" });
      }

      if (selectedStudents.length === 1) refetchFees();
      closeModal();
    } catch (err) {
      openAlert({
        message: err?.data?.message || "Failed to save",
        severity: "error",
      });
    }
  };

  // Tuition and Exam repeat every semester, so they're scoped by the
  // student's current semesterId — promoting a student (which often keeps
  // the same termId) must not make their new semester look "already set up"
  // using the previous semester's record. Admission/Re-Admission are
  // one-time-per-enrollment, so they aren't semester-scoped at all.
  const isSemesterScopedTab = activeTab === 0 || activeTab === 3;
  const currentSemesterId =
    singleStudent && isSemesterScopedTab
      ? String(getDerivedSemesterId(singleStudent) || "") || null
      : null;

  const categoryFeesForTab = useMemo(() => {
    const categoryMap = ["ACADEMIC", "ADMISSION", "READMISSION", "EXAM"];
    return studentFees.filter((f) => f.category === categoryMap[activeTab]);
  }, [studentFees, activeTab]);

  // Legacy records saved before semesterId tagging existed on Tuition/Exam
  // fee setup — surfaced separately so the table/status banner below can
  // fall back to one instead of showing the student as "not set up yet"
  // (and risking a duplicate being created) purely because the old record
  // has no semesterId to match against.
  const untaggedFeesForTab = useMemo(
    () => categoryFeesForTab.filter((f) => !f.semesterId),
    [categoryFeesForTab],
  );

  const filteredTableData = useMemo(() => {
    if (!isSemesterScopedTab || !currentSemesterId || showAllTerms)
      return categoryFeesForTab;
    const tagged = categoryFeesForTab.filter(
      (f) => String(f.semesterId?._id || f.semesterId || "") === currentSemesterId,
    );
    // Only fall back when there's exactly ONE untagged record — more than
    // one is ambiguous (which old semester does it belong to?), so that
    // case is intentionally left showing "not set up" rather than guessing.
    if (tagged.length === 0 && untaggedFeesForTab.length === 1) {
      return untaggedFeesForTab;
    }
    return tagged;
  }, [
    categoryFeesForTab,
    isSemesterScopedTab,
    currentSemesterId,
    showAllTerms,
    untaggedFeesForTab,
  ]);

  const hiddenOlderTermCount =
    isSemesterScopedTab && currentSemesterId && !showAllTerms
      ? categoryFeesForTab.length - filteredTableData.length
      : 0;

  // Only meaningful in single-student mode on a semester-scoped tab — tells
  // staff at a glance whether Tuition/Exam has already been configured for
  // the student's CURRENT semester (e.g. right after a promotion) or
  // whether it still needs a setup. Always checked against the full
  // category list (not filteredTableData), so it stays correct even while
  // "show older records" is toggled on.
  const isTaggedToCurrentSemester = categoryFeesForTab.some(
    (f) =>
      String(f.semesterId?._id || f.semesterId || "") === currentSemesterId,
  );
  // Showing as "configured" purely because exactly one untagged legacy
  // record was matched via fallback — not a real tag — so the UI can
  // offer to permanently fix it (see handleAssignSemester).
  const isLegacyUntaggedMatch =
    !isTaggedToCurrentSemester && untaggedFeesForTab.length === 1;

  const currentSemesterFeeStatus =
    singleStudent && isSemesterScopedTab
      ? {
          configured: isTaggedToCurrentSemester || isLegacyUntaggedMatch,
          isLegacyUntagged: isLegacyUntaggedMatch,
          legacyRecordId: isLegacyUntaggedMatch
            ? untaggedFeesForTab[0]._id
            : null,
          semesterNumber: singleStudent.semesterId?.number ?? null,
          termName: singleStudent.termId?.name ?? null,
        }
      : null;

  // Swap in the freshly-fetched record for display when exactly one student
  // is selected, so the sidebar's semester chip can't disagree with the
  // (now-correct) status banner/table above it.
  const displaySelectedStudents = singleStudent
    ? [singleStudent]
    : selectedStudents;

  return {
    showGeneratorPage,
    setShowGeneratorPage,
    proceedToGenerator,
    activeTab,
    setActiveTab,
    selectedStudents: displaySelectedStudents,
    setSelectedStudents,
    clearSelectedStudents,
    toggleStudentSelect,
    selectAll,
    studentsList,
    loadMoreStudents,
    termOptions,
    selectedTerm,
    setSelectedTerm,
    deptOptions,
    progOptions,
    semOptions,
    selectedDept,
    handleDeptChange,
    selectedProg,
    handleProgChange,
    selectedSem,
    setSelectedSem,
    studentSearch,
    setStudentSearch,
    tableData: filteredTableData,
    currentSemesterFeeStatus,
    currentSemesterId,
    isSemesterScopedTab,
    hiddenOlderTermCount,
    showAllTerms,
    setShowAllTerms,
    loadingFees,
    loadingStudents,
    handleAdd,
    handleEdit,
    handleDelete,
    handleAssignSemester,
    isAssigningSemester,
    onSubmit: handleSubmit(onSubmit),
    modalState,
    closeModal,
    control,
    errors,
    watch,
    setValue,
    feeHeadOptions,
    generateBreakdown,
    loadingHeads,
    showMiscModal,
    setShowMiscModal,
    globalMiscFees,
    createGlobalMisc,
    deleteGlobalMisc,
  };
};

export default useStudentFeeController;
