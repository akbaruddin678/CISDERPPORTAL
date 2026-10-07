// controller/StudentScholarshipController.js
import { useEffect, useState, useMemo } from "react";
import {
  useGetStudentScholarshipsQuery,
  useApplyStudentScholarshipMutation,
  useApproveStudentScholarshipMutation,
  useRejectStudentScholarshipMutation,
  useRevokeStudentScholarshipMutation,
  useCheckStudentEligibilityMutation,
  useGetScholarshipPlansQuery,
  useGetScholarshipStatsQuery,
  useLazyGetStudentFeeContextQuery,
} from "../api/scholarshipApi";
import {
  useGetStudentsQuery,
  useGetSemestersQuery,
  useGetTermsQuery,
  useGetDepartmentsQuery,
  useGetProgramsQuery,
} from "../api/depsemtermpro";
import { useUpsertStudentFeeMutation } from "../api/feeStructureApi";

const StudentScholarshipController = ({
  children,
  filters,
  onFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || "");

  // Keep the search box in sync when filters are reset/changed externally
  // (e.g. the "Reset" button), without fighting the debounce below.
  useEffect(() => {
    setSearchTerm(filters.search || "");
  }, [filters.search]);

  // The search box previously only updated this local display state and
  // was never actually sent to the server — typing did nothing. Debounce
  // it (matches the pattern used by every other search box in this admin
  // area) and push it up into the real query filters.
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== (filters.search || "")) {
        onFilterChange({ search: searchTerm });
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // --- 1. NEW STATE: For filtering the Student Dropdown in the Modal ---
  const [studentListFilters, setStudentListFilters] = useState({
    page: 1,
    limit: 1000, // Fetch a larger list for the dropdown
    termId: "", // Matches 'sessionId' from modal
    departmentId: "",
    programId: "",
    semesterId: "",
    search: "", // Added explicit search field for student filtering
  });

  // --- MUTATIONS ---
  const [applyStudentScholarship, { isLoading: isApplying }] =
    useApplyStudentScholarshipMutation();
  const [approveStudentScholarship, { isLoading: isApproving }] =
    useApproveStudentScholarshipMutation();
  const [rejectStudentScholarship, { isLoading: isRejecting }] =
    useRejectStudentScholarshipMutation();
  const [revokeStudentScholarship, { isLoading: isRevoking }] =
    useRevokeStudentScholarshipMutation();
  const [checkStudentEligibility] = useCheckStudentEligibilityMutation();
  const [fetchFeeContext] = useLazyGetStudentFeeContextQuery();
  const [upsertStudentFee, { isLoading: isSavingFee }] =
    useUpsertStudentFeeMutation();

  // --- QUERIES ---

  // 1. DATA FOR TABLE LIST (Paginated & Filtered)
  const {
    data: scholarshipsData,
    isLoading: isLoadingScholarships,
    refetch: refetchScholarships,
  } = useGetStudentScholarshipsQuery(filters);

  // 2. DATA FOR DASHBOARD STATS
  const { data: allApplicationsRes } = useGetStudentScholarshipsQuery({
    page: 1,
    limit: 2000,
  });

  const { data: statsData } = useGetScholarshipStatsQuery();
  const { data: plansData } = useGetScholarshipPlansQuery({ active: true });

  // 3. META DATA
  // --- UPDATED: Pass the dynamic filters to the query ---
  const { data: studentsData, isFetching: isFetchingStudents } =
    useGetStudentsQuery(studentListFilters, {
      refetchOnMountOrArgChange: true, // Ensure it refetches when filters change
    });

  const { data: termsData } = useGetTermsQuery();
  const { data: departmentsData } = useGetDepartmentsQuery();
  const { data: programsData } = useGetProgramsQuery();
  const { data: semestersData } = useGetSemestersQuery();

  // --- STATS CALCULATION ---
  const applicationStats = useMemo(() => {
    const apps = allApplicationsRes?.data || [];
    const total = apps.length;
    const pending = apps.filter((a) => a.status === "pending").length;
    const approved = apps.filter((a) => a.status === "approved").length;
    const rejected = apps.filter((a) => a.status === "rejected").length;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return {
      total,
      pending,
      approved,
      rejected,
      approvalRate,
    };
  }, [allApplicationsRes]);

  // --- HANDLERS ---
  const handleApproveScholarship = async (data) => {
    try {
      const id = typeof data === "string" ? data : data.id || data._id;
      if (!id) throw new Error("Invalid Application ID");

      await approveStudentScholarship({ id }).unwrap();
      refetchScholarships();
      return { success: true, message: "Application Approved" };
    } catch (error) {
      console.error("Approve Error:", error);
      return {
        success: false,
        message: error.data?.message || "Approval Failed",
      };
    }
  };

  const handleRejectScholarship = async (data) => {
    try {
      const id = typeof data === "string" ? data : data.id || data._id;
      const reason = data.rejectionReason || "Criteria not met";

      if (!id) throw new Error("Invalid Application ID");

      await rejectStudentScholarship({
        id,
        rejectionReason: reason,
      }).unwrap();
      refetchScholarships();
      return { success: true, message: "Application Rejected" };
    } catch (error) {
      return {
        success: false,
        message: error.data?.message || "Rejection Failed",
      };
    }
  };

  const handleApplyScholarship = async (data) => {
    try {
      await applyStudentScholarship(data).unwrap();
      refetchScholarships();
      return { success: true, message: "Scholarship Assigned Successfully" };
    } catch (error) {
      return {
        success: false,
        message: error.data?.message || "Assignment Failed",
      };
    }
  };

  const handleRevokeScholarship = async (data) => {
    try {
      const id = typeof data === "string" ? data : data.id || data._id;
      const reason = data.reason || data.rejectionReason;
      if (!id) throw new Error("Invalid Application ID");
      if (!reason) throw new Error("A reason is required to revoke a scholarship.");

      await revokeStudentScholarship({
        id,
        rejectionReason: reason,
      }).unwrap();
      refetchScholarships();
      return { success: true, message: "Scholarship revoked" };
    } catch (error) {
      return {
        success: false,
        message: error.data?.message || error.message || "Revoke Failed",
      };
    }
  };

  // Tuition/fee context for a student — used by the Assign/Approve modals
  // to preview the real deduction and offer the optional "set up fee"
  // shortcut. A plain fetch wrapper (not a hook) so modals can call it
  // on-demand per selected student instead of subscribing permanently.
  const handleFetchFeeContext = async (studentId) => {
    if (!studentId) return null;
    try {
      const res = await fetchFeeContext(studentId).unwrap();
      return res;
    } catch (error) {
      return null;
    }
  };

  // "Direct option to set up fee if missing" — a minimal ACADEMIC fee
  // structure (one total amount, no itemized breakdown) via the same
  // endpoint the Fee Setup screens already use. Always optional — never
  // required before assigning/approving a scholarship.
  const handleUpsertStudentFee = async ({
    studentId,
    termId,
    semesterId,
    totalAmount,
  }) => {
    try {
      await upsertStudentFee({
        studentId,
        termId,
        semesterId,
        category: "ACADEMIC",
        title: "Tuition Fee",
        totalAmount,
        feeItems: [],
        remarks: "Set up via Scholarship Assignment",
      }).unwrap();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.data?.message || "Failed to set up fee",
      };
    }
  };

  const handleCheckEligibility = async (studentId, planId) => {
    try {
      const result = await checkStudentEligibility({
        studentId,
        scholarshipPlanId: planId,
      }).unwrap();
      return { success: true, ...result };
    } catch (error) {
      return {
        success: true,
        isEligible: false,
        data: { reason: error.data?.message || "Check failed" },
      };
    }
  };

  // Safely extract data arrays
  const students = studentsData?.data || studentsData || [];
  const terms = termsData?.data || termsData || [];
  const departments = departmentsData?.data || departmentsData || [];
  const programs = programsData?.data || programsData || [];
  const semesters = semestersData?.data || semestersData || [];

  const controllerData = {
    studentScholarships: scholarshipsData?.data || [],
    scholarshipsPagination: scholarshipsData?.pagination || {},
    applicationStats: applicationStats,
    scholarshipPlans: plansData?.data || [],
    students,
    terms,
    departments,
    programs,
    semesters,
    isLoadingScholarships,
    isApplying,
    isApproving,
    isRejecting,
    isRevoking,
    isFetchingStudents,
    isSavingFee,
    handleApproveScholarship,
    handleRejectScholarship,
    handleRevokeScholarship,
    handleApplyScholarship,
    handleCheckEligibility,
    handleFetchFeeContext,
    handleUpsertStudentFee,
    setSearchTerm,
    searchTerm,
    handleRefresh: refetchScholarships,
    // --- EXPORT THE FILTERS AND SETTER ---
    studentListFilters,
    setStudentListFilters,
  };

  return children(controllerData);
};

export default StudentScholarshipController;
