import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../../Admin/Admission/services/getAuthToken";

export const fineManagementApi = createApi({
  reducerPath: 'fineManagementApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/api/account/fines`, 
    prepareHeaders: (headers) => {
      const token = getAuthToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Fines', 'OverdueChallans'],
  endpoints: (builder) => ({
    // Apply fine to challan
    applyFineToChallan: builder.mutation({
      query: ({ id, ...fineData }) => ({
        url: `/challans/${id}/apply-fine`,
        method: 'POST',
        body: fineData,
      }),
      invalidatesTags: ['Fines'],
    }),

    // Get overdue challans
    getOverdueChallans: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            params.append(key, value);
          }
        });
        const queryString = params.toString();
        return queryString ? `/overdue?${queryString}` : '/overdue';
      },
      providesTags: ['OverdueChallans'],
    }),

    // Process overdue challans
    processOverdueChallans: builder.mutation({
      query: () => ({
        url: '/process-overdue',
        method: 'POST',
      }),
      invalidatesTags: ['OverdueChallans', 'Fines'],
    }),
  }),
});

export const {
  useApplyFineToChallanMutation,
  useGetOverdueChallansQuery,
  useLazyGetOverdueChallansQuery,
  useProcessOverdueChallansMutation,
} = fineManagementApi;