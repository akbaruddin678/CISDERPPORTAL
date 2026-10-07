import { baseApi } from "./baseApi";

export const lmsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Finance
    getMyChallans: builder.query({
      query: () => `/lms/finance/my-challans`,
      providesTags: ["Finance"],
    }),

    // Transcripts / Dashboard
    getMyTranscripts: builder.query({
      query: () => "/lms/transcripts/my-results",
      providesTags: ["Transcripts"],
    }),
    getAnnouncements: builder.query({
      query: () => "/lms/dashboard/announcements",
      providesTags: ["Announcements"],
    }),
    getUpcomingEvents: builder.query({
      query: () => "/lms/dashboard/events/upcoming",
      providesTags: ["Events"],
    }),

    // Academics
    getAvailableCourses: builder.query({
      query: () => "/lms/courses/available",
      providesTags: ["Courses"],
    }),
    registerCourses: builder.mutation({
      query: (courseIds = []) => ({
        url: "/lms/courses/register",
        method: "POST",
        body: { courseIds },
      }),
      invalidatesTags: ["Courses", "Transcripts", "Timetable"],
    }),
    getCourseMaterials: builder.query({
      query: (courseId) => `/lms/courses/classroom/${courseId}`,
      providesTags: ["Materials"],
    }),
    getMyTimetable: builder.query({
      query: () => "/lms/courses/timetable",
      providesTags: ["Timetable"],
    }),
    getMyDateSheet: builder.query({
      query: () => "/lms/courses/datesheet",
      providesTags: ["Datesheet"],
    }),
  }),
});

export const {
  useGetMyChallansQuery,
  useGetMyTranscriptsQuery,
  useGetAnnouncementsQuery,
  useGetUpcomingEventsQuery,
  useGetAvailableCoursesQuery,
  useRegisterCoursesMutation,
  useGetCourseMaterialsQuery,
  useGetMyTimetableQuery,
  useGetMyDateSheetQuery,
} = lmsApi;
