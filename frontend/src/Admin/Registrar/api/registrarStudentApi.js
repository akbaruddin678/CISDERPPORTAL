import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const registrarStudentApi = createApi({
  reducerPath: "registrarStudentApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/student`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["RegistrarStudents"],
  endpoints: (builder) => ({
    getAllStudents: builder.query({
      query: (params) => ({ url: "/", params }),
      providesTags: ["RegistrarStudents"],
    }),
    getStudentDetails: builder.query({
      query: (studentId) => `/${studentId}`,
      providesTags: (result, error, id) => [{ type: "RegistrarStudents", id }],
    }),
  }),
});

export const {
  useGetAllStudentsQuery,
  useLazyGetAllStudentsQuery,
  useGetStudentDetailsQuery,
  useLazyGetStudentDetailsQuery,
} = registrarStudentApi;
