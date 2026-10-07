import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../../components/user-admission/services/getAuthToken";

export const useradminApi = createApi({
  reducerPath: "useradminApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api`,
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["User"],
  endpoints: (builder) => ({
    // Register applicant (public)
    registerApplicant: builder.mutation({
      query: (userData) => ({
        url: `/user/register-applicant`,
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["User"],
    }),

    // Create Staff (Admin Protected - Direct Creation)
    createStaffUser: builder.mutation({
      query: (userData) => ({
        url: `/admin/staff`,
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["User"],
    }),

    login: builder.mutation({
      query: (credentials) => ({
        url: `/user/login`,
        method: "POST",
        body: credentials,
      }),
    }),

    getUserById: builder.query({
      query: (id) => `/user/${id}`,
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),

    // Update user (Includes Status update)
    updateUser: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/user/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "User", id },
        "User", // Invalidate list
      ],
    }),

    // Delete User
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/user/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),

    createUserByAdmin: builder.mutation({
      query: (userData) => ({
        url: `/user/admin/create`,
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["User"],
    }),

    getUsersByRoles: builder.query({
     
      query: ({ roles, page, limit, search }) => ({
        url: `/user/by-roles`,
        method: "POST",
        body: { roles, page, limit, search },
      }),
      providesTags: ["User"],
    }),
  }),
});

export const {
  useRegisterApplicantMutation,
  useCreateStaffUserMutation,
  useLoginMutation,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetUsersByRolesQuery,
  useCreateUserByAdminMutation,
} = useradminApi;
