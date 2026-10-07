import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "./getAuthToken";

export const studentApi = createApi({
  reducerPath: "studentApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Student", "StudentStats", "Catalog"],
  endpoints: (builder) => ({
    // GET All Students (With Pagination Params)
    getAllStudents: builder.query({
      query: (params = {}) => {
        const {
          page = 1,
          limit = 10,
          search = "",
          departmentId = "",
          programId = "",
          semesterId = "",
          sessionId = "",
          status = "",
          admissionLifecycleStatus = "",
          onlyAcceptedAdmission = false,
          excludeCollege = false,
          excludeWithdrawn = false,
        } = params;

        const queryParams = new URLSearchParams();
        queryParams.append("page", page);
        queryParams.append("limit", limit);
        if (search) queryParams.append("search", search);
        if (departmentId) queryParams.append("departmentId", departmentId);
        if (programId) queryParams.append("programId", programId);
        if (semesterId) queryParams.append("semesterId", semesterId);
        if (sessionId) queryParams.append("sessionId", sessionId);
        if (status) queryParams.append("status", status);
        if (admissionLifecycleStatus)
          queryParams.append("admissionLifecycleStatus", admissionLifecycleStatus);
        if (onlyAcceptedAdmission) queryParams.append("onlyAcceptedAdmission", "true");
        if (excludeCollege) queryParams.append("excludeCollege", "true");
        if (excludeWithdrawn) queryParams.append("excludeWithdrawn", "true");

        return `/student?${queryParams.toString()}`;
      },
      providesTags: ["Student"],
    }),

    // Export Students (Full Data for Excel)
    exportStudents: builder.mutation({
      query: (filters = {}) => {
        const queryParams = new URLSearchParams();
        if (filters.search) queryParams.append("search", filters.search);
        if (filters.departmentId)
          queryParams.append("departmentId", filters.departmentId);
        if (filters.programId)
          queryParams.append("programId", filters.programId);
        if (filters.semesterId)
          queryParams.append("semesterId", filters.semesterId);
        if (filters.sessionId)
          queryParams.append("sessionId", filters.sessionId);
        if (filters.status) queryParams.append("status", filters.status);

        // We do NOT send limit here because the print-all endpoint fetches everything
        return {
          url: `/student/print-all?${queryParams.toString()}`,
          method: "GET",
        };
      },
    }),

    getStudentDetails: builder.query({
      query: (studentId) => `/student/${studentId}`,
      providesTags: (result, error, studentId) => [
        { type: "Student", id: studentId },
      ],
    }),

    getStudentStats: builder.query({
      query: () => "/student/stats",
      providesTags: ["StudentStats"],
    }),

    // Catalog endpoints
    getDepartments: builder.query({
      query: () => "/catalog/departments",
      providesTags: ["Catalog"],
    }),
    getPrograms: builder.query({
      query: () => "/catalog/programs",
      providesTags: ["Catalog"],
    }),
    getSemesters: builder.query({
      query: () => "/catalog/semesters",
      providesTags: ["Catalog"],
    }),
    getSessions: builder.query({
      query: () => "/catalog/terms",
      providesTags: ["Catalog"],
    }),

    updateStudent: builder.mutation({
      query: ({ studentId, formData }) => ({
        url: `/student/${studentId}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (result, error, { studentId }) => [
        { type: "Student", id: studentId },
        "Student", // Invalidate list
        "StudentStats",
      ],
    }),

    updateStudentRemark: builder.mutation({
      query: ({ id, remark }) => ({
        url: `/student/${id}/remark`,
        method: "PATCH",
        body: { remark },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Student", id },
        "Student",
      ],
    }),

    resendAdmissionEmail: builder.mutation({
      query: (studentId) => ({
        url: `/student/${studentId}/resend-admission-email`,
        method: "POST",
      }),
    }),
  }),
});

export const {
  useGetAllStudentsQuery,
  useGetStudentDetailsQuery,
  useGetStudentStatsQuery,
  useGetDepartmentsQuery,
  useGetProgramsQuery,
  useGetSemestersQuery,
  useGetSessionsQuery,
  useUpdateStudentMutation,
  useUpdateStudentRemarkMutation,
  useExportStudentsMutation,
  useResendAdmissionEmailMutation,
} = studentApi;
