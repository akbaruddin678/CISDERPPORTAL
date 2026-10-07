import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetAllStudentsQuery,
  useUpdateStudentRemarkMutation,
} from "../services/studentApi";
import {
  useGetAdmissionChallanStatusBatchQuery,
  useGetScholarshipStatusBatchQuery,
  useReAdmitStudentMutation,
} from "../../accountant/api/accountantstudentApi";
import { useLazyGetChallansByStudentIdQuery } from "../../accountant/api/studentChallanApi";
import {
  buildChallanPage,
  openPrintWindow,
} from "../../accountant/common/ChallanPrintTemplate";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { useDeleteAdmissionAction } from "../common/useDeleteAdmissionAction";
import { useCompleteAdmissionAction } from "../common/useCompleteAdmissionAction";
import { useAssignScholarshipAction } from "../common/useAssignScholarshipAction";
import { useResendAdmissionEmailAction } from "../common/useResendAdmissionEmailAction";
import { useEditRemarkAction } from "../common/useEditRemarkAction";
import { exportRowsToPDF, exportRowsToExcel } from "../common/pipelineExport";

const EXPORT_COLUMNS = [
  { header: "Reg No", value: (s) => s.studentId },
  { header: "Student Name", value: (s) => s.personalInfo?.fullName },
  { header: "Phone", value: (s) => s.personalInfo?.phone },
  { header: "Guardian Phone", value: (s) => s.familyInfo?.guardianPhone },
  { header: "Program", value: (s) => s.program?.name },
  { header: "Session", value: (s) => s.session?.name },
  { header: "Challan Status", value: (s) => (s.challanStatus || "not_generated").replace("_", " ") },
  { header: "Remark", value: (s) => s.remark || "" },
];

