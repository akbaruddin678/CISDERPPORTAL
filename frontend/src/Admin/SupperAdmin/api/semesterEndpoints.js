export const semesterEndpoints = (builder) => ({
  getAllSemesters: builder.query({
    query: () => "/catalog/semesters",
    providesTags: ["Semesters"],
  }),
  getSemestersByProgram: builder.query({
    query: (programId) => `/catalog/semesters/program/${programId}`,
    providesTags: ["Semesters"],
  }),
  // What still uses a semester (students, history, fees...) and whether it can
  // be deleted — drives the Delete button state inside the semester modal.
  getSemesterUsage: builder.query({
    query: (id) => `/catalog/semesters/${id}/usage`,
    providesTags: ["Semesters"],
  }),
  createSemester: builder.mutation({
    query: (data) => ({
      url: "/catalog/semesters",
      method: "POST",
      body: data,
    }),
    invalidatesTags: ["Semesters"],
  }),
  updateSemester: builder.mutation({
    query: ({ id, ...data }) => ({
      url: `/catalog/semesters/${id}`,
      method: "PUT",
      body: data,
    }),
    invalidatesTags: ["Semesters"],
  }),
  toggleSemesterStatus: builder.mutation({
    query: (id) => ({
      url: `/catalog/semesters/${id}/toggle-status`,
      method: "PATCH",
    }),
    invalidatesTags: ["Semesters"],
  }),
  deleteSemester: builder.mutation({
    query: (id) => ({
      url: `/catalog/semesters/${id}`,
      method: "DELETE",
    }),
    invalidatesTags: ["Semesters", "Programs"],
  }),
});
