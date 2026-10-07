import { useState, useEffect, useCallback } from "react";

export const useMyDepartmentController = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    activeCourses: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Dashboard Stats for the Department
  const fetchDepartmentStats = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulated Data (Replace with real API call later)
      setTimeout(() => {
        setStats({
          totalStudents: 1250,
          totalFaculty: 45,
          activeCourses: 32,
        });
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error("Error fetching department stats:", error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartmentStats();
  }, [fetchDepartmentStats]);

  return {
    stats,
    isLoading,
    refetch: fetchDepartmentStats,
  };
};

export default useMyDepartmentController;
