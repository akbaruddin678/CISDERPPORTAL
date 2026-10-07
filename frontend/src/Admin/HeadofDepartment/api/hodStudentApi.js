import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

// Read-only, department-scoped student data for the HOD "Department Students"
// screen. The backend resolves the HOD's department from their staff profile,
// so nothing here sends a departmentId.
export const hodStudentApi = createApi({
  reducerPath: "hodStudentApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/hod/students`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["HodStudents"],
  endpoints: (builder) => ({
    getHodStudentPrograms: builder.query({
      query: () => "/programs",
      providesTags: ["HodStudents"],
    }),
    getHodStudentsByProgram: builder.query({
      query: (params) => ({ url: "/", params }),
      providesTags: ["HodStudents"],
    }),
    getHodStudentProfile: builder.query({
      query: (studentId) => `/${studentId}`,
      providesTags: (result, error, id) => [{ type: "HodStudents", id }],
    }),
  }),
});

export const {
  useGetHodStudentProgramsQuery,
  useGetHodStudentsByProgramQuery,
  useGetHodStudentProfileQuery,
} = hodStudentApi;
