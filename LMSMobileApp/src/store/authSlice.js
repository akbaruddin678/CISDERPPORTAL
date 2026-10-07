import { createSlice } from "@reduxjs/toolkit";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { baseApi } from "../services/baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    studentLogin: builder.mutation({
      query: (credentials) => ({
        url: "/lms/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
  }),
});

export const { useStudentLoginMutation } = authApi;

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  },
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;

      // ✅ Cross-Platform Storage
      if (Platform.OS === "web") {
        localStorage.setItem("userToken", token);
        localStorage.setItem("userData", JSON.stringify(user));
      } else {
        SecureStore.setItemAsync("userToken", token);
        SecureStore.setItemAsync("userData", JSON.stringify(user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      if (Platform.OS === "web") {
        localStorage.removeItem("userToken");
        localStorage.removeItem("userData");
      } else {
        SecureStore.deleteItemAsync("userToken");
        SecureStore.deleteItemAsync("userData");
      }
    },
    restoreSession: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = !!action.payload.token;
      state.isLoading = false;
    },
  },
});

export const { setCredentials, logout, restoreSession } = authSlice.actions;
export default authSlice.reducer;
