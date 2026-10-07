import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronRight,
  User,
  CalendarDays,
  Calendar,
  Award,
  FileSignature,
  BarChart3,
} from "lucide-react-native";

import {
  useGetMyTranscriptsQuery,
  useGetAnnouncementsQuery,
  useGetUpcomingEventsQuery,
} from "../../src/services/lmsApi";

// ✅ IMPORT NEI LOGO
import neiLogo from "../../assets/images/neilogo.png";

export default function DashboardScreen() {
  const user = useSelector((state) => state.auth.user);
  const router = useRouter();

  const { data: transcriptRes, isLoading: isTranscriptLoading } =
    useGetMyTranscriptsQuery();
  const { data: announceRes, isLoading: isAnnounceLoading } =
    useGetAnnouncementsQuery();
  const { data: eventsRes, isLoading: isEventsLoading } =
    useGetUpcomingEventsQuery();

  const announcements = announceRes?.data || [];
  const upcomingEvents = eventsRes?.data || [];

  // Calculate Dashboard Metrics
  const { currentCourses, totalCredits } = useMemo(() => {
    const records = transcriptRes?.data || [];
    let earnedCredits = 0;
    const active = records.filter((r) =>
      ["Registered", "In-Progress"].includes(r.status),
    );

    records.forEach((record) => {
      const credits = record.courseId?.creditHours?.theory || 0;
      if (record.status === "Passed") earnedCredits += credits;
    });

    return {
      currentCourses: active,
      totalCredits: earnedCredits,
    };
  }, [transcriptRes?.data]);

  if (isTranscriptLoading || isAnnounceLoading || isEventsLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10, color: "#64748b" }}>
          Loading dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20 }}
      >
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            {/* ✅ NEW: BRAND ROW (LOGO + BADGE) */}
            <View style={styles.brandRow}>
              <Image source={neiLogo} style={styles.neiLogo} />
              {/* Institution Badge */}
              <View style={styles.instituteBadge}>
                <Text style={styles.instituteText}>
                  National Excellence Institute
                </Text>
              </View>
            </View>

            {/* Greeting */}
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>
              {user?.name?.split(" ")[0] || "Student"}! 👋
            </Text>
          </View>

          {/* Profile Avatar */}
          <TouchableOpacity
            style={styles.profileAvatar}
            onPress={() => router.push("/(tabs)/profile")}
            activeOpacity={0.8}
          >
            {user?.profilePhoto ? (
              <Image
                source={{ uri: user.profilePhoto }}
                style={styles.avatarImage}
              />
            ) : (
              <User size={24} color="#2563eb" />
            )}
          </TouchableOpacity>
        </View>

        {/* --- SEMESTER OVERVIEW (Cleaned Up) --- */}
        <View style={styles.analyticsCard}>
          <View style={styles.analyticsHeader}>
            <BarChart3 size={20} color="#fff" />
            <Text style={styles.analyticsTitle}>Semester Overview</Text>
          </View>

          <View style={styles.analyticsBody}>
            {/* Credits & Courses Summary ONLY */}
            <View style={styles.miniStatsRow}>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatValue}>
                  {currentCourses.length}
                </Text>
                <Text style={styles.miniStatLabel}>Active Courses</Text>
              </View>
              <View style={styles.miniStatDivider} />
              <View style={styles.miniStat}>
                <Text style={styles.miniStatValue}>{totalCredits}</Text>
                <Text style={styles.miniStatLabel}>Credits Earned</Text>
              </View>
            </View>
          </View>
        </View>

        {/* --- QUICK LINKS --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.quickLinksGrid}>
            <TouchableOpacity
              style={styles.quickLinkCard}
              onPress={() => router.push("/timetable")}
            >
              <View
                style={[styles.quickLinkIcon, { backgroundColor: "#f0fdf4" }]}
              >
                <Calendar size={24} color="#16a34a" />
              </View>
              <Text style={styles.quickLinkText}>Timetable</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkCard}
              onPress={() => router.push("/datesheet")}
            >
              <View
                style={[styles.quickLinkIcon, { backgroundColor: "#fef2f2" }]}
              >
                <CalendarDays size={24} color="#ef4444" />
              </View>
              <Text style={styles.quickLinkText}>Date Sheet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickLinkCard}
              onPress={() => router.push("/transcripts")}
            >
              <View
                style={[styles.quickLinkIcon, { backgroundColor: "#eff6ff" }]}
              >
                <Award size={24} color="#2563eb" />
              </View>
              <Text style={styles.quickLinkText}>Transcripts</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickLinkCard}>
              <View
                style={[styles.quickLinkIcon, { backgroundColor: "#fdf4ff" }]}
              >
                <FileSignature size={24} color="#ca8a04" />
              </View>
              <Text style={styles.quickLinkText}>Registration</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- NOTICE BOARD --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notice Board</Text>
          {announcements.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No new announcements</Text>
            </View>
          ) : (
            announcements.map((announcement) => (
              <TouchableOpacity
                key={announcement._id || announcement.id}
                style={styles.noticeCard}
              >
                <View
                  style={[styles.noticeIcon, { backgroundColor: "#eff6ff" }]}
                >
                  <Bell size={20} color="#2563eb" />
                </View>
                <View style={styles.noticeContent}>
                  <Text style={styles.noticeTag}>
                    {announcement.type || "NOTICE"}
                  </Text>
                  <Text style={styles.noticeTitle}>{announcement.title}</Text>
                  {!!(announcement.body || announcement.summary) && (
                    <Text style={styles.noticeSummary} numberOfLines={3}>
                      {announcement.body || announcement.summary}
                    </Text>
                  )}
                  <Text style={styles.noticeDate}>
                    {new Date(
                      announcement.date || announcement.createdAt,
                    ).toLocaleDateString()}
                  </Text>
                </View>
                <ChevronRight size={20} color="#cbd5e1" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* --- UPCOMING EVENTS --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Schedule</Text>
          <View style={styles.eventsContainer}>
            {upcomingEvents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Your schedule is clear</Text>
              </View>
            ) : (
              upcomingEvents.map((event, index) => (
                <View key={event._id || event.id} style={styles.eventRow}>
                  <View
                    style={[
                      styles.eventDot,
                      index === 0 && styles.eventDotActive,
                    ]}
                  />
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTime}>
                      {new Date(event.time || event.date).toLocaleString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },

  // ✅ UPDATED HEADER STYLES
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingTop: 10,
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 16,
  },

  // ✅ NEW BRAND ROW STYLE
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  // ✅ NEW LOGO STYLE
  neiLogo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    marginRight: 5,
  },

  instituteBadge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  instituteText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#6a25eb",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: "600",
  },
  userName: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0f172a",
    marginTop: 2,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  /* Analytics Styles - Cleaned Up */
  analyticsCard: {
    backgroundColor: "#1e293b",
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: "#0f172a",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    overflow: "hidden",
  },
  analyticsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  analyticsTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  analyticsBody: { padding: 20, paddingTop: 10 },
  miniStatsRow: { flexDirection: "row", alignItems: "center" },
  miniStat: { flex: 1, alignItems: "center" },
  miniStatValue: { fontSize: 28, fontWeight: "900", color: "#fff" },
  miniStatLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 4,
  },
  miniStatDivider: { width: 1, height: 40, backgroundColor: "#334155" },

  /* Quick Links Styles */
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
  },
  quickLinksGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickLinkCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  quickLinkIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  quickLinkText: { fontSize: 13, fontWeight: "700", color: "#334155" },

  noticeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 1,
  },
  noticeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  noticeContent: { flex: 1 },
  noticeTag: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563eb",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  noticeSummary: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748b",
    marginBottom: 6,
  },
  noticeDate: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },

  eventsContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    elevation: 1,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#cbd5e1",
    marginTop: 5,
    marginRight: 12,
  },
  eventDotActive: {
    backgroundColor: "#ef4444",
    shadowColor: "#ef4444",
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  eventContent: {
    flex: 1,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  eventTime: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "700",
    marginBottom: 2,
  },
  eventTitle: { fontSize: 15, color: "#0f172a", fontWeight: "700" },
  emptyCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },
  emptyText: { color: "#94a3b8", fontWeight: "600", fontSize: 14 },
});
