import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "./getAuthToken";

export const studentCardApi = createApi({
  reducerPath: "studentCardApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/student-cards`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Cards", "CardData"],
  endpoints: (builder) => ({
    getCardStudents: builder.query({
      query: (params) => ({ url: "/students", params }),
      providesTags: ["Cards", "CardData"],
    }),
    getCardData: builder.query({
      query: (studentId) => `/student/${studentId}`,
      providesTags: (r, e, id) => [{ type: "CardData", id }],
    }),
    getIssuedCards: builder.query({
      query: (params) => ({ url: "/", params }),
      providesTags: ["Cards"],
    }),
    saveCardPhoto: builder.mutation({
      query: ({ studentId, blob }) => {
        const body = new FormData();
        body.append("photo", blob, "student-photo.jpg");
        return { url: `/student/${studentId}/photo`, method: "PUT", body };
      },
      invalidatesTags: (r, e, { studentId }) => ["Cards", { type: "CardData", id: studentId }],
    }),
    issueCard: builder.mutation({
      query: (body) => ({ url: "/", method: "POST", body }),
      invalidatesTags: (r, e, { studentId }) => ["Cards", { type: "CardData", id: studentId }],
    }),
    markCardPrinted: builder.mutation({
      query: (id) => ({ url: `/${id}/printed`, method: "POST" }),
      invalidatesTags: ["Cards"],
    }),
    revokeCard: builder.mutation({
      query: ({ id, reason }) => ({ url: `/${id}/revoke`, method: "POST", body: { reason } }),
      invalidatesTags: ["Cards", "CardData"],
    }),
  }),
});

export const {
  useGetCardStudentsQuery,
  useGetCardDataQuery,
  useLazyGetCardDataQuery,
  useGetIssuedCardsQuery,
  useSaveCardPhotoMutation,
  useIssueCardMutation,
  useMarkCardPrintedMutation,
  useRevokeCardMutation,
} = studentCardApi;
