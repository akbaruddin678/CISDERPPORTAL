import { useState, useEffect, useCallback } from "react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const useAdmssionController = ({ limit = 10 } = {}) => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Stable fetch function with proper dependencies
  const fetchAdmissions = useCallback(
    async (pageNum = 1, isRefetch = false) => {
      // Prevent multiple simultaneous requests
      if (isFetching) {
        return;
      }

      setIsFetching(true);
      setError(null);

      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetch(
          `${baseUrl}/api/admissions/admission-list?page=${pageNum}&limit=${limit}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.data) {
          if (isRefetch || pageNum === 1) {
            // Replace all data for refetch or first page
            setData(result.data);
          } else {
            // Append data for pagination
            setData((prev) => [...prev, ...result.data]);
          }

          setHasMore(result.hasMore !== false);
          setPage(pageNum + 1);

          if (isInitialLoad) {
            setIsInitialLoad(false);
          }
        }
      } catch (error) {
        console.error("❌ Error loading admissions:", error);
        setError(error.message);
      } finally {
        setIsFetching(false);
      }
    },
    [limit, isFetching, isInitialLoad]
  ); // Add all dependencies

  const loadNext = useCallback(() => {
    if (!isFetching && hasMore && !isInitialLoad) {
      return fetchAdmissions(page, false);
    }
    return Promise.resolve();
  }, [fetchAdmissions, page, hasMore, isFetching, isInitialLoad]);

  const refetch = useCallback(() => {
    setPage(1);
    setHasMore(true);
    return fetchAdmissions(1, true);
  }, [fetchAdmissions]);

  const removeAdmission = useCallback((admissionId) => {
    setData((prevData) =>
      prevData.filter((admission) => admission.id !== admissionId)
    );
  }, []);

  const removeSessionAdmissions = useCallback((sessionId) => {
    // You'll need to pass sessions to this function or handle it differently
    // Implementation depends on your data structure
  }, []);

  // FIXED: useEffect with proper dependencies and cleanup
  useEffect(() => {
    // Only fetch on initial load
    if (isInitialLoad && !isFetching) {
      fetchAdmissions(1, true);
    }
  }, [isInitialLoad, isFetching, fetchAdmissions]); // Add fetchAdmissions to dependencies

  return {
    data,
    loadNext,
    hasMore,
    isFetching,
    error,
    refetch,
    removeAdmission,
    removeSessionAdmissions,
  };
};