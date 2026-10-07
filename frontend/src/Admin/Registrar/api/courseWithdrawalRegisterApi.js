import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

// Read-only: HOD is the sole decision-maker for course withdrawals: the
// Registrar only ever reads the resulting register, never acts on it.
export const courseWithdrawalRegisterApi = createApi({
  reducerPath: "courseWithdrawalRegisterApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/course/withdrawals`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["WithdrawalRegister"],
  endpoints: (builder) => ({
    getWithdrawalRegister: builder.query({
      query: () => "/register",
      providesTags: ["WithdrawalRegister"],
    }),
  }),
});

export const { useGetWithdrawalRegisterQuery } = courseWithdrawalRegisterApi;
