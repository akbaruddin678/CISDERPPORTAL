import { useState } from "react";
import { useDispatch } from "react-redux";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { useCompleteAdmissionMutation } from "../services/admissionTrashApi";
import { studentApi } from "../services/studentApi";

// Only used on the Fee Paid bucket — "Mark Complete" archives the student
// into CompletedAdmissionRecord (powers the dashboard widget) and
// permanently clears the now-redundant Admission application record. The
// student profile itself is never touched. Requires an explicit
// confirmation tick + remark before it will submit, mirroring the
// remark-required pattern used by the delete flow.
export const useCompleteAdmissionAction = () => {
  const { openAlert } = useGlobalAlert();
  const dispatch = useDispatch();
  const [target, setTarget] = useState(null);
  const [remark, setRemark] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [completeAdmissionMutation, { isLoading: isCompleting }] = useCompleteAdmissionMutation();

  const openCompleteModal = (student) => {
    setTarget(student);
    setRemark("");
    setConfirmed(false);
  };
  const closeCompleteModal = () => {
    setTarget(null);
    setRemark("");
    setConfirmed(false);
  };

  const confirmComplete = async () => {
    if (!confirmed) {
      openAlert({
        message: "Please confirm the student has completed admission before continuing.",
        severity: "warning",
      });
      return;
    }
    if (!remark.trim()) {
      openAlert({ message: "Please provide a remark before continuing.", severity: "warning" });
      return;
    }
    try {
      const admissionId = target.createdFromApplicationId;
      await completeAdmissionMutation({ admissionId, remark: remark.trim(), confirmed: true }).unwrap();
      // completeAdmissionMutation lives in a separate RTK Query API slice
      // (admissionTrashApi) from the one backing this pipeline's student
      // list (studentApi) — its own invalidatesTags can't reach across
      // slices, so without this the completed student would keep showing
      // in the Fee Paid / Admission Complete tabs until a full page reload.
      dispatch(studentApi.util.invalidateTags(["Student"]));
      openAlert({
        message: "Admission marked complete. The application record has been cleared.",
        severity: "success",
      });
      closeCompleteModal();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to mark this admission complete — please try again.",
        severity: "error",
      });
    }
  };

  return {
    completeTarget: target,
    isCompleteModalOpen: Boolean(target),
    openCompleteModal,
    closeCompleteModal,
    completeRemark: remark,
    setCompleteRemark: setRemark,
    completeConfirmed: confirmed,
    setCompleteConfirmed: setConfirmed,
    confirmComplete,
    isCompleting,
  };
};
