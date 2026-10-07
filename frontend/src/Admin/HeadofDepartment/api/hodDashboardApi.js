import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const hodDashboardApi = createApi({
  reducerPath: "hodDashboardApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/course/assignment`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["HodDashboardStats"],
  endpoints: (builder) => ({
    getHodDashboardStats: builder.query({
      query: () => "/hod-dashboard-stats",
      providesTags: ["HodDashboardStats"],
    }),
  }),
});

export const { useGetHodDashboardStatsQuery } = hodDashboardApi;
