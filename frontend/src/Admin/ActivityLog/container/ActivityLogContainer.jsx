import { useState, useCallback } from "react";

import {
  useGetActivityLogsQuery,
  useGetActivityLogMetaQuery,
  useLazyExportActivityLogsQuery,
  useReviewActivityLogMutation,
  useUnreviewActivityLogMutation,
} from "../api/activityLogApi";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import ActivityLogView from "../view/ActivityLogView";

const DEFAULT_FILTERS = {
  search: "",
  module: "",
  action: "",
  method: "",
  success: "",
  reviewed: "",
  dateFrom: "",
  dateTo: "",
};

const ActivityLogContainer = () => {
  const { openAlert } = useGlobalAlert();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [selectedLog, setSelectedLog] = useState(null);
  const [reviewNote, setReviewNote] = useState("");

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useGetActivityLogsQuery({ ...filters, page, limit });
  const { data: meta } = useGetActivityLogMetaQuery();

  const [triggerExport, { isFetching: isExporting }] =
    useLazyExportActivityLogsQuery();
  const [reviewLog, { isLoading: isReviewSaving }] =
    useReviewActivityLogMutation();
  const [unreviewLog] = useUnreviewActivityLogMutation();

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const handleViewDetail = useCallback((log) => {
    setSelectedLog(log);
    setReviewNote(log.note || "");
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedLog(null);
    setReviewNote("");
  }, []);

  const handleSaveReview = useCallback(async () => {
    if (!selectedLog) return;
    try {
      const result = await reviewLog({
        id: selectedLog._id,
        note: reviewNote,
      }).unwrap();
      setSelectedLog(result.log);
      openAlert?.({ severity: "success", message: "Review saved." });
    } catch {
      openAlert?.({ severity: "error", message: "Failed to save review." });
    }
  }, [selectedLog, reviewNote, reviewLog, openAlert]);

  const handleUnreview = useCallback(async () => {
    if (!selectedLog) return;
    try {
      await unreviewLog(selectedLog._id).unwrap();
      handleCloseDetail();
      openAlert?.({ severity: "success", message: "Review removed." });
    } catch {
      openAlert?.({ severity: "error", message: "Failed to update." });
    }
  }, [selectedLog, unreviewLog, openAlert, handleCloseDetail]);

  const handleExport = useCallback(async () => {
    try {
      const result = await triggerExport(filters).unwrap();
      const rows = result?.logs || [];
      if (rows.length === 0) {
        openAlert?.({
          severity: "info",
          message: "No activity matches these filters to export.",
        });
        return;
      }

      const XLSX = await import("xlsx");
      const sheetRows = rows.map((log) => ({
        Time: new Date(log.createdAt).toLocaleString("en-GB"),
        User: log.userEmail,
        Roles: (log.userRoles || []).join(", "),
        Module: log.module,
        Action: log.action,
        Method: log.method,
        Route: log.route,
        "Status Code": log.statusCode,
        Success: log.success ? "Yes" : "No",
        "IP Address": log.ipAddress || "",
        Reviewed: log.reviewed ? "Yes" : "No",
        Note: log.note || "",
      }));
      const ws = XLSX.utils.json_to_sheet(sheetRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Activity Log");
      XLSX.writeFile(
        wb,
        `Activity_Log_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch {
      openAlert?.({ severity: "error", message: "Failed to export log." });
    }
  }, [filters, triggerExport, openAlert]);

  return (
    <ActivityLogView
      logs={data?.logs || []}
      total={data?.total || 0}
      page={data?.page || page}
      totalPages={data?.totalPages || 1}
      isLoading={isLoading}
      isFetching={isFetching}
      meta={meta}
      filters={filters}
      onFilterChange={handleFilterChange}
      onResetFilters={handleResetFilters}
      onPageChange={setPage}
      onRefresh={refetch}
      onExport={handleExport}
      isExporting={isExporting}
      onViewDetail={handleViewDetail}
      selectedLog={selectedLog}
      onCloseDetail={handleCloseDetail}
      reviewNote={reviewNote}
      onReviewNoteChange={setReviewNote}
      onSaveReview={handleSaveReview}
      onUnreview={handleUnreview}
      isReviewSaving={isReviewSaving}
    />
  );
};

export default ActivityLogContainer;
