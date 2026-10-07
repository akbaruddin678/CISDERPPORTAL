import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const hodLeaveApi = createApi({
  reducerPath: "hodLeaveApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/staff/leaves`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["HodLeaveRequests"],
  endpoints: (builder) => ({
    getAllLeaveRequestsForHod: builder.query({
      query: () => "/hod/all",
      providesTags: ["HodLeaveRequests"],
    }),
    reviewLeaveRequestAsHod: builder.mutation({
      query: ({ id, decision, remarks }) => ({
        url: `/hod/${id}/review`,
        method: "PATCH",
        body: { decision, remarks },
      }),
      invalidatesTags: ["HodLeaveRequests"],
    }),
  }),
});

export const { useGetAllLeaveRequestsForHodQuery, useReviewLeaveRequestAsHodMutation } =
  hodLeaveApi;
