import { useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetScholarshipPlansQuery,
  useApplyStudentScholarshipMutation,
  useApproveStudentScholarshipMutation,
} from "../../accountant/api/scholarshipApi";

// Only used on the Accepted bucket — lets staff assign an active
// scholarship to a student right when they're accepted, before their fee
// challan is ever generated. Reuses the exact same backend/API the
// Accountant side's Scholarship Management screen already uses
// (scholarship.service.js) — "assign" here is just apply-then-approve
// back to back, since the Admission side has no separate review queue.
// Whatever challan gets generated for this student afterwards
// automatically picks up the discount (see studentChallan.service.js /
// singlestudentChallan.service.js, both call
// ScholarshipService.getStudentActiveScholarship at generation time) —
// nothing else needs to be wired up here.
export const useAssignScholarshipAction = () => {
  const { openAlert } = useGlobalAlert();
  const [target, setTarget] = useState(null); // student object
  const [planId, setPlanId] = useState("");

  const { data: plansRes, isFetching: isLoadingPlans } = useGetScholarshipPlansQuery(
    { active: true, limit: 100 },
    { skip: !target },
  );
  const plans = plansRes?.data || [];

  const [applyMutation] = useApplyStudentScholarshipMutation();
  const [approveMutation] = useApproveStudentScholarshipMutation();
  const [isAssigning, setIsAssigning] = useState(false);

  const openAssignModal = (student) => {
    setTarget(student);
    setPlanId("");
  };
  const closeAssignModal = () => {
    setTarget(null);
    setPlanId("");
  };

  const confirmAssign = async () => {
    if (!planId) {
      openAlert({ message: "Please select a scholarship plan.", severity: "warning" });
      return;
    }
    setIsAssigning(true);
    try {
      const applied = await applyMutation({
        studentId: target._id,
        scholarshipPlanId: planId,
      }).unwrap();
      await approveMutation({ id: applied.id }).unwrap();
      openAlert({ message: "Scholarship assigned successfully.", severity: "success" });
      closeAssignModal();
    } catch (error) {
      openAlert({
        message: error.data?.message || error.data?.error || "Failed to assign scholarship.",
        severity: "error",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return {
    scholarshipTarget: target,
    isAssignScholarshipModalOpen: Boolean(target),
    openAssignModal,
    closeAssignModal,
    scholarshipPlans: plans,
    isLoadingScholarshipPlans: isLoadingPlans,
    scholarshipPlanId: planId,
    setScholarshipPlanId: setPlanId,
    confirmAssignScholarship: confirmAssign,
    isAssigningScholarship: isAssigning,
  };
};
