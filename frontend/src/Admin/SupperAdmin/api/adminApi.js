import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../../components/user-admission/services/getAuthToken";
import { departmentEndpoints } from "./departmentEndpoints";
import { semesterEndpoints } from "./semesterEndpoints";
import { programEndpoints } from "./programEndpoints";
import { termEndpoints } from "./termEndpoints";
import { courseEndpoints } from "./courseEndpoints";
import { courseAssignmentEndpoints } from "./courseAssignmentEndpoints";

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: [
    "AdminUser",
    "Departments",
    "Programs",
    "Terms",
    "Semesters",
    "Courses",
    "CourseAssignments",
    "LmsAccounts",
  ],
  endpoints: (builder) => ({
    getUsersByRoles: builder.query({
      query: (roles) => ({
        url: `/admin/users/roles`,
        method: "POST",
        body: { roles },
      }),
      providesTags: ["AdminUser"],
    }),

    ...departmentEndpoints(builder),
    ...programEndpoints(builder),
    ...termEndpoints(builder),
    ...semesterEndpoints(builder),
    ...courseEndpoints(builder),
    ...courseAssignmentEndpoints(builder),
  }),
});

export const {
  useGetUsersByRolesQuery,

  // Department Hooks
  useGetAllDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,

  // Program Hooks
  useGetAllProgramsQuery,
  useGetProgramsByDepartmentQuery,
  useCreateProgramMutation,
  useUpdateProgramMutation,
  useToggleProgramStatusMutation,
  useDeleteProgramMutation,

  // Semester Hooks
  useGetAllSemestersQuery,
  useGetSemestersByProgramQuery,
  useCreateSemesterMutation,
  useUpdateSemesterMutation,
  useToggleSemesterStatusMutation,
  useDeleteSemesterMutation,
  useGetSemesterUsageQuery,

  // Term Hooks
  useGetAllTermsQuery,
  useGetActiveTermsQuery,
  useCreateTermMutation,
  useUpdateTermMutation,
  useToggleTermStatusMutation,
  useDeleteTermMutation,

  // Course Hooks
  useGetAllCoursesQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,

  // Course Assignment Hooks
  useGetCourseAssignmentsQuery,
  useAssignCourseMutation,
  useDeleteCourseAssignmentMutation,
  useBulkAssignCoursesMutation,
} = adminApi;
