import { baseApi } from "../../services/baseApi";

export const transcriptApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyTranscripts: builder.query({
      query: () => "/lms/transcripts/my-results",
      providesTags: ["Transcripts"],
    }),
  }),
});

export const { useGetMyTranscriptsQuery } = transcriptApi;
