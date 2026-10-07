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
  useGetAllSemestersQuery,
  useCreateSemesterMutation,
  useUpdateSemesterMutation,
  useDeleteSemesterMutation,
  useGetSemesterUsageQuery,
} from "../api/adminApi";

const departmentSchema = yup.object().shape({
  name: yup.string().required("Department name is required"),
  code: yup.string().required("Department code is required"),
});

const programSchema = yup.object().shape({
  name: yup.string().required("Program name is required"),
  code: yup.string().required("Program code is required"),
  departmentId: yup.string().required("Department is required"),
  level: yup.string().required("Level is required"),
  durationStages: yup
    .number()
    .typeError("Enter the number of semesters")
    .integer("Must be a whole number")
    .min(1, "At least 1")
    .max(14, "At most 14")
    .required("Duration is required"),
});

const semesterSchema = yup.object().shape({
  name: yup.string().required("Name is required (e.g., Semester 1, Part 1)"),
});

export const useAcademicStructureController = () => {
  const { openAlert } = useGlobalAlert();
  const [activeTab, setActiveTab] = useState(0);

  // --- Modal & Edit States ---
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  const [programModalContext, setProgramModalContext] = useState(null);
  const [editingProg, setEditingProg] = useState(null);

  const [editingSemester, setEditingSemester] = useState(null);
  const [programError, setProgramError] = useState("");
  const [semesterError, setSemesterError] = useState("");

  // --- API Hooks ---
  const { data: deptData, isLoading: isDeptLoading } =
    useGetAllDepartmentsQuery();
  const { data: progData, isLoading: isProgLoading } = useGetAllProgramsQuery();
  const { data: semData, isLoading: isSemLoading } = useGetAllSemestersQuery();

  const [createDepartment, { isLoading: isCreatingDept }] =
    useCreateDepartmentMutation();
  const [updateDepartment, { isLoading: isUpdatingDept }] =
    useUpdateDepartmentMutation();

  const [createProgram, { isLoading: isCreatingProg }] =
    useCreateProgramMutation();
  const [updateProgram, { isLoading: isUpdatingProg }] =
    useUpdateProgramMutation();

  const [createSemester] = useCreateSemesterMutation();
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

  // ✅ BACKWARD COMPATIBILITY FILTER: Catch old DB architecture formats
  const universityPrograms = allPrograms.filter((p) => {
    const lvl = (p.level || "").toUpperCase();
    return [
      "UG",
      "MS",
      "PHD",
      "DIPLOMA",
      "UNDERGRADUATE",
      "GRADUATE",
      "POSTGRADUATE",
    ].includes(lvl);
  });

  const collegePrograms = allPrograms.filter((p) => {
    const lvl = (p.level || "").toUpperCase();
    // If it is strictly HSSC, or if it doesn't match Uni and is short-duration, group to College
    return (
      ["HSSC", "INTERMEDIATE", "COLLEGE", "FSC", "FA"].includes(lvl) ||
      ![
        "UG",
        "MS",
        "PHD",
        "DIPLOMA",
        "UNDERGRADUATE",
        "GRADUATE",
        "POSTGRADUATE",
      ].includes(lvl)
    );
  });

  // --- Forms ---
  const deptForm = useForm({
    resolver: yupResolver(departmentSchema),
    defaultValues: { name: "", code: "" },
  });

  const progForm = useForm({
    resolver: yupResolver(programSchema),
    defaultValues: {
      name: "",
      code: "",
      departmentId: "",
      level: "",
      durationStages: "",
    },
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
          message: "Department updated successfully",
          severity: "success",
        });
      } else {
        await createDepartment({
          name: data.name,
          code: data.code.toUpperCase(),
        }).unwrap();
        openAlert({
          message: "Department created successfully",
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
  const handleOpenProgramModal = (context, prog = null) => {
    setProgramError("");
    setProgramModalContext(context);
    if (prog) {
      setEditingProg(prog);

      // ✅ TRANSLATE OLD DB DATA TO NEW FORMAT FOR THE FORM
      let normalizedLevel = (prog.level || "").toUpperCase();
      if (normalizedLevel === "UNDERGRADUATE") normalizedLevel = "UG";
      if (normalizedLevel === "GRADUATE") normalizedLevel = "MS";
      if (normalizedLevel === "POSTGRADUATE") normalizedLevel = "PHD";
      if (context === "college" || normalizedLevel === "INTERMEDIATE")
        normalizedLevel = "HSSC";

      // Support old 'duration' field or new 'durationStages' field
      const mappedDuration =
        prog.durationSemesters ||
        prog.durationStages ||
        prog.duration ||
        (context === "college" ? 2 : 8);

      progForm.reset({
        name: prog.name,
        code: prog.code,
        departmentId: prog.departmentId?._id || prog.departmentId,
        level: normalizedLevel,
        durationStages: mappedDuration,
      });
    } else {
      setEditingProg(null);
      progForm.reset({
        name: "",
        code: "",
        departmentId: "",
        level: context === "college" ? "HSSC" : "UG",
        durationStages: context === "college" ? 2 : 8,
      });
    }
  };

  const handleCloseProgramModal = () => {
    setProgramModalContext(null);
    setEditingProg(null);
    setProgramError("");
  };

  // ✅ FIXED: Completely delegated generation to the backend! No more manual loop.
  const onSubmitProgram = async (data) => {
    try {
      if (editingProg) {
        // UPDATE
        await updateProgram({
          id: editingProg._id,
          name: data.name,
          code: data.code.toUpperCase(),
          departmentId: data.departmentId,
          level: data.level,
          durationStages: data.durationStages, // Required to trigger the backend duration fix
        }).unwrap();
        openAlert({
          message: "Program updated successfully",
          severity: "success",
        });
      } else {
        // CREATE
        await createProgram({
          name: data.name,
          code: data.code.toUpperCase(),
          departmentId: data.departmentId,
          level: data.level,
          durationStages: data.durationStages, // Sent to backend to auto-generate
        }).unwrap();
        openAlert({
          message: `${data.name} and its stages were created successfully.`,
          severity: "success",
        });
      }
      handleCloseProgramModal();
    } catch (err) {
      // Shown inside the modal (e.g. "Semester 6 is still used by 1
      // student...") so it can't be missed or lost behind a pop-up.
      setProgramError(err?.data?.error || "Failed to save program");
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
    activeTab,
    handleTabChange: (e, val) => setActiveTab(val),
    departments,
    allPrograms,
    allSemesters,
    universityPrograms,
    collegePrograms,
    isLoading: isDeptLoading || isProgLoading || isSemLoading,

    // Modal States & Forms
    isDeptModalOpen,
    editingDept,
    deptForm,
    programModalContext,
    editingProg,
    progForm,
    editingSemester,
    semForm,
    isSubmitting:
      isCreatingDept ||
      isUpdatingDept ||
      isCreatingProg ||
      isUpdatingProg ||
      isUpdatingSem ||
      isDeletingSem,

    // Actions
    handleOpenDeptModal,
    handleCloseDeptModal,
    onSubmitDepartment: deptForm.handleSubmit(onSubmitDepartment),

    handleOpenProgramModal,
    handleCloseProgramModal,
    onSubmitProgram: progForm.handleSubmit(onSubmitProgram),

    handleOpenSemesterModal,
    handleCloseSemesterModal,
    onSubmitSemester: semForm.handleSubmit(onSubmitSemester),
    onDeleteSemester,
    semesterUsage,
    isUsageLoading,
    programError,
    semesterError,
  };
};
