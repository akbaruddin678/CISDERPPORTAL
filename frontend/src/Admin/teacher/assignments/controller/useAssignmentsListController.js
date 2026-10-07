import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalAlert } from "../../../../shared/Alert/context/AlertContext";
import {
  useGetAssignmentsQuery,
  useDeleteAssignmentMutation,
  useExtendDueDateMutation,
} from "../api/assignmentsApi";

const useAssignmentsListController = ({ courseAssignmentId }) => {
  const navigate = useNavigate();
  const { openAlert } = useGlobalAlert();

  const [extendTarget, setExtendTarget] = useState(null); // the assignment object, or null
  const [deletingId, setDeletingId] = useState(null);

  const { data: assignmentsRes, isFetching: isFetchingAssignments } =
    useGetAssignmentsQuery(courseAssignmentId, { skip: !courseAssignmentId });
  const assignments = useMemo(() => assignmentsRes?.data || [], [assignmentsRes]);

  const [deleteAssignmentMutation, { isLoading: isDeleting }] =
    useDeleteAssignmentMutation();
  const [extendDueDateMutation, { isLoading: isExtending }] =
    useExtendDueDateMutation();

  const openCreate = () =>
    navigate(`/teacher/assignments/new?courseId=${courseAssignmentId}`);

  const openEdit = (assignmentId) =>
    navigate(`/teacher/assignments/${assignmentId}`);

  const openExtendDialog = (assignment) => setExtendTarget(assignment);
  const closeExtendDialog = () => setExtendTarget(null);

  const handleExtend = async ({ newDueDate, reason }) => {
    if (!extendTarget) return;
    try {
      await extendDueDateMutation({
        id: extendTarget.id,
        courseAssignmentId,
        newDueDate,
        reason,
      }).unwrap();
      openAlert({ message: "Due date extended.", severity: "success" });
      setExtendTarget(null);
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to extend due date.",
        severity: "error",
      });
    }
  };

  const handleDelete = async (assignment) => {
    if (!window.confirm(`Delete "${assignment.title}" permanently? This cannot be undone.`)) {
      return;
    }
    setDeletingId(assignment.id);
    try {
      await deleteAssignmentMutation({ id: assignment.id, courseAssignmentId }).unwrap();
      openAlert({ message: "Assignment deleted.", severity: "success" });
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to delete assignment.",
        severity: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return {
    assignments,
    isFetchingAssignments,
    openCreate,
    openEdit,
    extendTarget,
    openExtendDialog,
    closeExtendDialog,
    handleExtend,
    isExtending,
    handleDelete,
    isDeleting,
    deletingId,
  };
};

export default useAssignmentsListController;
