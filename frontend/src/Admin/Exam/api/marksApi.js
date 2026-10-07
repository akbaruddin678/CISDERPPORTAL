import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../Admission/services/getAuthToken";

export const marksApi = createApi({
  reducerPath: "marksApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/marks`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Marks", "StudentExams"],
  endpoints: (builder) => ({
    getBatchStudents: builder.query({
      query: (params) => ({ url: "/students", params }),
      providesTags: ["Marks"],
    }),
    getStudentExamDetails: builder.query({
      query: (params) => ({ url: "/student-details", params }),
      providesTags: ["StudentExams"],
    }),
    saveMark: builder.mutation({
      query: (data) => ({
        url: "/save",
        method: "POST",
        body: data,
      }),
      
      invalidatesTags: ["StudentExams"],
    }),
  }),
});

export const {
  useGetBatchStudentsQuery,
  useGetStudentExamDetailsQuery,
  useSaveMarkMutation,
} = marksApi;
