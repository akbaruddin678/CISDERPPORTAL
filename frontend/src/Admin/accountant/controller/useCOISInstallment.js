import { useState, useEffect, useCallback, useMemo } from "react";
import {
  useGetDepartmentsQuery,
  useGetTermsQuery,
  useGetProgramsByDepartmentQuery,
  useGetSemestersByProgramQuery,
} from "../api/depsemtermpro";
import { useGetStudentsQuery } from "../api/accountantstudentApi";
import {
  useSaveStudentPreferenceMutation,
  useGetStudentPreferenceQuery,
} from "../api/installmentApi"; // Ensure this path is correct
import { useGetStudentFeesQuery } from "../api/feeStructureApi";

const LIMIT = 40;

export const useCOISInstallment = () => {
  const [showSetupPage, setShowSetupPage] = useState(false);

  // Filters (Department is hidden from UI but used in API)
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedProg, setSelectedProg] = useState("");
  // "1" or "2" — HSSC programs always have exactly two Parts, so this is a
  // plain number filter for the student list, independent of Program,
  // instead of a specific Semester document ID that requires picking a
  // Program first to resolve.
  const [selectedPart, setSelectedPart] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Installment State
  const [installmentCount, setInstallmentCount] = useState(2);
  const [customPercentages, setCustomPercentages] = useState([50, 50]);
  // "percentage" (default) splits whatever the tuition fee turns out to be
  // at generation time. "amount" locks each installment to a fixed Rupee
  // figure the accountant chooses — needed for College/Intermediate plans
  // set up around round/negotiated figures instead of clean percentages.
  const [installmentMode, setInstallmentModeState] = useState("percentage");
  const [customAmounts, setCustomAmounts] = useState([0, 0]);
  const [customMonths, setCustomMonths] = useState(["", ""]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [studentsList, setStudentsList] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  // --- 1. SEARCH DEBOUNCE ---
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  // --- 2. RESET PAGINATION ON FILTER CHANGE ---
  useEffect(() => {
    setPage(1);
    setStudentsList([]);
    setHasMore(true);
  }, [debouncedSearch, selectedTerm, selectedDept, selectedProg, selectedPart]);

  // --- 3. FETCH CATALOG DATA & AUTO-LOCK COLLEGE DEPT ---
  const { data: termsData } = useGetTermsQuery();
  const { data: deptData } = useGetDepartmentsQuery();

  useEffect(() => {
    if (deptData?.data && !selectedDept) {
      const coisDept = deptData.data.find(
        (d) =>
          d.name?.toLowerCase().includes("college") ||
          d.name?.toLowerCase().includes("intermediate") ||
          d.departmentName?.toLowerCase().includes("college"),
      );
      if (coisDept) setSelectedDept(coisDept._id);
      else if (deptData.data.length > 0) setSelectedDept(deptData.data[0]._id);
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

  const terms = termsData?.data || [];
  const programs = progData?.data || [];
  // HSSC programs always have exactly two Parts — no per-program lookup
  // needed, and this lets the filter work before/without picking one.
  const PART_OPTIONS = [
    { label: "Part 1", value: "1" },
    { label: "Part 2", value: "2" },
  ];

  // --- 4. FETCH STUDENTS ---
  const {
    data: studentsRes,
    isLoading: isStudentsLoading,
    isFetching: isStudentsFetching,
    refetch,
  } = useGetStudentsQuery({
    termId: selectedTerm,
    departmentId: selectedDept,
    programId: selectedProg,
    semesterNumber: selectedPart,
    search: debouncedSearch,
    page,
    limit: LIMIT,
  });

  useEffect(() => {
    if (!studentsRes) return;
    let fetched = Array.isArray(studentsRes?.data?.data)
      ? studentsRes.data.data
      : Array.isArray(studentsRes?.data?.students)
        ? studentsRes.data.students
        : Array.isArray(studentsRes?.data)
          ? studentsRes.data
          : Array.isArray(studentsRes?.students)
            ? studentsRes.students
            : [];

    const meta =
      studentsRes?.data?.pagination ||
      studentsRes?.data?.meta ||
      studentsRes?.pagination ||
      studentsRes?.meta ||
      {};
    const totalPages = meta?.totalPages || meta?.pages || 1;
    const currentPage = meta?.currentPage || meta?.page || page;

    setHasMore(currentPage < totalPages || fetched.length === LIMIT);

    setStudentsList((prev) => {
      if (page === 1) return fetched;
      const existingIds = new Set(prev.map((s) => s._id));
      const newItems = fetched.filter((s) => !existingIds.has(s._id));
      return [...prev, ...newItems];
    });
  }, [studentsRes, page]);

  const loadMoreStudents = useCallback(() => {
    if (isStudentsLoading || isStudentsFetching || !hasMore) return;
    setPage((p) => p + 1);
  }, [isStudentsLoading, isStudentsFetching, hasMore]);

  // --- 5. SELECTION HANDLERS ---
  const handleProgChange = (val) => setSelectedProg(val);

  const partIdOf = (s) => String(s?.semesterId?._id || s?.semesterId || "");

  // Installment plans are set per-Part — a bulk selection spanning two
  // different Parts has no single correct semesterId to bind the plan to,
  // so mixing Parts within one selection is blocked at the moment a
  // student would be added, not just at save time.
  const toggleStudentSelection = (student) => {
    setSelectedStudents((prev) => {
      if (prev.some((s) => s._id === student._id)) {
        return prev.filter((s) => s._id !== student._id);
      }
      const existingPart = prev[0] ? partIdOf(prev[0]) : "";
      const newPart = partIdOf(student);
      if (existingPart && newPart && existingPart !== newPart) {
        alert(
          `${student.personalInfo?.fullName || "This student"} is in a different Part than your current selection — select students from the same Part only.`,
        );
        return prev;
      }
      return [...prev, student];
    });
  };

  const toggleSelectAll = (isChecked) => {
    if (!isChecked) {
      const visibleIds = new Set(studentsList.map((s) => s._id));
      setSelectedStudents((prev) => prev.filter((s) => !visibleIds.has(s._id)));
      return;
    }
    setSelectedStudents((prev) => {
      const basePart = prev[0] ? partIdOf(prev[0]) : partIdOf(studentsList[0]);
      const matching = basePart
        ? studentsList.filter((s) => partIdOf(s) === basePart)
        : studentsList;
      const ids = new Set(prev.map((s) => s._id));
      const toAdd = matching.filter((s) => !ids.has(s._id));
      const skipped = studentsList.length - matching.length;
      if (skipped > 0) {
        alert(
          `${skipped} student(s) were skipped — they're in a different Part than the rest of this selection.`,
        );
      }
      return [...prev, ...toAdd];
    });
  };

  const removeStudent = (studentId) =>
    setSelectedStudents((prev) => prev.filter((s) => s._id !== studentId));

  // The semester this configuration applies to — always the selected
  // student(s)' OWN real current semester, never the (possibly stale)
  // filter dropdown. Safe to read off the first selected student even in
  // bulk mode: toggleStudentSelection/toggleSelectAll already refuse to
  // mix students from different Parts, so every selected student shares
  // the same actual semesterId.
  const singleStudentId =
    selectedStudents.length === 1 ? selectedStudents[0]._id : null;
  const activeSemesterId = selectedStudents[0]
    ? String(
        selectedStudents[0]?.semesterId?._id ||
          selectedStudents[0]?.semesterId ||
          "",
      ) || null
    : null;

  // The Tuition (ACADEMIC) fee actually configured for this student's
  // current Part — installments are a split of THIS amount, so it must be
  // shown up front (not just raw percentages with no rupee figure behind
  // them), matching the University Installment Configuration screen.
  const { data: studentFeesRes, isFetching: loadingFees } =
    useGetStudentFeesQuery(singleStudentId, { skip: !singleStudentId });

  const tuitionFeeRecord = useMemo(() => {
    if (!studentFeesRes?.data) return null;
    return (
      studentFeesRes.data.find((f) => {
        if (f.category !== "ACADEMIC") return false;
        if (!activeSemesterId) return true;
        const fSemId = String(f.semesterId?._id || f.semesterId || "");
        return fSemId === String(activeSemesterId);
      }) || null
    );
  }, [studentFeesRes, activeSemesterId]);

  const fetchedTotalFee = tuitionFeeRecord?.totalAmount || 0;
  const hasTuitionFeeSetup = Boolean(tuitionFeeRecord);

  // Correctly-scoped existing preference for the semester actually being
  // configured — NOT the student list row's possibly-stale `feePreference`
  // field (which may reflect a different semester entirely).
  const { data: existingPrefRes, isFetching: loadingPreference } =
    useGetStudentPreferenceQuery(
      { studentId: singleStudentId, semesterId: activeSemesterId },
      {
        skip: !singleStudentId || !activeSemesterId,
        // Always hit the network on mount/args-change rather than trusting
        // whatever's cached — reopening this screen for a student right
        // after saving their plan must show the plan that was just saved,
        // not a stale pre-save snapshot.
        refetchOnMountOrArgChange: true,
      },
    );
  const existingPreference = existingPrefRes?.data || null;

  // Part number of the single selected student, and — when that's Part
  // 2 — their Part 1 installment plan, shown read-only as reference while
  // configuring Part 2.
  const currentPartNumber = singleStudentId
    ? (selectedStudents[0]?.semesterId?.number ?? null)
    : null;
  const singleStudentProgramId = singleStudentId
    ? selectedStudents[0]?.programId?._id || selectedStudents[0]?.programId
    : null;

  const { data: singleStudentSemData } = useGetSemestersByProgramQuery(
    singleStudentProgramId,
    { skip: !singleStudentProgramId || currentPartNumber !== 2 },
  );
  const previousPartSemesterId = useMemo(() => {
    if (currentPartNumber !== 2) return null;
    const prevSem = (singleStudentSemData?.data || []).find(
      (s) => s.number === currentPartNumber - 1,
    );
    return prevSem?._id || null;
  }, [singleStudentSemData, currentPartNumber]);

  const { data: previousPrefRes } = useGetStudentPreferenceQuery(
    { studentId: singleStudentId, semesterId: previousPartSemesterId },
    {
      skip: !singleStudentId || !previousPartSemesterId,
      refetchOnMountOrArgChange: true,
    },
  );
  const previousPartPreference = previousPrefRes?.data || null;

  // Reactive rather than a one-off read in proceedToSetup, so it stays
  // correct even if the fetch resolves after the setup page is already open.
  useEffect(() => {
    if (!singleStudentId) return;
    if (existingPreference && existingPreference.defaultInstallments) {
      const n = existingPreference.defaultInstallments;
      setInstallmentCount(n);
      if (
        Array.isArray(existingPreference.customPercentages) &&
        existingPreference.customPercentages.length === n
      ) {
        setCustomPercentages(existingPreference.customPercentages.map(Number));
      } else {
        const base = Math.floor(100 / n);
        const remainder = 100 - base * n;
        const splits = Array(n).fill(base);
        if (splits.length > 0) splits[splits.length - 1] += remainder;
        setCustomPercentages(splits);
      }
      const mode = existingPreference.installmentMode === "amount" ? "amount" : "percentage";
      setInstallmentModeState(mode);
      setCustomAmounts(
        Array.isArray(existingPreference.customAmounts) &&
          existingPreference.customAmounts.length === n
          ? existingPreference.customAmounts.map(Number)
          : Array(n).fill(0),
      );
      setCustomMonths(existingPreference.customMonths || Array(n).fill(""));
    } else if (!loadingPreference) {
      setInstallmentCount(2);
      setCustomPercentages([50, 50]);
      setInstallmentModeState("percentage");
      setCustomAmounts([0, 0]);
      setCustomMonths(["", ""]);
    }
  }, [existingPreference, loadingPreference, singleStudentId]);

  // --- 6. SETUP LOGIC ---
  const proceedToSetup = () => {
    if (selectedStudents.length === 0)
      return alert("Select at least one student.");
    setShowSetupPage(true);
  };

  const handleCountChange = (newCount, totalFee = 0) => {
    setInstallmentCount(newCount);
    const base = Math.floor(100 / newCount);
    const remainder = 100 - base * newCount;
    const splits = Array(newCount).fill(base);
    if (splits.length > 0) splits[splits.length - 1] += remainder;
    setCustomPercentages(splits);

    const total = Number(totalFee) || 0;
    if (total > 0) {
      const amtSplits = splits.map((p) => Math.round((p / 100) * total));
      setCustomAmounts(amtSplits);
    } else {
      setCustomAmounts(Array(newCount).fill(0));
    }

    setCustomMonths((prev) => {
      const next = Array(newCount).fill("");
      for (let i = 0; i < Math.min(prev.length, newCount); i++)
        next[i] = prev[i];
      return next;
    });
  };

  const handleMonthUpdate = (index, val) => {
    const next = [...customMonths];
    next[index] = val;
    setCustomMonths(next);
  };

  const handlePercentageUpdate = (index, val) => {
    const newSplits = [...customPercentages];
    newSplits[index] = Number(val);
    setCustomPercentages(newSplits);
  };

  // Amount mode's primary input — the Rupee figure is authoritative here;
  // the percentage is only kept in sync for display/history purposes.
  const handleAmountUpdate = (index, val, totalFee = 0) => {
    const newAmt = Number(val) || 0;
    const newAmounts = [...customAmounts];
    newAmounts[index] = newAmt;
    setCustomAmounts(newAmounts);

    const total = Number(totalFee) || 0;
    if (total > 0) {
      const newPct = Number(((newAmt / total) * 100).toFixed(6));
      const newSplits = [...customPercentages];
      newSplits[index] = newPct;
      setCustomPercentages(newSplits);
    }
  };

  // Switching modes carries the current split over instead of discarding
  // it — a plan built as percentages first, then switched to fixed amounts
  // to round the figures off, keeps its intent instead of resetting to 0.
  const setInstallmentMode = (mode, totalFee = 0) => {
    const total = Number(totalFee) || 0;
    if (mode === "amount" && total > 0) {
      setCustomAmounts(customPercentages.map((p) => Math.round((p / 100) * total)));
    } else if (mode === "percentage" && total > 0) {
      setCustomPercentages(
        customAmounts.map((a) => Number(((a / total) * 100).toFixed(6))),
      );
    }
    setInstallmentModeState(mode === "amount" ? "amount" : "percentage");
  };

  const applyPreset = (presetType, extraParams = {}) => {
    let splits = [];
    const n = parseInt(installmentCount) || 1;

    if (n <= 1) {
      splits = [100];
    } else if (presetType === "equal") {
      const base = 100 / n;
      splits = Array(n).fill(Number(base.toFixed(6)));
      const sumExceptLast = splits.slice(0, n - 1).reduce((a, b) => a + b, 0);
      splits[n - 1] = Number((100 - sumExceptLast).toFixed(6));
    } else if (presetType === "front") {
      splits = Array(n).fill(0);
      splits[0] = 50;
      const base = 50 / (n - 1);
      for (let i = 1; i < n; i++) splits[i] = Number(base.toFixed(6));
      const sumExceptLast = splits.slice(0, n - 1).reduce((a, b) => a + b, 0);
      splits[n - 1] = Number((100 - sumExceptLast).toFixed(6));
    } else if (presetType === "back") {
      splits = Array(n).fill(0);
      splits[n - 1] = 50;
      const base = 50 / (n - 1);
      for (let i = 0; i < n - 1; i++) splits[i] = Number(base.toFixed(6));
      splits[n - 2] = Number(
        (100 - 50 - splits.slice(0, n - 2).reduce((a, b) => a + b, 0)).toFixed(
          6,
        ),
      );
    } else if (presetType === "advance") {
      const { totalFee, advanceAmount, advanceInstCount } = extraParams;
      const total = Number(totalFee);
      const advance = Number(advanceAmount);
      const advCount = Number(advanceInstCount);

      if (!total || total <= 0) return alert("Please enter Total Fee Amount.");
      if (advCount >= n) return alert("Advance cannot cover ALL installments.");
      if (advance >= total) return alert("Advance must be less than total.");
      if (advance <= 0) return alert("Please enter valid paid amount.");

      const remCount = n - advCount;
      const remAmount = total - advance;

      const advPct = (advance / total) * 100;
      const remPct = (remAmount / total) * 100;

      const baseAdvPct = advPct / advCount;
      const baseRemPct = remPct / remCount;

      splits = Array(n).fill(0);
      for (let i = 0; i < advCount; i++)
        splits[i] = Number(baseAdvPct.toFixed(6));
      for (let i = advCount; i < n; i++)
        splits[i] = Number(baseRemPct.toFixed(6));

      if (advCount > 1) {
        const sumAdvExceptLast = splits
          .slice(0, advCount - 1)
          .reduce((a, b) => a + b, 0);
        splits[advCount - 1] = Number((advPct - sumAdvExceptLast).toFixed(6));
      }

      if (remCount > 1) {
        const sumRemExceptLast = splits
          .slice(advCount, n - 1)
          .reduce((a, b) => a + b, 0);
        splits[n - 1] = Number((remPct - sumRemExceptLast).toFixed(6));
      }
    }

    setCustomPercentages(splits);
    const total = Number(extraParams.totalFee) || 0;
    if (total > 0) {
      setCustomAmounts(splits.map((p) => Math.round((p / 100) * total)));
    }
  };

  // Lock one installment's percentage and spread the remainder evenly
  // across the others — lets staff pin down one known amount (e.g. "the
  // advance was exactly 20%") without hand-balancing the rest to sum to
  // 100 themselves.
  const autoCorrectRest = (lockedIndex, totalFee = 0) => {
    const n = parseInt(installmentCount);
    if (n <= 1) return;

    const lockedVal = customPercentages[lockedIndex];
    const remainingPct = 100 - lockedVal;
    const othersCount = n - 1;

    const base = remainingPct / othersCount;
    const newSplits = [...customPercentages];

    for (let i = 0; i < n; i++) {
      if (i !== lockedIndex) newSplits[i] = Number(base.toFixed(6));
    }

    const lastIdx = lockedIndex === n - 1 ? n - 2 : n - 1;
    const sumOthers = newSplits.reduce(
      (acc, val, i) => (i === lastIdx ? acc : acc + val),
      0,
    );
    newSplits[lastIdx] = Number((100 - sumOthers).toFixed(6));

    setCustomPercentages(newSplits);
    const total = Number(totalFee) || 0;
    if (total > 0) {
      setCustomAmounts(newSplits.map((p) => Math.round((p / 100) * total)));
    }
  };

  // Amount-mode counterpart of autoCorrectRest — lock this installment's
  // Rupee figure and spread the remaining total evenly across the others,
  // instead of hand-balancing them to add up itself.
  const autoCorrectAmountRest = (lockedIndex, totalFee = 0) => {
    const n = parseInt(installmentCount);
    if (n <= 1) return;
    const total = Number(totalFee) || 0;
    if (total <= 0) return;

    const lockedVal = Number(customAmounts[lockedIndex]) || 0;
    const remaining = total - lockedVal;
    const othersCount = n - 1;
    const base = Math.round(remaining / othersCount);

    const newAmounts = [...customAmounts];
    for (let i = 0; i < n; i++) {
      if (i !== lockedIndex) newAmounts[i] = base;
    }
    const lastIdx = lockedIndex === n - 1 ? n - 2 : n - 1;
    const sumOthers = newAmounts.reduce(
      (acc, val, i) => (i === lastIdx ? acc : acc + val),
      0,
    );
    newAmounts[lastIdx] = total - sumOthers;

    setCustomAmounts(newAmounts);
    setCustomPercentages(
      newAmounts.map((a) => Number(((a / total) * 100).toFixed(6))),
    );
  };

  const [savePreference, { isLoading: isSaving }] =
    useSaveStudentPreferenceMutation();

  const handleSaveConfiguration = async (totalFee = 0) => {
    if (selectedStudents.length === 0)
      return alert("Select at least one student.");

    if (!activeSemesterId)
      return alert(
        "The selected student(s) have no Part/Semester on record — installment configurations must be bound to a specific semester.",
      );

    if (customMonths.some((month) => !month || month.trim() === ""))
      return alert("Please assign a billing month to every installment.");

    const strictPercentages = customPercentages.map(Number);

    if (installmentMode === "amount") {
      const total = Number(totalFee) || 0;
      if (total <= 0) {
        return alert("Enter the total fee amount before saving a fixed-amount plan.");
      }
      const strictAmounts = customAmounts.map(Number);
      const totalAmt = strictAmounts.reduce((a, b) => a + b, 0);
      if (Math.abs(totalAmt - total) > 0.5) {
        return alert(
          `Installment amounts sum to Rs ${totalAmt.toLocaleString()}, which doesn't match the total fee of Rs ${total.toLocaleString()}. Adjust them to add up exactly.`,
        );
      }
    } else {
      const totalPct = strictPercentages.reduce((a, b) => a + b, 0);
      if (totalPct !== 100)
        return alert(
          `Installment percentages must equal exactly 100%. Currently: ${totalPct}%`,
        );
    }

    try {
      await savePreference({
        studentIds: selectedStudents.map((s) => s._id),
        semesterId: activeSemesterId,
        numberOfInstallments: parseInt(installmentCount),
        installmentMode,
        customPercentages: strictPercentages,
        customAmounts: installmentMode === "amount" ? customAmounts.map(Number) : [],
        customMonths,
      }).unwrap();

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setSelectedStudents([]);
        setInstallmentCount(2);
        setCustomPercentages([50, 50]);
        setInstallmentModeState("percentage");
        setCustomAmounts([0, 0]);
        setCustomMonths(["", ""]);
        setShowSetupPage(false);
        refetch();
      }, 1800);
    } catch (err) {
      console.error("Save failed", err);
      alert(err?.data?.message || "Failed to save configuration.");
    }
  };

  return {
    showSetupPage,
    setShowSetupPage,
    proceedToSetup,
    terms,
    programs,
    partOptions: PART_OPTIONS,
    selectedTerm,
    setSelectedTerm,
    selectedProg,
    handleProgChange,
    selectedPart,
    setSelectedPart,
    search,
    setSearch,
    studentsList,
    loadMoreStudents,
    hasMore,
    isStudentsLoading: isStudentsLoading || isStudentsFetching,
    selectedStudents,
    toggleStudentSelection,
    toggleSelectAll,
    removeStudent,
    installmentCount,
    handleCountChange,
    installmentMode,
    setInstallmentMode,
    customPercentages,
    handlePercentageUpdate,
    customAmounts,
    handleAmountUpdate,
    applyPreset,
    autoCorrectRest,
    autoCorrectAmountRest,
    customMonths,
    handleMonthUpdate,
    activeSemesterId,
    loadingPreference,
    currentPartNumber,
    previousPartPreference,
    fetchedTotalFee,
    loadingFees,
    hasTuitionFeeSetup,
    isSaving,
    saveSuccess,
    handleSaveConfiguration,
  };
};
