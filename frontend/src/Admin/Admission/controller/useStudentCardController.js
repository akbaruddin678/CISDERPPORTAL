import { useEffect, useMemo, useRef, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query/react";
import {
  useGetDepartmentsQuery,
  useGetProgramsQuery,
  useGetSemestersQuery,
  useGetSessionsQuery,
} from "../services/studentApi";
import {
  useGetCardStudentsQuery,
  useGetCardDataQuery,
  useLazyGetCardDataQuery,
  useGetIssuedCardsQuery,
  useSaveCardPhotoMutation,
  useIssueCardMutation,
  useMarkCardPrintedMutation,
  useRevokeCardMutation,
} from "../services/studentCardApi";
import { errorText, useToast } from "../../Graduation/common/graduationHelpers";
import { downloadBlob, printBlob } from "../common/cardFiles";

const useDebounced = (value, ms = 350) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
};

const dayInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

const buildModel = (student, photo, card) => ({
  fullName: student.fullName,
  fatherName: student.fatherName,
  regNo: student.regNo,
  cnic: student.cnic,
  programName: student.programName,
  departmentName: student.departmentName,
  photo,
  cardNumber: card.cardNumber,
  issueDate: card.issueDate,
  expiryDate: card.expiryDate,
  issueTerm: card.issueTerm,
  endTerm: card.endTerm,
});

// Issue-card screen: pick a student, set/take the official photo, choose the
// validity dates and sessions, then generate + download the printable card.
const COLLEGE_LEVELS = ["HSSC", "INTERMEDIATE", "COLLEGE", "FSC", "FA", "ICS", "ICOM"];
const isCollegeLevel = (level) => COLLEGE_LEVELS.includes(String(level || "").toUpperCase());

