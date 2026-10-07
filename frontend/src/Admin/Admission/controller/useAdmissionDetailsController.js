import { useState, useEffect, useCallback, useMemo } from "react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

const useAdmissionDetailsController = (admissionId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Catalog data states
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const generateSemestersForProgram = useCallback(
    (programId, programDuration = 8) => {
      const generatedSemesters = [];
      for (let i = 1; i <= programDuration; i++) {
        generatedSemesters.push({
          _id: `${programId}-semester-${i}`,
          number: i,
          name: `Semester ${i}`,
          programId: programId,
        });
      }
      return generatedSemesters;
    },
    [],
  );

  const getSemestersByProgram = useCallback(
    (programId) => {
      if (!programId) return [];
      const existingSemesters = semesters.filter(
        (sem) => sem.programId === programId,
      );
      if (existingSemesters.length > 0) {
        return existingSemesters;
      }
      return generateSemestersForProgram(programId);
    },
    [semesters, generateSemestersForProgram],
  );

  const fetchCatalogData = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const token = getAuthToken();

      const [deptsRes, progsRes, semsRes, sessionsRes] = await Promise.all([
        fetch(`${baseUrl}/api/catalog/departments`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${baseUrl}/api/catalog/programs`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${baseUrl}/api/catalog/semesters`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${baseUrl}/api/catalog/terms`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      if (deptsRes.ok) {
        const deptsData = await deptsRes.json();
        setDepartments(
          Array.isArray(deptsData.data)
            ? deptsData.data
            : Array.isArray(deptsData)
              ? deptsData
              : [],
        );
      } else {
        setDepartments([]);
      }

      if (progsRes.ok) {
        const progsData = await progsRes.json();
        setPrograms(
          Array.isArray(progsData.data)
            ? progsData.data
            : Array.isArray(progsData)
              ? progsData
              : [],
        );
      } else {
        setPrograms([]);
      }

      if (semsRes.ok) {
        const semsData = await semsRes.json();
        setSemesters(
          Array.isArray(semsData.data)
            ? semsData.data
            : Array.isArray(semsData)
              ? semsData
              : [],
        );
      } else {
        setSemesters([]);
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(
          Array.isArray(sessionsData.data)
            ? sessionsData.data
            : Array.isArray(sessionsData)
              ? sessionsData
              : [],
        );
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error("❌ Error fetching catalog data:", error);
      setDepartments([]);
      setPrograms([]);
      setSemesters([]);
      setSessions([]);
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  const fetchAdmissionDetails = useCallback(async () => {
    if (!admissionId) return;

    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();

      const response = await fetch(
        `${baseUrl}/api/admissions/admission-details/${admissionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error("❌ Error loading admission details:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [admissionId]);

  useEffect(() => {
    if (admissionId) {
      fetchAdmissionDetails();
      fetchCatalogData();
    }
  }, [admissionId, fetchAdmissionDetails, fetchCatalogData]);

  // FIXED: Accepts FormData and removes the hardcoded JSON header
  const promoteStudent = useCallback(async (promotionFormData) => {
    // Basic validation from the FormData object
    const admissionId = promotionFormData.get("admissionId");

    if (!admissionId) {
      throw new Error("Admission ID is required for promotion");
    }

    try {
      const token = getAuthToken();

      const response = await fetch(`${baseUrl}/api/promotion/promote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Let the browser set the Content-Type to multipart/form-data with the correct boundary
        },
        body: promotionFormData, // Send FormData object directly
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Promotion failed: ${response.status}`,
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }, []);

  const catalogData = useMemo(
    () => ({
      departments: Array.isArray(departments) ? departments : [],
      programs: Array.isArray(programs) ? programs : [],
      semesters: Array.isArray(semesters) ? semesters : [],
      sessions: Array.isArray(sessions) ? sessions : [],
    }),
    [departments, programs, semesters, sessions],
  );

  return {
    data,
    loading,
    error,
    refetch: fetchAdmissionDetails,
    departments: catalogData.departments,
    programs: catalogData.programs,
    semesters: catalogData.semesters,
    sessions: catalogData.sessions,
    loadingCatalog,
    promoteStudent,
    getSemestersByProgram,
  };
};

export default useAdmissionDetailsController;
