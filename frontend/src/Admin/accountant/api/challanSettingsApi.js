import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../../Admin/Admission/services/getAuthToken";

export const challanSettingsApi = createApi({
  reducerPath: "challanSettingsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/account/fee-structures`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["FeeStructures"],
  endpoints: (builder) => ({
    // ✅ CREATE / UPDATE Fee Component
    createFeeStructure: builder.mutation({
      query: (body) => ({
        url: "/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["FeeStructures"],
    }),

    // ✅ GET All Fee Structures
    getAllFeeStructures: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams();

        if (filters.programId) params.append("programId", filters.programId);
        if (filters.departmentId)
          params.append("departmentId", filters.departmentId);
        if (filters.termId) params.append("termId", filters.termId);
        if (filters.isActive !== undefined)
          params.append("isActive", filters.isActive);

        // Convert to string. e.g., "programId=123&termId=456"
        const queryString = params.toString();
        // Return URL with query string if params exist
        return queryString ? `/?${queryString}` : "/";
      },
      providesTags: ["FeeStructures"],
    }),

    // ✅ DELETE Fee Structure
    deleteFeeStructure: builder.mutation({
      query: ({ id, componentId }) => ({
        url: `/${id}`,
        method: "DELETE",
        params: { componentId }, // ?componentId=...
      }),
      invalidatesTags: ["FeeStructures"],
    }),
  }),
});

export const {
  useCreateFeeStructureMutation,
  useGetAllFeeStructuresQuery,
  useDeleteFeeStructureMutation,
} = challanSettingsApi;
