import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../../components/base/baseurl";
import { getAuthToken } from "../../services/getAuthToken";

export const leaveApi = createApi({
  reducerPath: "leaveApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/staff/leaves`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["MyLeaveRequests"],
  endpoints: (builder) => ({
    getMyLeaveRequests: builder.query({
      query: () => "/my-requests",
      providesTags: ["MyLeaveRequests"],
    }),
    submitLeaveRequest: builder.mutation({
      query: (payload) => ({ url: "/", method: "POST", body: payload }),
      invalidatesTags: ["MyLeaveRequests"],
    }),
    cancelLeaveRequest: builder.mutation({
      query: (id) => ({ url: `/${id}`, method: "DELETE" }),
      invalidatesTags: ["MyLeaveRequests"],
    }),
  }),
});

export const {
  useGetMyLeaveRequestsQuery,
  useSubmitLeaveRequestMutation,
  useCancelLeaveRequestMutation,
} = leaveApi;
