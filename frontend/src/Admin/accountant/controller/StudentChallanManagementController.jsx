import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ToastNotification, ConfirmationModal } from "../common/Feedback";
import { useGetCompleteCatalogQuery } from "../api/depsemtermpro";
import {
  useGetStudentsQuery,
  useGetStudentDetailsQuery,
} from "../api/accountantstudentApi";
import {
  useGetFinanceReportsQuery,
  useGetChallansByStudentIdQuery,
  useGenerateSingleChallanMutation,
  useGenerateBulkChallansMutation,
  useAutoGenerateChallansMutation,
  useMarkChallanAsPaidMutation,
  useDeleteChallanMutation,
  useCreateManualInstallmentsMutation,
  useUpdateChallanDueDateMutation,
  useApplyDiscountMutation,
  useRemoveDiscountMutation,
  useBulkDeleteMutation,
  useRenewChallanMutation,
  useBulkRenewChallansMutation,
  useBulkUpdateDateMutation,
} from "../api/studentChallanApi";

import {
  useGetMiscellaneousFeesQuery,
  useGetStudentFeesQuery,
} from "../api/feeStructureApi";
import { useGetStudentPreferenceQuery } from "../api/installmentApi";
import { MarkPaidModal } from "../view/Challan/ChallanModals";
import RenewConflictDialog from "../view/Challan/RenewConflictDialog";
import RenewDueDateDialog from "../view/Challan/RenewDueDateDialog";

const LIMIT = 30;

