import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../../components/base/baseurl";
import { getAuthToken } from "../../services/getAuthToken";

export const lecturesApi = createApi({
  reducerPath: "lecturesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/course`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Lectures", "Lecture"],
  endpoints: (builder) => ({
    getLectures: builder.query({
      query: (courseAssignmentId) => ({
        url: "/lectures",
        params: { courseAssignmentId },
      }),
      providesTags: (result, error, courseAssignmentId) => [
        { type: "Lectures", id: courseAssignmentId },
      ],
    }),
    getLectureById: builder.query({
      query: (lectureId) => `/lectures/${lectureId}`,
      providesTags: (result, error, lectureId) => [
        { type: "Lecture", id: lectureId },
      ],
    }),
    // `formData` bodies are sent as-is — fetchBaseQuery skips JSON
    // serialization for FormData and lets the browser set the multipart
    // boundary header itself.
    createLecture: builder.mutation({
      query: (formData) => ({
        url: "/lectures",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, formData) => [
        { type: "Lectures", id: formData.get("courseAssignmentId") },
      ],
    }),
    updateLecture: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/lectures/${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (result, error, { id, courseAssignmentId }) => [
        { type: "Lecture", id },
        { type: "Lectures", id: courseAssignmentId },
      ],
    }),
    deleteLecture: builder.mutation({
      query: ({ id }) => ({
        url: `/lectures/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id, courseAssignmentId }) => [
        { type: "Lecture", id },
        { type: "Lectures", id: courseAssignmentId },
      ],
    }),
  }),
});

export const {
  useGetLecturesQuery,
  useGetLectureByIdQuery,
  useCreateLectureMutation,
  useUpdateLectureMutation,
  useDeleteLectureMutation,
} = lecturesApi;
