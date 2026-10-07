import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const academiaApproveMarksApi = createApi({
  reducerPath: "academiaApproveMarksApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/exam/teacher-marks`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["ReviewSubmissions", "SubmissionRoster"],
  endpoints: (builder) => ({
    // Every non-draft marks submission university-wide (Academia is
    // unscoped, unlike the department-scoped HOD stage).
    getSubmissionsForReview: builder.query({
      query: () => "/academia/submissions",
      providesTags: ["ReviewSubmissions"],
    }),
    getSubmissionRoster: builder.query({
      query: (id) => `/academia/submissions/${id}/roster`,
      providesTags: (result, error, id) => [{ type: "SubmissionRoster", id }],
    }),
    reviewSubmission: builder.mutation({
      query: ({ id, decision, remarks }) => ({
        url: `/academia/submissions/${id}/review`,
        method: "PATCH",
        body: { decision, remarks },
      }),
      invalidatesTags: ["ReviewSubmissions", "SubmissionRoster"],
    }),
  }),
});

export const {
  useGetSubmissionsForReviewQuery,
  useGetSubmissionRosterQuery,
  useReviewSubmissionMutation,
} = academiaApproveMarksApi;