const StudentChallanManagementController = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null,
    id: null,
  });
  const [payModalId, setPayModalId] = useState(null);
  // Set when a single/bulk renew hits a challan already occupying the
  // shifted target month — holds { challanId, targetMonth,
  // conflictingChallan } until the accountant picks shiftAll/merge.
  const [renewConflict, setRenewConflict] = useState(null);
  // Set the instant Renew is clicked — holds { challanId, oldDueDate }
  // until the accountant confirms the new due date.
  const [renewDueDatePrompt, setRenewDueDatePrompt] = useState(null);

  const [filters, setFilters] = useState({
    termId: "",
    departmentId: "",
    programId: "",
    semesterId: "",
    search: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [pagination, setPagination] = useState({ page: 1, limit: LIMIT });
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Deep-link support — landing here as `?studentId=...` (e.g. from the
  // Revenue Explorer's "open in Challan Management" link) auto-selects
  // that student instead of leaving the screen on a blank browse state. A
  // minimal `{_id}` stub is enough: the existing useGetStudentDetailsQuery
  // below fetches and merges in the rest once selectedStudent is set.
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const deepLinkId = searchParams.get("studentId");
    if (deepLinkId && !selectedStudent) {
      setSelectedStudent({ _id: deepLinkId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const getSafe = (res, key = "data") => res?.data?.[key] || res?.data || [];

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 400);
    return () => clearTimeout(handler);
  }, [filters.search]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setStudentsList([]);
  }, [
    filters.termId,
    filters.departmentId,
    filters.programId,
    filters.semesterId,
    debouncedSearch,
  ]);

  // University-only tool — excludeLevel:"HSSC" scopes the whole catalog to
  // non-college departments/programs/terms/semesters, same pattern as the
  // Student Report / Student Fee Management / Installment Configuration
  // pages. Replaces the old per-filter hooks plus DashboardView's/
  // BulkChallanManager's hand-rolled string-matching HSSC filters.
  const { data: catalogRes, isFetching: isCatalogLoading } =
    useGetCompleteCatalogQuery({ excludeLevel: "HSSC" });
  const catalog = catalogRes?.data || {
    departments: [],
    programs: [],
    terms: [],
    semesters: [],
  };
  const programsList = useMemo(() => {
    if (!filters.departmentId) return [];
    return catalog.programs.filter(
      (p) =>
        String(p.departmentId?._id || p.departmentId) ===
        String(filters.departmentId),
    );
  }, [catalog.programs, filters.departmentId]);
  // Sections follow the chosen program; with only a class chosen they are
  // every section of that class's programs.
  const semestersList = useMemo(() => {
    if (!filters.programId && !filters.departmentId) return [];
    let list = catalog.semesters;
    if (filters.programId) {
      list = list.filter(
        (s) => String(s.programId?._id || s.programId) === String(filters.programId),
      );
    } else {
      const programIds = new Set(programsList.map((p) => String(p._id)));
      list = list.filter((s) => programIds.has(String(s.programId?._id || s.programId)));
    }
    return [...list].sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [catalog.semesters, filters.programId, filters.departmentId, programsList]);

  const { data: studRes, isFetching: isStudLoading } = useGetStudentsQuery({
    ...filters,
    search: debouncedSearch,
    excludeLevel: "HSSC",
    page: pagination.page,
    limit: pagination.limit,
  });

  useEffect(() => {
    if (studRes?.data || studRes?.students) {
      let fetchedStudents = [];
      if (Array.isArray(studRes?.data?.data))
        fetchedStudents = studRes.data.data;
      else if (Array.isArray(studRes?.data)) fetchedStudents = studRes.data;
      else if (Array.isArray(studRes?.data?.students))
        fetchedStudents = studRes.data.students;

      setStudentsList((prev) => {
        if (pagination.page === 1) return fetchedStudents;
        const newItems = fetchedStudents.filter(
          (n) => !prev.some((p) => p._id === n._id),
        );
        return [...prev, ...newItems];
      });
    }
  }, [studRes, pagination.page]);

  const loadMoreStudents = useCallback(() => {
    if (isStudLoading) return;
    const meta =
      studRes?.data?.pagination || studRes?.pagination || studRes?.data?.meta;
    const totalPages = meta?.totalPages || meta?.pages || 1;

    let fetchedStudents = [];
    if (Array.isArray(studRes?.data?.data)) fetchedStudents = studRes.data.data;
    else if (Array.isArray(studRes?.data)) fetchedStudents = studRes.data;

    if (
      pagination.page < totalPages ||
      fetchedStudents.length === pagination.limit
    ) {
      setPagination((p) => ({ ...p, page: p.page + 1 }));
    }
  }, [isStudLoading, studRes, pagination.page, pagination.limit]);

  const {
    data: studChallanRes,
    isLoading: isChallanLoading,
    refetch: refetchStudent,
  } = useGetChallansByStudentIdQuery(
    selectedStudent ? { id: selectedStudent._id, excludeType: "hostel" } : null,
    {
      skip: !selectedStudent,
      refetchOnMountOrArgChange: true,
    },
  );

  // The row selected from the student list/search cache is fine for
  // display, but not for deciding "which semester is current" — if the
  // student was promoted elsewhere since that list was fetched, pull a
  // fresh, authoritative read instead (same fix applied to the Student Fee
  // Management / Installment Configuration controllers).
  const { data: studentDetailRes } = useGetStudentDetailsQuery(
    selectedStudent?._id,
    { skip: !selectedStudent, refetchOnMountOrArgChange: true },
  );
  const freshStudent = useMemo(() => {
    if (!selectedStudent) return null;
    return studentDetailRes?.data
      ? { ...selectedStudent, ...studentDetailRes.data }
      : selectedStudent;
  }, [selectedStudent, studentDetailRes]);
  const currentSemesterId = freshStudent
    ? String(
        freshStudent.semesterId?._id || freshStudent.semesterId || "",
      ) || null
    : null;

  // ✅ NEW: Fetch Student's Specific Fees (Includes their Exam Fees)
  const { data: studentFeesRes } = useGetStudentFeesQuery(
    selectedStudent?._id,
    {
      skip: !selectedStudent,
    },
  );

  // Tuition (ACADEMIC) fee and installment preference are both scoped per
  // semester — check specifically against the student's CURRENT semester so
  // "fee/installment configured" can't be answered by a stale prior-
  // semester record. Surfaced next to the student's name/reg# in the detail
  // header, and used to drive the Generate form's billing-month rule.
  const hasTuitionFeeSetup = useMemo(() => {
    if (!currentSemesterId) return false;
    return (studentFeesRes?.data || []).some((f) => {
      if (f.category !== "ACADEMIC") return false;
      const fSemId = String(f.semesterId?._id || f.semesterId || "");
      return fSemId === currentSemesterId;
    });
  }, [studentFeesRes, currentSemesterId]);

  const { data: currentPrefRes, isFetching: loadingCurrentPref } =
    useGetStudentPreferenceQuery(
      { studentId: selectedStudent?._id, semesterId: currentSemesterId },
      { skip: !selectedStudent || !currentSemesterId },
    );
  const currentInstallmentPref = currentPrefRes?.data || null;
  const hasInstallmentPlanSetup = Boolean(currentInstallmentPref);

  const { data: deptStatsRes, isFetching: isDeptStats } =
    useGetFinanceReportsQuery({
      reportType: "department",
      termId: filters.termId,
      excludeType: "hostel",
    });
  const { data: progStatsRes, isFetching: isProgStats } =
    useGetFinanceReportsQuery({
      reportType: "program",
      termId: filters.termId,
      excludeType: "hostel",
    });
  const { data: semStatsRes, isFetching: isSemStats } =
    useGetFinanceReportsQuery({
      reportType: "semester",
      termId: filters.termId,
      excludeType: "hostel",
    });

  const backendStats = useMemo(() => {
    const summary = deptStatsRes?.data?.summary || {
      totalRevenue: 0,
      totalPending: 0,
      totalOverdueAmount: 0,
      overdueCount: 0,
      totalChallans: 0,
      rate: 0,
    };
    return {
      summary: {
        totalRevenue: summary.totalRevenue || 0,
        pendingDues: summary.totalPending || 0,
        overdueAmount: summary.totalOverdueAmount || 0,
        overdueCount: summary.overdueCount || 0,
        count: summary.totalChallans || 0,
        rate: summary.rate || 0,
      },
      depts: deptStatsRes?.data?.reportData || [],
      progs: progStatsRes?.data?.reportData || [],
      sems: semStatsRes?.data?.reportData || [],
      isLoading: isDeptStats || isProgStats || isSemStats,
    };
  }, [
    deptStatsRes,
    progStatsRes,
    semStatsRes,
    isDeptStats,
    isProgStats,
    isSemStats,
  ]);

  const { data: miscFeesRes } = useGetMiscellaneousFeesQuery();
  const miscFeesList = useMemo(() => miscFeesRes?.data || [], [miscFeesRes]);

  const [genSingle, { isLoading: isGen }] = useGenerateSingleChallanMutation();
  const [genBulk, { isLoading: isBulk }] = useGenerateBulkChallansMutation();
  const [autoGen, { isLoading: isAutoGen }] = useAutoGenerateChallansMutation();
  const [markPaid, { isLoading: isPay }] = useMarkChallanAsPaidMutation();
  const [delChallan, { isLoading: isDel }] = useDeleteChallanMutation();
  const [createInst, { isLoading: isConv }] =
    useCreateManualInstallmentsMutation();
  const [updateDate, { isLoading: isUpdatingDate }] =
    useUpdateChallanDueDateMutation();
  const [applyDisc, { isLoading: isDiscLoading }] = useApplyDiscountMutation();
  const [removeDisc, { isLoading: isRemovingDisc }] =
    useRemoveDiscountMutation();
  const [bulkDelete, { isLoading: isBulkDel }] = useBulkDeleteMutation();
  const [bulkUpdate, { isLoading: isBulkUpd }] = useBulkUpdateDateMutation();
  const [renewChallanMutation, { isLoading: isRenewing }] =
    useRenewChallanMutation();
  const [bulkRenewMutation, { isLoading: isBulkRenewing }] =
    useBulkRenewChallansMutation();

  const resolveRenewConflict = async (resolution) => {
    if (!renewConflict) return;
    try {
      await renewChallanMutation({
        id: renewConflict.challanId,
        resolution,
        dueDate: renewConflict.dueDate,
      }).unwrap();
      notify("success", "Challan renewed successfully.");
      if (selectedStudent) refetchStudent();
    } catch (e) {
      notify("error", e.data?.message || "Renew failed");
    }
    setRenewConflict(null);
  };

  // Renew always asks for the new due date first — the accountant confirms
  // it in renewDueDatePrompt before anything is sent to the server.
  const confirmRenewDueDate = async (dueDate) => {
    if (!renewDueDatePrompt) return;
    const { challanId } = renewDueDatePrompt;
    try {
      const res = await renewChallanMutation({ id: challanId, dueDate }).unwrap();
      if (res.status === "conflict") {
        setRenewConflict({
          challanId,
          targetMonth: res.targetMonth,
          conflictingChallan: res.conflictingChallan,
          dueDate,
        });
        setRenewDueDatePrompt(null);
        return;
      }
      notify("success", "Challan renewed successfully.");
      if (selectedStudent) refetchStudent();
    } catch (e) {
      notify("error", e.data?.message || "Renew failed");
    }
    setRenewDueDatePrompt(null);
  };

  const executeAction = async () => {
    const { type, id } = confirmModal;
    try {
      if (type === "delete") await delChallan({ id }).unwrap();
      notify("success", "Operation Successful");
      if (selectedStudent) refetchStudent();
    } catch (e) {
      notify("error", e.data?.message || "Operation Failed");
    }
    setConfirmModal({ open: false, type: null, id: null });
  };

  const updateFilters = (key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      if (key === "departmentId") {
        newFilters.programId = "";
        newFilters.semesterId = "";
      }
      if (key === "programId") {
        newFilters.semesterId = "";
      }
      return newFilters;
    });
  };

  const actions = {
    generateSingle: async (form) => {
      try {
        const activeTermId =
          filters.termId ||
          selectedStudent?.termId?._id ||
          selectedStudent?.termId ||
          selectedStudent?.term?._id ||
          selectedStudent?.term;

        const isOnlyMisc =
          form.feeTypes.length === 1 &&
          (form.feeTypes.includes("general") || form.feeTypes.includes("misc"));
        if (!activeTermId && !isOnlyMisc) {
          return notify("error", "Session missing. Please select a session.");
        }

        const res = await genSingle({
          studentId: selectedStudent._id,
          termId: activeTermId || null,
          dueDate: form.dueDate,
          billingMonth: form.billingMonth,
          feeTypes: form.feeTypes,
          miscFeeIds: form.miscFeeIds,
          examTitles: form.examTitles, // ✅ NEW PARAMETER

          targetInstallmentNumber: form.targetInstallmentNumber,
          previousDuesSelections: form.previousDuesSelections,
          deleteChallanIds: form.deleteChallanIds,
          allowMultipleTuition: form.allowMultipleTuition,
        }).unwrap();

        if (res.isBlocked) return res;
        notify("success", "Challan Created Successfully");
        refetchStudent();
        return true;
      } catch (e) {
        notify("error", e.data?.message || "Failed");
        return false;
      }
    },

    generateBulk: async (payload) => {
      try {
        const res = await genBulk({ ...filters, ...payload }).unwrap();
        notify("success", res.message || "Bulk Generation Processed");
        return true;
      } catch (e) {
        notify("error", e.data?.message || "Failed");
        return false;
      }
    },
    // Auto Fee Generator: scans students and generates challans only for
    // those whose installment plan is due in the selected month. Returns
    // the full result (matched/success/failed counts + per-student errors)
    // so the panel can show a real report instead of just a toast.
    autoGenerate: async (payload) => {
      try {
        const res = await autoGen(payload).unwrap();
        notify("success", res.message || "Auto Fee Generation Processed");
        if (selectedStudent) refetchStudent();
        return res;
      } catch (e) {
        notify("error", e.data?.message || "Auto Fee Generation Failed");
        return null;
      }
    },
    bulkDelete: async (ids) => {
      try {
        await bulkDelete(ids).unwrap();
        notify("success", `Deleted ${ids.length} records`);
        return true;
      } catch (e) {
        notify("error", e.data?.message || "Bulk Delete Failed");
        return false;
      }
    },
    bulkUpdateDate: async (ids, date) => {
      try {
        await bulkUpdate({ ids, date }).unwrap();
        notify("success", `Updated ${ids.length} records`);
        return true;
      } catch (e) {
        notify("error", e.data?.message || "Bulk Update Failed");
        return false;
      }
    },
    createInstallments: async (id, installmentsData) => {
      try {
        await createInst({ id, installments: installmentsData }).unwrap();
        notify("success", "Installments Created");
        refetchStudent();
        return true;
      } catch (e) {
        notify("error", e.data?.message || "Failed");
        return false;
      }
    },
    updateDueDate: async (id, newDate) => {
      try {
        await updateDate({ id, dueDate: newDate }).unwrap();
        notify("success", "Due Date Updated");
        refetchStudent();
        return true;
      } catch (e) {
        notify("error", e.data?.message || "Update Failed");
        return false;
      }
    },
    applyDiscount: async (id, formData) => {
      try {
        await applyDisc({ id, data: formData }).unwrap();
        notify("success", "Discount Applied");
        refetchStudent();
        return true;
      } catch (e) {
        notify("error", e.data?.message || "Failed to Apply Discount");
        return false;
      }
    },
    removeDiscount: async (id) => {
      try {
        await removeDisc(id).unwrap();
        notify("success", "Discount Removed");
        refetchStudent();
        return true;
      } catch (e) {
        notify("error", e.data?.message || "Failed to Remove Discount");
        return false;
      }
    },
    onPay: (id) => setPayModalId(id),
    onDelete: (id) => setConfirmModal({ open: true, type: "delete", id }),
    onEditDate: (id) => {},
    onDiscount: (id) => {},
    onInstallment: (id) => {},
    onPrint: (id) => {},
    // Opens the due-date prompt instead of renewing immediately — the
    // actual mutation fires from confirmRenewDueDate once the accountant
    // confirms the date. oldDueDate seeds the dialog's suggested default.
    onRenew: (id, oldDueDate) => {
      setRenewDueDatePrompt({ challanId: id, oldDueDate });
    },
    bulkRenew: async (ids) => {
      try {
        const res = await bulkRenewMutation(ids).unwrap();
        notify(
          res.data?.errorCount > 0 ? "error" : "success",
          res.message || "Bulk renew processed",
        );
        return res.data;
      } catch (e) {
        notify("error", e.data?.message || "Bulk renew failed");
        return null;
      }
    },
  };

  const data = {
    departments: catalog.departments,
    programs: programsList,
    semesters: semestersList,
    // Unfiltered, full catalog — BulkChallanManager has its own independent
    // Department/Program filter selection, so it needs the whole list to
    // cascade against, not this controller's already-narrowed one.
    programsAll: catalog.programs,
    semestersAll: catalog.semesters,
    terms: catalog.terms,
    studentsList,
    loadMoreStudents,
    studentChallans: getSafe(studChallanRes, "challans") || [],
    activeScholarship: freshStudent?.activeScholarship || null,
    studentFees: studentFeesRes?.data || [], // ✅ PASSED TO DETAIL VIEW
    backendStats,
    filters,
    selectedStudent: freshStudent,
    currentSemesterId,
    hasTuitionFeeSetup,
    hasInstallmentPlanSetup,
    currentInstallmentPref,
    loadingCurrentPref,
    miscFeesList,
    isProcessing:
      isGen ||
      isBulk ||
      isAutoGen ||
      isPay ||
      isDel ||
      isConv ||
      isUpdatingDate ||
      isDiscLoading ||
      isRemovingDisc ||
      isBulkDel ||
      isBulkUpd ||
      isRenewing ||
      isBulkRenewing,
    isLoading: isStudLoading || isChallanLoading || isCatalogLoading,
    updateFilters,
    selectStudent: setSelectedStudent,
    clearStudent: () => setSelectedStudent(null),
    renewConflict,
    resolveRenewConflict,
    closeRenewConflict: () => setRenewConflict(null),
    isRenewing,
    actions,
  };

  return (
    <>
      <ToastNotification
        notification={notification}
        onClose={() => setNotification(null)}
      />
      <ConfirmationModal
        isOpen={confirmModal.open}
        onCancel={() => setConfirmModal({ open: false, type: null, id: null })}
        onConfirm={executeAction}
        isLoading={isDel}
        title="Confirm Action"
        message="Delete this challan?"
        isDestructive={true}
      />
      <MarkPaidModal
        isOpen={!!payModalId}
        onClose={() => setPayModalId(null)}
        isLoading={isPay}
        onConfirm={async (formData) => {
          try {
            await markPaid({ id: payModalId, formData }).unwrap();
            notify("success", "Payment successful & receipt saved!");
            setPayModalId(null);
            if (selectedStudent) refetchStudent();
          } catch (e) {
            notify("error", e.data?.message || "Failed to mark paid");
          }
        }}
      />
      <RenewDueDateDialog
        data={renewDueDatePrompt}
        isSubmitting={isRenewing}
        onConfirm={confirmRenewDueDate}
        onClose={() => setRenewDueDatePrompt(null)}
      />
      <RenewConflictDialog
        data={renewConflict}
        isSubmitting={isRenewing}
        onResolve={resolveRenewConflict}
        onClose={() => setRenewConflict(null)}
      />
      {children(data)}
    </>
  );
};

export default StudentChallanManagementController;
