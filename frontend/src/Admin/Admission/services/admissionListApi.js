import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "./getAuthToken";

// Wraps the existing, already-real /api/admissions/admission-list endpoint
// (unchanged) — just gives the new Admission Process tabs a cached,
// status-filterable RTK Query hook instead of the legacy raw-fetch
// pagination hook (useAdmssionController.js) that the old flat list used.
export const admissionListApi = createApi({
  reducerPath: "admissionListApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/admissions`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["AdmissionList"],
  endpoints: (builder) => ({
    getAdmissionsByStatus: builder.query({
      query: ({ status, page = 1, limit = 20, search = "" }) =>
        `/admission-list?status=${status}&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
      providesTags: ["AdmissionList"],
    }),

    updateAdmissionRemark: builder.mutation({
      query: ({ id, remark }) => ({
        url: `/${id}/remark`,
        method: "PATCH",
        body: { remark },
      }),
      invalidatesTags: ["AdmissionList"],
    }),
  }),
});

export const {
  useGetAdmissionsByStatusQuery,
  useUpdateAdmissionRemarkMutation,
} = admissionListApi;
