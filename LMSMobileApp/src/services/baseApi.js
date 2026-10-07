import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const BASE_URL = "https://api.neiedu.online/api";

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: async (headers) => {
    let token = null;

    if (Platform.OS === "web") {
      token = localStorage.getItem("userToken");
    } else {
      token = await SecureStore.getItemAsync("userToken");
    }

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery,
 
  tagTypes: [
    "Transcripts",
    "Announcements",
    "Events",
    "Finance",
    "User",
    "Timetable", 
    "Datesheet",
    "Courses", 
    "Materials", 
  ],
  endpoints: () => ({}),
});
