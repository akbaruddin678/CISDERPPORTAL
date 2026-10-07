import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../Admission/services/getAuthToken";

export const hodCourseAllocationApi = createApi({
  reducerPath: "hodCourseAllocationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Allocations", "ActiveCourses", "CourseRoster", "ActiveSemesters"],
  endpoints: (builder) => ({
    getActiveCourses: builder.query({
      query: (deptId) =>
        `/course/management?status=ACTIVE&owningDepartmentId=${deptId}`,
      providesTags: ["ActiveCourses"],
    }),
    // Which semesters of a program actually have an active student right
    // now — the Semester picker uses this to disable a semester nobody is
    // enrolled in.
    getSemestersWithActiveStudents: builder.query({
      query: (programId) => ({
        url: "/course/assignment/semesters-with-active-students",
        params: { programId },
      }),
      providesTags: ["ActiveSemesters"],
    }),
    getDepartmentStaff: builder.query({
      query: () => `/staff`,
    }),
    getSemesterAllocations: builder.query({
      query: (params) => ({ url: "/course/assignment", params }),
      providesTags: ["Allocations"],
    }),
    allocateCourse: builder.mutation({
      query: (payload) => ({
        url: "/course/assignment",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Allocations"],
    }),
    deleteAllocation: builder.mutation({
      query: (id) => ({ url: `/course/assignment/${id}`, method: "DELETE" }),
      invalidatesTags: ["Allocations"],
    }),
    bulkDeleteAllocations: builder.mutation({
      query: (ids) => ({
        url: `/course/assignment/bulk`,
        method: "DELETE",
        body: { ids },
      }),
      invalidatesTags: ["Allocations"],
    }),
    bulkUnassignInstructor: builder.mutation({
      query: (ids) => ({
        url: `/course/assignment/bulk/unassign`,
        method: "PATCH",
        body: { ids },
      }),
      invalidatesTags: ["Allocations"],
    }),
    // Fetch the list of eligible students and their enrollment status
    getAllocationRoster: builder.query({
      query: (assignmentId) => `/course/assignment/${assignmentId}/students`,
      providesTags: (result, error, id) => [{ type: "CourseRoster", id }],
    }),
    // Save the checked students
    updateAllocationRoster: builder.mutation({
      query: ({ assignmentId, studentIds }) => ({
        url: `/course/assignment/${assignmentId}/students`,
        method: "PUT",
        body: { studentIds },
      }),
      invalidatesTags: (result, error, { assignmentId }) => [
        { type: "CourseRoster", id: assignmentId },
        "Allocations", // Refreshes the table count
      ],
    }),
  }),
});

export const {
  useGetActiveCoursesQuery,
  useGetSemestersWithActiveStudentsQuery,
  useGetDepartmentStaffQuery,
  useGetSemesterAllocationsQuery,
  useAllocateCourseMutation,
  useDeleteAllocationMutation,
  useBulkDeleteAllocationsMutation,
  useBulkUnassignInstructorMutation,
  useGetAllocationRosterQuery,
  useLazyGetAllocationRosterQuery,
  useUpdateAllocationRosterMutation,
} = hodCourseAllocationApi;
