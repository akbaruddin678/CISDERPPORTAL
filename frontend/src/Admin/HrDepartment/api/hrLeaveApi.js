import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../Admission/services/getAuthToken";

export const hrLeaveApi = createApi({
  reducerPath: "hrLeaveApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/staff/leaves`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["HrLeaveRequests"],
  endpoints: (builder) => ({
    getAllLeaveRequestsForHr: builder.query({
      query: () => "/hr/all",
      providesTags: ["HrLeaveRequests"],
    }),
    reviewLeaveRequestAsHr: builder.mutation({
      query: ({ id, decision, remarks }) => ({
        url: `/hr/${id}/review`,
        method: "PATCH",
        body: { decision, remarks },
      }),
      invalidatesTags: ["HrLeaveRequests"],
    }),
  }),
});

export const { useGetAllLeaveRequestsForHrQuery, useReviewLeaveRequestAsHrMutation } =
  hrLeaveApi;
