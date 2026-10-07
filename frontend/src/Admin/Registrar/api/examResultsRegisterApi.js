import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

// Read-only: the Registrar sees the same submissions list/roster as HOD/
// Academia/VC, but has no review route — results here are for record-keeping
// once officially declared (VC-approved).
export const examResultsRegisterApi = createApi({
  reducerPath: "examResultsRegisterApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/exam/teacher-marks`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["RegisterSubmissions", "RegisterRoster"],
  endpoints: (builder) => ({
    getSubmissionsForRegister: builder.query({
      query: () => "/registrar/submissions",
      providesTags: ["RegisterSubmissions"],
    }),
    getSubmissionRosterForRegister: builder.query({
      query: (id) => `/registrar/submissions/${id}/roster`,
      providesTags: (result, error, id) => [{ type: "RegisterRoster", id }],
    }),
  }),
});

export const {
  useGetSubmissionsForRegisterQuery,
  useGetSubmissionRosterForRegisterQuery,
} = examResultsRegisterApi;
