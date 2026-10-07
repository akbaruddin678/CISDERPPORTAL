export const termEndpoints = (builder) => ({
  getAllTerms: builder.query({
    query: () => "/catalog/terms",
    providesTags: ["Terms"],
  }),
  getActiveTerms: builder.query({
    query: () => "/catalog/terms/active",
    providesTags: ["Terms"],
  }),
  createTerm: builder.mutation({
    query: (data) => ({
      url: "/catalog/terms",
      method: "POST",
      body: data,
    }),
    invalidatesTags: ["Terms"],
  }),
  updateTerm: builder.mutation({
    query: ({ id, ...data }) => ({
      url: `/catalog/terms/${id}`,
      method: "PUT",
      body: data,
    }),
    invalidatesTags: ["Terms"],
  }),
  toggleTermStatus: builder.mutation({
    query: (id) => ({
      url: `/catalog/terms/${id}/toggle-status`,
      method: "PATCH",
    }),
    invalidatesTags: ["Terms"],
  }),
  deleteTerm: builder.mutation({
    query: (id) => ({
      url: `/catalog/terms/${id}`,
      method: "DELETE",
    }),
    invalidatesTags: ["Terms"],
  }),
});
