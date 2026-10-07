export const courseAssignmentEndpoints = (builder) => ({
  // Get Assignments (Filtered by term and program)
  getCourseAssignments: builder.query({
    query: ({ termId, programId }) => ({
      url: `/course/courseassign`,
      method: "GET",
      params: { termId, programId },
    }),
    providesTags: ["CourseAssignments"],
  }),

  // Assign a Course to a Session
  assignCourse: builder.mutation({
    query: (data) => ({
      url: `/course/courseassign`,
      method: "POST",
      body: data,
    }),
    invalidatesTags: ["CourseAssignments"],
  }),

  bulkAssignCourses: builder.mutation({
    query: (assignmentsArray) => ({
      url: `/course/courseassign/bulk`,
      method: "POST",
      body: { assignments: assignmentsArray },
    }),
    invalidatesTags: ["CourseAssignments"],
  }),

  // Remove Assignment
  deleteCourseAssignment: builder.mutation({
    query: (id) => ({
      url: `/course/courseassign/${id}`,
      method: "DELETE",
    }),
    invalidatesTags: ["CourseAssignments"],
  }),
});
