import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const masterTimetableApi = createApi({
  reducerPath: "masterTimetableApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/registrar/timetable`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["TimetableEntries", "SchedulableAssignments"],
  endpoints: (builder) => ({
    getSchedulableAssignments: builder.query({
      query: (params) => ({ url: "/assignments", params }),
      providesTags: ["SchedulableAssignments"],
    }),
    // `params` is optional — { day, termId, programId, departmentId } narrows
    // the result server-side (used by the Exam module's filter toolbar and
    // to scope an HOD's own department automatically).
    getTimetableEntries: builder.query({
      query: (params) => ({ url: "/", params }),
      providesTags: ["TimetableEntries"],
    }),
    createTimetableEntry: builder.mutation({
      query: (payload) => ({ url: "/", method: "POST", body: payload }),
      invalidatesTags: ["TimetableEntries"],
    }),
    updateTimetableEntry: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/${id}`, method: "PATCH", body: payload }),
      invalidatesTags: ["TimetableEntries"],
    }),
    deleteTimetableEntry: builder.mutation({
      query: (id) => ({ url: `/${id}`, method: "DELETE" }),
      invalidatesTags: ["TimetableEntries"],
    }),
  }),
});

export const {
  useGetSchedulableAssignmentsQuery,
  useGetTimetableEntriesQuery,
  useCreateTimetableEntryMutation,
  useUpdateTimetableEntryMutation,
  useDeleteTimetableEntryMutation,
} = masterTimetableApi;
