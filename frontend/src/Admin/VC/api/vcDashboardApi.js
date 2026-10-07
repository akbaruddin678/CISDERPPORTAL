import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const vcDashboardApi = createApi({
  reducerPath: "vcDashboardApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/vc`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getVcDashboardStats: builder.query({
      query: () => "/dashboard-stats",
    }),
  }),
});

export const { useGetVcDashboardStatsQuery } = vcDashboardApi;
