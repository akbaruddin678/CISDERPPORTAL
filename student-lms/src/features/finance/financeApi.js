import { baseApi } from "../../services/baseApi";

export const financeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyChallans: builder.query({
      // ✅ Completely updated URL. It no longer needs the ID passed!
      query: () => `/lms/finance/my-challans`,
      providesTags: ["Finance"],
    }),
  }),
});

export const { useGetMyChallansQuery } = financeApi;
