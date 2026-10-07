import { useMemo, useState } from "react";
import {
  useGetAdmissionListQuery,
  useGetAdmissionDetailsQuery,
} from "../api/admissionsRegisterApi";

const STATUS_OPTIONS = ["All", "submitted", "under_review", "accepted", "rejected"];

export const useMeritListsController = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const { data, isFetching, refetch } = useGetAdmissionListQuery({
    page,
    limit: 20,
    search: searchQuery,
    status: statusFilter === "All" ? "" : statusFilter,
  });
  const admissions = useMemo(() => data?.data || [], [data]);
  const total = data?.total || 0;
  const hasMore = data?.hasMore || false;

  const { data: detailsRes, isFetching: isFetchingDetails } = useGetAdmissionDetailsQuery(
    selectedId,
    { skip: !selectedId },
  );
  const selectedAdmission = detailsRes || null;

  const stats = useMemo(
    () => ({
      total,
      submitted: admissions.filter((a) => a.status === "submitted").length,
      underReview: admissions.filter((a) => a.status === "under_review").length,
      accepted: admissions.filter((a) => a.status === "accepted").length,
    }),
    [admissions, total],
  );

  const handleViewDetails = (admission) => setSelectedId(admission.id);
  const handleCloseModal = () => setSelectedId(null);

  return {
    admissions,
    isLoading: isFetching,
    searchQuery,
    setSearchQuery: (q) => {
      setSearchQuery(q);
      setPage(1);
    },
    statusFilter,
    setStatusFilter: (s) => {
      setStatusFilter(s);
      setPage(1);
    },
    statusOptions: STATUS_OPTIONS,
    stats,
    refetch,
    page,
    setPage,
    hasMore,

    selectedAdmission,
    isFetchingDetails,
    isModalOpen: Boolean(selectedId),
    handleViewDetails,
    handleCloseModal,
  };
};
