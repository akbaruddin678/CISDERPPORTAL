import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "./getAuthToken";

export const admissionTrashApi = createApi({
  reducerPath: "admissionTrashApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/admissions/trash`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Trash", "AdmissionStats", "CompletedAdmissions"],
  endpoints: (builder) => ({
    getAdmissionProcessStats: builder.query({
      query: () => "/stats",
      providesTags: ["AdmissionStats"],
    }),
    // status: "trashed" (soft-deleted, still restorable) | "permanently_deleted"
    // (hard-deleted, read-only audit trail — visible for the same 60-day
    // retention window, see admissionTrashController.js::getTrashList).
    getTrashList: builder.query({
      query: (status = "trashed") => `/?status=${status}`,
      providesTags: ["Trash"],
    }),
    // `scope`: "admission_only" (default when omitted server-side falls
    // back to "both") | "both" — see admissionTrashController.js for the
    // server-side rule on when "both" is actually allowed.
    trashAdmission: builder.mutation({
      query: ({ admissionId, remark, scope }) => ({
        url: `/${admissionId}`,
        method: "POST",
        body: { remark, scope },
      }),
      invalidatesTags: ["Trash", "AdmissionStats"],
    }),
    restoreAdmission: builder.mutation({
      query: (trashId) => ({
        url: `/${trashId}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: ["Trash", "AdmissionStats"],
    }),
    permanentlyDeleteAdmission: builder.mutation({
      query: ({ trashId, remark }) => ({
        url: `/${trashId}`,
        method: "DELETE",
        body: { remark },
      }),
      invalidatesTags: ["Trash", "AdmissionStats"],
    }),
    // Only valid on an accepted application with a fully-paid challan —
    // archives the student into CompletedAdmissionRecord and permanently
    // clears just the Admission application (StudentProfile untouched).
    completeAdmission: builder.mutation({
      query: ({ admissionId, remark, confirmed }) => ({
        url: `/${admissionId}/complete`,
        method: "POST",
        body: { remark, confirmed },
      }),
      invalidatesTags: ["AdmissionStats", "CompletedAdmissions"],
    }),
    getCompletedAdmissions: builder.query({
      query: (params = {}) => {
        const qs = params.currentSession ? "?currentSession=true" : "";
        return `/completed${qs}`;
      },
      providesTags: ["CompletedAdmissions"],
    }),
  }),
});

export const {
  useGetAdmissionProcessStatsQuery,
  useGetTrashListQuery,
  useTrashAdmissionMutation,
  useRestoreAdmissionMutation,
  usePermanentlyDeleteAdmissionMutation,
  useCompleteAdmissionMutation,
  useGetCompletedAdmissionsQuery,
} = admissionTrashApi;
