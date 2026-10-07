// ✅ Import your existing adminApi instead of baseApi
import { adminApi } from "./adminApi"; // Adjust this path if adminApi.js is in a different folder

export const adminLmsApi = adminApi.injectEndpoints({
  endpoints: (builder) => ({
    getLmsAccounts: builder.query({
      query: ({ level, search, page, limit, departmentId, programId, semesterId }) => ({
        url: "/admin/lms/accounts",
        params: { level, search, page, limit, departmentId, programId, semesterId },
      }),
      providesTags: ["LmsAccounts"],
    }),
    updateLmsCredentials: builder.mutation({
      query: ({ authId, ...data }) => ({
        url: `/admin/lms/accounts/${authId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["LmsAccounts"],
    }),
    toggleLmsStatus: builder.mutation({
      query: (data) => ({
        url: "/admin/lms/accounts/toggle-status",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["LmsAccounts"],
    }),
    // { authIds } — single, multiple, or "whole tab" are all just how many
    // ids the caller sends. Deterministic <rollnumber>@cisd.edu.pk email.
    bulkGenerateLmsEmails: builder.mutation({
      query: (data) => ({
        url: "/admin/lms/accounts/generate-email",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["LmsAccounts"],
    }),
    // { authIds } — returns the freshly-generated plaintext passwords
    // (data: [{ authId, name, rollNumber, email, newPassword }]), the only
    // time they're ever visible again once hashed.
    bulkResetLmsPasswords: builder.mutation({
      query: (data) => ({
        url: "/admin/lms/accounts/reset-password",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["LmsAccounts"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetLmsAccountsQuery,
  useLazyGetLmsAccountsQuery,
  useUpdateLmsCredentialsMutation,
  useToggleLmsStatusMutation,
  useBulkGenerateLmsEmailsMutation,
  useBulkResetLmsPasswordsMutation,
} = adminLmsApi;
