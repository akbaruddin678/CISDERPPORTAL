export const programEndpoints = (builder) => ({
  getAllPrograms: builder.query({
    query: () => "/catalog/programs",
    providesTags: ["Programs"],
  }),
  getProgramsByDepartment: builder.query({
    query: (departmentId) => `/catalog/programs/department/${departmentId}`,
    providesTags: ["Programs"],
  }),
  createProgram: builder.mutation({
    query: (data) => ({
      url: "/catalog/programs",
      method: "POST",
      body: data,
    }),
    invalidatesTags: ["Programs", "Semesters"],
  }),
  updateProgram: builder.mutation({
    query: ({ id, ...data }) => ({
      url: `/catalog/programs/${id}`,
      method: "PUT",
      body: data,
    }),
    invalidatesTags: ["Programs", "Semesters"],
  }),
  toggleProgramStatus: builder.mutation({
    query: (id) => ({
      url: `/catalog/programs/${id}/toggle-status`,
      method: "PATCH",
    }),
    invalidatesTags: ["Programs"],
  }),
  deleteProgram: builder.mutation({
    query: (id) => ({
      url: `/catalog/programs/${id}`,
      method: "DELETE",
    }),
    invalidatesTags: ["Programs", "Semesters"],
  }),
});
