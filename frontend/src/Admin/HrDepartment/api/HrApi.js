import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../Admission/services/getAuthToken";

export const hrApi = createApi({
  reducerPath: "hrApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/hr`, 
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Staff", "Attendance", "Payroll", "Appraisals", "Postings", "Applications", "Exits", "StaffDocuments", "EmploymentInfo", "OnboardingRequests", "InventoryItems", "InventoryAssignments"],
  endpoints: (builder) => ({
    // 1. Read
    getAllStaff: builder.query({
      query: (params) => ({ url: "/staff", params }),
      providesTags: ["Staff"],
    }),
    getStaffById: builder.query({
      query: (id) => `/staff/${id}`,
      providesTags: (result, error, id) => [{ type: "Staff", id }],
    }),
    // 2. Create
    createStaff: builder.mutation({
      query: (payload) => ({
        url: "/staff",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Staff"],
    }),
    // 3. Update Profile
    updateStaff: builder.mutation({
      query: ({ staffId, payload }) => ({
        url: `/staff/${staffId}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Staff"],
    }),
    // 3b. Update Profile Details (qualifications, dependents, emergency
    // contacts, addresses) — Employee Profile page's Profile tab.
    updateStaffProfileDetails: builder.mutation({
      query: ({ staffId, payload }) => ({
        url: `/staff/${staffId}/profile-details`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: (result, error, { staffId }) => [
        "Staff",
        { type: "Staff", id: staffId },
      ],
    }),
    // 3c. Update Contract & Roles (employment type/dates, probation,
    // tenure tracking, concurrent role assignments).
    updateStaffContract: builder.mutation({
      query: ({ staffId, payload }) => ({
        url: `/staff/${staffId}/contract`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: (result, error, { staffId }) => [
        "Staff",
        { type: "Staff", id: staffId },
      ],
    }),
    // 3d. Employment & Payroll Info (StaffEmploymentInfo)
    getStaffEmploymentInfo: builder.query({
      query: (staffId) => `/staff/${staffId}/employment-info`,
      providesTags: (result, error, staffId) => [{ type: "EmploymentInfo", id: staffId }],
    }),
    updateStaffEmploymentInfo: builder.mutation({
      query: ({ staffId, payload }) => ({
        url: `/staff/${staffId}/employment-info`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: (result, error, { staffId }) => [{ type: "EmploymentInfo", id: staffId }],
    }),
    // 3e. Onboarding Checklist
    updateOnboardingChecklist: builder.mutation({
      query: ({ staffId, payload }) => ({
        url: `/staff/${staffId}/onboarding-checklist`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: (result, error, { staffId }) => [
        "Staff",
        { type: "Staff", id: staffId },
      ],
    }),
    // 3f. Biometric ID registration
    registerBiometricId: builder.mutation({
      query: ({ staffId, biometricId }) => ({
        url: `/staff/${staffId}/biometric`,
        method: "PATCH",
        body: { biometricId },
      }),
      invalidatesTags: (result, error, { staffId }) => [
        "Staff",
        { type: "Staff", id: staffId },
      ],
    }),
    // 4. Assign Roles & Department
    updateStaffRoles: builder.mutation({
      query: ({ staffId, payload }) => ({
        url: `/staff/${staffId}/roles`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["Staff"],
    }),
    // Registered accounts without an HR profile get a minimal one on demand
    // so profile/access/status/delete all have a StaffProfile id to use.
    ensureStaffProfile: builder.mutation({
      query: (userId) => ({
        url: `/staff/ensure-profile/${userId}`,
        method: "POST",
      }),
      invalidatesTags: ["Staff"],
    }),
    // 5. Toggle Status (Active/Suspended)
    updateStaffStatus: builder.mutation({
      query: ({ staffId, status }) => ({
        url: `/staff/${staffId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Staff"],
    }),
    // 6. Delete
    deleteStaff: builder.mutation({
      query: (staffId) => ({
        url: `/staff/${staffId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Staff"],
    }),
    // 7. Dashboard stats
    getHrDashboardStats: builder.query({
      query: () => "/dashboard-stats",
      providesTags: ["Staff"],
    }),

    // 7b. Document Vault
    uploadStaffDocument: builder.mutation({
      query: ({ staffId, formData }) => ({
        url: `/staff/${staffId}/documents`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["StaffDocuments"],
    }),
    getStaffDocuments: builder.query({
      query: (staffId) => `/staff/${staffId}/documents`,
      providesTags: ["StaffDocuments"],
    }),
    verifyStaffDocument: builder.mutation({
      query: ({ staffId, docId }) => ({
        url: `/staff/${staffId}/documents/${docId}/verify`,
        method: "PATCH",
      }),
      invalidatesTags: ["StaffDocuments"],
    }),
    deleteStaffDocument: builder.mutation({
      query: ({ staffId, docId }) => ({
        url: `/staff/${staffId}/documents/${docId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["StaffDocuments"],
    }),

    // 8. Staff Attendance
    getAttendanceForDate: builder.query({
      query: (date) => ({ url: "/attendance/by-date", params: { date } }),
      providesTags: ["Attendance"],
    }),
    markAttendance: builder.mutation({
      query: (payload) => ({
        url: "/attendance/mark",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Attendance"],
    }),
    getMonthlyAttendanceSummary: builder.query({
      query: (params) => ({ url: "/attendance/monthly-summary", params }),
      providesTags: ["Attendance"],
    }),

    // 9. Payroll
    getPayrollSlips: builder.query({
      query: (params) => ({ url: "/payroll", params }),
      providesTags: ["Payroll"],
    }),
    generatePayrollSlip: builder.mutation({
      query: (payload) => ({ url: "/payroll", method: "POST", body: payload }),
      invalidatesTags: ["Payroll"],
    }),
    updatePayrollStatus: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/payroll/${id}/status`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["Payroll"],
    }),
    suggestPayrollSlip: builder.query({
      query: ({ staffId, month, year }) => ({
        url: `/payroll/suggest/${staffId}`,
        params: { month, year },
      }),
    }),

    // 10. Appraisals
    getAppraisals: builder.query({
      query: (params) => ({ url: "/appraisals", params }),
      providesTags: ["Appraisals"],
    }),
    createAppraisal: builder.mutation({
      query: (payload) => ({ url: "/appraisals", method: "POST", body: payload }),
      invalidatesTags: ["Appraisals"],
    }),
    updateAppraisal: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/appraisals/${id}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["Appraisals"],
    }),

    // 11. Recruitment — Job Postings
    getJobPostings: builder.query({
      query: () => "/recruitment/postings",
      providesTags: ["Postings"],
    }),
    createJobPosting: builder.mutation({
      query: (payload) => ({ url: "/recruitment/postings", method: "POST", body: payload }),
      invalidatesTags: ["Postings"],
    }),
    updateJobPostingStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/recruitment/postings/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Postings"],
    }),

    // 12. Recruitment — Applications
    getJobApplications: builder.query({
      query: (jobId) => ({ url: "/recruitment/applications", params: { jobId } }),
      providesTags: ["Applications"],
    }),
    addJobApplication: builder.mutation({
      query: (payload) => ({ url: "/recruitment/applications", method: "POST", body: payload }),
      invalidatesTags: ["Applications", "Postings"],
    }),
    updateApplicationStatus: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/recruitment/applications/${id}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["Applications"],
    }),

    // 13. Exit Management
    getExitRecords: builder.query({
      query: () => "/exits",
      providesTags: ["Exits"],
    }),
    createExitRecord: builder.mutation({
      query: (payload) => ({ url: "/exits", method: "POST", body: payload }),
      invalidatesTags: ["Exits"],
    }),
    updateExitRecord: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/exits/${id}`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["Exits", "Staff"],
    }),

    // 14. Pending Onboarding Requests (from the public /teacher-onboarding page)
    getOnboardingRequests: builder.query({
      query: (status = "pending") => ({ url: "/onboarding-requests", params: { status } }),
      providesTags: ["OnboardingRequests"],
    }),
    getOnboardingRequestById: builder.query({
      query: (id) => `/onboarding-requests/${id}`,
    }),
    rejectOnboardingRequest: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/onboarding-requests/${id}/reject`,
        method: "PATCH",
        body: { reason },
      }),
      invalidatesTags: ["OnboardingRequests"],
    }),

    // 15. Inventory — items catalog (rooms, furniture, stationery, equipment...)
    getInventoryStats: builder.query({
      query: () => "/inventory/stats",
      providesTags: ["InventoryItems", "InventoryAssignments"],
    }),
    getInventoryLocationTree: builder.query({
      query: () => "/inventory/locations",
      providesTags: ["InventoryItems"],
    }),
    getInventoryItems: builder.query({
      query: (params) => ({ url: "/inventory/items", params }),
      providesTags: ["InventoryItems"],
    }),
    getInventoryItemById: builder.query({
      query: (id) => `/inventory/items/${id}`,
      providesTags: (result, error, id) => [{ type: "InventoryItems", id }],
    }),
    createInventoryItem: builder.mutation({
      query: (payload) => ({ url: "/inventory/items", method: "POST", body: payload }),
      invalidatesTags: ["InventoryItems"],
    }),
    updateInventoryItem: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/inventory/items/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["InventoryItems"],
    }),
    deleteInventoryItem: builder.mutation({
      query: (id) => ({ url: `/inventory/items/${id}`, method: "DELETE" }),
      invalidatesTags: ["InventoryItems"],
    }),

    // 16. Inventory — staff assignment / issue-return workflow
    getInventoryAssignments: builder.query({
      query: (params) => ({ url: "/inventory/assignments", params }),
      providesTags: ["InventoryAssignments"],
    }),
    assignInventoryItem: builder.mutation({
      query: (payload) => ({ url: "/inventory/assignments", method: "POST", body: payload }),
      invalidatesTags: ["InventoryAssignments", "InventoryItems"],
    }),
    returnInventoryItem: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/inventory/assignments/${id}/return`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["InventoryAssignments", "InventoryItems"],
    }),
  }),
});

export const {
  useGetAllStaffQuery,
  useGetStaffByIdQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useUpdateStaffProfileDetailsMutation,
  useUpdateStaffContractMutation,
  useGetStaffEmploymentInfoQuery,
  useUpdateStaffEmploymentInfoMutation,
  useUpdateOnboardingChecklistMutation,
  useRegisterBiometricIdMutation,
  useUpdateStaffRolesMutation,
  useEnsureStaffProfileMutation,
  useUpdateStaffStatusMutation,
  useDeleteStaffMutation,
  useGetHrDashboardStatsQuery,
  useUploadStaffDocumentMutation,
  useGetStaffDocumentsQuery,
  useVerifyStaffDocumentMutation,
  useDeleteStaffDocumentMutation,
  useGetAttendanceForDateQuery,
  useMarkAttendanceMutation,
  useGetMonthlyAttendanceSummaryQuery,
  useGetPayrollSlipsQuery,
  useGeneratePayrollSlipMutation,
  useUpdatePayrollStatusMutation,
  useLazySuggestPayrollSlipQuery,
  useGetAppraisalsQuery,
  useCreateAppraisalMutation,
  useUpdateAppraisalMutation,
  useGetJobPostingsQuery,
  useCreateJobPostingMutation,
  useUpdateJobPostingStatusMutation,
  useGetJobApplicationsQuery,
  useAddJobApplicationMutation,
  useUpdateApplicationStatusMutation,
  useGetExitRecordsQuery,
  useCreateExitRecordMutation,
  useUpdateExitRecordMutation,
  useGetOnboardingRequestsQuery,
  useGetOnboardingRequestByIdQuery,
  useRejectOnboardingRequestMutation,
  useGetInventoryStatsQuery,
  useGetInventoryLocationTreeQuery,
  useGetInventoryItemsQuery,
  useGetInventoryItemByIdQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useGetInventoryAssignmentsQuery,
  useAssignInventoryItemMutation,
  useReturnInventoryItemMutation,
} = hrApi;
