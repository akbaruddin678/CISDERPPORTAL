import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../Admission/services/getAuthToken";

export const examApi = createApi({
  reducerPath: "examApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Exams", "Catalog"],
  endpoints: (builder) => ({
    // 1. Metadata (Sessions, Exam Types)
    getExamMetadata: builder.query({
      query: () => "/exam/metadata",
    }),

    // 2. Cascading Catalog Data
    getDepartments: builder.query({
      query: () => "/catalog/departments",
      providesTags: ["Catalog"],
    }),
    getPrograms: builder.query({
      query: (departmentId) => `/catalog/programs?departmentId=${departmentId}`,
      providesTags: ["Catalog"],
    }),
    getSemesters: builder.query({
      query: (programId) => `/catalog/semesters?programId=${programId}`,
      providesTags: ["Catalog"],
    }),
    // Fetch courses based on Semester (and Program/Dept context)
    getCoursesBySemester: builder.query({
      query: ({ semesterId, programId }) =>
        `/catalog/courses?semesterId=${semesterId}&programId=${programId}`,
      providesTags: ["Catalog"],
    }),

    // 3. Create Exams (Batch)
    createBatchExams: builder.mutation({
      query: (payload) => ({
        url: "/exam/create-batch",
        method: "POST",
        body: payload, // { exams: [...] }
      }),
      invalidatesTags: ["Exams"],
    }),
  }),
});

export const {
  useGetExamMetadataQuery,
  useGetDepartmentsQuery,
  useLazyGetProgramsQuery,
  useLazyGetSemestersQuery,
  useLazyGetCoursesBySemesterQuery,
  useCreateBatchExamsMutation,
} = examApi;
