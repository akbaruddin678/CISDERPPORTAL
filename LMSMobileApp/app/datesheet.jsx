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
import { CalendarDays, Clock, Hourglass } from "lucide-react-native";
import { useGetMyDateSheetQuery } from "../src/services/lmsApi";

export default function DatesheetScreen() {
  const { data: datesheetRes, isLoading } = useGetMyDateSheetQuery();
  const exams = datesheetRes?.data || [];

  if (isLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{ title: "Date Sheet", headerShadowVisible: false }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {exams.length === 0 ? (
          <View style={styles.emptyState}>
            <CalendarDays size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Exams Scheduled</Text>
            <Text style={styles.emptySub}>
              Your date sheet has not been published yet.
            </Text>
          </View>
        ) : (
          exams.map((exam) => {
            const examDate = new Date(exam.date);
            return (
              <View key={exam._id} style={styles.examCard}>
                <View style={styles.dateBlock}>
                  <Text style={styles.dateMonth}>
                    {examDate.toLocaleDateString("en-US", { month: "short" })}
                  </Text>
                  <Text style={styles.dateDay}>{examDate.getDate()}</Text>
                  <Text style={styles.dateWeekday}>
                    {examDate.toLocaleDateString("en-US", { weekday: "short" })}
                  </Text>
                </View>

                <View style={styles.examDetails}>
                  <View style={styles.tagWrap}>
                    <Text style={styles.tagText}>{exam.type}</Text>
                  </View>
                  <Text style={styles.courseTitle}>{exam.courseId?.title}</Text>
                  <Text style={styles.courseCode}>{exam.courseId?.code}</Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Clock size={14} color="#64748b" />
                      <Text style={styles.metaText}>
                        {exam.startTime || "TBA"}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Hourglass size={14} color="#64748b" />
                      <Text style={styles.metaText}>{exam.duration} mins</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 16 },
  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 12,
  },
  emptySub: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginTop: 4,
  },

  examCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
  },
  dateBlock: {
    width: 80,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#fee2e2",
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ef4444",
    textTransform: "uppercase",
  },
  dateDay: {
    fontSize: 28,
    fontWeight: "900",
    color: "#991b1b",
    marginVertical: -2,
  },
  dateWeekday: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ef4444",
    textTransform: "uppercase",
  },

  examDetails: { flex: 1, padding: 16 },
  tagWrap: {
    backgroundColor: "#f1f5f9",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
  },
  courseTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  courseCode: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    marginTop: 2,
    marginBottom: 10,
  },

  metaRow: {
    flexDirection: "row",
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontWeight: "600", color: "#475569" },
});
