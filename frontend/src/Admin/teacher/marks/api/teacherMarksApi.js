import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../../components/base/baseurl";
import { getAuthToken } from "../../services/getAuthToken";

export const teacherMarksApi = createApi({
  reducerPath: "teacherMarksApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/exam/teacher-marks`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["ScheduledExams", "MarksRoster"],
  endpoints: (builder) => ({
    getScheduledExams: builder.query({
      query: (courseAssignmentId) => ({
        url: "/scheduled-exams",
        params: { courseAssignmentId },
      }),
      providesTags: (result, error, id) => [{ type: "ScheduledExams", id }],
    }),
    getExamRoster: builder.query({
      query: ({ courseAssignmentId, examId }) => ({
        url: "/exam-roster",
        params: { courseAssignmentId, examId },
      }),
      providesTags: (result, error, { examId }) => [
        { type: "MarksRoster", id: examId },
      ],
    }),
    saveExamMarks: builder.mutation({
      query: (payload) => ({
        url: "/save-exam-marks",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: (result, error, { examId }) => [
        { type: "MarksRoster", id: examId },
      ],
    }),
    markExamComplete: builder.mutation({
      query: (payload) => ({
        url: "/complete-exam",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["ScheduledExams"],
    }),
    publishExamMarks: builder.mutation({
      query: (payload) => ({
        url: "/publish-exam-marks",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: (result, error, { examId }) => [
        "ScheduledExams",
        { type: "MarksRoster", id: examId },
      ],
    }),
    requestGradeCorrection: builder.mutation({
      query: (payload) => ({ url: "/corrections", method: "POST", body: payload }),
      invalidatesTags: ["MarksRoster"],
    }),
  }),
});

export const {
  useGetScheduledExamsQuery,
  useGetExamRosterQuery,
  useSaveExamMarksMutation,
  useMarkExamCompleteMutation,
  usePublishExamMarksMutation,
  useRequestGradeCorrectionMutation,
} = teacherMarksApi;
