import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

// Read-only wrapper around the existing, already-open admission endpoints
// (backend: admissions/controller/admissionsController.js — getAdmissionList
// / getAdmissionDetails). The VC portal never mutates an application; it
// just needs full visibility into every one, at every stage.
export const vcAdmissionsApi = createApi({
  reducerPath: "vcAdmissionsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/admissions`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getVcAdmissionsList: builder.query({
      query: ({ page = 1, limit = 12, search = "", status = "" }) => ({
        url: "/admission-list",
        params: { page, limit, search, status },
      }),
    }),
    getVcAdmissionDetails: builder.query({
      query: (admissionId) => `/admission-details/${admissionId}`,
    }),
  }),
});

export const { useGetVcAdmissionsListQuery, useGetVcAdmissionDetailsQuery } = vcAdmissionsApi;
