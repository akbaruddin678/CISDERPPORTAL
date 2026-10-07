import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const approveRecheckingApi = createApi({
  reducerPath: "approveRecheckingApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/exam/hod-post-exam`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["ReEvaluations"],
  endpoints: (builder) => ({
    getReEvaluations: builder.query({
      query: () => "/appeals",
      providesTags: ["ReEvaluations"],
    }),
    reviewReEvaluation: builder.mutation({
      query: ({ id, newMarks, decisionNote, status }) => ({
        url: `/appeals/${id}/review`,
        method: "PATCH",
        body: { newMarks, decisionNote, status },
      }),
      invalidatesTags: ["ReEvaluations"],
    }),
  }),
});

export const { useGetReEvaluationsQuery, useReviewReEvaluationMutation } =
  approveRecheckingApi;
