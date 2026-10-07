import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  ImageBackground,
} from "react-native";
import { useDispatch } from "react-redux";
import { Eye, EyeOff, Loader2 } from "lucide-react-native";
import {
  setCredentials,
  useStudentLoginMutation,
} from "../src/store/authSlice";
import { useRouter } from "expo-router";

// ✅ IMPORT ASSETS
import neiLogo from "../assets/images/neilogo.png";
import neiBg from "../assets/images/onelink.png";

export default function WelcomeLoginScreen() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const dispatch = useDispatch();
  const router = useRouter();
  const [login, { isLoading: loginLoading }] = useStudentLoginMutation();

  const handleSubmit = async () => {
    setErrorMsg("");
    if (!identifier || !password) {
      setErrorMsg("Please enter both your Roll Number and Password.");
      return;
    }

    try {
      const response = await login({ identifier, password }).unwrap();
      dispatch(
        setCredentials({
          user: response.user,
          token: response.token,
        }),
      );
      // AuthGuard in _layout.jsx will handle the redirect
    } catch (error) {
      setErrorMsg(error?.data?.message || "Invalid credentials");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleContactAdmin = () => {
    Alert.alert(
      "Contact Administration",
      "Please contact the IT Helpdesk or your batch advisor to reset your password.",
      [{ text: "OK", style: "default" }],
    );
  };

  return (
    <ImageBackground
      source={neiBg}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* Dark Overlay for readability */}
      <View style={styles.darkOverlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* --- LOGIN BOX --- */}
          <View style={styles.card}>
            {/* Mobile Header / Logo */}
            <View style={styles.mobileHeader}>
              <View style={styles.logoBox}>
                <Image source={neiLogo} style={styles.logoImage} />
              </View>
              <View>
                <Text style={styles.mobileHeaderTitle}>NEI STUDENT PORTAL</Text>
                <Text style={styles.mobileHeaderSub}>
                  National Excellence Institute
                </Text>
              </View>
            </View>

            {/* Form Header */}
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                National Excellence Institute
              </Text>
              <Text style={styles.formSubtitle}>
                Sign in to your student account
              </Text>
            </View>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Inputs */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address or Roll Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. FA23-BCS-001"
                  placeholderTextColor="#9ca3af"
                  value={identifier}
                  onChangeText={(text) => {
                    setIdentifier(text);
                    setErrorMsg("");
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setErrorMsg("");
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={togglePasswordVisibility}
                    style={styles.eyeIcon}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#9ca3af" />
                    ) : (
                      <Eye size={20} color="#9ca3af" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Primary Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loginLoading}
                activeOpacity={0.8}
              >
                {loginLoading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text style={styles.submitButtonText}>Signing in...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <View style={styles.dividerTextContainer}>
                  <Text style={styles.dividerText}>
                    HAVING TROUBLE LOGGING IN?
                  </Text>
                </View>
              </View>

              {/* Contact Admin Button */}
              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleContactAdmin}
                activeOpacity={0.7}
              >
                <Text style={styles.contactButtonText}>
                  Contact Administration
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer Links */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By continuing, you agree to our{" "}
                <Text
                  style={styles.linkText}
                  onPress={() => Alert.alert("Terms", "Terms of Service")}
                >
                  Terms of Service
                </Text>{" "}
                and{" "}
                <Text
                  style={styles.linkText}
                  onPress={() => Alert.alert("Privacy", "Privacy Policy")}
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Darkens the background for contrast
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  // Card Container
  card: {
    width: "100%",
    maxWidth: 450,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },

  // Mobile Header (Logo & NEI Text)
  mobileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    gap: 12,
  },
  logoBox: {
    width: 44,
    height: 44,
    backgroundColor: "#f3f1f1",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: 26,
    height: 26,
    resizeMode: "contain",
  },
  mobileHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2937",
  },
  mobileHeaderSub: {
    fontSize: 11,
    color: "#4b5563",
    fontWeight: "500",
  },

  // Form Headers
  formHeader: {
    alignItems: "center",
    marginBottom: 28,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 15,
    color: "#4b5563",
  },

  // Error Box
  errorBox: {
    backgroundColor: "#fef2f2",
    borderColor: "#fee2e2",
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  // Form Inputs
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1f2937",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1f2937",
  },
  eyeIcon: {
    padding: 14,
  },

  // Submit Button
  submitButton: {
    backgroundColor: "#616161",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#616161",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  // Divider
  dividerContainer: {
    position: "relative",
    marginVertical: 28,
    alignItems: "center",
  },
  dividerLine: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  dividerTextContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
    letterSpacing: 0.5,
  },

  // Contact Button
  contactButton: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  contactButtonText: {
    color: "#4b5563",
    fontSize: 15,
    fontWeight: "600",
  },

  // Footer
  footer: {
    marginTop: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
  },
  linkText: {
    color: "#616161",
    fontWeight: "600",
  },
});
