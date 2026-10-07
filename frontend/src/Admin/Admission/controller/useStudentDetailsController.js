import { useState, useEffect, useCallback } from "react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";
import {
  useUpdateStudentMutation,
  useGetDepartmentsQuery,
  useGetProgramsQuery,
  useGetSemestersQuery,
  useGetSessionsQuery,
} from "../services/studentApi";

const useStudentDetailsController = (studentId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // RTK Query Mutation
  const [updateStudent, { isLoading: isUpdating }] = useUpdateStudentMutation();

  // Fetch Catalog Data for Academic Edit Dropdowns
  const { data: departmentsData } = useGetDepartmentsQuery();
  const { data: programsData } = useGetProgramsQuery();
  const { data: semestersData } = useGetSemestersQuery();
  const { data: sessionsData } = useGetSessionsQuery();

  const catalogData = {
    departments: departmentsData?.data || [],
    programs: programsData?.data || [],
    semesters: semestersData?.data || [],
    sessions: sessionsData?.data || [],
  };

  // Fetch Logic
  const fetchStudentDetails = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${baseUrl}/api/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) setData(result.data.student);
      else throw new Error(result.error || "Failed to load data");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudentDetails();
  }, [fetchStudentDetails]);

  // --- HANDLE UPDATE ---
  const handleUpdate = useCallback(
    async (section, textData, files = {}) => {
      try {
        const formData = new FormData();

        // 1. Append Section
        formData.append("section", section);

        // 2. Append Data (Must be stringified for Multer to read as body field)
        formData.append("data", JSON.stringify(textData));

        // 3. Append Files
        Object.keys(files).forEach((key) => {
          if (files[key] instanceof File) {
            formData.append(key, files[key]);
          }
        });

        // 4. Call Mutation
        const result = await updateStudent({
          studentId,
          formData,
        }).unwrap();

        // Refresh Data
        await fetchStudentDetails();

        return { success: true, message: result.message };
      } catch (err) {
        console.error("Update failed:", err);
        return {
          success: false,
          error: err?.data?.error || err?.message || "Update failed",
        };
      }
    },
    [studentId, updateStudent, fetchStudentDetails],
  );

  return {
    data,
    loading,
    error,
    refetch: fetchStudentDetails,
    handleUpdate,
    isUpdating,
    catalogData, // ✅ Passed catalog data
  };
};

export default useStudentDetailsController;
