import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

// Read-only view of the real applicant-submission pipeline (the Admission
// model) — no scoring, no separate enrollment-conversion action, just the
// real data submitted through the actual admission portal.
export const admissionsRegisterApi = createApi({
  reducerPath: "admissionsRegisterApi",
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
    getAdmissionList: builder.query({
      query: (params) => ({ url: "/admission-list", params }),
      providesTags: ["AdmissionList"],
    }),
    getAdmissionDetails: builder.query({
      query: (id) => `/admission-details/${id}`,
      providesTags: (result, error, id) => [{ type: "AdmissionList", id }],
    }),
  }),
});

export const { useGetAdmissionListQuery, useGetAdmissionDetailsQuery } = admissionsRegisterApi;
