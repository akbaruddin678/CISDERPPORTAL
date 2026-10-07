import { useMemo, useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetAllStaffQuery,
  useGetPayrollSlipsQuery,
  useGeneratePayrollSlipMutation,
  useUpdatePayrollStatusMutation,
  useLazySuggestPayrollSlipQuery,
} from "../api/HrApi";
import { buildPayslipPdf } from "../common/buildPayslipPdf";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

const now = new Date();
const initialForm = {
  staffId: "",
  month: now.getMonth() + 1,
  year: now.getFullYear(),
  basicSalary: "",
  allowances: [],
  deductions: [],
};

const useHrPayrollController = () => {
  const { openAlert } = useGlobalAlert();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: staffRes } = useGetAllStaffQuery();
  const staffList = useMemo(() => extractArray(staffRes), [staffRes]);

  const { data: slipsRes, isFetching, refetch } = useGetPayrollSlipsQuery({ month, year });
  const slips = useMemo(() => extractArray(slipsRes), [slipsRes]);

  const [generateSlip, { isLoading: isGenerating }] = useGeneratePayrollSlipMutation();
  const [updateStatus, { isLoading: isUpdating }] = useUpdatePayrollStatusMutation();
  const [fetchSuggestion, { isFetching: isSuggesting }] = useLazySuggestPayrollSlipQuery();

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  const openGenerateModal = () => {
    setFormData({ ...initialForm, month, year });
    setShowGenerateModal(true);
  };
  const closeGenerateModal = () => setShowGenerateModal(false);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Selecting staff (or changing month/year with staff already picked)
  // pre-fills basicSalary/allowances from StaffEmploymentInfo and a
  // suggested unpaid-absence/leave deduction — HR can still freely
  // edit/remove anything before saving.
  const applySuggestion = async (staffId, targetMonth, targetYear) => {
    if (!staffId) return;
    try {
      const suggestion = await fetchSuggestion({ staffId, month: targetMonth, year: targetYear }).unwrap();
      const s = suggestion?.data;
      if (!s) return;
      setFormData((prev) => ({
        ...prev,
        basicSalary: s.basicSalary || prev.basicSalary,
        allowances: s.allowances?.length ? s.allowances.map((a) => ({ name: a.name, amount: String(a.amount) })) : prev.allowances,
        deductions: s.deductions?.length ? s.deductions.map((d) => ({ name: d.name, amount: String(d.amount) })) : prev.deductions,
      }));
    } catch {
      // No employment info on file yet — leave the form blank for manual entry.
    }
  };

  const handleStaffSelect = (staffId) => {
    handleFormChange("staffId", staffId);
    applySuggestion(staffId, formData.month, formData.year);
  };

  const handleDownloadPayslip = (slip) => {
    buildPayslipPdf(slip).catch(() =>
      openAlert({ message: "Failed to generate payslip PDF.", severity: "error" }),
    );
  };

  const addLineItem = (type) => {
    setFormData((prev) => ({ ...prev, [type]: [...prev[type], { name: "", amount: "" }] }));
  };
  const updateLineItem = (type, index, field, value) => {
    setFormData((prev) => {
      const items = [...prev[type]];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, [type]: items };
    });
  };
  const removeLineItem = (type, index) => {
    setFormData((prev) => ({ ...prev, [type]: prev[type].filter((_, i) => i !== index) }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!formData.staffId || !formData.basicSalary) {
      return openAlert({ message: "Select staff and enter a basic salary.", severity: "warning" });
    }
    try {
      await generateSlip({
        ...formData,
        basicSalary: Number(formData.basicSalary),
        allowances: formData.allowances.filter((a) => a.name && a.amount !== ""),
        deductions: formData.deductions.filter((d) => d.name && d.amount !== ""),
      }).unwrap();
      openAlert({ message: "Payroll slip generated.", severity: "success" });
      setShowGenerateModal(false);
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to generate payroll slip.",
        severity: "error",
      });
    }
  };

  const handleMarkPaid = async (slip) => {
    try {
      await updateStatus({ id: slip._id, status: "Paid" }).unwrap();
      openAlert({ message: "Marked as paid.", severity: "success" });
    } catch (error) {
      openAlert({ message: error.data?.message || "Failed to update status.", severity: "error" });
    }
  };

  const handleApprove = async (slip) => {
    try {
      await updateStatus({ id: slip._id, status: "Approved" }).unwrap();
      openAlert({ message: "Slip approved.", severity: "success" });
    } catch (error) {
      openAlert({ message: error.data?.message || "Failed to update status.", severity: "error" });
    }
  };

  return {
    month,
    setMonth,
    year,
    setYear,
    staffList,
    slips,
    isFetching,
    refetch,

    showGenerateModal,
    openGenerateModal,
    closeGenerateModal,
    formData,
    handleFormChange,
    handleStaffSelect,
    isSuggesting,
    addLineItem,
    updateLineItem,
    removeLineItem,
    handleGenerate,
    isGenerating,

    handleApprove,
    handleMarkPaid,
    handleDownloadPayslip,
    isUpdating,
  };
};

export default useHrPayrollController;
