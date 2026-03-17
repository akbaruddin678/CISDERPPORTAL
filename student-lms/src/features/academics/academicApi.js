import { baseApi } from "../../services/baseApi";

export const academicApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAvailableCourses: builder.query({
      query: () => "/lms/courses/available", 
      providesTags: ["Courses"],
    }),
    registerForCourses: builder.mutation({
      query: (courseIds) => ({
        url: "/lms/courses/register",
        method: "POST",
        body: { courseIds },
      }),
      invalidatesTags: ["Courses"], 
    }),
  }),
});

export const { useGetAvailableCoursesQuery, useRegisterForCoursesMutation } =
  academicApi;
