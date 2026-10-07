import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "./getAuthToken";

// Mirrors admissionTrashApi.js's shape exactly, but for the Student
// Management screen's own delete/trash flow (/api/student-trash) — a
// separate backend model/route set from the Admission Process's own
// trash, since a student here may not have come through Admission at all.
export const studentTrashApi = createApi({
  reducerPath: "studentTrashApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/student-trash`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["StudentTrash"],
  endpoints: (builder) => ({
    getStudentTrashList: builder.query({
      query: () => "/",
      providesTags: ["StudentTrash"],
    }),
    trashStudent: builder.mutation({
      query: ({ studentId, remark, password }) => ({
        url: `/${studentId}`,
        method: "POST",
        body: { remark, password },
      }),
      invalidatesTags: ["StudentTrash"],
    }),
    bulkTrashStudents: builder.mutation({
      query: ({ studentIds, remark, password }) => ({
        url: "/bulk",
        method: "POST",
        body: { studentIds, remark, password },
      }),
      invalidatesTags: ["StudentTrash"],
    }),
    restoreStudent: builder.mutation({
      query: (trashId) => ({
        url: `/${trashId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: ["StudentTrash"],
    }),
    permanentlyDeleteStudent: builder.mutation({
      query: ({ trashId, remark }) => ({
        url: `/${trashId}`,
        method: "DELETE",
        body: { remark },
      }),
      invalidatesTags: ["StudentTrash"],
    }),
  }),
});

export const {
  useGetStudentTrashListQuery,
  useTrashStudentMutation,
  useBulkTrashStudentsMutation,
  useRestoreStudentMutation,
  usePermanentlyDeleteStudentMutation,
} = studentTrashApi;
