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
import {
  drawTranscriptPage,
  drawDegreeCertificatePage,
  getInstituteLogo,
} from "../utils/transcriptDocuments";

const normalizeArray = (res) => res?.data || res || [];

const useCertificationController = () => {
  const { openAlert } = useGlobalAlert();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    termId: searchParams.get("termId") || "",
    departmentId: searchParams.get("departmentId") || "",
    programId: searchParams.get("programId") || "all",
    semesterId: searchParams.get("semesterId") || "all",
  });

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
      if (field === "departmentId") {
        nf.programId = "all";
        nf.semesterId = "all";
      }
      if (field === "programId") nf.semesterId = "all";
      setSearchParams(nf);
      return nf;
    });
  };

  // ==========================================
  // PDF GENERATORS — shared with the Results & Grading screen's shortcut
  // ==========================================
  const printTranscript = async (result) => {
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
    openAlert({ message: "Transcript downloaded.", severity: "success" });
  };

  const printDegree = async (result) => {
    if (result.status !== "Pass") {
      return openAlert({
        message: "Cannot issue degree. Student has not cleared all courses.",
        severity: "error",
      });
    }
    if (result.courses.some((c) => !c.isFullyDeclared)) {
      return openAlert({
        message: "Cannot issue degree — result not yet officially declared.",
        severity: "error",
      });
    }

    const logoImg = await getInstituteLogo();
    const doc = new jsPDF({ orientation: "l", unit: "mm", format: "a4" });
    drawDegreeCertificatePage(doc, result, { programs }, logoImg);
    doc.save(`${result.rollNo}_Degree.pdf`);
    openAlert({
      message: "Degree generated successfully.",
      severity: "success",
    });
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
    printTranscript,
    printDegree,
  };
};

export default useCertificationController;
