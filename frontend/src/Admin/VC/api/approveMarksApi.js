import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const vcApproveMarksApi = createApi({
  reducerPath: "vcApproveMarksApi",
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
    // Every non-draft marks submission university-wide — the VC stage is
    // unscoped, same as Academia.
    getSubmissionsForReview: builder.query({
      query: () => "/vc/submissions",
      providesTags: ["ReviewSubmissions"],
    }),
    getSubmissionRoster: builder.query({
      query: (id) => `/vc/submissions/${id}/roster`,
      providesTags: (result, error, id) => [{ type: "SubmissionRoster", id }],
    }),
    reviewSubmission: builder.mutation({
      query: ({ id, decision, remarks }) => ({
        url: `/vc/submissions/${id}/review`,
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
} = vcApproveMarksApi;
