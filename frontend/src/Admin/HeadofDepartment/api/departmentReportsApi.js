import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const departmentReportsApi = createApi({
  reducerPath: "departmentReportsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/exam/teacher-marks`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["DepartmentResults"],
  endpoints: (builder) => ({
    getDepartmentResultsOverview: builder.query({
      query: (params) => ({ url: "/hod/results-overview", params }),
      providesTags: ["DepartmentResults"],
    }),
  }),
});

export const { useGetDepartmentResultsOverviewQuery } = departmentReportsApi;
