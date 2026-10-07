import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

// Program Regulations — the per-Program-per-Batch credit-hour and
// degree-duration rules the Degree Audit and course registration enforce.
export const programRegulationApi = createApi({
  reducerPath: "programRegulationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/catalog/program-regulations`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Regulations"],
  endpoints: (builder) => ({
    getRegulations: builder.query({
      query: (params) => ({ url: "/", params }),
      providesTags: ["Regulations"],
    }),
    saveRegulation: builder.mutation({
      query: (body) => ({ url: "/", method: "POST", body }),
      invalidatesTags: ["Regulations"],
    }),
    lockRegulation: builder.mutation({
      query: (id) => ({ url: `/${id}/lock`, method: "PATCH" }),
      invalidatesTags: ["Regulations"],
    }),
    unlockRegulation: builder.mutation({
      query: (id) => ({ url: `/${id}/unlock`, method: "PATCH" }),
      invalidatesTags: ["Regulations"],
    }),
  }),
});

export const {
  useGetRegulationsQuery,
  useSaveRegulationMutation,
  useLockRegulationMutation,
  useUnlockRegulationMutation,
} = programRegulationApi;
