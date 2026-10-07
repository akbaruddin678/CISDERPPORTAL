import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const examCoordinationApi = createApi({
  reducerPath: "examCoordinationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/exam/hod-schedule`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["HodSchedule"],
  endpoints: (builder) => ({
    getExamScheduleForHod: builder.query({
      query: (params) => ({ url: "/schedule", params }),
      providesTags: ["HodSchedule"],
    }),
  }),
});

export const { useGetExamScheduleForHodQuery } = examCoordinationApi;
