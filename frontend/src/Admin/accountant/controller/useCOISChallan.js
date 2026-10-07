import { useState, useCallback, useEffect } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetDepartmentsQuery,
  useGetTermsQuery,
  useGetProgramsByDepartmentQuery,
} from "../api/depsemtermpro";
import { useGetStudentsQuery } from "../api/accountantstudentApi";
import {
  useGenerateSingleChallanMutation,
  useGenerateBulkChallansMutation,
  useGetChallansByStudentIdQuery,
  useLazyGetChallansByStudentIdQuery,
  useDeleteChallanMutation,
  useMarkChallanAsPaidMutation,
  useUpdateChallanDueDateMutation,
  useCreateManualInstallmentsMutation,
  useApplyDiscountMutation,
  useRemoveDiscountMutation,
} from "../api/studentChallanApi";
import { buildChallanPage, openPrintWindow } from "../common/ChallanPrintTemplate";
import { useGetMiscellaneousFeesQuery } from "../api/feeStructureApi";
import {
  useGetStudentPreferenceQuery,
  useGetBatchInstallmentStatusQuery,
} from "../api/installmentApi";

const LIMIT = 40;

export const useCOISChallan = () => {
  const { openAlert } = useGlobalAlert();

  // --- UI STATES ---
  const [generationMode, setGenerationMode] = useState("single");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedBulkStudents, setSelectedBulkStudents] = useState([]);
  // Which installment to generate for the selected student — null means
  // "use the auto-derived next one" (nextAutoInstallment below); set once
  // the admin explicitly picks a different installment from the dropdown.
  const [selectedInstallmentNumber, setSelectedInstallmentNumber] = useState(null);

  // --- SEARCH & FILTER STATES ---
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedProg, setSelectedProg] = useState("");
  // "1" or "2" — HSSC programs always have exactly two Parts, so this is a
  // plain number filter, independent of Program, instead of a specific
  // Semester document ID that requires picking a Program first to resolve.
  const [selectedPart, setSelectedPart] = useState("");

  const [page, setPage] = useState(1);
  const [studentsList, setStudentsList] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  // --- DEBOUNCE & RESET ---
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setStudentsList([]);
    setHasMore(true);
  }, [
    debouncedSearch,
    selectedTerm,
    selectedDept,
    selectedProg,
    selectedPart,
    generationMode,
  ]);

  // --- FETCH CATALOG DATA & AUTO-LOCK COLLEGE DEPT ---
  const { data: termsData } = useGetTermsQuery();
  const { data: deptData } = useGetDepartmentsQuery();
  const { data: miscFeesRes } = useGetMiscellaneousFeesQuery();

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
  const miscFeesList = miscFeesRes?.data || [];

  // --- FETCH STUDENTS DIRECTORY ---
  const {
    data: studentsRes,
    isLoading: isStudentsLoading,
    isFetching: isStudentsFetching,
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

  const handleProgChange = (val) => setSelectedProg(val);

  // --- FETCH SPECIFIC STUDENT CHALLANS ---
  const {
    data: challansRes,
    isLoading: isChallanLoading,
    refetch: refetchChallans,
  } = useGetChallansByStudentIdQuery(
    selectedStudent ? { id: selectedStudent._id, excludeType: "hostel" } : null,
    { skip: !selectedStudent, refetchOnMountOrArgChange: true },
  );

  const studentChallans =
    challansRes?.data?.challans || challansRes?.data || [];

  // --- INSTALLMENT PLAN AWARENESS (single mode) ---
  // The selected student's OWN current semester (never a leftover filter),
  // and their real installment preference for it — used to derive the
  // Billing Month automatically instead of letting the UI request an
  // arbitrary month that doesn't match the configured plan (that mismatch
  // is exactly what used to throw "Installment #N is scheduled for X, not
  // Y" on the university side before it was fixed there).
  const currentSemesterId =
    String(
      selectedStudent?.semesterId?._id || selectedStudent?.semesterId || "",
    ) || null;
  const { data: currentPrefRes, isFetching: loadingCurrentPref } =
    useGetStudentPreferenceQuery(
      { studentId: selectedStudent?._id, semesterId: currentSemesterId },
      {
        skip: !selectedStudent || !currentSemesterId,
        // Always hit the network on mount/args-change — reopening a
        // student for challan generation right after saving their
        // installment plan must reflect that plan, not a stale snapshot.
        refetchOnMountOrArgChange: true,
      },
    );
  const currentInstallmentPref = currentPrefRes?.data || null;
  const totalInst = currentInstallmentPref?.defaultInstallments || 0;
  const isInstStudent = totalInst > 1;

  const configuredMonths = (currentInstallmentPref?.customMonths || []).filter(
    Boolean,
  );
  // For a non-installment (whole-fee) student, their own saved Billing
  // Month — lets the generation screen pre-fill the freely-editable month
  // picker with this student's actual month instead of coming up blank
  // and showing every month as an undifferentiated option.
  const savedSingleBillingMonth = !isInstStudent
    ? configuredMonths[0] || null
    : null;
  // Scoped to the student's CURRENT semester only — `studentChallans` holds
  // every challan the student has ever had, across every past semester too.
  // Without this filter, a Part 1 student who already generated all 4
  // installments would have that count carried into Part 2, making the
  // "next installment" look like #5 of a 4-part plan and blocking
  // generation entirely (the same cross-semester mixup already fixed on
  // the backend's own installment-count check).
  const existingInstallmentChallans = (studentChallans || []).filter(
    (c) =>
      c.isInstallment &&
      c.status !== "cancelled" &&
      String(c.semesterId?._id || c.semesterId || "") === currentSemesterId,
  );
  const maxGeneratedInstallment = existingInstallmentChallans.reduce(
    (max, c) => Math.max(max, c.installmentNumber || 0),
    0,
  );
  const nextAutoInstallment = maxGeneratedInstallment + 1;
  const derivedBillingMonth = configuredMonths[nextAutoInstallment - 1] || null;
  const isNextInstallmentPaid = existingInstallmentChallans.some(
    (c) => c.installmentNumber === nextAutoInstallment && c.status === "paid",
  );

  // A new student selection invalidates any previously-picked installment
  // number — it belonged to whoever was selected before.
  useEffect(() => {
    setSelectedInstallmentNumber(null);
  }, [selectedStudent?._id]);

  // Every installment slot in this student's plan (1..totalInst), each
  // labeled with its configured month and whether it's already been
  // generated/paid — powers the "select the installment" dropdown so the
  // admin can generate any not-yet-generated installment, not only
  // whichever one comes next sequentially.
  const installmentOptions = isInstStudent
    ? Array.from({ length: totalInst }, (_, i) => {
        const number = i + 1;
        const existing = existingInstallmentChallans.find(
          (c) => c.installmentNumber === number,
        );
        return {
          number,
          month: configuredMonths[i] || null,
          isGenerated: Boolean(existing),
          isPaid: existing?.status === "paid",
        };
      })
    : [];

  // The installment actually about to be generated — the admin's explicit
  // pick if they made one, otherwise the auto-derived next one.
  const effectiveInstallmentNumber = selectedInstallmentNumber || nextAutoInstallment;
  const effectiveBillingMonth =
    configuredMonths[effectiveInstallmentNumber - 1] || derivedBillingMonth;
  const effectiveInstallmentOption = installmentOptions.find(
    (o) => o.number === effectiveInstallmentNumber,
  );

  // --- INSTALLMENT PLAN AWARENESS (bulk mode) ---
  // Checks each selected student's OWN current semester's plan — no shared
  // semesterId needed, so this works regardless of whether a Part filter
  // is set.
  const { data: batchInstallmentRes } = useGetBatchInstallmentStatusQuery(
    { studentIds: selectedBulkStudents.map((s) => s._id) },
    { skip: selectedBulkStudents.length === 0 },
  );
  const anyBulkSelectedHasInstallmentPlan = Object.values(
    batchInstallmentRes?.data || {},
  ).some(Boolean);

  // --- MUTATIONS ---
  const [generateSingle, { isLoading: isGeneratingSingle }] =
    useGenerateSingleChallanMutation();
  const [generateBulk, { isLoading: isGeneratingBulk }] =
    useGenerateBulkChallansMutation();
  const [deleteChallan, { isLoading: isDeleting }] = useDeleteChallanMutation();
  const [markPaid, { isLoading: isPaying }] = useMarkChallanAsPaidMutation();
  const [updateDate, { isLoading: isUpdatingDate }] =
    useUpdateChallanDueDateMutation();
  const [createInst, { isLoading: isConv }] =
    useCreateManualInstallmentsMutation();
  const [applyDisc, { isLoading: isDiscLoading }] = useApplyDiscountMutation();
  const [removeDisc, { isLoading: isRemovingDisc }] =
    useRemoveDiscountMutation();

  // --- PRINT (Print Challans tab) ---
  const [triggerGetChallansByStudent] = useLazyGetChallansByStudentIdQuery();
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);

  // Fetches every selected student's already-generated challans and prints
  // them all as ONE combined print job (same buildChallanPage/openPrintWindow
  // used everywhere else in this app, so the design is identical to a
  // single print) — mirrors the established bulk-print pattern already
  // used on the University Challan Generation and Hostel screens.
  // `extraFilter`, when given, is an additional predicate (e.g. the Print
  // Challans tab's own Type/Status filters) applied on top of the base
  // "real, active challan" check below — so a bulk print job respects the
  // exact same filters the admin set up before printing, not every
  // challan the selected students have ever had.
  const handleBulkPrintChallans = async (extraFilter) => {
    if (selectedBulkStudents.length === 0) {
      openAlert({ message: "Select at least one student.", severity: "error" });
      return;
    }
    // Opened synchronously, before the async fetch below, so browsers
    // don't treat it as an unsolicited popup once the data actually
    // arrives — the same trick used by the other bulk-print screens.
    const printWin = window.open("", "_blank");
    setIsBulkPrinting(true);
    try {
      const results = await Promise.all(
        selectedBulkStudents.map((s) =>
          triggerGetChallansByStudent({
            id: s._id,
            excludeType: "hostel",
          }).unwrap(),
        ),
      );
      const allChallans = results
        .flatMap((r) => r?.data?.challans || [])
        .filter(
          (c) =>
            !c.isDeleted && c.status !== "cancelled" && c.status !== "merged",
        )
        .filter((c) => (typeof extraFilter === "function" ? extraFilter(c) : true));
      if (allChallans.length === 0) {
        printWin?.close();
        openAlert({
          message: "No generated challans found for the selected students.",
          severity: "warning",
        });
        return;
      }
      openPrintWindow(
        allChallans.map(buildChallanPage).join(""),
        `Fee Challans - Bulk Print (${selectedBulkStudents.length} students)`,
        printWin,
      );
    } catch (error) {
      printWin?.close();
      openAlert({
        message: error?.data?.message || "Failed to load challans for printing.",
        severity: "error",
      });
    } finally {
      setIsBulkPrinting(false);
    }
  };

  const handleGenerateSingle = async (payload) => {
    // A "Misc Fees Only" request (View sends an explicitly empty
    // `feeTypes` array) bills nothing but the picked Misc Fee(s) — it has
    // nothing to do with this student's installment plan, so none of the
    // installment guards/derivation below apply to it.
    const isMiscOnly =
      Array.isArray(payload.feeTypes) && payload.feeTypes.length === 0;

    // A single selected student's own Session is always used — never the
    // (possibly stale) filter dropdown, which could point at a different
    // Session than the one this student actually belongs to.
    const activeTerm =
      selectedStudent?.termId?._id || selectedStudent?.termId || selectedTerm;
    if (!activeTerm)
      return openAlert({
        message: "Academic Session required.",
        severity: "error",
      });
    // Billing Month is derived from the plan (per the chosen installment),
    // not freely chosen — this is what prevents requesting a month that
    // doesn't match the configured installment (the exact bug already
    // fixed on the university side).
    if (!isMiscOnly && isInstStudent && effectiveInstallmentOption?.isGenerated)
      return openAlert({
        message: effectiveInstallmentOption.isPaid
          ? `Installment #${effectiveInstallmentNumber} (${effectiveBillingMonth || "unscheduled"}) is already paid.`
          : `Installment #${effectiveInstallmentNumber} (${effectiveBillingMonth || "unscheduled"}) has already been generated.`,
        severity: "error",
      });
    try {
      await generateSingle({
        studentId: selectedStudent._id,
        termId: activeTerm,
        billingMonth: !isMiscOnly && isInstStudent ? effectiveBillingMonth : null,
        // Explicit pick from the installment dropdown — lets the admin
        // generate any not-yet-generated installment, not only whichever
        // one the backend would auto-derive as "next".
        targetInstallmentNumber:
          !isMiscOnly && isInstStudent ? effectiveInstallmentNumber : null,
        // This shared endpoint defaults to university-only students unless
        // told otherwise — without this, every College/HSSC student's
        // challan generation silently fails with "No valid university
        // students found for this selection".
        scope: "college",
        ...payload,
      }).unwrap();
      openAlert({
        message: "Challan generated successfully!",
        severity: "success",
      });
      refetchChallans();
      return true;
    } catch (error) {
      openAlert({
        message: error?.data?.message || "Failed to generate challan.",
        severity: "error",
      });
      return false;
    }
  };

  const handleGenerateBulk = async (payload) => {
    // A "Misc Fees Only" bulk request bills nothing but the picked Misc
    // Fee(s) for every selected student — irrelevant to anyone's
    // installment plan, so the Billing Month requirement below doesn't
    // apply to it.
    const isMiscOnly =
      Array.isArray(payload.feeTypes) && payload.feeTypes.length === 0;

    if (!selectedTerm)
      return openAlert({
        message: "Please select an Academic Session.",
        severity: "error",
      });
    if (selectedBulkStudents.length === 0)
      return openAlert({
        message: "Please select students first.",
        severity: "error",
      });
    // At least one selected student is on an installment plan for this
    // semester — a Billing Month must be explicitly chosen since it can't
    // be safely auto-derived for a mixed batch of students.
    if (!isMiscOnly && anyBulkSelectedHasInstallmentPlan && !payload.billingMonth)
      return openAlert({
        message:
          "Billing Month required — at least one selected student is on an installment plan.",
        severity: "error",
      });
    try {
      await generateBulk({
        studentIds: selectedBulkStudents.map((s) => s._id),
        termId: selectedTerm,
        departmentId: selectedDept,
        programId: selectedProg,
        // Each challan's semester is derived per-student on the backend
        // from that student's own current semester — not from a single
        // shared filter value, which wouldn't be correct for a batch
        // spanning both Parts anyway.
        scope: "college",
        ...payload,
      }).unwrap();
      openAlert({
        message: `Successfully queued bulk generation for ${selectedBulkStudents.length} students.`,
        severity: "success",
      });
      setSelectedBulkStudents([]);
    } catch (error) {
      openAlert({
        message: error?.data?.message || "Bulk generation failed.",
        severity: "error",
      });
    }
  };

  // --- EXPOSE ACTIONS FOR DETAILS TABLE ---
  const tableActions = {
    deleteChallan: async (id) => {
      try {
        await deleteChallan({ id }).unwrap();
        openAlert({ message: "Challan Voided", severity: "success" });
        refetchChallans();
      } catch (e) {
        openAlert({ message: e.data?.message || "Failed", severity: "error" });
      }
    },
    markPaid: async (id, formData) => {
      try {
        await markPaid({ id, formData }).unwrap();
        openAlert({ message: "Payment Verified", severity: "success" });
        refetchChallans();
        return true;
      } catch (e) {
        openAlert({ message: e.data?.message || "Failed", severity: "error" });
        return false;
      }
    },
    updateDueDate: async (id, dueDate) => {
      try {
        await updateDate({ id, dueDate }).unwrap();
        openAlert({ message: "Date Updated", severity: "success" });
        refetchChallans();
        return true;
      } catch (e) {
        openAlert({ message: e.data?.message || "Failed", severity: "error" });
        return false;
      }
    },
    createInstallments: async (id, installmentsData) => {
      try {
        await createInst({ id, installments: installmentsData }).unwrap();
        openAlert({ message: "Installments Created", severity: "success" });
        refetchChallans();
        return true;
      } catch (e) {
        openAlert({ message: e.data?.message || "Failed", severity: "error" });
        return false;
      }
    },
    applyDiscount: async (id, formData) => {
      try {
        await applyDisc({ id, data: formData }).unwrap();
        openAlert({ message: "Discount Applied", severity: "success" });
        refetchChallans();
        return true;
      } catch (e) {
        openAlert({ message: e.data?.message || "Failed", severity: "error" });
        return false;
      }
    },
    removeDiscount: async (id) => {
      try {
        await removeDisc(id).unwrap();
        openAlert({ message: "Discount Removed", severity: "success" });
        refetchChallans();
        return true;
      } catch (e) {
        openAlert({ message: e.data?.message || "Failed", severity: "error" });
        return false;
      }
    },
  };

  const isProcessing =
    isGeneratingSingle ||
    isGeneratingBulk ||
    isDeleting ||
    isPaying ||
    isUpdatingDate ||
    isConv ||
    isDiscLoading ||
    isRemovingDisc;

  return {
    generationMode,
    setGenerationMode,
    selectedStudent,
    setSelectedStudent,
    selectedBulkStudents,
    setSelectedBulkStudents,
    terms,
    programs,
    miscFeesList,
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
    handleGenerateSingle,
    handleGenerateBulk,
    studentChallans,
    isChallanLoading,
    tableActions,
    isProcessing,
    isInstStudent,
    totalInst,
    derivedBillingMonth,
    nextAutoInstallment,
    isNextInstallmentPaid,
    installmentOptions,
    selectedInstallmentNumber,
    setSelectedInstallmentNumber,
    effectiveInstallmentNumber,
    effectiveBillingMonth,
    effectiveInstallmentOption,
    loadingCurrentPref,
    savedSingleBillingMonth,
    anyBulkSelectedHasInstallmentPlan,
    handleBulkPrintChallans,
    isBulkPrinting,
  };
};
