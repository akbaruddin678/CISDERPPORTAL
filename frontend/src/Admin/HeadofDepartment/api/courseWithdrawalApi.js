import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const courseWithdrawalApi = createApi({
  reducerPath: "courseWithdrawalApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/course/withdrawals`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["WithdrawableRegistrations"],
  endpoints: (builder) => ({
    getWithdrawableRegistrations: builder.query({
      query: (params) => ({ url: "/eligible", params }),
      providesTags: ["WithdrawableRegistrations"],
    }),
    createCourseWithdrawal: builder.mutation({
      query: (payload) => ({ url: "/", method: "POST", body: payload }),
      invalidatesTags: ["WithdrawableRegistrations"],
    }),
  }),
});

export const {
  useGetWithdrawableRegistrationsQuery,
  useCreateCourseWithdrawalMutation,
} = courseWithdrawalApi;
