import React, { useEffect, useState } from "react";
import {
  useGetInstallmentPlansQuery,
  useCreateInstallmentPlanMutation,
  useLazyGetInstallmentPlansQuery,
  useUpdateInstallmentPlanMutation,
} from "../api/installmentApi";
import {
  useGetDepartmentsQuery,
  useGetProgramsQuery,
} from "../api/depsemtermpro";

const InstallmentPlanController = ({ children, filters }) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || "");

  // Queries
  const {
    data: installmentPlansResponse,
    isLoading: isLoadingPlans,
    error: plansError,
    refetch: refetchPlans,
  } = useGetInstallmentPlansQuery(filters);

  const [createInstallmentPlan, { isLoading: isCreatingPlan }] =
    useCreateInstallmentPlanMutation();
  const [updateInstallmentPlan, { isLoading: isUpdatingPlan }] =
    useUpdateInstallmentPlanMutation();

  const { data: departmentsResponse, isLoading: departmentsLoading } =
    useGetDepartmentsQuery();
  const { data: programsResponse, isLoading: programsLoading } =
    useGetProgramsQuery();

  // Helper
  const processPlansData = (response) => {
    if (!response) return [];
    if (response.data && Array.isArray(response.data)) return response.data;
    if (response.data?.data && Array.isArray(response.data.data))
      return response.data.data;
    if (response.plans && Array.isArray(response.plans)) return response.plans;
    if (Array.isArray(response)) return response;
    return [];
  };

  const installmentPlans = processPlansData(installmentPlansResponse);
  const departments = departmentsResponse?.data || [];
  const programs = programsResponse?.data || [];

  // Handlers
  const handleCreatePlan = async (planData) => {
    try {
      const result = await createInstallmentPlan(planData).unwrap();
      if (result.success || result._id) {
        refetchPlans();
        return {
          success: true,
          message: "Plan created successfully!",
          data: result,
        };
      }
      return { success: false, message: result.message || "Creation failed" };
    } catch (error) {
      return { success: false, message: error.data?.message || error.message };
    }
  };

  const handleUpdatePlan = async (id, data) => {
    try {
      await updateInstallmentPlan({ id, ...data }).unwrap();
      refetchPlans();
      return { success: true, message: "Plan updated successfully" };
    } catch (error) {
      return { success: false, message: error.data?.message || error.message };
    }
  };

  const handleTogglePlanStatus = async (id, isActive) => {
    return await handleUpdatePlan(id, { isActive });
  };

  // Stats
  const calculateStats = (plans) => {
    const total = plans.length;
    const active = plans.filter((p) => p.isActive).length;
    const totalInst = plans.reduce(
      (sum, p) => sum + (p.numberOfInstallments || 0),
      0
    );

    return {
      total,
      active,
      inactive: total - active,
      averageInstallments: total > 0 ? (totalInst / total).toFixed(1) : 0,
      monthlyPlans: plans.filter((p) => p.intervalDays === 30).length,
    };
  };

  const stats = calculateStats(installmentPlans);

  // Return Object
  const catalogData = {
    installmentPlans,
    departments,
    programs,
    stats,
    isLoading: isLoadingPlans || departmentsLoading || programsLoading,
    isLoadingPlans,
    isCreatingPlan,
    isUpdatingPlan,

    handleCreatePlan,
    handleUpdatePlan,
    handleTogglePlanStatus,
    refetchPlans,
    setSearchTerm,
    searchTerm,
  };

  // IMPORTANT: Ensure children is a function
  if (typeof children === "function") {
    return children(catalogData);
  }

  return null;
};

export default InstallmentPlanController;
