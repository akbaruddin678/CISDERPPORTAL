import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react-native";
import { useGetMyTranscriptsQuery } from "../src/services/lmsApi";

const gradePoints = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  D: 1.0,
  F: 0.0,
};

export default function TranscriptsScreen() {
  const { data: transcriptRes, isLoading } = useGetMyTranscriptsQuery();
  const records = transcriptRes?.data || [];

  const { groupedRecords, totalCredits, cgpa } = useMemo(() => {
    const groups = {};
    let totalPoints = 0;
    let totalGradedCredits = 0;
    let earnedCredits = 0;

    records.forEach((record) => {
      const termName = record.termId?.name || "Unknown Term";
      const semNumber = record.semesterId?.number || "?";
      const groupKey = `${termName} - Semester ${semNumber}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          term: termName,
          semester: semNumber,
          courses: [],
          termGpa: 0,
          termCredits: 0,
          termPoints: 0,
        };
      }
      groups[groupKey].courses.push(record);
      const credits = record.courseId?.creditHours?.theory || 0;

      if (record.status === "Passed") earnedCredits += credits;

      if (record.grade && gradePoints[record.grade] !== undefined) {
        const points = gradePoints[record.grade] * credits;
        groups[groupKey].termPoints += points;
        groups[groupKey].termCredits += credits;
        totalPoints += points;
        totalGradedCredits += credits;
      }
    });

    Object.values(groups).forEach((group) => {
      group.termGpa =
        group.termCredits > 0
          ? (group.termPoints / group.termCredits).toFixed(2)
          : "N/A";
    });

    return {
      groupedRecords: Object.values(groups),
      totalCredits: earnedCredits,
      cgpa:
        totalGradedCredits > 0
          ? (totalPoints / totalGradedCredits).toFixed(2)
          : "0.00",
    };
  }, [records]);

  if (isLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Adds a Native Back Button Header */}
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Transcripts & Results",
          headerShadowVisible: false,
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: "#eff6ff" }]}>
              <Award color="#2563eb" />
            </View>
            <View>
              <Text style={styles.statLabel}>CGPA</Text>
              <Text style={styles.statValue}>{cgpa}</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: "#f0fdf4" }]}>
              <BookOpen color="#16a34a" />
            </View>
            <View>
              <Text style={styles.statLabel}>Credits</Text>
              <Text style={styles.statValue}>{totalCredits}</Text>
            </View>
          </View>
        </View>

        {/* Semesters */}
        {groupedRecords.map((group, idx) => (
          <View key={idx} style={styles.semesterCard}>
            <View style={styles.semHeader}>
              <View>
                <Text style={styles.termName}>{group.term}</Text>
                <Text style={styles.semName}>Semester {group.semester}</Text>
              </View>
              <View style={styles.gpaBox}>
                <Text style={styles.gpaLabel}>TERM GPA</Text>
                <Text style={styles.gpaValue}>{group.termGpa}</Text>
              </View>
            </View>

            <View style={styles.courseList}>
              {group.courses.map((record) => (
                <View key={record._id} style={styles.courseRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.courseCode}>
                      {record.courseId?.code}
                    </Text>
                    <Text style={styles.courseTitle}>
                      {record.courseId?.title}
                    </Text>
                    <View style={styles.statusRow}>
                      {record.status === "Passed" ? (
                        <CheckCircle2 size={14} color="#16a34a" />
                      ) : record.status === "Failed" ? (
                        <XCircle size={14} color="#ef4444" />
                      ) : (
                        <Clock size={14} color="#ea580c" />
                      )}
                      <Text style={styles.statusText}>{record.status}</Text>
                    </View>
                  </View>
                  <View style={styles.gradeBox}>
                    <Text style={styles.gradeText}>{record.grade || "-"}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 16 },

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: { padding: 12, borderRadius: 12 },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  statValue: { fontSize: 24, fontWeight: "900", color: "#0f172a" },

  semesterCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  semHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  termName: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  semName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563eb",
    textTransform: "uppercase",
    marginTop: 2,
  },
  gpaBox: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  gpaLabel: { fontSize: 9, fontWeight: "800", color: "#64748b" },
  gpaValue: { fontSize: 16, fontWeight: "900", color: "#0f172a" },

  courseList: { padding: 16 },
  courseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  courseCode: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
    marginBottom: 2,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statusText: { fontSize: 11, fontWeight: "600", color: "#64748b" },
  gradeBox: {
    backgroundColor: "#f1f5f9",
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  gradeText: { fontSize: 16, fontWeight: "900", color: "#0f172a" },
});
