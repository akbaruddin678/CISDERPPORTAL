import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../base/baseurl";
import { getAuthToken } from "../../user-admission/services/getAuthToken";

export const profileApi = createApi({
  reducerPath: "profileApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/profile`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["AdmissionStatus"],
  endpoints: (builder) => ({

  }),
});

export const { useGetAdmissionByUserIdQuery } = profileApi;
