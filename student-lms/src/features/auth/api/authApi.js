import { baseApi } from "../../../services/baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    studentLogin: builder.mutation({
      query: (credentials) => ({
        url: "/lms/auth/login", 
        method: "POST",
        body: credentials,
      }),
    }),
  }),
});

export const { useStudentLoginMutation } = authApi;
