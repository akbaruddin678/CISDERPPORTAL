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
    fullCatalog,
    fetchStudents,
  } = useStudentManagement();

  // 2. Local State Management
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  // Where the selected students go: class -> program -> section, plus the
  // session. Class/program start as the source ones (same-class moves) and
  // can be changed for a real class promotion (e.g. 9th -> 10th).
  const [targetDepartmentId, setTargetDepartmentId] = useState("");
  const [targetProgramId, setTargetProgramId] = useState("");
  const [targetSemesterId, setTargetSemesterId] = useState("");
  const [targetSessionId, setTargetSessionId] = useState("");
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

  // 4. Target defaults to the source class/program/session; section is reset
  useEffect(() => {
    setTargetDepartmentId(filters.departmentId || "");
    setTargetProgramId(filters.programId || "");
    setTargetSemesterId("");
  }, [filters.departmentId, filters.programId]);

  useEffect(() => {
    setTargetSessionId(filters.sessionId || "");
  }, [filters.sessionId]);

  const handleTargetDepartmentChange = useCallback((value) => {
    setTargetDepartmentId(value);
    setTargetProgramId("");
    setTargetSemesterId("");
  }, []);

  const handleTargetProgramChange = useCallback((value) => {
    setTargetProgramId(value);
    setTargetSemesterId("");
  }, []);

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
          "Please select a Target Section to specify where students move",
        severity: "warning",
      });
      return false;
    }

    if (!filters.semesterId) {
      setFeedback({
        open: true,
        message: "Please select a Current Section to define the source cohort",
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

    if (!targetSessionId) {
      setFeedback({
        open: true,
        message: "Please select the Target Session",
        severity: "warning",
      });
      return false;
    }

    if (!filters.departmentId || !filters.programId) {
      setFeedback({
        open: true,
        message:
          "Please complete all filter selections (Class, Program, Section, Session)",
        severity: "error",
      });
      return false;
    }

    return true;
  }, [selectedStudentIds.length, targetSemesterId, targetSessionId, filters]);

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
          targetSessionId,
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
              targetSessionId,
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
      targetSessionId,
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
          targetSessionId,
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
      targetSessionId,
    ],
  );

  // 9. Helper: Filter available target semesters based on program
  const availableTargetPrograms = useMemo(() => {
    if (!targetDepartmentId) return [];
    return fullCatalog.programs.filter(
      (p) => String(p.departmentId?._id || p.departmentId) === String(targetDepartmentId),
    );
  }, [targetDepartmentId, fullCatalog.programs]);

  const availableTargetSemesters = useMemo(() => {
    if (!targetProgramId) {
      return [];
    }

    return fullCatalog.semesters
      .filter((s) => {
        // Match by program ID (handle both object and string references)
        const sProgramId =
          typeof s.programId === "object" ? s.programId?._id : s.programId;
        return String(sProgramId) === String(targetProgramId);
      })
      .sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [targetProgramId, fullCatalog.semesters]);

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
    fullCatalog,
    targetDepartmentId,
    targetProgramId,
    targetSemesterId,
    targetSessionId,
    availableTargetPrograms,
    availableTargetSemesters,
    isProcessing,
    feedback,
    defaulterModal,

    // Actions
    setFilters,
    setTargetSemesterId,
    setTargetSessionId,
    handleTargetDepartmentChange,
    handleTargetProgramChange,
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
