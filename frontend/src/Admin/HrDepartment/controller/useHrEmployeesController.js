import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetAllStaffQuery,
  useUpdateStaffRolesMutation,
  useUpdateStaffStatusMutation,
  useDeleteStaffMutation,
  useEnsureStaffProfileMutation,
} from "../api/HrApi";
import { useGetDepartmentsQuery } from "../../../components/catalog/api/catalogApi";
import { isKnownRole, needsDepartment, getStaffModule, staffMatchesModule } from "../common/staffRoles";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

// Staff Directory is now purely a VIEW + MANAGE surface for employees who
// already exist — creating a new one only ever happens on the dedicated
// Onboard New Hire page (`/hr/onboard`), and editing a profile happens on
// the full Employee Profile page (`/hr/employee/:staffId`). This used to
// also have its own "Add New"/"Edit Profile" modal duplicating most of
// both of those, which is why the two screens looked like "the same
// thing" — removed in favor of one clear place for each job.
const useHrEmployeesController = (moduleKey) => {
  const { openAlert } = useGlobalAlert();
  const navigate = useNavigate();
  const lockedModule = moduleKey ? getStaffModule(moduleKey) : null;

  const { data: staffRes, isLoading: isFetchingStaff } = useGetAllStaffQuery();
  const { data: deptsRes } = useGetDepartmentsQuery();

  const [updateRoles, { isLoading: isUpdatingRoles }] =
    useUpdateStaffRolesMutation();
  const [updateStatus] = useUpdateStaffStatusMutation();
  const [deleteStaff] = useDeleteStaffMutation();
  const [ensureProfile] = useEnsureStaffProfileMutation();

  // Registered accounts that HR never onboarded have no StaffProfile yet
  // (row._id is null) — create the minimal one on first use so every action
  // below can keep working off a StaffProfile id.
  const resolveStaffId = async (row) => {
    if (row._id) return row._id;
    const res = await ensureProfile(row.userId._id).unwrap();
    return res.data.staffId;
  };

  const allStaff = extractArray(staffRes);
  const departments = extractArray(deptsRes);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");

  const [modals, setModals] = useState({ roles: false });
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [roleForm, setRoleForm] = useState({ roles: [], departmentId: "" });

  // Locked to one module (e.g. /hr/employees/role/teacher) -- membership is
  // computed live from User.roles, not stored, so changing someone's roles
  // moves them between modules automatically on the next render.
  const moduleStaff = useMemo(
    () => (lockedModule ? allStaff.filter((s) => staffMatchesModule(s, lockedModule)) : allStaff),
    [allStaff, lockedModule],
  );

  // Filter Logic mapped to unified Person structure
  const filteredStaff = useMemo(() => {
    return moduleStaff.filter((staff) => {
      const name = staff.personalInfo?.name || "";
      const email = staff.userId?.email || "";

      const searchMatch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase());

      const roleMatch =
        lockedModule ||
        roleFilter === "ALL" ||
        (staff.userId?.roles || []).includes(roleFilter);
      const deptId = staff.departmentId?._id || staff.departmentId;
      const deptMatch =
        deptFilter === "ALL" ||
        (deptFilter === "NONE" ? !deptId : deptId === deptFilter);

      return searchMatch && roleMatch && deptMatch;
    });
  }, [moduleStaff, searchQuery, roleFilter, deptFilter, lockedModule]);

  // Navigates to the full Employee Profile page (Basic Info, Profile,
  // Contract & Roles, Documents) — the ONE place both viewing AND editing
  // an existing employee happens now.
  const navigateToProfile = async (staff) => {
    try {
      navigate(`/hr/employee/${await resolveStaffId(staff)}`);
    } catch (error) {
      openAlert({
        message: error.data?.message || "Could not open this profile.",
        severity: "error",
      });
    }
  };
  const navigateToOnboard = () => navigate("/hr/onboard");

  // Roles the form can edit vs. old roles no longer in the system — those
  // are shown read-only and preserved by the backend on save.
  const openRoleModal = (staff) => {
    const current = staff.userId?.roles || [];
    setSelectedStaff(staff);
    setRoleForm({
      roles: current.filter(isKnownRole),
      departmentId: staff.departmentId?._id || staff.departmentId || "",
    });
    setModals({ ...modals, roles: true });
  };

  const legacyRoles = (selectedStaff?.userId?.roles || []).filter(
    (r) => !isKnownRole(r),
  );
  const roleFormError =
    needsDepartment(roleForm.roles) && !roleForm.departmentId
      ? "Pick a department — Teacher and HOD roles belong to a department."
      : "";

  const handleToggleRole = (role) => {
    setRoleForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const handleSaveRoles = async () => {
    if (roleFormError) return;
    try {
      await updateRoles({
        staffId: await resolveStaffId(selectedStaff), // StaffProfile ID
        payload: roleForm,
      }).unwrap();
      openAlert({
        message: "Access and department updated.",
        severity: "success",
      });
      setModals({ ...modals, roles: false });
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to update access.",
        severity: "error",
      });
    }
  };

  const handleToggleStatus = async (row) => {
    // Must match User.status's real enum (active/disabled/pending_verification)
    // — "suspended" isn't a valid value there.
    const newStatus = (row.userId?.status || "active") === "active" ? "disabled" : "active";
    if (!window.confirm(`Mark this employee as ${newStatus.toUpperCase()}?`))
      return;
    try {
      await updateStatus({ staffId: await resolveStaffId(row), status: newStatus }).unwrap();
      openAlert({
        message: `Status changed to ${newStatus}.`,
        severity: "success",
      });
    } catch (error) {
      openAlert({
        message: error.data?.message || "Failed to change status.",
        severity: "error",
      });
    }
  };

  const handleDeleteStaff = async (row) => {
    if (
      !window.confirm(
        "WARNING: This will permanently delete this employee record. Continue?",
      )
    )
      return;
    try {
      await deleteStaff(await resolveStaffId(row)).unwrap();
      openAlert({ message: "Employee record deleted.", severity: "success" });
    } catch (error) {
      openAlert({
        message: error.data?.message || "Deletion failed.",
        severity: "error",
      });
    }
  };

  return {
    departments,
    filteredStaff,
    isFetchingStaff,
    allStaff,
    lockedModule,
    moduleStaff,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    deptFilter,
    setDeptFilter,
    modals,
    setModals,
    selectedStaff,
    legacyRoles,
    roleFormError,
    navigateToProfile,
    navigateToOnboard,
    roleForm,
    setRoleForm,
    openRoleModal,
    handleToggleRole,
    handleSaveRoles,
    isUpdatingRoles,
    handleToggleStatus,
    handleDeleteStaff,
  };
};

export default useHrEmployeesController;
