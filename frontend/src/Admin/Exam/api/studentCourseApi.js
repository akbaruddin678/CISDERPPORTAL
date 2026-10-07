import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../Admission/services/getAuthToken";

export const studentCourseApi = createApi({
  reducerPath: "studentCourseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/course/registration`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["CourseRegistration"],
  endpoints: (builder) => ({
    getRegStudents: builder.query({
      query: (params) => ({ url: "/students", params }),
    }),
    getRegDetails: builder.query({
      query: (params) => ({ url: "/details", params }),
      providesTags: ["CourseRegistration"],
    }),
    saveReg: builder.mutation({
      query: (data) => ({
        url: "/save",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CourseRegistration"],
    }),
  }),
});

export const {
  useGetRegStudentsQuery,
  useGetRegDetailsQuery,
  useSaveRegMutation,
} = studentCourseApi;
