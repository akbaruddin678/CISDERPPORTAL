import { useMemo, useState } from "react";
import { useGetAllStaffQuery, useGetExitRecordsQuery } from "../api/HrApi";

// Staff whose employment lifecycle has ended — StaffProfile.status is
// flipped to one of these two by exitController.updateExitRecord once every
// clearance is signed off (see EXIT_TYPE_TO_STAFF_STATUS there). This is
// the institution's own definition of "alumni" for former employees.
const ALUMNI_STATUSES = ["Resigned", "Terminated"];

const yearsOfService = (start, end) => {
  if (!start) return null;
  const from = new Date(start);
  const to = end ? new Date(end) : new Date();
  const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (months < 12) return `${Math.max(months, 0)} mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0 ? `${years} yr` : `${years}y ${rem}m`;
};

export const useAlumniPortalController = () => {
  const { data: staffRes, isFetching: isFetchingStaff } = useGetAllStaffQuery();
  const { data: exitRes, isFetching: isFetchingExits } = useGetExitRecordsQuery();

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [exitTypeFilter, setExitTypeFilter] = useState("");

  const isLoading = isFetchingStaff || isFetchingExits;

  const exitByStaffId = useMemo(() => {
    const map = new Map();
    (exitRes?.data || []).forEach((r) => {
      const id = String(r.staffId?._id || r.staffId || "");
      if (id) map.set(id, r);
    });
    return map;
  }, [exitRes]);

  const alumni = useMemo(() => {
    return (staffRes?.data || [])
      .filter((s) => ALUMNI_STATUSES.includes(s.status))
      .map((s) => {
        const exit = exitByStaffId.get(String(s._id));
        return {
          ...s,
          exitType: exit?.type || s.status,
          lastWorkingDay: exit?.lastWorkingDay || null,
          exitReason: exit?.reason || "",
          service: yearsOfService(s.joiningDate, exit?.lastWorkingDay),
        };
      })
      .sort((a, b) => new Date(b.lastWorkingDay || b.updatedAt || 0) - new Date(a.lastWorkingDay || a.updatedAt || 0));
  }, [staffRes, exitByStaffId]);

  const departments = useMemo(() => {
    const map = new Map();
    alumni.forEach((a) => {
      if (a.departmentId?._id) map.set(a.departmentId._id, a.departmentId.name);
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [alumni]);

  const designations = useMemo(
    () => Array.from(new Set(alumni.map((a) => a.designation).filter(Boolean))).sort(),
    [alumni],
  );

  const exitTypes = useMemo(
    () => Array.from(new Set(alumni.map((a) => a.exitType).filter(Boolean))).sort(),
    [alumni],
  );

  const filteredAlumni = useMemo(() => {
    const q = search.trim().toLowerCase();
    return alumni.filter((a) => {
      if (departmentFilter && a.departmentId?._id !== departmentFilter) return false;
      if (designationFilter && a.designation !== designationFilter) return false;
      if (exitTypeFilter && a.exitType !== exitTypeFilter) return false;
      if (!q) return true;
      const name = a.personalInfo?.name?.toLowerCase() || "";
      const empId = a.employeeId?.toLowerCase() || "";
      const designation = a.designation?.toLowerCase() || "";
      const dept = a.departmentId?.name?.toLowerCase() || "";
      return name.includes(q) || empId.includes(q) || designation.includes(q) || dept.includes(q);
    });
  }, [alumni, search, departmentFilter, designationFilter, exitTypeFilter]);

  const stats = useMemo(
    () => ({
      total: alumni.length,
      resigned: alumni.filter((a) => a.status === "Resigned").length,
      terminated: alumni.filter((a) => a.status === "Terminated").length,
      teaching: alumni.filter((a) => /teach|lecturer|professor|faculty/i.test(a.designation || "")).length,
    }),
    [alumni],
  );

  const hasActiveFilters = Boolean(search || departmentFilter || designationFilter || exitTypeFilter);
  const resetFilters = () => {
    setSearch("");
    setDepartmentFilter("");
    setDesignationFilter("");
    setExitTypeFilter("");
  };

  return {
    isLoading,
    alumni: filteredAlumni,
    totalCount: alumni.length,
    stats,
    departments,
    designations,
    exitTypes,
    search,
    setSearch,
    departmentFilter,
    setDepartmentFilter,
    designationFilter,
    setDesignationFilter,
    exitTypeFilter,
    setExitTypeFilter,
    hasActiveFilters,
    resetFilters,
  };
};
