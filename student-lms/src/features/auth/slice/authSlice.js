import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: JSON.parse(localStorage.getItem("lms_user")) || null,
    token: localStorage.getItem("lms_token") || null,
    isAuthenticated: !!localStorage.getItem("lms_token"),
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem("lms_user", JSON.stringify(action.payload.user));
      localStorage.setItem("lms_token", action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("lms_user");
      localStorage.removeItem("lms_token");
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
