// api/scholarshipApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../../Admin/Admission/services/getAuthToken";

// Helper function to transform backend data to frontend format
const transformPlanData = (plan) => {
  if (!plan) return null;

  return {
    id: plan._id,
    title: plan.title,
    description: plan.description,
    type: plan.type,
    maxAmount: plan.maxAmount,
    maxPercentage: plan.maxPercentage,
    termId: plan.termId?._id || plan.termId,
    termName: plan.termId?.name || "",
    createdBy: plan.createdBy?._id || plan.createdBy,
    createdByName: plan.createdBy?.name || "",
    active: plan.active,
    remark: plan.remark,
    validFrom: plan.validFrom,
    validTo: plan.validTo,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    totalAssignments: plan.totalAssignments || 0,
    activeAssignments: plan.activeAssignments || 0,
  };
};

const transformApplicationData = (application) => {
  if (!application) return null;

  // Extract data from new structure: application.student contains personal info
  const student = application.student || {};
  const plan = application.scholarshipPlanId || {};



  return {
    id: application._id || application.id,
    studentId: application.studentId || student._id || student.id,
    studentName: student.fullName || "Unknown Student",
    studentEmail: student.email || "",
    studentRollNo: student.rollNumber || "",
    studentPhone: student.phone || "",
    studentCNIC: student.cnic || "",
    studentRegNo: student.regNo || "",
    studentDOB: student.dob,
    studentGender: student.gender,
    studentCurrentAddress: student.currentAddress || {},
    studentPermanentAddress: student.permanentAddress || {},
    studentDepartment: student.department || "",
    studentProgram: student.program || "",
    studentSemesterNumber: student.semesterNumber ?? null,

    tuitionAmount: application.tuitionAmount || 0,
    scholarshipAmount: application.scholarshipAmount || 0,
    netAmount: application.netAmount ?? application.tuitionAmount ?? 0,
    hasFeeSetup: !!application.hasFeeSetup,

    scholarshipPlanId: plan._id || plan.id || application.scholarshipPlanId,
    planTitle: plan.title || "Unknown Plan",
    planType: plan.type || "fixed",
    planMaxAmount: plan.maxAmount || 0,
    planMaxPercentage: plan.maxPercentage || 0,

    appliedAmount: application.appliedAmount,
    approvedAmount: application.approvedAmount,
    status: application.status,
    appliedAt: application.appliedAt || application.createdAt,
    approvedAt: application.approvedAt,
    approvedBy: application.approvedBy?._id || application.approvedBy,
    approvedByName: application.approvedBy?.name || "",
    rejectionReason: application.rejectionReason,
    remarks: application.remarks,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
    termId: application.termId?._id || application.termId,
    termName: application.termId?.name || application.termName || "",
    semesterScope: application.semesterScope || "all",
    semesterIds: (application.semesterIds || []).map(
      (s) => s?._id || s,
    ),
    semesterNumbers: (application.semesterIds || [])
      .map((s) => s?.number)
      .filter((n) => n !== undefined),

    // Raw data for debugging
    _rawApplication: application,
  };
};

