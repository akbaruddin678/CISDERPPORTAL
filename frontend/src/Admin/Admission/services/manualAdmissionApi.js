import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "./getAuthToken";

export const manualAdmissionApi = createApi({
  reducerPath: "manualAdmissionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/admissions/manual`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["AdmissionList"],
  endpoints: (builder) => ({
    createManualAdmission: builder.mutation({
      query: (payload) => ({ url: "/", method: "POST", body: payload }),
      invalidatesTags: ["AdmissionList"],
    }),
  }),
});

export const { useCreateManualAdmissionMutation } = manualAdmissionApi;
