import { useEffect, useState } from "react";
import { useGetProgramsQuery, useGetTermsQuery } from "../../../components/catalog/api/catalogApi";
import {
  useGetRegulationsQuery,
  useSaveRegulationMutation,
  useLockRegulationMutation,
  useUnlockRegulationMutation,
} from "../api/programRegulationApi";
import { getUserRoles } from "../services/getAuthToken";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";

const extractArray = (obj) => (Array.isArray(obj?.data) ? obj.data : []);

const FIELDS = [
  { key: "minTotalCredits", label: "Minimum total credits to graduate" },
  { key: "minDurationSemesters", label: "Minimum duration (semesters)" },
  { key: "maxDurationSemesters", label: "Maximum duration / time-bar (semesters)" },
  { key: "minCreditsPerSemester", label: "Minimum credits per semester" },
  { key: "maxCreditsPerSemester", label: "Maximum credits per semester" },
  { key: "maxSummerCredits", label: "Maximum credits — summer/short term" },
];
const EMPTY_FORM = Object.fromEntries(FIELDS.map((f) => [f.key, ""]));

// Program Regulations: pick a Program + Batch (admission term), edit the six
// limits, lock them once Academic Policy is happy, or (VC/Dean-tier roles
// only) unlock a locked set. Server is the real authority on every
// permission — the role reads here are just for hiding buttons the caller
// couldn't use anyway.
export const useProgramRegulationController = () => {
  const { openAlert } = useGlobalAlert();
  const roles = getUserRoles();
  const canBypassLock = roles.some((r) => ["admin", "vc", "vice_vc"].includes(r));

  const [programId, setProgramId] = useState("");
  const [admissionTermId, setAdmissionTermId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: progRes } = useGetProgramsQuery({ context: "university", limit: 200 });
  const programs = extractArray(progRes);
  const { data: termRes } = useGetTermsQuery({ excludeLevel: "HSSC" });
  const terms = extractArray(termRes);

  const skip = !programId || !admissionTermId;
  const { data: regRes, isFetching: isLoading } = useGetRegulationsQuery(
    skip ? { programId: "___" } : { programId, admissionTermId },
    { skip },
  );
  const existing = !skip ? extractArray(regRes)[0] || null : null;

  useEffect(() => {
    if (existing) {
      setForm(
        Object.fromEntries(FIELDS.map((f) => [f.key, existing[f.key] ?? ""])),
      );
    } else {
      setForm(EMPTY_FORM);
    }
  }, [existing]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const [saveRegulation, { isLoading: isSaving }] = useSaveRegulationMutation();
  const [lockRegulation, { isLoading: isLocking }] = useLockRegulationMutation();
  const [unlockRegulation, { isLoading: isUnlocking }] = useUnlockRegulationMutation();

  const isLocked = !!existing?.isLocked;
  const canEdit = !isLocked;

  const save = async () => {
    try {
      await saveRegulation({
        programId,
        admissionTermId,
        ...Object.fromEntries(FIELDS.map((f) => [f.key, form[f.key] === "" ? undefined : Number(form[f.key])])),
      }).unwrap();
      openAlert({ message: "Program Regulations saved.", severity: "success" });
    } catch (err) {
      openAlert({ message: err?.data?.message || "Failed to save.", severity: "error" });
    }
  };

  const lock = async () => {
    if (!existing?._id) return;
    try {
      await lockRegulation(existing._id).unwrap();
      openAlert({ message: "Regulations locked.", severity: "success" });
    } catch (err) {
      openAlert({ message: err?.data?.message || "Failed to lock.", severity: "error" });
    }
  };

  const unlock = async () => {
    if (!existing?._id) return;
    try {
      await unlockRegulation(existing._id).unwrap();
      openAlert({ message: "Regulations unlocked.", severity: "success" });
    } catch (err) {
      openAlert({ message: err?.data?.message || "Failed to unlock.", severity: "error" });
    }
  };

  return {
    programs,
    programId,
    setProgramId,
    terms,
    admissionTermId,
    setAdmissionTermId,
    fields: FIELDS,
    form,
    setField,
    existing,
    isLoading,
    isLocked,
    canEdit,
    canBypassLock,
    isSaving,
    isLocking,
    isUnlocking,
    save,
    lock,
    unlock,
  };
};

export default useProgramRegulationController;
