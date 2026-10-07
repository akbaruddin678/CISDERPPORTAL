import { useState, useEffect, useMemo } from "react";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetTermsQuery,
  useGetDepartmentsQuery,
  useLazyGetProgramsQuery,
  useGetSemestersQuery,
  useGetExamsQuery,
  useGetEligibleStudentsForAdmitCardsQuery,
  useGetAdmitCardsQuery,
  useGenerateBulkAdmitCardsMutation,
  useRevokeAdmitCardMutation,
} from "../api/examApi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getInstituteLogo } from "../utils/transcriptDocuments";

const normalizeArray = (res) => res?.data || res || [];

// Preferred display order for exam rounds; anything else discovered is
// appended after these.
const EXAM_TYPE_ORDER = [
  "Mid Term",
  "Final Exam",
  "Quiz",
  "Assignment",
  "Practical",
];

// Department -> Program -> Session -> Semester -> Exam Round, then a table
// of every eligible student with their CURRENT-SEMESTER fee status. A
// student whose fee hasn't even been generated can never get an admit
// card here; one whose fee is generated but unpaid can still be issued
// one, but only after an explicit "are you sure?" confirmation — for a
// single student or the whole batch at once.
const useAdmitCardController = () => {
  const { openAlert } = useGlobalAlert();

  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({
    termId: "",
    departmentId: "",
    programId: "",
    semesterId: "",
    examType: "",
  });
  const [confirmDialog, setConfirmDialog] = useState(null);

  const { data: termsRes } = useGetTermsQuery();
  const { data: deptsRes } = useGetDepartmentsQuery();
  const { data: semestersRes } = useGetSemestersQuery();
  const [fetchPrograms, { data: programsRes }] = useLazyGetProgramsQuery();

  useEffect(() => {
    if (filters.departmentId) fetchPrograms(filters.departmentId);
  }, [filters.departmentId, fetchPrograms]);

  const terms = normalizeArray(termsRes);
  const departments = normalizeArray(deptsRes);
  const programs = normalizeArray(programsRes);
  const semestersList = normalizeArray(semestersRes);

  const availablePrograms = useMemo(
    () =>
      programs.filter(
        (p) =>
          String(p.departmentId?._id || p.departmentId) ===
          String(filters.departmentId),
      ),
    [programs, filters.departmentId],
  );

  const availableSemesters = useMemo(() => {
    if (!filters.programId) return [];
    return [...semestersList]
      .filter(
        (s) =>
          String(s.programId?._id || s.programId) === String(filters.programId),
      )
      .sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [semestersList, filters.programId]);

  const isScoped = Boolean(
    filters.termId && filters.departmentId && filters.programId && filters.semesterId,
  );

  // Only PUBLISHED, non-Sessional exam types can be admit-carded — this
  // drives the "which exam round" picker.
  const { data: examsRes } = useGetExamsQuery(
    {
      termId: filters.termId,
      departmentId: filters.departmentId,
      programId: filters.programId,
      semesterId: filters.semesterId,
    },
    { skip: !isScoped },
  );
  const scopedExams = normalizeArray(examsRes);

  const availableExamTypes = useMemo(() => {
    const types = new Set(
      scopedExams
        .filter((e) => e.type !== "Sessional" && e.publishStatus === "PUBLISHED")
        .map((e) => e.type),
    );
    return [
      ...EXAM_TYPE_ORDER.filter((t) => types.has(t)),
      ...[...types].filter((t) => !EXAM_TYPE_ORDER.includes(t)),
    ];
  }, [scopedExams]);

  // Keep the selected round valid as the scope filters change underneath it.
  useEffect(() => {
    if (filters.examType && !availableExamTypes.includes(filters.examType)) {
      setFilters((prev) => ({ ...prev, examType: "" }));
    }
  }, [availableExamTypes, filters.examType]);

  const isReady = isScoped && Boolean(filters.examType);

  const eligibleQueryArgs = isReady
    ? {
        termId: filters.termId,
        programId: filters.programId,
        semesterId: filters.semesterId,
        examType: filters.examType,
      }
    : skipToken;
  const {
    data: eligibleRes,
    isFetching: isFetchingEligible,
    refetch: refetchEligible,
  } = useGetEligibleStudentsForAdmitCardsQuery(eligibleQueryArgs, {
    refetchOnMountOrArgChange: true,
  });
  const eligibleStudents = normalizeArray(eligibleRes);

  const {
    data: cardsRes,
    isFetching: isFetchingCards,
    refetch: refetchCards,
  } = useGetAdmitCardsQuery({}, { skip: !isScoped, refetchOnMountOrArgChange: true });
  const rawCards = normalizeArray(cardsRes);

  const [generateCards, { isLoading: isGenerating }] =
    useGenerateBulkAdmitCardsMutation();
  const [revokeCard, { isLoading: isRevoking }] =
    useRevokeAdmitCardMutation();

  const filteredCards = useMemo(() => {
    if (!isScoped) return [];
    return rawCards.filter((card) => {
      const cardTermId = String(card.termId?._id || card.termId || "");
      const cardDeptId = String(card.departmentId?._id || card.departmentId || "");
      const cardProgId = String(card.programId?._id || card.programId || "");
      const cardSemId = String(card.semesterId?._id || card.semesterId || "");

      return (
        cardTermId === String(filters.termId) &&
        cardDeptId === String(filters.departmentId) &&
        cardProgId === String(filters.programId) &&
        cardSemId === String(filters.semesterId) &&
        (!filters.examType || card.examType === filters.examType)
      );
    });
  }, [rawCards, filters, isScoped]);

  const handleTabChange = (e, newValue) => setActiveTab(newValue);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      const nf = { ...prev, [field]: value };
      if (field === "departmentId") {
        nf.programId = "";
        nf.semesterId = "";
        nf.examType = "";
      }
      if (field === "programId") {
        nf.semesterId = "";
        nf.examType = "";
      }
      if (field === "semesterId") nf.examType = "";
      return nf;
    });
  };

  const nameFor = (studentId) =>
    eligibleStudents.find((s) => s.studentId === studentId)?.name || "Unknown";
  const regNoFor = (studentId) =>
    eligibleStudents.find((s) => s.studentId === studentId)?.regNo || "";

  const submitGeneration = ({ studentIds, forceUnpaidStudentIds }) =>
    generateCards({
      termId: filters.termId,
      departmentId: filters.departmentId,
      programId: filters.programId,
      semesterId: filters.semesterId,
      examType: filters.examType,
      ...(studentIds ? { studentIds } : {}),
      ...(forceUnpaidStudentIds ? { forceUnpaidStudentIds } : {}),
    }).unwrap();

  const finishUp = (message) => {
    openAlert({ message, severity: "success" });
    setConfirmDialog(null);
    refetchEligible();
    refetchCards();
  };

  // --- Single-student generation ---
  const handleGenerateSingle = async (studentId) => {
    try {
      const res = await submitGeneration({ studentIds: [studentId] });

      if (res.skippedNoFee?.length > 0 || res.skippedUnpaid?.length > 0) {
        const allSkippedIds = [
          ...(res.skippedNoFee || []),
          ...(res.skippedUnpaid || []).map((s) => s.studentId),
        ];
        return setConfirmDialog({
          mode: "single",
          skippedNoFee: (res.skippedNoFee || []).map((id) => ({
            studentId: id,
            name: nameFor(id),
            regNo: regNoFor(id),
          })),
          skippedUnpaid: (res.skippedUnpaid || []).map((s) => ({
            ...s,
            name: nameFor(s.studentId),
            regNo: regNoFor(s.studentId),
          })),
          onConfirm: async () => {
            try {
              await submitGeneration({
                studentIds: [studentId],
                forceUnpaidStudentIds: allSkippedIds,
              });
              finishUp(`Admit card generated for ${nameFor(studentId)}.`);
            } catch (error) {
              openAlert({
                message: error.data?.message || "Generation failed.",
                severity: "error",
              });
            }
          },
        });
      }

      if (res.generatedCount > 0) {
        finishUp(`Admit card generated for ${nameFor(studentId)}.`);
      } else {
        openAlert({ message: "This student already has an admit card.", severity: "info" });
      }
    } catch (error) {
      openAlert({
        message: error.data?.message || "Generation failed.",
        severity: "error",
      });
    }
  };

  // --- Bulk generation across every not-yet-generated eligible student ---
  const handleGenerateBulk = async () => {
    const targetIds = eligibleStudents
      .filter((s) => !s.alreadyHasCard)
      .map((s) => s.studentId);
    if (targetIds.length === 0) {
      return openAlert({
        message: "Nothing to generate — every eligible student already has a card.",
        severity: "info",
      });
    }

    try {
      const res = await submitGeneration({ studentIds: targetIds });

      if (res.skippedNoFee?.length > 0 || res.skippedUnpaid?.length > 0) {
        const forceIds = [
          ...(res.skippedNoFee || []),
          ...(res.skippedUnpaid || []).map((s) => s.studentId),
        ];
        return setConfirmDialog({
          mode: "bulk",
          skippedNoFee: (res.skippedNoFee || []).map((id) => ({
            studentId: id,
            name: nameFor(id),
            regNo: regNoFor(id),
          })),
          skippedUnpaid: (res.skippedUnpaid || []).map((s) => ({
            ...s,
            name: nameFor(s.studentId),
            regNo: regNoFor(s.studentId),
          })),
          generatedSoFar: res.generatedCount,
          onConfirm: async () => {
            try {
              const res2 = await submitGeneration({
                studentIds: targetIds,
                forceUnpaidStudentIds: forceIds,
              });
              finishUp(
                `${res.generatedCount + res2.generatedCount} admit card(s) generated.`,
              );
            } catch (error) {
              openAlert({
                message: error.data?.message || "Generation failed.",
                severity: "error",
              });
            }
          },
        });
      }

      finishUp(`${res.generatedCount} admit card(s) generated.`);
    } catch (error) {
      openAlert({
        message: error.data?.message || "Generation failed.",
        severity: "error",
      });
    }
  };

  const closeConfirmDialog = () => setConfirmDialog(null);

  const handleRevokeCard = async (card) => {
    try {
      await revokeCard(card._id).unwrap();
      openAlert({ message: "Admit card revoked.", severity: "success" });
      refetchCards();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Revoke failed",
        severity: "error",
      });
    }
  };

  // Light pill badges (tinted background + darker text of the same hue)
  // instead of solid filled blocks — matches the pastel Chip language used
  // everywhere else in this app's own UI.
  const STATUS_COLORS = {
    Active: { bg: [240, 253, 244], text: [21, 128, 61] },
    Expired: { bg: [241, 245, 249], text: [71, 85, 105] },
    Revoked: { bg: [254, 242, 242], text: [185, 28, 28] },
  };

  const ACCENT = [37, 99, 235]; // blue-600
  const ACCENT_LIGHT = [239, 246, 255]; // blue-50
  const INK = [15, 23, 42]; // slate-900
  const MUTED = [100, 116, 139]; // slate-500
  const BORDER = [226, 232, 240]; // slate-200

  // ✅ REUSABLE PDF LOGIC — one admit card, drawn with the university logo,
  // a proper header, and no Venue column (Halls/Seating removed).
  const generateAdmitCardPDF = (doc, card, logoImg) => {
    const effectiveStatus = card.effectiveStatus || "Active";
    const statusColor = STATUS_COLORS[effectiveStatus] || STATUS_COLORS.Active;

    // Outer frame — thin and light instead of a heavy black border.
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277);

    // Header — white background, dark text, a slim accent rule underneath
    // instead of a solid dark fill.
    if (logoImg) {
      try {
        doc.addImage(logoImg, "PNG", 16, 14, 20, 20);
      } catch {
        // malformed/undecodable image shouldn't block the card
      }
    }
    doc.setTextColor(...INK);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("CISD", 105, 20, { align: "center" });
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text("Office of the Controller of Examinations", 105, 26, { align: "center" });

    // Document title as a light-blue pill, not a solid dark band.
    const titleText = `EXAMINATION ADMIT CARD — ${(card.examType || "").toUpperCase()}`;
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    const titleWidth = doc.getTextWidth(titleText) + 12;
    doc.setFillColor(...ACCENT_LIGHT);
    doc.roundedRect(105 - titleWidth / 2, 30, titleWidth, 8, 2, 2, "F");
    doc.setTextColor(...ACCENT);
    doc.text(titleText, 105, 35.3, { align: "center" });

    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.6);
    doc.line(10, 42, 200, 42);

    // Status badge, top-right — light pill matching the on-screen chips.
    doc.setFillColor(...statusColor.bg);
    doc.roundedRect(160, 14, 34, 8, 1.5, 1.5, "F");
    doc.setTextColor(...statusColor.text);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(effectiveStatus.toUpperCase(), 177, 19.3, { align: "center" });

    // Fee-not-paid warning — issued on exception (admin overrode the
    // confirmation dialog at generation time). Kept on the printed card
    // itself, not just the on-screen alert, so gate/invigilation staff
    // can still see it. Pushes every element below it down to make room.
    let y = 42;
    if (card.feeWarning) {
      doc.setFillColor(255, 251, 235);
      doc.rect(10, y + 2, 190, 7, "F");
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.4);
      doc.rect(10, y + 2, 190, 7);
      doc.setTextColor(180, 83, 9);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text(
        "FEE NOT PAID AT TIME OF ISSUE — VERIFY BEFORE ADMITTING TO THE EXAM HALL",
        105,
        y + 6.7,
        { align: "center" },
      );
      y += 11;
    }

    const cardNo = `AC-${String(card._id || "").slice(-8).toUpperCase()}`;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(`Card No: ${cardNo}`, 16, y + 8);
    doc.text(
      `Issued: ${card.createdAt ? new Date(card.createdAt).toLocaleDateString("en-GB") : "N/A"}`,
      70,
      y + 8,
    );

    // Photo placeholder box
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.4);
    doc.rect(165, y + 13, 25, 30);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("PHOTO", 177.5, y + 29, { align: "center" });

    doc.setFontSize(11);
    const fullName = card.studentId?.personalInfo?.fullName || "N/A";
    const rollNo = card.studentId?.studentId || "N/A";

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    doc.text("Student Name:", 16, y + 21);
    doc.text("Student ID:", 16, y + 28);
    doc.text("Session:", 16, y + 35);
    doc.setFont("helvetica", "normal");
    doc.text(fullName.toUpperCase(), 50, y + 21);
    doc.text(rollNo, 50, y + 28);
    doc.text(
      terms.find((t) => String(t._id) === String(card.termId))?.name || "N/A",
      50,
      y + 35,
    );

    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(16, y + 48, 196, y + 48);

    const examRows = (card.exams || []).map((ex, i) => [
      i + 1,
      ex.courseId?.code || "N/A",
      ex.courseId?.title || ex.title || "N/A",
      ex.date ? new Date(ex.date).toLocaleDateString("en-GB") : "TBD",
      ex.startTime || "TBD",
    ]);

    autoTable(doc, {
      startY: y + 53,
      head: [["#", "Code", "Subject", "Date", "Time"]],
      body: examRows,
      theme: "grid",
      headStyles: {
        fillColor: ACCENT_LIGHT,
        textColor: ACCENT,
        fontSize: 9,
        lineColor: BORDER,
      },
      bodyStyles: { fontSize: 9, textColor: INK, lineColor: BORDER },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 16, right: 16 },
    });

    const finalY = doc.lastAutoTable?.finalY || 200;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...MUTED);
    doc.text(
      "Candidates must bring this admit card along with a valid university ID to every examination listed above.",
      16,
      finalY + 10,
      { maxWidth: 130 },
    );

    doc.setDrawColor(...INK);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK);
    doc.text("__________________________", 145, 275);
    doc.text("Controller Examinations", 152, 280);
  };

  const downloadPrintList = async () => {
    if (filteredCards.length === 0) return;
    const logoImg = await getInstituteLogo();
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    filteredCards.forEach((card, index) => {
      if (index > 0) doc.addPage();
      generateAdmitCardPDF(doc, card, logoImg);
    });
    doc.save("Batch_Admit_Cards.pdf");
  };

  const downloadSingleAdmitCard = async (card) => {
    const logoImg = await getInstituteLogo();
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    generateAdmitCardPDF(doc, card, logoImg);
    const fileName = `${card.studentId?.studentId || "AdmitCard"}.pdf`;
    doc.save(fileName);
  };

  return {
    activeTab,
    handleTabChange,
    filters,
    handleFilterChange,
    terms,
    departments,
    availablePrograms,
    availableSemesters,
    availableExamTypes,
    isReady,
    isScoped,

    eligibleStudents,
    isFetchingEligible,
    handleGenerateSingle,
    handleGenerateBulk,
    isGenerating,

    confirmDialog,
    closeConfirmDialog,

    admitCards: filteredCards,
    isFetching: isFetchingCards,
    downloadPrintList,
    downloadSingleAdmitCard,
    handleRevokeCard,
    isRevoking,
    semestersList,
  };
};

export default useAdmitCardController;
