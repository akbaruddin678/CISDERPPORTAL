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

export const activityLogApi = createApi({
  reducerPath: "activityLogApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/activity-logs`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["ActivityLog"],
  endpoints: (builder) => ({
    getActivityLogs: builder.query({
      query: (filters) => `/?${buildQueryString(filters)}`,
      providesTags: ["ActivityLog"],
    }),
    getActivityLogMeta: builder.query({
      query: () => "/meta",
    }),
    exportActivityLogs: builder.query({
      query: (filters) => `/export?${buildQueryString(filters)}`,
    }),
    reviewActivityLog: builder.mutation({
      query: ({ id, note }) => ({
        url: `/${id}/review`,
        method: "PATCH",
        body: { note },
      }),
      invalidatesTags: ["ActivityLog"],
    }),
    unreviewActivityLog: builder.mutation({
      query: (id) => ({
        url: `/${id}/unreview`,
        method: "PATCH",
      }),
      invalidatesTags: ["ActivityLog"],
    }),
  }),
});

export const {
  useGetActivityLogsQuery,
  useGetActivityLogMetaQuery,
  useLazyExportActivityLogsQuery,
  useReviewActivityLogMutation,
  useUnreviewActivityLogMutation,
} = activityLogApi;
