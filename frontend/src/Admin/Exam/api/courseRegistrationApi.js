

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../Admission/services/getAuthToken";

export const courseRegistrationApi = createApi({
  reducerPath: "courseRegistrationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/course/management`, // Points to your courseController routes
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Courses"],
  endpoints: (builder) => ({
    // `params` is optional — existing callers that call this with no
    // arguments keep getting the full unpaginated list exactly as before.
    // Pass { status, owningDepartmentId, programId, search, page, limit }
    // to filter/paginate (used by the Registrar's course catalog screen).
    getAllCourses: builder.query({
      query: (params) => ({ url: "/", params }),
      providesTags: ["Courses"],
    }),
    createSingleCourse: builder.mutation({
      query: (payload) => ({
        url: "/",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Courses"],
    }),
    bulkCreateCourses: builder.mutation({
      query: (payload) => ({
        url: "/bulk", // Ensure you have a bulk route in your backend courseController
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Courses"],
    }),
    updateCourse: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Courses"],
    }),
    assignCourseCode: builder.mutation({
      query: ({ id, code }) => ({
        url: `/${id}/assign-code`,
        method: "PATCH",
        body: { code },
      }),
      invalidatesTags: ["Courses"],
    }),
    deleteCourse: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Courses"],
    }),
  }),
});

export const {
  useGetAllCoursesQuery,
  useLazyGetAllCoursesQuery,
  useCreateSingleCourseMutation,
  useBulkCreateCoursesMutation,
  useUpdateCourseMutation,
  useAssignCourseCodeMutation,
  useDeleteCourseMutation,
} = courseRegistrationApi;