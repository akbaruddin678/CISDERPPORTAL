import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../../components/base/baseurl";
import { getAuthToken } from "../../services/getAuthToken";

export const assignmentsApi = createApi({
  reducerPath: "assignmentsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/course`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Assignments", "Assignment"],
  endpoints: (builder) => ({
    getAssignments: builder.query({
      query: (courseAssignmentId) => ({
        url: "/assignments",
        params: { courseAssignmentId },
      }),
      providesTags: (result, error, courseAssignmentId) => [
        { type: "Assignments", id: courseAssignmentId },
      ],
    }),
    getAssignmentById: builder.query({
      query: (assignmentId) => `/assignments/${assignmentId}`,
      providesTags: (result, error, assignmentId) => [
        { type: "Assignment", id: assignmentId },
      ],
    }),
    // `formData` bodies are sent as-is — fetchBaseQuery skips JSON
    // serialization for FormData and lets the browser set the multipart
    // boundary header itself.
    createAssignment: builder.mutation({
      query: (formData) => ({
        url: "/assignments",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, formData) => [
        { type: "Assignments", id: formData.get("courseAssignmentId") },
      ],
    }),
    updateAssignment: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/assignments/${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (result, error, { id, courseAssignmentId }) => [
        { type: "Assignment", id },
        { type: "Assignments", id: courseAssignmentId },
      ],
    }),
    extendDueDate: builder.mutation({
      query: ({ id, newDueDate, reason }) => ({
        url: `/assignments/${id}/extend-due-date`,
        method: "PATCH",
        body: { newDueDate, reason },
      }),
      invalidatesTags: (result, error, { id, courseAssignmentId }) => [
        { type: "Assignment", id },
        { type: "Assignments", id: courseAssignmentId },
      ],
    }),
    deleteAssignment: builder.mutation({
      query: ({ id }) => ({
        url: `/assignments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id, courseAssignmentId }) => [
        { type: "Assignment", id },
        { type: "Assignments", id: courseAssignmentId },
      ],
    }),
  }),
});

export const {
  useGetAssignmentsQuery,
  useGetAssignmentByIdQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useExtendDueDateMutation,
  useDeleteAssignmentMutation,
} = assignmentsApi;
