import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../../components/base/baseurl";
import { getAuthToken } from "../../services/getAuthToken";

export const appraisalSelfApi = createApi({
  reducerPath: "appraisalSelfApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/staff/appraisals`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["MyAppraisals"],
  endpoints: (builder) => ({
    getMyAppraisals: builder.query({
      query: () => "/mine",
      providesTags: ["MyAppraisals"],
    }),
    submitSelfAssessment: builder.mutation({
      query: ({ id, employeeComments }) => ({
        url: `/${id}/self-assessment`,
        method: "PATCH",
        body: { employeeComments },
      }),
      invalidatesTags: ["MyAppraisals"],
    }),
  }),
});

export const { useGetMyAppraisalsQuery, useSubmitSelfAssessmentMutation } = appraisalSelfApi;
