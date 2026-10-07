import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useGlobalAlert } from "../../../../shared/Alert/context/AlertContext";
import {
  useGetAssignmentByIdQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useExtendDueDateMutation,
  useDeleteAssignmentMutation,
} from "../api/assignmentsApi";
import { classifyFileType } from "../../lectures/utils/fileTypeMeta";

const toLocalInputValue = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const defaultDueDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(23, 59, 0, 0);
  return toLocalInputValue(d);
};

const blankForm = () => ({
  title: "",
  instructions: "",
  totalMarks: "",
  dueDate: defaultDueDate(),
  allowLateSubmission: false,
  status: "Published",
});

const useAssignmentEditorController = () => {
  const { assignmentId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { openAlert } = useGlobalAlert();

  const isNew = assignmentId === "new";
  const queryCourseId = searchParams.get("courseId") || "";

  const {
    data: assignmentRes,
    isFetching: isFetchingAssignment,
  } = useGetAssignmentByIdQuery(assignmentId, { skip: isNew });

  const assignment = assignmentRes?.data || null;
  const courseAssignmentId = isNew
    ? queryCourseId
    : assignment?.courseAssignmentId?._id || assignment?.courseAssignmentId;
  const courseInfo = !isNew ? assignment?.courseAssignmentId : null;
  const courseTitle = courseInfo?.courseId?.title || "";
  const courseCode = courseInfo?.courseId?.code || "";
  const courseSection = courseInfo?.section || "";

  const [createAssignment, { isLoading: isCreating }] = useCreateAssignmentMutation();
  const [updateAssignment, { isLoading: isUpdating }] = useUpdateAssignmentMutation();
  const [extendDueDateMutation, { isLoading: isExtending }] = useExtendDueDateMutation();
  const [deleteAssignmentMutation, { isLoading: isDeleting }] = useDeleteAssignmentMutation();

  const [isEditMode, setIsEditMode] = useState(isNew);
  const [form, setForm] = useState(blankForm());
  const [newFiles, setNewFiles] = useState([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState([]);
  const [showExtendDialog, setShowExtendDialog] = useState(false);

  useEffect(() => {
    if (assignment && !isNew) {
      setForm({
        title: assignment.title || "",
        instructions: assignment.instructions || "",
        totalMarks: assignment.totalMarks ?? "",
        dueDate: toLocalInputValue(assignment.dueDate),
        allowLateSubmission: Boolean(assignment.allowLateSubmission),
        status: assignment.status || "Published",
      });
    }
  }, [assignment, isNew]);

  const visibleAttachments = useMemo(
    () => (assignment?.attachments || []).filter((a) => !removedAttachmentIds.includes(a.id)),
    [assignment, removedAttachmentIds],
  );

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []).map((file) => ({
      file,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      fileType: classifyFileType(file),
    }));
    setNewFiles((prev) => [...prev, ...files]);
  };

  const removeNewFile = (id) =>
    setNewFiles((prev) => prev.filter((f) => f.id !== id));

  const removeExistingAttachment = (id) =>
    setRemovedAttachmentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const buildFormData = (statusOverride) => {
    const fd = new FormData();
    fd.append("courseAssignmentId", courseAssignmentId);
    fd.append("title", form.title);
    fd.append("instructions", form.instructions);
    fd.append("totalMarks", form.totalMarks === "" ? "" : String(form.totalMarks));
    fd.append("dueDate", new Date(form.dueDate).toISOString());
    fd.append("allowLateSubmission", String(form.allowLateSubmission));
    fd.append("status", statusOverride || form.status);
    newFiles.forEach((f) => fd.append("files", f.file));
    if (removedAttachmentIds.length > 0) {
      fd.append("removeAttachmentIds", JSON.stringify(removedAttachmentIds));
    }
    return fd;
  };

  const handleSave = async (statusOverride) => {
    if (!form.title.trim()) {
      return openAlert({ message: "Assignment title is required.", severity: "warning" });
    }
    if (!form.dueDate) {
      return openAlert({ message: "Due date is required.", severity: "warning" });
    }
    if (!courseAssignmentId) {
      return openAlert({
        message: "Missing course context — go back and re-open this assignment from the course.",
        severity: "error",
      });
    }

    try {
      if (isNew) {
        const result = await createAssignment(buildFormData(statusOverride)).unwrap();
        openAlert({ message: "Assignment created.", severity: "success" });
        navigate(`/teacher/assignments/${result.data.id}`, { replace: true });
      } else {
        await updateAssignment({
          id: assignmentId,
          courseAssignmentId,
          formData: buildFormData(statusOverride),
        }).unwrap();
        openAlert({ message: "Assignment updated.", severity: "success" });
        setNewFiles([]);
        setRemovedAttachmentIds([]);
        setIsEditMode(false);
      }
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to save assignment.",
        severity: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this assignment permanently? This cannot be undone.")) return;
    try {
      await deleteAssignmentMutation({ id: assignmentId, courseAssignmentId }).unwrap();
      openAlert({ message: "Assignment deleted.", severity: "success" });
      navigate(-1);
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to delete assignment.",
        severity: "error",
      });
    }
  };

  const handleExtendDueDate = async ({ newDueDate, reason }) => {
    try {
      await extendDueDateMutation({
        id: assignmentId,
        courseAssignmentId,
        newDueDate,
        reason,
      }).unwrap();
      openAlert({ message: "Due date extended.", severity: "success" });
      setShowExtendDialog(false);
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to extend due date.",
        severity: "error",
      });
    }
  };

  // Returns wherever the teacher actually came from — the course dashboard's
  // Assignments tab, or the standalone /teacher/assignments list — rather
  // than a hardcoded path that would be wrong for one of those two entry
  // points.
  const handleBack = () => navigate(-1);

  const handleCancelEdit = () => {
    if (assignment) {
      setForm({
        title: assignment.title || "",
        instructions: assignment.instructions || "",
        totalMarks: assignment.totalMarks ?? "",
        dueDate: toLocalInputValue(assignment.dueDate),
        allowLateSubmission: Boolean(assignment.allowLateSubmission),
        status: assignment.status || "Published",
      });
    }
    setNewFiles([]);
    setRemovedAttachmentIds([]);
    setIsEditMode(false);
  };

  return {
    isNew,
    isEditMode,
    setIsEditMode,
    assignment,
    isFetchingAssignment,
    courseTitle,
    courseCode,
    courseSection,
    form,
    updateField,
    newFiles,
    addFiles,
    removeNewFile,
    visibleAttachments,
    removeExistingAttachment,
    isSaving: isCreating || isUpdating,
    isDeleting,
    handleSave,
    handleDelete,
    handleBack,
    handleCancelEdit,
    showExtendDialog,
    setShowExtendDialog,
    handleExtendDueDate,
    isExtending,
  };
};

export default useAssignmentEditorController;
