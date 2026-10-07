import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const catalogApi = createApi({
  reducerPath: "catalogApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/catalog/`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),

  tagTypes: ["Departments", "Programs", "Terms", "CompleteCatalog"],

  endpoints: (builder) => ({
    // Departments/programs/terms in one cascading, pre-filtered call —
    // excludeLevel: "HSSC" drops college/intermediate departments and
    // programs, and (since terms are a shared collection) their annual-type
    // college sessions too, leaving only university-level choices.
    getCompleteCatalog: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.level) queryParams.append("level", params.level);
        if (params.excludeLevel)
          queryParams.append("excludeLevel", params.excludeLevel);
        const qs = queryParams.toString();
        return { url: qs ? `complete?${qs}` : "complete", method: "GET" };
      },
      providesTags: ["CompleteCatalog"],
    }),

    // Get all departments
    getAllDepartments: builder.query({
      query: () => ({
        url: "/departments",
        method: "GET",
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((dep) => ({
                type: "Departments",
                id: dep._id,
              })),
              { type: "Departments", id: "LIST" },
            ]
          : [{ type: "Departments", id: "LIST" }],
    }),

    // Get all programs
    getAllPrograms: builder.query({
      query: () => ({
        url: "/programs",
        method: "GET",
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((program) => ({
                type: "Programs",
                id: program._id,
              })),
              { type: "Programs", id: "LIST" },
            ]
          : [{ type: "Programs", id: "LIST" }],
    }),

    // Get all terms
    getAllTerms: builder.query({
      query: () => ({
        url: "/terms",
        method: "GET",
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((term) => ({
                type: "Terms",
                id: term._id,
              })),
              { type: "Terms", id: "LIST" },
            ]
          : [{ type: "Terms", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAllDepartmentsQuery,
  useGetAllProgramsQuery,
  useGetAllTermsQuery,
  useGetCompleteCatalogQuery,
} = catalogApi;
