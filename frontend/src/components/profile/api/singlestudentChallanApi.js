import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../base/baseurl";
import { getAuthToken } from "../../user-admission/services/getAuthToken";

export const singlestudentChallanApi = createApi({
  reducerPath: "singlestudentChallanApi", // This must match what is in your store.jsx
  baseQuery: fetchBaseQuery({
    // Pointing to the specific route we created in the backend
    baseUrl: `${baseUrl}/api/admissions/challans`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["LatestChallan"],
  endpoints: (builder) => ({
    // This query expects a userId and appends it to the URL
    getLatestChallan: builder.query({
      query: (userId) => `/latest/${userId}`,
      providesTags: ["LatestChallan"],
    }),
  }),
});

// Export the hook for use in the controller
export const { useGetLatestChallanQuery } = singlestudentChallanApi;
