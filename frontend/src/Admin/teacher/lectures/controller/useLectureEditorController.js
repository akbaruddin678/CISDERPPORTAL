import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useGlobalAlert } from "../../../../shared/Alert/context/AlertContext";
import {
  useGetLectureByIdQuery,
  useCreateLectureMutation,
  useUpdateLectureMutation,
  useDeleteLectureMutation,
} from "../api/lecturesApi";
import { classifyFileType } from "../utils/fileTypeMeta";

const blankForm = () => ({
  week: "Week 1",
  topic: "",
  description: "",
  notes: "",
});

const useLectureEditorController = () => {
  const { lectureId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { openAlert } = useGlobalAlert();

  const isNew = lectureId === "new";
  const queryCourseId = searchParams.get("courseId") || "";

  const {
    data: lectureRes,
    isFetching: isFetchingLecture,
  } = useGetLectureByIdQuery(lectureId, { skip: isNew });

  const lecture = lectureRes?.data || null;
  const courseAssignmentId = isNew
    ? queryCourseId
    : lecture?.courseAssignmentId?._id || lecture?.courseAssignmentId;
  const courseInfo = !isNew ? lecture?.courseAssignmentId : null;
  const courseTitle = courseInfo?.courseId?.title || "";
  const courseCode = courseInfo?.courseId?.code || "";
  const courseSection = courseInfo?.section || "";

  const [createLecture, { isLoading: isCreating }] = useCreateLectureMutation();
  const [updateLecture, { isLoading: isUpdating }] = useUpdateLectureMutation();
  const [deleteLecture, { isLoading: isDeleting }] = useDeleteLectureMutation();

  const [isEditMode, setIsEditMode] = useState(isNew);
  const [form, setForm] = useState(blankForm());
  const [newFiles, setNewFiles] = useState([]); // [{ file, id, fileType }]
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState([]);

  // Load an existing lecture's fields into the form once it arrives.
  useEffect(() => {
    if (lecture && !isNew) {
      setForm({
        week: lecture.week || "Week 1",
        topic: lecture.topic || "",
        description: lecture.description || "",
        notes: lecture.notes || "",
      });
    }
  }, [lecture, isNew]);

  const visibleAttachments = useMemo(
    () => (lecture?.attachments || []).filter((a) => !removedAttachmentIds.includes(a.id)),
    [lecture, removedAttachmentIds],
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

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("courseAssignmentId", courseAssignmentId);
    fd.append("week", form.week);
    fd.append("topic", form.topic);
    fd.append("description", form.description);
    fd.append("notes", form.notes);
    newFiles.forEach((f) => fd.append("files", f.file));
    if (removedAttachmentIds.length > 0) {
      fd.append("removeAttachmentIds", JSON.stringify(removedAttachmentIds));
    }
    return fd;
  };

  const handleSave = async () => {
    if (!form.topic.trim()) {
      return openAlert({ message: "Lecture topic is required.", severity: "warning" });
    }
    if (!courseAssignmentId) {
      return openAlert({
        message: "Missing course context — go back and re-open this lecture from the course.",
        severity: "error",
      });
    }

    try {
      if (isNew) {
        const result = await createLecture(buildFormData()).unwrap();
        openAlert({ message: "Lecture created.", severity: "success" });
        navigate(`/teacher/lectures/${result.data.id}`, { replace: true });
      } else {
        await updateLecture({
          id: lectureId,
          courseAssignmentId,
          formData: buildFormData(),
        }).unwrap();
        openAlert({ message: "Lecture updated.", severity: "success" });
        setNewFiles([]);
        setRemovedAttachmentIds([]);
        setIsEditMode(false);
      }
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to save lecture.",
        severity: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this lecture permanently? This cannot be undone.")) return;
    try {
      await deleteLecture({ id: lectureId, courseAssignmentId }).unwrap();
      openAlert({ message: "Lecture deleted.", severity: "success" });
      navigate("/teacher/classes");
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to delete lecture.",
        severity: "error",
      });
    }
  };

  const handleBack = () => navigate("/teacher/classes");

  const handleCancelEdit = () => {
    if (lecture) {
      setForm({
        week: lecture.week || "Week 1",
        topic: lecture.topic || "",
        description: lecture.description || "",
        notes: lecture.notes || "",
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
    lecture,
    isFetchingLecture,
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
  };
};

export default useLectureEditorController;