export const scholarshipApi = createApi({
  reducerPath: "scholarshipApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/account/scholarships`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["ScholarshipPlans", "StudentScholarships", "ScholarshipStats"],
  endpoints: (builder) => ({
    // ================== SCHOLARSHIP PLANS ==================
    getScholarshipPlans: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page);
        if (params.limit) queryParams.append("limit", params.limit);
        if (params.search) queryParams.append("search", params.search);
        if (params.active !== undefined)
          queryParams.append("active", params.active);
        if (params.type) queryParams.append("type", params.type);

        const queryString = queryParams.toString();
        return queryString ? `/plans?${queryString}` : "/plans";
      },
      providesTags: ["ScholarshipPlans"],
      transformResponse: (response) => {
        // Your backend returns: { data: [...], pagination: {...} }
        if (!response) {
          return {
            data: [],
            pagination: {
              page: 1,
              limit: 10,
              total: 0,
              totalPages: 0,
            },
          };
        }

        // Handle both formats: with success field or without
        const responseData = response.data || response;
        const responsePagination = response.pagination || {};

        const plans = Array.isArray(responseData)
          ? responseData
          : responseData?.data || [];

        const pagination = responsePagination ||
          response.data?.pagination || {
            page: 1,
            limit: 10,
            total: plans.length,
            totalPages: Math.ceil(plans.length / 10),
          };

        return {
          data: plans.map(transformPlanData),
          pagination: pagination,
        };
      },
    }),

    getScholarshipPlanById: builder.query({
      query: (id) => `/plans/${id}`,
      providesTags: (result, error, id) => [{ type: "ScholarshipPlans", id }],
      transformResponse: (response) => {
        if (!response) return null;
        // Handle both formats
        const responseData = response.data || response;
        return transformPlanData(responseData);
      },
    }),

    createScholarshipPlan: builder.mutation({
      query: (planData) => ({
        url: "/plans",
        method: "POST",
        body: planData,
      }),
      invalidatesTags: ["ScholarshipPlans"],
      transformResponse: (response) => {
        if (!response) {
          throw new Error("Failed to create plan");
        }
        const responseData = response.data || response;
        return transformPlanData(responseData);
      },
    }),

    updateScholarshipPlan: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/plans/${id}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ScholarshipPlans" },
        { type: "ScholarshipPlans", id },
      ],
      transformResponse: (response) => {
        if (!response) {
          throw new Error("Failed to update plan");
        }
        const responseData = response.data || response;
        return transformPlanData(responseData);
      },
    }),

    deleteScholarshipPlan: builder.mutation({
      query: (id) => ({
        url: `/plans/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ScholarshipPlans"],
      transformResponse: (response) => {
        if (!response) {
          throw new Error("Failed to delete plan");
        }
        return response;
      },
    }),

    toggleScholarshipPlanStatus: builder.mutation({
      query: ({ id, active }) => ({
        url: `/plans/${id}/status`,
        method: "PATCH",
        body: { active },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ScholarshipPlans" },
        { type: "ScholarshipPlans", id },
      ],
      transformResponse: (response) => {
        if (!response) {
          throw new Error("Failed to toggle plan status");
        }
        const responseData = response.data || response;
        return transformPlanData(responseData);
      },
    }),

    // ================== STUDENT SCHOLARSHIPS ==================
    getStudentScholarships: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();

        // Add all possible filters
        if (params.page) queryParams.append("page", params.page);
        if (params.limit) queryParams.append("limit", params.limit);
        if (params.studentId) queryParams.append("studentId", params.studentId);
        if (params.scholarshipPlanId)
          queryParams.append("scholarshipPlanId", params.scholarshipPlanId);
        if (params.status) queryParams.append("status", params.status);
        if (params.search) queryParams.append("search", params.search);
        if (params.termId) queryParams.append("termId", params.termId);
        if (params.departmentId)
          queryParams.append("departmentId", params.departmentId);
        if (params.programId) queryParams.append("programId", params.programId);

        const queryString = queryParams.toString();

        
        return queryString ? `/applications?${queryString}` : "/applications";
      },
      providesTags: ["StudentScholarships"],
      transformResponse: (response, meta, arg) => {
       

        if (!response) {
          console.warn("No response from scholarships API");
          return {
            data: [],
            pagination: {
              page: 1,
              limit: 10,
              total: 0,
              totalPages: 0,
            },
          };
        }

        // Handle different response formats
        let applications = [];
        let pagination = {};

        // Format 1: { success: true, data: [...], pagination: {...} } (NEW FORMAT)
        if (response.success && response.data && Array.isArray(response.data)) {
          applications = response.data;
          pagination = response.pagination || {};

       
        }
        // Format 2: { data: [...], pagination: {...} }
        else if (response.data && Array.isArray(response.data)) {
          applications = response.data;
          pagination = response.pagination || {};
        }
        // Format 3: Direct array
        else if (Array.isArray(response)) {
          applications = response;
          pagination = {
            page: 1,
            limit: applications.length,
            total: applications.length,
            totalPages: 1,
          };
        }
        // Format 4: { applications: [...], pagination: {...} }
        else if (
          response.applications &&
          Array.isArray(response.applications)
        ) {
          applications = response.applications;
          pagination = response.pagination || {};
        }

      

        return {
          data: applications.map(transformApplicationData),
          pagination: {
            page: pagination.page || 1,
            limit: pagination.limit || 10,
            total: pagination.total || applications.length,
            totalPages:
              pagination.totalPages ||
              Math.ceil(
                (pagination.total || applications.length) /
                  (pagination.limit || 10)
              ),
          },
        };
      },
    }),

    getStudentScholarshipById: builder.query({
      query: (id) => `/applications/${id}`,
      providesTags: (result, error, id) => [
        { type: "StudentScholarships", id },
      ],
      transformResponse: (response) => {
        if (!response) return null;
        const responseData = response.data || response;
        return transformApplicationData(responseData);
      },
    }),

    // NOTE: This is exported as useApplyStudentScholarshipMutation
    applyStudentScholarship: builder.mutation({
      query: (applicationData) => ({
        url: "/apply",
        method: "POST",
        body: applicationData,
      }),
      invalidatesTags: ["StudentScholarships"],
      transformResponse: (response) => {
        if (!response) {
          throw new Error("Failed to apply for scholarship");
        }
        const responseData = response.data || response;
        return transformApplicationData(responseData);
      },
    }),

    // NOTE: This is exported as useApproveStudentScholarshipMutation
    approveStudentScholarship: builder.mutation({
      query: ({ id, ...approvalData }) => ({
        url: `/applications/${id}/approve`,
        method: "PATCH",
        body: approvalData,
      }),
      invalidatesTags: ["StudentScholarships"],
      transformResponse: (response) => {
        if (!response) {
          throw new Error("Failed to approve scholarship");
        }
        const responseData = response.data || response;
        return transformApplicationData(responseData);
      },
    }),

    // NOTE: This is exported as useRejectStudentScholarshipMutation
    rejectStudentScholarship: builder.mutation({
      query: ({ id, ...rejectionData }) => ({
        url: `/applications/${id}/reject`,
        method: "PATCH",
        body: rejectionData,
      }),
      invalidatesTags: ["StudentScholarships"],
      transformResponse: (response) => {
        if (!response) {
          throw new Error("Failed to reject scholarship");
        }
        const responseData = response.data || response;
        return transformApplicationData(responseData);
      },
    }),

    // NOTE: This is exported as useRevokeStudentScholarshipMutation
    revokeStudentScholarship: builder.mutation({
      query: ({ id, ...revocationData }) => ({
        url: `/applications/${id}/revoke`,
        method: "PATCH",
        body: revocationData,
      }),
      invalidatesTags: ["StudentScholarships"],
      transformResponse: (response) => {
        if (!response) {
          throw new Error("Failed to revoke scholarship");
        }
        const responseData = response.data || response;
        return transformApplicationData(responseData);
      },
    }),

    // ================== STUDENT-SPECIFIC ENDPOINTS ==================
    getStudentScholarshipsByStudent: builder.query({
      query: ({ studentId, ...params }) => {
        const queryParams = new URLSearchParams();
        if (params.status) queryParams.append("status", params.status);

        const queryString = queryParams.toString();
        return queryString
          ? `/students/${studentId}/scholarships?${queryString}`
          : `/students/${studentId}/scholarships`;
      },
      providesTags: ["StudentScholarships"],
      transformResponse: (response) => {
        if (!response) return [];
        const responseData = response.data || response;
        return (responseData || []).map(transformApplicationData);
      },
    }),

    // NOTE: This is exported as useCheckStudentEligibilityMutation
    checkStudentEligibility: builder.mutation({
      query: ({ studentId, scholarshipPlanId }) => ({
        url: "/check-eligibility",
        method: "POST",
        body: { studentId, scholarshipPlanId },
      }),
      transformResponse: (response) => {
        if (!response) {
          throw new Error("Failed to check eligibility");
        }
        const responseData = response.data || response;
        return responseData;
      },
    }),

    getAvailablePlansForStudent: builder.query({
      query: ({ studentId, ...params }) => {
        const queryParams = new URLSearchParams();
        if (params.active !== undefined)
          queryParams.append("active", params.active);

        const queryString = queryParams.toString();
        return queryString
          ? `/students/${studentId}/available-plans?${queryString}`
          : `/students/${studentId}/available-plans`;
      },
      transformResponse: (response) => {
        if (!response) return [];
        const responseData = response.data || response;
        return (responseData || []).map(transformPlanData);
      },
    }),

    // Tuition/fee context for a student — powers the Assign/Approve
    // modals' fee preview and the optional inline "set up fee" shortcut.
    getStudentFeeContext: builder.query({
      query: (studentId) => `/students/${studentId}/fee-context`,
      transformResponse: (response) => {
        if (!response) return null;
        return response.data || response;
      },
    }),

    // ================== STATISTICS ==================
    getScholarshipStats: builder.query({
      query: () => "/stats",
      providesTags: ["ScholarshipStats"],
      transformResponse: (response) => {
        if (!response) return {};
        const responseData = response.data || response;
        return responseData || {};
      },
    }),
  }),
});

// ================== EXPORT ALL HOOKS ==================
// Export hooks for usage in components
export const {
  // Scholarship Plans
  useGetScholarshipPlansQuery,
  useLazyGetScholarshipPlansQuery,
  useGetScholarshipPlanByIdQuery,
  useLazyGetScholarshipPlanByIdQuery,
  useCreateScholarshipPlanMutation,
  useUpdateScholarshipPlanMutation,
  useDeleteScholarshipPlanMutation,
  useToggleScholarshipPlanStatusMutation,

  // Student Applications
  useGetStudentScholarshipsQuery,
  useLazyGetStudentScholarshipsQuery,
  useGetStudentScholarshipByIdQuery,
  useLazyGetStudentScholarshipByIdQuery,
  useApplyStudentScholarshipMutation, // THIS IS WHAT YOU NEED
  useApproveStudentScholarshipMutation, // THIS IS WHAT YOU NEED
  useRejectStudentScholarshipMutation, // THIS IS WHAT YOU NEED
  useRevokeStudentScholarshipMutation, // THIS IS WHAT YOU NEED

  // Student-specific
  useGetStudentScholarshipsByStudentQuery,
  useLazyGetStudentScholarshipsByStudentQuery,
  useCheckStudentEligibilityMutation, // THIS IS WHAT YOU NEED
  useGetAvailablePlansForStudentQuery,
  useLazyGetAvailablePlansForStudentQuery,
  useGetStudentFeeContextQuery,
  useLazyGetStudentFeeContextQuery,

  // Statistics
  useGetScholarshipStatsQuery,
  useLazyGetScholarshipStatsQuery,
} = scholarshipApi;

// ================== ALIAS EXPORTS (For backward compatibility) ==================
// These are aliases that point to the same functions
export const useApplyForScholarshipMutation =
  useApplyStudentScholarshipMutation;
export const useApproveScholarshipMutation =
  useApproveStudentScholarshipMutation;
export const useRejectScholarshipMutation = useRejectStudentScholarshipMutation;
export const useRevokeScholarshipMutation = useRevokeStudentScholarshipMutation;
export const useCheckEligibilityMutation = useCheckStudentEligibilityMutation;