const useStudentCardController = () => {
  const [toast, notify] = useToast();
  const exporterRef = useRef(null);
  const [tab, setTab] = useState("issue");

  // ---- student picker: department -> program -> semester, session, search
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search.trim());
  const [filters, setFilters] = useState({ departmentId: "", programId: "", semesterNumber: "", sessionId: "" });
  const [pickerPage, setPickerPage] = useState(1);

  const { data: departmentsRes } = useGetDepartmentsQuery();
  const { data: programsRes } = useGetProgramsQuery();
  const { data: semestersRes } = useGetSemestersQuery();
  const idOf = (v) => v?._id || v;

  // Student cards are for university students: college (HSSC / Intermediate)
  // programs — and the departments, semesters and sessions that exist only
  // because of them — never appear in the filters. Same rule the catalog's
  // "excludeLevel=HSSC" uses.
  const allPrograms = useMemo(
    () => (programsRes?.data || []).filter((p) => !isCollegeLevel(p.level)),
    [programsRes],
  );
  const departments = useMemo(
    () =>
      (departmentsRes?.data || []).filter((d) =>
        allPrograms.some((p) => String(idOf(p.departmentId)) === String(d._id)),
      ),
    [departmentsRes, allPrograms],
  );
  const allSemesters = useMemo(() => {
    const ok = new Set(allPrograms.map((p) => String(p._id)));
    return (semestersRes?.data || []).filter((sem) => ok.has(String(idOf(sem.programId))));
  }, [semestersRes, allPrograms]);
  const programs = useMemo(
    () =>
      filters.departmentId
        ? allPrograms.filter((p) => idOf(p.departmentId) === filters.departmentId)
        : allPrograms,
    [allPrograms, filters.departmentId],
  );
  // Semester numbers offered: those of the chosen program, else of every
  // program currently in scope (the picker filters by number).
  const semesterNumbers = useMemo(() => {
    const scope = new Set(programs.map((p) => p._id));
    const numbers = allSemesters
      .filter((s) => (filters.programId ? idOf(s.programId) === filters.programId : scope.has(idOf(s.programId))))
      .map((s) => s.number);
    return [...new Set(numbers)].sort((a, b) => a - b);
  }, [allSemesters, programs, filters.programId]);

  const setFilter = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "departmentId") {
        next.programId = "";
        next.semesterNumber = "";
      }
      if (key === "programId") next.semesterNumber = "";
      return next;
    });
    setPickerPage(1);
  };
  const resetFilters = () => {
    setFilters({ departmentId: "", programId: "", semesterNumber: "", sessionId: "" });
    setSearch("");
    setPickerPage(1);
  };
  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search.trim() ? 1 : 0);

  const {
    data: pickerRes,
    isFetching: isSearching,
    error: pickerError,
  } = useGetCardStudentsQuery({
    departmentId: filters.departmentId || undefined,
    programId: filters.programId || undefined,
    semesterNumber: filters.semesterNumber || undefined,
    sessionId: filters.sessionId || undefined,
    q: debouncedSearch || undefined,
    page: pickerPage,
    limit: 8,
  });
  const searchResults = useMemo(() => pickerRes?.data || [], [pickerRes]);
  const pickerPagination = pickerRes?.pagination || { page: 1, pages: 1, total: 0 };

  // ---- selected student's card data
  const [studentId, setStudentId] = useState(null);
  const { currentData, isFetching: isLoadingStudent, error: studentError } = useGetCardDataQuery(studentId || skipToken);
  const cardData = studentId ? currentData?.data || null : null;
  const student = cardData?.student || null;

  const { data: sessionsRes } = useGetSessionsQuery();
  const sessions = useMemo(
    () => (sessionsRes?.data || []).filter((t) => t.termType !== "annual"),
    [sessionsRes],
  );

  // Edits are keyed to the student so switching students starts from that
  // student's suggested defaults again.
  const [edits, setEdits] = useState({ studentId: null, values: {} });
  const form = {
    issueDate: dayInput(cardData?.defaults?.issueDate),
    expiryDate: dayInput(cardData?.defaults?.expiryDate),
    issueTermId: cardData?.defaults?.issueTermId || "",
    endTermId: cardData?.defaults?.endTermId || "",
    ...(edits.studentId === studentId ? edits.values : {}),
  };
  const setField = (key, value) =>
    setEdits((prev) => ({
      studentId,
      values: { ...(prev.studentId === studentId ? prev.values : {}), [key]: value },
    }));

  // Photo just saved in this session shows instantly, before the refetch.
  const [photoOverride, setPhotoOverride] = useState({ studentId: null, url: null });
  const photo =
    photoOverride.studentId === studentId && photoOverride.url ? photoOverride.url : cardData?.photoDataUrl || null;
  const hasPhoto = !!photo || !!cardData?.photoUrl;

  const termName = (id) => sessions.find((s) => s._id === id)?.name || "";
  const previewModel = student
    ? buildModel(student, photo, {
        cardNumber: "Assigned on generation",
        issueDate: form.issueDate,
        expiryDate: form.expiryDate,
        issueTerm: termName(form.issueTermId),
        endTerm: termName(form.endTermId),
      })
    : null;

  const selectStudent = (id) => setStudentId(id);

  // ---- photo
  const [photoOpen, setPhotoOpen] = useState(false);
  const [saveCardPhoto, { isLoading: isSavingPhoto }] = useSaveCardPhotoMutation();
  const savePhoto = async (blob, previewUrl) => {
    try {
      await saveCardPhoto({ studentId, blob }).unwrap();
      setPhotoOverride({ studentId, url: previewUrl });
      setPhotoOpen(false);
      notify("Photo saved as the student's official picture.");
    } catch (err) {
      notify(errorText(err), "error");
    }
  };

  // ---- generate / download / print
  const [issueCard, { isLoading: isIssuing }] = useIssueCardMutation();
  const [markPrinted] = useMarkCardPrintedMutation();
  const [isExporting, setIsExporting] = useState(false);

  const validation = (() => {
    if (!student) return "Select a student first.";
    if (!hasPhoto) return "Add the student's photo first.";
    if (!form.issueDate || !form.expiryDate) return "Set the issue date and end date.";
    if (form.expiryDate <= form.issueDate) return "The end date must be after the issue date.";
    if (!form.issueTermId || !form.endTermId) return "Choose the issue session and end session.";
    return "";
  })();

  const exportPdf = async (model, card, mode) => {
    setIsExporting(true);
    try {
      const blob = await exporterRef.current.createPdf(model);
      if (mode === "print") printBlob(blob);
      else downloadBlob(blob, `Student_Card_${model.regNo}.pdf`);
      markPrinted(card._id);
    } catch {
      notify("The card PDF couldn't be created. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const generate = async () => {
    if (validation) return;
    try {
      const res = await issueCard({
        studentId,
        issueDate: form.issueDate,
        expiryDate: form.expiryDate,
        issueTermId: form.issueTermId,
        endTermId: form.endTermId,
      }).unwrap();
      notify(`Card ${res.data.cardNumber} generated.`);
      await exportPdf(buildModel(student, photo, res.data), res.data, "download");
    } catch (err) {
      notify(errorText(err), "error");
    }
  };

  const active = cardData?.activeCard || null;
  const exportActive = async (mode) => {
    if (!active) return;
    await exportPdf(buildModel(student, photo, active), active, mode);
  };

  // ---- issued cards tab
  const [cardSearch, setCardSearch] = useState("");
  const debouncedCardSearch = useDebounced(cardSearch.trim());
  const [cardStatus, setCardStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data: listRes, isFetching: isLoadingCards, error: listError } = useGetIssuedCardsQuery({
    q: debouncedCardSearch || undefined,
    status: cardStatus || undefined,
    page,
    limit: 12,
  });
  const [fetchCardData] = useLazyGetCardDataQuery();
  const [revokeCard, { isLoading: isRevoking }] = useRevokeCardMutation();
  const [revokeTarget, setRevokeTarget] = useState(null);

  const downloadIssued = async (card, mode = "download") => {
    setIsExporting(true);
    try {
      const res = await fetchCardData(card.studentId, true).unwrap();
      const data = res.data;
      await exportPdf(buildModel(data.student, data.photoDataUrl, card), card, mode);
    } catch (err) {
      notify(errorText(err), "error");
      setIsExporting(false);
    }
  };

  const confirmRevoke = async (reason) => {
    try {
      await revokeCard({ id: revokeTarget._id, reason }).unwrap();
      notify("Card revoked.");
      setRevokeTarget(null);
    } catch (err) {
      notify(errorText(err), "error");
    }
  };

  return {
    toast,
    exporterRef,
    tab,
    setTab,

    search,
    setSearch: (v) => {
      setSearch(v);
      setPickerPage(1);
    },
    departments,
    programs,
    semesterNumbers,
    filters,
    setFilter,
    resetFilters,
    activeFilterCount,
    isSearching,
    searchResults,
    pickerPagination,
    pickerPage,
    setPickerPage,
    pickerErrorMessage: pickerError ? errorText(pickerError) : "",
    studentId,
    selectStudent,
    clearStudent: () => setStudentId(null),

    isLoadingStudent,
    studentErrorMessage: studentError ? errorText(studentError) : "",
    student,
    cardData,
    active,
    photo,
    hasPhoto,
    sessions,
    form,
    setField,
    previewModel,

    photoOpen,
    openPhoto: () => setPhotoOpen(true),
    closePhoto: () => setPhotoOpen(false),
    savePhoto,
    isSavingPhoto,

    validation,
    generate,
    isBusy: isIssuing || isExporting,
    isIssuing,
    isExporting,
    exportActive,

    cardSearch,
    setCardSearch: (v) => {
      setCardSearch(v);
      setPage(1);
    },
    cardStatus,
    setCardStatus: (v) => {
      setCardStatus(v);
      setPage(1);
    },
    cards: listRes?.data || [],
    pagination: listRes?.pagination || { page: 1, pages: 1, total: 0 },
    page,
    setPage,
    isLoadingCards,
    cardsErrorMessage: listError ? errorText(listError) : "",
    downloadIssued,
    revokeTarget,
    openRevoke: setRevokeTarget,
    closeRevoke: () => setRevokeTarget(null),
    confirmRevoke,
    isRevoking,
  };
};

export default useStudentCardController;
