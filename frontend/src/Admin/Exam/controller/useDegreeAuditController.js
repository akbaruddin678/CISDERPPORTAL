import { useState } from "react";
import { useGetProgramsQuery, useGetTermsQuery } from "../../../components/catalog/api/catalogApi";
import { useRunDegreeAuditMutation } from "../api/degreeAuditApi";
import { errorText, useToast } from "../../Graduation/common/graduationHelpers";

const extractArray = (obj) => (Array.isArray(obj?.data) ? obj.data : []);

// Drives the Controller of Exams' "Degree Audit" screen: pick a Program
// (and optionally one admission batch), run the audit, show a done/
// not-yet-eligible result. One server call per run — no batching needed,
// the backend processes the whole scope in a single request.
export const useDegreeAuditController = () => {
  const [toast, notify] = useToast();
  const [programId, setProgramId] = useState("");
  const [admissionTermId, setAdmissionTermId] = useState("");
  const [result, setResult] = useState(null); // null | { done: [], failed: [] }

  const { data: progRes } = useGetProgramsQuery({ context: "university", limit: 200 });
  const programs = extractArray(progRes);

  const { data: termRes } = useGetTermsQuery({ excludeLevel: "HSSC" });
  const terms = extractArray(termRes);

  const [runDegreeAudit, { isLoading: isRunning }] = useRunDegreeAuditMutation();

  const run = async () => {
    if (!programId) {
      notify("Select a program first.", "error");
      return;
    }
    try {
      const res = await runDegreeAudit({
        programId,
        admissionTermId: admissionTermId || undefined,
      }).unwrap();
      setResult(res.data);
      notify(res.message);
    } catch (err) {
      notify(errorText(err), "error");
    }
  };

  const reset = () => setResult(null);

  return {
    toast,
    programs,
    programId,
    setProgramId,
    terms,
    admissionTermId,
    setAdmissionTermId,
    run,
    isRunning,
    result,
    reset,
  };
};

export default useDegreeAuditController;
