import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../../Admin/Admission/services/getAuthToken";

export const hostelApi = createApi({
  reducerPath: "hostelApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/account/hostel-allocation`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["HostelAllocations", "HostelChallans", "HostelStats", "Students"],

  endpoints: (builder) => ({
    getHostelAllocations: builder.query({
      query: () => "/hostel/allocations",
      providesTags: ["HostelAllocations", "HostelStats"],
    }),
    assignHostelSeat: builder.mutation({
      query: (body) => ({ url: "/hostel/assign", method: "POST", body }),
      invalidatesTags: ["HostelAllocations", "HostelChallans", "HostelStats"],
    }),
    vacateHostelSeat: builder.mutation({
      query: (id) => ({ url: `/hostel/vacate/${id}`, method: "PUT" }),
      invalidatesTags: ["HostelAllocations", "HostelStats"],
    }),
    getHostelChallans: builder.query({
      query: () => "/hostel/challans",
      providesTags: ["HostelChallans"],
    }),
    generateHostelChallan: builder.mutation({
      query: (body) => ({
        url: "/hostel/generate-challan",
        method: "POST",
        body,
      }),
      invalidatesTags: ["HostelChallans", "HostelStats"],
    }),
    getHostelStats: builder.query({
      query: () => "/hostel/stats",
      providesTags: ["HostelStats", "HostelChallans"],
    }),

    updateHostelAllocation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/hostel/allocation/${id}`, 
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["HostelAllocations", "HostelStats"],
    }),

    // ✅ FIXED: Pointing to correct URL and cleaning parameters
    getStudents: builder.query({
      queryFn: async (params) => {
        try {
          const token = getAuthToken();

          // Remove empty parameters so the URL stays clean
          const cleanParams = Object.fromEntries(
            Object.entries(params).filter(
              ([_, v]) => v !== "" && v !== null && v !== undefined,
            ),
          );

          const queryString = new URLSearchParams({
            status: "active",
            limit: 100,
            ...cleanParams,
          }).toString();

          // ✅ THE FIX: Hit the 'account/students' route, not 'student'
          const response = await fetch(
            `${baseUrl}/api/account/students?${queryString}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          const data = await response.json();
          return { data: data };
        } catch (error) {
          return { error: { status: 500, data: error.message } };
        }
      },
      providesTags: ["Students"],
    }),
  }),
});

export const {
  useGetHostelAllocationsQuery,
  useAssignHostelSeatMutation,
  useVacateHostelSeatMutation,
  useGetHostelChallansQuery,
  useGenerateHostelChallanMutation,
  useUpdateHostelAllocationMutation,
  useGetHostelStatsQuery,
  useGetStudentsQuery,
} = hostelApi;
