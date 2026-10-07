import { useState, useCallback, useMemo, useEffect } from "react";
import { useStudentManagement } from "./useStudentManagement";
import {
  bulkMoveStudents,
  requestAccountOverride,
} from "../services/promotionService";

const useStudentPromotionController = () => {
  // 1. Get Data from the shared Management Hook
  const {
    students,
    loading: loadingStudents,
    filters,
    setFilters,
    catalogData,
    fetchStudents,
  } = useStudentManagement();

  // 2. Local State Management
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [targetSemesterId, setTargetSemesterId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Feedback State
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Defaulter Modal State
  const [defaulterModal, setDefaulterModal] = useState({
    open: false,
    list: [],
    retryPayload: null, // Store original payload for retry
  });

  // 3. Auto-clear selection when filters change
  useEffect(() => {
    setSelectedStudentIds([]);
  }, [filters]);

  // 4. Reset target semester when program changes
  useEffect(() => {
    setTargetSemesterId("");
  }, [filters.programId]);

  // 5. Selection Handlers
  const handleSelectAll = useCallback(
    (event) => {
      if (event.target.checked) {
        setSelectedStudentIds(students.map((s) => s._id));
      } else {
        setSelectedStudentIds([]);
      }
    },
    [students],
  );

  const handleSelectOne = useCallback((event, id) => {
    event.stopPropagation();
    if (event.target.checked) {
      setSelectedStudentIds((prev) => [...prev, id]);
    } else {
      setSelectedStudentIds((prev) => prev.filter((sid) => sid !== id));
    }
  }, []);

  // 6. Validation Helper
  const validateBulkAction = useCallback(() => {
    if (selectedStudentIds.length === 0) {
      setFeedback({
        open: true,
        message: "Please select at least one student to proceed",
        severity: "warning",
      });
      return false;
    }

    if (!targetSemesterId) {
      setFeedback({
        open: true,
        message:
          "Please select a Target Semester to specify where students move",
        severity: "warning",
      });
      return false;
    }

    if (!filters.semesterId) {
      setFeedback({
        open: true,
        message: "Please select a Current Semester to define the source cohort",
        severity: "error",
      });
      return false;
    }

    if (!filters.sessionId) {
      setFeedback({
        open: true,
        message: "Please select a Current Session as the source",
        severity: "error",
      });
      return false;
    }

    if (!filters.departmentId || !filters.programId) {
      setFeedback({
        open: true,
        message:
          "Please complete all filter selections (Department, Program, Semester, Session)",
        severity: "error",
      });
      return false;
    }

    return true;
  }, [selectedStudentIds.length, targetSemesterId, filters]);

  // 7. Main Promotion/Demotion Logic
  const handleBulkAction = useCallback(
    async (actionType) => {
      // Validate before proceeding
      if (!validateBulkAction()) {
        return;
      }

      setIsProcessing(true);

      try {
        const payload = {
          studentIds: selectedStudentIds,
          targetSemesterId,
          targetSessionId: filters.sessionId,
          actionType,
          sourceFilters: {
            departmentId: filters.departmentId,
            programId: filters.programId,
            semesterId: filters.semesterId,
            sessionId: filters.sessionId,
          },
        };

        // Store payload for potential retry
        setDefaulterModal((prev) => ({
          ...prev,
          retryPayload: payload,
        }));

        await bulkMoveStudents(payload);

        // Success feedback
        setFeedback({
          open: true,
          message: `Successfully ${
            actionType === "promote" ? "promoted" : "demoted"
          } ${selectedStudentIds.length} student(s)`,
          severity: "success",
        });

        // Clear UI state
        setSelectedStudentIds([]);
        setDefaulterModal({ open: false, list: [], retryPayload: null });

        // Refresh the student list
        await fetchStudents();
      } catch (error) {
        // Handle fee defaulters scenario
        if (
          error.data &&
          error.data.defaulters &&
          error.data.defaulters.length > 0
        ) {
          setDefaulterModal({
            open: true,
            list: error.data.defaulters,
            retryPayload: {
              studentIds: selectedStudentIds,
              targetSemesterId,
              targetSessionId: filters.sessionId,
              actionType,
            },
          });
          return; // Don't show snackbar; modal handles it
        }

        // Handle other errors
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "An unexpected error occurred during the operation";

        setFeedback({
          open: true,
          message: errorMessage,
          severity: "error",
        });

        // Optionally refresh to sync state
        fetchStudents();
      } finally {
        setIsProcessing(false);
      }
    },
    [
      selectedStudentIds,
      targetSemesterId,
      filters,
      validateBulkAction,
      fetchStudents,
    ],
  );

  // 8. Request Override Handler
  const handleRequestOverride = useCallback(
    async (remarks) => {
      if (!remarks.trim()) {
        setFeedback({
          open: true,
          message: "Please provide remarks for your override request",
          severity: "warning",
        });
        return;
      }

      try {
        const payload = {
          students: defaulterModal.list.map((d) => ({
            studentId: d.id,
            studentName: d.name,
            reason: d.reason,
          })),
          targetSemesterId,
          targetSessionId: filters.sessionId,
          remarks: remarks.trim(),
          sourceAction: defaulterModal.retryPayload?.actionType || "promote",
          requestedBy: "admin", // Should come from auth context
          timestamp: new Date().toISOString(),
        };

        await requestAccountOverride(payload);

        // Close modal
        setDefaulterModal({ open: false, list: [], retryPayload: null });

        // Success notification
        setFeedback({
          open: true,
          message:
            "Override request sent to Accounts Department. You'll be notified once reviewed.",
          severity: "info",
        });

        // Clear selection
        setSelectedStudentIds([]);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to send override request";

        setFeedback({
          open: true,
          message: errorMessage,
          severity: "error",
        });
      }
    },
    [
      defaulterModal.list,
      defaulterModal.retryPayload,
      targetSemesterId,
      filters.sessionId,
    ],
  );

  // 9. Helper: Filter available target semesters based on program
  const availableTargetSemesters = useMemo(() => {
    if (!filters.programId) {
      return [];
    }

    return catalogData.semesters
      .filter((s) => {
        // Match by program ID (handle both object and string references)
        const sProgramId =
          typeof s.programId === "object" ? s.programId?._id : s.programId;
        return sProgramId === filters.programId;
      })
      .sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [filters.programId, catalogData.semesters]);

  // 10. Feedback & Modal Handlers
  const closeFeedback = useCallback(
    () => setFeedback((prev) => ({ ...prev, open: false })),
    [],
  );

  const closeDefaulterModal = useCallback(() => {
    setDefaulterModal({ open: false, list: [], retryPayload: null });
  }, []);

  // 11. Calculate filter status
  const activeFilterCount = useMemo(
    () =>
      [
        filters.departmentId,
        filters.programId,
        filters.semesterId,
        filters.sessionId,
      ].filter(Boolean).length,
    [filters],
  );

  return {
    // Data
    students,
    loadingStudents,
    catalogData,
    filters,
    activeFilterCount,

    // State
    selectedStudentIds,
    targetSemesterId,
    availableTargetSemesters,
    isProcessing,
    feedback,
    defaulterModal,

    // Actions
    setFilters,
    setTargetSemesterId,
    handleSelectAll,
    handleSelectOne,
    handleBulkAction,
    handleRequestOverride,
    closeFeedback,
    closeDefaulterModal,

    // Exposed setters for edge cases
    setSelectedStudentIds,
    setFeedback,
    setDefaulterModal,

    // Utility
    validateBulkAction,
  };
};

export default useStudentPromotionController;
