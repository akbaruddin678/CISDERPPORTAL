import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../HeadofDepartment/services/getAuthToken";

// One slice for the whole degree-clearance flow (HOD -> Exam -> Offices ->
// Accounts -> Registrar). Every stage action is the same shape — a POST to
// /:id/<path> — so a single `runStep` mutation covers all of them.
export const graduationApi = createApi({
  reducerPath: "graduationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/graduation`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Clearances", "Candidates", "Graduates", "Offices"],
  endpoints: (builder) => ({
    getGraduationMe: builder.query({ query: () => "/me" }),

    getCandidates: builder.query({
      query: (params) => ({ url: "/candidates", params }),
      providesTags: ["Candidates"],
    }),
    getEligibility: builder.query({
      query: (studentId) => `/students/${studentId}/eligibility`,
    }),

    getClearances: builder.query({
      query: (params) => ({ url: "/", params }),
      providesTags: ["Clearances"],
    }),
    getClearance: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: "Clearances", id }],
    }),
    getGraduates: builder.query({
      query: (params) => ({ url: "/graduates", params }),
      providesTags: ["Graduates"],
    }),

    startClearance: builder.mutation({
      query: (studentId) => ({ url: "/", method: "POST", body: { studentId } }),
      invalidatesTags: ["Clearances", "Candidates"],
    }),
    // Many students at once — the server reports which started and which were
    // skipped (with the reason) instead of failing the whole batch.
    startClearanceBulk: builder.mutation({
      query: (studentIds) => ({ url: "/bulk", method: "POST", body: { studentIds } }),
      invalidatesTags: ["Clearances", "Candidates"],
    }),
    // One stage action (submit / approve / return / clear / finalize / cancel)
    // applied to many clearances with a shared remark. Returns {done, failed}.
    runBulkAction: builder.mutation({
      query: (body) => ({ url: "/bulk-action", method: "POST", body }),
      invalidatesTags: ["Clearances", "Candidates", "Graduates"],
    }),
    runStep: builder.mutation({
      query: ({ id, path, body }) => ({ url: `/${id}/${path}`, method: "POST", body: body || {} }),
      invalidatesTags: (result, error, { id }) => [
        "Clearances",
        "Candidates",
        "Graduates",
        { type: "Clearances", id },
      ],
    }),

    getOffices: builder.query({
      query: () => "/offices",
      providesTags: ["Offices"],
    }),
    createOffice: builder.mutation({
      query: (body) => ({ url: "/offices", method: "POST", body }),
      invalidatesTags: ["Offices"],
    }),
    updateOffice: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/offices/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Offices"],
    }),
    searchOfficerCandidates: builder.query({
      query: (q) => ({ url: "/offices/officer-search", params: { q } }),
    }),
  }),
});

export const {
  useGetGraduationMeQuery,
  useGetCandidatesQuery,
  useGetEligibilityQuery,
  useGetClearancesQuery,
  useGetClearanceQuery,
  useGetGraduatesQuery,
  useStartClearanceMutation,
  useStartClearanceBulkMutation,
  useRunBulkActionMutation,
  useRunStepMutation,
  useGetOfficesQuery,
  useCreateOfficeMutation,
  useUpdateOfficeMutation,
  useSearchOfficerCandidatesQuery,
} = graduationApi;
