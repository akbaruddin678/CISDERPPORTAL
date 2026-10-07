import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../services/getAuthToken";

export const roomApi = createApi({
  reducerPath: "roomApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/registrar/rooms`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Rooms"],
  endpoints: (builder) => ({
    getRooms: builder.query({
      query: (params) => ({ url: "/", params }),
      providesTags: ["Rooms"],
    }),
    createRoom: builder.mutation({
      query: (payload) => ({ url: "/", method: "POST", body: payload }),
      invalidatesTags: ["Rooms"],
    }),
    updateRoom: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/${id}`, method: "PATCH", body: payload }),
      invalidatesTags: ["Rooms"],
    }),
  }),
});

export const { useGetRoomsQuery, useCreateRoomMutation, useUpdateRoomMutation } = roomApi;
