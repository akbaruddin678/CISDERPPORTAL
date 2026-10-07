import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const admissionCampaignApi = createApi({
  reducerPath: "admissionCampaignApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/admissions/campaigns`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["AdmissionCampaigns"],
  endpoints: (builder) => ({
    getCampaigns: builder.query({
      query: () => "/",
      providesTags: ["AdmissionCampaigns"],
    }),
    createCampaign: builder.mutation({
      query: (payload) => ({ url: "/", method: "POST", body: payload }),
      invalidatesTags: ["AdmissionCampaigns"],
    }),
  }),
});

export const { useGetCampaignsQuery, useCreateCampaignMutation } = admissionCampaignApi;
