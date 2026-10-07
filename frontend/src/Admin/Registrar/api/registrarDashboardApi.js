import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const registrarDashboardApi = createApi({
  reducerPath: "registrarDashboardApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/registrar/dashboard-stats`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getRegistrarDashboardStats: builder.query({
      query: () => "/",
    }),
  }),
});

export const { useGetRegistrarDashboardStatsQuery } = registrarDashboardApi;
