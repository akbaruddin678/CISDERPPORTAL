import { useMemo, useState } from "react";
import { useGetComplianceReportsQuery } from "../../Registrar/api/complianceReportingApi";
import { errorText } from "../../Graduation/common/graduationHelpers";

// Read-only view of the same Compliance Reports the Registrar's office
// tracks (backend: registrar/controller/complianceController.js) — the VC
// gets executive visibility into accreditation/compliance status without
// the ability to create or submit reports, which stays a Registrar action.
export const useVcAccreditationsController = () => {
  const { data, isFetching, error, refetch } = useGetComplianceReportsQuery();
  const reports = useMemo(() => data?.data || [], [data]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const categories = useMemo(() => {
    const u = [...new Set(reports.map((r) => r.category))];
    return ["All", ...u];
  }, [reports]);

  const filtered = useMemo(
    () =>
      reports.filter((r) => {
        const q = searchQuery.trim().toLowerCase();
        return (
          (q === "" ||
            r.title.toLowerCase().includes(q) ||
            r.authority.toLowerCase().includes(q)) &&
          (statusFilter === "All" || r.status === statusFilter) &&
          (categoryFilter === "All" || r.category === categoryFilter)
        );
      }),
    [reports, searchQuery, statusFilter, categoryFilter],
  );

  const stats = useMemo(
    () => ({
      total: reports.length,
      submitted: reports.filter((r) => r.status === "Submitted").length,
      pending: reports.filter((r) => r.status === "Pending" || r.status === "Draft").length,
      overdue: reports.filter((r) => r.status === "Late").length,
    }),
    [reports],
  );

  return {
    reports: filtered,
    totalCount: reports.length,
    isLoading: isFetching && !data,
    errorMessage: error ? errorText(error) : "",
    refetch,
    isFetching,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    categories,
    stats,
  };
};
