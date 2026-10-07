import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const disciplinaryFilesApi = createApi({
  reducerPath: "disciplinaryFilesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/registrar/disciplinary`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["DisciplinaryFiles"],
  endpoints: (builder) => ({
    getDisciplinaryFiles: builder.query({
      query: () => "/",
      providesTags: ["DisciplinaryFiles"],
    }),
    createDisciplinaryFile: builder.mutation({
      query: (payload) => ({ url: "/", method: "POST", body: payload }),
      invalidatesTags: ["DisciplinaryFiles"],
    }),
    updateDisciplinaryFile: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/${id}`, method: "PATCH", body: payload }),
      invalidatesTags: ["DisciplinaryFiles"],
    }),
  }),
});

export const {
  useGetDisciplinaryFilesQuery,
  useCreateDisciplinaryFileMutation,
  useUpdateDisciplinaryFileMutation,
} = disciplinaryFilesApi;
