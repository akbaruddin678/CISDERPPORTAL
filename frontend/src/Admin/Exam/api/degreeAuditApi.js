import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

// The Controller of Exams' "Batch Completion" action — runs the automated
// degree audit (CGPA / credits / curriculum check) for a Program (and
// optionally one admission batch), transitioning qualifying final-semester
// students to "academically_completed" so they leave active class rosters
// and become visible to the HOD's Graduation Clearance candidate list.
export const degreeAuditApi = createApi({
  reducerPath: "degreeAuditApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/exam/degree-audit`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getAuditScope: builder.query({
      query: (params) => ({ url: "/scope", params }),
    }),
    runDegreeAudit: builder.mutation({
      query: (body) => ({ url: "/run", method: "POST", body }),
    }),
  }),
});

export const { useGetAuditScopeQuery, useRunDegreeAuditMutation } = degreeAuditApi;
