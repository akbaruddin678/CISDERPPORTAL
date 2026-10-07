import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetAllDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useGetAllSemestersQuery,
  useCreateSectionForClassMutation,
  useUpdateSemesterMutation,
  useDeleteSemesterMutation,
  useGetSemesterUsageQuery,
} from "../api/adminApi";

const departmentSchema = yup.object().shape({
  name: yup.string().required("Class name is required"),
  code: yup.string().required("Class code is required"),
});

const semesterSchema = yup.object().shape({
  name: yup.string().required("Name is required (e.g., A, B)"),
});

export const useAcademicStructureController = () => {
  const { openAlert } = useGlobalAlert();

  // --- Modal & Edit States ---
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  const [addSectionClass, setAddSectionClass] = useState(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [addSectionError, setAddSectionError] = useState("");

  const [editingSemester, setEditingSemester] = useState(null);
  const [semesterError, setSemesterError] = useState("");

  // --- API Hooks ---
  const { data: deptData, isLoading: isDeptLoading } =
    useGetAllDepartmentsQuery();
  const { data: semData, isLoading: isSemLoading } = useGetAllSemestersQuery();

  const [createDepartment, { isLoading: isCreatingDept }] =
    useCreateDepartmentMutation();
  const [updateDepartment, { isLoading: isUpdatingDept }] =
    useUpdateDepartmentMutation();

  const [createSection, { isLoading: isCreatingSection }] =
    useCreateSectionForClassMutation();
  const [updateSemester, { isLoading: isUpdatingSem }] =
    useUpdateSemesterMutation();
  const [deleteSemester, { isLoading: isDeletingSem }] =
    useDeleteSemesterMutation();
  // Looked up as soon as a semester is opened, so the modal can say up front
  // whether it's deletable (and why not) rather than failing on click.
  const { data: usageRes, isFetching: isUsageLoading } =
    useGetSemesterUsageQuery(editingSemester?._id, {
      skip: !editingSemester,
      refetchOnMountOrArgChange: true,
    });
  const semesterUsage = editingSemester ? usageRes?.data || null : null;

  const departments = deptData?.data || deptData || [];
  const allSemesters = semData?.data || semData || [];

  // Sections grouped by class: Semester -> its (hidden) program -> department.
  const sectionsByClass = {};
  for (const sem of allSemesters) {
    const dept = sem.programId?.departmentId;
    const deptId = dept?._id || dept;
    if (!deptId) continue;
    (sectionsByClass[deptId] ||= []).push(sem);
  }
  Object.values(sectionsByClass).forEach((list) =>
    list.sort((x, y) => (x.number || 0) - (y.number || 0)),
  );

  // --- Forms ---
  const deptForm = useForm({
    resolver: yupResolver(departmentSchema),
    defaultValues: { name: "", code: "" },
  });

  const semForm = useForm({
    resolver: yupResolver(semesterSchema),
    defaultValues: { name: "" },
  });

  // --- Department Handlers ---
  const handleOpenDeptModal = (dept = null) => {
    if (dept) {
      setEditingDept(dept);
      deptForm.reset({ name: dept.name, code: dept.code });
    } else {
      setEditingDept(null);
      deptForm.reset({ name: "", code: "" });
    }
    setIsDeptModalOpen(true);
  };

  const handleCloseDeptModal = () => {
    setIsDeptModalOpen(false);
    setEditingDept(null);
  };

  const onSubmitDepartment = async (data) => {
    try {
      if (editingDept) {
        await updateDepartment({
          id: editingDept._id,
          name: data.name,
          code: data.code.toUpperCase(),
        }).unwrap();
        openAlert({
          message: "Class updated successfully",
          severity: "success",
        });
      } else {
        await createDepartment({
          name: data.name,
          code: data.code.toUpperCase(),
        }).unwrap();
        openAlert({
          message: "Class created successfully",
          severity: "success",
        });
      }
      handleCloseDeptModal();
    } catch (err) {
      openAlert({
        message: err?.data?.error || "Failed to save department",
        severity: "error",
      });
    }
  };

  // --- Add Section Handlers ---
  const handleOpenAddSection = (dept) => {
    setAddSectionError("");
    setNewSectionName("");
    setAddSectionClass(dept);
  };
  const handleCloseAddSection = () => {
    setAddSectionClass(null);
    setNewSectionName("");
    setAddSectionError("");
  };
  const onSubmitAddSection = async (e) => {
    e.preventDefault();
    try {
      await createSection({
        departmentId: addSectionClass._id,
        name: newSectionName,
      }).unwrap();
      openAlert({ message: "Section added successfully", severity: "success" });
      handleCloseAddSection();
    } catch (err) {
      setAddSectionError(err?.data?.error || "Failed to add section");
    }
  };

  // --- Semester/Part Handlers ---
  const handleOpenSemesterModal = (sem) => {
    setSemesterError("");
    setEditingSemester(sem);
    semForm.reset({ name: sem.name });
  };

  const handleCloseSemesterModal = () => {
    setEditingSemester(null);
    setSemesterError("");
  };

  const onSubmitSemester = async (data) => {
    try {
      await updateSemester({
        id: editingSemester._id,
        name: data.name,
      }).unwrap();
      openAlert({ message: "Stage renamed successfully", severity: "success" });
      handleCloseSemesterModal();
    } catch (err) {
      setSemesterError(err?.data?.error || "Failed to rename stage");
    }
  };

  // The modal has already shown (from the usage lookup) whether this can be
  // deleted and asked for confirmation; the backend re-checks anyway and
  // refuses if any current or former student, registration, result or fee
  // still points at this semester — that reason is shown inside the modal.
  const onDeleteSemester = async () => {
    try {
      const res = await deleteSemester(editingSemester._id).unwrap();
      openAlert({ message: res?.message || "Semester deleted", severity: "success" });
      handleCloseSemesterModal();
    } catch (err) {
      setSemesterError(err?.data?.error || "Failed to delete semester");
    }
  };

  return {
    departments,
    sectionsByClass,
    isLoading: isDeptLoading || isSemLoading,

    isDeptModalOpen,
    editingDept,
    deptForm,
    editingSemester,
    semForm,
    isSubmitting:
      isCreatingDept ||
      isUpdatingDept ||
      isCreatingSection ||
      isUpdatingSem ||
      isDeletingSem,

    handleOpenDeptModal,
    handleCloseDeptModal,
    onSubmitDepartment: deptForm.handleSubmit(onSubmitDepartment),

    addSectionClass,
    newSectionName,
    setNewSectionName,
    addSectionError,
    handleOpenAddSection,
    handleCloseAddSection,
    onSubmitAddSection,

    handleOpenSemesterModal,
    handleCloseSemesterModal,
    onSubmitSemester: semForm.handleSubmit(onSubmitSemester),
    onDeleteSemester,
    semesterUsage,
    isUsageLoading,
    semesterError,
  };
};
