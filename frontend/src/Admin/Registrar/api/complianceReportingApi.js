import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const complianceReportingApi = createApi({
  reducerPath: "complianceReportingApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/registrar/compliance`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["ComplianceReports"],
  endpoints: (builder) => ({
    getComplianceReports: builder.query({
      query: () => "/",
      providesTags: ["ComplianceReports"],
    }),
    createComplianceReport: builder.mutation({
      query: (payload) => ({ url: "/", method: "POST", body: payload }),
      invalidatesTags: ["ComplianceReports"],
    }),
    markReportSubmitted: builder.mutation({
      query: ({ id, formData }) => ({ url: `/${id}/submit`, method: "PATCH", body: formData }),
      invalidatesTags: ["ComplianceReports"],
    }),
  }),
});

export const {
  useGetComplianceReportsQuery,
  useCreateComplianceReportMutation,
  useMarkReportSubmittedMutation,
} = complianceReportingApi;
