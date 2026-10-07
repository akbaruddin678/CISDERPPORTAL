import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../../Admin/Admission/services/getAuthToken";

export const paymentRecordApi = createApi({
  reducerPath: "paymentRecordApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/payment-records`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["PaymentRecords"],
  endpoints: (builder) => ({
    getPaymentRecords: builder.query({
      query: () => "/",
      providesTags: ["PaymentRecords"],
    }),
    createAllocation: builder.mutation({
      query: (formData) => ({
        url: "/allocate",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["PaymentRecords"],
    }),
    addReceivedFund: builder.mutation({
      query: (formData) => ({
        url: "/received",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["PaymentRecords"],
    }),
    addDirectExpense: builder.mutation({
      query: (formData) => ({
        url: "/direct-expense",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["PaymentRecords"],
    }),
    addExpense: builder.mutation({
      query: ({ recordId, formData }) => ({
        url: `/${recordId}/expense`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["PaymentRecords"],
    }),
    // --- Update & Delete ---
    updateRecord: builder.mutation({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["PaymentRecords"],
    }),
    deleteRecord: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PaymentRecords"],
    }),
    deleteExpense: builder.mutation({
      query: ({ recordId, expenseId }) => ({
        url: `/${recordId}/expense/${expenseId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PaymentRecords"],
    }),
  }),
});

export const {
  useGetPaymentRecordsQuery,
  useCreateAllocationMutation,
  useAddReceivedFundMutation,
  useAddDirectExpenseMutation,
  useAddExpenseMutation,
  useUpdateRecordMutation,
  useDeleteRecordMutation,
  useDeleteExpenseMutation,
} = paymentRecordApi;
