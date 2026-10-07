import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../../Admin/Admission/services/getAuthToken";

export const installmentApi = createApi({
  reducerPath: "installmentApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/account/installments`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  // ✅ 1. Define all the tags Redux needs to track
  tagTypes: [
    "InstallmentPlans",
    "StudentInstallments",
    "InstallmentAssignment",
    "Students"
  ],
  endpoints: (builder) => ({
    
    // --- PLANS CRUD ---
    createInstallmentPlan: builder.mutation({
      query: (planData) => ({
        url: "/plans",
        method: "POST",
        body: planData,
      }),
      // ✅ 2. Tell Redux to refresh the Plans list when a new one is created
      invalidatesTags: ["InstallmentPlans"],
    }),

    getInstallmentPlans: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            params.append(key, value);
          }
        });
        const queryString = params.toString();
        return queryString ? `/plans?${queryString}` : "/plans";
      },
      // ✅ 3. Attach the tag to the fetched list
      providesTags: ["InstallmentPlans"],
    }),

    updateInstallmentPlan: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/plans/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["InstallmentPlans"],
    }),

    // --- STUDENT ASSIGNMENTS & PREFERENCES ---
    assignInstallment: builder.mutation({
      query: (assignmentData) => ({
        url: "/assign",
        method: "POST",
        body: assignmentData,
      }),
      invalidatesTags: ["StudentInstallments"],
    }),

    getStudentInstallments: builder.query({
      query: (studentId) => `/student/${studentId}`,
      providesTags: ["StudentInstallments"],
    }),

    updateInstallmentDueDate: builder.mutation({
      query: ({ assignmentId, installmentNumber, dueDate }) => ({
        url: `/assignments/${assignmentId}/installments/${installmentNumber}/due-date`,
        method: "PATCH",
        body: { dueDate },
      }),
      invalidatesTags: ["StudentInstallments", "InstallmentAssignment"],
    }),
    
    saveStudentPreference: builder.mutation({
      query: (data) => ({
        url: "/preferences",
        method: "POST",
        body: data,
      }),
      // "Students" isn't provided by anything in THIS api slice (tags
      // don't cross api slices), so invalidating it here was a no-op —
      // meanwhile getStudentPreference (which actually needs refreshing so
      // the just-saved plan shows when re-opening Configure Installments)
      // provides "StudentInstallments" and was never being invalidated,
      // leaving the pre-save cached result stuck until a full page reload.
      invalidatesTags: ["StudentInstallments"],
    }),

    // Fetch a student's existing installment preference for a SPECIFIC
    // semester — used to load it for editing (rather than assuming
    // whichever semester's preference happened to be cached on the
    // student's list row) and to detect whether one already exists.
    getStudentPreference: builder.query({
      query: ({ studentId, semesterId }) =>
        `/preferences?studentId=${studentId}&semesterId=${semesterId}`,
      providesTags: ["StudentInstallments"],
    }),

    // Full history of a student's installment preferences across every
    // semester — used to show past semesters' plans (read-only).
    getStudentPreferenceHistory: builder.query({
      query: (studentId) => `/preferences/history/${studentId}`,
      providesTags: ["StudentInstallments"],
    }),

    // Bulk installment-plan check for a batch of students in one semester —
    // used by BulkChallanManager to decide whether Billing Month should be
    // required/disabled for the current selection, without one query per
    // student. A read, so this stays a `query` (auto-refetches as the
    // selection/semester change) even though it's a POST under the hood —
    // the payload (a studentId array) doesn't fit in a query string.
    getBatchInstallmentStatus: builder.query({
      query: ({ studentIds }) => ({
        url: "/preferences/batch-status",
        method: "POST",
        body: { studentIds },
      }),
    }),

    // Permanently tags a legacy (untagged) installment/billing-month
    // preference with its real semester, confirmed by staff — the manual
    // counterpart to getStudentPreference's read-time fallback above.
    assignPreferenceSemester: builder.mutation({
      query: ({ id, semesterId }) => ({
        url: `/preferences/${id}/assign-semester`,
        method: "PATCH",
        body: { semesterId },
      }),
      invalidatesTags: ["StudentInstallments"],
    }),

    updateInstallmentPayment: builder.mutation({
      query: ({ assignmentId, installmentNumber, paymentData }) => ({
        url: `/assignments/${assignmentId}/installments/${installmentNumber}/pay`,
        method: "PATCH",
        body: paymentData,
      }),
      invalidatesTags: ["StudentInstallments", "InstallmentAssignment"],
    }),
  }),
});

export const {
  useCreateInstallmentPlanMutation,
  useGetInstallmentPlansQuery,
  useLazyGetInstallmentPlansQuery,
  useUpdateInstallmentPlanMutation,
  useAssignInstallmentMutation,
  useGetStudentInstallmentsQuery,
  useUpdateInstallmentDueDateMutation,
  useUpdateInstallmentPaymentMutation,
  useSaveStudentPreferenceMutation,
  useGetStudentPreferenceQuery,
  useAssignPreferenceSemesterMutation,
  useGetStudentPreferenceHistoryQuery,
  useGetBatchInstallmentStatusQuery,
} = installmentApi;