// src/store/api/endpoints/semesterEndpoints.js
export const semesterEndpoints = (builder) => ({
    // POST /admin/create-semester
    createSemester: builder.mutation({
      query: ({ number, departmentId }) => ({
        url: "/create-semester",
        method: "POST",
        body: { number, departmentId },
      }),
      // semester creation affects semester list and possibly departments listing
      invalidatesTags: [
        { type: "Semesters", id: "LIST" },
        { type: "Departments", id: "LIST" },
      ],
    }),
  });
  