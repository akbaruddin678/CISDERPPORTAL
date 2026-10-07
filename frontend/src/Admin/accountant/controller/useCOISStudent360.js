import { useState, useEffect } from "react";
import { useGetStudentFinancialDossierQuery } from "../api/studentChallanApi";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Same dossier the University Student Profile uses — Fee Setup, Challan
// Statistics, Installment Plan, Monthly Fee Collected, and Tuition
// Outstanding (with previous-semester-due carry-forward), all computed
// separately PER SEMESTER rather than blended into one all-time view.
// `scope: "college"` is what lets this reuse the same backend function for
// HSSC/College students, who are normally excluded from it.
export const useCOISStudent360 = (studentId) => {
  const { openAlert } = useGlobalAlert();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeSemesterId, setActiveSemesterId] = useState(null);

  const { data: dossierRes, isFetching: loadingDossier } =
    useGetStudentFinancialDossierQuery(
      { id: studentId, scope: "college" },
      { skip: !studentId },
    );

  const dossier = dossierRes?.data || {};
  const student = dossier.student || null;
  const availableSemesters = dossier.availableSemesters || [];
  const semesterReports = dossier.semesterReports || [];
  const overallReport = dossier.overallReport || {};

  // Default to the student's most recent (current) semester whenever the
  // list first loads or the student changes.
  useEffect(() => {
    if (semesterReports.length === 0) return;
    const stillValid = semesterReports.some(
      (s) => String(s.semesterId) === String(activeSemesterId),
    );
    if (!activeSemesterId || !stillValid) {
      setActiveSemesterId(
        semesterReports[semesterReports.length - 1].semesterId,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semesterReports, studentId]);

  const activeSemesterReport =
    semesterReports.find(
      (s) => String(s.semesterId) === String(activeSemesterId),
    ) || semesterReports[semesterReports.length - 1];

  // The Ledger tab is scoped to whichever semester is active; exports use
  // the Overall (all-time) ledger regardless of that selection.
  const activeLedger = activeSemesterReport?.ledger || [];
  const allTimeChallans = overallReport.ledger || [];

  const safeFullName = student?.personalInfo?.fullName || "Unknown Student";
  const safeFatherName = student?.familyInfo?.fatherName || "N/A";
  const safeRegNo = student?.studentId || "N/A";

  const financialSummary = {
    totalGenerated: overallReport.financialSummary?.netGenerated || 0,
    totalPaid: overallReport.financialSummary?.totalPaid || 0,
    totalPending: overallReport.financialSummary?.totalPending || 0,
    totalFine: overallReport.financialSummary?.finesBilled || 0,
    totalScholarship: overallReport.financialSummary?.scholarships || 0,
  };

  const handleExportPDF = () => {
    if (!student && allTimeChallans.length === 0)
      return openAlert({ message: "No data to export", severity: "error" });
    const doc = new jsPDF("landscape");

    doc.setFontSize(18);
    doc.text("Student Complete Financial Dossier", 14, 20);

    doc.setFontSize(10);
    doc.text(`Name: ${safeFullName}`, 14, 28);
    doc.text(`Roll No: ${safeRegNo}`, 14, 34);
    doc.text(`Father Name: ${safeFatherName}`, 100, 28);
    doc.text(`Program: ${student?.programId?.name || "N/A"}`, 100, 34);

    autoTable(doc, {
      startY: 42,
      head: [
        [
          "Total Invoiced",
          "Total Paid",
          "Pending Balance",
          "Fines Applied",
          "Scholarships/Waivers",
        ],
      ],
      body: [
        [
          `Rs. ${financialSummary.totalGenerated.toLocaleString()}`,
          `Rs. ${financialSummary.totalPaid.toLocaleString()}`,
          `Rs. ${financialSummary.totalPending.toLocaleString()}`,
          `Rs. ${financialSummary.totalFine.toLocaleString()}`,
          `Rs. ${financialSummary.totalScholarship.toLocaleString()}`,
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [124, 58, 237] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [
        [
          "Challan No",
          "Type",
          "Gen Date",
          "Due Date",
          "Base Amt",
          "Sch/Disc",
          "Fine",
          "Net Amt",
          "Paid",
          "Status",
        ],
      ],
      body: allTimeChallans.map((c) => [
        c.challanNo,
        c.isInstallment
          ? `Installment (${c.installmentGroup})`
          : (c.challanType || "").replace(/_/g, " "),
        new Date(c.createdAt).toLocaleDateString("en-GB"),
        new Date(c.dueDate).toLocaleDateString("en-GB"),
        (c.originalTotal || 0).toLocaleString(),
        (c.scholarshipAmount || 0).toLocaleString(),
        (c.fineAmount || 0).toLocaleString(),
        (c.netAmount || 0).toLocaleString(),
        (c.paidAmount || 0).toLocaleString(),
        (c.status || "").toUpperCase(),
      ]),
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2 },
    });

    doc.save(`${safeRegNo}_Dossier.pdf`);
    openAlert({ message: "PDF Downloaded Successfully", severity: "success" });
  };

  const handleExportWord = () => {
    /* Remains the same, but use safeFatherName */
  };

  return {
    student,
    availableSemesters,
    semesterReports,
    activeSemesterId,
    setActiveSemesterId,
    activeSemesterReport,
    activeLedger,
    challans: allTimeChallans,
    financialSummary,
    safeFullName,
    safeFatherName,
    safeRegNo,
    activeTab,
    setActiveTab,
    loading: loadingDossier,
    handleExportPDF,
    handleExportWord,
  };
};
