import { useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { useGetClearanceQuery, useRunStepMutation } from "../api/graduationApi";
import { errorText } from "../common/graduationHelpers";

// Drives the clearance detail drawer for whichever stage the clearance is in.
// All the "may this be approved?" rules live on the server; this only mirrors
// them so the buttons explain themselves before the user clicks.
const useClearanceDrawer = ({ id, notify }) => {
  const { currentData, isFetching, error, refetch } = useGetClearanceQuery(id || skipToken);
  const [runStep, { isLoading: isActing }] = useRunStepMutation();

  const [confirmations, setConfirmations] = useState({});
  const [remarks, setRemarks] = useState("");
  const [officeRemarks, setOfficeRemarks] = useState({});
  const [feeReceived, setFeeReceived] = useState(false);
  const [dialog, setDialog] = useState(null); // { kind, officeKey? }

  const data = currentData?.data || null;
  const clearance = data?.clearance || null;
  const permissions = data?.permissions || {};
  const stage = clearance?.currentStage;

  const checks = useMemo(() => {
    if (!data) return [];
    if (stage === "hod") return data.report?.checks || [];
    if (stage === "exam") return [...(data.report?.checks || []), ...(data.examChecks || [])];
    return [];
  }, [data, stage]);

  const blockers = checks.filter((c) => c.status === "fail");
  const missingRemarks = checks.filter(
    (c) => c.status === "unverified" && !(confirmations[c.key] || "").trim(),
  );
  const canSubmitChecks = checks.length > 0 && blockers.length === 0 && missingRemarks.length === 0;

  const resetForm = () => {
    setConfirmations({});
    setRemarks("");
    setFeeReceived(false);
    setDialog(null);
  };

  const run = async (path, body, okMessage) => {
    try {
      await runStep({ id, path, body }).unwrap();
      notify(okMessage);
      resetForm();
      return true;
    } catch (err) {
      notify(errorText(err), "error");
      return false;
    }
  };

  const activeConfirmations = () =>
    Object.fromEntries(
      checks
        .filter((c) => c.status === "unverified")
        .map((c) => [c.key, (confirmations[c.key] || "").trim()]),
    );

  return {
    data,
    clearance,
    permissions,
    stage,
    isLoading: isFetching && !data,
    isRefreshing: isFetching && !!data,
    errorMessage: error ? errorText(error) : "",
    refetch,
    isActing,

    checks,
    blockers,
    missingRemarks,
    canSubmitChecks,
    confirmations,
    setConfirmation: (key, value) => setConfirmations((prev) => ({ ...prev, [key]: value })),
    remarks,
    setRemarks,
    officeRemarks,
    setOfficeRemark: (key, value) => setOfficeRemarks((prev) => ({ ...prev, [key]: value })),
    feeReceived,
    setFeeReceived,

    dialog,
    openDialog: setDialog,
    closeDialog: () => setDialog(null),

    submitHod: () =>
      run("hod/submit", { confirmations: activeConfirmations(), remarks }, "Submitted to the Examination Office."),
    approveExam: () =>
      run("exam/approve", { confirmations: activeConfirmations(), remarks }, "Approved. Auxiliary offices can now clear the student."),
    approveOffice: (key) =>
      run(`offices/${key}/approve`, { remarks: officeRemarks[key] || "" }, "Office cleared."),
    approveFinance: () =>
      run("finance/approve", { feeReceived, remarks }, "Finance cleared. Sent to the Registrar."),
    finalize: () =>
      run("registrar/finalize", { remarks }, "Student graduated and added to the graduate list."),

    // The dialog asks for the reason, then routes it to the right endpoint.
    confirmDialog: async (reason) => {
      if (!dialog) return;
      const map = {
        "exam-reject": ["exam/reject", { remarks: reason }, "Returned to the Head of Department."],
        "office-reject": [`offices/${dialog.officeKey}/reject`, { remarks: reason }, "Marked as not cleared."],
        "finance-reject": ["finance/reject", { remarks: reason }, "Finance clearance withheld."],
        "registrar-reject": ["registrar/reject", { remarks: reason }, "Final approval withheld."],
        cancel: ["cancel", { reason }, "Clearance cancelled."],
      };
      const [path, body, msg] = map[dialog.kind];
      await run(path, body, msg);
    },
  };
};

export default useClearanceDrawer;
