// features/admin/api/courseEndpoints.js
export const courseEndpoints = (builder) => ({
  // 1. Get All Courses
  getAllCourses: builder.query({
    query: () => ({
      url: "/course/management", // Matches your backend route
      method: "GET",
    }),
    providesTags: ["Courses"],
  }),

  // 2. Create Course
  createCourse: builder.mutation({
    query: (courseData) => ({
      url: "/course/management",
      method: "POST",
      body: courseData,
    }),
    invalidatesTags: ["Courses"],
  }),

  // 3. Update Course
  updateCourse: builder.mutation({
    query: ({ id, ...data }) => ({
      url: `/course/management/${id}`,
      method: "PUT",
      body: data,
    }),
    invalidatesTags: ["Courses"],
  }),

  // 4. Delete Course
  deleteCourse: builder.mutation({
    query: (id) => ({
      url: `/course/management/${id}`,
      method: "DELETE",
    }),
    invalidatesTags: ["Courses"],
  }),
});
