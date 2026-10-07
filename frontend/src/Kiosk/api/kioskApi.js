import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../components/base/baseurl";

// No user is logged in at a kiosk terminal — this hits the same
// shared-secret-gated endpoint a real biometric device would push to
// (backend/src/hr/routes/attendanceDeviceRoutes.js), authenticated via a
// build-time secret baked into the kiosk page instead of a JWT.
export const kioskApi = createApi({
  reducerPath: "kioskApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/attendance-device`,
    prepareHeaders: (headers) => {
      const secret = import.meta.env.VITE_BIOMETRIC_KIOSK_SECRET;
      if (secret) headers.set("x-biometric-secret", secret);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    punchAttendance: builder.mutation({
      query: (biometricId) => ({
        url: "/punch",
        method: "POST",
        body: { biometricId, source: "kiosk" },
      }),
    }),
  }),
});

export const { usePunchAttendanceMutation } = kioskApi;
