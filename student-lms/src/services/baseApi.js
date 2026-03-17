import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Point this to your existing Express backend
const BASE_URL = "http://localhost:5000/api";

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    // Get token from Redux state
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery,
  endpoints: () => ({}),
});
