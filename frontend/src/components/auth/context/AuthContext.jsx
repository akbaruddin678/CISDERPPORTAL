import React, { createContext, useContext, useReducer, useEffect } from "react";
import { authReducer, initialState } from "../services/reducerAuthSerives";
import {
  clearUserData,
  getUserData,
  saveUserData,
} from "../../user/services/localStorageService";
import { baseUrl } from "../../base/baseurl";
import { setActiveCampusId } from "../../../shared/campus/campusRequest";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [authState, authDispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const storedUser = getUserData();
    if (storedUser?.isLogin) {
      authDispatch({ type: "LOGIN", payload: storedUser });
    } else {
      authDispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const dispatchAuthLogin = (loginData) => {
    saveUserData({ ...loginData, isLogin: true });
    authDispatch({
      type: "LOGIN",
      payload: { ...loginData, isLogin: true },
    });
  };

  const dispatchAuthLogout = () => {
    // Best-effort — revokes this device's session server-side so it drops
    // off the admin's "currently logged in" list immediately, but logout
    // must not be blocked by the network call (e.g. server unreachable).
    const token = getUserData()?.token;
    if (token) {
      fetch(`${baseUrl}/api/user/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    clearUserData();
    setActiveCampusId("");
    authDispatch({ type: "LOGOUT" });
  };

  return (
    <AuthContext.Provider
      value={{ ...authState, dispatchAuthLogin, dispatchAuthLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
