import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const feeAnalyticsApi = createApi({
  reducerPath: "feeAnalyticsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/fee-analytics`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["FeeAnalytics", "MonthlyReports"],
  endpoints: (builder) => ({
    getFeeAnalytics: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
          if (
            value !== null &&
            value !== undefined &&
            value !== "" &&
            value !== "ALL"
          ) {
            // Handle month format conversion
            if (key === "month" && value !== "Current" && value.includes("-")) {
              const parts = value.split("-");
              // If format is YYYY-MM (from HTML input), convert to MM-YYYY for backend
              if (parts[0].length === 4) {
                params.append("month", `${parts[1]}-${parts[0]}`);
              } else {
                params.append("month", value);
              }
            } else {
              params.append(key, value);
            }
          }
        });

        const queryString = params.toString();
        return queryString ? `/?${queryString}` : "/";
      },
      providesTags: ["FeeAnalytics"],
      // Keep data fresh but use cached data while revalidating
      keepUnusedDataFor: 60, // Cache for 60 seconds
      // Handle errors gracefully
      transformErrorResponse: (response, meta, arg) => {
        return {
          status: response.status,
          message: response.data?.message || "Failed to fetch analytics data",
          data: response.data,
        };
      },
    }),

    lockMonthAndGenerateReport: builder.mutation({
      query: (data) => {
        // Ensure proper month format for backend
        let formattedMonth = data.targetMonth;

        if (
          formattedMonth &&
          formattedMonth !== "Current" &&
          formattedMonth.includes("-")
        ) {
          const parts = formattedMonth.split("-");
          // Convert YYYY-MM to MM-YYYY if needed
          if (parts[0].length === 4) {
            formattedMonth = `${parts[1]}-${parts[0]}`;
          }
        }

        return {
          url: "/lock-month",
          method: "POST",
          body: {
            ...data,
            targetMonth: formattedMonth,
          },
        };
      },
      invalidatesTags: ["FeeAnalytics", "MonthlyReports"],
      // Handle errors gracefully
      transformErrorResponse: (response, meta, arg) => {
        return {
          status: response.status,
          message: response.data?.message || "Failed to lock month",
          data: response.data,
        };
      },
    }),
  }),
});

export const {
  useGetFeeAnalyticsQuery,
  useLockMonthAndGenerateReportMutation,
} = feeAnalyticsApi;
