import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../base/baseurl";

const baseQuery = fetchBaseQuery({ baseUrl: `${baseUrl}/api/user` });

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    registerUser: builder.mutation({
      query: (credentials) => ({
        url: "/register-applicant",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User"],
    }),
    
    // 👇 ADD THIS NEW ENDPOINT
    verifyUserEmail: builder.mutation({
      query: (body) => ({
        url: "/verify-email",
        method: "POST",
        body,
      }),
    }),
    // 👆 END NEW ENDPOINT

    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/${id}`,
        method: "PUT",
        body,
      }),
    }),
    getUserById: builder.query({
      query: (id) => `/${id}`,
    }),
    loginUser: builder.mutation({
      query: (payload) => ({
        url: "/login",
        method: "POST",
        body: payload,
      }),
    }),

    forgotPassword: builder.mutation({
      query: (body) => ({
        url: "/forgot-password",
        method: "POST",
        body,
      }),
    }),
    verifyResetOtp: builder.mutation({
      query: (body) => ({
        url: "/verify-reset-otp",
        method: "POST",
        body,
      }),
    }),
    resetPassword: builder.mutation({
      query: (body) => ({
        url: "/reset-password",
        method: "POST",
        body,
      }),
    }),

    // Signup — email-verify-first flow (email -> OTP -> create account)
    sendRegistrationOtp: builder.mutation({
      query: (body) => ({
        url: "/register/send-otp",
        method: "POST",
        body,
      }),
    }),
    verifyRegistrationOtp: builder.mutation({
      query: (body) => ({
        url: "/register/verify-otp",
        method: "POST",
        body,
      }),
    }),
    completeRegistration: builder.mutation({
      query: (body) => ({
        url: "/register/complete",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useRegisterUserMutation,
  useLoginUserMutation,
  useUpdateUserMutation,
  useGetUserByIdQuery,
  useVerifyUserEmailMutation,
  useForgotPasswordMutation,
  useVerifyResetOtpMutation,
  useResetPasswordMutation,
  useSendRegistrationOtpMutation,
  useVerifyRegistrationOtpMutation,
  useCompleteRegistrationMutation,
} = userApi;