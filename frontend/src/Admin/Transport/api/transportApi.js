import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../../Admin/Admission/services/getAuthToken";

export const transportApi = createApi({
  reducerPath: "transportApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/transport`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: [
    "TransportAllocations",
    "TransportChallans",
    "TransportStats",
    "TransportRoutes",
    "Vehicles",
    "Drivers",
  ],

  endpoints: (builder) => ({
    // Setup
    getVehicles: builder.query({
      query: () => "/vehicles",
      providesTags: ["Vehicles"],
    }),
    createVehicle: builder.mutation({
      query: (body) => ({ url: "/vehicles", method: "POST", body }),
      invalidatesTags: ["Vehicles"],
    }),
    getDrivers: builder.query({
      query: () => "/drivers",
      providesTags: ["Drivers"],
    }),
    createDriver: builder.mutation({
      query: (body) => ({ url: "/drivers", method: "POST", body }),
      invalidatesTags: ["Drivers"],
    }),
    getRoutes: builder.query({
      query: () => "/routes",
      providesTags: ["TransportRoutes"],
    }),
    createRoute: builder.mutation({
      query: (body) => ({ url: "/routes", method: "POST", body }),
      invalidatesTags: ["TransportRoutes"],
    }),

    // Allocation
    getAllocations: builder.query({
      query: () => "/allocations",
      providesTags: ["TransportAllocations"],
    }),
    assignTransport: builder.mutation({
      query: (body) => ({ url: "/assign", method: "POST", body }),
      invalidatesTags: [
        "TransportAllocations",
        "TransportChallans",
        "TransportStats",
      ],
    }),
    vacateTransport: builder.mutation({
      query: (id) => ({ url: `/vacate/${id}`, method: "PUT" }),
      invalidatesTags: ["TransportAllocations"],
    }),

    // Challans & Stats
    getChallans: builder.query({
      query: () => "/challans",
      providesTags: ["TransportChallans"],
    }),
    generateChallan: builder.mutation({
      query: (body) => ({ url: "/generate-challan", method: "POST", body }),
      invalidatesTags: ["TransportChallans", "TransportStats"],
    }),
    getStats: builder.query({
      query: () => "/stats",
      providesTags: ["TransportStats"],
    }),

    // Global Student Search
    getStudents: builder.query({
      queryFn: async (params) => {
        try {
          const token = getAuthToken();
          const qs = new URLSearchParams({
            status: "active",
            limit: 100,
            ...params,
          }).toString();
          const response = await fetch(`${baseUrl}/api/student?${qs}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          return { data: data };
        } catch (error) {
          return { error: { status: 500, data: error.message } };
        }
      },
    }),
  }),
});

export const {
  useGetVehiclesQuery,
  useCreateVehicleMutation,
  useGetDriversQuery,
  useCreateDriverMutation,
  useGetRoutesQuery,
  useCreateRouteMutation,
  useGetAllocationsQuery,
  useAssignTransportMutation,
  useVacateTransportMutation,
  useGetChallansQuery,
  useGenerateChallanMutation,
  useGetStatsQuery,
  useGetStudentsQuery,
} = transportApi;
