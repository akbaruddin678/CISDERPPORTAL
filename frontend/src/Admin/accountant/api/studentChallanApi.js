import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../../Admin/Admission/services/getAuthToken";

export const studentChallanApi = createApi({
  reducerPath: "studentChallanApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/account/challans`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Challans", "StudentChallans"],
  endpoints: (builder) => ({
    getChallans: builder.query({
      query: (params) => ({ url: "/", params }),
      providesTags: ["Challans"],
    }),

    getChallansByStudentId: builder.query({
      query: (args) => {
        const id = typeof args === "string" ? args : args?.id;
        const params = typeof args === "object" ? { ...args } : {};
        delete params.id;
        return { url: `/student/${id}`, params };
      },
      providesTags: (result, error, arg) => [
        {
          type: "StudentChallans",
          id: typeof arg === "string" ? arg : arg?.id,
        },
      ],
    }),

    generateSingleChallan: builder.mutation({
      query: (data) => ({ url: "/generate", method: "POST", body: data }),
      invalidatesTags: ["Challans", "StudentChallans"],
    }),

    generateBulkChallans: builder.mutation({
      query: (data) => ({ url: "/bulk-generate", method: "POST", body: data }),
      invalidatesTags: ["Challans", "StudentChallans"],
    }),

    // Auto Fee Generator — pick a session, a billing month and a due date;
    // the backend scans every matching student and generates a challan
    // for whichever ones have an installment actually due that month.
    autoGenerateChallans: builder.mutation({
      query: (data) => ({ url: "/auto-generate", method: "POST", body: data }),
      invalidatesTags: ["Challans", "StudentChallans"],
    }),

    // Read-only scan matching the same eligibility logic autoGenerateChallans
    // uses — powers the "N students in this scope" count and the Billing
    // Month dropdown (only months that still have someone left to bill).
    getAutoGeneratePreview: builder.query({
      query: (params) => ({ url: "/auto-generate/preview", params }),
      providesTags: ["Challans"],
    }),

    createManualInstallments: builder.mutation({
      query: ({ id, installments }) => ({
        url: `/${id}/create-installments`,
        method: "POST",
        body: { installments },
      }),
      invalidatesTags: ["Challans", "StudentChallans"],
    }),

    updateChallanDueDate: builder.mutation({
      query: ({ id, dueDate }) => ({
        url: `/${id}/due-date`,
        method: "PATCH",
        body: { dueDate },
      }),
      invalidatesTags: ["Challans", "StudentChallans"],
    }),

    markChallanAsPaid: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/${id}/mark-paid`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["Challans", "StudentChallans"],
    }),

    deleteChallan: builder.mutation({
      query: ({ id }) => ({ url: `/${id}`, method: "DELETE" }),
      invalidatesTags: ["Challans", "StudentChallans"],
    }),

    bulkDelete: builder.mutation({
      query: (ids) => ({
        url: "/bulk-delete",
        method: "POST",
        body: { challanIds: ids },
      }),
      invalidatesTags: ["Challans"],
    }),

    // Renew Overdue Installment — deletes the overdue challan and reissues
    // it one month later carrying its fine forward. Pass `resolution`
    // ("shiftAll" | "merge") when re-calling after a `status: "conflict"`
    // response.
    renewChallan: builder.mutation({
      query: ({ id, resolution, dueDate }) => ({
        url: `/${id}/regenerate`,
        method: "PATCH",
        body: {
          ...(resolution ? { resolution } : {}),
          ...(dueDate ? { dueDate } : {}),
        },
      }),
      invalidatesTags: ["Challans", "StudentChallans"],
    }),

    bulkRenewChallans: builder.mutation({
      query: (ids) => ({
        url: "/bulk-renew",
        method: "POST",
        body: { challanIds: ids },
      }),
      invalidatesTags: ["Challans", "StudentChallans"],
    }),

    getOverdueInstallments: builder.query({
      query: (params) => ({ url: "/overdue-installments", params }),
      providesTags: ["Challans"],
    }),

    bulkUpdateDate: builder.mutation({
      query: ({ ids, date }) => ({
        url: "/bulk-update-date",
        method: "PATCH",
        body: { challanIds: ids, dueDate: date },
      }),
      invalidatesTags: ["Challans"],
    }),

    getChallansPaginated: builder.query({
      query: (params) => ({
        url: "/paginated",
        params: params,
      }),
      providesTags: ["Challans"],
    }),

    getFinanceReports: builder.query({
      query: (params) => ({ url: "/reports", params }),
      providesTags: ["Challans"],
    }),

    applyDiscount: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${id}/discount`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Challans", "StudentChallans"],
    }),

    getMonthlyFinanceReport: builder.query({
      query: (params) => ({ url: "/monthly-report", params }),
      providesTags: ["Challans"],
    }),

    updateFineAndDueDate: builder.mutation({
      query: ({ id, fineAmount, dueDate }) => ({
        url: `/${id}/fine-due-date`,
        method: "PATCH",
        body: { fineAmount, dueDate },
      }),
      invalidatesTags: ["Challans", "StudentChallans"],
    }),

    bulkUpdateFineAndDueDate: builder.mutation({
      query: ({ ids, fineAmount, dueDate }) => ({
        url: "/bulk/fine-due-date",
        method: "PATCH",
        body: { challanIds: ids, fineAmount, dueDate },
      }),
      invalidatesTags: ["Challans", "StudentChallans"],
    }),

    getMasterFinancialReport: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        return `/master-report?${params.toString()}`;
      },
    }),

    removeDiscount: builder.mutation({
      query: (id) => ({
        url: `/${id}/discount`,
        method: "DELETE",
      }),
      invalidatesTags: ["Challans", "StudentChallans"],
    }),

    generateGeneralChallan: builder.mutation({
      query: (data) => ({
        url: "/generate-general",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Challans", "StudentChallans"],
    }),

    getStudentFinancialDossier: builder.query({
      query: (args) => {
        const id = typeof args === "string" ? args : args?.id;
        const params = typeof args === "object" ? { ...args } : {};
        delete params.id;
        return { url: `/student/${id}/dossier`, params };
      },
      providesTags: (result, error, arg) => [
        {
          type: "StudentChallans",
          id: typeof arg === "string" ? arg : arg?.id,
        },
      ],
    }),

    triggerOverdueProcessing: builder.mutation({
      query: () => ({
        url: "/trigger-overdue",
        method: "POST",
      }),
      invalidatesTags: ["Challans", "StudentChallans"],
    }),

    getDailyInvoices: builder.query({
      query: (params) => ({ url: "/daily-invoice", params }),
      providesTags: ["Challans"],
    }),

    bulkShiftUnpaidInvoiceDueDate: builder.mutation({
      query: ({ filters, newDueDate, scope }) => ({
        url: "/daily-invoice/bulk-shift-date",
        method: "POST",
        body: { filters, newDueDate, scope },
      }),
      invalidatesTags: ["Challans"],
    }),

    bulkCancelUnpaidInvoices: builder.mutation({
      query: ({ filters, scope }) => ({
        url: "/daily-invoice/bulk-cancel",
        method: "POST",
        body: { filters, scope },
      }),
      invalidatesTags: ["Challans"],
    }),

    // Preview of "previous unpaid dues" for a batch of students — powers
    // Bulk Generation's "include previous dues" summary/checkbox.
    getPreviousDuesSummary: builder.query({
      query: (studentIds) => ({
        url: "/previous-dues-summary",
        params: { studentIds: (studentIds || []).join(",") },
      }),
      providesTags: ["Challans"],
    }),
  }),
});

