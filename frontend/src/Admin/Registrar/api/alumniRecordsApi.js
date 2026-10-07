import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const alumniRecordsApi = createApi({
  reducerPath: "alumniRecordsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/registrar/alumni`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["AlumniRecords"],
  endpoints: (builder) => ({
    getAlumniProfiles: builder.query({
      query: () => "/",
      providesTags: ["AlumniRecords"],
    }),
    createAlumniProfile: builder.mutation({
      query: (payload) => ({ url: "/", method: "POST", body: payload }),
      invalidatesTags: ["AlumniRecords"],
    }),
    updateAlumniProfile: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/${id}`, method: "PATCH", body: payload }),
      invalidatesTags: ["AlumniRecords"],
    }),
  }),
});

export const {
  useGetAlumniProfilesQuery,
  useCreateAlumniProfileMutation,
  useUpdateAlumniProfileMutation,
} = alumniRecordsApi;
