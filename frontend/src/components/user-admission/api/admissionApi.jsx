import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const admissionApi = createApi({
  reducerPath: "admissionApi",
  baseQuery: fetchBaseQuery({
    // Base URL is .../api/admissions/applications
    baseUrl: `${baseUrl}/api/admissions/applications`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Admission", "Challan"],
  endpoints: (builder) => ({
    getMyAdmission: builder.query({
      query: () => ({
        url: "/me",
        method: "GET",
      }),
      providesTags: ["Admission"],
    }),
    saveDraft: builder.mutation({
      query: (data) => ({
        url: "/draft",
        method: "POST",
        body: data,
      }),
    }),
    uploadFile: builder.mutation({
      query: (formData) => ({
        url: "/upload",
        method: "POST",
        body: formData,
      }),
    }),
    submitAdmission: builder.mutation({
      query: () => ({
        url: "/submit",
        method: "POST",
      }),
      invalidatesTags: ["Admission", "Challan"],
    }),

    // --- TARGETS /api/admissions/challans/latest/:profileId ---
    getLatestChallan: builder.query({
      query: (profileId) => ({
        url: `../challans/latest/${profileId}`,
        method: "GET",
      }),
      providesTags: ["Challan"],
    }),
  }),
});

export const {
  useGetMyAdmissionQuery,
  useSaveDraftMutation,
  useUploadFileMutation,
  useSubmitAdmissionMutation,
  useGetLatestChallanQuery,
} = admissionApi;
