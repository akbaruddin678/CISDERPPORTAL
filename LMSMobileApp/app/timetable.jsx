import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Calendar, Clock, MapPin } from "lucide-react-native";
import { useGetMyTimetableQuery } from "../src/services/lmsApi";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function TimetableScreen() {
  const { data: scheduleRes, isLoading } = useGetMyTimetableQuery();
  const schedule = scheduleRes?.data || {};

  if (isLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{ title: "Class Timetable", headerShadowVisible: false }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {daysOfWeek.map((day) => {
          const classes = schedule[day] || [];
          return (
            <View key={day} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Calendar size={18} color="#16a34a" />
                <Text style={styles.dayTitle}>{day}</Text>
              </View>
              <View style={styles.classesList}>
                {classes.length === 0 ? (
                  <Text style={styles.emptyText}>No classes scheduled.</Text>
                ) : (
                  classes.map((cls, idx) => (
                    <View key={idx} style={styles.classRow}>
                      <View style={styles.timeBlock}>
                        <Text style={styles.timeText}>{cls.time}</Text>
                      </View>
                      <View style={styles.classDetails}>
                        <Text style={styles.courseName}>{cls.course}</Text>
                        <View style={styles.metaRow}>
                          <Text style={styles.typeBadge}>{cls.type}</Text>
                          <Text style={styles.roomText}>
                            <MapPin size={10} color="#64748b" />{" "}
                            {cls.room || "TBA"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 16 },

  dayCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0fdf4",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#dcfce3",
  },
  dayTitle: { fontSize: 16, fontWeight: "800", color: "#166534" },

  classesList: { padding: 16 },
  emptyText: { fontSize: 13, color: "#94a3b8", fontStyle: "italic" },

  classRow: {
    flexDirection: "row",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  timeBlock: {
    width: 70,
    borderRightWidth: 2,
    borderRightColor: "#e2e8f0",
    paddingRight: 10,
    marginRight: 10,
    justifyContent: "center",
  },
  timeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    textAlign: "right",
  },

  classDetails: { flex: 1 },
  courseName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  typeBadge: {
    fontSize: 9,
    fontWeight: "800",
    color: "#2563eb",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: "uppercase",
  },
  roomText: { fontSize: 11, color: "#64748b", fontWeight: "600" },
});
