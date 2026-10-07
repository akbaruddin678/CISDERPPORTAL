import { useState, useMemo } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { useGetDepartmentsQuery } from "../api/examApi"; // Assuming you still need departments from here
import {
  useGetAllCoursesQuery,
  useCreateSingleCourseMutation,
  useBulkCreateCoursesMutation,
  useDeleteCourseMutation,
} from "../api/courseRegistrationApi";

const useCourseRegistrationController = () => {
  const { openAlert } = useGlobalAlert();

  // --- API Hooks ---
  const { data: deptsRes } = useGetDepartmentsQuery();
  const { data: coursesRes, isLoading: isFetchingCourses } =
    useGetAllCoursesQuery();
  const [createCourse, { isLoading: isCreating }] =
    useCreateSingleCourseMutation();
  const [bulkCreate, { isLoading: isBulkCreating }] =
    useBulkCreateCoursesMutation();
  const [deleteCourse] = useDeleteCourseMutation();

  const departments = deptsRes?.data || [];
  const allCourses = coursesRes?.data || coursesRes || []; // Adjust based on your API response structure

  // --- UI & Filter State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // --- Form States ---
  const initialForm = {
    title: "",
    code: "",
    owningDepartmentId: "",
    theory: 3,
    lab: 0,
    level: "UG",
  };
  const [singleForm, setSingleForm] = useState(initialForm);
  const [bulkFile, setBulkFile] = useState(null);

  // --- Filter Logic ---
  const filteredCourses = useMemo(() => {
    return allCourses.filter((course) => {
      const matchesSearch =
        (course.title || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (course.code || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDept
        ? (course.owningDepartmentId?._id || course.owningDepartmentId) ===
          selectedDept
        : true;
      return matchesSearch && matchesDept;
    });
  }, [allCourses, searchQuery, selectedDept]);

  // --- Handlers ---
  const handleCreateSingle = async () => {
    if (
      !singleForm.title ||
      !singleForm.code ||
      !singleForm.owningDepartmentId
    ) {
      return openAlert({
        message: "Title, Code, and Class are required.",
        severity: "warning",
      });
    }

    try {
      // Format payload to match your backend schema
      const payload = {
        title: singleForm.title,
        code: singleForm.code.toUpperCase(),
        owningDepartmentId: singleForm.owningDepartmentId,
        level: singleForm.level,
        creditHours: {
          theory: Number(singleForm.theory),
          lab: Number(singleForm.lab),
        },
      };

      await createCourse(payload).unwrap();
      openAlert({
        message: "Course registered successfully",
        severity: "success",
      });
      setIsSingleModalOpen(false);
      setSingleForm(initialForm);
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to register course",
        severity: "error",
      });
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this course from the master catalog?",
      )
    ) {
      try {
        await deleteCourse(id).unwrap();
        openAlert({
          message: "Course deleted successfully",
          severity: "success",
        });
      } catch (error) {
        openAlert({ message: "Failed to delete course", severity: "error" });
      }
    }
  };

  // --- Bulk Handlers ---
  const downloadTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8,title,code,departmentId,theoryCredits,labCredits,level\nIntroduction to Computer Science,CS101,DEPT_ID_HERE,3,1,UG\nCalculus I,MT101,DEPT_ID_HERE,3,0,UG";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "master_course_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkSubmit = async () => {
    if (!bulkFile)
      return openAlert({
        message: "Please upload a CSV file",
        severity: "warning",
      });

    // Note: In production, use FormData to send the file to the backend
    openAlert({
      message: "Bulk upload triggered (Integrate file upload logic here)",
      severity: "info",
    });
    setIsBulkModalOpen(false);
    setBulkFile(null);
  };

  return {
    departments,
    filteredCourses,
    isFetchingCourses,
    searchQuery,
    setSearchQuery,
    selectedDept,
    setSelectedDept,

    isSingleModalOpen,
    setIsSingleModalOpen,
    singleForm,
    setSingleForm,
    handleCreateSingle,
    isCreating,
    handleDelete,

    isBulkModalOpen,
    setIsBulkModalOpen,
    bulkFile,
    setBulkFile,
    handleBulkSubmit,
    isBulkCreating,
    downloadTemplate,
  };
};

export default useCourseRegistrationController;