// --- EXPORT ALL HOOKS HERE ---
export const {
  useGetChallansQuery,
  useGetChallansByStudentIdQuery,
  useLazyGetChallansByStudentIdQuery, 
  useLazyGetMasterFinancialReportQuery,
  useGenerateSingleChallanMutation,
  useGenerateBulkChallansMutation,
  useAutoGenerateChallansMutation,
  useCreateManualInstallmentsMutation,
  useUpdateChallanDueDateMutation,
  useMarkChallanAsPaidMutation,
  useDeleteChallanMutation,
  useApplyDiscountMutation,
  useRemoveDiscountMutation,
  useBulkDeleteMutation,
  useRenewChallanMutation,
  useBulkRenewChallansMutation,
  useGetOverdueInstallmentsQuery,
  useLazyGetOverdueInstallmentsQuery,
  useBulkUpdateDateMutation,
  useGetChallansPaginatedQuery,
  useGetFinanceReportsQuery,
  useGetMonthlyFinanceReportQuery,
  useLazyGetChallansPaginatedQuery,
  useUpdateFineAndDueDateMutation,
  useBulkUpdateFineAndDueDateMutation,
  useTriggerOverdueProcessingMutation,
  useGenerateGeneralChallanMutation,
  useGetStudentFinancialDossierQuery,
  useGetDailyInvoicesQuery,
  useLazyGetDailyInvoicesQuery,
  useBulkShiftUnpaidInvoiceDueDateMutation,
  useBulkCancelUnpaidInvoicesMutation,
  useGetAutoGeneratePreviewQuery,
  useGetPreviousDuesSummaryQuery,
} = studentChallanApi;
