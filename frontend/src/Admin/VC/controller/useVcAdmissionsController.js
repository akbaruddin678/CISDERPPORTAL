import { useEffect, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { useGetVcAdmissionsListQuery, useGetVcAdmissionDetailsQuery } from "../api/vcAdmissionsApi";
import { errorText } from "../../Graduation/common/graduationHelpers";

const useDebounced = (value, ms = 350) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
};

export const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
];

// Full, read-only view of every admission application, at every stage —
// the VC portal's answer to "show each and every thing about admission".
export const useVcAdmissionsController = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search.trim());
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isFetching, error } = useGetVcAdmissionsListQuery({
    page,
    limit,
    search: debouncedSearch,
    status,
  });

  // Response shape here is flat ({ data, total, hasMore, page, limit }), not
  // the { success, data: { ... } } envelope most other endpoints use.
  const applications = data?.data || [];
  const total = data?.total || 0;
  const pagination = { total, totalPages: Math.max(1, Math.ceil(total / limit)), currentPage: data?.page || page };
  const stats = {
    total: data?.stats?.total ?? total,
    draft: data?.stats?.draft ?? 0,
    submitted: data?.stats?.submitted ?? 0,
    underReview: data?.stats?.under_review ?? 0,
    accepted: data?.stats?.accepted ?? 0,
    rejected: data?.stats?.rejected ?? 0,
  };

  const [selectedId, setSelectedId] = useState(null);
  const { currentData: detailRes, isFetching: isLoadingDetail, error: detailError } = useGetVcAdmissionDetailsQuery(
    selectedId || skipToken,
  );

  return {
    search,
    setSearch: (v) => {
      setSearch(v);
      setPage(1);
    },
    status,
    setStatus: (v) => {
      setStatus(v);
      setPage(1);
    },
    applications,
    stats,
    pagination,
    page,
    pageSize: limit,
    setPage,
    isLoading: isFetching && !data,
    isFetching,
    errorMessage: error ? errorText(error) : "",

    selectedId,
    openApplication: setSelectedId,
    closeApplication: () => setSelectedId(null),
    detail: detailRes?.data || null,
    isLoadingDetail,
    detailErrorMessage: detailError ? errorText(detailError) : "",
  };
};
