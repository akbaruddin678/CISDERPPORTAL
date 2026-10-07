import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../../Admin/Admission/services/getAuthToken";

export const globalCatalogApi = createApi({
  reducerPath: "globalCatalogApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Departments", "Programs", "Terms", "Semesters", "Students"],
  endpoints: (builder) => ({
    getDepartments: builder.query({
      query: () => "/catalog/departments",
      providesTags: ["Departments"],
    }),
    // `params` is optional — existing callers that call this with no
    // arguments are unaffected. Pass { context: "university" | "college",
    // departmentId, search, page, limit } to scope/filter/paginate.
    getPrograms: builder.query({
      query: (params) => ({ url: "/catalog/programs", params }),
      providesTags: ["Programs"],
    }),

    // ✅ FIXED: Now properly matches the backend route: /programs/department/:departmentId
    getProgramsByDepartment: builder.query({
      query: (departmentId) => `/catalog/programs/department/${departmentId}`,
      providesTags: ["Programs"],
    }),

    // params optional — e.g. { excludeLevel: "HSSC" } to hide college/annual
    // sessions from a university-only screen. Omitted entirely = every term,
    // unchanged for existing callers that don't pass anything.
    getTerms: builder.query({
      query: (params) => ({ url: "/catalog/terms", params }),
      providesTags: ["Terms"],
    }),
    getSemesters: builder.query({
      query: () => "/catalog/semesters",
      providesTags: ["Semesters"],
    }),

    // This one was already correct
    getSemestersByProgram: builder.query({
      query: (programId) => `/catalog/semesters/program/${programId}`,
      providesTags: ["Semesters"],
    }),

    getCompleteCatalog: builder.query({
      query: () => "/catalog/complete", // Fixed this route path based on your backend router as well
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
} = globalCatalogApi;
