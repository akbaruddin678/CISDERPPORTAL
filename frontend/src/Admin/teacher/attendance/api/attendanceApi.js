import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../../components/base/baseurl";
import { getAuthToken } from "../../services/getAuthToken";

export const attendanceApi = createApi({
  reducerPath: "attendanceApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/course/attendance`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Roster", "ClassReport", "StudentReport"],
  endpoints: (builder) => ({
    getRoster: builder.query({
      query: ({ courseAssignmentId, date }) => ({
        url: "/roster",
        params: { courseAssignmentId, date },
      }),
      providesTags: (result, error, { courseAssignmentId }) => [
        { type: "Roster", id: courseAssignmentId },
      ],
    }),
    markAttendance: builder.mutation({
      query: (payload) => ({
        url: "/mark",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: (result, error, { courseAssignmentId }) => [
        { type: "Roster", id: courseAssignmentId },
        { type: "ClassReport", id: courseAssignmentId },
      ],
    }),
    getClassReport: builder.query({
      query: (courseAssignmentId) => ({
        url: "/class-report",
        params: { courseAssignmentId },
      }),
      providesTags: (result, error, courseAssignmentId) => [
        { type: "ClassReport", id: courseAssignmentId },
      ],
    }),
    getStudentReport: builder.query({
      query: ({ courseAssignmentId, studentId }) => ({
        url: "/student-report",
        params: { courseAssignmentId, studentId },
      }),
      providesTags: (result, error, { courseAssignmentId, studentId }) => [
        { type: "StudentReport", id: `${courseAssignmentId}_${studentId}` },
      ],
    }),
  }),
});

export const {
  useGetRosterQuery,
  useMarkAttendanceMutation,
  useGetClassReportQuery,
  useGetStudentReportQuery,
} = attendanceApi;
