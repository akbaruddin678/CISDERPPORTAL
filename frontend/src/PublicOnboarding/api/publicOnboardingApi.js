import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../components/base/baseurl";

// No login on this page at all (/teacher-onboarding) — the backend route
// this hits (backend/src/hr/routes/publicOnboardingRoutes.js) has no
// `protect` middleware, matching kioskApi.js's precedent for a genuinely
// public, unauthenticated endpoint.
export const publicOnboardingApi = createApi({
  reducerPath: "publicOnboardingApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${baseUrl}/api/public/teacher-onboarding` }),
  endpoints: (builder) => ({
    sendOnboardingOtp: builder.mutation({
      query: (email) => ({
        url: "/send-otp",
        method: "POST",
        body: { email },
      }),
    }),
    verifyOnboardingOtp: builder.mutation({
      query: ({ email, otp }) => ({
        url: "/verify-otp",
        method: "POST",
        body: { email, otp },
      }),
    }),
    submitOnboardingRequest: builder.mutation({
      query: (formData) => ({
        url: "/",
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

export const {
  useSendOnboardingOtpMutation,
  useVerifyOnboardingOtpMutation,
  useSubmitOnboardingRequestMutation,
} = publicOnboardingApi;
