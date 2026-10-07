import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const monitorFacultyApi = createApi({
  reducerPath: "monitorFacultyApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/course/assignment`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["FacultyMonitoring"],
  endpoints: (builder) => ({
    getFacultyMonitoring: builder.query({
      query: (params) => ({ url: "/monitoring", params }),
      providesTags: ["FacultyMonitoring"],
    }),
  }),
});

export const { useGetFacultyMonitoringQuery } = monitorFacultyApi;
