import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../Admission/services/getAuthToken";

export const coursestudentRegistrationApi = createApi({
  reducerPath: "coursestudentRegistrationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/course/registration`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["StudentRegistrations"],
  endpoints: (builder) => ({
    getStudentsForRegistration: builder.query({
      query: ({ programId, semesterId }) => ({
        url: "/students",
        params: { programId, semesterId },
      }),
      providesTags: ["StudentRegistrations"],
    }),

    getStudentCourseDetails: builder.query({
      query: ({ studentId, termId, programId, semesterId }) => ({
        url: "/details",
        params: { studentId, termId, programId, semesterId },
      }),
      providesTags: (result, error, arg) => [
        { type: "StudentRegistrations", id: arg.studentId },
      ],
    }),

    saveStudentRegistrations: builder.mutation({
      query: (payload) => ({
        url: "/save",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "StudentRegistrations", id: arg.studentId },
      ],
    }),

    getStudentCourseHistory: builder.query({
      query: (studentId) => `/history/${studentId}`,
      providesTags: (result, error, id) => [
        { type: "StudentRegistrations", id },
      ],
    }),

    // The effective per-semester credit cap for one student right now
    // (an HOD override if one's active, else the batch's Program
    // Regulation, else no limit) — lets the drawer enforce it live, before
    // Save is even clicked.
    getCreditLimit: builder.query({
      query: ({ studentId, programId, semesterId, termId }) => ({
        url: "/credit-limit",
        params: { studentId, programId, semesterId, termId },
      }),
      providesTags: (result, error, arg) => [
        { type: "StudentRegistrations", id: `limit-${arg.studentId}-${arg.semesterId}` },
      ],
    }),
    // NEW: Bulk Upload Endpoint
    bulkUploadRegistrations: builder.mutation({
      query: (formData) => ({
        url: "/bulk-upload",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["StudentRegistrations"],
    }),

    // HOD-only: raise (or lower) one student's effective credit cap for one
    // specific semester. Hits /api/course/credit-overrides, not this API
    // slice's own /api/course/registration base — kept here anyway since
    // it's only ever called from this same registration drawer.
    grantCreditOverride: builder.mutation({
      query: (body) => ({
        url: `${baseUrl}/api/course/credit-overrides`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "StudentRegistrations", id: `limit-${arg.studentId}-${arg.semesterId}` },
      ],
    }),
  }),
});

export const {
  useGetStudentsForRegistrationQuery,
  useLazyGetStudentCourseDetailsQuery,
  useSaveStudentRegistrationsMutation,
  useBulkUploadRegistrationsMutation,
  useLazyGetStudentCourseHistoryQuery,
  useGetCreditLimitQuery,
  useGrantCreditOverrideMutation,
} = coursestudentRegistrationApi;
