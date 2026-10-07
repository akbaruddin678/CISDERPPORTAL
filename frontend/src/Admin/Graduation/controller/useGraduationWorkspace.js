import { useEffect, useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query/react";
import {
  useGetClearancesQuery,
  useGetCandidatesQuery,
  useGetGraduatesQuery,
  useGetEligibilityQuery,
  useStartClearanceMutation,
  useStartClearanceBulkMutation,
  useRunBulkActionMutation,
} from "../api/graduationApi";
import { errorText, useToast } from "../common/graduationHelpers";
import { BULK_ACTIONS, BULK_ACTIONS_BY_MODE, BULK_BATCH_SIZE } from "../common/graduationBulk";

// What each desk sees: its title, which stage it acts on, and its tabs.
export const MODES = {
  hod: {
    title: "Graduation Clearance",
    subtitle: "Verify a final-year student's academics and start their degree clearance.",
    stage: "hod",
    awaitingLabel: "To submit",
    tabs: ["candidates", "awaiting", "progress", "graduates"],
  },
  exam: {
    title: "Graduation — Examination Office",
    subtitle: "Compile final grades and CGPA, check for disciplinary cases and approve the transcript.",
    stage: "exam",
    awaitingLabel: "Awaiting review",
    tabs: ["awaiting", "progress", "graduates"],
  },
  desk: {
    title: "Clearance Desk",
    subtitle: "Confirm graduating students hold none of your office's property or dues.",
    stage: "offices",
    awaitingLabel: "Awaiting my clearance",
    tabs: ["awaiting", "progress"],
  },
  finance: {
    title: "Graduation — Accounts & Finance",
    subtitle: "Confirm all fees and fines are settled and the degree fee is received.",
    stage: "finance",
    awaitingLabel: "Awaiting Accounts",
    tabs: ["awaiting", "progress", "graduates"],
  },
  registrar: {
    title: "Graduation & Degree Clearance",
    subtitle: "Track every student through clearance, give final approval and manage the graduate list.",
    stage: "registrar",
    awaitingLabel: "Awaiting final approval",
    tabs: ["awaiting", "progress", "graduates"],
  },
};

const TAB_LABELS = {
  candidates: "Start clearance",
  progress: "In progress",
  graduates: "Graduate list",
};

const useDebounced = (value, ms = 350) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
};

