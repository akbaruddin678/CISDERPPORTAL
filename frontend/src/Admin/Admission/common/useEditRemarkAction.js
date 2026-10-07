import { useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";

// Shared by every Admission Process tab that shows a remark — Incomplete/
// Complete (edits Admission.remark via useUpdateAdmissionRemarkMutation)
// and the 4 pipeline buckets (edits StudentProfile.remark via
// useUpdateStudentRemarkMutation). Rows differ in shape between the two
// (Admission rows use `a.id`/`a.name`, Student rows use `s._id`/
// `s.personalInfo.fullName`), so the caller supplies `getId`/`getName`
// instead of this hook assuming a fixed shape.
export const useEditRemarkAction = (useUpdateRemarkMutation, { getId, getName }) => {
  const { openAlert } = useGlobalAlert();
  const [target, setTarget] = useState(null);
  const [remarkDraft, setRemarkDraft] = useState("");
  const [updateRemark, { isLoading: isSavingRemark }] = useUpdateRemarkMutation();

  const openRemarkModal = (row) => {
    setTarget(row);
    setRemarkDraft(row.remark || "");
  };
  const closeRemarkModal = () => {
    setTarget(null);
    setRemarkDraft("");
  };

  const saveRemark = async () => {
    if (!target) return;
    try {
      await updateRemark({ id: getId(target), remark: remarkDraft.trim() }).unwrap();
      openAlert({ message: "Remark updated.", severity: "success" });
      closeRemarkModal();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to update remark — please try again.",
        severity: "error",
      });
    }
  };

  return {
    remarkTarget: target,
    remarkTargetName: target ? getName(target) : "",
    isRemarkModalOpen: Boolean(target),
    openRemarkModal,
    closeRemarkModal,
    remarkDraft,
    setRemarkDraft,
    saveRemark,
    isSavingRemark,
  };
};
