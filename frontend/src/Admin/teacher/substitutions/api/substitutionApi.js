import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../../components/base/baseurl";
import { getAuthToken } from "../../services/getAuthToken";

export const substitutionApi = createApi({
  reducerPath: "substitutionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/staff/substitutions`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["MySubstitutions", "OpenSubstitutions"],
  endpoints: (builder) => ({
    getMySubstitutionRequests: builder.query({
      query: () => "/my-requests",
      providesTags: ["MySubstitutions"],
    }),
    getOpenSubstitutionRequests: builder.query({
      query: () => "/open",
      providesTags: ["OpenSubstitutions"],
    }),
    createSubstitutionRequest: builder.mutation({
      query: (payload) => ({ url: "/", method: "POST", body: payload }),
      invalidatesTags: ["MySubstitutions"],
    }),
    acceptSubstitutionRequest: builder.mutation({
      query: (id) => ({ url: `/${id}/accept`, method: "PATCH" }),
      invalidatesTags: ["OpenSubstitutions", "MySubstitutions"],
    }),
    cancelSubstitutionRequest: builder.mutation({
      query: (id) => ({ url: `/${id}`, method: "DELETE" }),
      invalidatesTags: ["MySubstitutions"],
    }),
  }),
});

export const {
  useGetMySubstitutionRequestsQuery,
  useGetOpenSubstitutionRequestsQuery,
  useCreateSubstitutionRequestMutation,
  useAcceptSubstitutionRequestMutation,
  useCancelSubstitutionRequestMutation,
} = substitutionApi;
