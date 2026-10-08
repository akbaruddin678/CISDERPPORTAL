import StudentProfile from "../../student/models/StudentProfile.js";
import PersonalInfo from "../../student/models/PersonalInfo.js";
import FamilyInfo from "../../student/models/FamilyInfo.js";
import { generateAdmissionLetterPdfBuffer } from "../../core/utils/pdf/admissionLetterPdf.js";
import { generateChallanPdfBuffer } from "../../core/utils/pdf/admissionChallanPdf.js";
import { sendAdmissionAcceptanceEmail } from "../../core/utils/email.js";
import { StudentChallanService } from "./studentChallan.service.js";

// Same challanType -> label formatting used by the real print template
// (ChallanPrintTemplate.js) — "TUITION_EXAM" -> "TUITION EXAM", plus the
// installment-number suffix when relevant.
const formatChallanTypeLabel = (challan) => {
  let label = challan?.challanType
    ? String(challan.challanType).replace(/_/g, " ").toUpperCase()
    : "FEE";
  if (challan?.isInstallment && challan?.installmentNumber) {
    label =
      label === "INSTALLMENT"
        ? `INSTALLMENT ${challan.installmentNumber}`
        : `${label} (INSTALLMENT ${challan.installmentNumber})`;
  }
  return label;
};

// Builds and sends the admission-acceptance email (congratulations letter,
// plus the first admission fee challan when one exists) for a given
// student. Shared by every trigger that needs to send this exact email —
// promoteStudent (right at acceptance), the staff "Resend Admission Email"
// action, and the automatic trigger that fires the moment a student's
// first admission challan is actually generated — so all three always
// send the same letter/challan instead of three separate implementations
// drifting apart over time.
export async function sendAdmissionEmailForStudent(studentId, { challan } = {}) {
  const student = await StudentProfile.findById(studentId)
    .populate("departmentId", "name")
    .populate("programId", "name")
    .populate("termId", "name")
    .populate("semesterId", "name number")
    .lean();
  if (!student) return false;

  const [personalInfo, familyInfo] = await Promise.all([
    PersonalInfo.findOne({ studentId }).select("fullName email").lean(),
    FamilyInfo.findOne({ studentId })
      .select("fatherName guardianPhone")
      .lean(),
  ]);
  if (!personalInfo?.email) return false;

  const acceptedDate = new Date(
    student.promotionDate || student.createdAt || Date.now(),
  ).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const pdfBuffer = await generateAdmissionLetterPdfBuffer({
    fullName: personalInfo.fullName || "Student",
    programName: student.programId?.name || "N/A",
    departmentName: student.departmentId?.name || "N/A",
    sessionName: student.termId?.name || "N/A",
    acceptedDate,
    guardianPhone: familyInfo?.guardianPhone || "",
  });

  const admissionChallan =
    challan || (await StudentChallanService.getFirstAdmissionChallan(studentId));

  let challanPdfBuffer = null;
  if (admissionChallan) {
    // `challan` may be a live (non-lean) Mongoose document when called from
    // the post-save hook — its Map-typed feeDetails needs converting to a
    // plain object, since Object.entries() on an actual Map instance
    // returns nothing (the entries aren't own-enumerable properties).
    const feeDetails =
      admissionChallan.feeDetails instanceof Map
        ? Object.fromEntries(admissionChallan.feeDetails)
        : admissionChallan.feeDetails || {};

    const semesterNumber =
      admissionChallan.semesterId?.number ?? student.semesterId?.number;

    challanPdfBuffer = await generateChallanPdfBuffer({
      challanNo: admissionChallan.challanNo,
      studentName: personalInfo.fullName || "Student",
      fatherName: familyInfo?.fatherName || "N/A",
      guardianPhone: familyInfo?.guardianPhone || "N/A",
      registrationNo: student.studentId,
      programName: admissionChallan.programId?.name || student.programId?.name,
      semesterLabel: semesterNumber ? `Semester ${semesterNumber}` : "N/A",
      sessionName: admissionChallan.termId?.name || student.termId?.name,
      challanTypeLabel: formatChallanTypeLabel(admissionChallan),
      paymentReference: admissionChallan.paymentReference,
      dueDate: admissionChallan.dueDate,
      feeDetails,
      originalTotal: admissionChallan.originalTotal,
      fineAmount: admissionChallan.fineAmount,
      arrears: admissionChallan.arrears,
      discountAmount: admissionChallan.discountAmount,
      discountReason: admissionChallan.discountReason,
      scholarshipAmount: admissionChallan.scholarshipAmount,
      netAmount: admissionChallan.netAmount,
    });
  }

  return sendAdmissionAcceptanceEmail(personalInfo.email, {
    fullName: personalInfo.fullName || "Student",
    pdfBuffer,
    challanPdfBuffer,
  });
}
