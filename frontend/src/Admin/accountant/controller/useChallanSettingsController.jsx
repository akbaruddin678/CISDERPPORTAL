import { useForm, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { academicFeeValidationSchema } from "../services/challanSettingsValidation";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { useModalController } from "../../../shared/modal/hooks/useModalController";
import { useState, useMemo, useEffect, useCallback } from "react";
import * as API from "../api/feeStructureApi";
import {
  useGetTermsQuery,
  useGetDepartmentsQuery,
  useGetProgramsByDepartmentQuery,
} from "../api/depsemtermpro";

const useChallanSettingsController = () => {
  const { openAlert } = useGlobalAlert();
  const { modalState, openModal, closeModal } = useModalController();

  const [activeTab, setActiveTab] = useState(0);
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [editingId, setEditingId] = useState(null);

  // --- DATA FETCHING ---
  const { data: termsData } = useGetTermsQuery();
  const { data: departmentsData } = useGetDepartmentsQuery();
  const { data: programsData } = useGetProgramsByDepartmentQuery(
    selectedDepartment,
    { skip: !selectedDepartment },
  );
  const { data: feeHeadsData, isLoading: loadingHeads } =
    API.useGetFeeHeadsQuery({ type: "ACADEMIC,ADMISSION,READMISSION,EXAM" });

  const sessionOptions = useMemo(
    () => termsData?.data?.map((t) => ({ label: t.name, value: t._id })) || [],
    [termsData],
  );
  const departmentOptions = useMemo(
    () =>
      departmentsData?.data?.map((d) => ({ label: d.name, value: d._id })) ||
      [],
    [departmentsData],
  );
  const programOptions = useMemo(
    () =>
      programsData?.data?.map((p) => ({ label: p.name, value: p._id })) || [],
    [programsData],
  );
  const feeHeadOptions = useMemo(
    () =>
      feeHeadsData?.data?.map((h) => ({ label: h.name, value: h._id })) || [],
    [feeHeadsData],
  );

  const filters = useMemo(
    () => ({ programId: selectedProgram, termId: selectedSession }),
    [selectedProgram, selectedSession],
  );

  const { data: academicData, isLoading: load1 } = API.useGetAcademicFeesQuery(
    filters,
    { skip: !selectedSession || activeTab !== 0 },
  );
  const { data: basicData, isLoading: load6 } = API.useGetBasicFeesQuery(
    filters,
    { skip: !selectedSession || activeTab !== 5 },
  );
  const { data: admissionData, isLoading: load2 } =
    API.useGetAdmissionFeesQuery(filters, {
      skip: !selectedSession || activeTab !== 1,
    });
  const { data: reAdmissionData, isLoading: load3 } =
    API.useGetReAdmissionFeesQuery(filters, {
      skip: !selectedSession || activeTab !== 2,
    });
  const { data: examData, isLoading: load4 } = API.useGetExamFeesQuery(
    filters,
    { skip: !selectedSession || activeTab !== 3 },
  );
  const { data: miscData, isLoading: load5 } = API.useGetMiscellaneousFeesQuery(
    undefined,
    { skip: activeTab !== 4 },
  );

  // Mutations
  const [createAcademic] = API.useCreateAcademicFeeMutation();
  const [updateAcademic] = API.useUpdateAcademicFeeMutation();
  const [deleteAcademic] = API.useDeleteAcademicFeeMutation();
  const [createBasic] = API.useCreateBasicFeeMutation();
  const [updateBasic] = API.useUpdateBasicFeeMutation();
  const [deleteBasic] = API.useDeleteBasicFeeMutation();
  const [createAdmission] = API.useCreateAdmissionFeeMutation();
  const [updateAdmission] = API.useUpdateAdmissionFeeMutation();
  const [deleteAdmission] = API.useDeleteAdmissionFeeMutation();
  const [createReAdmission] = API.useCreateReAdmissionFeeMutation();
  const [updateReAdmission] = API.useUpdateReAdmissionFeeMutation();
  const [deleteReAdmission] = API.useDeleteReAdmissionFeeMutation();
  const [createExam] = API.useCreateExamFeeMutation();
  const [updateExam] = API.useUpdateExamFeeMutation();
  const [deleteExam] = API.useDeleteExamFeeMutation();
  const [createMisc] = API.useCreateMiscellaneousFeeMutation();
  const [deleteMisc] = API.useDeleteMiscellaneousFeeMutation();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(academicFeeValidationSchema),
    defaultValues: {
      programId: "",
      termId: "",
      academicLevel: "SEMESTER",
      levelNumber: "",
      totalRecurringFee: 0,
      totalOneTimeFee: 0,
      securityFee: 0,
      registrationFee: 0,
      miscellaneousFee: 0,
      miscellaneousRemark: "",
      feeItems: [],
    },
  });

  const { fields } = useFieldArray({ control, name: "feeItems" });

  const generateBreakdown = useCallback(
    (baseAmount, tab) => {
      if (!feeHeadOptions || feeHeadOptions.length === 0) return [];

      let rules = [];
      if (tab === 0 || tab === 3 || tab === 5) {
        rules = [
          { name: "Tuition", percent: 60, freq: "SEMESTER" },
          { name: "Maintenance", percent: 15, freq: "SEMESTER" },
          { name: "Laboratory", percent: 8, freq: "SEMESTER" },
          { name: "Institutional", percent: 7, freq: "SEMESTER" },
          { name: "Library", percent: 5, freq: "SEMESTER" },
          { name: "Sports", percent: 5, freq: "SEMESTER" },
        ];
      } else if (tab === 1 || tab === 2) {
        rules = [
          { name: "Registration", percent: 40, freq: "ONCE" },
          { name: "Processing", percent: 35, freq: "ONCE" },
          { name: "Admission", percent: 25, freq: "ONCE" },
        ];
      }

      const generated = [];
      rules.forEach((rule) => {
        const head = feeHeadOptions.find(
          (opt) =>
            opt.label.toLowerCase().includes(rule.name.toLowerCase()) ||
            rule.name.toLowerCase().includes(opt.label.toLowerCase()),
        );

        if (head) {
          generated.push({
            headId: head.value,
            frequency: rule.freq,
            isPercentage: true,
            percentageValue: rule.percent,
            amount: Math.round((baseAmount * rule.percent) / 100),
          });
        }
      });
      return generated;
    },
    [feeHeadOptions],
  );

  const watchedTotalRec = watch("totalRecurringFee");
  const watchedTotalOne = watch("totalOneTimeFee");
  const watchedItems = watch("feeItems");

  useEffect(() => {
    if (!watchedItems || watchedItems.length === 0) return;
    const base =
      activeTab === 1 || activeTab === 2
        ? Number(watchedTotalOne)
        : Number(watchedTotalRec); // covers 0 (Academic), 3 (Exam), 5 (Basic)
    watchedItems.forEach((item, index) => {
      if (item.isPercentage) {
        const amt = Math.round((base * (item.percentageValue || 0)) / 100);
        if (item.amount !== amt) setValue(`feeItems.${index}.amount`, amt);
      }
    });
  }, [
    watchedTotalRec,
    watchedTotalOne,
    JSON.stringify(watchedItems),
    setValue,
    activeTab,
  ]);

  const handleAdd = () => {
    if (activeTab !== 4 && (!selectedSession || !selectedProgram)) {
      openAlert({
        message: "Select Session & Program first",
        severity: "warning",
      });
      return;
    }
    setEditingId(null);
    reset({
      programId: selectedProgram,
      termId: selectedSession,
      academicLevel: "SEMESTER",
      levelNumber: "",
      totalRecurringFee: 0,
      totalOneTimeFee: 0,
      securityFee: 0,
      registrationFee: 0,
      miscellaneousFee: 0,
      miscellaneousRemark: "",
      feeItems: [],
    });
    openModal({ name: "feeModal" });
  };

  const handleEdit = (row) => {
    setEditingId(row._id);
    const commonData = {
      programId: row.programId?._id,
      termId: row.termId?._id,
      feeItems: row.feeItems || [],
    };

    if (activeTab === 4) {
      reset({
        miscellaneousFee: row.amount,
        miscellaneousRemark: row.name,
        programId: "gen",
        termId: "gen",
      });
    } else if (activeTab === 0 || activeTab === 3 || activeTab === 5) {
      reset({
        ...commonData,
        academicLevel: row.academicLevel || "SEMESTER",
        levelNumber: row.semesterNumber || row.levelNumber,
        totalRecurringFee: row.totalAmount,
        totalOneTimeFee: 0,
      });
    } else {
      // ✅ ADDED REGISTRATION FEE MAPPING FOR EDITING
      reset({
        ...commonData,
        totalOneTimeFee: row.totalAmount,
        securityFee: row.securityDeposit || 0,
        registrationFee: row.registrationFee || 0,
        totalRecurringFee: 0,
      });
    }
    openModal({ name: "feeModal" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete?")) return;
    try {
      if (activeTab === 0) await deleteAcademic(id).unwrap();
      else if (activeTab === 1) await deleteAdmission(id).unwrap();
      else if (activeTab === 2) await deleteReAdmission(id).unwrap();
      else if (activeTab === 3) await deleteExam(id).unwrap();
      else if (activeTab === 5) await deleteBasic(id).unwrap();
      else await deleteMisc(id).unwrap();
      openAlert({ message: "Deleted", severity: "success" });
    } catch (err) {
      openAlert({ message: "Failed", severity: "error" });
    }
  };

  const onSubmit = async (data) => {
    try {
      let items = data.feeItems || [];
      if (activeTab !== 4 && items.length === 0) {
        const base =
          activeTab === 0 || activeTab === 3 || activeTab === 5
            ? Number(data.totalRecurringFee)
            : Number(data.totalOneTimeFee);
        if (base > 0) items = generateBreakdown(base, activeTab);
      }

      const basePayload = {
        programId: data.programId,
        termId: data.termId,
        feeItems: items,
      };

      if (activeTab === 0) {
        const payload = {
          ...basePayload,
          semesterNumber: Number(data.levelNumber),
          totalAmount: Number(data.totalRecurringFee),
        };
        editingId
          ? await updateAcademic({ id: editingId, ...payload }).unwrap()
          : await createAcademic(payload).unwrap();
      } else if (activeTab === 1) {
        // ✅ ADDED REGISTRATION FEE TO ADMISSION PAYLOAD
        const payload = {
          ...basePayload,
          totalAmount: Number(data.totalOneTimeFee),
          securityDeposit: Number(data.securityFee),
          registrationFee: Number(data.registrationFee || 0),
        };
        editingId
          ? await updateAdmission({ id: editingId, ...payload }).unwrap()
          : await createAdmission(payload).unwrap();
      } else if (activeTab === 2) {
        // ✅ ADDED REGISTRATION FEE TO RE-ADMISSION PAYLOAD
        const payload = {
          ...basePayload,
          totalAmount: Number(data.totalOneTimeFee),
          registrationFee: Number(data.registrationFee || 0),
        };
        editingId
          ? await updateReAdmission({ id: editingId, ...payload }).unwrap()
          : await createReAdmission(payload).unwrap();
      } else if (activeTab === 3) {
        const payload = {
          ...basePayload,
          academicLevel: data.academicLevel,
          levelNumber: Number(data.levelNumber),
          totalAmount: Number(data.totalRecurringFee),
        };
        editingId
          ? await updateExam({ id: editingId, ...payload }).unwrap()
          : await createExam(payload).unwrap();
      } else if (activeTab === 5) {
        const payload = {
          ...basePayload,
          semesterNumber: Number(data.levelNumber),
          totalAmount: Number(data.totalRecurringFee),
        };
        editingId
          ? await updateBasic({ id: editingId, ...payload }).unwrap()
          : await createBasic(payload).unwrap();
      } else {
        const payload = {
          name: data.miscellaneousRemark,
          amount: Number(data.miscellaneousFee),
        };
        await createMisc(payload).unwrap();
      }
      openAlert({ message: "Saved Successfully", severity: "success" });
      closeModal();
    } catch (err) {
      openAlert({
        message: err?.data?.message || "Operation Failed",
        severity: "error",
      });
    }
  };

  const tableData =
    activeTab === 0
      ? academicData?.data
      : activeTab === 1
        ? admissionData?.data
        : activeTab === 2
          ? reAdmissionData?.data
          : activeTab === 3
            ? examData?.data
            : activeTab === 5
              ? basicData?.data
              : miscData?.data;

  return {
    activeTab,
    setActiveTab,
    sessionOptions,
    departmentOptions,
    programOptions,
    feeHeadOptions,
    loadingHeads,
    selectedSession,
    setSelectedSession,
    selectedDepartment,
    setSelectedDepartment,
    selectedProgram,
    setSelectedProgram,
    tableData: tableData || [],
    modalState,
    closeModal,
    handleAdd,
    handleEdit,
    handleDelete,
    control,
    errors,
    watch,
    setValue,
    onSubmit: handleSubmit(onSubmit),
    isLoading: load1 || load2 || load3 || load4 || load5 || load6,
    generateBreakdown,
  };
};

export default useChallanSettingsController;
