import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../../Admin/Admission/services/getAuthToken";

export const feeStructureApi = createApi({
  reducerPath: "feeStructureApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/account`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: [
    "FeeHeads",
    "AcademicFees",
    "BasicFees",
    "AdmissionFees",
    "ReAdmissionFees",
    "ExamFees",
    "MiscFees",
    "StudentFees", // ✅ NEW TAG
  ],

  endpoints: (builder) => ({
    // ============================================================
    //  EXISTING GENERAL FEE STRUCTURES (Prefix: fee-structures/)
    // ============================================================

    // 1. HEADS
    getFeeHeads: builder.query({
      query: (params) => ({ url: "fee-structures/heads", params }),
      providesTags: ["FeeHeads"],
    }),

    // 2. ACADEMIC
    getAcademicFees: builder.query({
      query: (params) => ({ url: "fee-structures/academic", params }),
      providesTags: ["AcademicFees"],
    }),
    createAcademicFee: builder.mutation({
      query: (body) => ({
        url: "fee-structures/academic",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AcademicFees"],
    }),
    updateAcademicFee: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `fee-structures/academic/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["AcademicFees"],
    }),
    deleteAcademicFee: builder.mutation({
      query: (id) => ({
        url: `fee-structures/academic/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AcademicFees"],
    }),

    // 2B. BASIC (Per-Semester Baseline)
    getBasicFees: builder.query({
      query: (params) => ({ url: "fee-structures/basic", params }),
      providesTags: ["BasicFees"],
    }),
    createBasicFee: builder.mutation({
      query: (body) => ({
        url: "fee-structures/basic",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BasicFees"],
    }),
    updateBasicFee: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `fee-structures/basic/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["BasicFees"],
    }),
    deleteBasicFee: builder.mutation({
      query: (id) => ({
        url: `fee-structures/basic/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BasicFees"],
    }),

    // 3. ADMISSION
    getAdmissionFees: builder.query({
      query: (params) => ({ url: "fee-structures/admission", params }),
      providesTags: ["AdmissionFees"],
    }),
    createAdmissionFee: builder.mutation({
      query: (body) => ({
        url: "fee-structures/admission",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdmissionFees"],
    }),
    updateAdmissionFee: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `fee-structures/admission/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["AdmissionFees"],
    }),
    deleteAdmissionFee: builder.mutation({
      query: (id) => ({
        url: `fee-structures/admission/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdmissionFees"],
    }),

    // 4. RE-ADMISSION
    getReAdmissionFees: builder.query({
      query: (params) => ({ url: "fee-structures/readmission", params }),
      providesTags: ["ReAdmissionFees"],
    }),
    createReAdmissionFee: builder.mutation({
      query: (body) => ({
        url: "fee-structures/readmission",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ReAdmissionFees"],
    }),
    updateReAdmissionFee: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `fee-structures/readmission/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ReAdmissionFees"],
    }),
    deleteReAdmissionFee: builder.mutation({
      query: (id) => ({
        url: `fee-structures/readmission/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ReAdmissionFees"],
    }),

    // 5. EXAM
    getExamFees: builder.query({
      query: (params) => ({ url: "fee-structures/exam", params }),
      providesTags: ["ExamFees"],
    }),
    createExamFee: builder.mutation({
      query: (body) => ({ url: "fee-structures/exam", method: "POST", body }),
      invalidatesTags: ["ExamFees"],
    }),
    updateExamFee: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `fee-structures/exam/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ExamFees"],
    }),
    deleteExamFee: builder.mutation({
      query: (id) => ({ url: `fee-structures/exam/${id}`, method: "DELETE" }),
      invalidatesTags: ["ExamFees"],
    }),

    // 6. MISC
    getMiscellaneousFees: builder.query({
      query: () => "fee-structures/misc",
      providesTags: ["MiscFees"],
    }),
    createMiscellaneousFee: builder.mutation({
      query: (body) => ({ url: "fee-structures/misc", method: "POST", body }),
      invalidatesTags: ["MiscFees"],
    }),
    deleteMiscellaneousFee: builder.mutation({
      query: (id) => ({ url: `fee-structures/misc/${id}`, method: "DELETE" }),
      invalidatesTags: ["MiscFees"],
    }),

    // ============================================================
    // ✅ 7. STUDENT SPECIFIC FEES (Prefix: student-fees/)
    // ============================================================

    // Get fees for a specific student
    getStudentFees: builder.query({
      query: (studentId) => `student-fees/${studentId}`,
      providesTags: ["StudentFees"],
    }),

    // Create or Update (Upsert) fee for a student
    upsertStudentFee: builder.mutation({
      query: (body) => ({
        url: "student-fees",
        method: "POST",
        body,
      }),
      invalidatesTags: ["StudentFees"],
    }),

    bulkCreateStudentFee: builder.mutation({
      query: (body) => ({
        url: "student-fees/bulk", // Matches backend route
        method: "POST",
        body,
      }),
      invalidatesTags: ["StudentFees"],
    }),

    // Delete a specific student fee record
    deleteStudentFee: builder.mutation({
      query: (id) => ({
        url: `student-fees/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["StudentFees"],
    }),

    // Permanently tags a legacy (untagged) fee record with its real
    // semester, confirmed by staff — see backend StudentFeeService.assignSemester.
    assignFeeSemester: builder.mutation({
      query: ({ id, semesterId }) => ({
        url: `student-fees/${id}/assign-semester`,
        method: "PATCH",
        body: { semesterId },
      }),
      invalidatesTags: ["StudentFees"],
    }),
  }),
});

export const {
  // Existing
  useGetFeeHeadsQuery,
  useGetAcademicFeesQuery,
  useCreateAcademicFeeMutation,
  useUpdateAcademicFeeMutation,
  useDeleteAcademicFeeMutation,
  useGetBasicFeesQuery,
  useCreateBasicFeeMutation,
  useUpdateBasicFeeMutation,
  useDeleteBasicFeeMutation,
  useGetAdmissionFeesQuery,
  useCreateAdmissionFeeMutation,
  useUpdateAdmissionFeeMutation,
  useDeleteAdmissionFeeMutation,
  useGetReAdmissionFeesQuery,
  useCreateReAdmissionFeeMutation,
  useUpdateReAdmissionFeeMutation,
  useDeleteReAdmissionFeeMutation,
  useGetExamFeesQuery,
  useCreateExamFeeMutation,
  useUpdateExamFeeMutation,
  useDeleteExamFeeMutation,
  useGetMiscellaneousFeesQuery,
  useCreateMiscellaneousFeeMutation,
  useDeleteMiscellaneousFeeMutation,

  // ✅ New Student Specific Hooks
  useGetStudentFeesQuery,
  useUpsertStudentFeeMutation,
  useDeleteStudentFeeMutation,
  useBulkCreateStudentFeeMutation,
  useAssignFeeSemesterMutation,
} = feeStructureApi;
