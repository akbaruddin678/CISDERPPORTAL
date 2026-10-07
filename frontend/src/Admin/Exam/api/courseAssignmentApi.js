import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../Admission/services/getAuthToken";

export const courseAssignmentApi = createApi({
  reducerPath: "courseAssignmentApi",
  baseQuery: fetchBaseQuery({
    // FIX 1: Change this from /api/course/courseassign to just /api/course
    baseUrl: `${baseUrl}/api/course`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Assignments"],
  endpoints: (builder) => ({
    getAssignedCourses: builder.query({
      query: (params) => ({
        // FIX 2: This will now correctly call /api/course/assignment
        url: "/assignment",
        params,
      }),
      providesTags: ["Assignments"],
    }),
    assignSingleCourse: builder.mutation({
      query: (payload) => ({
        // FIX 3: This will now correctly call POST /api/course/assignment
        url: "/assignment",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Assignments"],
    }),
    // Eligible students for a specific course offering + their enrollment state
    getCourseRoster: builder.query({
      query: (assignmentId) => `/assignment/${assignmentId}/students`,
      providesTags: (result, error, id) => [{ type: "Assignments", id: `roster-${id}` }],
    }),
    // Replaces the enrolled-student set for a single course offering only —
    // does not touch that student's registrations in any other course.
    updateCourseRoster: builder.mutation({
      query: ({ assignmentId, studentIds }) => ({
        url: `/assignment/${assignmentId}/students`,
        method: "PUT",
        body: { studentIds },
      }),
      invalidatesTags: (result, error, { assignmentId }) => [
        { type: "Assignments", id: `roster-${assignmentId}` },
        "Assignments",
      ],
    }),
  }),
});

export const {
  useGetAssignedCoursesQuery,
  useAssignSingleCourseMutation,
  useLazyGetCourseRosterQuery,
  useUpdateCourseRosterMutation,
} = courseAssignmentApi;
