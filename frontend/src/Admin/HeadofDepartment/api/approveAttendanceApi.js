import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const approveAttendanceApi = createApi({
  reducerPath: "approveAttendanceApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/exam/conduction/attendance`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["AttendanceSubmissions", "AttendanceRoster"],
  endpoints: (builder) => ({
    getAttendanceSubmissionsForReview: builder.query({
      query: () => "/hod/submissions",
      providesTags: ["AttendanceSubmissions"],
    }),
    getAttendanceSubmissionRoster: builder.query({
      query: (id) => `/hod/submissions/${id}/roster`,
      providesTags: (result, error, id) => [{ type: "AttendanceRoster", id }],
    }),
    reviewAttendanceSubmission: builder.mutation({
      query: ({ id, decision, remarks }) => ({
        url: `/hod/submissions/${id}/review`,
        method: "PATCH",
        body: { decision, remarks },
      }),
      invalidatesTags: ["AttendanceSubmissions", "AttendanceRoster"],
    }),
  }),
});

export const {
  useGetAttendanceSubmissionsForReviewQuery,
  useGetAttendanceSubmissionRosterQuery,
  useReviewAttendanceSubmissionMutation,
} = approveAttendanceApi;
