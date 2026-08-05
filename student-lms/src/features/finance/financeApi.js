import { baseApi } from "../../services/baseApi";

export const financeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyChallans: builder.query({
      // ✅ Completely updated URL. It no longer needs the ID passed!
      query: () => `/lms/finance/my-challans`,
      providesTags: ["Finance"],
    }),
    getMyInstallmentPlan: builder.query({
      query: () => `/lms/finance/my-installments`,
      providesTags: ["Finance"],
    }),
  }),
});

export const { useGetMyChallansQuery, useGetMyInstallmentPlanQuery } =
  financeApi;
