import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../Admission/services/getAuthToken";

export const examApi = createApi({
  reducerPath: "examApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Exams", "Catalog", "Metadata"],
  endpoints: (builder) => ({
    // --- METADATA & CATALOGS ---
    getExamMetadata: builder.query({
      query: () => "/exam/metadata",
      providesTags: ["Metadata"],
    }),
    getDepartments: builder.query({
      query: () => "/catalog/departments",
      providesTags: ["Catalog"],
    }),
    // One consistent, pre-scoped snapshot of departments/programs/terms/
    // semesters — departments here are already restricted to ones that
    // actually have a matching-context program, so a Department picked in
    // this list can never cascade into an empty Program dropdown. Used by
    // StudentAcademicHistoryView instead of separately fetching each catalog
    // piece (which left the Department list unscoped).
    getCompleteCatalog: builder.query({
      query: (params) => ({ url: "/catalog/complete", params }),
      providesTags: ["Catalog"],
    }),
    // `arg` is a plain departmentId string everywhere except
    // StudentAcademicHistoryView, which passes { departmentId, context }
    // to scope the list to university-level programs only.
    getPrograms: builder.query({
      query: (arg) => {
        const isScoped = arg && typeof arg === "object";
        const departmentId = isScoped ? arg.departmentId : arg;
        const context = isScoped ? arg.context : undefined;
        return {
          url: "/catalog/programs",
          params: { departmentId, context },
        };
      },
      providesTags: ["Catalog"],
    }),
    getSemesters: builder.query({
      query: () => "/catalog/semesters",
      providesTags: ["Catalog"],
    }),
    // `params` is undefined everywhere except StudentAcademicHistoryView,
    // which passes { excludeLevel: "HSSC" } to scope the term list to
    // university sessions only (same pattern as HOD Course Allocation).
    getTerms: builder.query({
      query: (params) => ({ url: "/catalog/terms", params }),
      providesTags: ["Catalog"],
    }),

    // --- COURSE FETCHING ---
    getCoursesBySemester: builder.query({
      query: ({ semesterId, programId, termId }) => ({
        url: "/course/assignment",
        params: { semesterId, programId, termId },
      }),
      transformResponse: (response) => {
        const assignments = response?.data || [];
        const uniqueCourses = [];
        const seenIds = new Set();
        assignments.forEach((assign) => {
          const course = assign.courseId;
          if (course && course._id) {
            const idStr = String(course._id);
            if (!seenIds.has(idStr)) {
              seenIds.add(idStr);
              uniqueCourses.push(course);
            }
          }
        });
        return { data: uniqueCourses };
      },
      providesTags: ["Catalog"],
    }),

    // --- EXAM MANAGEMENT ---
    getExams: builder.query({
      query: ({ termId, departmentId, programId, semesterId }) => ({
        url: "/exam/management/list",
        params: { termId, departmentId, programId, semesterId },
      }),
      providesTags: ["Exams"],
    }),
    // Bulk create/update a semester's exam plan (one row per course + exam
    // type) as DRAFT or SCHEDULED — never publishes directly.
    saveExamPlan: builder.mutation({
      query: (payload) => ({
        url: "/exam/management/plan",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Exams"],
    }),
    // Locks DRAFT/SCHEDULED exams to PUBLISHED — this is what makes them
    // visible on the teacher side.
    publishExams: builder.mutation({
      query: (payload) => ({
        url: "/exam/management/publish",
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["Exams"],
    }),
    updateExam: builder.mutation({
      query: ({ id, data }) => ({
        url: `/exam/management/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Exams"],
    }),
    deleteExam: builder.mutation({
      query: (id) => ({
        url: `/exam/management/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Exams"],
    }),

    // --- ADMIT CARDS ---
    // Preview of every student eligible for a given Session/Program/
    // Semester/Exam-Round combo, with each student's own current-semester
    // fee status and whether they already have a card — feeds the
    // single-or-bulk generation table.
    getEligibleStudentsForAdmitCards: builder.query({
      query: (params) => ({
        url: "/exam/management/admit-cards/eligible",
        params,
      }),
      providesTags: ["Exams"],
    }),
    getAdmitCards: builder.query({
      query: (params) => ({
        url: "/exam/management/admit-cards",
        params,
      }),
      providesTags: ["Exams"],
    }),
    generateBulkAdmitCards: builder.mutation({
      query: (payload) => ({
        url: "/exam/management/admit-cards/generate",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Exams"],
    }),
    revokeAdmitCard: builder.mutation({
      query: (id) => ({
        url: `/exam/management/admit-cards/${id}/revoke`,
        method: "PATCH",
      }),
      invalidatesTags: ["Exams"],
    }),

    // ==========================================
    // MARKS & RESULTS (UPDATED URLS)
    // ==========================================

    // Plain course roster (with attendance status) — used by the UFM and
    // Re-evaluation modules to pick a target student.
    getCourseStudents: builder.query({
      query: (params) => ({
        url: "/exam/marks/students",
        params,
      }),
      providesTags: ["Exams"],
    }),
    getExamsForCourse: builder.query({
      query: (params) => ({
        url: "/exam/marks/exams-for-course",
        params,
      }),
      providesTags: ["Exams"],
    }),
    getCourseExamRoster: builder.query({
      query: (params) => ({
        url: "/exam/marks/exam-roster",
        params,
      }),
      providesTags: ["Exams"],
    }),
    manualUploadExamMarks: builder.mutation({
      query: (payload) => ({
        url: "/exam/marks/manual-upload",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Exams"],
    }),
    getBatchCourses: builder.query({
      query: (params) => ({
        url: "/exam/marks/courses",
        params,
      }),
      providesTags: ["Catalog", "Exams"],
    }),
    getExamResults: builder.query({
      query: (params) => ({
        url: "/exam/marks/results",
        params,
      }),
      providesTags: ["Exams"],
    }),

    getMarkConfig: builder.query({
      query: (params) => ({
        url: "/exam/marks/config",
        params,
      }),
      providesTags: ["Exams"],
    }),
    saveMarkConfig: builder.mutation({
      query: (payload) => ({
        url: "/exam/marks/config",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Exams"],
    }),


    // ==========================================
    // POST-EXAM: UFM & RE-EVALUATIONS
    // ==========================================
    getUfmReports: builder.query({
      query: () => "/exam/post-exam/ufm",
      providesTags: ["Exams"],
    }),
    // ✅ ADDED: Create UFM Report manually for testing
    createUfmReportManual: builder.mutation({
      query: (payload) => ({
        url: "/exam/post-exam/ufm",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Exams"],
    }),
    updateUfmReport: builder.mutation({
      query: ({ id, data }) => ({
        url: `/exam/post-exam/ufm/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Exams"],
    }),
    // ✅ ADDED: Delete UFM Report for testing cleanup
    deleteUfmReport: builder.mutation({
      query: (id) => ({
        url: `/exam/post-exam/ufm/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Exams"],
    }),

    getReEvaluations: builder.query({
      query: () => "/exam/post-exam/appeals",
      providesTags: ["Exams"],
    }),
    updateReEvaluation: builder.mutation({
      query: ({ id, data }) => ({
        url: `/exam/post-exam/appeals/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Exams"],
    }),

    getDateSheet: builder.query({
      query: (params) => ({
        url: "/exam/datesheet",
        params,
      }),
      providesTags: ["Exams"],
    }),

    // --- DASHBOARD ---
    getDashboardStats: builder.query({
      query: () => "/exam/management/dashboard-stats",
      providesTags: ["Exams"],
    }),

    // Which semesters of a program actually have an active student right
    // now — Create Exam's Semester picker uses this to disable a semester
    // nobody is enrolled in.
    getSemestersWithActiveStudents: builder.query({
      query: (programId) => ({
        url: "/exam/management/semesters-with-active-students",
        params: { programId },
      }),
      providesTags: ["Catalog"],
    }),

    // --- ATTENDANCE (Exam-Cell entry side) ---
    getAttendanceRoster: builder.query({
      query: (params) => ({
        url: "/exam/conduction/attendance/roster",
        params,
      }),
      providesTags: ["Exams"],
    }),
    saveAttendance: builder.mutation({
      query: (payload) => ({
        url: "/exam/conduction/attendance/save",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Exams"],
    }),
    submitAttendanceForReview: builder.mutation({
      query: (payload) => ({
        url: "/exam/conduction/attendance/submit",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Exams"],
    }),
  }),
});

export const {
  useGetExamMetadataQuery,
  useGetDepartmentsQuery,
  useGetCompleteCatalogQuery,
  useGetProgramsQuery,
  useLazyGetProgramsQuery,
  useGetSemestersQuery,
  useGetTermsQuery,
  useGetCoursesBySemesterQuery,
  useGetExamsQuery,
  useSaveExamPlanMutation,
  usePublishExamsMutation,
  useUpdateExamMutation,
  useDeleteExamMutation,
  useGetDateSheetQuery,
  useLazyGetDateSheetQuery,
  useGetEligibleStudentsForAdmitCardsQuery,
  useGetAdmitCardsQuery,
  useGenerateBulkAdmitCardsMutation,
  useRevokeAdmitCardMutation,
  useGetCourseStudentsQuery,
  useGetExamsForCourseQuery,
  useGetCourseExamRosterQuery,
  useManualUploadExamMarksMutation,
  useGetBatchCoursesQuery,
  useGetExamResultsQuery,
  useGetMarkConfigQuery,
  useSaveMarkConfigMutation,

  useGetUfmReportsQuery,
  useCreateUfmReportManualMutation, 
  useUpdateUfmReportMutation,
  useDeleteUfmReportMutation, 

  useGetReEvaluationsQuery,
  useUpdateReEvaluationMutation,

  useGetDashboardStatsQuery,
  useGetSemestersWithActiveStudentsQuery,

  useGetAttendanceRosterQuery,
  useSaveAttendanceMutation,
  useSubmitAttendanceForReviewMutation,
} = examApi;
