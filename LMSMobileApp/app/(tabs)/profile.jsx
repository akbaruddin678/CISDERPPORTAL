import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Mail,
  Hash,
  BookOpen,
  KeyRound,
  LogOut,
} from "lucide-react-native";
import { logout } from "../../src/store/authSlice";
import * as SecureStore from "expo-secure-store";

export default function ProfileScreen() {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword)
      return Alert.alert("Error", "New passwords do not match.");
    if (newPassword.length < 8)
      return Alert.alert("Error", "Password must be at least 8 characters.");

    setIsLoading(true);
    try {
      const response = await fetch(
        "http://10.0.2.2:5000/api/lms/auth/update-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        },
      );

      if (!response.ok) throw new Error("Failed to update password");

      Alert.alert("Success", "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Student Profile</Text>

        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <User size={40} color="#2563eb" />
          </View>
          <Text style={styles.userName}>{user?.name || "Student Name"}</Text>
          <Text style={styles.userProgram}>
            {user?.program || "Enrolled Program"}
          </Text>

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Hash size={20} color="#64748b" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Roll Number</Text>
                <Text style={styles.infoValue}>
                  {user?.rollNumber || "N/A"}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Mail size={20} color="#64748b" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email || "N/A"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <KeyRound size={24} color="#0f172a" />
            <Text style={styles.cardTitle}>Change Password</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Current Password"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="New Password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm New Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={handlePasswordUpdate}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnPrimaryText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.btnLogoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { padding: 20 },
  pageTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: "#0f172a",
  },
  userProgram: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    color: "#64748b",
    marginBottom: 20,
  },
  infoList: { borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  infoTextContainer: { marginLeft: 12 },
  infoLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  infoValue: { fontSize: 16, fontWeight: "600", color: "#334155" },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
  },
  btnPrimary: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  btnLogout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    backgroundColor: "#fef2f2",
    borderRadius: 12,
  },
  btnLogoutText: { color: "#ef4444", fontWeight: "bold", fontSize: 16 },
});
