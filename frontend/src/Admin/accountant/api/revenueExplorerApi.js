import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../Admission/services/getAuthToken";

function buildQueryString(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      qs.append(key, value);
    }
  });
  return qs.toString();
}

export const revenueExplorerApi = createApi({
  reducerPath: "revenueExplorerApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/account/revenue-explorer`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["RevenueExplorer"],
  endpoints: (builder) => ({
    // groupBy: "department" | "program" | "semester" — departmentId/programId
    // scope the query to a parent level once the admin has drilled into one.
    getGroupedRevenue: builder.query({
      query: (params) => `/grouped?${buildQueryString(params)}`,
      providesTags: ["RevenueExplorer"],
    }),
    getSemesterStudents: builder.query({
      query: (params) => `/semester-students?${buildQueryString(params)}`,
      providesTags: ["RevenueExplorer"],
    }),
  }),
});

export const { useGetGroupedRevenueQuery, useGetSemesterStudentsQuery } =
  revenueExplorerApi;
