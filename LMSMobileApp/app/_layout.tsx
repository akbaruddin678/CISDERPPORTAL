import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { Provider, useSelector, useDispatch } from "react-redux";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { store } from "../src/store/store";
import { restoreSession } from "../src/store/authSlice";

function RootNavigator() {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);
  const segments = useSegments();
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const checkLoginState = async () => {
      try {
        let token = null;
        let userData = null;

        // ✅ Cross-Platform Retrieval
        if (Platform.OS === "web") {
          token = localStorage.getItem("userToken");
          userData = localStorage.getItem("userData");
        } else {
          token = await SecureStore.getItemAsync("userToken");
          userData = await SecureStore.getItemAsync("userData");
        }

        if (token && userData) {
          dispatch(restoreSession({ token, user: JSON.parse(userData) }));
        } else {
          dispatch(restoreSession({ token: null, user: null }));
        }
      } catch (e) {
        dispatch(restoreSession({ token: null, user: null }));
      }
    };
    checkLoginState();
  }, [dispatch]);

  useEffect(() => {
    if (isLoading) return;

    const inTabsGroup = segments[0] === "(tabs)";

    if (!isAuthenticated && inTabsGroup) {
      router.replace("/");
    } else if (isAuthenticated && !inTabsGroup) {
      router.replace("/(tabs)/dashboard");
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "Login" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootNavigator />
    </Provider>
  );
}
