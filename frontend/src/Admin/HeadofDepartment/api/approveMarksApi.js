import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const approveMarksApi = createApi({
  reducerPath: "approveMarksApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/exam/teacher-marks`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["ReviewSubmissions", "SubmissionRoster", "GradeCorrections"],
  endpoints: (builder) => ({
    // Every non-draft marks submission across the HOD's own department
    // (admin sees all).
    getSubmissionsForReview: builder.query({
      query: () => "/hod/submissions",
      providesTags: ["ReviewSubmissions"],
    }),
    getSubmissionRoster: builder.query({
      query: (id) => `/hod/submissions/${id}/roster`,
      providesTags: (result, error, id) => [{ type: "SubmissionRoster", id }],
    }),
    reviewSubmission: builder.mutation({
      query: ({ id, decision, remarks }) => ({
        url: `/hod/submissions/${id}/review`,
        method: "PATCH",
        body: { decision, remarks },
      }),
      invalidatesTags: ["ReviewSubmissions", "SubmissionRoster"],
    }),
    getGradeCorrections: builder.query({
      query: () => "/hod/corrections",
      providesTags: ["GradeCorrections"],
    }),
    reviewGradeCorrection: builder.mutation({
      query: ({ id, decision, remarks }) => ({
        url: `/hod/corrections/${id}`,
        method: "PATCH",
        body: { decision, remarks },
      }),
      invalidatesTags: ["GradeCorrections", "SubmissionRoster"],
    }),
  }),
});

export const {
  useGetSubmissionsForReviewQuery,
  useGetSubmissionRosterQuery,
  useReviewSubmissionMutation,
  useGetGradeCorrectionsQuery,
  useReviewGradeCorrectionMutation,
} = approveMarksApi;