const useGraduationWorkspace = (mode) => {
  const config = MODES[mode];
  const [toast, notify] = useToast();
  const [activeTab, setActiveTab] = useState(config.tabs[0]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search);
  const [selectedId, setSelectedId] = useState(null);

  // Clearances in progress: the source for the "awaiting" / "in progress"
  // tabs and for the stage counters.
  const {
    data: listRes,
    isFetching: isLoadingList,
    error: listError,
  } = useGetClearancesQuery({ status: "in_progress" });
  const allRows = useMemo(() => listRes?.data || [], [listRes]);
  const counts = listRes?.meta?.counts || {};

  const awaitingRows = useMemo(
    () =>
      allRows.filter((r) =>
        mode === "desk" ? r.permissions?.officeKeys?.length > 0 : r.currentStage === config.stage,
      ),
    [allRows, mode, config.stage],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = activeTab === "awaiting" ? awaitingRows : allRows;
    if (!q) return base;
    return base.filter((r) =>
      [r.student?.fullName, r.student?.regNo, r.student?.cnic].some((v) =>
        String(v || "").toLowerCase().includes(q),
      ),
    );
  }, [activeTab, awaitingRows, allRows, search]);

  // Candidates (HOD only) — server-side search and program filter. Every
  // candidate returned is already eligible: the server only returns
  // academically_completed students (the Examination Office's Degree Audit
  // decides eligibility up front), so there is no client-side "final
  // semester only" toggle anymore.
  const [programId, setProgramId] = useState("");
  const candidatesActive = activeTab === "candidates";
  const {
    data: candRes,
    isFetching: isLoadingCandidates,
    error: candError,
  } = useGetCandidatesQuery(
    candidatesActive
      ? { q: debouncedSearch.trim() || undefined, programId: programId || undefined }
      : skipToken,
  );

  // Graduate list — server-side search and year filter.
  const [year, setYear] = useState("");
  const graduatesActive = activeTab === "graduates";
  const {
    data: gradRes,
    isFetching: isLoadingGraduates,
    error: gradError,
  } = useGetGraduatesQuery(
    graduatesActive ? { q: debouncedSearch.trim() || undefined, year: year || undefined } : skipToken,
  );

  const tabs = config.tabs.map((key) => ({
    key,
    label: key === "awaiting" ? config.awaitingLabel : TAB_LABELS[key],
    count:
      key === "awaiting"
        ? awaitingRows.length
        : key === "progress"
          ? allRows.length
          : key === "graduates"
            ? counts.graduated
            : undefined,
  }));

  // Preview + start (candidates tab).
  const [previewStudentId, setPreviewStudentId] = useState(null);
  const { currentData: eligibility, isFetching: isLoadingEligibility, error: eligibilityError } =
    useGetEligibilityQuery(previewStudentId || skipToken);
  const [startClearance, { isLoading: isStarting }] = useStartClearanceMutation();

  const start = async (studentId) => {
    try {
      const res = await startClearance(studentId).unwrap();
      notify("Clearance started.");
      setPreviewStudentId(null);
      setSelectedId(res.data._id);
      setActiveTab("awaiting");
    } catch (err) {
      notify(errorText(err), "error");
    }
  };

  // Bulk start — pick many candidates, confirm once, get a per-student result.
  const [pickedMap, setPickedMap] = useState({});
  const [bulkStep, setBulkStep] = useState(null); // null | "confirm" | "result"
  const [bulkResult, setBulkResult] = useState(null);
  const [startBulk, { isLoading: isBulkStarting }] = useStartClearanceBulkMutation();

  const candidates = useMemo(() => candRes?.data || [], [candRes]);
  // Only what's currently listed can stay selected, so changing the search or
  // filter never leaves hidden students silently ticked.
  const selectedIds = useMemo(
    () => candidates.filter((c) => pickedMap[c._id]).map((c) => c._id),
    [candidates, pickedMap],
  );
  const selectedStudents = useMemo(
    () => candidates.filter((c) => pickedMap[c._id]),
    [candidates, pickedMap],
  );
  const allPicked = candidates.length > 0 && selectedIds.length === candidates.length;

  const togglePick = (id) => setPickedMap((m) => ({ ...m, [id]: !m[id] }));
  const togglePickAll = () =>
    setPickedMap(allPicked ? {} : Object.fromEntries(candidates.map((c) => [c._id, true])));
  const clearPicked = () => setPickedMap({});

  const confirmBulk = async () => {
    try {
      const res = await startBulk(selectedIds).unwrap();
      setBulkResult(res.data);
      setBulkStep("result");
      setPickedMap({});
    } catch (err) {
      notify(errorText(err), "error");
      setBulkStep(null);
    }
  };
  const finishBulk = (goToList) => {
    setBulkStep(null);
    setBulkResult(null);
    if (goToList) setActiveTab("awaiting");
  };


  // Bulk stage actions on the list tabs — tick clearances, pick an action,
  // add one remark that is recorded on every one of them.
  const [rowPicked, setRowPicked] = useState({});
  const [bulkAction, setBulkAction] = useState(null); // action key | null
  const [bulkForm, setBulkForm] = useState({ remarks: "", confirmUnverified: false, feeReceived: false });
  const [bulkRun, setBulkRun] = useState(null); // null | {status:"running", processed, total} | {status:"done", done, failed}
  const [runBulkAction] = useRunBulkActionMutation();

  const pickedRows = useMemo(() => rows.filter((r) => rowPicked[r._id]), [rows, rowPicked]);
  const listSelectable = activeTab === "awaiting" || activeTab === "progress";
  const allRowsPicked = rows.length > 0 && pickedRows.length === rows.length;
  const toggleRow = (id) => setRowPicked((m) => ({ ...m, [id]: !m[id] }));
  const toggleAllRows = () =>
    setRowPicked(allRowsPicked ? {} : Object.fromEntries(rows.map((r) => [r._id, true])));
  const clearRows = () => setRowPicked({});

  // Which actions apply to the current selection, and to how many rows.
  const bulkChoices = BULK_ACTIONS_BY_MODE[mode]
    .map((key) => {
      const spec = BULK_ACTIONS[key];
      return { ...spec, count: pickedRows.filter((r) => spec.eligible(r)).length };
    })
    .filter((c) => c.count > 0);
  const activeSpec = bulkAction ? BULK_ACTIONS[bulkAction] : null;
  const eligibleRows = activeSpec ? pickedRows.filter((r) => activeSpec.eligible(r)) : [];

  const openBulkAction = (key) => {
    setBulkAction(key);
    setBulkForm({ remarks: "", confirmUnverified: false, feeReceived: false });
    setBulkRun(null);
  };
  const closeBulkAction = () => {
    if (bulkRun?.status === "running") return;
    setBulkAction(null);
    setBulkRun(null);
  };
  const bulkFormError = (() => {
    if (!activeSpec) return "";
    const remarks = bulkForm.remarks.trim();
    if (activeSpec.remark === "required" && !remarks) return "A remark is required.";
    if (bulkForm.confirmUnverified && !remarks) return "Add a remark — it is recorded as the confirmation.";
    if (activeSpec.needsFeeReceived && !bulkForm.feeReceived) return "Confirm the degree fee has been received.";
    return "";
  })();

  const submitBulkAction = async () => {
    if (!activeSpec || bulkFormError || !eligibleRows.length) return;
    const ids = eligibleRows.map((r) => r._id);
    const done = [];
    const failed = [];
    setBulkRun({ status: "running", processed: 0, total: ids.length });
    for (let i = 0; i < ids.length; i += BULK_BATCH_SIZE) {
      const batch = ids.slice(i, i + BULK_BATCH_SIZE);
      try {
        const res = await runBulkAction({
          action: activeSpec.key,
          ids: batch,
          remarks: bulkForm.remarks.trim(),
          confirmUnverified: bulkForm.confirmUnverified,
          feeReceived: bulkForm.feeReceived,
        }).unwrap();
        done.push(...res.data.done);
        failed.push(...res.data.failed);
      } catch (err) {
        batch.forEach((id) => {
          const row = rows.find((r) => r._id === id);
          failed.push({ id, fullName: row?.student?.fullName || "", regNo: row?.student?.regNo || "", reason: errorText(err) });
        });
      }
      setBulkRun({ status: "running", processed: Math.min(i + BULK_BATCH_SIZE, ids.length), total: ids.length });
    }
    setBulkRun({ status: "done", done, failed });
    setRowPicked({});
  };

  return {
    mode,
    config,
    toast,
    notify,

    listSelectable,
    pickedRows,
    allRowsPicked,
    toggleRow,
    toggleAllRows,
    clearRows,
    bulkChoices,
    bulkAction: activeSpec,
    eligibleRows,
    bulkForm,
    setBulkForm,
    bulkFormError,
    bulkRun,
    openBulkAction,
    closeBulkAction,
    submitBulkAction,

    selectedIds,
    selectedStudents,
    allPicked,
    togglePick,
    togglePickAll,
    clearPicked,
    bulkStep,
    openBulkConfirm: () => setBulkStep("confirm"),
    closeBulk: () => setBulkStep(null),
    confirmBulk,
    isBulkStarting,
    bulkResult,
    finishBulk,

    tabs,
    activeTab,
    setActiveTab: (key) => {
      setActiveTab(key);
      setSearch("");
      setRowPicked({});
    },
    search,
    setSearch,

    rows,
    isLoadingList,
    listErrorMessage: listError ? errorText(listError) : "",
    counts,

    candidates,
    candidateMeta: candRes?.meta || {},
    isLoadingCandidates,
    candidatesErrorMessage: candError ? errorText(candError) : "",
    programId,
    setProgramId,

    graduates: gradRes?.data || [],
    graduateYears: gradRes?.meta?.years || [],
    isLoadingGraduates,
    graduatesErrorMessage: gradError ? errorText(gradError) : "",
    year,
    setYear,

    previewStudentId,
    openPreview: setPreviewStudentId,
    closePreview: () => setPreviewStudentId(null),
    eligibility: eligibility?.data || null,
    isLoadingEligibility,
    eligibilityErrorMessage: eligibilityError ? errorText(eligibilityError) : "",
    start,
    isStarting,

    selectedId,
    openClearance: setSelectedId,
    closeClearance: () => setSelectedId(null),
  };
};

export default useGraduationWorkspace;
