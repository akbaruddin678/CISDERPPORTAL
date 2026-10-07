import { useState, useMemo } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { useGetDepartmentsQuery } from "../../../components/catalog/api/catalogApi";
import {
  useGetAllCoursesQuery,
  useCreateSingleCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
} from "../../Exam/api/courseRegistrationApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  if (obj.data?.data && Array.isArray(obj.data.data)) return obj.data.data;
  return [];
};

// Admin's course-creation screen — replaces the old Course Coordinator draft
// step now that the approval chain (HOD/Academia/VC) is gone. Admin can
// create a course for any department directly; Registrar assigns the code
// separately, which is what activates it.
const useCourseCatalogController = ({ user }) => {
  const { openAlert } = useGlobalAlert();
  const userId = user?._id || user?.id || "";

  const { data: coursesRes, isLoading: isFetchingCourses } =
    useGetAllCoursesQuery();
  const { data: deptsRes } = useGetDepartmentsQuery();

  const [createCourse, { isLoading: isCreating }] =
    useCreateSingleCourseMutation();
  const [updateCourse, { isLoading: isEditing }] = useUpdateCourseMutation();
  const [deleteCourse] = useDeleteCourseMutation();

  const allCourses = extractArray(coursesRes);
  const departments = extractArray(deptsRes);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [viewContentOpen, setViewContentOpen] = useState(false);
  const [contentToView, setContentToView] = useState("");

  const initialForm = {
    title: "",
    owningDepartmentId: "",
    theory: 3,
    lab: 0,
    level: "UG",
    courseContent: "",
  };
  const [form, setForm] = useState(initialForm);

  const filteredCourses = useMemo(() => {
    return allCourses.filter((course) =>
      (course.title || "").toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [allCourses, searchQuery]);

  const handleViewContent = (content) => {
    setContentToView(content || "No course content provided yet.");
    setViewContentOpen(true);
  };

  const handleEditClick = (course) => {
    setEditingId(course._id);
    setForm({
      title: course.title,
      owningDepartmentId:
        course.owningDepartmentId?._id || course.owningDepartmentId || "",
      theory: course.creditHours?.theory || 0,
      lab: course.creditHours?.lab || 0,
      level: course.level || "UG",
      courseContent: course.courseContent || "",
    });
    setIsModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const handleSaveDraft = async (submittedForm) => {
    if (!submittedForm.title || !submittedForm.owningDepartmentId) {
      return openAlert({
        message: "Title and Class are required.",
        severity: "warning",
      });
    }

    try {
      const payload = {
        title: submittedForm.title,
        owningDepartmentId: submittedForm.owningDepartmentId,
        level: submittedForm.level,
        proposedBy: userId,
        courseContent: submittedForm.courseContent,
        creditHours: {
          theory: Number(submittedForm.theory),
          lab: Number(submittedForm.lab),
        },
      };

      if (editingId) {
        await updateCourse({ id: editingId, payload }).unwrap();
        openAlert({
          message: "Course updated successfully",
          severity: "success",
        });
      } else {
        await createCourse(payload).unwrap();
        openAlert({
          message: "Course created — ready for Registrar to assign a code.",
          severity: "success",
        });
      }

      setIsModalOpen(false);
      setForm(initialForm);
      setEditingId(null);
    } catch (error) {
      if (error?.name === "AbortError") return;
      openAlert({
        message:
          error?.data?.message || error?.message || "Failed to save course",
        severity: "error",
      });
    }
  };

  const handleDelete = async (id, status) => {
    if (status === "ACTIVE")
      return openAlert({
        message: "Cannot delete an active course.",
        severity: "warning",
      });
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await deleteCourse(id).unwrap();
        openAlert({ message: "Course deleted successfully", severity: "success" });
      } catch (error) {
        if (error?.name === "AbortError") return;
        openAlert({ message: "Failed to delete course", severity: "error" });
      }
    }
  };

  return {
    departments,
    filteredCourses,
    isFetchingCourses,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    setIsModalOpen,
    form,
    setForm,
    handleSaveDraft,
    handleOpenCreateModal,
    handleEditClick,
    isSaving: isCreating || isEditing,
    handleDelete,
    editingId,
    viewContentOpen,
    setViewContentOpen,
    contentToView,
    handleViewContent,
  };
};

export default useCourseCatalogController;
