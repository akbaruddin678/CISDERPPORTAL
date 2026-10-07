import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetAllTermsQuery,
  useCreateTermMutation,
  useUpdateTermMutation,
  useDeleteTermMutation,
} from "../api/adminApi";

// 1. Validation Schema
const sessionSchema = yup.object().shape({
  name: yup.string().required("Session name is required (e.g., Fall 2025)"),
  startDate: yup
    .date()
    .required("Start date is required")
    .typeError("Invalid date"),
  endDate: yup
    .date()
    .required("End date is required")
    .min(yup.ref("startDate"), "End date must be after start date")
    .typeError("Invalid date"),
  status: yup.string().required("Status is required"),
});

export const useSessionManagementController = () => {
  const { openAlert } = useGlobalAlert();

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null); // Null = Create Mode
  const isEditMode = !!editingSession;

  // API Hooks
  const {
    data: termsData,
    isLoading: isListLoading,
    error,
  } = useGetAllTermsQuery();
  const [createTerm, { isLoading: isCreating }] = useCreateTermMutation();
  const [updateTerm, { isLoading: isUpdating }] = useUpdateTermMutation();
  const [deleteTerm] = useDeleteTermMutation();

  const sessions = termsData?.data || [];
  const isFormLoading = isCreating || isUpdating;

  // Form Setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(sessionSchema),
    defaultValues: { name: "", startDate: "", endDate: "", status: "active" },
  });

  // Handle Fetch Errors
  useEffect(() => {
    if (error)
      openAlert({ message: "Failed to load sessions", severity: "error" });
  }, [error, openAlert]);

  // --- Handlers ---
  const handleOpenCreate = () => {
    setEditingSession(null);
    reset({ name: "", startDate: "", endDate: "", status: "active" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (session) => {
    setEditingSession(session);
    reset({
      name: session.name,
      startDate: session.startDate?.split("T")[0] || "",
      endDate: session.endDate?.split("T")[0] || "",
      status: session.status ? "active" : "inactive", // Handle boolean to string
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSession(null);
    reset();
  };

  const onSubmitForm = async (data) => {
    try {
      const payload = {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status === "active", // Convert string back to boolean for backend
      };

      if (isEditMode) {
        await updateTerm({ id: editingSession._id, ...payload }).unwrap();
        openAlert({
          message: "Session updated successfully",
          severity: "success",
        });
      } else {
        await createTerm(payload).unwrap();
        openAlert({
          message: "Session created successfully",
          severity: "success",
        });
      }
      handleCloseModal();
    } catch (err) {
      openAlert({
        message: err?.data?.error || "Operation failed",
        severity: "error",
      });
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus; // Toggle boolean
      await updateTerm({ id, status: newStatus }).unwrap();
      openAlert({
        message: `Session ${newStatus ? "Activated" : "Deactivated"}`,
        severity: "success",
      });
    } catch (error) {
      openAlert({ message: "Failed to update status", severity: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      try {
        await deleteTerm(id).unwrap();
        openAlert({
          message: "Session deleted successfully",
          severity: "success",
        });
      } catch (error) {
        openAlert({
          message: error?.data?.error || "Failed to delete",
          severity: "error",
        });
      }
    }
  };

  return {
    // List Data
    sessions,
    isListLoading,

    // Form & Modal State
    isModalOpen,
    isEditMode,
    control,
    errors,
    isFormLoading,

    // Handlers
    handleOpenCreate,
    handleOpenEdit,
    handleCloseModal,
    handleDelete,
    handleToggleStatus,
    handleFormSubmit: handleSubmit(onSubmitForm),
  };
};
