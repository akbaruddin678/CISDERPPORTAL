// controller/ScholarshipPlanController.js
import { useEffect, useState, useCallback, useRef } from "react";
import {
  useGetScholarshipPlansQuery,
  useCreateScholarshipPlanMutation,
  useUpdateScholarshipPlanMutation,
  useDeleteScholarshipPlanMutation,
  useToggleScholarshipPlanStatusMutation,
  useLazyGetScholarshipPlansQuery,
  useGetScholarshipStatsQuery,
} from "../api/scholarshipApi";
import {
  useGetDepartmentsQuery,
  useGetProgramsQuery,
  useGetTermsQuery,
} from "../api/depsemtermpro";

const ScholarshipPlanController = ({ children, filters, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [notification, setNotification] = useState(null);
  const notificationTimeout = useRef(null);

  // --- MUTATIONS ---
  const [createScholarshipPlan, { isLoading: isCreatingPlan }] =
    useCreateScholarshipPlanMutation();
  const [updateScholarshipPlan, { isLoading: isUpdatingPlan }] =
    useUpdateScholarshipPlanMutation();
  const [deleteScholarshipPlan, { isLoading: isDeletingPlan }] =
    useDeleteScholarshipPlanMutation();
  const [toggleScholarshipPlanStatus, { isLoading: isTogglingStatus }] =
    useToggleScholarshipPlanStatusMutation();

  // --- QUERIES ---
  // ✅ FIX: Force refetch if data is stale (older than 5 seconds)
  const {
    data: scholarshipPlansResponse,
    isLoading: isLoadingPlans,
    error: plansError,
    refetch: refetchPlans,
  } = useGetScholarshipPlansQuery(filters, {
    refetchOnMountOrArgChange: 5,
  });

  const [fetchPlans, { isLoading: isFetchingPlans, error: fetchError }] =
    useLazyGetScholarshipPlansQuery();

  const {
    data: statsResponse,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useGetScholarshipStatsQuery();

  // Meta Data
  const { data: departmentsResponse, isLoading: departmentsLoading } =
    useGetDepartmentsQuery();
  const { data: programsResponse, isLoading: programsLoading } =
    useGetProgramsQuery();
  const { data: termsResponse, isLoading: termsLoading } = useGetTermsQuery();

  // --- DATA TRANSFORMATION ---
  const scholarshipPlans = scholarshipPlansResponse?.data || [];
  const plansPagination = scholarshipPlansResponse?.pagination || {};

  const departments = departmentsResponse?.data || departmentsResponse || [];
  const programs = programsResponse?.data || programsResponse || [];
  const terms = termsResponse?.data || termsResponse || [];

  const stats = statsResponse?.plans ||
    statsResponse?.data?.plans || {
      total: 0,
      active: 0,
      inactive: 0,
      percentageType: 0,
      fixedType: 0,
    };

  // ✅ FIX: Normalize Plan Data
  const processPlanForDisplay = (plan) => {
    if (!plan) return plan;

    // Create a new object to avoid reference issues
    const formattedPlan = { ...plan };

    // Ensure ID format consistency
    formattedPlan.id = plan._id || plan.id;

    // ✅ Explicitly map Remark/Remarks to 'remark'
    formattedPlan.remark = plan.remark || plan.remarks || "";

    // Date Formatting
    if (plan.validFrom)
      formattedPlan.validFromFormatted = new Date(
        plan.validFrom
      ).toLocaleDateString();
    if (plan.validTo)
      formattedPlan.validToFormatted = new Date(
        plan.validTo
      ).toLocaleDateString();
    if (plan.createdAt)
      formattedPlan.createdAtFormatted = new Date(
        plan.createdAt
      ).toLocaleDateString();

    return formattedPlan;
  };

  const processedPlans = scholarshipPlans.map(processPlanForDisplay);

  // --- UTILITIES ---
  const showNotification = useCallback((type, message, duration = 5000) => {
    if (notificationTimeout.current) clearTimeout(notificationTimeout.current);
    setNotification({ type, message });
    notificationTimeout.current = setTimeout(
      () => setNotification(null),
      duration
    );
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search !== searchTerm) {
        if (onFilterChange) onFilterChange({ search: searchTerm });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filters.search, onFilterChange]);

  useEffect(() => {
    return () => {
      if (notificationTimeout.current)
        clearTimeout(notificationTimeout.current);
    };
  }, []);

  // --- HANDLERS ---
  const handleCreatePlan = async (planData) => {
    try {
      const backendData = {
        title: planData.title,
        description: planData.description || "",
        type: planData.type,
        maxAmount:
          planData.type === "fixed" ? Number(planData.maxAmount) : undefined,
        maxPercentage:
          planData.type === "percentage"
            ? Number(planData.maxPercentage)
            : undefined,
        active: planData.active !== undefined ? planData.active : true,
        validFrom: planData.validFrom
          ? new Date(planData.validFrom).toISOString()
          : new Date().toISOString(),
        validTo: planData.validTo
          ? new Date(planData.validTo).toISOString()
          : null,
        ...(planData.termId && { termId: planData.termId }),
        remark: planData.remark || "",
      };

      const result = await createScholarshipPlan(backendData).unwrap();

      refetchPlans();
      refetchStats();
      showNotification("success", "Scholarship plan created successfully!");

      return {
        success: true,
        message: "Scholarship plan created successfully!",
        data: result,
      };
    } catch (error) {
      console.error("Error creating plan:", error);
      const errorMessage =
        error.data?.message || error.message || "Failed to create plan";
      showNotification("error", errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleUpdatePlan = async (planId, updateData) => {
    try {
      const backendData = {
        ...updateData,
        validFrom: updateData.validFrom
          ? new Date(updateData.validFrom).toISOString()
          : undefined,
        validTo: updateData.validTo
          ? new Date(updateData.validTo).toISOString()
          : null,
        remark: updateData.remark || "",
      };

      const result = await updateScholarshipPlan({
        id: planId,
        ...backendData,
      }).unwrap();
      refetchPlans();
      refetchStats();
      showNotification("success", "Scholarship plan updated successfully!");
      return {
        success: true,
        message: "Scholarship plan updated successfully!",
        data: result,
      };
    } catch (error) {
      console.error("Error updating plan:", error);
      showNotification("error", error.data?.message || "Failed to update plan");
      return {
        success: false,
        message: error.data?.message || "Failed to update plan",
      };
    }
  };

  const handleDeletePlan = async (planId) => {
    try {
      await deleteScholarshipPlan(planId).unwrap();
      refetchPlans();
      refetchStats();
      showNotification("success", "Scholarship plan deleted successfully!");
      return {
        success: true,
        message: "Scholarship plan deleted successfully!",
      };
    } catch (error) {
      console.error("Error deleting plan:", error);
      showNotification("error", error.data?.message || "Failed to delete plan");
      return {
        success: false,
        message: error.data?.message || "Failed to delete plan",
      };
    }
  };

  const handleTogglePlanStatus = async (planId, active) => {
    try {
      const result = await toggleScholarshipPlanStatus({
        id: planId,
        active,
      }).unwrap();
      refetchPlans();
      refetchStats();
      showNotification(
        "success",
        `Plan ${active ? "activated" : "deactivated"} successfully!`
      );
      return {
        success: true,
        message: `Status updated successfully!`,
        data: result,
      };
    } catch (error) {
      console.error("Error toggling status:", error);
      showNotification(
        "error",
        error.data?.message || "Failed to update status"
      );
      return {
        success: false,
        message: error.data?.message || "Failed to update status",
      };
    }
  };

  const handleRefresh = async () => {
    try {
      await refetchPlans();
      await refetchStats();
      showNotification("info", "Data refreshed successfully!");
    } catch (error) {
      showNotification("error", "Failed to refresh data");
    }
  };

  const calculateLocalStats = (plans) => {
    const total = plans.length;
    const active = plans.filter((plan) => plan.active).length;
    const percentageType = plans.filter(
      (plan) => plan.type === "percentage"
    ).length;
    const fixedType = plans.filter((plan) => plan.type === "fixed").length;
    return {
      total,
      active,
      inactive: total - active,
      percentageType,
      fixedType,
    };
  };

  const combinedStats = { ...calculateLocalStats(scholarshipPlans), ...stats };

  const getErrorMessage = () => {
    if (plansError)
      return (
        plansError.data?.message || plansError.message || "Failed to load plans"
      );
    if (fetchError)
      return (
        fetchError.data?.message || fetchError.message || "Failed to fetch data"
      );
    return null;
  };

  const controllerData = {
    scholarshipPlans: processedPlans,
    plansPagination,
    departments,
    programs,
    terms,
    stats: combinedStats,

    isLoading:
      isLoadingPlans ||
      departmentsLoading ||
      programsLoading ||
      termsLoading ||
      isLoadingStats,
    isLoadingPlans,
    isCreatingPlan,
    isUpdatingPlan,
    isDeletingPlan,
    isTogglingStatus,
    isFetchingPlans,
    isLoadingStats,

    error: getErrorMessage(),
    plansError,

    handleCreatePlan,
    handleUpdatePlan,
    handleDeletePlan,
    handleTogglePlanStatus,
    handleRefresh,
    refetchPlans,
    setSearchTerm,

    notification,
    clearNotification: () => setNotification(null),
    searchTerm,
    currentFilters: filters,
  };

  return children(controllerData);
};

export default ScholarshipPlanController;
