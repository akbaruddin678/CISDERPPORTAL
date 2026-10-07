import { useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetProgramsByDepartmentQuery,
} from "../../../components/catalog/api/catalogApi";
import {
  useGetWithdrawableRegistrationsQuery,
  useCreateCourseWithdrawalMutation,
} from "../api/courseWithdrawalApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

// HOD is the sole decision-maker here — one click withdraws a student from
// a course, no separate submit-then-approve chain. Registrar only ever
// reads the resulting register afterwards.
const useCourseWithdrawalsController = ({ userDepartmentId }) => {
  const { openAlert } = useGlobalAlert();
  const safeDeptId =
    typeof userDepartmentId === "object" && userDepartmentId !== null
      ? userDepartmentId._id
      : userDepartmentId;

  const [programId, setProgramId] = useState("");

  const { data: programsRes, isFetching: isFetchingPrograms } =
    useGetProgramsByDepartmentQuery(safeDeptId || skipToken, { skip: !safeDeptId });
  const programs = useMemo(() => extractArray(programsRes), [programsRes]);

  const { data: registrationsRes, isFetching, refetch } = useGetWithdrawableRegistrationsQuery(
    { programId },
    { skip: !programId, refetchOnMountOrArgChange: true },
  );
  const registrations = useMemo(() => extractArray(registrationsRes), [registrationsRes]);

  const [createWithdrawal, { isLoading: isSubmitting }] = useCreateCourseWithdrawalMutation();

  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawalType, setWithdrawalType] = useState("Drop");
  const [reason, setReason] = useState("");

  const openWithdrawModal = (registration) => {
    setSelectedRegistration(registration);
    setWithdrawalType("Drop");
    setReason("");
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRegistration(null);
  };

  const handleConfirmWithdraw = async () => {
    if (!reason.trim()) {
      return openAlert({ message: "Please provide a reason.", severity: "warning" });
    }
    try {
      await createWithdrawal({
        studentCourseRegistrationId: selectedRegistration._id,
        withdrawalType,
        reason,
      }).unwrap();
      openAlert({ message: "Student withdrawn from course.", severity: "success" });
      closeModal();
      refetch();
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to process withdrawal.",
        severity: "error",
      });
    }
  };

  return {
    programs,
    isFetchingPrograms,
    programId,
    setProgramId,

    registrations,
    isFetching,
    refetch,

    selectedRegistration,
    isModalOpen,
    openWithdrawModal,
    closeModal,
    withdrawalType,
    setWithdrawalType,
    reason,
    setReason,
    handleConfirmWithdraw,
    isSubmitting,
  };
};

export default useCourseWithdrawalsController;
