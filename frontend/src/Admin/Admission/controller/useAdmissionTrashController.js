import { useMemo, useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetTrashListQuery,
  useRestoreAdmissionMutation,
  usePermanentlyDeleteAdmissionMutation,
} from "../services/admissionTrashApi";
import { downloadSnapshotPdf } from "../common/buildSnapshotPdf";

export const useAdmissionTrashController = () => {
  const { openAlert } = useGlobalAlert();
  const [tab, setTab] = useState("trashed");
  const { data, isFetching, refetch } = useGetTrashListQuery(tab);
  const trashRecords = useMemo(() => data?.data || [], [data]);

  const [restoreAdmission, { isLoading: isRestoring }] = useRestoreAdmissionMutation();
  const handleRestore = async (record) => {
    try {
      await restoreAdmission(record._id).unwrap();
      openAlert({ message: "Student record restored successfully.", severity: "success" });
    } catch (error) {
      openAlert({ message: error.data?.message || "Failed to restore record.", severity: "error" });
    }
  };

  const handleRedownload = (record) => {
    downloadSnapshotPdf(record.snapshot);
  };

  const [permanentTarget, setPermanentTarget] = useState(null);
  const [permanentRemark, setPermanentRemark] = useState("");
  const openPermanentDeleteModal = (record) => {
    setPermanentTarget(record);
    setPermanentRemark("");
  };
  const closePermanentDeleteModal = () => {
    setPermanentTarget(null);
    setPermanentRemark("");
  };

  const [permanentlyDeleteAdmission, { isLoading: isPermanentlyDeleting }] =
    usePermanentlyDeleteAdmissionMutation();

  const confirmPermanentDelete = async () => {
    if (!permanentRemark.trim()) {
      openAlert({ message: "Please provide a remark before permanently deleting.", severity: "warning" });
      return;
    }
    try {
      await permanentlyDeleteAdmission({
        trashId: permanentTarget._id,
        remark: permanentRemark.trim(),
      }).unwrap();
      openAlert({
        message: "Student record permanently deleted. The applicant may now register again.",
        severity: "success",
      });
      closePermanentDeleteModal();
    } catch (error) {
      openAlert({ message: error.data?.message || "Failed to permanently delete record.", severity: "error" });
    }
  };

  return {
    tab,
    setTab,
    trashRecords,
    isLoading: isFetching,
    refetch,
    handleRestore,
    isRestoring,
    handleRedownload,

    permanentTarget,
    isPermanentModalOpen: Boolean(permanentTarget),
    openPermanentDeleteModal,
    closePermanentDeleteModal,
    permanentRemark,
    setPermanentRemark,
    confirmPermanentDelete,
    isPermanentlyDeleting,
  };
};