// Grace period must match the backend's own
// (studentChallan.service.js::autoCancelAdmissionsForOverdueChallans) —
// this is display-only math, the actual cancellation always happens
// server-side via the nightly cron.
const GRACE_PERIOD_DAYS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Shared by the Accepted / Challan Generated / Fee Paid / Fee Overdue /
// Cancelled Non-Payment tabs — fetches the real accepted+promoted
// (first-semester "new admission") dataset and its real challan status ONE
// time, then buckets it in memory into five mutually-exclusive groups.
// Mirrors useNewAdmissions.js's data sourcing exactly (same query hooks,
// same "first semester = new admission" convention) so these numbers never
// disagree with the accountant's own screens.
export const useAdmissionPipelineController = () => {
  const { openAlert } = useGlobalAlert();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: studentsRes, isLoading, isFetching } = useGetAllStudentsQuery(
    { limit: 0, search: debouncedSearch, onlyAcceptedAdmission: true },
    { refetchOnMountOrArgChange: true },
  );
  const rawStudents = useMemo(() => studentsRes?.data?.students || [], [studentsRes]);
  const newAdmissions = useMemo(
    () => rawStudents.filter((s) => (s.semester?.number || 1) === 1),
    [rawStudents],
  );

  const studentIds = useMemo(() => newAdmissions.map((s) => s._id), [newAdmissions]);
  // Admission-fee-only status — "Fee Paid" here means the admission fee
  // itself was paid, not that every challan the student has (tuition,
  // exam, etc.) happens to be paid too.
  const { data: challanStatusRes } = useGetAdmissionChallanStatusBatchQuery(studentIds, {
    skip: studentIds.length === 0,
  });
  const challanStatusMap = useMemo(() => challanStatusRes?.data || {}, [challanStatusRes]);

  // Scholarship status — together with challan status above, decides the
  // "Admission Complete" bucket below. Mirrors
  // backend/src/accountant/services/student.service.js::isAdmissionComplete
  // exactly, so the tab a student ends up in never disagrees with what
  // "Mark Complete" is actually allowed to accept.
  const { data: scholarshipRes } = useGetScholarshipStatusBatchQuery(studentIds, {
    skip: studentIds.length === 0,
  });
  const scholarshipMap = useMemo(() => scholarshipRes?.data || {}, [scholarshipRes]);

  const students = useMemo(
    () =>
      newAdmissions.map((s) => {
        const challanStatus = challanStatusMap[s._id]?.challanStatus || "not_generated";
        const dueDate = challanStatusMap[s._id]?.latestDueDate || null;
        const hasScholarship = !!scholarshipMap[s._id]?.hasScholarship;
        const scholarshipName = scholarshipMap[s._id]?.scholarshipName || null;
        // A scholarship applicant often never gets billed an admission fee
        // at all, whether or not their tuition fee structure has been set
        // up yet — requiring one to exist and be paid would leave them
        // stuck in "Accepted" forever, so this is a second, independent
        // way to be "complete" alongside actually having paid.
        const admissionComplete =
          challanStatus === "paid" || (hasScholarship && challanStatus === "not_generated");
        let daysOverdue = null;
        let daysUntilCancellation = null;
        // Only a genuinely still-unpaid ("overdue") challan is actually
        // heading toward cancellation — a paid challan's due date stays
        // in the past forever after payment, so this must never be
        // computed off dueDate alone (that previously showed "Cancelled
        // in N days" on already-paid challans).
        if (dueDate && challanStatus === "overdue") {
          const due = new Date(dueDate);
          due.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          daysOverdue = Math.round((today - due) / MS_PER_DAY);
          if (daysOverdue > 0) {
            daysUntilCancellation = Math.max(0, GRACE_PERIOD_DAYS - daysOverdue);
          }
        }
        return {
          ...s,
          challanStatus,
          challanPendingAmount: challanStatusMap[s._id]?.pendingAmount || 0,
          challanLatestDueDate: dueDate,
          daysOverdue,
          daysUntilCancellation,
          hasScholarship,
          scholarshipName,
          admissionComplete,
        };
      }),
    [newAdmissions, challanStatusMap, scholarshipMap],
  );

  const buckets = useMemo(
    () => ({
      // A scholarship-complete student (no admission fee ever billed) is
      // done, not "still accepted" — excluded here the same way a paid
      // student already isn't shown as "Challan Generated".
      accepted: students.filter((s) => s.challanStatus === "not_generated" && !s.admissionComplete),
      challanGenerated: students.filter((s) => s.challanStatus === "pending"),
      feePaid: students.filter((s) => s.challanStatus === "paid"),
      // Once cancelled for non-payment, a student moves out of Fee Overdue
      // into its own dedicated tab instead of lingering here forever.
      feeOverdue: students.filter(
        (s) => s.challanStatus === "overdue" && s.admissionLifecycleStatus !== "cancelled_non_payment",
      ),
      cancelledNonPayment: students.filter((s) => s.admissionLifecycleStatus === "cancelled_non_payment"),
      // Superset tab: everyone who has properly paid, PLUS scholarship
      // recipients whose tuition is configured and who were never billed
      // an admission fee to begin with (see isAdmissionComplete on the
      // backend, mirrored in the admissionComplete field above).
      admissionComplete: students.filter((s) => s.admissionComplete),
    }),
    [students],
  );

  const [reAdmitStudentMutation, { isLoading: isReAdmitting }] = useReAdmitStudentMutation();
  const reAdmitStudent = async (student) => {
    try {
      await reAdmitStudentMutation(student._id).unwrap();
      openAlert({ message: "Student re-admitted.", severity: "success" });
    } catch (error) {
      openAlert({
        message: error.data?.error || error.data?.message || "Failed to re-admit the student.",
        severity: "error",
      });
    }
  };

  const [triggerGetChallansByStudent] = useLazyGetChallansByStudentIdQuery();
  const [isPrinting, setIsPrinting] = useState(false);

  const printChallan = async (student) => {
    const printWin = window.open("", "_blank");
    setIsPrinting(true);
    try {
      const result = await triggerGetChallansByStudent(student._id).unwrap();
      const printableChallans = (result?.data?.challans || []).filter(
        (c) => !c.isDeleted && c.status !== "cancelled" && c.status !== "merged",
      );
      if (printableChallans.length === 0) {
        printWin?.close();
        openAlert({ message: "No generated challans found for this student.", severity: "warning" });
        return;
      }
      openPrintWindow(
        printableChallans.map(buildChallanPage).join(""),
        `Fee Challans - ${student.personalInfo?.fullName || student.studentId}`,
        printWin,
      );
    } catch (error) {
      printWin?.close();
      openAlert({
        message: error.data?.error || error.data?.message || "Failed to fetch challans for printing.",
        severity: "error",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  // Delete needs an {id, name} shape matching what DeleteAdmissionModal
  // expects — StudentProfile records use studentId as the display id, and
  // deleting must target the ORIGINATING Admission, not the StudentProfile,
  // since the trash endpoint operates on admissionId.
  const deleteAction = useDeleteAdmissionAction();
  const openDeleteModalForStudent = (student) => {
    deleteAction.openDeleteModal({
      id: student.createdFromApplicationId,
      name: student.personalInfo?.fullName || student.studentId,
    });
  };

  // "Mark Complete" — only offered on the Fee Paid bucket (enforced by
  // AdmissionListView only passing showComplete there, and by the backend
  // rejecting anything that isn't actually fully paid).
  const completeAction = useCompleteAdmissionAction();

  // Scholarship assignment — only offered on the Accepted bucket (before a
  // challan exists), so it's picked up automatically once one is generated.
  const scholarshipAction = useAssignScholarshipAction();

  // Resend admission email — also only offered on the Accepted bucket.
  const resendEmailAction = useResendAdmissionEmailAction();

  // Edits StudentProfile.remark directly (these students are already
  // promoted, so there's no separate Admission-side remark to edit here).
  const remarkAction = useEditRemarkAction(useUpdateStudentRemarkMutation, {
    getId: (s) => s._id,
    getName: (s) => s.personalInfo?.fullName || s.studentId,
  });

  // View Application navigates to the ORIGINATING Admission record (same
  // detail page used by the Complete tab), not a StudentProfile page —
  // there is no separate "view" for the promoted student here.
  const viewApplication = (student) => {
    navigate(`/admission-office/admission-detail/${student.createdFromApplicationId}`);
  };

  // Export functions are generic (students/title passed in) since this one
  // hook instance backs all 5 buckets (Accepted/Challan Generated/Fee
  // Paid/Fee Overdue/Cancelled Non-Payment) at once — each tab exports
  // only its own bucket.
  const exportPDF = (bucketStudents, title) => {
    exportRowsToPDF({
      title,
      columns: EXPORT_COLUMNS,
      rows: bucketStudents,
      filename: `${title.replace(/\s+/g, "_")}_Admissions.pdf`,
    });
  };

  const exportExcel = (bucketStudents, title) => {
    exportRowsToExcel({
      columns: EXPORT_COLUMNS,
      rows: bucketStudents,
      filename: `${title.replace(/\s+/g, "_")}_Admissions_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: title.slice(0, 31),
    });
  };

  return {
    buckets,
    isLoading: isLoading || isFetching,
    searchQuery,
    setSearchQuery,
    printChallan,
    isPrinting,
    viewApplication,
    exportPDF,
    exportExcel,
    reAdmitStudent,
    isReAdmitting,
    ...deleteAction,
    openDeleteModal: openDeleteModalForStudent,
    ...completeAction,
    ...scholarshipAction,
    ...resendEmailAction,
    ...remarkAction,
  };
};
