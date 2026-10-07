import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetTermsQuery,
  useGetDepartmentsQuery,
  useLazyGetProgramsQuery,
  useGetSemestersQuery,
  useGetExamResultsQuery,
} from "../api/examApi";
import jsPDF from "jspdf";
import { drawTranscriptPage, getInstituteLogo } from "../utils/transcriptDocuments";

const normalizeArray = (res) => res?.data || res || [];

const useExamResultController = () => {
  const { openAlert } = useGlobalAlert();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL parameters to persist across refreshes
  const [filters, setFilters] = useState({
    termId: searchParams.get("termId") || "",
    departmentId: searchParams.get("departmentId") || "",
    programId: searchParams.get("programId") || "all",
    semesterId: searchParams.get("semesterId") || "all",
  });

  // STUDENT DETAILS MODAL STATE
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleOpenDetails = (student) => {
    setSelectedStudent(student);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedStudent(null);
    setIsDetailsOpen(false);
  };

  // --- API HOOKS ---
  const { data: termsRes } = useGetTermsQuery();
  const { data: deptsRes } = useGetDepartmentsQuery();
  const { data: semestersRes } = useGetSemestersQuery();
  const [fetchPrograms, { data: programsRes }] = useLazyGetProgramsQuery();

  useEffect(() => {
    if (filters.departmentId && filters.departmentId !== "all") {
      fetchPrograms(filters.departmentId);
    }
  }, [filters.departmentId, fetchPrograms]);

  const isReadyToFetch = Boolean(filters.termId && filters.departmentId);

  // Fetch compiled results when a Batch is selected
  const { data: resultsRes, isFetching } = useGetExamResultsQuery(filters, {
    skip: !isReadyToFetch,
    refetchOnMountOrArgChange: true,
  });

  const terms = normalizeArray(termsRes);
  const departments = normalizeArray(deptsRes);
  const programs = normalizeArray(programsRes);
  const semestersList = normalizeArray(semestersRes);

  const results = useMemo(() => {
    const rawArray = normalizeArray(resultsRes);
    return rawArray.map((student) => ({
      ...student,
      sgpa: Number(student.sgpa || 0).toFixed(2),
      totalCredits: Number(student.totalCredits) || 0,
      courses:
        student.courses?.map((course) => ({
          ...course,
          // officialObtained/officialTotal are only populated once every exam
          // for this course has reached final VC approval (isFullyDeclared).
          totalMarks: course.officialObtained ?? 0,
          maxMarks: course.officialTotal ?? 0,
          credits: Number(course.credits) || 0,
          gp: Number(course.gp) || 0,
          isFullyDeclared: Boolean(course.isFullyDeclared),
        })) || [],
    }));
  }, [resultsRes]);

  // Auto-select active term if none exists in URL
  useEffect(() => {
    if (terms.length > 0 && !filters.termId) {
      const active = terms.find((t) => t.status) || terms[0];
      if (active) {
        setFilters((p) => ({ ...p, termId: active._id }));
        setSearchParams((prev) => {
          prev.set("termId", active._id);
          return prev;
        });
      }
    }
  }, [terms, filters.termId, setSearchParams]);

  const availablePrograms = programs.filter(
    (p) =>
      String(p.departmentId?._id || p.departmentId) ===
      String(filters.departmentId),
  );

  const availableSemesters = useMemo(() => {
    let sems = semestersList;
    if (filters.programId !== "all") {
      sems = semestersList.filter(
        (s) =>
          String(s.programId?._id || s.programId) === String(filters.programId),
      );
    }
    return [...sems].sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [semestersList, filters.programId]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      const nf = { ...prev, [field]: value };

      // Cascading reset logic
      if (field === "departmentId") {
        nf.programId = "all";
        nf.semesterId = "all";
      }
      if (field === "programId") nf.semesterId = "all";

      // Sync with URL
      setSearchParams(nf);
      return nf;
    });
  };

  // ==========================================
  // OFFICIAL PDF GENERATOR — shared with the Transcript & Degree screen
  // ==========================================
  const downloadPrintList = async () => {
    const declared = results.filter((r) =>
      r.courses.every((c) => c.isFullyDeclared),
    );
    if (declared.length === 0) {
      return openAlert({
        message: "No officially declared results are available to print yet.",
        severity: "warning",
      });
    }

    const logoImg = await getInstituteLogo();
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    declared.forEach((res, index) => {
      if (index > 0) doc.addPage();
      drawTranscriptPage(doc, res, { terms, programs, filters }, logoImg);
    });

    const sessionName =
      terms.find((t) => t._id === filters.termId)?.name || "Session";
    doc.save(`Batch_Transcripts_${sessionName}.pdf`);

    if (declared.length < results.length) {
      openAlert({
        message: `${results.length - declared.length} student(s) skipped — not yet officially declared.`,
        severity: "info",
      });
    }
  };

  const downloadSingleResult = async (result) => {
    if (result.courses.some((c) => !c.isFullyDeclared)) {
      return openAlert({
        message:
          "This result isn't officially declared yet — some courses are still pending approval.",
        severity: "warning",
      });
    }
    const logoImg = await getInstituteLogo();
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    drawTranscriptPage(doc, result, { terms, programs, filters }, logoImg);
    doc.save(`${result.rollNo}_Transcript.pdf`);
  };

  return {
    filters,
    handleFilterChange,
    terms,
    departments,
    availablePrograms,
    availableSemesters,
    results,
    isFetching,
    isReadyToFetch,
    downloadPrintList,
    downloadSingleResult,
    selectedStudent,
    isDetailsOpen,
    handleOpenDetails,
    handleCloseDetails,
  };
};

export default useExamResultController;
