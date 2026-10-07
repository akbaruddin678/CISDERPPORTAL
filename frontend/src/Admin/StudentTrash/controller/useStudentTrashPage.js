import { useState, useCallback, useMemo } from "react";
import {
  useGetStudentTrashListQuery,
  useRestoreStudentMutation,
  usePermanentlyDeleteStudentMutation,
} from "../../Admission/services/studentTrashApi";
import { exportRowsToPDF, exportRowsToExcel } from "../../Admission/common/pipelineExport";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";

const EXPORT_COLUMNS = [
  { header: "Name", value: (r) => r.snapshot?.personalInfo?.fullName || "Unknown" },
  { header: "Reg No", value: (r) => r.snapshot?.studentProfile?.studentId || "N/A" },
  { header: "Deleted By", value: (r) => r.trashedBy?.email || "N/A" },
  {
    header: "Deleted On",
    value: (r) => new Date(r.trashedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
  },
  { header: "Remark", value: (r) => r.trashRemark || "" },
  { header: "Purge In (Days)", value: (r) => r.daysRemaining },
];

// Deleted-student audit trail — moved out of the Admission side's own
// Student Management screen so it lives as its own Admin-only page
// (/admin/student-trash), same as this codebase's other cross-cutting
// admin tools (Activity Log, Active Sessions). Not level-filtered, so a
// deleted College student still shows up here even though College is
// excluded from the Admission side's active student directory.
export const useStudentTrashPage = () => {
  const { openAlert } = useGlobalAlert();

  const {
    data: trashData,
    isFetching: isTrashLoading,
    refetch: refetchTrash,
  } = useGetStudentTrashListQuery();
  const trashRecords = useMemo(() => trashData?.data || [], [trashData]);

  const [restoringId, setRestoringId] = useState(null);
  const [restoreStudentMutation, { isLoading: isRestoring }] = useRestoreStudentMutation();
  const restoreStudent = useCallback(
    async (trashId) => {
      setRestoringId(trashId);
      try {
        await restoreStudentMutation(trashId).unwrap();
        openAlert({ message: "Student restored successfully.", severity: "success" });
        refetchTrash();
      } catch (error) {
        openAlert({
          message: error.data?.message || "Failed to restore this student.",
          severity: "error",
        });
      } finally {
        setRestoringId(null);
      }
    },
    [restoreStudentMutation, refetchTrash, openAlert],
  );

  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState(null);
  const [permanentDeleteRemark, setPermanentDeleteRemark] = useState("");
  const [permanentlyDeleteStudentMutation, { isLoading: isPermanentDeleting }] =
    usePermanentlyDeleteStudentMutation();

  const openPermanentDeleteModal = useCallback((record) => {
    setPermanentDeleteTarget(record);
    setPermanentDeleteRemark("");
  }, []);
  const closePermanentDeleteModal = useCallback(() => {
    setPermanentDeleteTarget(null);
    setPermanentDeleteRemark("");
  }, []);

  const confirmPermanentDelete = useCallback(async () => {
    if (!permanentDeleteRemark.trim()) {
      openAlert({ message: "Please provide a remark before permanently deleting.", severity: "warning" });
      return;
    }
    try {
      await permanentlyDeleteStudentMutation({
        trashId: permanentDeleteTarget._id,
        remark: permanentDeleteRemark.trim(),
      }).unwrap();
      openAlert({ message: "Student permanently deleted.", severity: "success" });
      closePermanentDeleteModal();
      refetchTrash();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to permanently delete this student.",
        severity: "error",
      });
    }
  }, [permanentDeleteTarget, permanentDeleteRemark, permanentlyDeleteStudentMutation, closePermanentDeleteModal, refetchTrash, openAlert]);

  const exportPDF = useCallback(() => {
    if (trashRecords.length === 0) {
      openAlert({ message: "No trashed students to export.", severity: "warning" });
      return;
    }
    exportRowsToPDF({
      title: "Deleted Students",
      columns: EXPORT_COLUMNS,
      rows: trashRecords,
      filename: `Student_Trash_${new Date().toISOString().slice(0, 10)}.pdf`,
    });
  }, [trashRecords, openAlert]);

  const exportExcel = useCallback(() => {
    if (trashRecords.length === 0) {
      openAlert({ message: "No trashed students to export.", severity: "warning" });
      return;
    }
    exportRowsToExcel({
      columns: EXPORT_COLUMNS,
      rows: trashRecords,
      filename: `Student_Trash_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: "Student Trash",
    });
  }, [trashRecords, openAlert]);

  return {
    trashRecords,
    isTrashLoading,
    restoreStudent,
    isRestoring,
    restoringId,
    permanentDeleteTarget,
    permanentDeleteRemark,
    setPermanentDeleteRemark,
    openPermanentDeleteModal,
    closePermanentDeleteModal,
    confirmPermanentDelete,
    isPermanentDeleting,
    exportPDF,
    exportExcel,
  };
};
