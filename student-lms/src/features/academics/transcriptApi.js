import { baseApi } from "../../services/baseApi";

export const transcriptApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Existing Transcript Query
    getMyTranscripts: builder.query({
      query: () => "/lms/transcripts/my-results",
      providesTags: ["Transcripts"],
    }),

    // 2. ✅ NEW: Fetch Dynamic Announcements
    getAnnouncements: builder.query({
      query: () => "/lms/dashboard/announcements", // Update this to match your actual backend URL
      providesTags: ["Announcements"],
    }),

    // 3. ✅ NEW: Fetch Dynamic Upcoming Events
    getUpcomingEvents: builder.query({
      query: () => "/lms/dashboard/events/upcoming", // Update this to match your actual backend URL
      providesTags: ["Events"],
    }),
  }),
});

export const {
  useGetMyTranscriptsQuery,
  useGetAnnouncementsQuery,
  useGetUpcomingEventsQuery,
} = transcriptApi;
  