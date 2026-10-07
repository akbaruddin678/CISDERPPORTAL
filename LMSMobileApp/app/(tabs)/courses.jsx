import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BookOpen,
  Video,
  FileText,
  UploadCloud,
  Clock,
  Download,
  Lock,
  CheckCircle,
} from "lucide-react-native";
import {
  useGetMyTranscriptsQuery,
  useGetCourseMaterialsQuery,
  useGetAvailableCoursesQuery,
  useRegisterCoursesMutation,
} from "../../src/services/lmsApi";

export default function ClassroomScreen() {
  const { data: transcriptRes, isLoading: coursesLoading } =
    useGetMyTranscriptsQuery();
  const enrolledRecords = useMemo(
    () => transcriptRes?.data?.filter((r) => ["Registered", "In-Progress"].includes(r.status)) || [],
    [transcriptRes],
  );

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState("materials");
  const [selectedElectives, setSelectedElectives] = useState([]);
  const { data: availableRes, isLoading: registrationLoading } = useGetAvailableCoursesQuery();
  const [registerCourses, { isLoading: isRegistering }] = useRegisterCoursesMutation();
  const registrationCourses = availableRes?.data || [];
  const pendingCourses = registrationCourses.filter((item) => !item.alreadyEnrolled);

  const confirmRegistration = async () => {
    try {
      const response = await registerCourses(selectedElectives).unwrap();
      const sections = response?.data?.allocations?.map((item) => `Section ${item.section}`).filter(Boolean);
      Alert.alert("Registration confirmed", sections?.length ? `You were placed into ${[...new Set(sections)].join(", ")}.` : response.message);
      setSelectedElectives([]);
    } catch (error) {
      Alert.alert("Registration could not be completed", error?.data?.message || "Please refresh and try again.");
    }
  };

  // Auto-select first course
  useEffect(() => {
    if (enrolledRecords.length > 0 && !selectedCourse) {
      setSelectedCourse(enrolledRecords[0].courseId);
    }
  }, [enrolledRecords, selectedCourse]);

  const { data: materialsRes, isLoading: materialsLoading } =
    useGetCourseMaterialsQuery(selectedCourse?._id, {
      skip: !selectedCourse?._id,
    });

  const materials = materialsRes?.data || [];
  const lectures = materials.filter(
    (m) => m.type === "video" || m.type === "pdf",
  );
  const assignments = materials.filter((m) => m.type === "assignment");
  const announcements = materials.filter((m) => m.type === "announcement");

  if (coursesLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (enrolledRecords.length === 0 && pendingCourses.length === 0 && !registrationLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <BookOpen size={48} color="#cbd5e1" />
        <Text style={styles.emptyTitle}>No Active Courses</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Text style={styles.pageTitle}>My Classroom</Text>

      {(registrationLoading || pendingCourses.length > 0) && (
        <View style={styles.registrationPanel}>
          <View style={styles.registrationHeader}>
            <View>
              <Text style={styles.registrationTitle}>Semester registration</Text>
              <Text style={styles.registrationHint}>{availableRes?.registrationPolicy?.message || "Loading your eligible courses…"}</Text>
            </View>
            {registrationLoading && <ActivityIndicator color="#2563eb" />}
          </View>
          {!registrationLoading && pendingCourses.map((item) => {
            const isElective = item.courseType === "ELECTIVE";
            const selected = selectedElectives.includes(item.courseId);
            return (
              <TouchableOpacity
                key={item.courseId}
                disabled={item.isLocked || !isElective}
                onPress={() => setSelectedElectives((current) => selected ? current.filter((courseId) => courseId !== item.courseId) : [...current, item.courseId])}
                style={[styles.registrationCourse, item.isLocked && styles.registrationCourseLocked]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.registrationCourseTitle}>{item.course?.code} · {item.course?.title}</Text>
                  <Text style={styles.registrationCourseMeta}>
                    {item.courseType === "RETAKE" ? "Required retake" : item.courseType === "MANDATORY" ? "Mandatory" : "Elective"}
                    {item.sections?.[0] ? ` · ${item.sections[0].seatsRemaining} seats available next` : ""}
                  </Text>
                  {item.lockReason ? <Text style={styles.lockReason}>{item.lockReason}</Text> : null}
                </View>
                {item.isLocked ? <Lock size={18} color="#94a3b8" /> : isElective ? <View style={[styles.selectDot, selected && styles.selectDotActive]} /> : <CheckCircle size={18} color="#16a34a" />}
              </TouchableOpacity>
            );
          })}
          {!registrationLoading && pendingCourses.some((item) => !item.isLocked) && (
            <TouchableOpacity disabled={isRegistering} onPress={confirmRegistration} style={styles.confirmButton}>
              {isRegistering ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>Confirm eligible courses</Text>}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Horizontal Course Selector */}
      <View style={styles.courseSelector}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {enrolledRecords.map((record) => {
            const isSelected = selectedCourse?._id === record.courseId._id;
            return (
              <TouchableOpacity
                key={record._id}
                onPress={() => setSelectedCourse(record.courseId)}
                style={[
                  styles.courseChip,
                  isSelected && styles.courseChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.courseChipCode,
                    isSelected && { color: "#fff" },
                  ]}
                >
                  {record.courseId.code}
                </Text>
                <Text
                  style={[
                    styles.courseChipTitle,
                    isSelected && { color: "#fff" },
                  ]}
                  numberOfLines={1}
                >
                  {record.courseId.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      {selectedCourse && (
        <View style={styles.contentArea}>
          {/* Header Banner */}
          <View style={styles.courseBanner}>
            <Text style={styles.bannerCode}>{selectedCourse.code}</Text>
            <Text style={styles.bannerTitle}>{selectedCourse.title}</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabsRow}>
            {["materials", "assignments", "announcements"].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabBtn,
                  activeTab === tab && styles.tabBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dynamic Content */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {materialsLoading ? (
              <ActivityIndicator
                size="large"
                color="#2563eb"
                style={{ marginTop: 40 }}
              />
            ) : (
              <>
                {/* MATERIALS */}
                {activeTab === "materials" && (
                  <View style={styles.list}>
                    {lectures.length === 0 ? (
                      <Text style={styles.emptyText}>
                        No materials uploaded yet.
                      </Text>
                    ) : (
                      lectures.map((mat) => (
                        <View key={mat._id} style={styles.card}>
                          <View style={styles.cardIcon}>
                            {mat.type === "video" ? (
                              <Video color="#ef4444" />
                            ) : (
                              <FileText color="#f97316" />
                            )}
                          </View>
                          <View style={styles.cardInfo}>
                            <Text style={styles.cardTitle}>{mat.title}</Text>
                            <Text style={styles.cardDate}>
                              {new Date(mat.createdAt).toLocaleDateString()}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => Linking.openURL(mat.fileUrl)}
                            style={styles.downloadBtn}
                          >
                            <Download size={20} color="#2563eb" />
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </View>
                )}

                {/* ASSIGNMENTS */}
                {activeTab === "assignments" && (
                  <View style={styles.list}>
                    {assignments.length === 0 ? (
                      <Text style={styles.emptyText}>
                        No pending assignments.
                      </Text>
                    ) : (
                      assignments.map((task) => (
                        <View key={task._id} style={styles.card}>
                          <View style={styles.cardInfo}>
                            <Text style={styles.cardTitle}>{task.title}</Text>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginTop: 4,
                              }}
                            >
                              <Clock size={12} color="#ef4444" />
                              <Text style={styles.dueText}>
                                {" "}
                                Due:{" "}
                                {new Date(task.dueDate).toLocaleDateString()}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity style={styles.submitBtn}>
                            <UploadCloud size={16} color="#fff" />
                            <Text style={styles.submitBtnText}>Submit</Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </View>
                )}

                {/* ANNOUNCEMENTS */}
                {activeTab === "announcements" && (
                  <View style={styles.list}>
                    {announcements.length === 0 ? (
                      <Text style={styles.emptyText}>No announcements.</Text>
                    ) : (
                      announcements.map((ann) => (
                        <View
                          key={ann._id}
                          style={[
                            styles.card,
                            {
                              backgroundColor: "#fefce8",
                              borderColor: "#fef08a",
                            },
                          ]}
                        >
                          <View style={styles.cardInfo}>
                            <Text style={styles.cardTitle}>{ann.title}</Text>
                            <Text style={styles.cardDate}>
                              {ann.description}
                            </Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  pageTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0f172a",
    marginHorizontal: 20,
    marginBottom: 16,
  },
  registrationPanel: { marginHorizontal: 20, marginBottom: 18, padding: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: "#dbeafe", borderRadius: 16 },
  registrationHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  registrationTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  registrationHint: { maxWidth: 290, marginTop: 3, fontSize: 11, lineHeight: 16, color: "#64748b" },
  registrationCourse: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  registrationCourseLocked: { opacity: 0.65 },
  registrationCourseTitle: { fontSize: 13, fontWeight: "700", color: "#1e293b" },
  registrationCourseMeta: { marginTop: 3, fontSize: 11, fontWeight: "600", color: "#64748b" },
  lockReason: { marginTop: 3, fontSize: 11, color: "#b45309" },
  selectDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#94a3b8" },
  selectDotActive: { borderWidth: 5, borderColor: "#2563eb" },
  confirmButton: { marginTop: 12, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#2563eb" },
  confirmButtonText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 12,
  },

  courseSelector: { height: 80, marginBottom: 10 },
  courseChip: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    width: 160,
    justifyContent: "center",
  },
  courseChipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  courseChipCode: { fontSize: 12, fontWeight: "800", color: "#64748b" },
  courseChipTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 2,
  },

  contentArea: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    elevation: 5,
  },
  courseBanner: {
    backgroundColor: "#0f172a",
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bannerCode: {
    color: "#93c5fd",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 4,
  },

  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: { borderBottomColor: "#2563eb" },
  tabText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  tabTextActive: { color: "#2563eb" },

  scrollContent: { padding: 20, paddingBottom: 20 },
  list: { gap: 12 },
  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: 20,
    fontWeight: "600",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 16,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  cardDate: { fontSize: 12, color: "#64748b" },
  dueText: { fontSize: 12, color: "#ef4444", fontWeight: "600", marginLeft: 4 },

  downloadBtn: { padding: 8, backgroundColor: "#eff6ff", borderRadius: 8 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitBtnText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
});
