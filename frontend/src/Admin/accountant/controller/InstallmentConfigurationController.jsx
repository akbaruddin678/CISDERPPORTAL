import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetCompleteCatalogQuery } from "../api/depsemtermpro";
import {
  useGetStudentsQuery,
  useGetStudentDetailsQuery,
} from "../api/accountantstudentApi";
import {
  useSaveStudentPreferenceMutation,
  useGetStudentPreferenceQuery,
  useAssignPreferenceSemesterMutation,
  useGetStudentPreferenceHistoryQuery,
} from "../api/installmentApi";
import { useGetStudentFeesQuery } from "../api/feeStructureApi";

const LIMIT = 40;

const InstallmentConfigurationController = ({ children }) => {
  const [showSetupPage, setShowSetupPage] = useState(false);
  const [filters, setFilters] = useState({
    termId: "",
    departmentId: "",
    programId: "",
    semesterId: "",
    search: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Deep-link support — landing here as `?studentId=...` (e.g. from the
  // Revenue Explorer's "open in Installment Configuration" link) auto-
  // selects that student and jumps straight to their setup screen instead
  // of leaving this on the blank student-search list. A minimal `{_id}`
  // stub is enough: useGetStudentDetailsQuery below fetches and merges in
  // the rest.
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const deepLinkId = searchParams.get("studentId");
    if (deepLinkId && selectedStudents.length === 0) {
      setSelectedStudents([{ _id: deepLinkId }]);
      setShowSetupPage(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [installmentCount, setInstallmentCount] = useState(1);
  const [customPercentages, setCustomPercentages] = useState([100]);

  // Track the assigned month for each installment
  const [customMonths, setCustomMonths] = useState([""]);

  const [saveSuccess, setSaveSuccess] = useState(false);

  const [page, setPage] = useState(1);
  const [studentsList, setStudentsList] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => clearTimeout(handler);
  }, [filters.search]);

  useEffect(() => {
    setPage(1);
    setStudentsList([]);
    setHasMore(true);
  }, [
    debouncedSearch,
    filters.termId,
    filters.departmentId,
    filters.programId,
    filters.semesterId,
  ]);

  // This is a university-only tool — excludeLevel:"HSSC" scopes the whole
  // catalog to non-college departments/programs/terms/semesters, same as
  // the Student Report and Student Fee Management pages. Replaces the old
  // hand-rolled client-side HSSC filtering (fetch-everything-then-filter),
  // which also mis-scoped the department→program cascade.
  const { data: catalogRes } = useGetCompleteCatalogQuery({
    excludeLevel: "HSSC",
  });
  const catalog = catalogRes?.data || {
    departments: [],
    programs: [],
    terms: [],
    semesters: [],
  };

  const universityDepartments = catalog.departments;
  const displayPrograms = useMemo(() => {
    if (!filters.departmentId) return [];
    return catalog.programs.filter((p) => {
      const id = p.departmentId?._id || p.departmentId;
      return String(id) === String(filters.departmentId);
    });
  }, [catalog.programs, filters.departmentId]);
  const displaySemesters = useMemo(() => {
    if (!filters.programId) return [];
    return catalog.semesters
      .filter(
        (s) =>
          String(s.programId?._id || s.programId) ===
          String(filters.programId),
      )
      .sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [catalog.semesters, filters.programId]);

  // =======================================================================

  const {
    data: studentsRes,
    isLoading: isStudentsLoading,
    isFetching: isStudentsFetching,
    refetch,
  } = useGetStudentsQuery({
    termId: filters.termId,
    departmentId: filters.departmentId,
    programId: filters.programId,
    semesterId: filters.semesterId,
    search: debouncedSearch,
    excludeLevel: "HSSC",
    page,
    limit: LIMIT,
  });

  useEffect(() => {
    if (!studentsRes) return;
    let fetched = [];
    if (Array.isArray(studentsRes?.data?.data)) fetched = studentsRes.data.data;
    else if (Array.isArray(studentsRes?.data?.students))
      fetched = studentsRes.data.students;
    else if (Array.isArray(studentsRes?.data)) fetched = studentsRes.data;
    else if (Array.isArray(studentsRes?.students))
      fetched = studentsRes.students;

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

  const [savePreference, { isLoading: isSaving }] =
    useSaveStudentPreferenceMutation();
  const [assignPreferenceSemester, { isLoading: isAssigningSemester }] =
    useAssignPreferenceSemesterMutation();

  const singleStudentId =
    selectedStudents.length === 1 ? selectedStudents[0]._id : null;

  // The list row is fine for display, but not for deciding "is this the
  // student's CURRENT semester" — if they were promoted elsewhere since the
  // list was fetched (a different RTK Query slice this page never
  // invalidates), that cached row can still show their OLD semester. Pull a
  // fresh, authoritative read instead.
  const { data: freshStudentRes } = useGetStudentDetailsQuery(
    singleStudentId,
    { skip: !singleStudentId, refetchOnMountOrArgChange: true },
  );
  const singleStudent = useMemo(() => {
    if (selectedStudents.length !== 1) return null;
    return freshStudentRes?.data
      ? { ...selectedStudents[0], ...freshStudentRes.data }
      : selectedStudents[0];
  }, [selectedStudents, freshStudentRes]);

  // The semester this configuration applies to. In single-student mode this
  // is ALWAYS the student's own real current semester — it must never
  // follow a leftover Semester filter from browsing the list, or the
  // configurator would silently lock itself (and disable Save) any time
  // that filter didn't happen to match the selected student, with no
  // obvious reason why. Bulk mode has no single "current" student, so the
  // explicit filter is the only sensible scope there.
  const activeSemesterId = singleStudent
    ? String(singleStudent.semesterId?._id || singleStudent.semesterId || "") ||
      null
    : filters.semesterId || null;

  const { data: existingPrefRes, isFetching: loadingPreference } =
    useGetStudentPreferenceQuery(
      { studentId: singleStudentId, semesterId: activeSemesterId },
      { skip: !singleStudentId || !activeSemesterId },
    );
  const existingPreference = existingPrefRes?.data || null;

  // Every OTHER semester's preference for this student — shown read-only
  // alongside the (always-editable) current one, so staff can actually see
  // what a past semester's plan was instead of it just being inaccessible.
  const { data: prefHistoryRes, isFetching: loadingPreferenceHistory } =
    useGetStudentPreferenceHistoryQuery(singleStudentId, {
      skip: !singleStudentId,
    });
  const pastPreferences = useMemo(() => {
    const all = prefHistoryRes?.data || [];
    return all.filter((p) => {
      // The record already resolved as the CURRENT semester's own
      // preference (existingPreference — which itself may be a legacy
      // record with no semesterId, matched by id via the backend's own
      // fallback) must never also show up as a "previous semester" —
      // matching by semesterId alone mis-files an untagged current-
      // semester plan into history, since its semesterId can't match
      // activeSemesterId to begin with.
      if (existingPreference && String(p._id) === String(existingPreference._id)) {
        return false;
      }
      return (
        String(p.semesterId?._id || p.semesterId || "") !==
        String(activeSemesterId)
      );
    });
  }, [prefHistoryRes, activeSemesterId, existingPreference]);

  const activeSemesterNumber = useMemo(
    () =>
      catalog.semesters.find((s) => String(s._id) === String(activeSemesterId))
        ?.number ?? singleStudent?.semesterId?.number ?? null,
    [catalog.semesters, activeSemesterId, singleStudent],
  );

  const { data: studentFeesRes, isFetching: loadingFees } =
    useGetStudentFeesQuery(singleStudentId, {
      skip: !singleStudentId,
    });

  // Installments are only ever built against Tuition — an Admission/Exam
  // fee isn't something a student pays off over the semester the same way,
  // so summing every category into "total fee" was wrong. Scoped to the
  // student's current semester (Tuition is semester-scoped), matching
  // exactly which fee record the configurator is meant to be splitting up.
  const tuitionFeeRecord = useMemo(() => {
    if (!studentFeesRes?.data) return null;
    const academicFees = studentFeesRes.data.filter(
      (f) => f.category === "ACADEMIC",
    );
    if (!activeSemesterId) return academicFees[0] || null;

    const tagged = academicFees.find((f) => {
      const fSemId = String(f.semesterId?._id || f.semesterId || "");
      return fSemId === String(activeSemesterId);
    });
    if (tagged) return tagged;

    // Legacy fallback: no fee tagged to this specific semester — if
    // there's exactly ONE untagged ACADEMIC record (predating semesterId
    // tagging on StudentFeeStructure), treat it as this semester's own
    // instead of reporting "Fee not set up" for a student who clearly
    // already has one (same rule used in useStudentFeeController.js and
    // the challan-generation fallbacks). More than one untagged record is
    // ambiguous, so that case is intentionally left as "not set up".
    const untagged = academicFees.filter((f) => !f.semesterId);
    return untagged.length === 1 ? untagged[0] : null;
  }, [studentFeesRes, activeSemesterId]);

  const fetchedTotalFee = tuitionFeeRecord?.totalAmount || 0;
  const hasTuitionFeeSetup = Boolean(tuitionFeeRecord);
  const tuitionFeeRemark = tuitionFeeRecord?.feeSetupRemark || "";

  // Load the correctly-scoped existing preference (for the semester we're
  // actually configuring) into the form — reactive rather than done once in
  // proceedToSetup, so it also stays correct if the fetch resolves after
  // the setup page is already open.
  useEffect(() => {
    if (!singleStudentId) return;
    if (existingPreference && existingPreference.defaultInstallments) {
      const n = existingPreference.defaultInstallments;
      setInstallmentCount(n);
      if (n === 1) {
        setCustomPercentages([100]);
        // Restore the previously saved Billing Month — this was always
        // reset to blank here, so reopening a student who already had a
        // whole-fee plan saved with a month never showed it as selected.
        setCustomMonths(
          Array.isArray(existingPreference.customMonths) &&
            existingPreference.customMonths[0]
            ? [existingPreference.customMonths[0]]
            : [""],
        );
      } else if (
        Array.isArray(existingPreference.customPercentages) &&
        existingPreference.customPercentages.length === n
      ) {
        setCustomPercentages(existingPreference.customPercentages.map(Number));
        setCustomMonths(existingPreference.customMonths || Array(n).fill(""));
      } else {
        const base = 100 / n;
        const splits = Array(n).fill(Number(base.toFixed(6)));
        const sumExceptLast = splits.slice(0, n - 1).reduce((a, b) => a + b, 0);
        splits[n - 1] = Number((100 - sumExceptLast).toFixed(6));
        setCustomPercentages(splits);
        setCustomMonths(Array(n).fill(""));
      }
    } else if (!loadingPreference) {
      setInstallmentCount(1);
      setCustomPercentages([100]);
      setCustomMonths([""]);
    }
  }, [existingPreference, loadingPreference, singleStudentId]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "departmentId") {
        next.programId = "";
        next.semesterId = "";
      }
      if (key === "programId") {
        next.semesterId = "";
      }
      return next;
    });
  };

  const toggleStudentSelection = (student) => {
    setSelectedStudents((prev) => {
      const exists = prev.find((s) => s._id === student._id);
      return exists
        ? prev.filter((s) => s._id !== student._id)
        : [...prev, student];
    });
  };

  const toggleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedStudents((prev) => {
        const ids = new Set(prev.map((s) => s._id));
        const toAdd = studentsList.filter((s) => !ids.has(s._id));
        return [...prev, ...toAdd];
      });
    } else {
      const visibleIds = new Set(studentsList.map((s) => s._id));
      setSelectedStudents((prev) => prev.filter((s) => !visibleIds.has(s._id)));
    }
  };

  const removeStudent = (studentId) => {
    setSelectedStudents((prev) => prev.filter((s) => s._id !== studentId));
  };

  const proceedToSetup = () => {
    if (selectedStudents.length === 0)
      return alert("Select at least one student.");

    // Single-student mode: the existing-preference effect (above) handles
    // pre-filling from the correctly-scoped semester record. Bulk mode has
    // no single existing record to inherit from, so it always starts blank
    // rather than guessing off one arbitrary selected student's own plan.
    if (selectedStudents.length > 1) {
      setInstallmentCount(1);
      setCustomPercentages([100]);
      setCustomMonths([""]);
    }

    setShowSetupPage(true);
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
      const sumExceptLast = splits.slice(0, n - 1).reduce((a, b) => a + b, 0);
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
    setCustomMonths(Array(n).fill(""));
  };

  const handleCountChange = (newCount) => {
    setInstallmentCount(newCount);
    if (newCount <= 1) {
      setCustomPercentages([100]);
      setCustomMonths([""]);
    } else {
      const base = 100 / newCount;
      const splits = Array(newCount).fill(Number(base.toFixed(6)));
      const sumExceptLast = splits
        .slice(0, newCount - 1)
        .reduce((a, b) => a + b, 0);
      splits[newCount - 1] = Number((100 - sumExceptLast).toFixed(6));
      setCustomPercentages(splits);
      setCustomMonths(Array(newCount).fill(""));
    }
  };

  const handlePercentageUpdate = (index, val) => {
    const newVal = Number(val);
    const newSplits = [...customPercentages];
    newSplits[index] = newVal;
    setCustomPercentages(newSplits);
  };

  const handleMonthUpdate = (index, val) => {
    const newMonths = [...customMonths];
    newMonths[index] = val;
    setCustomMonths(newMonths);
  };

  const autoCorrectRest = (lockedIndex) => {
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
  };

  const handleSaveConfiguration = async () => {
    if (selectedStudents.length === 0)
      return alert("Select at least one student.");

    if (!activeSemesterId) {
      return alert(
        "Please select a Semester from the filters. Installment configurations must be bound to a specific semester.",
      );
    }

    if (selectedStudents.length === 1 && !hasTuitionFeeSetup) {
      return alert(
        "This student doesn't have a Tuition fee set up for their current semester yet. Set that up first in Student Fee Management before configuring installments.",
      );
    }

    if (customMonths.some((month) => !month || month.trim() === "")) {
      return alert("Please assign a billing month to every installment.");
    }

    const strictPercentages = customPercentages.map(Number);
    const totalPct = strictPercentages.reduce((a, b) => a + b, 0);
    const diff = 100 - totalPct;

    if (Math.abs(diff) > 0.0000001) {
      return alert(
        `Math error: Percentages sum to ${totalPct}%. Please click Auto-Balance.`,
      );
    }

    try {
      await savePreference({
        studentIds: selectedStudents.map((s) => s._id),
        semesterId: activeSemesterId,
        numberOfInstallments: parseInt(installmentCount),
        customPercentages: strictPercentages,
        customMonths: customMonths,
      }).unwrap();

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setSelectedStudents([]);
        setInstallmentCount(1);
        setCustomPercentages([100]);
        setCustomMonths([""]);
        setShowSetupPage(false);
        refetch();
      }, 1800);
    } catch (err) {
      console.error("Save failed", err);
      alert("Failed to save configuration.");
    }
  };

  // Permanently tags a legacy (untagged) installment preference — currently
  // only being loaded via the read-time fallback in getStudentPreference —
  // with the student's actual current semester, once staff confirm it.
  const handleAssignPreferenceSemester = async () => {
    if (!existingPreference || existingPreference.semesterId || !activeSemesterId)
      return;
    if (
      !window.confirm(
        `Assign this installment plan to Semester ${activeSemesterNumber ?? ""}? This cannot be undone.`,
      )
    )
      return;
    try {
      await assignPreferenceSemester({
        id: existingPreference._id,
        semesterId: activeSemesterId,
      }).unwrap();
    } catch (err) {
      alert(err?.data?.message || "Failed to assign semester.");
    }
  };

  return children({
    showSetupPage,
    setShowSetupPage,
    proceedToSetup,
    filters,
    handleFilterChange,
    terms: catalog.terms,
    departments: universityDepartments,
    programs: displayPrograms,
    semesters: displaySemesters,
    studentsList,
    loadMoreStudents,
    hasMore,
    isStudentsLoading: isStudentsLoading || isStudentsFetching,
    selectedStudents,
    toggleStudentSelection,
    toggleSelectAll,
    removeStudent,
    fetchedTotalFee,
    loadingFees,
    hasTuitionFeeSetup,
    tuitionFeeRemark,
    activeSemesterNumber,
    hasExistingPreference: Boolean(existingPreference),
    isLegacyUntaggedPreference: Boolean(
      existingPreference && !existingPreference.semesterId,
    ),
    handleAssignPreferenceSemester,
    isAssigningSemester,
    loadingPreference,
    pastPreferences,
    loadingPreferenceHistory,
    installmentCount,
    handleCountChange,
    customPercentages,
    handlePercentageUpdate,
    customMonths,
    handleMonthUpdate,
    applyPreset,
    autoCorrectRest,
    isSaving,
    saveSuccess,
    handleSaveConfiguration,
  });
};

export default InstallmentConfigurationController;
