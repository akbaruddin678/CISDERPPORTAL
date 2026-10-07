import { useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { useResendAdmissionEmailMutation } from "../services/studentApi";

// Only offered on the Accepted bucket — the congratulations email (with the
// PDF admission letter) is already sent automatically at promotion time
// (see promoteStudent on the backend); this just lets staff re-trigger the
// exact same email/letter on demand, e.g. if the student says it never
// arrived.
export const useResendAdmissionEmailAction = () => {
  const { openAlert } = useGlobalAlert();
  const [target, setTarget] = useState(null);
  const [resendAdmissionEmailMutation, { isLoading: isResendingEmail }] =
    useResendAdmissionEmailMutation();

  const openResendEmailModal = (student) => setTarget(student);
  const closeResendEmailModal = () => setTarget(null);

  const confirmResendEmail = async () => {
    if (!target) return;
    try {
      const result = await resendAdmissionEmailMutation(target._id).unwrap();
      openAlert({
        message: result?.message || "Admission email sent again.",
        severity: "success",
      });
      closeResendEmailModal();
    } catch (error) {
      openAlert({
        message:
          error?.data?.error ||
          "Failed to resend the admission email — please try again.",
        severity: "error",
      });
    }
  };

  return {
    resendEmailTarget: target,
    isResendEmailModalOpen: Boolean(target),
    openResendEmailModal,
    closeResendEmailModal,
    confirmResendEmail,
    isResendingEmail,
  };
};
