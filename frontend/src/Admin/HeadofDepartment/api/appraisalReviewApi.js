import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const appraisalReviewApi = createApi({
  reducerPath: "appraisalReviewApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/staff/appraisals`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["AppraisalsToReview"],
  endpoints: (builder) => ({
    getAppraisalsToReview: builder.query({
      query: () => "/to-review",
      providesTags: ["AppraisalsToReview"],
    }),
    submitEvaluatorScore: builder.mutation({
      query: ({ id, kpis, evaluatorFeedback }) => ({
        url: `/${id}/evaluate`,
        method: "PATCH",
        body: { kpis, evaluatorFeedback },
      }),
      invalidatesTags: ["AppraisalsToReview"],
    }),
  }),
});

export const { useGetAppraisalsToReviewQuery, useSubmitEvaluatorScoreMutation } = appraisalReviewApi;
