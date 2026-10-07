export const departmentEndpoints = (builder) => ({
  getAllDepartments: builder.query({
    query: () => "/catalog/departments",
    providesTags: ["Departments"],
  }),
  getDepartmentById: builder.query({
    query: (id) => `/catalog/departments/${id}`,
    providesTags: ["Departments"],
  }),
  createDepartment: builder.mutation({
    query: (data) => ({
      url: "/catalog/departments",
      method: "POST",
      body: data,
    }),
    invalidatesTags: ["Departments"],
  }),
  updateDepartment: builder.mutation({
    query: ({ id, ...data }) => ({
      url: `/catalog/departments/${id}`,
      method: "PUT",
      body: data,
    }),
    invalidatesTags: ["Departments"],
  }),
  deleteDepartment: builder.mutation({
    query: (id) => ({
      url: `/catalog/departments/${id}`,
      method: "DELETE",
    }),
    invalidatesTags: ["Departments"],
  }),
});
