import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../../Admin/Admission/services/getAuthToken";

export const depsemtermpro = createApi({
  reducerPath: "depsemtermpro",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Departments", "Programs", "Terms", "Semesters", "Students"],
  endpoints: (builder) => ({
    getDepartments: builder.query({
      query: () => "/catalog/departments",
      providesTags: ["Departments"],
    }),

    getPrograms: builder.query({
      query: () => "/catalog/programs",
      providesTags: ["Programs"],
    }),

    // ✅ Updated to accept dynamic parameters (e.g. { departmentId, excludeLevel })
    getProgramsByDepartment: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return `/catalog/programs?${queryParams}`;
      },
      providesTags: ["Programs"],
    }),

    getTerms: builder.query({
      query: () => "/catalog/terms",
      providesTags: ["Terms"],
    }),

    getSemesters: builder.query({
      query: () => "/catalog/semesters",
      providesTags: ["Semesters"],
    }),

    getSemestersByProgram: builder.query({
      query: (programId) => `/catalog/semesters/program/${programId}`,
      providesTags: ["Semesters"],
    }),

    // ✅ Updated to accept filter parameters (e.g., excludeLevel)
    getCompleteCatalog: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return {
          url: queryParams
            ? `/catalog/complete?${queryParams}`
            : "/catalog/complete",
          method: "GET",
        };
      },
      providesTags: ["Departments", "Programs", "Terms", "Semesters"],
    }),

    getStudents: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return `/account/students?${queryParams}`;
      },
      providesTags: ["Students"],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useLazyGetDepartmentsQuery,
  useGetProgramsQuery,
  useLazyGetProgramsQuery,
  useGetProgramsByDepartmentQuery,
  useLazyGetProgramsByDepartmentQuery,
  useGetTermsQuery,
  useLazyGetTermsQuery,
  useGetSemestersQuery,
  useLazyGetSemestersQuery,
  useGetSemestersByProgramQuery,
  useLazyGetSemestersByProgramQuery,
  useGetCompleteCatalogQuery,
  useLazyGetCompleteCatalogQuery,
  useGetStudentsQuery,
  useLazyGetStudentsQuery,
} = depsemtermpro;
