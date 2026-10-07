import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../../Admin/Admission/services/getAuthToken";

export const leftCasesApi = createApi({
  reducerPath: "leftCasesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/students`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["LeftStudents", "LeftStats"],
  endpoints: (builder) => ({
    getLeftStudentsStats: builder.query({
      query: (params = {}) => ({ url: "/left/stats", params }),
      providesTags: ["LeftStats"],
    }),

    getLeftStudentsList: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            params.append(key, value);
          }
        });
        const queryString = params.toString();
        return queryString ? `/left?${queryString}` : "/left";
      },
      providesTags: ["LeftStudents"],
    }),

    markStudentAsLeft: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/${id}/leave`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["LeftStudents", "LeftStats", "Students"],
    }),

    updateLeftStudentDetails: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/${id}/leave/update`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["LeftStudents"],
    }),
  }),
});

export const {
  useGetLeftStudentsStatsQuery,
  useGetLeftStudentsListQuery,
  useMarkStudentAsLeftMutation,
  useUpdateLeftStudentDetailsMutation, 
} = leftCasesApi;
