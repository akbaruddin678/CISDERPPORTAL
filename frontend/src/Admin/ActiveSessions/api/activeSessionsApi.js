import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../Admission/services/getAuthToken";

export const activeSessionsApi = createApi({
  reducerPath: "activeSessionsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/user-sessions`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["ActiveSession"],
  endpoints: (builder) => ({
    getActiveSessions: builder.query({
      query: () => "/",
      providesTags: ["ActiveSession"],
    }),
    revokeSession: builder.mutation({
      query: (id) => ({ url: `/${id}`, method: "DELETE" }),
      invalidatesTags: ["ActiveSession"],
    }),
  }),
});

export const { useGetActiveSessionsQuery, useRevokeSessionMutation } =
  activeSessionsApi;
