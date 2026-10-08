import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetAllDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useGetAllProgramsQuery,
  useCreateProgramMutation,
  useUpdateProgramMutation,
  useDeleteProgramMutation,
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

const programSchema = yup.object().shape({
  name: yup.string().required("Program name is required"),
  code: yup.string().required("Program code is required"),
  departmentId: yup.string().required("Class is required"),
});

const semesterSchema = yup.object().shape({
  name: yup.string().required("Name is required (e.g., A, B)"),
});

export const useAcademicStructureController = () => {
  const { openAlert } = useGlobalAlert();

  // --- Modal & Edit States ---
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [editingProg, setEditingProg] = useState(null);
  const [programError, setProgramError] = useState("");

  const [addSectionClass, setAddSectionClass] = useState(null);
  const [addSectionProgram, setAddSectionProgram] = useState(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [addSectionError, setAddSectionError] = useState("");

  const [editingSemester, setEditingSemester] = useState(null);
  const [semesterError, setSemesterError] = useState("");

  // --- API Hooks ---
  const { data: deptData, isLoading: isDeptLoading } =
    useGetAllDepartmentsQuery();
  const { data: progData, isLoading: isProgLoading } = useGetAllProgramsQuery();
  const { data: semData, isLoading: isSemLoading } = useGetAllSemestersQuery();
  const [createProgram, { isLoading: isCreatingProg }] = useCreateProgramMutation();
  const [updateProgram, { isLoading: isUpdatingProg }] = useUpdateProgramMutation();
  const [deleteProgram, { isLoading: isDeletingProg }] = useDeleteProgramMutation();

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
  const allPrograms = progData?.data || progData || [];
  const allSemesters = semData?.data || semData || [];

  // Class -> its programs, and program -> its sections.
  const programsByClass = {};
  for (const prog of allPrograms) {
    const deptId = prog.departmentId?._id || prog.departmentId;
    if (!deptId) continue;
    (programsByClass[deptId] ||= []).push(prog);
  }
  const sectionsByProgram = {};
  for (const sem of allSemesters) {
    const progId = sem.programId?._id || sem.programId;
    if (!progId) continue;
    (sectionsByProgram[progId] ||= []).push(sem);
  }
  Object.values(sectionsByProgram).forEach((list) =>
    list.sort((x, y) => (x.number || 0) - (y.number || 0)),
  );

  // --- Forms ---
  const deptForm = useForm({
    resolver: yupResolver(departmentSchema),
    defaultValues: { name: "", code: "" },
  });

  const progForm = useForm({
    resolver: yupResolver(programSchema),
    defaultValues: { name: "", code: "", departmentId: "" },
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

  // --- Program Handlers ---
  const handleOpenProgramModal = (dept, prog = null) => {
    setProgramError("");
    setEditingProg(prog);
    progForm.reset({
      name: prog?.name || "",
      code: prog?.code || "",
      departmentId: prog ? prog.departmentId?._id || prog.departmentId : dept?._id || "",
    });
    setIsProgramModalOpen(true);
  };

  const handleCloseProgramModal = () => {
    setIsProgramModalOpen(false);
    setEditingProg(null);
    setProgramError("");
  };

  const onSubmitProgram = async (data) => {
    try {
      const body = {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        departmentId: data.departmentId,
      };
      if (editingProg) {
        await updateProgram({ id: editingProg._id, ...body }).unwrap();
        openAlert({ message: "Program updated successfully", severity: "success" });
      } else {
        await createProgram(body).unwrap();
        openAlert({ message: "Program added. Now add its sections.", severity: "success" });
      }
      handleCloseProgramModal();
    } catch (err) {
      setProgramError(err?.data?.error || "Failed to save program");
    }
  };

  const handleDeleteProgram = async (prog) => {
    if (!window.confirm(`Delete the program "${prog.name}"?`)) return;
    try {
      await deleteProgram(prog._id).unwrap();
      openAlert({ message: "Program deleted", severity: "success" });
    } catch (err) {
      openAlert({ message: err?.data?.error || "Failed to delete program", severity: "error" });
    }
  };

  // --- Add Section Handlers ---
  const handleOpenAddSection = (dept, prog) => {
    setAddSectionError("");
    setNewSectionName("");
    setAddSectionProgram(prog);
    setAddSectionClass(dept);
  };
  const handleCloseAddSection = () => {
    setAddSectionClass(null);
    setAddSectionProgram(null);
    setNewSectionName("");
    setAddSectionError("");
  };
  const onSubmitAddSection = async (e) => {
    e.preventDefault();
    try {
      await createSection({
        departmentId: addSectionClass._id,
        programId: addSectionProgram?._id,
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
    programsByClass,
    sectionsByProgram,
    isLoading: isDeptLoading || isProgLoading || isSemLoading,

    isProgramModalOpen,
    editingProg,
    progForm,
    programError,
    handleOpenProgramModal,
    handleCloseProgramModal,
    onSubmitProgram: progForm.handleSubmit(onSubmitProgram),
    handleDeleteProgram,
    addSectionProgram,

    isDeptModalOpen,
    editingDept,
    deptForm,
    editingSemester,
    semForm,
    isSubmitting:
      isCreatingDept ||
      isUpdatingDept ||
      isCreatingProg ||
      isUpdatingProg ||
      isDeletingProg ||
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
