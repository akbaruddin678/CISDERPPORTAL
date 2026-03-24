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

    // ✅ NEW: Get Timetable
    getMyTimetable: builder.query({
      query: () => "/lms/courses/timetable",
      providesTags: ["Timetable"],
    }),
    getMyDateSheet: builder.query({
      query: () => "/lms/courses/datesheet",
      providesTags: ["Datesheet"],
    }),

    // ✅ NEW: Get Materials for a specific course
    getCourseMaterials: builder.query({
      query: (courseId) => `/lms/courses/classroom/${courseId}`,
      providesTags: (result, error, id) => [{ type: "Materials", id }],
    }),
  }),
});

export const {
  useGetAvailableCoursesQuery,
  useRegisterForCoursesMutation,
  useGetMyTimetableQuery,

  useGetCourseMaterialsQuery,
  useGetMyDateSheetQuery,
} = academicApi;
