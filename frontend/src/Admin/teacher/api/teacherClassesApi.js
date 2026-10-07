import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const teacherClassesApi = createApi({
  reducerPath: "teacherClassesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/staff`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["MyCourses"],
  endpoints: (builder) => ({
    // Logged-in teacher's own assigned courses, across all sessions.
    // Backend flags the latest/current session as isActive per item.
    getMyCourses: builder.query({
      query: () => "/my-courses",
      providesTags: ["MyCourses"],
    }),
    getTeacherDashboardStats: builder.query({
      query: () => "/my-dashboard-stats",
      providesTags: ["MyCourses"],
    }),
    getMyProfile: builder.query({
      query: () => "/my-profile",
      providesTags: ["MyCourses"],
    }),
    getMyTimetable: builder.query({
      query: () => "/my-timetable",
      providesTags: ["MyCourses"],
    }),
  }),
});

export const {
  useGetMyCoursesQuery,
  useGetTeacherDashboardStatsQuery,
  useGetMyProfileQuery,
  useGetMyTimetableQuery,
} = teacherClassesApi;
