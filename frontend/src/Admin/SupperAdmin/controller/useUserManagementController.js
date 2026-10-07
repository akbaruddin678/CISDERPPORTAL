import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { getUserSchema } from "../service/userSchema";
import {
  useGetUsersByRolesQuery,
  useCreateUserByAdminMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "../api/useradminApi";

// Every role the User schema's enum actually accepts (see
// backend/src/user/model/User.js) — this is what the list defaults to
// showing before any filter is touched, so a role missing here (it used to
// leave out hod, head_of_academia, vc, vice_vc, exam and registrar, plus
// have "head"/"viewer" that don't match anything real) means those users
// are simply invisible on this screen until someone happens to filter for
// them specifically.
const ALL_ROLES = [
  "applicant",
  "student",
  "staff",
  "admin",
  "vc",
  "vice_vc",
  "head_of_academia",
  "registrar",
  "accountant",
  "headofaccount",
  "teacher",
  "hod",
  "course coordinator",
  "exam",
  "admission",
  "hr",
  "manager",
  "viwer",
  "transport",
  "library",
  "hostel",
  "it_labs",
  "clearance_officer",
];

export const useUserManagementController = () => {
  const { openAlert } = useGlobalAlert();
  const [selectedRoles, setSelectedRoles] = useState(ALL_ROLES);

  // --- NEW: Pagination & Search States ---
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState(""); // Debounced term can be added here

  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const isEditMode = !!editingUser;

  // APIs (Now with dynamic parameters)
  const {
    data: usersResponse,
    isLoading: isListLoading,
    isFetching, // Helpful for background re-fetches on page change
    error,
  } = useGetUsersByRolesQuery({
    roles: selectedRoles,
    page,
    limit,
    search: searchInput,
  });

  const [createUser, { isLoading: isCreating }] =
    useCreateUserByAdminMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const isFormLoading = isCreating || isUpdating;

  // Extract paginated data safely
  const users =
    usersResponse?.data?.map((item) => ({
      _id: item.user._id,
      name: item.person?.name || "N/A",
      email: item.user.email,
      role: item.user.roles?.[0] || "applicant",
      roles: item.user.roles || [],
      status: item.user.status || "active",
      campusId: item.user.campusId || "",
    })) || [];

  const paginationParams = usersResponse?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  // Form Setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(getUserSchema(isEditMode)),
    defaultValues: {
      name: "",
      email: "",
      role: "staff",
      password: "",
      confirmPassword: "",
      campusId: "",
    },
  });

  // Handle Fetch Errors
  useEffect(() => {
    if (error) {
      openAlert({
        message: error?.data?.error || "Failed to load users",
        severity: "error",
      });
    }
  }, [error, openAlert]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedRoles, searchInput]);

  // --- Handlers ---
  const handlePageChange = (event, newPage) => setPage(newPage);
  const handleLimitChange = (event) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(1);
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    reset({
      name: "",
      email: "",
      role: "staff",
      password: "",
      confirmPassword: "",
      campusId: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    reset({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
      confirmPassword: "",
      campusId: user.campusId || "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    reset();
  };

  const handleFormSubmit = async (data) => {
    try {
      const payload = { name: data.name, email: data.email, role: data.role, campusId: data.role === "headofaccount" ? "" : (data.campusId || "") };
      if (data.password && data.password.trim() !== "") {
        payload.password = data.password;
        payload.confirmPassword = data.confirmPassword;
      }

      if (isEditMode) {
        await updateUser({ id: editingUser._id, ...payload }).unwrap();
        openAlert({
          message: "User updated successfully",
          severity: "success",
        });
      } else {
        await createUser(payload).unwrap();
        openAlert({
          message: "User created successfully",
          severity: "success",
        });
      }
      handleCloseModal();
    } catch (err) {
      openAlert({
        message: err?.data?.error || err?.data?.message || "Operation failed",
        severity: "error",
      });
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "disabled" : "active";
    if (window.confirm(`Change this user to ${newStatus.toUpperCase()}?`)) {
      try {
        await updateUser({ id: userId, status: newStatus }).unwrap();
        openAlert({ message: "Status updated", severity: "success" });
      } catch {
        openAlert({ message: "Failed to update status", severity: "error" });
      }
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure? This action is PERMANENT.")) {
      try {
        await deleteUser(userId).unwrap();
        openAlert({ message: "User deleted", severity: "success" });
      } catch {
        openAlert({ message: "Failed to delete", severity: "error" });
      }
    }
  };

  return {
    users,
    paginationParams, // Export pagination metadata
    isListLoading: isListLoading || isFetching,
    selectedRoles,
    setSelectedRoles,
    searchInput,
    setSearchInput,
    page,
    limit,
    handlePageChange,
    handleLimitChange,

    isModalOpen,
    isEditMode,
    control,
    errors,
    isFormLoading,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseModal,
    handleFormSubmit: handleSubmit(handleFormSubmit),
    handleToggleStatus,
    handleDelete,
  };
};
