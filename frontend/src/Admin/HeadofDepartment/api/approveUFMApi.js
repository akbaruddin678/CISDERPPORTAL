import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const approveUFMApi = createApi({
  reducerPath: "approveUFMApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/exam/hod-post-exam`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["UFMReports"],
  endpoints: (builder) => ({
    getUFMReports: builder.query({
      query: () => "/ufm",
      providesTags: ["UFMReports"],
    }),
    reviewUFMReport: builder.mutation({
      query: ({ id, committeeDecision, status }) => ({
        url: `/ufm/${id}/review`,
        method: "PATCH",
        body: { committeeDecision, status },
      }),
      invalidatesTags: ["UFMReports"],
    }),
  }),
});

export const { useGetUFMReportsQuery, useReviewUFMReportMutation } = approveUFMApi;
