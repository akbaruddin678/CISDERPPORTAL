import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../../Admin/Admission/services/getAuthToken";

export const accountantstudentApi = createApi({
  reducerPath: "accountantstudentApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Students", "StudentInstallments"],
  endpoints: (builder) => ({
    // ✅ Get all students with filters
    getStudents: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            params.append(key, value);
          }
        });
        return `/api/account/students/?${params.toString()}`;
      },
      providesTags: ["Students"],
    }),

    // ✅ Get students for challan generation
    getStudentsForChallan: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            params.append(key, value);
          }
        });
        const queryString = params.toString();
        return queryString
          ? `/api/account/students/for-challan?${queryString}`
          : "/api/account/students/for-challan";
      },
      providesTags: ["Students"],
    }),

    // ✅ Get students by program
    getStudentsByProgram: builder.query({
      query: (programId) => `/api/account/students/program/${programId}`,
      providesTags: ["Students"],
    }),

    // ✅ Get student academic info
    getStudentAcademicInfo: builder.query({
      query: (studentId) => `/api/account/students/${studentId}/academic-info`,
      providesTags: ["Students"],
    }),

    // ✅ Validate students for challan
    validateStudentsForChallan: builder.mutation({
      query: (validationData) => ({
        url: "/api/account/students/validate-for-challan",
        method: "POST",
        body: validationData,
      }),
    }),

    // ✅ Mark a new admission as reviewed/completed
    updateAdmissionReviewStatus: builder.mutation({
      query: ({ studentId, completed }) => ({
        url: `/api/account/students/${studentId}/admission-review-status`,
        method: "PATCH",
        body: { completed },
      }),
      invalidatesTags: ["Students"],
    }),

    // ✅ Get student details
    getStudentDetails: builder.query({
      query: (studentId) => `/api/account/students/${studentId}`,
      providesTags: ["Students"],
    }),

    // ✅ Get all students (simple endpoint)
    getAllStudents: builder.query({
      query: () => "/api/account/students/",
      providesTags: ["Students"],
    }),

    // ✅ Get students for installment assignment
    getStudentsForInstallmentAssignment: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            params.append(key, value);
          }
        });
        return `/api/account/students/for-installment-assignment?${params.toString()}`;
      },
      providesTags: ["Students"],
    }),

    // ✅ Get students by department name
    getStudentsByDepartmentName: builder.query({
      query: (deptName) =>
        `/api/student/by-department?deptName=${encodeURIComponent(deptName)}`,
      providesTags: ["Students"],
    }),

    // ✅ Batch Challan/Payment status (Not Generated/Pending/Paid/Overdue)
    // for a set of student IDs — shared by the Admission module's own list
    // and the accountant's "New Admission" list.
    getChallanStatusBatch: builder.query({
      query: (studentIds = []) =>
        `/api/account/students/challan-status?studentIds=${studentIds.join(",")}`,
      providesTags: ["Students"],
    }),

    // Same as above, but scoped to only each student's admission-fee
    // challan — used by the Admission Process pipeline, where "Fee Paid"
    // must mean the admission fee itself was paid, not that every challan
    // the student has (tuition, exam, etc.) happens to be paid too.
    getAdmissionChallanStatusBatch: builder.query({
      query: (studentIds = []) =>
        `/api/account/students/admission-challan-status?studentIds=${studentIds.join(",")}`,
      providesTags: ["Students"],
    }),

    // ✅ Manually re-admit a student previously auto-cancelled for
    // non-payment — reactivates the same record.
    reAdmitStudent: builder.mutation({
      query: (studentId) => ({
        url: `/api/account/students/${studentId}/re-admit`,
        method: "PATCH",
      }),
      invalidatesTags: ["Students"],
    }),

    // Batch "active scholarship" lookup (hasScholarship + scholarshipName)
    // for a set of student IDs — powers the Student Directory export's
    // Scholarship columns and its "scholarship students only" filter.
    getScholarshipStatusBatch: builder.query({
      query: (studentIds = []) =>
        `/api/account/students/scholarship-status?studentIds=${studentIds.join(",")}`,
      providesTags: ["Students"],
    }),

    // ✅ College vs University new-admission challan breakdown + how many
    // arrived in the last 2 days — powers the dashboard widget and the
    // simplified summary cards on the New Admissions screen.
    getNewAdmissionsSummary: builder.query({
      query: () => "/api/account/students/new-admissions-summary",
      providesTags: ["Students"],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useLazyGetStudentsQuery,
  useGetStudentsForChallanQuery,
  useLazyGetStudentsForChallanQuery,
  useGetStudentsByProgramQuery,
  useGetStudentAcademicInfoQuery,
  useValidateStudentsForChallanMutation,
  useUpdateAdmissionReviewStatusMutation,
  useGetStudentDetailsQuery,
  useGetAllStudentsQuery,
  useLazyGetAllStudentsQuery,
  useGetStudentsForInstallmentAssignmentQuery,
  useLazyGetStudentsForInstallmentAssignmentQuery,
  useGetStudentsByDepartmentNameQuery,
  useLazyGetStudentsByDepartmentNameQuery,
  useGetChallanStatusBatchQuery,
  useLazyGetChallanStatusBatchQuery,
  useGetAdmissionChallanStatusBatchQuery,
  useGetScholarshipStatusBatchQuery,
  useLazyGetScholarshipStatusBatchQuery,
  useReAdmitStudentMutation,
  useGetNewAdmissionsSummaryQuery,
} = accountantstudentApi;
