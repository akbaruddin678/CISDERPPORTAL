import { useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { useTrashAdmissionMutation } from "../services/admissionTrashApi";
import { downloadSnapshotPdf } from "./buildSnapshotPdf";

// Shared by every pipeline tab (Incomplete/Complete/Accepted/Challan
// Generated/Fee Overdue) — a single remark-required confirmation flow
// that soft-deletes (trashes) an admission record, auto-downloads the
// full record, and shows a clear confirmation message. Nothing is removed
// from the UI optimistically — the list only updates once the mutation
// succeeds.
//
// `scope` ("admission_only" | "both") controls whether the linked
// StudentProfile gets trashed along with the Admission — defaults to the
// safer "admission_only" and only matters on tabs that actually offer the
// choice (Accepted/Challan Generated); the backend enforces the same rule
// server-side regardless of what the client sends (a paid/overdue student
// can never be deleted with scope "both").
export const useDeleteAdmissionAction = () => {
  const { openAlert } = useGlobalAlert();
  const [target, setTarget] = useState(null);
  const [remark, setRemark] = useState("");
  const [scope, setScope] = useState("admission_only");
  const [trashAdmission, { isLoading: isDeleting }] = useTrashAdmissionMutation();

  const openDeleteModal = (admission) => {
    setTarget(admission);
    setRemark("");
    setScope("admission_only");
  };
  const closeDeleteModal = () => {
    setTarget(null);
    setRemark("");
    setScope("admission_only");
  };

  const confirmDelete = async () => {
    if (!remark.trim()) {
      openAlert({ message: "Please provide a remark before deleting.", severity: "warning" });
      return;
    }
    try {
      const admissionId = target.id || target._id;
      const result = await trashAdmission({ admissionId, remark: remark.trim(), scope }).unwrap();
      downloadSnapshotPdf(result.data?.snapshot);
      openAlert({
        message:
          scope === "both"
            ? "Student record deleted and the full record has been downloaded."
            : "Admission application deleted. The student profile was left untouched.",
        severity: "success",
      });
      closeDeleteModal();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to delete this record — please try again.",
        severity: "error",
      });
    }
  };

  return {
    deleteTarget: target,
    isDeleteModalOpen: Boolean(target),
    openDeleteModal,
    closeDeleteModal,
    remark,
    setRemark,
    deleteScope: scope,
    setDeleteScope: setScope,
    confirmDelete,
    isDeleting,
  };
};
